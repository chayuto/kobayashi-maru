/**
 * Particle Pool for Kobayashi Maru
 *
 * Object pooling for particle reuse to reduce GC pressure.
 *
 * @module rendering/particles/ParticlePool
 */

import { Container, Graphics } from 'pixi.js';
import type { Particle } from './types';

/**
 * ParticlePool manages particle object reuse for performance.
 */
export class ParticlePool {
    private pool: Particle[] = [];

    /**
     * Get a particle from the pool or create a new one.
     */
    acquire(): Particle {
        if (this.pool.length > 0) {
            const particle = this.pool.pop()!;
            // Reset trail if it exists
            if (particle.trail) {
                particle.trail.positions = [];
            }
            return particle;
        }

        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            ax: 0,
            ay: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: 0,
            alpha: 0,
            sprite: new Graphics(),
            spriteType: 'circle',
            rotation: 0,
            rotationSpeed: 0,
            scale: 1,
            scaleStart: 1,
            scaleEnd: 1,
            drag: 1,
            colorGradient: undefined,
            trail: undefined
        };
    }

    /**
     * Return a particle to the pool for reuse.
     */
    release(particle: Particle, container: Container): void {
        container.removeChild(particle.sprite);

        // Clean up trail graphics
        if (particle.trail) {
            container.removeChild(particle.trail.graphics);
            particle.trail.positions = [];
        }

        this.pool.push(particle);
    }

    /**
     * Clear all pooled particles.
     */
    clear(): void {
        this.pool = [];
    }

    /**
     * Get current pool size.
     */
    get size(): number {
        return this.pool.length;
    }
}
