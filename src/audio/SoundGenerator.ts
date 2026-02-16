/**
 * Procedural Sound Generator
 * Creates audio buffers programmatically using Web Audio API
 */
import { SoundType } from './types';

export class SoundGenerator {
    /**
     * Generates a sound buffer based on the requested type
     */
    static generateSound(ctx: AudioContext, type: SoundType): AudioBuffer {
        switch (type) {
            case SoundType.PHASER_FIRE:
                return this.createPhaserSound(ctx);
            case SoundType.TORPEDO_FIRE:
                return this.createTorpedoSound(ctx);
            case SoundType.DISRUPTOR_FIRE:
                return this.createDisruptorSound(ctx);
            case SoundType.TETRYON_FIRE:
                return this.createTetryonSound(ctx);
            case SoundType.PLASMA_FIRE:
                return this.createPlasmaSound(ctx);
            case SoundType.POLARON_FIRE:
                return this.createPolaronSound(ctx);
            case SoundType.EXPLOSION_SMALL:
                return this.createExplosionSound(ctx, 0.3);
            case SoundType.EXPLOSION_LARGE:
                return this.createExplosionSound(ctx, 0.8);
            case SoundType.TURRET_PLACE:
                return this.createBeepSound(ctx, 880, 0.1, 'sine');
            case SoundType.ERROR_BEEP:
                return this.createBeepSound(ctx, 150, 0.3, 'sawtooth');
            case SoundType.WAVE_START:
                return this.createWaveStartSound(ctx);
            case SoundType.WAVE_COMPLETE:
                return this.createWaveCompleteSound(ctx);
            default:
                // Default fallback sound (short blip)
                return this.createBeepSound(ctx, 440, 0.05, 'sine');
        }
    }

    static createPhaserSound(ctx: AudioContext): AudioBuffer {
        const duration = 0.15;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 1000 + Math.sin(t * 50) * 500; // Frequency sweep
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10) * 0.3;
        }

        return buffer;
    }

    static createTorpedoSound(ctx: AudioContext): AudioBuffer {
        const duration = 0.4;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const freq = 200 - t * 400; // Pitch drop
            data[i] = (Math.random() * 0.5 + 0.5) * Math.sin(2 * Math.PI * Math.max(50, freq) * t) * Math.exp(-t * 5) * 0.5;
        }

        return buffer;
    }

    static createDisruptorSound(ctx: AudioContext): AudioBuffer {
        const duration = 0.2;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Noisy square wave
            const signal = Math.sin(2 * Math.PI * 400 * t) > 0 ? 0.5 : -0.5;
            const noise = Math.random() * 0.4;
            data[i] = (signal + noise) * Math.exp(-t * 8) * 0.3;
        }

        return buffer;
    }

    /**
     * Tetryon: Crystalline high-frequency oscillating beam
     * Two sine oscillators with rapid amplitude modulation for shimmer
     */
    static createTetryonSound(ctx: AudioContext): AudioBuffer {
        const duration = 0.12;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Two sine oscillators at 2000 Hz and 3000 Hz
            const osc1 = Math.sin(2 * Math.PI * 2000 * t);
            const osc2 = Math.sin(2 * Math.PI * 3000 * t);
            // Rapid amplitude modulation at 20 Hz for shimmer
            const modulation = 0.5 + 0.5 * Math.sin(2 * Math.PI * 20 * t);
            // Exponential decay
            const envelope = Math.exp(-t * 25);
            data[i] = (osc1 + osc2) * 0.5 * modulation * envelope * 0.3;
        }

        return buffer;
    }

    /**
     * Plasma: Low rumble with sizzle
     * Low sine at 150 Hz combined with filtered noise, slow attack then decay
     */
    static createPlasmaSound(ctx: AudioContext): AudioBuffer {
        const duration = 0.35;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Low rumble at 150 Hz
            const rumble = Math.sin(2 * Math.PI * 150 * t);
            // Filtered noise (sizzle) - use noise attenuated by high frequency
            const noise = (Math.random() * 2 - 1) * 0.3;
            // Slow attack: ramp up over first 0.05s, then decay
            const attack = t < 0.05 ? t / 0.05 : 1.0;
            const decay = Math.exp(-(t - 0.05) * 4);
            const envelope = attack * (t < 0.05 ? 1.0 : decay);
            data[i] = (rumble * 0.6 + noise) * envelope * 0.5;
        }

        return buffer;
    }

    /**
     * Polaron: Descending warble
     * Frequency sweep from 800 Hz to 400 Hz with vibrato modulation
     */
    static createPolaronSound(ctx: AudioContext): AudioBuffer {
        const duration = 0.18;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Frequency sweep from 800 Hz down to 400 Hz
            const baseFreq = 800 - (400 * t / duration);
            // Vibrato modulation at 15 Hz
            const vibrato = Math.sin(2 * Math.PI * 15 * t) * 30;
            const freq = baseFreq + vibrato;
            // Exponential decay
            const envelope = Math.exp(-t * 15);
            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }

        return buffer;
    }

    static createExplosionSound(ctx: AudioContext, duration: number): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noise = Math.random() * 2 - 1;
            const envelope = Math.exp(-t * 6);
            data[i] = noise * envelope * 0.5;
        }

        return buffer;
    }

    static createBeepSound(ctx: AudioContext, frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            let val = 0;

            // Simple oscillator implementation
            const phase = 2 * Math.PI * frequency * t;
            if (type === 'sine') val = Math.sin(phase);
            else if (type === 'square') val = Math.sin(phase) > 0 ? 1 : -1;
            else if (type === 'sawtooth') val = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
            else if (type === 'triangle') val = 2 * Math.abs(2 * (frequency * t - Math.floor(frequency * t + 0.5))) - 1;

            data[i] = val * Math.exp(-t * 5) * 0.3;
        }

        return buffer;
    }

    static createWaveStartSound(ctx: AudioContext): AudioBuffer {
        const duration = 1.5;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // Rising tone
            const freq = 220 + t * 220;
            data[i] = Math.sin(2 * Math.PI * freq * t) * 0.3;
        }

        return buffer;
    }

    static createWaveCompleteSound(ctx: AudioContext): AudioBuffer {
        const duration = 1.0;
        const sampleRate = ctx.sampleRate;
        const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
        const data = buffer.getChannelData(0);

        // Major triad arpeggio
        const notes = [440, 554, 659]; // A4, C#5, E5
        const noteDuration = duration / notes.length;

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const noteIndex = Math.floor(t / noteDuration);
            const freq = notes[Math.min(noteIndex, notes.length - 1)];

            // Envelope for each note
            const localT = t % noteDuration;
            const envelope = Math.exp(-localT * 5);

            data[i] = Math.sin(2 * Math.PI * freq * t) * envelope * 0.3;
        }

        return buffer;
    }
}
