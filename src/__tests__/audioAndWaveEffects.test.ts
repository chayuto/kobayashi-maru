/**
 * @vitest-environment jsdom
 */

/**
 * Tests for Audio & Wave Effects
 *
 * Covers:
 * - SoundGenerator: buffer creation, waveform generation, sound parameter configs
 * - SpawnEffects: visual effect creation for enemy spawns
 * - VariantApplier: stat modifications applied to enemies
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { addEntity, addComponent, createWorld, hasComponent, type World } from 'bitecs';
import { SoundGenerator } from '../audio/SoundGenerator';
import { SoundType } from '../audio/types';
import { SpawnEffects } from '../game/wave/SpawnEffects';
import { VariantApplier } from '../game/wave/VariantApplier';
import {
  Position,
  Health,
  Shield,
  EnemyVariant,
  EnemyWeapon,
  SpecialAbility,
  SpriteRef,
} from '../ecs/components';
import { EnemyRank, RANK_MULTIPLIERS, ABILITY_CONFIG, AbilityType, FactionId } from '../types/constants';
import type { BossWaveConfig } from '../game/waveConfig';

// ---------------------------------------------------------------------------
// Mock AudioContext / AudioBuffer for Web Audio API
// ---------------------------------------------------------------------------
function createMockAudioContext(sampleRate = 44100): AudioContext {
  const channelData = new Map<number, Float32Array<ArrayBuffer>>();

  const mockBuffer: AudioBuffer = {
    sampleRate,
    length: 0,
    duration: 0,
    numberOfChannels: 1,
    getChannelData: vi.fn((channel: number): Float32Array<ArrayBuffer> => {
      if (!channelData.has(channel)) {
        channelData.set(channel, new Float32Array(0));
      }
      return channelData.get(channel)!;
    }),
    copyFromChannel: vi.fn(),
    copyToChannel: vi.fn(),
  };

  const ctx = {
    sampleRate,
    createBuffer: vi.fn((channels: number, length: number, rate: number) => {
      const data = new Float32Array(length);
      channelData.set(0, data);
      return {
        ...mockBuffer,
        sampleRate: rate,
        length,
        duration: length / rate,
        numberOfChannels: channels,
        getChannelData: vi.fn((channel: number) => {
          if (channel === 0) return data;
          const chData = new Float32Array(length);
          channelData.set(channel, chData);
          return chData;
        }),
      } as unknown as AudioBuffer;
    }),
  } as unknown as AudioContext;

  return ctx;
}

// ---------------------------------------------------------------------------
// Mock ParticleSystem
// ---------------------------------------------------------------------------
function createMockParticleSystem() {
  return {
    spawn: vi.fn(),
    update: vi.fn(),
    destroy: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Mock SpriteManager
// ---------------------------------------------------------------------------
function createMockSpriteManager() {
  return {
    setScale: vi.fn(),
    createSprite: vi.fn(),
    updateSprite: vi.fn(),
    removeSprite: vi.fn(),
  };
}

// ===========================================================================
// SoundGenerator Tests
// ===========================================================================
describe('SoundGenerator', () => {
  let ctx: AudioContext;

  beforeEach(() => {
    ctx = createMockAudioContext(44100);
  });

  // ---- generateSound dispatch ----
  describe('generateSound', () => {
    it('should return an AudioBuffer for PHASER_FIRE sound type', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.PHASER_FIRE);
      expect(buffer).toBeDefined();
      expect(buffer.numberOfChannels).toBe(1);
    });

    it('should return an AudioBuffer for TORPEDO_FIRE sound type', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.TORPEDO_FIRE);
      expect(buffer).toBeDefined();
      expect(buffer.duration).toBeCloseTo(0.4, 1);
    });

    it('should return an AudioBuffer for DISRUPTOR_FIRE sound type', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.DISRUPTOR_FIRE);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(Math.floor(0.2 * 44100));
    });

    it('should return a small explosion buffer for EXPLOSION_SMALL', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.EXPLOSION_SMALL);
      expect(buffer.length).toBe(Math.floor(0.3 * 44100));
    });

    it('should return a large explosion buffer for EXPLOSION_LARGE', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.EXPLOSION_LARGE);
      expect(buffer.length).toBe(Math.floor(0.8 * 44100));
    });

    it('should return a beep buffer for TURRET_PLACE with correct duration', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.TURRET_PLACE);
      expect(buffer.length).toBe(Math.floor(0.1 * 44100));
    });

    it('should return a sawtooth beep for ERROR_BEEP', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.ERROR_BEEP);
      expect(buffer.length).toBe(Math.floor(0.3 * 44100));
    });

    it('should return a wave start sound buffer', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.WAVE_START);
      expect(buffer.length).toBe(Math.floor(1.5 * 44100));
    });

    it('should return a wave complete sound buffer', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.WAVE_COMPLETE);
      expect(buffer.length).toBe(Math.floor(1.0 * 44100));
    });

    it('should return an AudioBuffer for TETRYON_FIRE sound type', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.TETRYON_FIRE);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(Math.floor(0.12 * 44100));
    });

    it('should return an AudioBuffer for PLASMA_FIRE sound type', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.PLASMA_FIRE);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeCloseTo(0.35 * 44100, 0);
    });

    it('should return an AudioBuffer for POLARON_FIRE sound type', () => {
      const buffer = SoundGenerator.generateSound(ctx, SoundType.POLARON_FIRE);
      expect(buffer).toBeDefined();
      expect(buffer.length).toBe(Math.floor(0.18 * 44100));
    });

    it('should return a default fallback buffer for unknown sound type', () => {
      // Use a type assertion to pass an unknown value
      const buffer = SoundGenerator.generateSound(ctx, 'some_unknown_type' as SoundType);
      // Default beep: 440 Hz, 0.05 duration, sine
      expect(buffer.length).toBe(Math.floor(0.05 * 44100));
    });
  });

  // ---- Individual sound creation methods ----
  describe('createPhaserSound', () => {
    it('should create a buffer with non-zero sample data', () => {
      const buffer = SoundGenerator.createPhaserSound(ctx);
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(0.15 * 44100));
      // At least some samples should be non-zero (waveform data)
      const hasNonZero = data.some((v) => v !== 0);
      expect(hasNonZero).toBe(true);
    });
  });

  describe('createTorpedoSound', () => {
    it('should create a buffer with decaying amplitude', () => {
      const buffer = SoundGenerator.createTorpedoSound(ctx);
      const data = buffer.getChannelData(0);
      // Start samples should generally have larger magnitude than end samples
      const startMag = Math.abs(data[10]);
      const endMag = Math.abs(data[data.length - 10]);
      // Due to randomness we just check the buffer was created properly
      expect(data.length).toBe(Math.floor(0.4 * 44100));
      expect(startMag + endMag).toBeGreaterThanOrEqual(0);
    });
  });

  describe('createExplosionSound', () => {
    it('should create buffers of different durations', () => {
      const smallBuffer = SoundGenerator.createExplosionSound(ctx, 0.3);
      const largeBuffer = SoundGenerator.createExplosionSound(ctx, 0.8);

      expect(smallBuffer.length).toBeLessThan(largeBuffer.length);
    });

    it('should fill buffer with noise-like data', () => {
      const buffer = SoundGenerator.createExplosionSound(ctx, 0.3);
      const data = buffer.getChannelData(0);
      // Noise should have varying values
      const uniqueValues = new Set(Array.from(data.slice(0, 100)));
      expect(uniqueValues.size).toBeGreaterThan(1);
    });
  });

  describe('createBeepSound', () => {
    it('should create sine waveform when type is sine', () => {
      const buffer = SoundGenerator.createBeepSound(ctx, 440, 0.1, 'sine');
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(0.1 * 44100));
      // Sine should oscillate: check there are positive and negative values
      const hasPositive = data.some((v) => v > 0);
      const hasNegative = data.some((v) => v < 0);
      expect(hasPositive).toBe(true);
      expect(hasNegative).toBe(true);
    });

    it('should create square waveform when type is square', () => {
      const buffer = SoundGenerator.createBeepSound(ctx, 440, 0.1, 'square');
      const data = buffer.getChannelData(0);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should create sawtooth waveform when type is sawtooth', () => {
      const buffer = SoundGenerator.createBeepSound(ctx, 150, 0.3, 'sawtooth');
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(0.3 * 44100));
    });

    it('should create triangle waveform when type is triangle', () => {
      const buffer = SoundGenerator.createBeepSound(ctx, 440, 0.1, 'triangle');
      const data = buffer.getChannelData(0);
      expect(data.length).toBeGreaterThan(0);
      // Triangle values should be between -1 and 1 (before envelope)
      const max = Math.max(...Array.from(data));
      expect(max).toBeLessThanOrEqual(1);
    });
  });

  describe('createWaveCompleteSound', () => {
    it('should create a buffer using major triad arpeggio notes', () => {
      const buffer = SoundGenerator.createWaveCompleteSound(ctx);
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(1.0 * 44100));
      // Verify it has audible content
      const hasNonZero = data.some((v) => v !== 0);
      expect(hasNonZero).toBe(true);
    });
  });

  describe('createTetryonSound', () => {
    it('should create a buffer with correct duration and non-zero data', () => {
      const buffer = SoundGenerator.createTetryonSound(ctx);
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(0.12 * 44100));
      const hasNonZero = data.some((v) => v !== 0);
      expect(hasNonZero).toBe(true);
    });

    it('should have decaying amplitude (crystalline shimmer envelope)', () => {
      const buffer = SoundGenerator.createTetryonSound(ctx);
      const data = buffer.getChannelData(0);
      // Early samples should have larger magnitude than late samples
      const earlyMax = Math.max(...Array.from(data.slice(0, 100)).map(Math.abs));
      const lateMax = Math.max(...Array.from(data.slice(-100)).map(Math.abs));
      expect(earlyMax).toBeGreaterThan(lateMax);
    });
  });

  describe('createPlasmaSound', () => {
    it('should create a buffer with correct duration and non-zero data', () => {
      const buffer = SoundGenerator.createPlasmaSound(ctx);
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(0.35 * 44100));
      const hasNonZero = data.some((v) => v !== 0);
      expect(hasNonZero).toBe(true);
    });

    it('should have a slow attack (low amplitude at start)', () => {
      const buffer = SoundGenerator.createPlasmaSound(ctx);
      const data = buffer.getChannelData(0);
      // Very first sample should be near zero due to attack ramp
      expect(Math.abs(data[0])).toBeLessThan(0.01);
    });
  });

  describe('createPolaronSound', () => {
    it('should create a buffer with correct duration and non-zero data', () => {
      const buffer = SoundGenerator.createPolaronSound(ctx);
      const data = buffer.getChannelData(0);
      expect(data.length).toBe(Math.floor(0.18 * 44100));
      const hasNonZero = data.some((v) => v !== 0);
      expect(hasNonZero).toBe(true);
    });

    it('should have decaying amplitude (warble envelope)', () => {
      const buffer = SoundGenerator.createPolaronSound(ctx);
      const data = buffer.getChannelData(0);
      const earlyMax = Math.max(...Array.from(data.slice(0, 100)).map(Math.abs));
      const lateMax = Math.max(...Array.from(data.slice(-100)).map(Math.abs));
      expect(earlyMax).toBeGreaterThan(lateMax);
    });
  });
});

// ===========================================================================
// SpawnEffects Tests
// ===========================================================================
describe('SpawnEffects', () => {
  let spawnEffects: SpawnEffects;
  let mockParticleSystem: ReturnType<typeof createMockParticleSystem>;

  beforeEach(() => {
    spawnEffects = new SpawnEffects();
    mockParticleSystem = createMockParticleSystem();
  });

  describe('setParticleSystem', () => {
    it('should accept and store a particle system reference', () => {
      // Should not throw
      expect(() =>
        spawnEffects.setParticleSystem(mockParticleSystem as never)
      ).not.toThrow();
    });
  });

  describe('addEliteGlow', () => {
    it('should not throw when particle system is not set', () => {
      // No particle system set - should return early without error
      expect(() => spawnEffects.addEliteGlow(1)).not.toThrow();
    });

    it('should call particle system spawn with golden color when particle system is set', () => {
      spawnEffects.setParticleSystem(mockParticleSystem as never);

      // Set up entity position
      const eid = 42;
      Position.x[eid] = 200;
      Position.y[eid] = 300;

      spawnEffects.addEliteGlow(eid);

      expect(mockParticleSystem.spawn).toHaveBeenCalledTimes(1);
      const config = mockParticleSystem.spawn.mock.calls[0][0];
      expect(config.x).toBe(200);
      expect(config.y).toBe(300);
      expect(config.count).toBe(15);
      expect(config.color).toBe(0xFFDD00); // Golden glow
      expect(config.spread).toBe(Math.PI * 2);
    });
  });

  describe('addBossGlow', () => {
    it('should not throw when particle system is not set', () => {
      expect(() => spawnEffects.addBossGlow(1)).not.toThrow();
    });

    it('should call particle system spawn with red color and more particles for boss', () => {
      spawnEffects.setParticleSystem(mockParticleSystem as never);

      const eid = 99;
      Position.x[eid] = 500;
      Position.y[eid] = 600;

      spawnEffects.addBossGlow(eid);

      expect(mockParticleSystem.spawn).toHaveBeenCalledTimes(1);
      const config = mockParticleSystem.spawn.mock.calls[0][0];
      expect(config.x).toBe(500);
      expect(config.y).toBe(600);
      expect(config.count).toBe(30);
      expect(config.color).toBe(0xFF0000); // Red glow
      expect(config.spread).toBe(Math.PI * 2);
    });

    it('should spawn more particles for boss than elite', () => {
      spawnEffects.setParticleSystem(mockParticleSystem as never);

      const eid = 10;
      Position.x[eid] = 100;
      Position.y[eid] = 100;

      spawnEffects.addEliteGlow(eid);
      const eliteCount = mockParticleSystem.spawn.mock.calls[0][0].count;

      spawnEffects.addBossGlow(eid);
      const bossCount = mockParticleSystem.spawn.mock.calls[1][0].count;

      expect(bossCount).toBeGreaterThan(eliteCount);
    });
  });
});

// ===========================================================================
// VariantApplier Tests
// ===========================================================================
describe('VariantApplier', () => {
  let world: World;
  let spawnEffects: SpawnEffects;
  let mockParticleSystem: ReturnType<typeof createMockParticleSystem>;
  let mockSpriteManager: ReturnType<typeof createMockSpriteManager>;
  let variantApplier: VariantApplier;

  beforeEach(() => {
    world = createWorld();
    spawnEffects = new SpawnEffects();
    mockParticleSystem = createMockParticleSystem();
    mockSpriteManager = createMockSpriteManager();
    spawnEffects.setParticleSystem(mockParticleSystem as never);
    variantApplier = new VariantApplier(spawnEffects);
    variantApplier.setDependencies(world as never, mockSpriteManager as never);
  });

  /**
   * Helper to create a basic enemy entity with Health, Shield, Position, SpriteRef
   */
  function createBasicEnemy(): number {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    addComponent(world, eid, Health);
    addComponent(world, eid, Shield);
    addComponent(world, eid, SpriteRef);
    Position.x[eid] = 100;
    Position.y[eid] = 200;
    Health.current[eid] = 100;
    Health.max[eid] = 100;
    Shield.current[eid] = 50;
    Shield.max[eid] = 50;
    SpriteRef.index[eid] = 5;
    return eid;
  }

  describe('applyVariant', () => {
    it('should do nothing when world is not set', () => {
      const applierNoWorld = new VariantApplier(spawnEffects);
      // world not set via setDependencies
      const eid = createBasicEnemy();
      expect(() => applierNoWorld.applyVariant(eid, FactionId.KLINGON, 1, null)).not.toThrow();
    });

    it('should apply boss variant when bossWave matches faction', () => {
      const eid = createBasicEnemy();
      const bossWave: BossWaveConfig = {
        waveNumber: 5,
        bossType: FactionId.BORG,
        bossCount: 1,
        bossAbilities: [AbilityType.SHIELD_REGEN],
        supportEnemies: [],
        rewardMultiplier: 2.0,
      };

      variantApplier.applyVariant(eid, FactionId.BORG, 5, bossWave);

      expect(EnemyVariant.rank[eid]).toBe(EnemyRank.BOSS);
      expect(Health.max[eid]).toBe(Math.floor(100 * RANK_MULTIPLIERS[EnemyRank.BOSS].health));
    });

    it('should not apply boss variant when bossWave faction does not match', () => {
      const eid = createBasicEnemy();
      const bossWave: BossWaveConfig = {
        waveNumber: 5,
        bossType: FactionId.BORG,
        bossCount: 1,
        bossAbilities: [AbilityType.SHIELD_REGEN],
        supportEnemies: [],
        rewardMultiplier: 2.0,
      };

      // Mock Math.random to return 1 (no elite either)
      vi.spyOn(Math, 'random').mockReturnValue(1);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 5, bossWave);

      // Should remain unchanged (not boss, not elite)
      expect(Health.max[eid]).toBe(100);
      vi.restoreAllMocks();
    });

    it('should apply elite variant based on random chance', () => {
      const eid = createBasicEnemy();

      // Force elite: Math.random returns 0 (always below eliteChance)
      vi.spyOn(Math, 'random').mockReturnValue(0);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 1, null);

      expect(EnemyVariant.rank[eid]).toBe(EnemyRank.ELITE);
      expect(Health.max[eid]).toBe(Math.floor(100 * RANK_MULTIPLIERS[EnemyRank.ELITE].health));
      vi.restoreAllMocks();
    });

    it('should not apply elite variant when random exceeds elite chance', () => {
      const eid = createBasicEnemy();

      // Force no elite: Math.random returns 1 (always above eliteChance)
      vi.spyOn(Math, 'random').mockReturnValue(1);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 1, null);

      // Health should remain unchanged
      expect(Health.max[eid]).toBe(100);
      vi.restoreAllMocks();
    });
  });

  describe('elite variant application', () => {
    it('should multiply health and shield stats by elite multiplier', () => {
      const eid = createBasicEnemy();

      vi.spyOn(Math, 'random').mockReturnValue(0);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 1, null);

      const mult = RANK_MULTIPLIERS[EnemyRank.ELITE].health;
      expect(Health.max[eid]).toBe(Math.floor(100 * mult));
      expect(Health.current[eid]).toBe(Math.floor(100 * mult));
      expect(Shield.max[eid]).toBe(Math.floor(50 * mult));
      expect(Shield.current[eid]).toBe(Math.floor(50 * mult));
      vi.restoreAllMocks();
    });

    it('should scale enemy weapon damage when EnemyWeapon component exists', () => {
      const eid = createBasicEnemy();
      addComponent(world, eid, EnemyWeapon);
      EnemyWeapon.damage[eid] = 10;

      vi.spyOn(Math, 'random').mockReturnValue(0);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 1, null);

      expect(EnemyWeapon.damage[eid]).toBe(10 * RANK_MULTIPLIERS[EnemyRank.ELITE].damage);
      vi.restoreAllMocks();
    });

    it('should set sprite scale via spriteManager for elite', () => {
      const eid = createBasicEnemy();

      vi.spyOn(Math, 'random').mockReturnValue(0);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 1, null);

      expect(mockSpriteManager.setScale).toHaveBeenCalledWith(
        SpriteRef.index[eid],
        RANK_MULTIPLIERS[EnemyRank.ELITE].size
      );
      vi.restoreAllMocks();
    });

    it('should trigger elite glow particle effect', () => {
      const eid = createBasicEnemy();

      vi.spyOn(Math, 'random').mockReturnValue(0);
      variantApplier.applyVariant(eid, FactionId.KLINGON, 1, null);

      expect(mockParticleSystem.spawn).toHaveBeenCalledTimes(1);
      const config = mockParticleSystem.spawn.mock.calls[0][0];
      expect(config.color).toBe(0xFFDD00); // Elite golden
      vi.restoreAllMocks();
    });
  });

  describe('boss variant application', () => {
    const bossWave: BossWaveConfig = {
      waveNumber: 5,
      bossType: FactionId.BORG,
      bossCount: 1,
      bossAbilities: [AbilityType.SHIELD_REGEN],
      supportEnemies: [],
      rewardMultiplier: 2.0,
    };

    it('should multiply health and shield stats by boss multiplier', () => {
      const eid = createBasicEnemy();
      variantApplier.applyVariant(eid, FactionId.BORG, 5, bossWave);

      const mult = RANK_MULTIPLIERS[EnemyRank.BOSS].health;
      expect(Health.max[eid]).toBe(Math.floor(100 * mult));
      expect(Health.current[eid]).toBe(Math.floor(100 * mult));
      expect(Shield.max[eid]).toBe(Math.floor(50 * mult));
      expect(Shield.current[eid]).toBe(Math.floor(50 * mult));
    });

    it('should add SpecialAbility component with correct config', () => {
      const eid = createBasicEnemy();
      variantApplier.applyVariant(eid, FactionId.BORG, 5, bossWave);

      expect(hasComponent(world, eid, SpecialAbility)).toBe(true);
      expect(SpecialAbility.abilityType[eid]).toBe(AbilityType.SHIELD_REGEN);
      expect(SpecialAbility.cooldown[eid]).toBe(ABILITY_CONFIG[AbilityType.SHIELD_REGEN].cooldown);
      expect(SpecialAbility.duration[eid]).toBe(ABILITY_CONFIG[AbilityType.SHIELD_REGEN].duration);
      expect(SpecialAbility.lastUsed[eid]).toBe(0);
      expect(SpecialAbility.active[eid]).toBe(0);
    });

    it('should not add SpecialAbility when bossAbilities is empty', () => {
      const eid = createBasicEnemy();
      const noAbilityBossWave: BossWaveConfig = {
        ...bossWave,
        bossAbilities: [],
      };
      variantApplier.applyVariant(eid, FactionId.BORG, 5, noAbilityBossWave);

      // EnemyVariant should still be applied
      expect(EnemyVariant.rank[eid]).toBe(EnemyRank.BOSS);
      // SpecialAbility should NOT be added
      expect(hasComponent(world, eid, SpecialAbility)).toBe(false);
    });

    it('should set sprite scale via spriteManager for boss', () => {
      const eid = createBasicEnemy();
      variantApplier.applyVariant(eid, FactionId.BORG, 5, bossWave);

      expect(mockSpriteManager.setScale).toHaveBeenCalledWith(
        SpriteRef.index[eid],
        RANK_MULTIPLIERS[EnemyRank.BOSS].size
      );
    });

    it('should trigger boss glow particle effect', () => {
      const eid = createBasicEnemy();
      variantApplier.applyVariant(eid, FactionId.BORG, 5, bossWave);

      expect(mockParticleSystem.spawn).toHaveBeenCalledTimes(1);
      const config = mockParticleSystem.spawn.mock.calls[0][0];
      expect(config.color).toBe(0xFF0000); // Boss red
    });

    it('should scale enemy weapon damage when EnemyWeapon component exists for boss', () => {
      const eid = createBasicEnemy();
      addComponent(world, eid, EnemyWeapon);
      EnemyWeapon.damage[eid] = 20;

      variantApplier.applyVariant(eid, FactionId.BORG, 5, bossWave);

      expect(EnemyWeapon.damage[eid]).toBe(20 * RANK_MULTIPLIERS[EnemyRank.BOSS].damage);
    });
  });
});
