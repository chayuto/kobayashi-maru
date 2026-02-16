/**
 * Adaptive Music Manager for Kobayashi Maru
 *
 * Manages 4 procedural music stems (ambient, build, combat, critical)
 * that crossfade based on a combat intensity metric derived from gameplay state.
 *
 * Each stem is a procedurally generated AudioBuffer looped via BufferSourceNode.
 * Gains are smoothly interpolated using Web Audio API's linearRampToValueAtTime.
 *
 * @module audio/MusicManager
 */

import { AudioManager } from './AudioManager';
import { AUDIO_CONFIG } from '../config/audio.config';

/**
 * Context data needed to calculate combat intensity
 */
export interface MusicContext {
    /** Number of currently active enemies */
    activeEnemies: number;
    /** Kobayashi Maru hull percent (0-1, where 1 = full health) */
    hullPercent: number;
    /** Whether a boss wave is currently active */
    isBossWave: boolean;
    /** Current damage-per-second */
    dps: number;
}

/**
 * Individual music stem with its audio nodes
 */
interface MusicStem {
    /** Name for debugging */
    name: string;
    /** The looping buffer source */
    source: AudioBufferSourceNode | null;
    /** Gain node for crossfading */
    gain: GainNode | null;
    /** The pre-generated audio buffer */
    buffer: AudioBuffer | null;
}

const MUSIC_CONFIG = AUDIO_CONFIG.MUSIC;

/**
 * Adaptive Music Manager
 *
 * Creates 4 procedural audio stems and crossfades between them
 * based on combat intensity.
 */
export class MusicManager {
    private audioManager: AudioManager;
    private stems: Map<string, MusicStem> = new Map();
    private playing: boolean = false;
    private smoothedIntensity: number = 0;

    constructor(audioManager: AudioManager) {
        this.audioManager = audioManager;
    }

    /**
     * Initialize stems and generate audio buffers.
     * Must be called after AudioManager.init().
     */
    init(): void {
        const ctx = this.audioManager.getAudioContext();
        if (!ctx) return;

        // Generate buffers for all 4 stems
        this.stems.set('ambient', {
            name: 'ambient',
            source: null,
            gain: null,
            buffer: this.generateAmbientBuffer(ctx),
        });
        this.stems.set('build', {
            name: 'build',
            source: null,
            gain: null,
            buffer: this.generateBuildBuffer(ctx),
        });
        this.stems.set('combat', {
            name: 'combat',
            source: null,
            gain: null,
            buffer: this.generateCombatBuffer(ctx),
        });
        this.stems.set('critical', {
            name: 'critical',
            source: null,
            gain: null,
            buffer: this.generateCriticalBuffer(ctx),
        });
    }

    /**
     * Start playing all stems.
     * All stems play simultaneously; gains control which are audible.
     */
    start(): void {
        if (this.playing) return;
        if (!MUSIC_CONFIG.ENABLED) return;

        const ctx = this.audioManager.getAudioContext();
        const musicGain = this.audioManager.getMusicGainNode();
        if (!ctx || !musicGain) return;

        for (const stem of this.stems.values()) {
            if (!stem.buffer) continue;

            // Create gain node for this stem
            stem.gain = ctx.createGain();
            stem.gain.gain.value = stem.name === 'ambient' ? MUSIC_CONFIG.VOLUME : 0;
            stem.gain.connect(musicGain);

            // Create looping buffer source
            stem.source = ctx.createBufferSource();
            stem.source.buffer = stem.buffer;
            stem.source.loop = true;
            stem.source.connect(stem.gain);
            stem.source.start();
        }

        this.playing = true;
    }

    /**
     * Stop all stems.
     */
    stop(): void {
        if (!this.playing) return;

        for (const stem of this.stems.values()) {
            if (stem.source) {
                try {
                    stem.source.stop();
                } catch {
                    // Source may already be stopped
                }
                stem.source.disconnect();
                stem.source = null;
            }
            if (stem.gain) {
                stem.gain.disconnect();
                stem.gain = null;
            }
        }

        this.playing = false;
        this.smoothedIntensity = 0;
    }

    /**
     * Update music stems based on current game state.
     * Should be called each gameplay frame.
     *
     * @param context - Current gameplay context for intensity calculation
     * @param deltaTime - Frame delta time in seconds
     */
    update(context: MusicContext, deltaTime: number): void {
        if (!this.playing) return;

        // Calculate raw intensity from game state
        const rawIntensity = this.calculateIntensity(context);

        // Smooth the intensity over time (exponential moving average)
        const rate = MUSIC_CONFIG.SMOOTHING_RATE;
        const alpha = 1 - Math.exp(-rate * deltaTime);
        this.smoothedIntensity = this.smoothedIntensity + alpha * (rawIntensity - this.smoothedIntensity);

        // Update stem gains based on smoothed intensity
        this.updateStemGains(this.smoothedIntensity);
    }

    /**
     * Get current smoothed intensity (0-1). Useful for debugging/UI.
     */
    getIntensity(): number {
        return this.smoothedIntensity;
    }

    /**
     * Check if music is currently playing.
     */
    isPlaying(): boolean {
        return this.playing;
    }

    /**
     * Clean up all resources.
     */
    destroy(): void {
        this.stop();
        this.stems.clear();
    }

    // =========================================================================
    // INTENSITY CALCULATION
    // =========================================================================

    /**
     * Calculate combat intensity from game state (0-1).
     */
    private calculateIntensity(context: MusicContext): number {
        const weights = MUSIC_CONFIG.INTENSITY_WEIGHTS;
        const norms = MUSIC_CONFIG.INTENSITY_NORMALIZERS;

        const enemyFactor = Math.min(context.activeEnemies / norms.MAX_ENEMIES, 1);
        const hullDamageFactor = 1 - context.hullPercent;
        const bossFactor = context.isBossWave ? 1 : 0;
        const dpsFactor = Math.min(context.dps / norms.MAX_DPS, 1);

        const raw =
            weights.ACTIVE_ENEMIES * enemyFactor +
            weights.HULL_DAMAGE * hullDamageFactor +
            weights.BOSS_WAVE * bossFactor +
            weights.DPS * dpsFactor;

        return Math.max(0, Math.min(1, raw));
    }

    /**
     * Update gain nodes for each stem based on intensity.
     */
    private updateStemGains(intensity: number): void {
        const ctx = this.audioManager.getAudioContext();
        if (!ctx) return;

        const thresholds = MUSIC_CONFIG.STEM_THRESHOLDS;
        const rampTime = ctx.currentTime + MUSIC_CONFIG.GAIN_RAMP_TIME;
        const vol = MUSIC_CONFIG.VOLUME;

        // Ambient: always present, fades slightly as intensity rises
        const ambientGain = this.stems.get('ambient')?.gain;
        if (ambientGain) {
            const target = vol * (1 - intensity * 0.3);
            ambientGain.gain.linearRampToValueAtTime(target, rampTime);
        }

        // Build: fades in between BUILD_START and BUILD_FULL
        const buildGain = this.stems.get('build')?.gain;
        if (buildGain) {
            const t = this.smoothStep(thresholds.BUILD_START, thresholds.BUILD_FULL, intensity);
            buildGain.gain.linearRampToValueAtTime(vol * t, rampTime);
        }

        // Combat: fades in between COMBAT_START and COMBAT_FULL
        const combatGain = this.stems.get('combat')?.gain;
        if (combatGain) {
            const t = this.smoothStep(thresholds.COMBAT_START, thresholds.COMBAT_FULL, intensity);
            combatGain.gain.linearRampToValueAtTime(vol * t, rampTime);
        }

        // Critical: fades in between CRITICAL_START and CRITICAL_FULL
        const criticalGain = this.stems.get('critical')?.gain;
        if (criticalGain) {
            const t = this.smoothStep(thresholds.CRITICAL_START, thresholds.CRITICAL_FULL, intensity);
            criticalGain.gain.linearRampToValueAtTime(vol * t, rampTime);
        }
    }

    /**
     * Smooth step interpolation between edge0 and edge1.
     */
    private smoothStep(edge0: number, edge1: number, x: number): number {
        const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
        return t * t * (3 - 2 * t);
    }

    // =========================================================================
    // PROCEDURAL STEM GENERATION
    // =========================================================================

    /**
     * Generate ambient stem: deep space drone.
     * Low sine at 80 Hz + triangle at 120 Hz with gentle breathing modulation.
     */
    private generateAmbientBuffer(ctx: AudioContext): AudioBuffer {
        const duration = MUSIC_CONFIG.STEM_DURATIONS.AMBIENT;
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(duration * sampleRate);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;

            // Deep sine drone at 80 Hz
            const drone80 = Math.sin(2 * Math.PI * 80 * t);

            // Triangle wave at 120 Hz (approximated with harmonics)
            const phase120 = (120 * t) % 1;
            const triangle120 = 4 * Math.abs(phase120 - 0.5) - 1;

            // Gentle breathing modulation (0.25 Hz = 1 cycle per 4 seconds)
            const breath = 0.7 + 0.3 * Math.sin(2 * Math.PI * 0.25 * t);

            // Very subtle filtered noise
            const noise = (Math.random() * 2 - 1) * 0.02;

            data[i] = (drone80 * 0.5 + triangle120 * 0.3 + noise) * breath * 0.3;
        }

        return buffer;
    }

    /**
     * Generate build stem: pulsing bass creating tension.
     * 160 Hz sine with rhythmic amplitude envelope (2 pulses per second).
     */
    private generateBuildBuffer(ctx: AudioContext): AudioBuffer {
        const duration = MUSIC_CONFIG.STEM_DURATIONS.BUILD;
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(duration * sampleRate);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        const pulseRate = 2.0; // 2 Hz = 2 pulses per second

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;

            // Bass tone at 160 Hz
            const bass = Math.sin(2 * Math.PI * 160 * t);

            // Warm harmonic at 320 Hz (octave)
            const harmonic = Math.sin(2 * Math.PI * 320 * t) * 0.3;

            // Rhythmic pulse envelope: sharp attack, gradual decay
            const pulsePhase = (t * pulseRate) % 1;
            const pulse = Math.exp(-pulsePhase * 6);

            data[i] = (bass + harmonic) * pulse * 0.4;
        }

        return buffer;
    }

    /**
     * Generate combat stem: percussion-like noise with higher harmonics.
     * Rhythmic noise bursts at 4 Hz with tonal element at 400 Hz.
     */
    private generateCombatBuffer(ctx: AudioContext): AudioBuffer {
        const duration = MUSIC_CONFIG.STEM_DURATIONS.COMBAT;
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(duration * sampleRate);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        const hitRate = 4.0; // 4 Hz = 4 hits per second

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;

            // Percussion noise burst
            const hitPhase = (t * hitRate) % 1;
            const hitEnvelope = Math.exp(-hitPhase * 12);
            const noise = (Math.random() * 2 - 1) * hitEnvelope;

            // Higher tonal element at 400 Hz with slight vibrato
            const vibrato = Math.sin(2 * Math.PI * 6 * t) * 10;
            const tone = Math.sin(2 * Math.PI * (400 + vibrato) * t) * 0.2;

            // Subtle sub bass for weight
            const sub = Math.sin(2 * Math.PI * 100 * t) * 0.15 * hitEnvelope;

            data[i] = (noise * 0.5 + tone + sub) * 0.35;
        }

        return buffer;
    }

    /**
     * Generate critical stem: alarm-like oscillation with dissonance.
     * Fast pulsing at 4 Hz with tritone interval (300 + 420 Hz).
     */
    private generateCriticalBuffer(ctx: AudioContext): AudioBuffer {
        const duration = MUSIC_CONFIG.STEM_DURATIONS.CRITICAL;
        const sampleRate = ctx.sampleRate;
        const length = Math.floor(duration * sampleRate);
        const buffer = ctx.createBuffer(1, length, sampleRate);
        const data = buffer.getChannelData(0);

        const pulseRate = 4.0; // Fast alarm pulse

        for (let i = 0; i < length; i++) {
            const t = i / sampleRate;

            // Alarm oscillation at 300 Hz
            const alarm = Math.sin(2 * Math.PI * 300 * t);

            // Dissonant tritone at ~420 Hz (augmented 4th)
            const dissonance = Math.sin(2 * Math.PI * 420 * t) * 0.6;

            // Fast rhythmic pulsing
            const pulsePhase = (t * pulseRate) % 1;
            const pulse = 0.4 + 0.6 * (Math.sin(2 * Math.PI * pulsePhase) > 0 ? 1 : 0.2);

            // Slight frequency sweep for urgency
            const sweep = Math.sin(2 * Math.PI * (200 + t * 100) * t) * 0.2;

            data[i] = (alarm + dissonance + sweep) * pulse * 0.3;
        }

        return buffer;
    }
}
