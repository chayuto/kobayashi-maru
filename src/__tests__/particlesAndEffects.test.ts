// @vitest-environment jsdom

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

import { ParticlePool } from '../rendering/particles/ParticlePool';
import { ParticleEmitter } from '../rendering/particles/ParticleEmitter';
import { ParticleRenderer } from '../rendering/particles/ParticleRenderer';
import { EmitterPattern } from '../rendering/particles/types';
import type { Particle, ParticleConfig, ColorGradient } from '../rendering/particles/types';
import { EFFECTS } from '../rendering/effectPresets';
import { Container, Graphics } from 'pixi.js';

// ----------------------------------------------------------------
// Helper: create a mock Particle object
// ----------------------------------------------------------------
function createMockParticle(overrides: Partial<Particle> = {}): Particle {
  const sprite = new Graphics() as unknown as Particle['sprite'];
  return {
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    ax: 0,
    ay: 0,
    life: 1,
    maxLife: 1,
    size: 4,
    color: 0xFFFFFF,
    alpha: 1,
    sprite,
    spriteType: 'circle',
    rotation: 0,
    rotationSpeed: 0,
    scale: 1,
    scaleStart: 1,
    scaleEnd: 1,
    drag: 1,
    colorGradient: undefined,
    trail: undefined,
    ...overrides,
  };
}

// ----------------------------------------------------------------
// Helper: create a minimal ParticleConfig
// ----------------------------------------------------------------
function createMinimalConfig(overrides: Partial<ParticleConfig> = {}): ParticleConfig {
  return {
    x: 100,
    y: 100,
    count: 5,
    speed: { min: 50, max: 100 },
    life: { min: 0.5, max: 1.0 },
    size: { min: 2, max: 6 },
    spread: Math.PI * 2,
    ...overrides,
  };
}

// ================================================================
// ParticlePool
// ================================================================
describe('ParticlePool', () => {
  let pool: ParticlePool;

  beforeEach(() => {
    pool = new ParticlePool();
  });

  it('should return a new particle when pool is empty', () => {
    const particle = pool.acquire();
    expect(particle).toBeDefined();
    expect(particle.x).toBe(0);
    expect(particle.y).toBe(0);
    expect(particle.life).toBe(0);
    expect(particle.spriteType).toBe('circle');
  });

  it('should report size 0 for a fresh pool', () => {
    expect(pool.size).toBe(0);
  });

  it('should increase pool size when a particle is released', () => {
    const particle = pool.acquire();
    const container = new Container() as unknown as Container;
    pool.release(particle, container);
    expect(pool.size).toBe(1);
  });

  it('should reuse a released particle on next acquire', () => {
    const particle = pool.acquire();
    particle.x = 42;
    const container = new Container() as unknown as Container;
    pool.release(particle, container);

    const reused = pool.acquire();
    // Same object reference
    expect(reused).toBe(particle);
    expect(reused.x).toBe(42);
  });

  it('should remove sprite from container on release', () => {
    const particle = pool.acquire();
    const container = new Container() as unknown as Container;
    pool.release(particle, container);
    expect(container.removeChild).toHaveBeenCalledWith(particle.sprite);
  });

  it('should clean trail graphics on release when trail exists', () => {
    const trailGraphics = new Graphics() as unknown as Particle['sprite'];
    const particle = createMockParticle({
      trail: {
        positions: [{ x: 1, y: 2 }, { x: 3, y: 4 }],
        config: { enabled: true, length: 5, fadeRate: 0.3, width: 1 },
        graphics: trailGraphics,
      },
    });
    const container = new Container() as unknown as Container;
    pool.release(particle, container);

    expect(container.removeChild).toHaveBeenCalledWith(trailGraphics);
    expect(particle.trail!.positions).toEqual([]);
  });

  it('should reset trail positions when acquiring a pooled particle with trail', () => {
    const trailGraphics = new Graphics() as unknown as Particle['sprite'];
    const particle = createMockParticle({
      trail: {
        positions: [{ x: 10, y: 20 }],
        config: { enabled: true, length: 5, fadeRate: 0.3, width: 1 },
        graphics: trailGraphics,
      },
    });
    const container = new Container() as unknown as Container;
    pool.release(particle, container);

    const reused = pool.acquire();
    expect(reused.trail!.positions).toEqual([]);
  });

  it('should clear all pooled particles', () => {
    const container = new Container() as unknown as Container;
    const p1 = pool.acquire();
    const p2 = pool.acquire();
    pool.release(p1, container);
    pool.release(p2, container);
    expect(pool.size).toBe(2);

    pool.clear();
    expect(pool.size).toBe(0);
  });

  it('should create a fresh particle with correct defaults when pool is empty', () => {
    const particle = pool.acquire();
    expect(particle.vx).toBe(0);
    expect(particle.vy).toBe(0);
    expect(particle.ax).toBe(0);
    expect(particle.ay).toBe(0);
    expect(particle.alpha).toBe(0);
    expect(particle.scale).toBe(1);
    expect(particle.scaleStart).toBe(1);
    expect(particle.scaleEnd).toBe(1);
    expect(particle.drag).toBe(1);
    expect(particle.rotation).toBe(0);
    expect(particle.rotationSpeed).toBe(0);
    expect(particle.colorGradient).toBeUndefined();
    expect(particle.trail).toBeUndefined();
  });
});

// ================================================================
// ParticleEmitter
// ================================================================
describe('ParticleEmitter', () => {
  let emitter: ParticleEmitter;

  beforeEach(() => {
    emitter = new ParticleEmitter();
  });

  it('should return a velocity object with vx and vy for CIRCULAR pattern', () => {
    const config = createMinimalConfig({ emitterPattern: EmitterPattern.CIRCULAR });
    const vel = emitter.calculateVelocity(config);
    expect(vel).toHaveProperty('vx');
    expect(vel).toHaveProperty('vy');
    expect(typeof vel.vx).toBe('number');
    expect(typeof vel.vy).toBe('number');
  });

  it('should produce a speed within the configured min/max range', () => {
    const config = createMinimalConfig({
      speed: { min: 100, max: 100 },
      emitterPattern: EmitterPattern.CIRCULAR,
    });
    const vel = emitter.calculateVelocity(config);
    const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    expect(speed).toBeCloseTo(100, 0);
  });

  it('should default to CIRCULAR pattern when none is specified', () => {
    const config = createMinimalConfig();
    delete (config as unknown as Record<string, unknown>).emitterPattern;
    // Should not throw
    const vel = emitter.calculateVelocity(config);
    expect(typeof vel.vx).toBe('number');
  });

  it('should calculate velocity for CONE pattern', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.CONE,
      emitterAngle: 0,
      emitterWidth: Math.PI * 0.5,
      speed: { min: 100, max: 100 },
    });
    const vel = emitter.calculateVelocity(config);
    const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    expect(speed).toBeCloseTo(100, 0);
  });

  it('should calculate velocity for RING pattern', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.RING,
      speed: { min: 50, max: 50 },
    });
    const vel = emitter.calculateVelocity(config);
    const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    expect(speed).toBeCloseTo(50, 0);
  });

  it('should calculate velocity for SPIRAL pattern with incrementing counter', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.SPIRAL,
      speed: { min: 100, max: 100 },
    });
    const vel1 = emitter.calculateVelocity(config);
    const vel2 = emitter.calculateVelocity(config);
    // Consecutive spiral calls should produce different angles
    const angle1 = Math.atan2(vel1.vy, vel1.vx);
    const angle2 = Math.atan2(vel2.vy, vel2.vx);
    expect(angle1).not.toBeCloseTo(angle2, 5);
  });

  it('should reset spiral counter', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.SPIRAL,
      speed: { min: 100, max: 100 },
    });
    emitter.calculateVelocity(config);
    emitter.calculateVelocity(config);
    emitter.resetSpiral();

    // After reset, the angle should be the same as the first call (counter=0)
    const velAfterReset = emitter.calculateVelocity(config);
    const expectedAngle = 0 * 0.5; // counter=0
    const actualAngle = Math.atan2(velAfterReset.vy, velAfterReset.vx);
    expect(actualAngle).toBeCloseTo(expectedAngle, 5);
  });

  it('should calculate velocity for BURST pattern using emitterAngle', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.BURST,
      emitterAngle: Math.PI / 4,
      speed: { min: 100, max: 100 },
    });
    const vel = emitter.calculateVelocity(config);
    const angle = Math.atan2(vel.vy, vel.vx);
    expect(angle).toBeCloseTo(Math.PI / 4, 5);
  });

  it('should calculate velocity for FOUNTAIN pattern', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.FOUNTAIN,
      emitterAngle: -Math.PI / 2,
      emitterWidth: Math.PI / 4,
      speed: { min: 100, max: 100 },
    });
    const vel = emitter.calculateVelocity(config);
    const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
    expect(speed).toBeCloseTo(100, 0);
    // Fountain points upward, so vy should be negative (mostly)
    // The angle ranges from -PI/2 +/- PI/8, so vy should be negative
    expect(vel.vy).toBeLessThan(0);
  });

  it('should use spread as fallback for CONE when emitterWidth is not specified', () => {
    const config = createMinimalConfig({
      emitterPattern: EmitterPattern.CONE,
      emitterAngle: 0,
      speed: { min: 100, max: 100 },
      spread: Math.PI * 0.2,
    });
    // Should not throw and should produce valid velocity
    const vel = emitter.calculateVelocity(config);
    expect(typeof vel.vx).toBe('number');
    expect(typeof vel.vy).toBe('number');
  });
});

// ================================================================
// ParticleRenderer
// ================================================================
describe('ParticleRenderer', () => {
  let renderer: ParticleRenderer;

  beforeEach(() => {
    renderer = new ParticleRenderer();
  });

  describe('drawParticle', () => {
    it('should draw a circle for circle sprite type', () => {
      const particle = createMockParticle({ spriteType: 'circle', size: 5 });
      renderer.drawParticle(particle);
      expect(particle.sprite.clear).toHaveBeenCalled();
      expect(particle.sprite.beginFill).toHaveBeenCalled();
      expect(particle.sprite.drawCircle).toHaveBeenCalledWith(0, 0, 5);
      expect(particle.sprite.endFill).toHaveBeenCalled();
    });

    it('should draw a rect for square sprite type', () => {
      const particle = createMockParticle({ spriteType: 'square', size: 4 });
      renderer.drawParticle(particle);
      expect(particle.sprite.drawRect).toHaveBeenCalledWith(-4, -4, 8, 8);
    });

    it('should draw a star for star sprite type', () => {
      const particle = createMockParticle({ spriteType: 'star', size: 6 });
      renderer.drawParticle(particle);
      expect(particle.sprite.moveTo).toHaveBeenCalled();
      expect(particle.sprite.lineTo).toHaveBeenCalled();
      expect(particle.sprite.closePath).toHaveBeenCalled();
    });

    it('should draw a spark for spark sprite type', () => {
      const particle = createMockParticle({ spriteType: 'spark', size: 3 });
      renderer.drawParticle(particle);
      expect(particle.sprite.moveTo).toHaveBeenCalledWith(0, -3 * 1.5);
      expect(particle.sprite.closePath).toHaveBeenCalled();
    });

    it('should draw a circle for smoke sprite type', () => {
      const particle = createMockParticle({ spriteType: 'smoke', size: 8 });
      renderer.drawParticle(particle);
      expect(particle.sprite.drawCircle).toHaveBeenCalledWith(0, 0, 8);
    });

    it('should draw fire shape for fire sprite type', () => {
      const particle = createMockParticle({ spriteType: 'fire', size: 5, x: 10, y: 20 });
      renderer.drawParticle(particle);
      expect(particle.sprite.moveTo).toHaveBeenCalled();
      expect(particle.sprite.lineTo).toHaveBeenCalled();
      expect(particle.sprite.closePath).toHaveBeenCalled();
    });

    it('should draw hexagon for energy sprite type', () => {
      const particle = createMockParticle({ spriteType: 'energy', size: 5 });
      renderer.drawParticle(particle);
      expect(particle.sprite.moveTo).toHaveBeenCalled();
      // Hexagon has 6 sides, so 6 lineTo calls
      expect(particle.sprite.lineTo).toHaveBeenCalledTimes(6);
      expect(particle.sprite.closePath).toHaveBeenCalled();
    });
  });

  describe('renderTrail', () => {
    it('should not render when trail is undefined', () => {
      const particle = createMockParticle({ trail: undefined });
      // Should not throw
      renderer.renderTrail(particle);
    });

    it('should not render when trail has fewer than 2 positions', () => {
      const trailGraphics = new Graphics() as unknown as Particle['sprite'];
      const particle = createMockParticle({
        trail: {
          positions: [{ x: 0, y: 0 }],
          config: { enabled: true, length: 5, fadeRate: 0.3, width: 1 },
          graphics: trailGraphics,
        },
      });
      renderer.renderTrail(particle);
      expect(trailGraphics.clear).not.toHaveBeenCalled();
    });

    it('should render trail segments when there are 2+ positions', () => {
      const trailGraphics = new Graphics() as unknown as Particle['sprite'];
      const particle = createMockParticle({
        alpha: 0.8,
        color: 0xFF0000,
        trail: {
          positions: [
            { x: 0, y: 0 },
            { x: 10, y: 10 },
            { x: 20, y: 20 },
          ],
          config: { enabled: true, length: 5, fadeRate: 0.3, width: 2 },
          graphics: trailGraphics,
        },
      });
      renderer.renderTrail(particle);
      expect(trailGraphics.clear).toHaveBeenCalled();
      // 2 segments for 3 positions
      expect(trailGraphics.lineStyle).toHaveBeenCalledTimes(2);
      expect(trailGraphics.moveTo).toHaveBeenCalledTimes(2);
      expect(trailGraphics.lineTo).toHaveBeenCalledTimes(2);
    });
  });

  describe('interpolateColorGradient', () => {
    it('should return white with full alpha for empty gradient', () => {
      const gradient: ColorGradient = { stops: [] };
      const result = renderer.interpolateColorGradient(gradient, 0.5);
      expect(result.color).toBe(0xFFFFFF);
      expect(result.alpha).toBe(1);
    });

    it('should return the single stop color for a single-stop gradient', () => {
      const gradient: ColorGradient = {
        stops: [{ time: 0, color: 0xFF0000, alpha: 0.7 }],
      };
      const result = renderer.interpolateColorGradient(gradient, 0.5);
      expect(result.color).toBe(0xFF0000);
      expect(result.alpha).toBe(0.7);
    });

    it('should interpolate between two stops based on normalizedLife', () => {
      const gradient: ColorGradient = {
        stops: [
          { time: 0, color: 0xFF0000, alpha: 1.0 },
          { time: 1, color: 0x0000FF, alpha: 0.0 },
        ],
      };
      // normalizedLife = 0.5 means time = 1 - 0.5 = 0.5
      const result = renderer.interpolateColorGradient(gradient, 0.5);
      // At t=0.5 between 0xFF0000 and 0x0000FF:
      // R: 255 + (0-255)*0.5 = 128, G: 0, B: 0 + (255-0)*0.5 = 128
      expect(result.color).toBe((128 << 16) | (0 << 8) | 128);
      expect(result.alpha).toBeCloseTo(0.5, 1);
    });

    it('should return start color at normalizedLife=1 (time=0)', () => {
      const gradient: ColorGradient = {
        stops: [
          { time: 0, color: 0xFF0000, alpha: 1.0 },
          { time: 1, color: 0x00FF00, alpha: 0.0 },
        ],
      };
      const result = renderer.interpolateColorGradient(gradient, 1.0);
      expect(result.color).toBe(0xFF0000);
      expect(result.alpha).toBe(1.0);
    });

    it('should return end color at normalizedLife=0 (time=1)', () => {
      const gradient: ColorGradient = {
        stops: [
          { time: 0, color: 0xFF0000, alpha: 1.0 },
          { time: 1, color: 0x00FF00, alpha: 0.0 },
        ],
      };
      const result = renderer.interpolateColorGradient(gradient, 0.0);
      expect(result.color).toBe(0x00FF00);
      expect(result.alpha).toBe(0.0);
    });

    it('should handle multi-stop gradients by finding the right segment', () => {
      const gradient: ColorGradient = {
        stops: [
          { time: 0.0, color: 0xFF0000, alpha: 1.0 },
          { time: 0.5, color: 0x00FF00, alpha: 0.5 },
          { time: 1.0, color: 0x0000FF, alpha: 0.0 },
        ],
      };
      // normalizedLife = 0.25 => time = 0.75 => between stop[1](t=0.5) and stop[2](t=1.0)
      const result = renderer.interpolateColorGradient(gradient, 0.25);
      // t in segment = (0.75 - 0.5) / (1.0 - 0.5) = 0.5
      // R: 0 + (0-0)*0.5 = 0, G: 255 + (0-255)*0.5 = 128, B: 0 + (255-0)*0.5 = 128
      expect(result.color).toBe((0 << 16) | (128 << 8) | 128);
      expect(result.alpha).toBeCloseTo(0.25, 1);
    });
  });
});

// ================================================================
// Effect Presets
// ================================================================
describe('Effect Presets (EFFECTS)', () => {
  it('should define EXPLOSION_SMALL with required fields', () => {
    expect(EFFECTS.EXPLOSION_SMALL).toBeDefined();
    expect(EFFECTS.EXPLOSION_SMALL.count).toBeGreaterThan(0);
    expect(EFFECTS.EXPLOSION_SMALL.speed.min).toBeLessThanOrEqual(EFFECTS.EXPLOSION_SMALL.speed.max);
    expect(EFFECTS.EXPLOSION_SMALL.life.min).toBeLessThanOrEqual(EFFECTS.EXPLOSION_SMALL.life.max);
    expect(EFFECTS.EXPLOSION_SMALL.size.min).toBeLessThanOrEqual(EFFECTS.EXPLOSION_SMALL.size.max);
    expect(typeof EFFECTS.EXPLOSION_SMALL.color).toBe('number');
    expect(EFFECTS.EXPLOSION_SMALL.spread).toBe(Math.PI * 2);
  });

  it('should define EXPLOSION_LARGE with larger values than EXPLOSION_SMALL', () => {
    expect(EFFECTS.EXPLOSION_LARGE.count).toBeGreaterThan(EFFECTS.EXPLOSION_SMALL.count);
  });

  it('should define SHIELD_HIT with limited spread', () => {
    expect(EFFECTS.SHIELD_HIT.spread).toBeLessThan(Math.PI * 2);
    expect(EFFECTS.SHIELD_HIT.color).toBe(0x66AAFF);
  });

  it('should define MUZZLE_FLASH with short life', () => {
    expect(EFFECTS.MUZZLE_FLASH.life.max).toBeLessThan(0.5);
    expect(EFFECTS.MUZZLE_FLASH.spread).toBeLessThan(Math.PI);
  });

  it('should define FIRE_EXPLOSION with color gradient and fire sprite', () => {
    expect(EFFECTS.FIRE_EXPLOSION.sprite).toBe('fire');
    expect(EFFECTS.FIRE_EXPLOSION.colorGradient).toBeDefined();
    expect(EFFECTS.FIRE_EXPLOSION.colorGradient.stops.length).toBeGreaterThanOrEqual(2);
    expect(EFFECTS.FIRE_EXPLOSION.emitterPattern).toBe(EmitterPattern.CIRCULAR);
  });

  it('should define IMPACT_SPARKS with trail and CONE pattern', () => {
    expect(EFFECTS.IMPACT_SPARKS.sprite).toBe('spark');
    expect(EFFECTS.IMPACT_SPARKS.emitterPattern).toBe(EmitterPattern.CONE);
    expect(EFFECTS.IMPACT_SPARKS.trail).toBeDefined();
    expect(EFFECTS.IMPACT_SPARKS.trail!.enabled).toBe(true);
  });

  it('should define PLASMA_TRAIL with BURST pattern and zero spread', () => {
    expect(EFFECTS.PLASMA_TRAIL.emitterPattern).toBe(EmitterPattern.BURST);
    expect(EFFECTS.PLASMA_TRAIL.spread).toBe(0);
    expect(EFFECTS.PLASMA_TRAIL.sprite).toBe('energy');
  });

  it('should define SMOKE_PLUME with negative gravity to rise upward', () => {
    expect(EFFECTS.SMOKE_PLUME.gravity).toBeLessThan(0);
    expect(EFFECTS.SMOKE_PLUME.sprite).toBe('smoke');
    expect(EFFECTS.SMOKE_PLUME.scaleStart).toBe(1.0);
    expect(EFFECTS.SMOKE_PLUME.scaleEnd).toBe(3.0);
  });

  it('should define ENERGY_BURST with RING pattern', () => {
    expect(EFFECTS.ENERGY_BURST.emitterPattern).toBe(EmitterPattern.RING);
    expect(EFFECTS.ENERGY_BURST.sprite).toBe('energy');
  });

  it('should define SPIRAL_VORTEX with SPIRAL pattern', () => {
    expect(EFFECTS.SPIRAL_VORTEX.emitterPattern).toBe(EmitterPattern.SPIRAL);
    expect(EFFECTS.SPIRAL_VORTEX.sprite).toBe('square');
  });

  it('should define FOUNTAIN_SPRAY with FOUNTAIN pattern and positive gravity', () => {
    expect(EFFECTS.FOUNTAIN_SPRAY.emitterPattern).toBe(EmitterPattern.FOUNTAIN);
    expect(EFFECTS.FOUNTAIN_SPRAY.gravity).toBeGreaterThan(0);
    expect(EFFECTS.FOUNTAIN_SPRAY.emitterAngle).toBe(-Math.PI / 2);
  });

  it('should define METAL_DEBRIS with bounce physics', () => {
    expect(EFFECTS.METAL_DEBRIS.bounceCount).toBeDefined();
    expect(EFFECTS.METAL_DEBRIS.bounceDamping).toBeDefined();
    expect(EFFECTS.METAL_DEBRIS.groundY).toBeDefined();
    expect(EFFECTS.METAL_DEBRIS.gravity).toBeGreaterThan(0);
  });

  it('should define ELECTRIC_DISCHARGE with trail and RING pattern', () => {
    expect(EFFECTS.ELECTRIC_DISCHARGE.emitterPattern).toBe(EmitterPattern.RING);
    expect(EFFECTS.ELECTRIC_DISCHARGE.trail).toBeDefined();
    expect(EFFECTS.ELECTRIC_DISCHARGE.trail!.enabled).toBe(true);
  });

  it('should define WARP_FLASH with scale animation', () => {
    expect(EFFECTS.WARP_FLASH.scaleStart).toBe(0.5);
    expect(EFFECTS.WARP_FLASH.scaleEnd).toBe(2.0);
    expect(EFFECTS.WARP_FLASH.sprite).toBe('star');
  });

  it('should have valid speed ranges across all effect presets', () => {
    const effects = Object.values(EFFECTS);
    for (const effect of effects) {
      expect(effect.speed.min).toBeLessThanOrEqual(effect.speed.max);
      expect(effect.speed.min).toBeGreaterThanOrEqual(0);
    }
  });

  it('should have valid life ranges across all effect presets', () => {
    const effects = Object.values(EFFECTS);
    for (const effect of effects) {
      expect(effect.life.min).toBeLessThanOrEqual(effect.life.max);
      expect(effect.life.min).toBeGreaterThan(0);
    }
  });

  it('should have valid size ranges across all effect presets', () => {
    const effects = Object.values(EFFECTS);
    for (const effect of effects) {
      expect(effect.size.min).toBeLessThanOrEqual(effect.size.max);
      expect(effect.size.min).toBeGreaterThan(0);
    }
  });

  it('should have positive count for all effect presets', () => {
    const effects = Object.values(EFFECTS);
    for (const effect of effects) {
      expect(effect.count).toBeGreaterThan(0);
    }
  });

  it('should have color gradient stops in ascending time order when present', () => {
    const effects = Object.values(EFFECTS);
    for (const effect of effects) {
      const gradient = (effect as Record<string, unknown>).colorGradient as ColorGradient | undefined;
      if (gradient && gradient.stops.length > 1) {
        for (let i = 1; i < gradient.stops.length; i++) {
          expect(gradient.stops[i].time).toBeGreaterThanOrEqual(gradient.stops[i - 1].time);
        }
      }
    }
  });
});
