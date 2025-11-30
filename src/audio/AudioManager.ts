/**
 * Audio Manager
 * Handles Web Audio API context, sound loading/generation, and playback
 */
import { SoundType, PlayOptions } from './types';
import { SoundGenerator } from './SoundGenerator';

export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sounds: Map<string, AudioBuffer> = new Map();
    private enabled: boolean = false;  // Start muted by default
    private initialized: boolean = false;

    private constructor() {
        // Private constructor for singleton
    }

    static getInstance(): AudioManager {
        if (!AudioManager.instance) {
            AudioManager.instance = new AudioManager();
        }
        return AudioManager.instance;
    }

    /**
     * Initialize the AudioContext
     * Must be called after user interaction
     */
    init(): void {
        if (this.initialized) return;

        try {
            const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
            this.audioContext = new AudioContextClass();

            // Create gain nodes
            this.masterGain = this.audioContext.createGain();
            this.sfxGain = this.audioContext.createGain();
            this.musicGain = this.audioContext.createGain();

            // Connect graph: SFX/Music -> Master -> Destination
            this.sfxGain.connect(this.masterGain);
            this.musicGain.connect(this.masterGain);
            this.masterGain.connect(this.audioContext.destination);

            // Set default volumes - start muted
            this.masterGain.gain.value = 0;  // Start muted
            this.sfxGain.gain.value = 1.0;
            this.musicGain.gain.value = 0.8;

            // Generate procedural sounds
            this.generateSounds();

            this.initialized = true;
            console.log('AudioManager initialized');
        } catch (e) {
            console.error('Failed to initialize AudioContext:', e);
        }
    }

    /**
     * Generate all procedural sounds
     */
    private generateSounds(): void {
        if (!this.audioContext) return;

        Object.values(SoundType).forEach(type => {
            if (this.audioContext) {
                const buffer = SoundGenerator.generateSound(this.audioContext, type);
                this.sounds.set(type, buffer);
            }
        });
    }

    /**
     * Resume AudioContext if suspended (browser policy)
     */
    async resume(): Promise<void> {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }
    }

    /**
     * Play a sound
     */
    play(key: SoundType, options: PlayOptions = {}): void {
        if (!this.enabled || !this.initialized || !this.audioContext || !this.sfxGain) return;

        const buffer = this.sounds.get(key);
        if (!buffer) return;

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // Apply options
        if (options.pitch) {
            source.playbackRate.value = options.pitch;
        }

        if (options.loop) {
            source.loop = true;
        }

        // Create a local gain node for this specific sound if volume is modified
        let outputNode: AudioNode = this.sfxGain;

        if (options.volume !== undefined && options.volume !== 1) {
            const gain = this.audioContext.createGain();
            gain.gain.value = options.volume;
            gain.connect(this.sfxGain);
            outputNode = gain;
        }

        // Handle panning if specified
        if (options.pan !== undefined && this.audioContext.createStereoPanner) {
            const panner = this.audioContext.createStereoPanner();
            panner.pan.value = Math.max(-1, Math.min(1, options.pan));
            source.connect(panner);
            panner.connect(outputNode);
        } else {
            source.connect(outputNode);
        }

        source.start();
    }

    /**
     * Set master volume (0-1)
     */
    setMasterVolume(volume: number): void {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    /**
     * Toggle audio enabled state
     */
    toggleMute(): boolean {
        this.enabled = !this.enabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.enabled ? 0.5 : 0;
        }
        return this.enabled;
    }

    /**
     * Check if audio context is ready
     */
    isReady(): boolean {
        return this.initialized && this.audioContext?.state === 'running';
    }

    /**
     * Check if audio is currently muted
     */
    isMuted(): boolean {
        return !this.enabled;
    }
}
