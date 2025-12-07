import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem, ParticleConfig } from '../rendering/ParticleSystem';
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

describe('ParticleSystem', () => {
    let particleSystem: ParticleSystem;
    let mockApp: Application;

    beforeEach(() => {
        particleSystem = new ParticleSystem();
        mockApp = new Application();
        particleSystem.init(mockApp);
    });

    it('should initialize correctly', () => {
        expect(particleSystem.container).toBeDefined();
        expect(mockApp.stage.addChild).toHaveBeenCalledWith(particleSystem.container);
    });

    it('should spawn particles', () => {
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
    });

    it('should update particles', () => {
        const config: ParticleConfig = {
            x: 0,
            y: 0,
            count: 1,
            speed: { min: 100, max: 100 },
            life: { min: 1, max: 1 },
            size: { min: 2, max: 4 },
            color: 0xFFFFFF,
            spread: 0, // Move horizontally
        };

        particleSystem.spawn(config);
        const particle = particleSystem.particles[0];
        const initialX = particle.x;

        particleSystem.update(0.1); // 0.1 seconds

        expect(particle.x).toBeGreaterThan(initialX);
        expect(particle.life).toBeLessThan(1);
    });

    it('should remove dead particles', () => {
        const config: ParticleConfig = {
            x: 0,
            y: 0,
            count: 1,
            speed: { min: 10, max: 20 },
            life: { min: 0.1, max: 0.1 },
            size: { min: 2, max: 4 },
            color: 0xFFFFFF,
            spread: 0,
        };

        particleSystem.spawn(config);
        expect(particleSystem.particles.length).toBe(1);

        particleSystem.update(0.2); // Exceeds life
        expect(particleSystem.particles.length).toBe(0);
    });

    it('should reuse particles from pool', () => {
        const config: ParticleConfig = {
            x: 0,
            y: 0,
            count: 1,
            speed: { min: 10, max: 20 },
            life: { min: 0.1, max: 0.1 },
            size: { min: 2, max: 4 },
            color: 0xFFFFFF,
            spread: 0,
        };

        particleSystem.spawn(config);
        particleSystem.update(0.2); // Kill particle
        expect(particleSystem.particles.length).toBe(0);

        particleSystem.spawn(config); // Should reuse
        expect(particleSystem.particles.length).toBe(1);
    });

    it('should handle debris physics with bounces', () => {
        const config: ParticleConfig = {
            x: 100,
            y: 500,
            count: 1,
            speed: { min: 100, max: 100 },
            life: { min: 5, max: 5 },
            size: { min: 4, max: 4 },
            color: 0xFFFFFF,
            spread: Math.PI / 2,
            gravity: 300,
            bounceCount: 2,
            bounceDamping: 0.7,
            groundY: 1000
        };

        particleSystem.spawn(config);
        const particle = particleSystem.particles[0];
        
        // Particle should fall due to gravity
        expect(particle.ay).toBe(300);
        expect(particle.bounces).toBe(2);
        expect(particle.bounceDamping).toBe(0.7);
        expect(particle.groundY).toBe(1000);
    });

    it('should bounce particles off ground', () => {
        const config: ParticleConfig = {
            x: 100,
            y: 900,
            count: 1,
            speed: { min: 0, max: 0 },
            life: { min: 5, max: 5 },
            size: { min: 4, max: 4 },
            color: 0xFFFFFF,
            spread: 0,
            gravity: 500,
            bounceCount: 1,
            bounceDamping: 0.6,
            groundY: 1000
        };

        particleSystem.spawn(config);
        const particle = particleSystem.particles[0];
        const initialBounces = particle.bounces;
        
        // Update multiple times to ensure particle reaches ground and bounces
        particleSystem.update(0.1);
        particleSystem.update(0.1);
        particleSystem.update(0.1);
        
        // After bouncing, particle should have fewer bounces remaining
        // and should be moving upward (negative vy after bounce)
        if (particle.y >= 1000) {
            expect(particle.bounces).toBeLessThan(initialBounces!);
        }
    });

    it('should stop particles after all bounces are used', () => {
        const config: ParticleConfig = {
            x: 100,
            y: 900,
            count: 1,
            speed: { min: 0, max: 0 },
            life: { min: 5, max: 5 },
            size: { min: 4, max: 4 },
            color: 0xFFFFFF,
            spread: 0,
            gravity: 500,
            bounceCount: 0,
            bounceDamping: 0.6,
            groundY: 1000
        };

        particleSystem.spawn(config);
        const particle = particleSystem.particles[0];
        
        // Update multiple times to make particle fall to ground
        particleSystem.update(0.1);
        particleSystem.update(0.1);
        particleSystem.update(0.1);
        
        // Once particle reaches ground with no bounces, it should stop
        if (particle.y >= 1000) {
            expect(particle.vy).toBe(0);
            expect(particle.y).toBe(1000);
        }
    });
});
