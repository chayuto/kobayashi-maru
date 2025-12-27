/**
 * Game State Manager for Kobayashi Maru
 * Manages game state transitions and emits events on state changes
 */
import type { IGameState, StateChangeCallback, StateChangeEvent } from '../types/interfaces';
import { GameStateType } from '../types/interfaces';

// Re-export types for backward compatibility
export { GameStateType };
export type { StateChangeEvent, StateChangeCallback };

/**
 * Valid state transitions map
 */
const VALID_TRANSITIONS: Record<GameStateType, GameStateType[]> = {
  [GameStateType.MENU]: [GameStateType.PLAYING],
  [GameStateType.PLAYING]: [GameStateType.PAUSED, GameStateType.GAME_OVER],
  [GameStateType.PAUSED]: [GameStateType.PLAYING, GameStateType.MENU],
  [GameStateType.GAME_OVER]: [GameStateType.MENU, GameStateType.PLAYING]
};

/**
 * GameState class - manages game state and transitions
 * Implements IGameState interface for consistent API contract.
 */
export class GameState implements IGameState {
  private currentState: GameStateType = GameStateType.MENU;
  private listeners: StateChangeCallback[] = [];

  /**
   * Gets the current game state
   * @returns The current game state
   */
  getState(): GameStateType {
    return this.currentState;
  }

  /**
   * Sets a new game state with validation
   * @param newState - The new state to transition to
   * @returns true if transition was successful, false otherwise
   */
  setState(newState: GameStateType): boolean {
    // Check if transition is valid
    const validTransitions = VALID_TRANSITIONS[this.currentState];
    if (!validTransitions.includes(newState)) {
      console.warn(
        `Invalid state transition from ${this.currentState} to ${newState}`
      );
      return false;
    }

    const previousState = this.currentState;
    this.currentState = newState;

    // Emit state change event
    this.emitStateChange({ previousState, newState });

    return true;
  }

  /**
   * Checks if the game is currently in the PLAYING state
   * @returns true if state is PLAYING
   */
  isPlaying(): boolean {
    return this.currentState === GameStateType.PLAYING;
  }

  /**
   * Checks if the game is currently paused
   * @returns true if state is PAUSED
   */
  isPaused(): boolean {
    return this.currentState === GameStateType.PAUSED;
  }

  /**
   * Checks if the game is over
   * @returns true if state is GAME_OVER
   */
  isGameOver(): boolean {
    return this.currentState === GameStateType.GAME_OVER;
  }

  /**
   * Checks if the game is in the menu
   * @returns true if state is MENU
   */
  isInMenu(): boolean {
    return this.currentState === GameStateType.MENU;
  }

  /**
   * Registers a state change listener
   * @param callback - Function to call when state changes
   */
  onStateChange(callback: StateChangeCallback): void {
    this.listeners.push(callback);
  }

  /**
   * Removes a state change listener
   * @param callback - The callback to remove
   */
  offStateChange(callback: StateChangeCallback): void {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Emits a state change event to all listeners
   * @param event - The state change event data
   */
  private emitStateChange(event: StateChangeEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  /**
   * Resets the game state to MENU
   */
  reset(): void {
    this.currentState = GameStateType.MENU;
  }
}
