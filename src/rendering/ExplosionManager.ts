import { ParticleSystem, ParticleConfig } from './ParticleSystem';
import { ShockwaveRenderer } from './ShockwaveRenderer';

/**
 * Configuration for a single explosion stage
 */
export interface ExplosionStage {
    delay: number;           // Delay before this stage starts (seconds)
    particles?: ParticleConfig;
    shockwave?: {
        radius: number;
        color: number;
        duration: number;
    };
}

/**
 * Configuration for a multi-stage explosion sequence
 */
export interface ExplosionSequence {
    stages: ExplosionStage[];
}

/**
 * Active explosion being tracked
 */
interface ActiveExplosion {
    id: string;
    x: number;
    y: number;
    sequence: ExplosionSequence;
    elapsed: number;
    currentStageIndex: number;
}

/**
 * Manages multi-stage explosion effects with particles and shockwaves
 */
export class ExplosionManager {
    private activeExplosions: Map<string, ActiveExplosion> = new Map();
    private particleSystem: ParticleSystem;
    private shockwaveRenderer: ShockwaveRenderer;
    private nextId: number = 0;

    constructor(particleSystem: ParticleSystem, shockwaveRenderer: ShockwaveRenderer) {
        this.particleSystem = particleSystem;
        this.shockwaveRenderer = shockwaveRenderer;
    }

    /**
     * Create a multi-stage explosion
     * @param x - X position of explosion
     * @param y - Y position of explosion
     * @param sequence - Explosion sequence configuration
     * @returns The ID of the created explosion
     */
    createExplosion(x: number, y: number, sequence: ExplosionSequence): string {
        const id = `explosion-${this.nextId++}-${Date.now()}`;

        this.activeExplosions.set(id, {
            id,
            x,
            y,
            sequence,
            elapsed: 0,
            currentStageIndex: 0
        });

        return id;
    }

    /**
     * Create a simple explosion with a single stage
     * @param x - X position of explosion
     * @param y - Y position of explosion
     * @param particles - Particle configuration
     * @param shockwave - Optional shockwave configuration
     */
    createSimpleExplosion(
        x: number,
        y: number,
        particles: ParticleConfig,
        shockwave?: { radius: number; color: number; duration: number }
    ): string {
        return this.createExplosion(x, y, {
            stages: [{
                delay: 0,
                particles,
                shockwave
            }]
        });
    }

    /**
     * Update all active explosions
     * @param deltaTime - Time elapsed since last frame in seconds
     */
    update(deltaTime: number): void {
        const toRemove: string[] = [];

        for (const [id, explosion] of this.activeExplosions) {
            explosion.elapsed += deltaTime;

            // Process stages in sequence
            while (explosion.currentStageIndex < explosion.sequence.stages.length) {
                const stage = explosion.sequence.stages[explosion.currentStageIndex];

                // Check if this stage should be triggered
                if (explosion.elapsed >= stage.delay) {
                    // Trigger this stage
                    this.triggerStage(explosion.x, explosion.y, stage);
                    explosion.currentStageIndex++;
                } else {
                    // Haven't reached this stage yet
                    break;
                }
            }

            // Remove if all stages are complete
            if (explosion.currentStageIndex >= explosion.sequence.stages.length) {
                toRemove.push(id);
            }
        }

        // Clean up completed explosions
        for (const id of toRemove) {
            this.activeExplosions.delete(id);
        }
    }

    /**
     * Trigger a single explosion stage
     */
    private triggerStage(x: number, y: number, stage: ExplosionStage): void {
        // Spawn particles if configured
        if (stage.particles) {
            this.particleSystem.spawn({
                ...stage.particles,
                x,
                y
            });
        }

        // Create shockwave if configured
        if (stage.shockwave) {
            this.shockwaveRenderer.create(
                x,
                y,
                stage.shockwave.radius,
                stage.shockwave.color,
                stage.shockwave.duration
            );
        }
    }

    /**
     * Get the number of active explosions
     */
    getActiveCount(): number {
        return this.activeExplosions.size;
    }

    /**
     * Clear all active explosions
     */
    clear(): void {
        this.activeExplosions.clear();
    }
}
