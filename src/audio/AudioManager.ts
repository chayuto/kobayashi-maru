/**
 * Audio Manager
 * Handles Web Audio API context, sound loading/generation, and playback
 */
import { SoundType, PlayOptions } from './types';
import { SoundGenerator } from './SoundGenerator';
import { AUDIO_CONFIG } from '../config';

export class AudioManager {
    private static instance: AudioManager;
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;
    private sfxGain: GainNode | null = null;
    private musicGain: GainNode | null = null;
    private sounds: Map<string, AudioBuffer> = new Map();
    private enabled: boolean = false;  // Start muted by default
    private initialized: boolean = false;
    private activeSounds: Map<string, number> = new Map(); // category -> active count
    private categoryMap: Map<string, string> = new Map(); // soundType -> category

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

            // Build sound-type-to-category lookup for concurrency limiting
            this.buildCategoryMap();

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
     * Build the mapping from sound type string to category name
     */
    private buildCategoryMap(): void {
        const categories = AUDIO_CONFIG.CATEGORIES;
        for (const [category, soundTypes] of Object.entries(categories)) {
            for (const soundType of soundTypes) {
                this.categoryMap.set(soundType, category);
            }
        }
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

        // Concurrency limiting: check if category is at max active sounds
        const category = this.categoryMap.get(key);
        if (category) {
            const limit = AUDIO_CONFIG.CONCURRENCY[category as keyof typeof AUDIO_CONFIG.CONCURRENCY];
            if (limit !== undefined) {
                const activeCount = this.activeSounds.get(category) ?? 0;
                if (activeCount >= limit) {
                    return; // Skip — category is at capacity
                }
                this.activeSounds.set(category, activeCount + 1);
            }
        }

        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        // Decrement active count when sound finishes
        if (category) {
            source.onended = () => {
                const current = this.activeSounds.get(category) ?? 0;
                this.activeSounds.set(category, Math.max(0, current - 1));
            };
        }

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

    /**
     * Get the AudioContext (for music manager to create nodes).
     * Returns null if not initialized.
     */
    getAudioContext(): AudioContext | null {
        return this.audioContext;
    }

    /**
     * Get the music gain node (for music manager to connect stems).
     * Returns null if not initialized.
     */
    getMusicGainNode(): GainNode | null {
        return this.musicGain;
    }
}
