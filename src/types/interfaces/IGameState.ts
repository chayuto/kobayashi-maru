/**
 * Game State Interface
 * Defines the contract for game state management.
 * 
 * @module types/interfaces/IGameState
 */

/**
 * Game states enum
 */
export enum GameStateType {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  GAME_OVER = 'GAME_OVER'
}

/**
 * State change event data
 */
export interface StateChangeEvent {
  previousState: GameStateType;
  newState: GameStateType;
}

/**
 * State change callback type
 */
export type StateChangeCallback = (event: StateChangeEvent) => void;

/**
 * Interface for Game State Manager
 * Manages game state transitions and emits events on state changes.
 */
export interface IGameState {
  /**
   * Gets the current game state
   * @returns The current game state
   */
  getState(): GameStateType;

  /**
   * Sets a new game state with validation
   * @param newState - The new state to transition to
   * @returns true if transition was successful, false otherwise
   */
  setState(newState: GameStateType): boolean;

  /**
   * Checks if the game is currently in the PLAYING state
   * @returns true if state is PLAYING
   */
  isPlaying(): boolean;

  /**
   * Checks if the game is currently paused
   * @returns true if state is PAUSED
   */
  isPaused(): boolean;

  /**
   * Checks if the game is over
   * @returns true if state is GAME_OVER
   */
  isGameOver(): boolean;

  /**
   * Checks if the game is in the menu
   * @returns true if state is MENU
   */
  isInMenu(): boolean;

  /**
   * Registers a state change listener
   * @param callback - Function to call when state changes
   */
  onStateChange(callback: StateChangeCallback): void;

  /**
   * Removes a state change listener
   * @param callback - The callback to remove
   */
  offStateChange(callback: StateChangeCallback): void;

  /**
   * Resets the game state to MENU
   */
  reset(): void;
}
