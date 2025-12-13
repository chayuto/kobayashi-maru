/**
 * Spawn Effects for Kobayashi Maru
 *
 * Handles visual effects when spawning special enemies (elite, boss).
 * Extracted from WaveManager for cleaner separation of concerns.
 *
 * @module game/wave/SpawnEffects
 */

import { ParticleSystem } from '../../rendering/ParticleSystem';
import { Position } from '../../ecs/components';

/**
 * SpawnEffects creates visual effects for special enemy spawns.
 */
export class SpawnEffects {
    private particleSystem: ParticleSystem | null = null;

    /**
     * Set particle system dependency.
     */
    setParticleSystem(particleSystem: ParticleSystem): void {
        this.particleSystem = particleSystem;
    }

    /**
     * Add golden glow effect for elite enemies.
     */
    addEliteGlow(eid: number): void {
        if (!this.particleSystem) return;

        this.particleSystem.spawn({
            x: Position.x[eid],
            y: Position.y[eid],
            count: 15,
            speed: { min: 10, max: 30 },
            life: { min: 0.5, max: 1.0 },
            size: { min: 3, max: 6 },
            color: 0xFFDD00, // Golden glow for elite
            spread: Math.PI * 2
        });
    }

    /**
     * Add intense red glow effect for boss enemies.
     */
    addBossGlow(eid: number): void {
        if (!this.particleSystem) return;

        this.particleSystem.spawn({
            x: Position.x[eid],
            y: Position.y[eid],
            count: 30,
            speed: { min: 20, max: 50 },
            life: { min: 0.5, max: 1.2 },
            size: { min: 5, max: 10 },
            color: 0xFF0000, // Red glow for boss
            spread: Math.PI * 2
        });
    }
}
