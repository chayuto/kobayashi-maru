/**
 * Wave Manager for Kobayashi Maru
 * Manages wave spawning, progression, and completion detection
 */
import { FactionId, GAME_CONFIG } from '../types/constants';
import { GameEventType } from '../types/events';
import {
  createKlingonShip,
  createRomulanShip,
  createBorgShip,
  createTholianShip,
  createSpecies8472Ship
} from '../ecs/entityFactory';
import { AudioManager, SoundType } from '../audio';
import { Velocity, Health, Shield } from '../ecs/components';
import type { GameWorld } from '../ecs/world';
import {
  WaveConfig,
  EnemySpawnConfig,
  getWaveConfig,
  getDifficultyScale
} from './waveConfig';
import { SpawnPoints, SpawnPosition } from './spawnPoints';
import { EventBus } from '../core/EventBus';

/**
 * Event types emitted by the WaveManager
 * @deprecated Use GameEventType from '../types/events' instead
 */
export type WaveEventType = 'waveStart' | 'waveComplete' | 'enemySpawned';

/**
 * Wave event callback type
 * @deprecated Use EventBus for event handling
 */
export type WaveEventCallback = (event: WaveEvent) => void;

/**
 * Wave event data
 * @deprecated Use EventBus for event handling
 */
export interface WaveEvent {
  type: WaveEventType;
  waveNumber: number;
  data?: {
    enemyId?: number;
    faction?: number;
    totalEnemies?: number;
    remainingEnemies?: number;
  };
}

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

// Maximum spawns per frame to prevent frame spikes
const MAX_SPAWNS_PER_FRAME = 10;

// Default delay before next wave starts (ms)
const WAVE_COMPLETE_DELAY = 3000;

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
  private eventListeners: Map<WaveEventType, WaveEventCallback[]> = new Map();
  private nextWaveTimer: number = 0;
  private autoStartNextWave: boolean = true;
  private eventBus: EventBus;

  constructor() {
    this.eventBus = EventBus.getInstance();
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

    // Emit wave start event via local event system (backward compatibility)
    this.emitEvent({
      type: 'waveStart',
      waveNumber: this.currentWave,
      data: {
        totalEnemies: this.getTotalEnemyCount()
      }
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

    const eid = this.createEnemyByFaction(
      group.config.faction,
      position.x,
      position.y
    );

    if (eid !== -1) {
      // Apply difficulty scaling to health and shields
      this.applyDifficultyScaling(eid, difficultyScale);

      // Set velocity toward the center (Kobayashi Maru position)
      this.setVelocityTowardCenter(eid, position);

      // Track the enemy
      this.activeEnemies.add(eid);
      group.spawnedCount++;

      // Emit enemy spawned event
      this.emitEvent({
        type: 'enemySpawned',
        waveNumber: this.currentWave,
        data: {
          enemyId: eid,
          faction: group.config.faction,
          remainingEnemies: this.getTotalEnemyCount() - this.getSpawnedCount()
        }
      });
    }
  }

  /**
   * Creates an enemy entity based on faction
   */
  private createEnemyByFaction(faction: number, x: number, y: number): number {
    if (!this.world) return -1;

    switch (faction) {
      case FactionId.KLINGON:
        return createKlingonShip(this.world, x, y);
      case FactionId.ROMULAN:
        return createRomulanShip(this.world, x, y);
      case FactionId.BORG:
        return createBorgShip(this.world, x, y);
      case FactionId.THOLIAN:
        return createTholianShip(this.world, x, y);
      case FactionId.SPECIES_8472:
        return createSpecies8472Ship(this.world, x, y);
      default:
        console.warn(`Unknown faction: ${faction} `);
        return -1;
    }
  }

  /**
   * Applies difficulty scaling to an enemy's stats
   */
  private applyDifficultyScaling(eid: number, scale: number): void {
    // Scale health
    Health.current[eid] = Math.floor(Health.current[eid] * scale);
    Health.max[eid] = Math.floor(Health.max[eid] * scale);

    // Scale shields
    Shield.current[eid] = Math.floor(Shield.current[eid] * scale);
    Shield.max[eid] = Math.floor(Shield.max[eid] * scale);
  }

  /**
   * Sets enemy velocity to move toward the center (Kobayashi Maru)
   */
  private setVelocityTowardCenter(eid: number, position: SpawnPosition): void {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

    const dx = centerX - position.x;
    const dy = centerY - position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Speed range: 50-200 pixels per second, scaled by difficulty
      const baseSpeed = 50 + Math.random() * 150;
      const speedScale = 1 + (this.currentWave - 1) * 0.02; // 2% faster per wave
      const speed = baseSpeed * speedScale;

      Velocity.x[eid] = (dx / distance) * speed;
      Velocity.y[eid] = (dy / distance) * speed;
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

    // Emit wave complete event via local event system (backward compatibility)
    this.emitEvent({
      type: 'waveComplete',
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
   * Gets the number of enemies spawned so far
   */
  private getSpawnedCount(): number {
    return this.spawnGroups.reduce((sum, g) => sum + g.spawnedCount, 0);
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
   * Registers an event listener
   * @param eventType - The event type to listen for
   * @param callback - The callback function
   */
  on(eventType: WaveEventType, callback: WaveEventCallback): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(callback);
  }

  /**
   * Removes an event listener
   * @param eventType - The event type
   * @param callback - The callback to remove
   */
  off(eventType: WaveEventType, callback: WaveEventCallback): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emits an event to all registered listeners
   */
  private emitEvent(event: WaveEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      for (const callback of listeners) {
        callback(event);
      }
    }
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
