/**
 * Tests for Game State System
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GameState, GameStateType } from '../game/gameState';

describe('GameState', () => {
  let gameState: GameState;

  beforeEach(() => {
    gameState = new GameState();
  });

  describe('initial state', () => {
    it('should start in MENU state', () => {
      expect(gameState.getState()).toBe(GameStateType.MENU);
    });

    it('should report isInMenu as true initially', () => {
      expect(gameState.isInMenu()).toBe(true);
    });

    it('should report isPlaying as false initially', () => {
      expect(gameState.isPlaying()).toBe(false);
    });

    it('should report isPaused as false initially', () => {
      expect(gameState.isPaused()).toBe(false);
    });

    it('should report isGameOver as false initially', () => {
      expect(gameState.isGameOver()).toBe(false);
    });
  });

  describe('valid state transitions', () => {
    it('should allow MENU -> PLAYING', () => {
      const result = gameState.setState(GameStateType.PLAYING);
      expect(result).toBe(true);
      expect(gameState.getState()).toBe(GameStateType.PLAYING);
      expect(gameState.isPlaying()).toBe(true);
    });

    it('should allow PLAYING -> PAUSED', () => {
      gameState.setState(GameStateType.PLAYING);
      const result = gameState.setState(GameStateType.PAUSED);
      expect(result).toBe(true);
      expect(gameState.getState()).toBe(GameStateType.PAUSED);
      expect(gameState.isPaused()).toBe(true);
    });

    it('should allow PLAYING -> GAME_OVER', () => {
      gameState.setState(GameStateType.PLAYING);
      const result = gameState.setState(GameStateType.GAME_OVER);
      expect(result).toBe(true);
      expect(gameState.getState()).toBe(GameStateType.GAME_OVER);
      expect(gameState.isGameOver()).toBe(true);
    });

    it('should allow PAUSED -> PLAYING', () => {
      gameState.setState(GameStateType.PLAYING);
      gameState.setState(GameStateType.PAUSED);
      const result = gameState.setState(GameStateType.PLAYING);
      expect(result).toBe(true);
      expect(gameState.isPlaying()).toBe(true);
    });

    it('should allow PAUSED -> MENU', () => {
      gameState.setState(GameStateType.PLAYING);
      gameState.setState(GameStateType.PAUSED);
      const result = gameState.setState(GameStateType.MENU);
      expect(result).toBe(true);
      expect(gameState.isInMenu()).toBe(true);
    });

    it('should allow GAME_OVER -> MENU', () => {
      gameState.setState(GameStateType.PLAYING);
      gameState.setState(GameStateType.GAME_OVER);
      const result = gameState.setState(GameStateType.MENU);
      expect(result).toBe(true);
      expect(gameState.isInMenu()).toBe(true);
    });
  });

  describe('invalid state transitions', () => {
    it('should not allow MENU -> PAUSED', () => {
      const result = gameState.setState(GameStateType.PAUSED);
      expect(result).toBe(false);
      expect(gameState.getState()).toBe(GameStateType.MENU);
    });

    it('should not allow MENU -> GAME_OVER', () => {
      const result = gameState.setState(GameStateType.GAME_OVER);
      expect(result).toBe(false);
      expect(gameState.getState()).toBe(GameStateType.MENU);
    });

    it('should not allow PLAYING -> MENU directly', () => {
      gameState.setState(GameStateType.PLAYING);
      const result = gameState.setState(GameStateType.MENU);
      expect(result).toBe(false);
      expect(gameState.getState()).toBe(GameStateType.PLAYING);
    });

    it('should not allow GAME_OVER -> PLAYING directly', () => {
      gameState.setState(GameStateType.PLAYING);
      gameState.setState(GameStateType.GAME_OVER);
      const result = gameState.setState(GameStateType.PLAYING);
      expect(result).toBe(false);
      expect(gameState.getState()).toBe(GameStateType.GAME_OVER);
    });
  });

  describe('event emission', () => {
    it('should emit event on valid state change', () => {
      let eventReceived = false;
      let previousState: GameStateType | null = null;
      let newState: GameStateType | null = null;

      gameState.onStateChange((event) => {
        eventReceived = true;
        previousState = event.previousState;
        newState = event.newState;
      });

      gameState.setState(GameStateType.PLAYING);

      expect(eventReceived).toBe(true);
      expect(previousState).toBe(GameStateType.MENU);
      expect(newState).toBe(GameStateType.PLAYING);
    });

    it('should not emit event on invalid state change', () => {
      let eventReceived = false;

      gameState.onStateChange(() => {
        eventReceived = true;
      });

      gameState.setState(GameStateType.PAUSED); // Invalid from MENU

      expect(eventReceived).toBe(false);
    });

    it('should allow removing event listeners', () => {
      let callCount = 0;
      const callback = () => { callCount++; };

      gameState.onStateChange(callback);
      gameState.setState(GameStateType.PLAYING);
      expect(callCount).toBe(1);

      gameState.offStateChange(callback);
      gameState.setState(GameStateType.PAUSED);
      expect(callCount).toBe(1); // Should not increment
    });

    it('should emit events to multiple listeners', () => {
      let count1 = 0;
      let count2 = 0;

      gameState.onStateChange(() => { count1++; });
      gameState.onStateChange(() => { count2++; });

      gameState.setState(GameStateType.PLAYING);

      expect(count1).toBe(1);
      expect(count2).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset to MENU state', () => {
      gameState.setState(GameStateType.PLAYING);
      gameState.setState(GameStateType.GAME_OVER);
      
      gameState.reset();
      
      expect(gameState.getState()).toBe(GameStateType.MENU);
      expect(gameState.isInMenu()).toBe(true);
    });
  });
});
