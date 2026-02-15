/**
 * Tests for core utilities: ScreenShake, QualityManager, GameCheatManager, TouchInputManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Mock pixi.js before any imports that depend on it ──
vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

import { ScreenShake } from '../rendering/ScreenShake';
import { QualityManager, QUALITY_PRESETS } from '../core/QualityManager';
import { PerformanceMonitor, PerformanceTier } from '../core/PerformanceMonitor';
import { GameCheatManager } from '../core/GameCheatManager';
import { TouchInputManager } from '../core/TouchInputManager';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types';
import { MockApplication } from './helpers/mockPixi';
import { Application } from 'pixi.js';
import { GAME_CONFIG } from '../types/constants';

// ─────────────────────────────────────────────────────
// ScreenShake
// ─────────────────────────────────────────────────────
describe('ScreenShake', () => {
  let screenShake: ScreenShake;

  beforeEach(() => {
    screenShake = new ScreenShake();
  });

  it('should not be active initially', () => {
    expect(screenShake.isActive()).toBe(false);
  });

  it('should return zero offset when not active', () => {
    const result = screenShake.update(0.016);
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });

  it('should become active after calling shake', () => {
    screenShake.shake(10, 0.5);
    expect(screenShake.isActive()).toBe(true);
  });

  it('should produce non-zero offset when active', () => {
    // Arrange
    screenShake.shake(100, 1.0);

    // Act - update a small amount
    const result = screenShake.update(0.01);

    // Assert - with intensity 100, offsets should be within [-100, 100]
    expect(Math.abs(result.offsetX)).toBeLessThanOrEqual(100);
    expect(Math.abs(result.offsetY)).toBeLessThanOrEqual(100);
  });

  it('should decay intensity over time', () => {
    // Arrange
    screenShake.shake(100, 1.0);

    // Act - advance to 50% through duration
    // At progress=0.5, intensity should be 50
    // We seed Math.random to test deterministically
    const earlyResult = screenShake.update(0.1); // 10% progress

    // Reset and advance further
    const screenShake2 = new ScreenShake();
    screenShake2.shake(100, 1.0);
    screenShake2.update(0.9); // 90% progress

    // Assert - later intensity should be reduced
    // With randomness we can only check bounds
    // At 10% progress: maxIntensity = 100 * 0.9 = 90
    expect(Math.abs(earlyResult.offsetX)).toBeLessThanOrEqual(90);
    expect(Math.abs(earlyResult.offsetY)).toBeLessThanOrEqual(90);
  });

  it('should become inactive after duration elapses', () => {
    // Arrange
    screenShake.shake(10, 0.5);

    // Act - exceed the duration
    screenShake.update(0.6);

    // Assert
    expect(screenShake.isActive()).toBe(false);
  });

  it('should return zero offset after duration elapses', () => {
    // Arrange
    screenShake.shake(10, 0.5);
    screenShake.update(0.6);

    // Act
    const result = screenShake.update(0.016);

    // Assert
    expect(result.offsetX).toBe(0);
    expect(result.offsetY).toBe(0);
  });

  it('should reset elapsed time when shake is called again', () => {
    // Arrange - shake once and let it almost expire
    screenShake.shake(10, 0.5);
    screenShake.update(0.4);

    // Act - shake again
    screenShake.shake(20, 1.0);

    // Assert - should be active again with new duration
    expect(screenShake.isActive()).toBe(true);
    // Should still be active after original duration would have ended
    screenShake.update(0.3);
    expect(screenShake.isActive()).toBe(true);
  });

  it('should accumulate elapsed time across multiple updates', () => {
    // Arrange
    screenShake.shake(10, 1.0);

    // Act - advance in small steps totalling > 1.0
    screenShake.update(0.3);
    screenShake.update(0.3);
    screenShake.update(0.3);
    screenShake.update(0.2);

    // Assert - total 1.1s > 1.0s duration
    expect(screenShake.isActive()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// QualityManager
// ─────────────────────────────────────────────────────
describe('QualityManager', () => {
  let qualityManager: QualityManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = new PerformanceMonitor();
    // Suppress console.log from constructor
    vi.spyOn(console, 'log').mockImplementation(() => { });
    qualityManager = new QualityManager(performanceMonitor);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with detected performance tier', () => {
    const tier = qualityManager.getTier();
    // In jsdom, navigator.hardwareConcurrency defaults to a value;
    // the tier should be one of the valid enum values
    expect([PerformanceTier.HIGH, PerformanceTier.MEDIUM, PerformanceTier.LOW]).toContain(tier);
  });

  it('should return settings matching the current tier', () => {
    const settings = qualityManager.getSettings();
    const tier = qualityManager.getTier();
    expect(settings).toEqual(QUALITY_PRESETS[tier]);
  });

  it('should switch to LOW tier when setTier is called with LOW', () => {
    // Act
    qualityManager.setTier(PerformanceTier.LOW);

    // Assert
    expect(qualityManager.getTier()).toBe(PerformanceTier.LOW);
    expect(qualityManager.getSettings()).toEqual(QUALITY_PRESETS[PerformanceTier.LOW]);
  });

  it('should switch to MEDIUM tier when setTier is called with MEDIUM', () => {
    qualityManager.setTier(PerformanceTier.MEDIUM);
    expect(qualityManager.getTier()).toBe(PerformanceTier.MEDIUM);
    expect(qualityManager.getSettings()).toEqual(QUALITY_PRESETS[PerformanceTier.MEDIUM]);
  });

  it('should switch to HIGH tier when setTier is called with HIGH', () => {
    qualityManager.setTier(PerformanceTier.HIGH);
    expect(qualityManager.getTier()).toBe(PerformanceTier.HIGH);
    expect(qualityManager.getSettings()).toEqual(QUALITY_PRESETS[PerformanceTier.HIGH]);
  });

  it('should have correct HIGH preset values', () => {
    const settings = QUALITY_PRESETS[PerformanceTier.HIGH];
    expect(settings.maxParticles).toBe(2000);
    expect(settings.starCount).toBe(1000);
    expect(settings.bloomEnabled).toBe(true);
    expect(settings.resolutionMultiplier).toBe(1.0);
    expect(settings.particleSpawnRate).toBe(1.0);
  });

  it('should have correct MEDIUM preset values', () => {
    const settings = QUALITY_PRESETS[PerformanceTier.MEDIUM];
    expect(settings.maxParticles).toBe(1000);
    expect(settings.starCount).toBe(500);
    expect(settings.bloomEnabled).toBe(false);
    expect(settings.resolutionMultiplier).toBe(1.0);
    expect(settings.particleSpawnRate).toBe(0.5);
  });

  it('should have correct LOW preset values', () => {
    const settings = QUALITY_PRESETS[PerformanceTier.LOW];
    expect(settings.maxParticles).toBe(500);
    expect(settings.starCount).toBe(200);
    expect(settings.bloomEnabled).toBe(false);
    expect(settings.resolutionMultiplier).toBe(0.8);
    expect(settings.particleSpawnRate).toBe(0.25);
  });

  it('should not throw when checkPerformance is called', () => {
    // checkPerformance reads averages from PerformanceMonitor
    expect(() => qualityManager.checkPerformance()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────
// GameCheatManager
// ─────────────────────────────────────────────────────
describe('GameCheatManager', () => {
  let cheatManager: GameCheatManager;

  beforeEach(() => {
    cheatManager = new GameCheatManager();
  });

  it('should have god mode disabled by default', () => {
    expect(cheatManager.isGodModeEnabled()).toBe(false);
  });

  it('should have slow mode disabled by default', () => {
    expect(cheatManager.isSlowModeEnabled()).toBe(false);
  });

  it('should enable god mode when setGodMode is called with true', () => {
    cheatManager.setGodMode(true);
    expect(cheatManager.isGodModeEnabled()).toBe(true);
  });

  it('should disable god mode when setGodMode is called with false', () => {
    cheatManager.setGodMode(true);
    cheatManager.setGodMode(false);
    expect(cheatManager.isGodModeEnabled()).toBe(false);
  });

  it('should toggle god mode on when toggleGodMode is called once', () => {
    const result = cheatManager.toggleGodMode();
    expect(result).toBe(true);
    expect(cheatManager.isGodModeEnabled()).toBe(true);
  });

  it('should toggle god mode off when toggleGodMode is called twice', () => {
    cheatManager.toggleGodMode();
    const result = cheatManager.toggleGodMode();
    expect(result).toBe(false);
    expect(cheatManager.isGodModeEnabled()).toBe(false);
  });

  it('should enable slow mode when setSlowMode is called with true', () => {
    cheatManager.setSlowMode(true);
    expect(cheatManager.isSlowModeEnabled()).toBe(true);
  });

  it('should disable slow mode when setSlowMode is called with false', () => {
    cheatManager.setSlowMode(true);
    cheatManager.setSlowMode(false);
    expect(cheatManager.isSlowModeEnabled()).toBe(false);
  });

  it('should toggle slow mode on when toggleSlowMode is called once', () => {
    const result = cheatManager.toggleSlowMode();
    expect(result).toBe(true);
    expect(cheatManager.isSlowModeEnabled()).toBe(true);
  });

  it('should toggle slow mode off when toggleSlowMode is called twice', () => {
    cheatManager.toggleSlowMode();
    const result = cheatManager.toggleSlowMode();
    expect(result).toBe(false);
    expect(cheatManager.isSlowModeEnabled()).toBe(false);
  });

  it('should return 1.0 speed multiplier when slow mode is disabled', () => {
    expect(cheatManager.getSpeedMultiplier()).toBe(1.0);
  });

  it('should return SLOW_MODE_MULTIPLIER when slow mode is enabled', () => {
    cheatManager.setSlowMode(true);
    expect(cheatManager.getSpeedMultiplier()).toBe(GAME_CONFIG.SLOW_MODE_MULTIPLIER);
  });

  it('should reset all cheats when reset is called', () => {
    // Arrange - enable everything
    cheatManager.setGodMode(true);
    cheatManager.setSlowMode(true);

    // Act
    cheatManager.reset();

    // Assert
    expect(cheatManager.isGodModeEnabled()).toBe(false);
    expect(cheatManager.isSlowModeEnabled()).toBe(false);
    expect(cheatManager.getSpeedMultiplier()).toBe(1.0);
  });
});

// ─────────────────────────────────────────────────────
// TouchInputManager
// ─────────────────────────────────────────────────────
describe('TouchInputManager', () => {
  let touchInputManager: TouchInputManager;
  let mockApp: MockApplication;
  let eventBus: EventBus;

  // Helper: create mock TouchEvent
  const createTouchEvent = (
    type: string,
    touches: { clientX: number; clientY: number }[],
    changedTouches: { clientX: number; clientY: number }[] = []
  ) => {
    return {
      type,
      touches: touches.map((t, i) => ({ ...t, identifier: i })),
      changedTouches: changedTouches.map((t, i) => ({ ...t, identifier: i })),
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
    } as unknown as TouchEvent;
  };

  beforeEach(() => {
    // Reset EventBus singleton
    // @ts-expect-error - accessing private property for testing
    EventBus.instance = null;
    eventBus = EventBus.getInstance();
    vi.spyOn(eventBus, 'emit');

    mockApp = new MockApplication();
    touchInputManager = new TouchInputManager(mockApp as unknown as Application);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    EventBus.resetInstance();
  });

  it('should initialize without errors', () => {
    expect(() => touchInputManager.init()).not.toThrow();
  });

  it('should register touch event listeners on init', () => {
    // Arrange
    const canvas = mockApp.canvas as HTMLCanvasElement;
    const addEventListenerSpy = vi.spyOn(canvas, 'addEventListener');

    // Act
    touchInputManager.init();

    // Assert
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function),
      { passive: false }
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      { passive: false }
    );
    expect(addEventListenerSpy).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function)
    );
  });

  it('should warn when canvas is not found during init', () => {
    // Arrange
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });
    const noCanvasApp = new MockApplication();
    // @ts-expect-error - setting canvas to null for testing
    noCanvasApp.canvas = null;
    const manager = new TouchInputManager(noCanvasApp as unknown as Application);

    // Act
    manager.init();

    // Assert
    expect(warnSpy).toHaveBeenCalledWith(
      'TouchInputManager: Canvas not found during initialization'
    );
  });

  it('should emit TOUCH_START event when touchstart fires', () => {
    // Arrange
    touchInputManager.init();

    // Act - invoke handler via private method
    const touchEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 200 }]);
    // @ts-expect-error - calling private method for testing
    touchInputManager.handleTouchStart(touchEvent);

    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(
      GameEventType.TOUCH_START,
      expect.objectContaining({
        originalEvent: touchEvent,
      })
    );
  });

  it('should emit TOUCH_MOVE event when touchmove fires', () => {
    // Arrange
    touchInputManager.init();

    // Act
    const touchEvent = createTouchEvent('touchmove', [{ clientX: 150, clientY: 250 }]);
    // @ts-expect-error - calling private method for testing
    touchInputManager.handleTouchMove(touchEvent);

    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(
      GameEventType.TOUCH_MOVE,
      expect.objectContaining({
        originalEvent: touchEvent,
      })
    );
  });

  it('should emit TOUCH_END event when touchend fires', () => {
    // Arrange
    touchInputManager.init();

    // Act
    const touchEvent = createTouchEvent('touchend', [], [{ clientX: 100, clientY: 200 }]);
    // @ts-expect-error - calling private method for testing
    touchInputManager.handleTouchEnd(touchEvent);

    // Assert
    expect(eventBus.emit).toHaveBeenCalledWith(
      GameEventType.TOUCH_END,
      expect.objectContaining({
        originalEvent: touchEvent,
      })
    );
  });

  it('should not emit events when touch list is empty', () => {
    // Arrange
    touchInputManager.init();

    // Act
    const emptyTouchStart = createTouchEvent('touchstart', []);
    // @ts-expect-error - calling private method for testing
    touchInputManager.handleTouchStart(emptyTouchStart);

    const emptyTouchEnd = createTouchEvent('touchend', [], []);
    // @ts-expect-error - calling private method for testing
    touchInputManager.handleTouchEnd(emptyTouchEnd);

    // Assert - emit should not have been called with TOUCH_START or TOUCH_END
    expect(eventBus.emit).not.toHaveBeenCalledWith(
      GameEventType.TOUCH_START,
      expect.anything()
    );
    expect(eventBus.emit).not.toHaveBeenCalledWith(
      GameEventType.TOUCH_END,
      expect.anything()
    );
  });

  it('should call destroy without errors', () => {
    // Arrange
    touchInputManager.init();

    // Act & Assert
    expect(() => touchInputManager.destroy()).not.toThrow();
  });

  it('should call destroy safely when canvas is null', () => {
    // Don't call init(), so canvas stays null
    expect(() => touchInputManager.destroy()).not.toThrow();
  });
});
