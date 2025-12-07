import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem, ParticleConfig, EmitterPattern } from '../rendering/ParticleSystem';
import { Application } from 'pixi.js';

// Mock PIXI
vi.mock('pixi.js', () => {
    const Graphics = vi.fn();
    Graphics.prototype.clear = vi.fn().mockReturnThis();
    Graphics.prototype.beginFill = vi.fn().mockReturnThis();
    Graphics.prototype.drawCircle = vi.fn().mockReturnThis();
    Graphics.prototype.drawRect = vi.fn().mockReturnThis();
    Graphics.prototype.moveTo = vi.fn().mockReturnThis();
    Graphics.prototype.lineTo = vi.fn().mockReturnThis();
    Graphics.prototype.closePath = vi.fn().mockReturnThis();
    Graphics.prototype.lineStyle = vi.fn().mockReturnThis();
    Graphics.prototype.endFill = vi.fn().mockReturnThis();
    Graphics.prototype.destroy = vi.fn();
    Graphics.prototype.x = 0;
    Graphics.prototype.y = 0;
    Graphics.prototype.alpha = 1;
    Graphics.prototype.rotation = 0;
    Graphics.prototype.scale = { set: vi.fn() };

    const Container = vi.fn();
    Container.prototype.addChild = vi.fn();
    Container.prototype.removeChild = vi.fn();
    Container.prototype.destroy = vi.fn();

    const Application = vi.fn();
    Application.prototype.stage = {
        addChild: vi.fn(),
        removeChild: vi.fn(),
    };

    return { Application, Container, Graphics };
});

describe('Advanced Particle System', () => {
    let particleSystem: ParticleSystem;
    let mockApp: Application;

    beforeEach(() => {
        particleSystem = new ParticleSystem();
        mockApp = new Application();
        particleSystem.init(mockApp);
    });

    describe('Sprite-based particles', () => {
        it('should support circle sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'circle',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });

        it('should support square sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'square',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });

        it('should support star sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'star',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });

        it('should support spark sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'spark',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });

        it('should support smoke sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'smoke',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });

        it('should support fire sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'fire',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });

        it('should support energy sprite particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 5,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                sprite: 'energy',
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(5);
        });
    });

    describe('Color gradient interpolation', () => {
        it('should interpolate color gradients correctly', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                colorGradient: {
                    stops: [
                        { time: 0, color: 0xFF0000, alpha: 1.0 },
                        { time: 1, color: 0x0000FF, alpha: 0.0 }
                    ]
                },
                spread: 0,
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            
            // Initially should be red
            expect(particle.color).toBe(0xFF0000);
            expect(particle.alpha).toBe(1.0);

            // After half life, should be interpolated
            particleSystem.update(0.5);
            expect(particle.alpha).toBeCloseTo(0.5, 1);
        });

        it('should handle single stop gradient', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                colorGradient: {
                    stops: [
                        { time: 0, color: 0xFF0000, alpha: 1.0 }
                    ]
                },
                spread: 0,
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            
            expect(particle.color).toBe(0xFF0000);
            expect(particle.alpha).toBe(1.0);
        });

        it('should handle multi-stop gradients', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                colorGradient: {
                    stops: [
                        { time: 0, color: 0xFF0000, alpha: 1.0 },
                        { time: 0.5, color: 0x00FF00, alpha: 0.8 },
                        { time: 1, color: 0x0000FF, alpha: 0.0 }
                    ]
                },
                spread: 0,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(1);
            
            // Update to move through gradient
            particleSystem.update(0.25);
            expect(particleSystem.particles[0].life).toBeLessThan(1);
        });
    });

    describe('Trail effects', () => {
        it('should render particle trails when enabled', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                trail: {
                    enabled: true,
                    length: 5,
                    fadeRate: 0.3,
                    width: 2
                }
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            
            expect(particle.trail).toBeDefined();
            expect(particle.trail?.positions.length).toBe(1);

            // Update to add trail positions
            particleSystem.update(0.1);
            expect(particle.trail?.positions.length).toBeGreaterThan(1);
        });

        it('should limit trail length', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                trail: {
                    enabled: true,
                    length: 3,
                    fadeRate: 0.3,
                    width: 2
                }
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];

            // Update multiple times to fill trail
            for (let i = 0; i < 10; i++) {
                particleSystem.update(0.01);
            }

            // Trail should not exceed max length
            expect(particle.trail?.positions.length).toBeLessThanOrEqual(3);
        });
    });

    describe('Emitter patterns', () => {
        it('should emit particles in circular pattern', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
                emitterPattern: EmitterPattern.CIRCULAR
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);
            
            // Particles should have different velocities
            const velocities = particleSystem.particles.map(p => ({ vx: p.vx, vy: p.vy }));
            const uniqueVelocities = new Set(velocities.map(v => `${v.vx},${v.vy}`));
            expect(uniqueVelocities.size).toBeGreaterThan(1);
        });

        it('should emit particles in cone pattern', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
                emitterPattern: EmitterPattern.CONE,
                emitterAngle: 0,
                emitterWidth: Math.PI / 4
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);
        });

        it('should emit particles in ring pattern', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
                emitterPattern: EmitterPattern.RING
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);
        });

        it('should emit particles in spiral pattern', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
                emitterPattern: EmitterPattern.SPIRAL
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);
        });

        it('should emit particles in burst pattern', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                emitterPattern: EmitterPattern.BURST,
                emitterAngle: Math.PI / 2
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);
            
            // All particles should have same direction
            const firstVx = particleSystem.particles[0].vx;
            const firstVy = particleSystem.particles[0].vy;
            particleSystem.particles.forEach(p => {
                expect(p.vx).toBeCloseTo(firstVx, 5);
                expect(p.vy).toBeCloseTo(firstVy, 5);
            });
        });

        it('should emit particles in fountain pattern', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
                emitterPattern: EmitterPattern.FOUNTAIN,
                emitterAngle: -Math.PI / 2,
                emitterWidth: Math.PI / 4
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);
        });
    });

    describe('Physics', () => {
        it('should apply gravity to particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 0, max: 0 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                gravity: 100
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            const initialY = particle.y;

            particleSystem.update(0.1);
            
            // Particle should have moved down due to gravity
            expect(particle.y).toBeGreaterThan(initialY);
            expect(particle.vy).toBeGreaterThan(0);
        });

        it('should apply negative gravity (rise upward)', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 0, max: 0 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                gravity: -100
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            const initialY = particle.y;

            particleSystem.update(0.1);
            
            // Particle should have moved up due to negative gravity
            expect(particle.y).toBeLessThan(initialY);
            expect(particle.vy).toBeLessThan(0);
        });

        it('should apply drag to particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                drag: 0.5
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            const initialVx = particle.vx;

            particleSystem.update(0.1);
            
            // Velocity should have decreased due to drag
            expect(Math.abs(particle.vx)).toBeLessThan(Math.abs(initialVx));
        });

        it('should combine gravity and drag', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 100, max: 100 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                gravity: 50,
                drag: 0.95
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];

            particleSystem.update(0.1);
            
            // Should have both drag and gravity effects
            expect(particle.ay).toBe(50);
            expect(particle.drag).toBe(0.95);
        });
    });

    describe('Rotation and scale', () => {
        it('should rotate particles', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                rotation: { min: 0, max: Math.PI },
                rotationSpeed: { min: 1, max: 2 }
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            const initialRotation = particle.rotation;

            particleSystem.update(0.1);
            
            // Rotation should have changed
            expect(particle.rotation).not.toBe(initialRotation);
        });

        it('should scale particles over lifetime', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 1,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: 0,
                scaleStart: 0.5,
                scaleEnd: 2.0
            };

            particleSystem.spawn(config);
            const particle = particleSystem.particles[0];
            
            // Initially should be at start scale
            expect(particle.scale).toBe(0.5);

            // After half life, should be interpolated
            particleSystem.update(0.5);
            expect(particle.scale).toBeGreaterThan(0.5);
            expect(particle.scale).toBeLessThan(2.0);
        });
    });

    describe('Particle budget', () => {
        it('should respect particle budget', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 3000, // More than budget
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            
            // Should not exceed max particles
            expect(particleSystem.particles.length).toBeLessThanOrEqual(2000);
        });

        it('should not spawn particles when budget is exhausted', () => {
            // Fill up the budget
            const config1: ParticleConfig = {
                x: 100,
                y: 100,
                count: 2000,
                speed: { min: 10, max: 20 },
                life: { min: 10, max: 10 }, // Long life to keep them around
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config1);
            expect(particleSystem.particles.length).toBe(2000);

            // Try to spawn more
            const config2: ParticleConfig = {
                x: 100,
                y: 100,
                count: 100,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config2);
            
            // Should still be at budget
            expect(particleSystem.particles.length).toBe(2000);
        });

        it('should allow spawning after particles die', () => {
            // Spawn particles with short life
            const config1: ParticleConfig = {
                x: 100,
                y: 100,
                count: 100,
                speed: { min: 10, max: 20 },
                life: { min: 0.1, max: 0.1 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config1);
            expect(particleSystem.particles.length).toBe(100);

            // Let them die
            particleSystem.update(0.2);
            expect(particleSystem.particles.length).toBe(0);

            // Should be able to spawn more
            particleSystem.spawn(config1);
            expect(particleSystem.particles.length).toBe(100);
        });
    });

    describe('Backward compatibility', () => {
        it('should work with old particle configs (no new features)', () => {
            const config: ParticleConfig = {
                x: 100,
                y: 100,
                count: 10,
                speed: { min: 10, max: 20 },
                life: { min: 1, max: 2 },
                size: { min: 2, max: 4 },
                color: 0xFFFFFF,
                spread: Math.PI * 2,
            };

            particleSystem.spawn(config);
            expect(particleSystem.particles.length).toBe(10);

            particleSystem.update(0.1);
            expect(particleSystem.particles.length).toBe(10);
        });
    });
});
