/**
 * Score Manager Interface
 * Defines the contract for score and combo tracking.
 * 
 * @module types/interfaces/IScoreManager
 */

/**
 * Score data interface
 */
export interface ScoreData {
  timeSurvived: number;
  waveReached: number;
  enemiesDefeated: number;
  civiliansSaved: number;
  comboCount?: number;
  comboMultiplier?: number;
  maxCombo?: number;
}

/**
 * Interface for Score Manager
 * Tracks gameplay metrics including time survived, wave reached, enemies defeated, and combo system.
 */
export interface IScoreManager {
  /**
   * Updates the time survived and combo timer
   * @param deltaTime - Time elapsed in seconds
   */
  update(deltaTime: number): void;

  /**
   * Records an enemy kill and updates combo
   * @param factionId - The faction ID of the killed enemy
   */
  addKill(factionId: number): void;

  /**
   * Sets the wave reached
   * @param waveNumber - The wave number reached
   */
  setWaveReached(waveNumber: number): void;

  /**
   * Adds civilians saved count
   * @param count - Number of civilians saved
   */
  addCiviliansSaved(count: number): void;

  /**
   * Gets the time survived
   * @returns Time survived in seconds
   */
  getTimeSurvived(): number;

  /**
   * Gets the highest wave reached
   * @returns Wave number
   */
  getWaveReached(): number;

  /**
   * Gets the total enemies defeated
   * @returns Enemy count
   */
  getEnemiesDefeated(): number;

  /**
   * Gets the civilians saved count
   * @returns Civilians saved
   */
  getCiviliansSaved(): number;

  /**
   * Gets the current combo count
   * @returns Combo count
   */
  getComboCount(): number;

  /**
   * Gets the current combo multiplier
   * @returns Multiplier value
   */
  getComboMultiplier(): number;

  /**
   * Gets the maximum combo achieved
   * @returns Max combo count
   */
  getMaxCombo(): number;

  /**
   * Checks if combo is currently active
   * @returns True if combo is active
   */
  isComboActive(): boolean;

  /**
   * Gets remaining time for current combo
   * @returns Time in seconds
   */
  getComboTimeRemaining(): number;

  /**
   * Gets kills by faction
   * @param factionId - The faction ID
   * @returns Kill count for faction
   */
  getKillsByFaction(factionId: number): number;

  /**
   * Gets all score data
   * @returns Score data object
   */
  getScoreData(): ScoreData;

  /**
   * Unsubscribes from events
   */
  unsubscribe(): void;

  /**
   * Resets all score data
   */
  reset(): void;
}
