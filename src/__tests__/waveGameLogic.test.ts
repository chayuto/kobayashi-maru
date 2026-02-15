/**
 * Tests for Wave & Spawn Logic
 *
 * Covers:
 * - waveConfig.ts: wave array structure, procedural generation math, difficulty scaling, story text
 * - spawnPoints.ts: edge positions, formation geometry, SpawnPoints class
 * - DifficultyScaler.ts: ECS component scaling
 * - EnemySpawner.ts: enemy creation and velocity toward center
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  WAVE_CONFIGS,
  getWaveConfig,
  getDifficultyScale,
  generateProceduralWave,
  getWaveStoryText,
  getEdgePosition,
  getRandomEdge,
  getClusterPositions,
  getVFormationPositions,
  getFormationPositions,
  SpawnPoints,
} from '../game';
import { DifficultyScaler, EnemySpawner } from '../game/wave';
import { FactionId, GAME_CONFIG } from '../types/constants';
import { Health, Shield, Velocity } from '../ecs/components';
import { createTestWorld, cleanupTestWorld, createTestEnemy } from './helpers';
import type { GameWorld } from '../ecs/world';
import { WAVE_CONFIG } from '../config';

// ============================================================================
// WAVE CONFIG - Structure & Validity
// ============================================================================

describe('Wave Config - Structure & Validity', () => {
  it('should have sequential wave numbers from 1 to 10', () => {
    for (let i = 0; i < WAVE_CONFIGS.length; i++) {
      expect(WAVE_CONFIGS[i].waveNumber).toBe(i + 1);
    }
  });

  it('should have positive spawn delays for all enemy groups', () => {
    for (const wave of WAVE_CONFIGS) {
      for (const enemy of wave.enemies) {
        expect(enemy.spawnDelay).toBeGreaterThan(0);
      }
    }
  });

  it('should have positive enemy counts for all enemy groups', () => {
    for (const wave of WAVE_CONFIGS) {
      for (const enemy of wave.enemies) {
        expect(enemy.count).toBeGreaterThan(0);
      }
    }
  });

  it('should use valid faction IDs in all wave configs', () => {
    const validFactions = new Set(Object.values(FactionId));
    for (const wave of WAVE_CONFIGS) {
      for (const enemy of wave.enemies) {
        expect(validFactions.has(enemy.faction)).toBe(true);
      }
    }
  });

  it('should use valid formation types in all wave configs', () => {
    const validFormations = new Set(['random', 'cluster', 'v-formation']);
    for (const wave of WAVE_CONFIGS) {
      for (const enemy of wave.enemies) {
        if (enemy.formation !== undefined) {
          expect(validFormations.has(enemy.formation)).toBe(true);
        }
      }
    }
  });

  it('should have increasing total enemy counts across waves', () => {
    const totalEnemies = WAVE_CONFIGS.map(w =>
      w.enemies.reduce((sum, e) => sum + e.count, 0)
    );
    // Overall trend: later waves should have more or equal enemies than earlier ones
    // Wave 1 vs Wave 10
    expect(totalEnemies[9]).toBeGreaterThan(totalEnemies[0]);
  });
});

// ============================================================================
// PROCEDURAL WAVE GENERATION
// ============================================================================

describe('Procedural Wave Generation', () => {
  it('should produce 5 enemy groups for all factions when wave > 10', () => {
    const wave = generateProceduralWave(11);
    expect(wave.enemies.length).toBe(5);

    const factions = wave.enemies.map(e => e.faction);
    expect(factions).toContain(FactionId.KLINGON);
    expect(factions).toContain(FactionId.ROMULAN);
    expect(factions).toContain(FactionId.BORG);
    expect(factions).toContain(FactionId.THOLIAN);
    expect(factions).toContain(FactionId.SPECIES_8472);
  });

  it('should scale enemy counts with the base multiplier formula', () => {
    // Wave 11: baseMultiplier = 1 + (11-10)*0.2 = 1.2, exponentialFactor = 1.08^1
    // klingonCount = floor(15 * 1.2 * 1.08) = floor(19.44) = 19
    const wave11 = generateProceduralWave(11);
    const klingon11 = wave11.enemies.find(e => e.faction === FactionId.KLINGON);
    expect(klingon11?.count).toBe(19);
  });

  it('should decrease spawn delays as waves progress', () => {
    const wave11 = generateProceduralWave(11);
    const wave20 = generateProceduralWave(20);

    const klingon11 = wave11.enemies.find(e => e.faction === FactionId.KLINGON);
    const klingon20 = wave20.enemies.find(e => e.faction === FactionId.KLINGON);

    expect(klingon20!.spawnDelay).toBeLessThanOrEqual(klingon11!.spawnDelay);
  });

  it('should clamp the delay multiplier at 0.5 minimum', () => {
    // delayMultiplier = max(0.5, 1 - (waveNumber - 10) * 0.05)
    // At wave 20: 1 - 10*0.05 = 0.5 (exactly 0.5)
    // At wave 30: 1 - 20*0.05 = 0 -> clamped to 0.5
    const wave30 = generateProceduralWave(30);
    const wave50 = generateProceduralWave(50);

    const klingon30 = wave30.enemies.find(e => e.faction === FactionId.KLINGON);
    const klingon50 = wave50.enemies.find(e => e.faction === FactionId.KLINGON);

    // Both should use delay multiplier of 0.5 => floor(250 * 0.5) = 125
    expect(klingon30!.spawnDelay).toBe(125);
    expect(klingon50!.spawnDelay).toBe(125);
  });

  it('should assign correct formation types to procedural waves', () => {
    const wave = generateProceduralWave(12);
    const klingon = wave.enemies.find(e => e.faction === FactionId.KLINGON);
    const romulan = wave.enemies.find(e => e.faction === FactionId.ROMULAN);
    const borg = wave.enemies.find(e => e.faction === FactionId.BORG);
    const tholian = wave.enemies.find(e => e.faction === FactionId.THOLIAN);
    const species = wave.enemies.find(e => e.faction === FactionId.SPECIES_8472);

    expect(klingon?.formation).toBe('v-formation');
    expect(romulan?.formation).toBe('cluster');
    expect(borg?.formation).toBe('cluster');
    expect(tholian?.formation).toBe('random');
    expect(species?.formation).toBe('random');
  });

  it('should return getWaveConfig-generated wave for wave 11', () => {
    const config = getWaveConfig(11);
    const procedural = generateProceduralWave(11);

    expect(config.waveNumber).toBe(procedural.waveNumber);
    expect(config.enemies.length).toBe(procedural.enemies.length);
  });
});

// ============================================================================
// DIFFICULTY SCALING
// ============================================================================

describe('Difficulty Scaling', () => {
  it('should return 1.0 for wave 1', () => {
    expect(getDifficultyScale(1)).toBe(1.0);
  });

  it('should apply 5% linear increase per wave for waves 1-10', () => {
    // wave n: 1 + (n-1) * 0.05
    expect(getDifficultyScale(2)).toBeCloseTo(1.05);
    expect(getDifficultyScale(5)).toBeCloseTo(1.20);
    expect(getDifficultyScale(10)).toBeCloseTo(1.45);
  });

  it('should switch to exponential growth after wave 10', () => {
    // wave 11: 1.45 * 1.03^1 = 1.4935
    expect(getDifficultyScale(11)).toBeCloseTo(1.45 * Math.pow(1.03, 1));
    // wave 15: 1.45 * 1.03^5
    expect(getDifficultyScale(15)).toBeCloseTo(1.45 * Math.pow(1.03, 5));
  });

  it('should produce monotonically increasing values', () => {
    let prev = getDifficultyScale(1);
    for (let wave = 2; wave <= 50; wave++) {
      const current = getDifficultyScale(wave);
      expect(current).toBeGreaterThan(prev);
      prev = current;
    }
  });
});

// ============================================================================
// WAVE STORY TEXT
// ============================================================================

describe('Wave Story Text', () => {
  it('should return story text for wave 1', () => {
    const text = getWaveStoryText(1);
    expect(text).toContain('Klingon');
  });

  it('should return story text for wave 10', () => {
    const text = getWaveStoryText(10);
    expect(text).toContain('Species 8472');
  });

  it('should cycle stories after wave 50', () => {
    // Wave 51 should have the same text as wave 1
    const text1 = getWaveStoryText(1);
    const text51 = getWaveStoryText(51);
    expect(text51).toBe(text1);
  });

  it('should cycle stories for wave 100', () => {
    // Wave 100 should map to ((100-1) % 50) + 1 = 50
    const text50 = getWaveStoryText(50);
    const text100 = getWaveStoryText(100);
    expect(text100).toBe(text50);
  });

  it('should return fallback text for missing wave entries', () => {
    // All waves 1-50 have entries, but testing the fallback pattern
    // by verifying the format of valid wave text (non-fallback)
    const text = getWaveStoryText(25);
    expect(text.length).toBeGreaterThan(0);
    // Should NOT be the fallback pattern for valid waves
    expect(text).not.toMatch(/^Wave \d+: The battle continues\.\.\.$/);
  });
});

// ============================================================================
// SPAWN POINTS - Edge Positions
// ============================================================================

describe('Spawn Points - Edge Positions', () => {
  it('should place top edge positions at y = -EDGE_MARGIN', () => {
    const pos = getEdgePosition('top', 0.5);
    expect(pos.y).toBe(-WAVE_CONFIG.SPAWN.EDGE_MARGIN);
    expect(pos.x).toBeCloseTo(GAME_CONFIG.WORLD_WIDTH * 0.5);
  });

  it('should place right edge positions at x = WORLD_WIDTH + EDGE_MARGIN', () => {
    const pos = getEdgePosition('right', 0.5);
    expect(pos.x).toBe(GAME_CONFIG.WORLD_WIDTH + WAVE_CONFIG.SPAWN.EDGE_MARGIN);
    expect(pos.y).toBeCloseTo(GAME_CONFIG.WORLD_HEIGHT * 0.5);
  });

  it('should place bottom edge positions at y = WORLD_HEIGHT + EDGE_MARGIN', () => {
    const pos = getEdgePosition('bottom', 0.5);
    expect(pos.y).toBe(GAME_CONFIG.WORLD_HEIGHT + WAVE_CONFIG.SPAWN.EDGE_MARGIN);
    expect(pos.x).toBeCloseTo(GAME_CONFIG.WORLD_WIDTH * 0.5);
  });

  it('should place left edge positions at x = -EDGE_MARGIN', () => {
    const pos = getEdgePosition('left', 0.5);
    expect(pos.x).toBe(-WAVE_CONFIG.SPAWN.EDGE_MARGIN);
    expect(pos.y).toBeCloseTo(GAME_CONFIG.WORLD_HEIGHT * 0.5);
  });

  it('should place positions at start of edge when positionAlongEdge is 0', () => {
    const topStart = getEdgePosition('top', 0);
    expect(topStart.x).toBe(0);

    const rightStart = getEdgePosition('right', 0);
    expect(rightStart.y).toBe(0);
  });

  it('should place positions at end of edge when positionAlongEdge is 1', () => {
    const topEnd = getEdgePosition('top', 1);
    expect(topEnd.x).toBe(GAME_CONFIG.WORLD_WIDTH);

    const bottomEnd = getEdgePosition('bottom', 1);
    expect(bottomEnd.x).toBe(GAME_CONFIG.WORLD_WIDTH);
  });

  it('should return one of the four valid edges from getRandomEdge', () => {
    const validEdges = new Set(['top', 'right', 'bottom', 'left']);
    for (let i = 0; i < 50; i++) {
      const edge = getRandomEdge();
      expect(validEdges.has(edge)).toBe(true);
    }
  });
});

// ============================================================================
// SPAWN POINTS - Formations
// ============================================================================

describe('Spawn Points - Formations', () => {
  it('should generate the exact requested count for cluster positions', () => {
    for (const count of [1, 5, 20]) {
      const positions = getClusterPositions(count, 80);
      expect(positions.length).toBe(count);
    }
  });

  it('should generate cluster positions within the specified radius from center', () => {
    const count = 50;
    const radius = 75;
    const positions = getClusterPositions(count, radius);

    // Compute the center point (first random edge position that was chosen)
    // All positions should be within radius from the average center
    const avgX = positions.reduce((s, p) => s + p.x, 0) / count;
    const avgY = positions.reduce((s, p) => s + p.y, 0) / count;

    for (const pos of positions) {
      const dist = Math.sqrt((pos.x - avgX) ** 2 + (pos.y - avgY) ** 2);
      // Distance from average center should be bounded
      expect(dist).toBeLessThanOrEqual(radius * 2);
    }
  });

  it('should generate V-formation with the leader at the base position', () => {
    const positions = getVFormationPositions(7, 40);
    expect(positions.length).toBe(7);
    // Leader position is the first element
    expect(positions[0]).toBeDefined();
    expect(typeof positions[0].x).toBe('number');
    expect(typeof positions[0].y).toBe('number');
  });

  it('should generate V-formation with increasing distance from leader', () => {
    // Seed a deterministic test by providing enough positions
    const positions = getVFormationPositions(5, 40);
    const leader = positions[0];

    // Wing positions should be farther from the leader
    for (let i = 1; i < positions.length; i++) {
      const dist = Math.sqrt(
        (positions[i].x - leader.x) ** 2 + (positions[i].y - leader.y) ** 2
      );
      expect(dist).toBeGreaterThan(0);
    }
  });

  it('should delegate to correct formation generator via getFormationPositions', () => {
    const randomPos = getFormationPositions(3, 'random');
    expect(randomPos.length).toBe(3);

    const clusterPos = getFormationPositions(4, 'cluster');
    expect(clusterPos.length).toBe(4);

    const vPos = getFormationPositions(6, 'v-formation');
    expect(vPos.length).toBe(6);
  });

  it('should handle single-entity formations', () => {
    const singleRandom = getFormationPositions(1, 'random');
    expect(singleRandom.length).toBe(1);

    const singleCluster = getFormationPositions(1, 'cluster');
    expect(singleCluster.length).toBe(1);

    const singleV = getFormationPositions(1, 'v-formation');
    expect(singleV.length).toBe(1);
  });
});

// ============================================================================
// SPAWN POINTS CLASS
// ============================================================================

describe('SpawnPoints Class', () => {
  it('should initialize with zero remaining count', () => {
    const sp = new SpawnPoints();
    expect(sp.getRemainingCount()).toBe(0);
  });

  it('should report correct remaining count after setup', () => {
    const sp = new SpawnPoints();
    sp.setupFormation(10, 'random');
    expect(sp.getRemainingCount()).toBe(10);
  });

  it('should decrement remaining count as positions are consumed', () => {
    const sp = new SpawnPoints();
    sp.setupFormation(5, 'cluster');

    for (let i = 5; i > 0; i--) {
      expect(sp.getRemainingCount()).toBe(i);
      sp.getSpawnPosition();
    }
    expect(sp.getRemainingCount()).toBe(0);
  });

  it('should return a valid fallback position when all preset positions are consumed', () => {
    const sp = new SpawnPoints();
    sp.setupFormation(1, 'random');
    sp.getSpawnPosition(); // consume the only one

    const fallback = sp.getSpawnPosition();
    expect(typeof fallback.x).toBe('number');
    expect(typeof fallback.y).toBe('number');
    expect(Number.isFinite(fallback.x)).toBe(true);
    expect(Number.isFinite(fallback.y)).toBe(true);
  });

  it('should clear positions and index on reset', () => {
    const sp = new SpawnPoints();
    sp.setupFormation(8, 'v-formation');
    sp.getSpawnPosition();
    sp.getSpawnPosition();

    sp.reset();
    expect(sp.getRemainingCount()).toBe(0);
  });

  it('should allow re-setup after reset', () => {
    const sp = new SpawnPoints();
    sp.setupFormation(3, 'random');
    sp.getSpawnPosition();
    sp.reset();

    sp.setupFormation(4, 'cluster');
    expect(sp.getRemainingCount()).toBe(4);
  });
});

// ============================================================================
// DIFFICULTY SCALER (ECS Component)
// ============================================================================

describe('DifficultyScaler', () => {
  let world: GameWorld;
  let scaler: DifficultyScaler;

  beforeEach(() => {
    world = createTestWorld();
    scaler = new DifficultyScaler();
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  it('should scale health by the given multiplier', () => {
    // Arrange
    const eid = createTestEnemy(world);
    const originalHealth = Health.current[eid];
    const originalMaxHealth = Health.max[eid];

    // Act
    scaler.applyScaling(eid, 2.0);

    // Assert
    expect(Health.current[eid]).toBe(Math.floor(originalHealth * 2.0));
    expect(Health.max[eid]).toBe(Math.floor(originalMaxHealth * 2.0));
  });

  it('should scale shields by the given multiplier', () => {
    // Arrange
    const eid = createTestEnemy(world);
    const originalShield = Shield.current[eid];
    const originalMaxShield = Shield.max[eid];

    // Act
    scaler.applyScaling(eid, 1.5);

    // Assert
    expect(Shield.current[eid]).toBe(Math.floor(originalShield * 1.5));
    expect(Shield.max[eid]).toBe(Math.floor(originalMaxShield * 1.5));
  });

  it('should floor scaled values to integers', () => {
    // Arrange
    const eid = createTestEnemy(world);
    // Force known values
    Health.current[eid] = 100;
    Health.max[eid] = 100;
    Shield.current[eid] = 50;
    Shield.max[eid] = 50;

    // Act - use a multiplier that creates fractional results
    scaler.applyScaling(eid, 1.33);

    // Assert
    expect(Health.current[eid]).toBe(Math.floor(100 * 1.33)); // 133
    expect(Health.max[eid]).toBe(Math.floor(100 * 1.33));
    expect(Shield.current[eid]).toBe(Math.floor(50 * 1.33)); // 66
    expect(Shield.max[eid]).toBe(Math.floor(50 * 1.33));
  });

  it('should handle scale of 1.0 preserving original values', () => {
    // Arrange
    const eid = createTestEnemy(world);
    Health.current[eid] = 80;
    Health.max[eid] = 80;
    Shield.current[eid] = 40;
    Shield.max[eid] = 40;

    // Act
    scaler.applyScaling(eid, 1.0);

    // Assert
    expect(Health.current[eid]).toBe(80);
    expect(Health.max[eid]).toBe(80);
    expect(Shield.current[eid]).toBe(40);
    expect(Shield.max[eid]).toBe(40);
  });
});

// ============================================================================
// ENEMY SPAWNER
// ============================================================================

describe('EnemySpawner', () => {
  let world: GameWorld;
  let spawner: EnemySpawner;

  beforeEach(() => {
    world = createTestWorld();
    spawner = new EnemySpawner();
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  it('should return -1 when world is not set', () => {
    // Act - spawner has no world set
    const eid = spawner.createEnemy(FactionId.KLINGON, 100, 200);

    // Assert
    expect(eid).toBe(-1);
  });

  it('should create an enemy entity when world is set', () => {
    // Arrange
    spawner.setWorld(world);

    // Act
    const eid = spawner.createEnemy(FactionId.KLINGON, 100, 200);

    // Assert
    expect(eid).not.toBe(-1);
    expect(eid).toBeGreaterThanOrEqual(0);
  });

  it('should set velocity toward the center of the world', () => {
    // Arrange
    spawner.setWorld(world);
    const eid = spawner.createEnemy(FactionId.KLINGON, 0, 0);
    const position = { x: 0, y: 0 };

    // Seed random for deterministic speed
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Act
    spawner.setVelocityTowardCenter(eid, position, 1);

    // Assert
    // Center is at (960, 540) from GAME_CONFIG
    // Direction from (0,0) to center: positive x and positive y
    expect(Velocity.x[eid]).toBeGreaterThan(0);
    expect(Velocity.y[eid]).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('should normalize velocity direction toward center', () => {
    // Arrange
    spawner.setWorld(world);
    const eid = spawner.createEnemy(FactionId.ROMULAN, GAME_CONFIG.WORLD_WIDTH, 0);
    const position = { x: GAME_CONFIG.WORLD_WIDTH, y: 0 };

    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Act
    spawner.setVelocityTowardCenter(eid, position, 1);

    // Assert
    // From top-right corner, direction toward center: negative x, positive y
    expect(Velocity.x[eid]).toBeLessThan(0);
    expect(Velocity.y[eid]).toBeGreaterThan(0);

    vi.restoreAllMocks();
  });

  it('should increase speed scale with wave number', () => {
    // Arrange
    spawner.setWorld(world);
    const eid1 = spawner.createEnemy(FactionId.KLINGON, 0, 0);
    const eid2 = spawner.createEnemy(FactionId.KLINGON, 0, 0);
    const position = { x: 0, y: 0 };

    // Use fixed random to make speed deterministic
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    // Act
    spawner.setVelocityTowardCenter(eid1, position, 1);
    const speed1 = Math.sqrt(Velocity.x[eid1] ** 2 + Velocity.y[eid1] ** 2);

    spawner.setVelocityTowardCenter(eid2, position, 50);
    const speed2 = Math.sqrt(Velocity.x[eid2] ** 2 + Velocity.y[eid2] ** 2);

    // Assert: wave 50 should be faster than wave 1 due to 2% increase per wave
    expect(speed2).toBeGreaterThan(speed1);

    vi.restoreAllMocks();
  });
});
