/**
 * Tests for Faction-Varied Death Explosions
 * Verifies rank-based explosion logic in damageSystem
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addComponent } from 'bitecs';
import { createGameWorld } from '../ecs/world';
import { Health, Faction, Position, SpriteRef, EnemyVariant } from '../ecs/components';
import { FactionId } from '../types/constants';
import { RENDERING_CONFIG } from '../config/rendering.config';
import { PoolManager } from '../ecs/PoolManager';

// Mock audio
vi.mock('../audio', () => ({
  AudioManager: {
    getInstance: () => ({
      play: vi.fn(),
    }),
  },
  SoundType: {
    EXPLOSION_SMALL: 'explosion_small',
    EXPLOSION_LARGE: 'explosion_large',
  },
}));

// Mock rendering
const mockSpawn = vi.fn();
vi.mock('../rendering', () => ({
  ParticleSystem: vi.fn(),
  EFFECTS: {
    EXPLOSION_SMALL: { count: 20, color: 0xFF6600 },
    EXPLOSION_LARGE: { count: 40, color: 0xFF4400 },
    FIRE_EXPLOSION: { count: 60, color: 0xFFFFFF },
    ELITE_FIRE_EXPLOSION: { count: 30, color: 0xFFFFFF },
    METAL_DEBRIS: { count: 25, color: 0xAAAAAA },
    SMOKE_PLUME: { count: 30, color: 0x444444 },
  },
}));

// Mock services
const mockShockwaveCreate = vi.fn();
const mockScreenShake = vi.fn();
vi.mock('../core/services', () => ({
  getServices: () => ({
    tryGet: (name: string) => {
      if (name === 'shockwaveRenderer') return { create: mockShockwaveCreate };
      if (name === 'screenShake') return { shake: mockScreenShake };
      return undefined;
    },
  }),
}));

// Mock EventBus
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      emit: vi.fn(),
    }),
  },
}));

import { createDamageSystem } from '../systems/damageSystem';

describe('Faction-Varied Death Explosions', () => {
  let world: ReturnType<typeof createGameWorld>;
  const particleSystem = { spawn: mockSpawn } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    world = createGameWorld();
    PoolManager.getInstance().init(world);
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  function createEnemy(rank: number, factionId: number = FactionId.KLINGON): number {
    const eid = PoolManager.getInstance().acquireEnemy();

    addComponent(world, eid, Health);
    addComponent(world, eid, Faction);
    addComponent(world, eid, Position);
    addComponent(world, eid, SpriteRef);
    addComponent(world, eid, EnemyVariant);

    Health.current[eid] = 0; // Dead
    Health.max[eid] = 100;
    Faction.id[eid] = factionId;
    Position.x[eid] = 500;
    Position.y[eid] = 300;
    SpriteRef.index[eid] = 0;
    EnemyVariant.rank[eid] = rank;

    return eid;
  }

  it('should use EXPLOSION_SMALL for normal enemies (rank 0)', () => {
    // Arrange
    createEnemy(0);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world);

    // Assert
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ count: 20 })
    );
    expect(mockShockwaveCreate).not.toHaveBeenCalled();
    expect(mockScreenShake).not.toHaveBeenCalled();
  });

  it('should use enhanced explosion + shockwave for elite enemies (rank 1)', () => {
    // Arrange
    createEnemy(1);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world);

    // Assert
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({
        count: RENDERING_CONFIG.EXPLOSIONS.ELITE_PARTICLE_COUNT,
      })
    );
    expect(mockShockwaveCreate).toHaveBeenCalledWith(
      500, 300,
      RENDERING_CONFIG.EXPLOSIONS.ELITE_SHOCKWAVE_RADIUS,
      expect.any(Number),
      RENDERING_CONFIG.EXPLOSIONS.ELITE_SHOCKWAVE_DURATION
    );
  });

  it('should use multi-stage explosion + screen shake for boss enemies (rank 2)', () => {
    // Arrange
    vi.useFakeTimers();
    createEnemy(2);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world);

    // Assert - Stage 1: immediate fire explosion
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({
        count: RENDERING_CONFIG.EXPLOSIONS.BOSS_PARTICLE_COUNT,
      })
    );

    // Screen shake triggered
    expect(mockScreenShake).toHaveBeenCalledWith(
      RENDERING_CONFIG.EXPLOSIONS.BOSS_SHAKE_INTENSITY,
      RENDERING_CONFIG.EXPLOSIONS.BOSS_SHAKE_DURATION
    );

    // Shockwave triggered
    expect(mockShockwaveCreate).toHaveBeenCalledWith(
      500, 300, 120, expect.any(Number), expect.any(Number)
    );

    // Stage 2: delayed metal debris
    vi.advanceTimersByTime(200);
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ count: 25 })
    );

    // Stage 3: delayed smoke plume
    vi.advanceTimersByTime(200);
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ count: 30 })
    );

    vi.useRealTimers();
  });

  it('should not trigger shockwave for normal enemies', () => {
    // Arrange
    createEnemy(0);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world);

    // Assert
    expect(mockShockwaveCreate).not.toHaveBeenCalled();
  });

  it('should not trigger screen shake for elite enemies', () => {
    // Arrange
    createEnemy(1);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world);

    // Assert
    expect(mockScreenShake).not.toHaveBeenCalled();
  });
});
