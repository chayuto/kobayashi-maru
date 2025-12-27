/**
 * Tests for EventBusDebugger
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EventBus } from '../core/EventBus';
import { EventBusDebugger } from '../core/EventBusDebugger';
import { GameEventType } from '../types/events';

describe('EventBusDebugger', () => {
  let debugger_: EventBusDebugger;

  beforeEach(() => {
    EventBus.resetInstance();
    debugger_ = new EventBusDebugger({ consoleLogging: false });
  });

  afterEach(() => {
    debugger_.disable();
    EventBus.resetInstance();
  });

  describe('enable/disable', () => {
    it('should not be enabled by default', () => {
      expect(debugger_.isEnabled()).toBe(false);
    });

    it('should enable and disable', () => {
      debugger_.enable();
      expect(debugger_.isEnabled()).toBe(true);

      debugger_.disable();
      expect(debugger_.isEnabled()).toBe(false);
    });

    it('should not double-enable', () => {
      debugger_.enable();
      debugger_.enable(); // Should not throw
      expect(debugger_.isEnabled()).toBe(true);
    });

    it('should not double-disable', () => {
      debugger_.enable();
      debugger_.disable();
      debugger_.disable(); // Should not throw
      expect(debugger_.isEnabled()).toBe(false);
    });
  });

  describe('event logging', () => {
    it('should log events when enabled', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });

      const log = debugger_.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].event).toBe(GameEventType.ENEMY_KILLED);
      expect(log[0].payload).toEqual({
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });
    });

    it('should not log events when disabled', () => {
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.ENEMY_KILLED, {
        entityId: 1,
        factionId: 2,
        x: 100,
        y: 200
      });

      expect(debugger_.getLog()).toHaveLength(0);
    });

    it('should stop logging after disable', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });
      debugger_.disable();
      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 2 });

      const log = debugger_.getLog();
      expect(log).toHaveLength(1);
      expect(log[0].payload).toEqual({ waveNumber: 1 });
    });

    it('should include timestamp', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();
      const before = performance.now();

      eventBus.emit(GameEventType.COMBO_UPDATED, {
        comboCount: 5,
        multiplier: 2.0,
        isActive: true
      });

      const after = performance.now();
      const log = debugger_.getLog();
      expect(log[0].timestamp).toBeGreaterThanOrEqual(before);
      expect(log[0].timestamp).toBeLessThanOrEqual(after);
    });
  });

  describe('log management', () => {
    it('should respect maxLogSize', () => {
      const smallDebugger = new EventBusDebugger({ maxLogSize: 3, consoleLogging: false });
      smallDebugger.enable();
      const eventBus = EventBus.getInstance();

      for (let i = 0; i < 5; i++) {
        eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: i + 1 });
      }

      const log = smallDebugger.getLog();
      expect(log).toHaveLength(3);
      // Should keep the last 3 events
      expect(log[0].payload).toEqual({ waveNumber: 3 });
      expect(log[1].payload).toEqual({ waveNumber: 4 });
      expect(log[2].payload).toEqual({ waveNumber: 5 });

      smallDebugger.disable();
    });

    it('should clear log', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 1 });
      expect(debugger_.getLogCount()).toBe(1);

      debugger_.clear();
      expect(debugger_.getLogCount()).toBe(0);
    });

    it('should return copy of log', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });

      const log1 = debugger_.getLog();
      const log2 = debugger_.getLog();
      expect(log1).not.toBe(log2);
      expect(log1).toEqual(log2);
    });
  });

  describe('filtering', () => {
    it('should filter by event type', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });
      eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 1, factionId: 2, x: 0, y: 0 });
      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 2 });
      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 1 });

      const waveStartEvents = debugger_.getEventsByType(GameEventType.WAVE_STARTED);
      expect(waveStartEvents).toHaveLength(2);
      expect(waveStartEvents[0].payload).toEqual({ waveNumber: 1 });
      expect(waveStartEvents[1].payload).toEqual({ waveNumber: 2 });
    });

    it('should filter by time range', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });
      const middleTime = performance.now();
      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 2 });
      const endTime = performance.now();

      // Get events after middleTime (should only include wave 2)
      const filtered = debugger_.getEventsByTimeRange(middleTime, endTime);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].payload).toEqual({ waveNumber: 2 });
    });
  });

  describe('statistics', () => {
    it('should count events by type', () => {
      debugger_.enable();
      const eventBus = EventBus.getInstance();

      eventBus.emit(GameEventType.WAVE_STARTED, { waveNumber: 1 });
      eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 1, factionId: 2, x: 0, y: 0 });
      eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 2, factionId: 3, x: 0, y: 0 });
      eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 1 });

      const counts = debugger_.getEventCounts();
      expect(counts.get(GameEventType.WAVE_STARTED)).toBe(1);
      expect(counts.get(GameEventType.ENEMY_KILLED)).toBe(2);
      expect(counts.get(GameEventType.WAVE_COMPLETED)).toBe(1);
    });
  });

  describe('console logging', () => {
    it('should log to console when consoleLogging is true', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const loggingDebugger = new EventBusDebugger({ consoleLogging: true });
      loggingDebugger.enable();

      const eventBus = EventBus.getInstance();
      eventBus.emit(GameEventType.RESOURCE_UPDATED, { current: 100, amount: 10 });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Event] RESOURCE_UPDATED',
        { current: 100, amount: 10 }
      );

      loggingDebugger.disable();
      consoleSpy.mockRestore();
    });
  });
});
