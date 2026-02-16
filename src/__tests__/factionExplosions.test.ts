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
    system.update(world, 0.016);

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
    system.update(world, 0.016);

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
    createEnemy(2);
    const system = createDamageSystem(particleSystem);

    // Act - Stage 1: immediate fire explosion
    system.update(world, 0.016);

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

    // Only the initial fire explosion should have spawned (not the deferred ones yet)
    const spawnCallCount = mockSpawn.mock.calls.length;
    expect(spawnCallCount).toBe(1);

    // Stage 2: advance time to trigger metal debris (delay=0.15s)
    mockSpawn.mockClear();
    system.update(world, 0.2);
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ count: 25 })
    );

    // Stage 3: advance time to trigger smoke plume (delay=0.3s, minus 0.016+0.2 already elapsed)
    mockSpawn.mockClear();
    system.update(world, 0.15);
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.objectContaining({ count: 30 })
    );
  });

  it('should not trigger deferred spawns until delay has elapsed', () => {
    // Arrange
    createEnemy(2);
    const system = createDamageSystem(particleSystem);

    // Act - initial frame
    system.update(world, 0.016);

    // Small time step - not enough for deferred spawns
    mockSpawn.mockClear();
    system.update(world, 0.05);
    // No new spawns from deferred queue (0.05 < 0.15 delay)
    expect(mockSpawn).not.toHaveBeenCalled();
  });

  it('should not trigger shockwave for normal enemies', () => {
    // Arrange
    createEnemy(0);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world, 0.016);

    // Assert
    expect(mockShockwaveCreate).not.toHaveBeenCalled();
  });

  it('should not trigger screen shake for elite enemies', () => {
    // Arrange
    createEnemy(1);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world, 0.016);

    // Assert
    expect(mockScreenShake).not.toHaveBeenCalled();
  });

  it('should use faction-specific colors for boss shockwaves', () => {
    // Arrange - Klingon boss
    createEnemy(2, FactionId.KLINGON);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world, 0.016);

    // Assert - Klingon color (0xFF3344 from FACTION_COLORS)
    expect(mockShockwaveCreate).toHaveBeenCalledWith(
      500, 300, 120,
      0xFF3344,
      expect.any(Number)
    );
  });

  it('should use faction-specific colors for elite shockwaves', () => {
    // Arrange - Romulan elite
    createEnemy(1, FactionId.ROMULAN);
    const system = createDamageSystem(particleSystem);

    // Act
    system.update(world, 0.016);

    // Assert - Romulan color (0x88FF00 from FACTION_COLORS)
    expect(mockShockwaveCreate).toHaveBeenCalledWith(
      500, 300,
      RENDERING_CONFIG.EXPLOSIONS.ELITE_SHOCKWAVE_RADIUS,
      0x88FF00,
      RENDERING_CONFIG.EXPLOSIONS.ELITE_SHOCKWAVE_DURATION
    );
  });
});
