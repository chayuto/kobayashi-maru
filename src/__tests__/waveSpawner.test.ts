/**
 * Tests for Wave Spawner System
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  WaveManager,
  getWaveConfig,
  getDifficultyScale,
  generateProceduralWave,
  WAVE_CONFIGS,
  SpawnPoints,
  getRandomEdgePosition,
  getClusterPositions,
  getVFormationPositions,
  getFormationPositions,
  getEdgePosition
} from '../game';
import { createGameWorld, getEntityCount } from '../ecs';
import { FactionId, GAME_CONFIG } from '../types/constants';

describe('Wave Configuration', () => {
  it('should have pre-defined configurations for waves 1-10', () => {
    expect(WAVE_CONFIGS.length).toBe(10);
  });

  it('should return correct wave config for waves 1-10', () => {
    for (let i = 1; i <= 10; i++) {
      const config = getWaveConfig(i);
      expect(config.waveNumber).toBe(i);
      expect(config.enemies.length).toBeGreaterThan(0);
    }
  });

  it('should generate procedural waves for waves > 10', () => {
    const wave11 = getWaveConfig(11);
    expect(wave11.waveNumber).toBe(11);
    expect(wave11.enemies.length).toBe(5); // All 5 factions

    const wave15 = getWaveConfig(15);
    expect(wave15.waveNumber).toBe(15);
    expect(wave15.enemies.length).toBe(5);
  });

  it('should default to wave 1 for invalid wave numbers', () => {
    const config = getWaveConfig(0);
    expect(config.waveNumber).toBe(1);
    
    const configNegative = getWaveConfig(-1);
    expect(configNegative.waveNumber).toBe(1);
  });

  it('should escalate enemy types with wave number', () => {
    // Waves 1-3: Klingons only
    const wave1 = getWaveConfig(1);
    expect(wave1.enemies.every(e => e.faction === FactionId.KLINGON)).toBe(true);

    // Wave 4-6: Klingons and Romulans
    const wave4 = getWaveConfig(4);
    const wave4Factions = wave4.enemies.map(e => e.faction);
    expect(wave4Factions).toContain(FactionId.KLINGON);
    expect(wave4Factions).toContain(FactionId.ROMULAN);

    // Wave 7-9: Klingons, Romulans, and Borg
    const wave7 = getWaveConfig(7);
    const wave7Factions = wave7.enemies.map(e => e.faction);
    expect(wave7Factions).toContain(FactionId.KLINGON);
    expect(wave7Factions).toContain(FactionId.ROMULAN);
    expect(wave7Factions).toContain(FactionId.BORG);

    // Wave 10: All enemy types
    const wave10 = getWaveConfig(10);
    const wave10Factions = wave10.enemies.map(e => e.faction);
    expect(wave10Factions).toContain(FactionId.KLINGON);
    expect(wave10Factions).toContain(FactionId.ROMULAN);
    expect(wave10Factions).toContain(FactionId.BORG);
    expect(wave10Factions).toContain(FactionId.THOLIAN);
    expect(wave10Factions).toContain(FactionId.SPECIES_8472);
  });

  it('should increase difficulty scale with wave number', () => {
    const scale1 = getDifficultyScale(1);
    const scale5 = getDifficultyScale(5);
    const scale10 = getDifficultyScale(10);
    const scale15 = getDifficultyScale(15);

    expect(scale1).toBe(1);
    expect(scale5).toBeGreaterThan(scale1);
    expect(scale10).toBeGreaterThan(scale5);
    expect(scale15).toBeGreaterThan(scale10);
  });

  it('should generate procedural wave with increasing enemy counts', () => {
    const wave11 = generateProceduralWave(11);
    const wave20 = generateProceduralWave(20);

    const total11 = wave11.enemies.reduce((sum, e) => sum + e.count, 0);
    const total20 = wave20.enemies.reduce((sum, e) => sum + e.count, 0);

    expect(total20).toBeGreaterThan(total11);
  });
});

describe('Spawn Points', () => {
  it('should generate random edge positions within world bounds', () => {
    for (let i = 0; i < 100; i++) {
      const pos = getRandomEdgePosition();
      // Positions should be around the edges (including slightly outside)
      const isNearEdge = 
        pos.x <= 0 || pos.x >= GAME_CONFIG.WORLD_WIDTH ||
        pos.y <= 0 || pos.y >= GAME_CONFIG.WORLD_HEIGHT;
      expect(isNearEdge).toBe(true);
    }
  });

  it('should generate edge positions for specific edges', () => {
    const topPos = getEdgePosition('top');
    expect(topPos.y).toBeLessThan(0);
    expect(topPos.x).toBeGreaterThanOrEqual(0);
    expect(topPos.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH);

    const rightPos = getEdgePosition('right');
    expect(rightPos.x).toBeGreaterThan(GAME_CONFIG.WORLD_WIDTH);
    expect(rightPos.y).toBeGreaterThanOrEqual(0);
    expect(rightPos.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT);

    const bottomPos = getEdgePosition('bottom');
    expect(bottomPos.y).toBeGreaterThan(GAME_CONFIG.WORLD_HEIGHT);
    expect(bottomPos.x).toBeGreaterThanOrEqual(0);
    expect(bottomPos.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH);

    const leftPos = getEdgePosition('left');
    expect(leftPos.x).toBeLessThan(0);
    expect(leftPos.y).toBeGreaterThanOrEqual(0);
    expect(leftPos.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT);
  });

  it('should generate cluster positions around a center point', () => {
    const count = 10;
    const radius = 100;
    const positions = getClusterPositions(count, radius);

    expect(positions.length).toBe(count);

    // All positions should be relatively close to each other (within 2x radius from center)
    const centerX = positions.reduce((sum, p) => sum + p.x, 0) / count;
    const centerY = positions.reduce((sum, p) => sum + p.y, 0) / count;

    for (const pos of positions) {
      const dist = Math.sqrt(Math.pow(pos.x - centerX, 2) + Math.pow(pos.y - centerY, 2));
      expect(dist).toBeLessThanOrEqual(radius * 2);
    }
  });

  it('should generate V-formation positions', () => {
    const count = 5;
    const positions = getVFormationPositions(count);

    expect(positions.length).toBe(count);
    // First position is the leader
    expect(positions[0]).toBeDefined();
  });

  it('should generate formation positions based on type', () => {
    const randomPositions = getFormationPositions(5, 'random');
    expect(randomPositions.length).toBe(5);

    const clusterPositions = getFormationPositions(5, 'cluster');
    expect(clusterPositions.length).toBe(5);

    const vFormationPositions = getFormationPositions(5, 'v-formation');
    expect(vFormationPositions.length).toBe(5);
  });

  it('should track spawn points correctly', () => {
    const spawnPoints = new SpawnPoints();
    spawnPoints.setupFormation(3, 'random');

    expect(spawnPoints.getRemainingCount()).toBe(3);

    spawnPoints.getSpawnPosition();
    expect(spawnPoints.getRemainingCount()).toBe(2);

    spawnPoints.getSpawnPosition();
    expect(spawnPoints.getRemainingCount()).toBe(1);

    spawnPoints.getSpawnPosition();
    expect(spawnPoints.getRemainingCount()).toBe(0);

    // Should still return a position even when exhausted
    const extraPos = spawnPoints.getSpawnPosition();
    expect(extraPos).toBeDefined();
    expect(extraPos.x).toBeDefined();
    expect(extraPos.y).toBeDefined();
  });

  it('should reset spawn points', () => {
    const spawnPoints = new SpawnPoints();
    spawnPoints.setupFormation(5, 'random');
    
    spawnPoints.getSpawnPosition();
    spawnPoints.getSpawnPosition();
    expect(spawnPoints.getRemainingCount()).toBe(3);

    spawnPoints.reset();
    expect(spawnPoints.getRemainingCount()).toBe(0);
  });
});

describe('Wave Manager', () => {
  let waveManager: WaveManager;
  let world: ReturnType<typeof createGameWorld>;

  beforeEach(() => {
    world = createGameWorld();
    waveManager = new WaveManager();
    waveManager.init(world);
  });

  it('should initialize in idle state', () => {
    expect(waveManager.getState()).toBe('idle');
    expect(waveManager.getCurrentWave()).toBe(0);
  });

  it('should start a wave', () => {
    waveManager.startWave(1);
    
    expect(waveManager.getState()).toBe('spawning');
    expect(waveManager.getCurrentWave()).toBe(1);
  });

  it('should emit wave start event', () => {
    let eventReceived = false;
    let receivedWaveNumber = 0;

    waveManager.on('waveStart', (event) => {
      eventReceived = true;
      receivedWaveNumber = event.waveNumber;
    });

    waveManager.startWave(1);

    expect(eventReceived).toBe(true);
    expect(receivedWaveNumber).toBe(1);
  });

  it('should spawn enemies over time', () => {
    waveManager.startWave(1);
    
    const initialCount = getEntityCount();
    
    // Update for enough time to spawn at least one enemy
    // Wave 1 has spawn delay of 500ms
    waveManager.update(0.6); // 600ms
    
    expect(getEntityCount()).toBeGreaterThan(initialCount);
  });

  it('should transition from spawning to active state', () => {
    waveManager.startWave(1);
    expect(waveManager.getState()).toBe('spawning');
    
    // Wave 1 has 5 enemies with 500ms delay = 2.5s minimum
    // Update for enough time to complete spawning
    for (let i = 0; i < 10; i++) {
      waveManager.update(0.5);
    }
    
    expect(waveManager.getState()).toBe('active');
  });

  it('should track active enemy count', () => {
    waveManager.startWave(1);
    
    // Spawn some enemies
    waveManager.update(0.6);
    
    expect(waveManager.getActiveEnemyCount()).toBeGreaterThan(0);
  });

  it('should allow removing enemies', () => {
    waveManager.startWave(1);
    waveManager.update(0.6);
    
    const activeCount = waveManager.getActiveEnemyCount();
    expect(activeCount).toBeGreaterThan(0);
    
    // Can't easily get the entity IDs without more implementation,
    // but we can test that the method exists and doesn't throw
    expect(() => waveManager.removeEnemy(999)).not.toThrow();
  });

  it('should support event listener removal', () => {
    let callCount = 0;
    const callback = () => { callCount++; };

    waveManager.on('waveStart', callback);
    waveManager.startWave(1);
    expect(callCount).toBe(1);

    waveManager.off('waveStart', callback);
    waveManager.startWave(2);
    expect(callCount).toBe(1); // Should not increment
  });

  it('should reset properly', () => {
    waveManager.startWave(1);
    waveManager.update(0.6);
    
    waveManager.reset();
    
    expect(waveManager.getState()).toBe('idle');
    expect(waveManager.getCurrentWave()).toBe(0);
    expect(waveManager.getActiveEnemyCount()).toBe(0);
  });

  it('should report wave completion correctly', () => {
    // Initially complete (idle)
    expect(waveManager.isWaveComplete()).toBe(true);
    
    waveManager.startWave(1);
    expect(waveManager.isWaveComplete()).toBe(false);
  });

  it('should allow setting auto-start next wave', () => {
    expect(() => waveManager.setAutoStartNextWave(false)).not.toThrow();
    expect(() => waveManager.setAutoStartNextWave(true)).not.toThrow();
  });

  it('should handle multiple waves sequentially', () => {
    waveManager.startWave(1);
    expect(waveManager.getCurrentWave()).toBe(1);
    
    waveManager.startWave(2);
    expect(waveManager.getCurrentWave()).toBe(2);
  });
});
