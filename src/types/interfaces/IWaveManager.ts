/**
 * Wave Manager Interface
 * Defines the contract for wave management functionality.
 * 
 * @module types/interfaces/IWaveManager
 */

/**
 * Wave state enum - represents the current phase of wave processing
 */
export type WaveState = 'idle' | 'spawning' | 'active' | 'complete';

/**
 * Interface for Wave Manager
 * Manages wave spawning, progression, and completion detection.
 */
export interface IWaveManager {
  /**
   * Sets rendering dependencies for visual effects.
   * 
   * Note: Uses `unknown` types to avoid coupling the interface to concrete
   * rendering implementations. The implementation is responsible for
   * type-checking these dependencies.
   * 
   * @param particleSystem - Particle system for spawn effects
   * @param spriteManager - Sprite manager for entity visuals
   */
  setRenderingDependencies(particleSystem: unknown, spriteManager: unknown): void;

  /**
   * Initializes the wave manager with a world
   * @param world - The ECS world to spawn entities into
   */
  init(world: unknown): void;

  /**
   * Starts a specific wave
   * @param waveNumber - The wave number to start (1-indexed)
   */
  startWave(waveNumber: number): void;

  /**
   * Updates the wave manager
   * @param deltaTime - Time elapsed since last update (in seconds)
   */
  update(deltaTime: number): void;

  /**
   * Marks an enemy as defeated (called externally when enemy dies)
   * @param entityId - The entity ID of the defeated enemy
   */
  removeEnemy(entityId: number): void;

  /**
   * Checks if the current wave is complete
   * @returns True if the wave is complete
   */
  isWaveComplete(): boolean;

  /**
   * Gets the current wave number
   * @returns The current wave number
   */
  getCurrentWave(): number;

  /**
   * Gets the current wave state
   * @returns The current wave state
   */
  getState(): WaveState;

  /**
   * Gets the number of active enemies
   * @returns Number of active enemies
   */
  getActiveEnemyCount(): number;

  /**
   * Sets whether to auto-start the next wave
   * @param enabled - Whether to auto-start
   */
  setAutoStartNextWave(enabled: boolean): void;

  /**
   * Resets the wave manager
   */
  reset(): void;
}
