/**
 * Score Manager for Kobayashi Maru
 * Tracks gameplay metrics including time survived, wave reached, enemies defeated, and combo system
 */
import { EventBus } from '../core/EventBus';
import { GameEventType, EnemyKilledPayload, WaveCompletedPayload } from '../types/events';

/** Combo multiplier thresholds */
const COMBO_TIERS = [
  { threshold: 0, multiplier: 1 },
  { threshold: 3, multiplier: 2 },
  { threshold: 6, multiplier: 3 },
  { threshold: 10, multiplier: 5 },
  { threshold: 20, multiplier: 10 }
];

/** Time window to maintain combo (seconds) */
const COMBO_TIMEOUT = 3.0;

/**
 * Score data interface
 */
export interface ScoreData {
  timeSurvived: number;
  waveReached: number;
  enemiesDefeated: number;
  civiliansSaved: number;
  comboCount?: number;      // Optional for backward compatibility
  comboMultiplier?: number; // Optional for backward compatibility
  maxCombo?: number;        // Optional for backward compatibility
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

  // Combo system
  private comboCount: number = 0;
  private comboTimer: number = 0;
  private comboMultiplier: number = 1;
  private maxCombo: number = 0;
  private comboActive: boolean = false;

  constructor() {
    this.eventBus = EventBus.getInstance();

    this.boundHandleEnemyKilled = this.handleEnemyKilled.bind(this);
    this.boundHandleWaveCompleted = this.handleWaveCompleted.bind(this);

    this.subscribeToEvents();
  }

  private subscribeToEvents(): void {
    this.eventBus.on(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
    this.eventBus.on(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);
  }

  unsubscribe(): void {
    this.eventBus.off(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
    this.eventBus.off(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);
  }

  private handleEnemyKilled(payload: EnemyKilledPayload): void {
    this.addKill(payload.factionId);
  }

  private handleWaveCompleted(payload: WaveCompletedPayload): void {
    this.setWaveReached(payload.waveNumber);
  }

  /**
   * Updates the time survived and combo timer
   */
  update(deltaTime: number): void {
    if (deltaTime > 0) {
      this.timeSurvived += deltaTime;

      // Update combo timer
      if (this.comboActive) {
        this.comboTimer -= deltaTime;
        if (this.comboTimer <= 0) {
          this.resetCombo();
        }
      }
    }
  }

  /**
   * Records an enemy kill and updates combo
   */
  addKill(factionId: number): void {
    this.enemiesDefeated++;

    const currentCount = this.killsByFaction.get(factionId) || 0;
    this.killsByFaction.set(factionId, currentCount + 1);

    // Update combo
    this.comboCount++;
    this.comboTimer = COMBO_TIMEOUT;
    this.comboActive = true;
    this.updateComboMultiplier();

    // Track max combo
    if (this.comboCount > this.maxCombo) {
      this.maxCombo = this.comboCount;
    }

    // Emit combo event
    this.eventBus.emit(GameEventType.COMBO_UPDATED, {
      comboCount: this.comboCount,
      multiplier: this.comboMultiplier,
      isActive: true
    });
  }

  /**
   * Calculate combo multiplier based on current count
   */
  private updateComboMultiplier(): void {
    for (let i = COMBO_TIERS.length - 1; i >= 0; i--) {
      if (this.comboCount >= COMBO_TIERS[i].threshold) {
        this.comboMultiplier = COMBO_TIERS[i].multiplier;
        break;
      }
    }
  }

  /**
   * Reset combo when timer expires
   */
  private resetCombo(): void {
    if (this.comboActive) {
      this.comboCount = 0;
      this.comboTimer = 0;
      this.comboMultiplier = 1;
      this.comboActive = false;

      this.eventBus.emit(GameEventType.COMBO_UPDATED, {
        comboCount: 0,
        multiplier: 1,
        isActive: false
      });
    }
  }

  setWaveReached(waveNumber: number): void {
    if (waveNumber > this.waveReached) {
      this.waveReached = waveNumber;
    }
  }

  addCiviliansSaved(count: number): void {
    if (count > 0) {
      this.civiliansSaved += count;
    }
  }

  // Getters
  getTimeSurvived(): number { return this.timeSurvived; }
  getWaveReached(): number { return this.waveReached; }
  getEnemiesDefeated(): number { return this.enemiesDefeated; }
  getCiviliansSaved(): number { return this.civiliansSaved; }
  getComboCount(): number { return this.comboCount; }
  getComboMultiplier(): number { return this.comboMultiplier; }
  getMaxCombo(): number { return this.maxCombo; }
  isComboActive(): boolean { return this.comboActive; }
  getComboTimeRemaining(): number { return this.comboTimer; }

  getKillsByFaction(factionId: number): number {
    return this.killsByFaction.get(factionId) || 0;
  }

  getScoreData(): ScoreData {
    return {
      timeSurvived: this.timeSurvived,
      waveReached: this.waveReached,
      enemiesDefeated: this.enemiesDefeated,
      civiliansSaved: this.civiliansSaved,
      comboCount: this.comboCount,
      comboMultiplier: this.comboMultiplier,
      maxCombo: this.maxCombo
    };
  }

  reset(): void {
    this.timeSurvived = 0;
    this.waveReached = 0;
    this.enemiesDefeated = 0;
    this.civiliansSaved = 0;
    this.killsByFaction.clear();
    this.comboCount = 0;
    this.comboTimer = 0;
    this.comboMultiplier = 1;
    this.comboActive = false;
    this.maxCombo = 0;
  }
}
