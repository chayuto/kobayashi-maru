/**
 * Tests for AlertStatusManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertLevel, GameEventType } from '../types/events';
import { UI_CONFIG } from '../config/ui.config';

// Capture emitted events
const mockEmit = vi.fn();
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      emit: mockEmit,
    }),
  },
}));

import { AlertStatusManager } from '../game/AlertStatusManager';

describe('AlertStatusManager', () => {
  let manager: AlertStatusManager;
  const config = UI_CONFIG.ALERT_STATUS;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new AlertStatusManager();
  });

  it('should start at NORMAL level', () => {
    expect(manager.getLevel()).toBe(AlertLevel.NORMAL);
  });

  it('should transition to CRITICAL when hull <= 20%', () => {
    manager.evaluate(config.CRITICAL_HULL_PERCENT, false);
    expect(manager.getLevel()).toBe(AlertLevel.CRITICAL);
    expect(mockEmit).toHaveBeenCalledWith(GameEventType.ALERT_LEVEL_CHANGED, {
      level: AlertLevel.CRITICAL,
      previousLevel: AlertLevel.NORMAL,
    });
  });

  it('should transition to CAUTION when hull <= 50%', () => {
    manager.evaluate(config.CAUTION_HULL_PERCENT, false);
    expect(manager.getLevel()).toBe(AlertLevel.CAUTION);
    expect(mockEmit).toHaveBeenCalledWith(GameEventType.ALERT_LEVEL_CHANGED, {
      level: AlertLevel.CAUTION,
      previousLevel: AlertLevel.NORMAL,
    });
  });

  it('should transition to CAUTION when boss wave is active', () => {
    manager.evaluate(0.8, true); // hull is healthy but boss wave
    expect(manager.getLevel()).toBe(AlertLevel.CAUTION);
  });

  it('should stay NORMAL when hull > 50% and no boss wave', () => {
    manager.evaluate(0.8, false);
    expect(manager.getLevel()).toBe(AlertLevel.NORMAL);
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should not emit when level stays the same', () => {
    manager.evaluate(config.CRITICAL_HULL_PERCENT, false);
    mockEmit.mockClear();

    // Same level again
    manager.evaluate(config.CRITICAL_HULL_PERCENT - 0.05, false);
    expect(mockEmit).not.toHaveBeenCalled();
  });

  it('should emit when transitioning from CRITICAL back to CAUTION', () => {
    // Go to critical
    manager.evaluate(config.CRITICAL_HULL_PERCENT, false);
    mockEmit.mockClear();

    // Heal to caution range
    manager.evaluate(0.40, false);
    expect(mockEmit).toHaveBeenCalledWith(GameEventType.ALERT_LEVEL_CHANGED, {
      level: AlertLevel.CAUTION,
      previousLevel: AlertLevel.CRITICAL,
    });
  });

  it('should emit when transitioning from CAUTION back to NORMAL', () => {
    manager.evaluate(config.CAUTION_HULL_PERCENT, false);
    mockEmit.mockClear();

    manager.evaluate(0.8, false);
    expect(mockEmit).toHaveBeenCalledWith(GameEventType.ALERT_LEVEL_CHANGED, {
      level: AlertLevel.NORMAL,
      previousLevel: AlertLevel.CAUTION,
    });
  });

  it('should reset to NORMAL', () => {
    manager.evaluate(config.CRITICAL_HULL_PERCENT, false);
    manager.reset();
    expect(manager.getLevel()).toBe(AlertLevel.NORMAL);
  });

  it('should prioritize CRITICAL over boss wave CAUTION', () => {
    // Critical hull during boss wave should still be CRITICAL
    manager.evaluate(config.CRITICAL_HULL_PERCENT, true);
    expect(manager.getLevel()).toBe(AlertLevel.CRITICAL);
  });
});
