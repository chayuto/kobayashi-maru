import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ParticleSystem, ParticleConfig } from '../rendering/ParticleSystem';
import { Application } from 'pixi.js';

// Mock PIXI
vi.mock('pixi.js', () => {
    const Graphics = vi.fn();
    Graphics.prototype.clear = vi.fn();
    Graphics.prototype.beginFill = vi.fn();
    Graphics.prototype.drawCircle = vi.fn();
    Graphics.prototype.endFill = vi.fn();
    Graphics.prototype.destroy = vi.fn();

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
});
