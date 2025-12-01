/**
 * Score Manager for Kobayashi Maru
 * Tracks gameplay metrics including time survived, wave reached, and enemies defeated
 */
import { EventBus } from '../core/EventBus';
import { GameEventType, EnemyKilledPayload, WaveCompletedPayload } from '../types/events';

/**
 * Score data interface
 */
export interface ScoreData {
  timeSurvived: number;       // seconds survived
  waveReached: number;        // highest wave completed
  enemiesDefeated: number;    // total kills
  civiliansSaved: number;     // Kobayashi Maru survivors (future feature)
}

/**
 * ScoreManager class - tracks all gameplay metrics
 * Automatically subscribes to EventBus events for ENEMY_KILLED and WAVE_COMPLETED
 */
export class ScoreManager {
  private timeSurvived: number = 0;
  private waveReached: number = 0;
  private enemiesDefeated: number = 0;
  private civiliansSaved: number = 0;
  private killsByFaction: Map<number, number> = new Map();
  private eventBus: EventBus;
  private boundHandleEnemyKilled: (payload: EnemyKilledPayload) => void;
  private boundHandleWaveCompleted: (payload: WaveCompletedPayload) => void;

  constructor() {
    this.eventBus = EventBus.getInstance();
    
    // Bind handlers to preserve 'this' context
    this.boundHandleEnemyKilled = this.handleEnemyKilled.bind(this);
    this.boundHandleWaveCompleted = this.handleWaveCompleted.bind(this);
    
    // Subscribe to events
    this.subscribeToEvents();
  }

  /**
   * Subscribe to EventBus events
   */
  private subscribeToEvents(): void {
    this.eventBus.on(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
    this.eventBus.on(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);
  }

  /**
   * Unsubscribe from EventBus events
   * Call this when destroying the ScoreManager
   */
  unsubscribe(): void {
    this.eventBus.off(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
    this.eventBus.off(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);
  }

  /**
   * Handle ENEMY_KILLED event
   */
  private handleEnemyKilled(payload: EnemyKilledPayload): void {
    this.addKill(payload.factionId);
  }

  /**
   * Handle WAVE_COMPLETED event
   */
  private handleWaveCompleted(payload: WaveCompletedPayload): void {
    this.setWaveReached(payload.waveNumber);
  }

  /**
   * Updates the time survived
   * @param deltaTime - Time elapsed since last update (in seconds)
   */
  update(deltaTime: number): void {
    if (deltaTime > 0) {
      this.timeSurvived += deltaTime;
    }
  }

  /**
   * Records an enemy kill
   * @param factionId - The faction ID of the defeated enemy
   */
  addKill(factionId: number): void {
    this.enemiesDefeated++;
    
    // Track kills by faction
    const currentCount = this.killsByFaction.get(factionId) || 0;
    this.killsByFaction.set(factionId, currentCount + 1);
  }

  /**
   * Updates the wave reached if higher than current
   * @param waveNumber - The wave number completed
   */
  setWaveReached(waveNumber: number): void {
    if (waveNumber > this.waveReached) {
      this.waveReached = waveNumber;
    }
  }

  /**
   * Adds to civilians saved count
   * @param count - Number of civilians saved
   */
  addCiviliansSaved(count: number): void {
    if (count > 0) {
      this.civiliansSaved += count;
    }
  }

  /**
   * Gets the current time survived
   * @returns Time survived in seconds
   */
  getTimeSurvived(): number {
    return this.timeSurvived;
  }

  /**
   * Gets the wave reached
   * @returns The highest wave reached
   */
  getWaveReached(): number {
    return this.waveReached;
  }

  /**
   * Gets the total enemies defeated
   * @returns Total number of enemies defeated
   */
  getEnemiesDefeated(): number {
    return this.enemiesDefeated;
  }

  /**
   * Gets the civilians saved
   * @returns Total number of civilians saved
   */
  getCiviliansSaved(): number {
    return this.civiliansSaved;
  }

  /**
   * Gets kills for a specific faction
   * @param factionId - The faction ID to query
   * @returns Number of kills for that faction
   */
  getKillsByFaction(factionId: number): number {
    return this.killsByFaction.get(factionId) || 0;
  }

  /**
   * Gets all score data as a single object
   * @returns ScoreData object with all metrics
   */
  getScoreData(): ScoreData {
    return {
      timeSurvived: this.timeSurvived,
      waveReached: this.waveReached,
      enemiesDefeated: this.enemiesDefeated,
      civiliansSaved: this.civiliansSaved
    };
  }

  /**
   * Resets all score metrics for a new game
   */
  reset(): void {
    this.timeSurvived = 0;
    this.waveReached = 0;
    this.enemiesDefeated = 0;
    this.civiliansSaved = 0;
    this.killsByFaction.clear();
  }
}
