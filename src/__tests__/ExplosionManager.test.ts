/**
 * Tests for ExplosionManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ExplosionManager } from '../rendering/ExplosionManager';
import { ParticleSystem } from '../rendering/ParticleSystem';
import { ShockwaveRenderer } from '../rendering/ShockwaveRenderer';

// Mock dependencies
vi.mock('../rendering/ParticleSystem');
vi.mock('../rendering/ShockwaveRenderer');

describe('ExplosionManager', () => {
  let explosionManager: ExplosionManager;
  let mockParticleSystem: ParticleSystem;
  let mockShockwaveRenderer: ShockwaveRenderer;

  beforeEach(() => {
    // Create mocked instances
    mockParticleSystem = {
      spawn: vi.fn()
    } as unknown as ParticleSystem;

    mockShockwaveRenderer = {
      create: vi.fn().mockReturnValue('shockwave-id')
    } as unknown as ShockwaveRenderer;

    explosionManager = new ExplosionManager(mockParticleSystem, mockShockwaveRenderer);
  });

  describe('simple explosions', () => {
    it('should create a simple explosion with particles only', () => {
      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      const id = explosionManager.createSimpleExplosion(100, 100, particleConfig);
      
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
    });

    it('should create a simple explosion with particles and shockwave', () => {
      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      const shockwaveConfig = {
        radius: 200,
        color: 0xFF6600,
        duration: 1.0
      };

      const id = explosionManager.createSimpleExplosion(100, 100, particleConfig, shockwaveConfig);
      
      expect(id).toBeDefined();
    });

    it('should trigger particles on update', () => {
      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      explosionManager.createSimpleExplosion(100, 100, particleConfig);
      explosionManager.update(0.016); // One frame

      expect(mockParticleSystem.spawn).toHaveBeenCalledWith(
        expect.objectContaining({
          x: 100,
          y: 100,
          count: 20
        })
      );
    });

    it('should trigger shockwave on update', () => {
      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      const shockwaveConfig = {
        radius: 200,
        color: 0xFF6600,
        duration: 1.0
      };

      explosionManager.createSimpleExplosion(100, 100, particleConfig, shockwaveConfig);
      explosionManager.update(0.016); // One frame

      expect(mockShockwaveRenderer.create).toHaveBeenCalledWith(
        100,
        100,
        200,
        0xFF6600,
        1.0
      );
    });
  });

  describe('multi-stage explosions', () => {
    it('should create a multi-stage explosion', () => {
      const sequence = {
        stages: [
          {
            delay: 0,
            particles: {
              x: 0,
              y: 0,
              count: 20,
              speed: { min: 50, max: 150 },
              life: { min: 0.2, max: 0.5 },
              size: { min: 2, max: 6 },
              color: 0xFF6600,
              spread: Math.PI * 2
            }
          },
          {
            delay: 0.1,
            particles: {
              x: 0,
              y: 0,
              count: 30,
              speed: { min: 30, max: 100 },
              life: { min: 0.5, max: 1.0 },
              size: { min: 4, max: 8 },
              color: 0xFF0000,
              spread: Math.PI * 2
            }
          }
        ]
      };

      const id = explosionManager.createExplosion(100, 100, sequence);
      
      expect(id).toBeDefined();
    });

    it('should trigger stages in sequence', () => {
      const sequence = {
        stages: [
          {
            delay: 0,
            particles: {
              x: 0,
              y: 0,
              count: 20,
              speed: { min: 50, max: 150 },
              life: { min: 0.2, max: 0.5 },
              size: { min: 2, max: 6 },
              color: 0xFF6600,
              spread: Math.PI * 2
            }
          },
          {
            delay: 0.1,
            particles: {
              x: 0,
              y: 0,
              count: 30,
              speed: { min: 30, max: 100 },
              life: { min: 0.5, max: 1.0 },
              size: { min: 4, max: 8 },
              color: 0xFF0000,
              spread: Math.PI * 2
            }
          }
        ]
      };

      explosionManager.createExplosion(100, 100, sequence);
      
      // First update - triggers first stage
      explosionManager.update(0.016);
      expect(mockParticleSystem.spawn).toHaveBeenCalledTimes(1);

      // Update past second stage delay
      explosionManager.update(0.1);
      expect(mockParticleSystem.spawn).toHaveBeenCalledTimes(2);
    });

    it('should support shockwaves in stages', () => {
      const sequence = {
        stages: [
          {
            delay: 0,
            shockwave: {
              radius: 150,
              color: 0xFFFFFF,
              duration: 0.5
            }
          },
          {
            delay: 0.2,
            shockwave: {
              radius: 300,
              color: 0xFF6600,
              duration: 1.0
            }
          }
        ]
      };

      explosionManager.createExplosion(100, 100, sequence);
      
      // First update - triggers first stage
      explosionManager.update(0.016);
      expect(mockShockwaveRenderer.create).toHaveBeenCalledTimes(1);

      // Update past second stage delay
      explosionManager.update(0.2);
      expect(mockShockwaveRenderer.create).toHaveBeenCalledTimes(2);
    });

    it('should remove completed explosions', () => {
      const sequence = {
        stages: [
          {
            delay: 0,
            particles: {
              x: 0,
              y: 0,
              count: 20,
              speed: { min: 50, max: 150 },
              life: { min: 0.2, max: 0.5 },
              size: { min: 2, max: 6 },
              color: 0xFF6600,
              spread: Math.PI * 2
            }
          }
        ]
      };

      explosionManager.createExplosion(100, 100, sequence);
      expect(explosionManager.getActiveCount()).toBe(1);

      // Trigger all stages
      explosionManager.update(0.016);
      expect(explosionManager.getActiveCount()).toBe(0);
    });
  });

  describe('explosion management', () => {
    it('should track active explosions', () => {
      expect(explosionManager.getActiveCount()).toBe(0);

      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      explosionManager.createSimpleExplosion(100, 100, particleConfig);
      
      // Before update, explosion is tracked
      expect(explosionManager.getActiveCount()).toBe(1);

      // After update, explosion completes
      explosionManager.update(0.016);
      expect(explosionManager.getActiveCount()).toBe(0);
    });

    it('should clear all explosions', () => {
      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      explosionManager.createSimpleExplosion(100, 100, particleConfig);
      explosionManager.createSimpleExplosion(200, 200, particleConfig);
      
      expect(explosionManager.getActiveCount()).toBe(2);

      explosionManager.clear();
      expect(explosionManager.getActiveCount()).toBe(0);
    });

    it('should handle multiple concurrent explosions', () => {
      const particleConfig = {
        x: 0,
        y: 0,
        count: 20,
        speed: { min: 50, max: 150 },
        life: { min: 0.2, max: 0.5 },
        size: { min: 2, max: 6 },
        color: 0xFF6600,
        spread: Math.PI * 2
      };

      explosionManager.createSimpleExplosion(100, 100, particleConfig);
      explosionManager.createSimpleExplosion(200, 200, particleConfig);
      explosionManager.createSimpleExplosion(300, 300, particleConfig);
      
      expect(explosionManager.getActiveCount()).toBe(3);

      explosionManager.update(0.016);
      
      // All should trigger and complete
      expect(explosionManager.getActiveCount()).toBe(0);
    });
  });
});
