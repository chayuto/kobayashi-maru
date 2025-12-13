/**
 * Particle System for Kobayashi Maru
 *
 * Orchestrates particle spawning, physics, and rendering.
 * Delegates specific functionality to sub-components:
 * - ParticlePool: object pooling for performance
 * - ParticleEmitter: velocity calculation for patterns
 * - ParticleRenderer: drawing and color interpolation
 */
import { Application, Container, Graphics } from 'pixi.js';
import { ParticlePool, ParticleEmitter, ParticleRenderer } from './particles';

// Re-export types for backward compatibility
export {
    EmitterPattern,
    type ParticleSpriteType,
    type ColorGradient,
    type TrailConfig,
    type Particle,
    type ParticleConfig
} from './particles/types';

import type { Particle, ParticleConfig } from './particles/types';

export class ParticleSystem {
    particles: Particle[] = [];
    container: Container;
    private app: Application | null = null;
    private glowContainer: Container | null = null;

    private maxParticles: number = 2000;
    private spawnRateMultiplier: number = 1.0;

    // Sub-components
    private readonly pool: ParticlePool;
    private readonly emitter: ParticleEmitter;
    private readonly renderer: ParticleRenderer;

    constructor() {
        this.container = new Container();
        this.pool = new ParticlePool();
        this.emitter = new ParticleEmitter();
        this.renderer = new ParticleRenderer();
    }

    init(app: Application, maxParticles: number = 2000, spawnRateMultiplier: number = 1.0, glowContainer?: Container): void {
        this.app = app;
        this.maxParticles = maxParticles;
        this.spawnRateMultiplier = spawnRateMultiplier;
        this.glowContainer = glowContainer || null;

        // Add to glow container if provided, otherwise add to stage
        if (this.glowContainer) {
            this.glowContainer.addChild(this.container);
        } else {
            this.app.stage.addChild(this.container);
        }
    }

    spawn(config: ParticleConfig): void {
        // Check hard limit
        if (this.particles.length >= this.maxParticles) {
            return;
        }

        // Apply spawn rate multiplier (minimum 1 particle if count > 0)
        let count = Math.ceil(config.count * this.spawnRateMultiplier);

        // Adjust count based on remaining budget
        count = Math.min(count, this.maxParticles - this.particles.length);

        for (let i = 0; i < count; i++) {
            const particle = this.pool.acquire();

            // Initialize particle properties
            particle.x = config.x;
            particle.y = config.y;

            // Use emitter to calculate velocity
            const velocity = this.emitter.calculateVelocity(config);
            particle.vx = velocity.vx;
            particle.vy = velocity.vy;

            // Initialize acceleration and drag
            particle.ax = 0;
            particle.ay = config.gravity || 0;
            particle.drag = config.drag !== undefined ? config.drag : 1.0;

            particle.maxLife = config.life.min + Math.random() * (config.life.max - config.life.min);
            particle.life = particle.maxLife;

            particle.size = config.size.min + Math.random() * (config.size.max - config.size.min);

            // Set initial color
            if (config.colorGradient) {
                particle.colorGradient = config.colorGradient;
                const initialColor = this.renderer.interpolateColorGradient(config.colorGradient, 1.0);
                particle.color = initialColor.color;
                particle.alpha = initialColor.alpha;
            } else {
                particle.color = config.color || 0xFFFFFF;
                particle.alpha = 1;
                particle.colorGradient = undefined;
            }

            // Initialize rotation
            if (config.rotation) {
                particle.rotation = config.rotation.min + Math.random() * (config.rotation.max - config.rotation.min);
            } else {
                particle.rotation = 0;
            }

            if (config.rotationSpeed) {
                particle.rotationSpeed = config.rotationSpeed.min + Math.random() * (config.rotationSpeed.max - config.rotationSpeed.min);
            } else {
                particle.rotationSpeed = 0;
            }

            // Initialize scale
            particle.scaleStart = config.scaleStart || 1.0;
            particle.scaleEnd = config.scaleEnd || 1.0;
            particle.scale = particle.scaleStart;

            // Initialize trail
            if (config.trail?.enabled) {
                particle.trail = {
                    positions: [{ x: particle.x, y: particle.y }],
                    config: config.trail,
                    graphics: new Graphics()
                };
                this.container.addChild(particle.trail.graphics);
            } else {
                particle.trail = undefined;
            }

            // Initialize debris physics
            if (config.bounceCount !== undefined) {
                particle.bounces = config.bounceCount;
                particle.bounceDamping = config.bounceDamping || 0.7;
                particle.groundY = config.groundY;
            } else {
                particle.bounces = undefined;
                particle.bounceDamping = undefined;
                particle.groundY = undefined;
            }

            // Store sprite type and initialize visual
            particle.spriteType = config.sprite || 'circle';
            this.renderer.drawParticle(particle);
            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
            particle.sprite.alpha = particle.alpha;
            particle.sprite.rotation = particle.rotation;
            particle.sprite.scale.set(particle.scale);

            this.particles.push(particle);
            this.container.addChild(particle.sprite);
        }
    }

    update(deltaTime: number): void {
        // Track how many particles to keep
        let writeIndex = 0;

        for (let i = 0; i < this.particles.length; i++) {
            const p = this.particles[i];

            // Apply physics
            p.vx += p.ax * deltaTime;
            p.vy += p.ay * deltaTime;

            // Apply drag
            if (p.drag < 1.0) {
                p.vx *= Math.pow(p.drag, deltaTime);
                p.vy *= Math.pow(p.drag, deltaTime);
            }

            // Update position
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Handle bounce physics if enabled
            if (p.bounces !== undefined && p.groundY !== undefined && p.bounceDamping !== undefined) {
                if (p.y >= p.groundY && p.vy > 0) {
                    if (p.bounces > 0) {
                        // Bounce off ground
                        p.vy *= -p.bounceDamping;
                        p.y = p.groundY; // Reset to ground level
                        p.bounces--;
                        // Also dampen rotation on bounce
                        p.rotationSpeed *= p.bounceDamping;
                    } else {
                        // No more bounces, stop at ground
                        p.vy = 0;
                        p.y = p.groundY;
                        p.rotationSpeed = 0;
                    }
                }
            }

            // Update life
            p.life -= deltaTime;

            // Check if particle is dead
            if (p.life <= 0) {
                this.pool.release(p, this.container);
                continue; // Skip this particle, don't increment writeIndex
            }

            // Calculate normalized life (0 = dead, 1 = just born)
            const normalizedLife = Math.max(0, p.life / p.maxLife);

            // Update color gradient if present
            let colorChanged = false;
            if (p.colorGradient) {
                const gradientColor = this.renderer.interpolateColorGradient(p.colorGradient, normalizedLife);
                // Only mark as changed if color differs significantly
                if (p.color !== gradientColor.color) {
                    p.color = gradientColor.color;
                    colorChanged = true;
                }
                p.alpha = gradientColor.alpha;
            } else {
                // Calculate alpha based on remaining life
                p.alpha = normalizedLife;
            }

            // Update rotation
            p.rotation += p.rotationSpeed * deltaTime;

            // Update scale interpolation
            p.scale = p.scaleStart + (p.scaleEnd - p.scaleStart) * (1 - normalizedLife);

            // Update trail
            if (p.trail) {
                // Add current position to trail
                p.trail.positions.push({ x: p.x, y: p.y });

                // Limit trail length
                if (p.trail.positions.length > p.trail.config.length) {
                    p.trail.positions.shift();
                }

                // Render trail
                this.renderer.renderTrail(p);
            }

            // Update visual
            p.sprite.x = p.x;
            p.sprite.y = p.y;
            p.sprite.alpha = p.alpha;
            p.sprite.rotation = p.rotation;
            p.sprite.scale.set(p.scale);

            // Only redraw sprite if color actually changed (optimization)
            if (colorChanged) {
                this.renderer.drawParticle(p);
            }

            // Keep this particle - use swap-and-pop pattern
            if (writeIndex !== i) {
                this.particles[writeIndex] = p;
            }
            writeIndex++;
        }

        // Truncate array to remove dead particles (O(1) operation)
        this.particles.length = writeIndex;
    }

    destroy(): void {
        if (this.app && this.container) {
            this.app.stage.removeChild(this.container);
        }
        this.container.destroy({ children: true });
        this.particles = [];
        this.pool.clear();
    }
}
