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
        // We have 13 sound types defined in the enum
        expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    });

    it('should play a sound', () => {
        audioManager.init();
        // @ts-expect-error - Access private property for testing
        audioManager.enabled = true;

        audioManager.play(SoundType.PHASER_FIRE);

        expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    });

    it('should not play sound if disabled', () => {
        audioManager.init();
        audioManager.toggleMute(); // Disable

        audioManager.play(SoundType.PHASER_FIRE);

        expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
    });

    it('should adjust master volume', () => {
        audioManager.init();
        audioManager.setMasterVolume(0.8);

        // @ts-expect-error - Access private property
        expect(audioManager.masterGain.gain.value).toBe(0.8);
    });

    it('should toggle mute', () => {
        audioManager.init();

        const isEnabled = audioManager.toggleMute();
        expect(isEnabled).toBe(false);
        // @ts-expect-error - Access private property
        expect(audioManager.masterGain.gain.value).toBe(0);

        const isEnabledAgain = audioManager.toggleMute();
        expect(isEnabledAgain).toBe(true);
        // @ts-expect-error - Access private property
        expect(audioManager.masterGain.gain.value).toBe(0.5); // Default volume
    });

    it('should resume context', async () => {
        audioManager.init();
        await audioManager.resume();
        expect(mockAudioContext.resume).toHaveBeenCalled();
    });
});
