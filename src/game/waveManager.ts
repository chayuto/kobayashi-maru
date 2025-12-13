/**
 * Wave Manager for Kobayashi Maru
 * Manages wave spawning, progression, and completion detection.
 * 
 * Delegates specific functionality to sub-managers:
 * - EnemySpawner: enemy creation and velocity
 * - DifficultyScaler: wave-based stat scaling
 * - VariantApplier: elite/boss variant application
 * - SpawnEffects: visual effects for special enemies
 */
import { ParticleSystem } from '../rendering/ParticleSystem';
import { SpriteManager } from '../rendering/spriteManager';
import { WAVE_CONFIG } from '../config';
import { GameEventType } from '../types/events';
import { AudioManager, SoundType } from '../audio';
import type { GameWorld } from '../ecs/world';
import {
  WaveConfig,
  EnemySpawnConfig,
  getWaveConfig,
  getDifficultyScale,
  getBossWaveConfig
} from './waveConfig';
import { SpawnPoints } from './spawnPoints';
import { EventBus } from '../core/EventBus';
import { DifficultyScaler, SpawnEffects, VariantApplier, EnemySpawner } from './wave';




/**
 * Internal state for tracking spawning of a single enemy group
 */
interface SpawnGroupState {
  config: EnemySpawnConfig;
  spawnedCount: number;
  timeSinceLastSpawn: number;
  spawnPoints: SpawnPoints;
}

/**
 * Wave manager state
 */
export type WaveState = 'idle' | 'spawning' | 'active' | 'complete';

// Maximum spawns per frame to prevent frame spikes (from centralized config)
const MAX_SPAWNS_PER_FRAME = WAVE_CONFIG.SPAWN.MAX_SPAWNS_PER_FRAME;

// Default delay before next wave starts (from centralized config)
const WAVE_COMPLETE_DELAY = WAVE_CONFIG.TIMING.COMPLETE_DELAY_MS;

/**
 * WaveManager class
 * Handles wave progression, enemy spawning, and wave completion
 */
export class WaveManager {
  private world: GameWorld | null = null;
  private currentWave: number = 0;
  private state: WaveState = 'idle';
  private waveConfig: WaveConfig | null = null;
  private spawnGroups: SpawnGroupState[] = [];
  private activeEnemies: Set<number> = new Set();
  private nextWaveTimer: number = 0;
  private autoStartNextWave: boolean = true;
  private eventBus: EventBus;
  private spriteManager: SpriteManager | null = null;

  // Sub-managers for delegated functionality
  private readonly difficultyScaler: DifficultyScaler;
  private readonly spawnEffects: SpawnEffects;
  private readonly variantApplier: VariantApplier;
  private readonly enemySpawner: EnemySpawner;

  constructor() {
    this.eventBus = EventBus.getInstance();
    // Initialize sub-managers
    this.difficultyScaler = new DifficultyScaler();
    this.spawnEffects = new SpawnEffects();
    this.variantApplier = new VariantApplier(this.spawnEffects);
    this.enemySpawner = new EnemySpawner();
  }

  /**
   * Sets rendering dependencies for visual effects
   */
  setRenderingDependencies(particleSystem: ParticleSystem, spriteManager: SpriteManager): void {
    this.spriteManager = spriteManager;
    this.spawnEffects.setParticleSystem(particleSystem);
  }

  /**
   * Initializes the wave manager with a world
   * @param world - The ECS world to spawn entities into
   */
  init(world: GameWorld): void {
    this.world = world;
    this.currentWave = 0;
    this.state = 'idle';
    this.waveConfig = null;
    this.spawnGroups = [];
    this.activeEnemies.clear();
    this.nextWaveTimer = 0;

    // Initialize sub-managers with world
    this.enemySpawner.setWorld(world);
    if (this.spriteManager) {
      this.variantApplier.setDependencies(world, this.spriteManager);
    }
  }

  /**
   * Starts a specific wave
   * @param waveNumber - The wave number to start (1-indexed)
   */
  startWave(waveNumber: number): void {
    if (!this.world) {
      console.error('WaveManager: World not initialized');
      return;
    }

    this.currentWave = waveNumber;
    this.waveConfig = getWaveConfig(waveNumber);
    this.state = 'spawning';
    this.activeEnemies.clear();
    this.nextWaveTimer = 0;

    // Initialize spawn groups for each enemy configuration
    this.spawnGroups = this.waveConfig.enemies.map(config => ({
      config,
      spawnedCount: 0,
      timeSinceLastSpawn: config.spawnDelay, // Set equal to delay so condition (>= delay) is immediately true
      spawnPoints: this.createSpawnPoints(config)
    }));

    // Emit wave start event via EventBus
    this.eventBus.emit(GameEventType.WAVE_STARTED, {
      waveNumber: this.currentWave,
      totalEnemies: this.getTotalEnemyCount()
    });



    // Play wave start sound
    AudioManager.getInstance().play(SoundType.WAVE_START, { volume: 0.7 });

    console.log(`Wave ${waveNumber} started with ${this.getTotalEnemyCount()} enemies`);
  }

  /**
   * Creates spawn points for an enemy configuration
   */
  private createSpawnPoints(config: EnemySpawnConfig): SpawnPoints {
    const spawnPoints = new SpawnPoints();
    spawnPoints.setupFormation(config.count, config.formation ?? 'random');
    return spawnPoints;
  }

  /**
   * Updates the wave manager
   * @param deltaTime - Time elapsed since last update (in seconds)
   */
  update(deltaTime: number): void {
    if (!this.world || this.state === 'idle') {
      return;
    }

    // Handle different states
    switch (this.state) {
      case 'spawning':
        this.updateSpawning(deltaTime);
        break;
      case 'active':
        this.checkWaveCompletion();
        break;
      case 'complete':
        this.updateWaveComplete(deltaTime);
        break;
    }
  }

  /**
   * Updates enemy spawning during the spawning phase
   */
  private updateSpawning(deltaTime: number): void {
    const deltaMs = deltaTime * 1000;
    let spawnsThisFrame = 0;
    let allSpawningComplete = true;

    for (const group of this.spawnGroups) {
      if (group.spawnedCount >= group.config.count) {
        continue; // This group is done spawning
      }

      allSpawningComplete = false;
      group.timeSinceLastSpawn += deltaMs;

      // Spawn enemies if delay has passed and we haven't hit frame limit
      while (
        group.timeSinceLastSpawn >= group.config.spawnDelay &&
        group.spawnedCount < group.config.count &&
        spawnsThisFrame < MAX_SPAWNS_PER_FRAME
      ) {
        this.spawnEnemy(group);
        group.timeSinceLastSpawn -= group.config.spawnDelay;
        spawnsThisFrame++;
      }
    }

    // Transition to active state when all enemies are spawned
    if (allSpawningComplete) {
      this.state = 'active';
    }
  }

  /**
   * Spawns a single enemy from a spawn group
   */
  private spawnEnemy(group: SpawnGroupState): void {
    if (!this.world) return;

    const position = group.spawnPoints.getSpawnPosition();
    const difficultyScale = getDifficultyScale(this.currentWave);

    const eid = this.enemySpawner.createEnemy(
      group.config.faction,
      position.x,
      position.y
    );

    if (eid !== -1) {
      // Apply difficulty scaling via sub-manager
      this.difficultyScaler.applyScaling(eid, difficultyScale);

      // Determine if this should be elite or boss via sub-manager
      const bossWave = getBossWaveConfig(this.currentWave);
      this.variantApplier.applyVariant(eid, group.config.faction, this.currentWave, bossWave);

      // Set velocity toward the center via sub-manager
      this.enemySpawner.setVelocityTowardCenter(eid, position, this.currentWave);

      // Track the enemy
      this.activeEnemies.add(eid);
      group.spawnedCount++;
    }
  }

  /**
   * Checks if the wave is complete (all enemies defeated)
   * Wave completion is triggered when all active enemies have been removed via removeEnemy()
   */
  private checkWaveCompletion(): void {
    // Wave is complete when all enemies have been spawned and all active enemies are defeated
    // The removeEnemy() method should be called externally when enemies die
    // This check handles the case where enemies are removed during the active phase
    if (this.state === 'active' && this.activeEnemies.size === 0) {
      this.completeWave();
    }
  }

  /**
   * Updates the wave complete state (handles delay before next wave)
   */
  private updateWaveComplete(deltaTime: number): void {
    if (!this.autoStartNextWave) return;

    this.nextWaveTimer += deltaTime * 1000;

    if (this.nextWaveTimer >= WAVE_COMPLETE_DELAY) {
      this.startWave(this.currentWave + 1);
    }
  }

  /**
   * Marks an enemy as defeated (called externally when enemy dies)
   * @param entityId - The entity ID of the defeated enemy
   */
  removeEnemy(entityId: number): void {
    this.activeEnemies.delete(entityId);

    // Check if wave is complete
    if (this.state === 'active' && this.activeEnemies.size === 0) {
      this.completeWave();
    }
  }

  /**
   * Completes the current wave
   */
  private completeWave(): void {
    this.state = 'complete';
    this.nextWaveTimer = 0;

    // Emit wave complete event via EventBus
    this.eventBus.emit(GameEventType.WAVE_COMPLETED, {
      waveNumber: this.currentWave
    });



    // Play wave complete sound
    AudioManager.getInstance().play(SoundType.WAVE_COMPLETE, { volume: 0.7 });

    console.log(`Wave ${this.currentWave} complete!`);
  }

  /**
   * Checks if the current wave is complete
   * @returns True if the wave is complete
   */
  isWaveComplete(): boolean {
    return this.state === 'complete' || this.state === 'idle';
  }

  /**
   * Gets the current wave number
   * @returns The current wave number
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Gets the current wave state
   * @returns The current wave state
   */
  getState(): WaveState {
    return this.state;
  }

  /**
   * Gets the total number of enemies in the current wave
   */
  private getTotalEnemyCount(): number {
    if (!this.waveConfig) return 0;
    return this.waveConfig.enemies.reduce((sum, e) => sum + e.count, 0);
  }

  /**
   * Gets the number of active enemies
   * @returns Number of active enemies
   */
  getActiveEnemyCount(): number {
    return this.activeEnemies.size;
  }

  /**
   * Sets whether to auto-start the next wave
   * @param enabled - Whether to auto-start
   */
  setAutoStartNextWave(enabled: boolean): void {
    this.autoStartNextWave = enabled;
  }



  /**
   * Resets the wave manager
   */
  reset(): void {
    this.currentWave = 0;
    this.state = 'idle';
    this.waveConfig = null;
    this.spawnGroups = [];
    this.activeEnemies.clear();
    this.nextWaveTimer = 0;
  }
}
