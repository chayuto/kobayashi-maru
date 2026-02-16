/**
 * Tests for Adaptive Music Manager
 * Verifies stem generation, intensity calculation, crossfade logic, and lifecycle
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MusicManager, MusicContext } from '../audio/MusicManager';
import { AudioManager } from '../audio/AudioManager';

// Mock AUDIO_CONFIG
vi.mock('../config/audio.config', () => ({
    AUDIO_CONFIG: {
        CONCURRENCY: { WEAPONS: 3, COMBAT: 2, UI: 4, AMBIENT: 2 },
        CATEGORIES: {
            WEAPONS: ['phaser_fire'],
            COMBAT: ['explosion_small'],
            UI: ['turret_place'],
            AMBIENT: ['wave_start'],
        },
        MUSIC: {
            ENABLED: true,
            VOLUME: 0.25,
            SMOOTHING_RATE: 2.0,
            GAIN_RAMP_TIME: 0.15,
            STEM_DURATIONS: {
                AMBIENT: 4.0,
                BUILD: 2.0,
                COMBAT: 2.0,
                CRITICAL: 1.0,
            },
            STEM_THRESHOLDS: {
                BUILD_START: 0.15,
                BUILD_FULL: 0.40,
                COMBAT_START: 0.40,
                COMBAT_FULL: 0.65,
                CRITICAL_START: 0.70,
                CRITICAL_FULL: 0.90,
            },
            INTENSITY_WEIGHTS: {
                ACTIVE_ENEMIES: 0.3,
                HULL_DAMAGE: 0.3,
                BOSS_WAVE: 0.2,
                DPS: 0.2,
            },
            INTENSITY_NORMALIZERS: {
                MAX_ENEMIES: 20,
                MAX_DPS: 100,
            },
        },
    },
}));

// Web Audio API mock helpers
function createMockGainNode() {
    return {
        gain: {
            value: 0,
            linearRampToValueAtTime: vi.fn(),
        },
        connect: vi.fn(),
        disconnect: vi.fn(),
    };
}

function createMockBufferSource() {
    return {
        buffer: null as AudioBuffer | null,
        loop: false,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
        disconnect: vi.fn(),
    };
}

function createMockAudioContext() {
    return {
        sampleRate: 44100,
        currentTime: 0,
        createGain: vi.fn(() => createMockGainNode()),
        createBuffer: vi.fn((_channels: number, length: number, sampleRate: number) => ({
            getChannelData: vi.fn(() => new Float32Array(length)),
            length,
            sampleRate,
            duration: length / sampleRate,
            numberOfChannels: 1,
        })),
        createBufferSource: vi.fn(() => createMockBufferSource()),
        destination: {},
        state: 'running',
        resume: vi.fn().mockResolvedValue(undefined),
    };
}

describe('MusicManager', () => {
    let musicManager: MusicManager;
    let audioManager: AudioManager;
    let mockCtx: ReturnType<typeof createMockAudioContext>;
    let mockMusicGain: ReturnType<typeof createMockGainNode>;

    beforeEach(() => {
        vi.clearAllMocks();

        mockCtx = createMockAudioContext();
        mockMusicGain = createMockGainNode();

        // Create AudioManager singleton
        // @ts-expect-error - Reset singleton for testing
        AudioManager.instance = undefined;

        // Mock AudioContext global
        Object.defineProperty(window, 'AudioContext', {
            writable: true,
            value: vi.fn(() => mockCtx),
        });

        audioManager = AudioManager.getInstance();
        audioManager.init();

        // Override private fields for controlled testing
        // @ts-expect-error - Access private for testing
        audioManager.audioContext = mockCtx;
        // @ts-expect-error - Access private for testing
        audioManager.musicGain = mockMusicGain;
        // @ts-expect-error - Access private for testing
        audioManager.initialized = true;

        musicManager = new MusicManager(audioManager);
    });

    afterEach(() => {
        musicManager.destroy();
        vi.clearAllMocks();
    });

    // =========================================================================
    // INITIALIZATION
    // =========================================================================

    describe('init', () => {
        it('should generate 4 audio buffers for stems', () => {
            musicManager.init();

            // createBuffer should be called for each stem
            // (plus any from AudioManager.init, so check at minimum 4 for music)
            const musicBufferCalls = mockCtx.createBuffer.mock.calls.filter(
                (call: [number, number, number]) => {
                    const length = call[1];
                    const sampleRate = call[2];
                    const duration = length / sampleRate;
                    return duration >= 1.0; // Music stems are 1-4 seconds
                }
            );
            expect(musicBufferCalls.length).toBe(4);
        });

        it('should create buffers with correct durations', () => {
            musicManager.init();

            const durations = mockCtx.createBuffer.mock.calls
                .filter((call: [number, number, number]) => call[1] / call[2] >= 1.0)
                .map((call: [number, number, number]) => call[1] / call[2]);

            // Sort durations for consistent comparison
            durations.sort((a: number, b: number) => a - b);
            expect(durations).toEqual([1.0, 2.0, 2.0, 4.0]);
        });

        it('should not crash if audio context is not available', () => {
            // @ts-expect-error - Access private for testing
            audioManager.audioContext = null;

            expect(() => musicManager.init()).not.toThrow();
        });
    });

    // =========================================================================
    // START / STOP LIFECYCLE
    // =========================================================================

    describe('start', () => {
        beforeEach(() => {
            musicManager.init();
        });

        it('should create gain nodes and buffer sources for each stem', () => {
            musicManager.start();

            // 4 stems × 1 gain + 4 stems × 1 source
            expect(mockCtx.createGain).toHaveBeenCalled();
            expect(mockCtx.createBufferSource).toHaveBeenCalledTimes(4);
        });

        it('should set loop=true on all sources', () => {
            musicManager.start();

            for (const call of mockCtx.createBufferSource.mock.results) {
                expect(call.value.loop).toBe(true);
            }
        });

        it('should start all sources', () => {
            musicManager.start();

            for (const call of mockCtx.createBufferSource.mock.results) {
                expect(call.value.start).toHaveBeenCalled();
            }
        });

        it('should connect sources through gain nodes to music gain', () => {
            musicManager.start();

            // Each source connects to its gain, each gain connects to musicGain
            const gainResults = mockCtx.createGain.mock.results as Array<{ value: ReturnType<typeof createMockGainNode> }>;
            const gainNodes = gainResults.map(r => r.value);
            // Filter to only music-related gain nodes (those that connected to mockMusicGain)
            const musicGainNodes = gainNodes.filter(
                g => (g.connect.mock.calls as unknown[][]).some(call => call[0] === mockMusicGain)
            );
            expect(musicGainNodes.length).toBe(4);
        });

        it('should set ambient gain to VOLUME and others to 0', () => {
            musicManager.start();

            // The gain nodes created after init (during start) are the stem gains
            const gainResults = mockCtx.createGain.mock.results as Array<{ value: ReturnType<typeof createMockGainNode> }>;
            const stemGains = gainResults
                .map(r => r.value)
                .filter(g => (g.connect.mock.calls as unknown[][]).some(c => c[0] === mockMusicGain));

            // One should be VOLUME (ambient), three should be 0
            const initialValues = stemGains.map(g => g.gain.value);
            expect(initialValues.filter((v: number) => v === 0.25).length).toBe(1);
            expect(initialValues.filter((v: number) => v === 0).length).toBe(3);
        });

        it('should set isPlaying to true', () => {
            musicManager.start();
            expect(musicManager.isPlaying()).toBe(true);
        });

        it('should not start twice', () => {
            musicManager.start();
            const callCount = mockCtx.createBufferSource.mock.calls.length;
            musicManager.start();
            expect(mockCtx.createBufferSource.mock.calls.length).toBe(callCount);
        });

        it('should not start if audio context is unavailable', () => {
            // Simulate no audio context (which happens when music can't init)
            // @ts-expect-error - Access private for testing
            audioManager.audioContext = null;

            const mm = new MusicManager(audioManager);
            mm.init(); // Should no-op with null context
            mm.start(); // Should no-op with null context
            expect(mm.isPlaying()).toBe(false);
        });
    });

    describe('stop', () => {
        beforeEach(() => {
            musicManager.init();
            musicManager.start();
        });

        it('should stop all sources', () => {
            musicManager.stop();

            for (const call of mockCtx.createBufferSource.mock.results) {
                expect(call.value.stop).toHaveBeenCalled();
            }
        });

        it('should disconnect all nodes', () => {
            musicManager.stop();

            for (const call of mockCtx.createBufferSource.mock.results) {
                expect(call.value.disconnect).toHaveBeenCalled();
            }
        });

        it('should set isPlaying to false', () => {
            musicManager.stop();
            expect(musicManager.isPlaying()).toBe(false);
        });

        it('should reset smoothed intensity to 0', () => {
            // First drive intensity up
            musicManager.update(
                { activeEnemies: 20, hullPercent: 0, isBossWave: true, dps: 100 },
                1.0
            );
            expect(musicManager.getIntensity()).toBeGreaterThan(0);

            musicManager.stop();
            expect(musicManager.getIntensity()).toBe(0);
        });

        it('should be safe to call stop when not playing', () => {
            musicManager.stop();
            expect(() => musicManager.stop()).not.toThrow();
        });
    });

    // =========================================================================
    // INTENSITY CALCULATION
    // =========================================================================

    describe('intensity calculation', () => {
        beforeEach(() => {
            musicManager.init();
            musicManager.start();
        });

        it('should return 0 intensity when no threats exist', () => {
            const context: MusicContext = {
                activeEnemies: 0,
                hullPercent: 1.0,
                isBossWave: false,
                dps: 0,
            };

            // Update with large deltaTime for immediate convergence
            musicManager.update(context, 10.0);
            expect(musicManager.getIntensity()).toBeCloseTo(0, 1);
        });

        it('should return max intensity when all factors are maxed', () => {
            const context: MusicContext = {
                activeEnemies: 20,
                hullPercent: 0,
                isBossWave: true,
                dps: 100,
            };

            musicManager.update(context, 10.0);
            expect(musicManager.getIntensity()).toBeCloseTo(1.0, 1);
        });

        it('should scale intensity with active enemies', () => {
            const half: MusicContext = {
                activeEnemies: 10,
                hullPercent: 1.0,
                isBossWave: false,
                dps: 0,
            };

            musicManager.update(half, 10.0);
            // 0.3 * (10/20) = 0.15
            expect(musicManager.getIntensity()).toBeCloseTo(0.15, 1);
        });

        it('should scale intensity with hull damage', () => {
            const damaged: MusicContext = {
                activeEnemies: 0,
                hullPercent: 0.5,
                isBossWave: false,
                dps: 0,
            };

            musicManager.update(damaged, 10.0);
            // 0.3 * (1 - 0.5) = 0.15
            expect(musicManager.getIntensity()).toBeCloseTo(0.15, 1);
        });

        it('should increase intensity for boss waves', () => {
            const boss: MusicContext = {
                activeEnemies: 0,
                hullPercent: 1.0,
                isBossWave: true,
                dps: 0,
            };

            musicManager.update(boss, 10.0);
            // 0.2 * 1 = 0.2
            expect(musicManager.getIntensity()).toBeCloseTo(0.2, 1);
        });

        it('should scale intensity with DPS', () => {
            const highDPS: MusicContext = {
                activeEnemies: 0,
                hullPercent: 1.0,
                isBossWave: false,
                dps: 50,
            };

            musicManager.update(highDPS, 10.0);
            // 0.2 * (50/100) = 0.1
            expect(musicManager.getIntensity()).toBeCloseTo(0.1, 1);
        });

        it('should clamp intensity to [0, 1]', () => {
            const extreme: MusicContext = {
                activeEnemies: 100,
                hullPercent: 0,
                isBossWave: true,
                dps: 500,
            };

            musicManager.update(extreme, 10.0);
            expect(musicManager.getIntensity()).toBeLessThanOrEqual(1.0);
            expect(musicManager.getIntensity()).toBeGreaterThanOrEqual(0);
        });

        it('should clamp enemies and DPS factors at their normalizer values', () => {
            const context1: MusicContext = {
                activeEnemies: 40, // 2x the normalizer
                hullPercent: 1.0,
                isBossWave: false,
                dps: 0,
            };

            musicManager.update(context1, 10.0);
            // Should be same as 20 enemies since clamped
            const intensity1 = musicManager.getIntensity();

            // Reset
            musicManager.stop();
            musicManager.start();

            const context2: MusicContext = {
                activeEnemies: 20,
                hullPercent: 1.0,
                isBossWave: false,
                dps: 0,
            };

            musicManager.update(context2, 10.0);
            expect(musicManager.getIntensity()).toBeCloseTo(intensity1, 2);
        });
    });

    // =========================================================================
    // SMOOTHING
    // =========================================================================

    describe('intensity smoothing', () => {
        beforeEach(() => {
            musicManager.init();
            musicManager.start();
        });

        it('should smooth intensity over time rather than jumping', () => {
            const calm: MusicContext = {
                activeEnemies: 0,
                hullPercent: 1.0,
                isBossWave: false,
                dps: 0,
            };
            const intense: MusicContext = {
                activeEnemies: 20,
                hullPercent: 0,
                isBossWave: true,
                dps: 100,
            };

            // Start calm
            musicManager.update(calm, 10.0);
            expect(musicManager.getIntensity()).toBeCloseTo(0, 1);

            // Sudden spike - with small deltaTime, smoothing prevents jump
            musicManager.update(intense, 0.016);
            const afterOneFrame = musicManager.getIntensity();
            expect(afterOneFrame).toBeGreaterThan(0);
            expect(afterOneFrame).toBeLessThan(0.5); // Shouldn't jump to 1.0
        });

        it('should converge to target intensity over multiple updates', () => {
            const target: MusicContext = {
                activeEnemies: 10,
                hullPercent: 0.5,
                isBossWave: false,
                dps: 50,
            };
            // Expected: 0.3*(10/20) + 0.3*(1-0.5) + 0.2*0 + 0.2*(50/100) = 0.15 + 0.15 + 0 + 0.1 = 0.4

            // Converge with many small steps
            for (let i = 0; i < 100; i++) {
                musicManager.update(target, 0.1);
            }

            expect(musicManager.getIntensity()).toBeCloseTo(0.4, 1);
        });
    });

    // =========================================================================
    // GAIN CROSSFADING
    // =========================================================================

    describe('stem gain crossfading', () => {
        let stemGains: ReturnType<typeof createMockGainNode>[];

        beforeEach(() => {
            musicManager.init();
            musicManager.start();

            // Collect the 4 stem gain nodes (those connected to mockMusicGain)
            const gainResults = mockCtx.createGain.mock.results as Array<{ value: ReturnType<typeof createMockGainNode> }>;
            stemGains = gainResults
                .map(r => r.value)
                .filter(g => (g.connect.mock.calls as unknown[][]).some(c => c[0] === mockMusicGain));
        });

        it('should call linearRampToValueAtTime on gain nodes during update', () => {
            musicManager.update(
                { activeEnemies: 10, hullPercent: 0.5, isBossWave: false, dps: 50 },
                0.1
            );

            // All 4 stem gains should have ramp calls
            for (const gain of stemGains) {
                expect(gain.gain.linearRampToValueAtTime).toHaveBeenCalled();
            }
        });

        it('should set ambient gain higher than 0 even at full intensity', () => {
            musicManager.update(
                { activeEnemies: 20, hullPercent: 0, isBossWave: true, dps: 100 },
                10.0
            );

            // Find ambient gain (the one with initial value 0.25)
            const ambientGain = stemGains.find(g => g.gain.value === 0.25);
            if (ambientGain) {
                const calls = ambientGain.gain.linearRampToValueAtTime.mock.calls;
                const lastCall = calls[calls.length - 1];
                // At intensity 1.0: volume * (1 - 1.0 * 0.3) = 0.25 * 0.7 = 0.175
                expect(lastCall[0]).toBeGreaterThan(0);
            }
        });

        it('should not update gains when not playing', () => {
            musicManager.stop();

            musicManager.update(
                { activeEnemies: 10, hullPercent: 0.5, isBossWave: false, dps: 50 },
                0.1
            );

            // After stop, no more ramp calls should happen
            // (clear the mocks first to check post-stop behavior)
            for (const gain of stemGains) {
                const callsBeforeStop = gain.gain.linearRampToValueAtTime.mock.calls.length;
                musicManager.update(
                    { activeEnemies: 10, hullPercent: 0.5, isBossWave: false, dps: 50 },
                    0.1
                );
                expect(gain.gain.linearRampToValueAtTime.mock.calls.length).toBe(callsBeforeStop);
            }
        });
    });

    // =========================================================================
    // DESTROY
    // =========================================================================

    describe('destroy', () => {
        it('should stop all sources and clear stems', () => {
            musicManager.init();
            musicManager.start();
            musicManager.destroy();

            expect(musicManager.isPlaying()).toBe(false);
        });

        it('should be safe to call destroy when not initialized', () => {
            expect(() => musicManager.destroy()).not.toThrow();
        });

        it('should be safe to call destroy when already destroyed', () => {
            musicManager.init();
            musicManager.start();
            musicManager.destroy();
            expect(() => musicManager.destroy()).not.toThrow();
        });
    });

    // =========================================================================
    // EDGE CASES
    // =========================================================================

    describe('edge cases', () => {
        it('should handle null audio context gracefully in update', () => {
            musicManager.init();
            musicManager.start();

            // Simulate audio context becoming null (e.g., browser cleanup)
            // @ts-expect-error - Access private for testing
            audioManager.audioContext = null;

            expect(() =>
                musicManager.update(
                    { activeEnemies: 5, hullPercent: 0.8, isBossWave: false, dps: 20 },
                    0.016
                )
            ).not.toThrow();
        });

        it('should handle zero deltaTime without NaN', () => {
            musicManager.init();
            musicManager.start();

            musicManager.update(
                { activeEnemies: 5, hullPercent: 0.8, isBossWave: false, dps: 20 },
                0
            );

            expect(Number.isNaN(musicManager.getIntensity())).toBe(false);
        });

        it('should handle negative hull percent', () => {
            musicManager.init();
            musicManager.start();

            expect(() =>
                musicManager.update(
                    { activeEnemies: 0, hullPercent: -0.1, isBossWave: false, dps: 0 },
                    0.1
                )
            ).not.toThrow();

            // Intensity should be clamped
            expect(musicManager.getIntensity()).toBeGreaterThanOrEqual(0);
            expect(musicManager.getIntensity()).toBeLessThanOrEqual(1);
        });
    });
});
