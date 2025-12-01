/**
 * Tests for EventBus
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';

describe('EventBus', () => {
  beforeEach(() => {
    // Reset singleton instance before each test
    EventBus.resetInstance();
  });

  describe('singleton pattern', () => {
    it('should return the same instance', () => {
      const instance1 = EventBus.getInstance();
      const instance2 = EventBus.getInstance();
      expect(instance1).toBe(instance2);
    });

    it('should reset instance properly', () => {
      const instance1 = EventBus.getInstance();
      EventBus.resetInstance();
      const instance2 = EventBus.getInstance();
      expect(instance1).not.toBe(instance2);
    });
  });

  describe('on/emit', () => {
    it('should call handler when event is emitted', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.ENEMY_KILLED, handler);
      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith({
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });
    });

    it('should call multiple handlers for the same event', () => {
      const eventBus = EventBus.getInstance();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(GameEventType.WAVE_STARTED, handler1);
      eventBus.on(GameEventType.WAVE_STARTED, handler2);
      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 5 });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not call handlers for different events', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.ENEMY_KILLED, handler);
      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 3 });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle emit with no listeners', () => {
      const eventBus = EventBus.getInstance();

      // Should not throw
      expect(() => {
        eventBus.emit(GameEventType.GAME_OVER, { score: 1000 });
      }).not.toThrow();
    });
  });

  describe('off', () => {
    it('should remove handler after off is called', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.RESOURCE_UPDATED, handler);
      eventBus.off(GameEventType.RESOURCE_UPDATED, handler);
      eventBus.emit(GameEventType.RESOURCE_UPDATED, { current: 100, amount: 10 });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove specified handler', () => {
      const eventBus = EventBus.getInstance();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(GameEventType.PLAYER_DAMAGED, handler1);
      eventBus.on(GameEventType.PLAYER_DAMAGED, handler2);
      eventBus.off(GameEventType.PLAYER_DAMAGED, handler1);
      eventBus.emit(GameEventType.PLAYER_DAMAGED, { currentHealth: 50 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should handle off with non-existent handler', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      // Should not throw
      expect(() => {
        eventBus.off(GameEventType.ENEMY_KILLED, handler);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all listeners for a specific event', () => {
      const eventBus = EventBus.getInstance();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(GameEventType.WAVE_STARTED, handler1);
      eventBus.on(GameEventType.WAVE_STARTED, handler2);
      eventBus.clear(GameEventType.WAVE_STARTED);
      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should not affect listeners for other events', () => {
      const eventBus = EventBus.getInstance();
      const waveHandler = vi.fn();
      const killHandler = vi.fn();

      eventBus.on(GameEventType.WAVE_STARTED, waveHandler);
      eventBus.on(GameEventType.ENEMY_KILLED, killHandler);
      eventBus.clear(GameEventType.WAVE_STARTED);

      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: 1,
        factionId: 2,
        x: 0,
        y: 0
      });

      expect(waveHandler).not.toHaveBeenCalled();
      expect(killHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('clearAll', () => {
    it('should remove all listeners for all events', () => {
      const eventBus = EventBus.getInstance();
      const waveHandler = vi.fn();
      const killHandler = vi.fn();

      eventBus.on(GameEventType.WAVE_STARTED, waveHandler);
      eventBus.on(GameEventType.ENEMY_KILLED, killHandler);
      eventBus.clearAll();

      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });
      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: 1,
        factionId: 2,
        x: 0,
        y: 0
      });

      expect(waveHandler).not.toHaveBeenCalled();
      expect(killHandler).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for events with no listeners', () => {
      const eventBus = EventBus.getInstance();
      expect(eventBus.listenerCount(GameEventType.ENEMY_KILLED)).toBe(0);
    });

    it('should return correct count after adding listeners', () => {
      const eventBus = EventBus.getInstance();
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on(GameEventType.WAVE_COMPLETED, handler1);
      expect(eventBus.listenerCount(GameEventType.WAVE_COMPLETED)).toBe(1);

      eventBus.on(GameEventType.WAVE_COMPLETED, handler2);
      expect(eventBus.listenerCount(GameEventType.WAVE_COMPLETED)).toBe(2);
    });

    it('should return correct count after removing listeners', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.GAME_OVER, handler);
      expect(eventBus.listenerCount(GameEventType.GAME_OVER)).toBe(1);

      eventBus.off(GameEventType.GAME_OVER, handler);
      expect(eventBus.listenerCount(GameEventType.GAME_OVER)).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should catch errors in handlers and continue', () => {
      const eventBus = EventBus.getInstance();
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const goodHandler = vi.fn();
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      eventBus.on(GameEventType.ENEMY_KILLED, errorHandler);
      eventBus.on(GameEventType.ENEMY_KILLED, goodHandler);

      // Should not throw
      expect(() => {
        eventBus.emit(GameEventType.ENEMY_KILLED, {
          entityId: 1,
          factionId: 2,
          x: 0,
          y: 0
        });
      }).not.toThrow();

      // Error should be logged
      expect(consoleSpy).toHaveBeenCalled();

      // Good handler should still be called
      expect(goodHandler).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('type safety', () => {
    it('should work with WAVE_STARTED payload', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.WAVE_STARTED, handler);
      eventBus.emit(GameEventType.WAVE_STARTED, {
        waveNumber: 5,
        totalEnemies: 10
      });

      expect(handler).toHaveBeenCalledWith({
        waveNumber: 5,
        totalEnemies: 10
      });
    });

    it('should work with WAVE_COMPLETED payload', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.WAVE_COMPLETED, handler);
      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 3 });

      expect(handler).toHaveBeenCalledWith({ waveNumber: 3 });
    });

    it('should work with RESOURCE_UPDATED payload', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.RESOURCE_UPDATED, handler);
      eventBus.emit(GameEventType.RESOURCE_UPDATED, {
        current: 500,
        amount: 50
      });

      expect(handler).toHaveBeenCalledWith({
        current: 500,
        amount: 50
      });
    });

    it('should work with PLAYER_DAMAGED payload', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.PLAYER_DAMAGED, handler);
      eventBus.emit(GameEventType.PLAYER_DAMAGED, { currentHealth: 75 });

      expect(handler).toHaveBeenCalledWith({ currentHealth: 75 });
    });

    it('should work with GAME_OVER payload', () => {
      const eventBus = EventBus.getInstance();
      const handler = vi.fn();

      eventBus.on(GameEventType.GAME_OVER, handler);
      eventBus.emit(GameEventType.GAME_OVER, { score: 12500 });

      expect(handler).toHaveBeenCalledWith({ score: 12500 });
    });
  });
});
