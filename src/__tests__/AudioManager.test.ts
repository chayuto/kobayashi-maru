/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager } from '../audio/AudioManager';
import { SoundType } from '../audio/types';

// Mock Web Audio API
const mockAudioContext = {
    createGain: vi.fn(() => ({
        gain: { value: 0 },
        connect: vi.fn(),
    })),
    createBuffer: vi.fn(() => ({
        getChannelData: vi.fn(() => new Float32Array(100)),
    })),
    createBufferSource: vi.fn(() => ({
        buffer: null,
        playbackRate: { value: 1 },
        loop: false,
        onended: null as (() => void) | null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
    })),
    destination: {},
    state: 'suspended',
    resume: vi.fn().mockResolvedValue(undefined),
    sampleRate: 44100,
};

// Mock window.AudioContext
// These global mocks will be set up in beforeEach to ensure consistency for each test
// vi.stubGlobal('AudioContext', vi.fn(() => mockAudioContext));
// vi.stubGlobal('webkitAudioContext', vi.fn(() => mockAudioContext));

// Also set it on the window object explicitly for jsdom
// Object.defineProperty(window, 'AudioContext', {
//     writable: true,
//     value: vi.fn(() => mockAudioContext)
// });
// Object.defineProperty(window, 'webkitAudioContext', {
//     writable: true,
//     value: vi.fn(() => mockAudioContext)
// });

describe('AudioManager', () => {
    let audioManager: AudioManager;
    let mockAudioContextConstructor: () => void;

    beforeEach(() => {
        // Setup mock constructor spy
        mockAudioContextConstructor = vi.fn();

        // Create a class that calls the spy
        class MockAudioContext {
            constructor() {
                mockAudioContextConstructor();
                return mockAudioContext;
            }
        }

        // Set it on the global object
        // @ts-expect-error - Mocking global
        globalThis.AudioContext = MockAudioContext;
        // @ts-expect-error - Mocking global
        globalThis.webkitAudioContext = MockAudioContext;

        // Also set it on the window object explicitly for jsdom
        Object.defineProperty(window, 'AudioContext', {
            writable: true,
            value: MockAudioContext
        });
        Object.defineProperty(window, 'webkitAudioContext', {
            writable: true,
            value: MockAudioContext
        });

        // Reset singleton instance (hacky but needed for testing singleton)
        // @ts-expect-error - Access private property for testing
        AudioManager.instance = undefined;
        audioManager = AudioManager.getInstance();

        // Ensure mocks are clear
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should be a singleton', () => {
        const instance1 = AudioManager.getInstance();
        const instance2 = AudioManager.getInstance();
        expect(instance1).toBe(instance2);
    });

    it('should initialize correctly', () => {
        audioManager.init();
        expect(mockAudioContextConstructor).toHaveBeenCalled();
        expect(mockAudioContext.createGain).toHaveBeenCalledTimes(3); // Master, SFX, Music
    });

    it('should generate sounds on initialization', () => {
        audioManager.init();
        // Check if createBuffer was called for each sound type
        // We have 16 sound types defined in the enum
        expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });

    it('should play a sound', () => {
        audioManager.init();
        // @ts-expect-error - Access private property for testing
        audioManager.enabled = true;

        audioManager.play(SoundType.PHASER_FIRE);

        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('should not play sound if muted (default state)', () => {
        audioManager.init();
        // Audio starts muted by default now, no need to toggle

        audioManager.play(SoundType.PHASER_FIRE);

        expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    it('should adjust master volume', () => {
        audioManager.init();
        audioManager.setMasterVolume(0.8);

        // @ts-expect-error - Access private property
        expect(audioManager.masterGain.gain.value).toBe(0.8);
    });

    it('should toggle mute from default muted state', () => {
        audioManager.init();

        // Starts muted, first toggle unmutes
        const isEnabled = audioManager.toggleMute();
        expect(isEnabled).toBe(true);
        // @ts-expect-error - Access private property
        expect(audioManager.masterGain.gain.value).toBe(0.5); // Default volume

        // Second toggle mutes again
        const isEnabledAgain = audioManager.toggleMute();
        expect(isEnabledAgain).toBe(false);
        // @ts-expect-error - Access private property
        expect(audioManager.masterGain.gain.value).toBe(0);
    });

    it('should resume context', async () => {
        audioManager.init();
        await audioManager.resume();
        expect(mockAudioContext.resume).toHaveBeenCalled();
    });

    describe('concurrency limiting', () => {
        beforeEach(() => {
            audioManager.init();
            // @ts-expect-error - Access private property for testing
            audioManager.enabled = true;
        });

        it('should build categoryMap on init', () => {
            // @ts-expect-error - Access private property for testing
            const categoryMap: Map<string, string> = audioManager.categoryMap;
            expect(categoryMap.get('phaser_fire')).toBe('WEAPONS');
            expect(categoryMap.get('explosion_small')).toBe('COMBAT');
            expect(categoryMap.get('turret_place')).toBe('UI');
            expect(categoryMap.get('wave_start')).toBe('AMBIENT');
        });

        it('should allow sounds up to the concurrency limit', () => {
            // WEAPONS limit is 3
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.PHASER_FIRE);

            expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(3);
        });

        it('should block sounds that exceed the concurrency limit', () => {
            // WEAPONS limit is 3
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.TORPEDO_FIRE);
            audioManager.play(SoundType.DISRUPTOR_FIRE);
            // 4th weapon sound should be blocked
            audioManager.play(SoundType.PHASER_FIRE);

            expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(3);
        });

        it('should track concurrency per category independently', () => {
            // Fill WEAPONS to limit (3)
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.PHASER_FIRE);

            // COMBAT should still work (separate category, limit 2)
            audioManager.play(SoundType.EXPLOSION_SMALL);
            audioManager.play(SoundType.EXPLOSION_LARGE);

            expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(5);
        });

        it('should decrement active count when sound ends via onended', () => {
            // Play 3 weapon sounds (at limit)
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.PHASER_FIRE);
            audioManager.play(SoundType.PHASER_FIRE);

            // Get the first source's onended callback and fire it
            const firstSource = mockAudioContext.createBufferSource.mock.results[0].value;
            expect(firstSource.onended).toBeTypeOf('function');
            firstSource.onended();

            // Now a 4th sound should be allowed
            audioManager.play(SoundType.PHASER_FIRE);
            expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(4);
        });

        it('should set onended callback on source nodes for categorized sounds', () => {
            audioManager.play(SoundType.PHASER_FIRE);

            const source = mockAudioContext.createBufferSource.mock.results[0].value;
            expect(source.onended).toBeTypeOf('function');
        });

        it('should not go below zero when onended fires multiple times', () => {
            audioManager.play(SoundType.PHASER_FIRE);

            const source = mockAudioContext.createBufferSource.mock.results[0].value;
            // Fire onended twice (defensive edge case)
            source.onended();
            source.onended();

            // @ts-expect-error - Access private property for testing
            const activeSounds: Map<string, number> = audioManager.activeSounds;
            expect(activeSounds.get('WEAPONS')).toBe(0);
        });
    });
});
