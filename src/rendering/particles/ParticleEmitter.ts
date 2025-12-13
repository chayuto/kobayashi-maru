/**
 * Particle Emitter for Kobayashi Maru
 *
 * Handles velocity calculation for different emission patterns.
 *
 * @module rendering/particles/ParticleEmitter
 */

import { EmitterPattern, type ParticleConfig } from './types';

/**
 * ParticleEmitter calculates initial velocities based on emission patterns.
 */
export class ParticleEmitter {
    private spiralCounter: number = 0;

    /**
     * Calculate velocity for a particle based on config pattern.
     */
    calculateVelocity(config: ParticleConfig): { vx: number; vy: number } {
        const pattern = config.emitterPattern || EmitterPattern.CIRCULAR;
        const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);

        let angle = 0;

        switch (pattern) {
            case EmitterPattern.CIRCULAR:
                // Random angle within spread
                angle = (Math.random() - 0.5) * config.spread;
                break;

            case EmitterPattern.CONE:
                // Random angle within cone
                angle = (config.emitterAngle || 0) + (Math.random() - 0.5) * (config.emitterWidth || config.spread);
                break;

            case EmitterPattern.RING:
                // Evenly distributed around a ring
                angle = (Math.PI * 2 * Math.random());
                break;

            case EmitterPattern.SPIRAL:
                // Spiral pattern
                angle = this.spiralCounter * 0.5;
                this.spiralCounter++;
                break;

            case EmitterPattern.BURST:
                // All particles in same direction
                angle = config.emitterAngle || 0;
                break;

            case EmitterPattern.FOUNTAIN:
                // Arc upward
                angle = (config.emitterAngle || -Math.PI / 2) + (Math.random() - 0.5) * (config.emitterWidth || Math.PI / 4);
                break;
        }

        return {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    }

    /**
     * Reset spiral counter (e.g., for new burst).
     */
    resetSpiral(): void {
        this.spiralCounter = 0;
    }
}
