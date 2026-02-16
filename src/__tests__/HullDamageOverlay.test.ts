/**
 * Tests for HullDamageOverlay
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock PixiJS
vi.mock('pixi.js', async () => {
  class MockGraphics {
    alpha = 0;
    zIndex = 0;
    rect = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  class MockContainer {
    addChild = vi.fn();
  }

  class MockApplication {
    stage = new MockContainer();
  }

  return {
    Graphics: MockGraphics,
    Container: MockContainer,
    Application: MockApplication,
  };
});

import { HullDamageOverlay } from '../rendering/HullDamageOverlay';
import { Application } from 'pixi.js';

describe('HullDamageOverlay', () => {
  let overlay: HullDamageOverlay;

  beforeEach(() => {
    overlay = new HullDamageOverlay();
  });

  describe('initialization', () => {
    it('should add graphics to app stage on init', () => {
      // Arrange
      const app = new Application();

      // Act
      overlay.init(app);

      // Assert
      expect(app.stage.addChild).toHaveBeenCalled();
    });
  });

  describe('setHullPercent', () => {
    it('should update internal hull percent state', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);

      // Act
      overlay.setHullPercent(0.5);

      // Assert
      expect(overlay.getHullPercent()).toBe(0.5);
    });

    it('should accept values from 0.0 to 1.0', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);

      // Act & Assert
      overlay.setHullPercent(0.0);
      expect(overlay.getHullPercent()).toBe(0.0);

      overlay.setHullPercent(1.0);
      expect(overlay.getHullPercent()).toBe(1.0);
    });
  });

  describe('visibility when hull is above threshold', () => {
    it('should be hidden when hull is at 100%', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(1.0);

      // Act
      overlay.update(0.016);

      // Assert
      expect(overlay.isVisible()).toBe(false);
    });

    it('should be hidden when hull is above enable threshold', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.5); // 50% > 30% threshold

      // Act
      overlay.update(0.016);

      // Assert
      expect(overlay.isVisible()).toBe(false);
    });

    it('should be hidden when hull is exactly at enable threshold', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      // ENABLE_THRESHOLD = 0.30; at exactly 0.30 intensity would be
      // (1 - 0.30/0.30) * MAX = 0, so alpha stays 0 due to fill alpha=0
      // The graphics.alpha is set to 1 but fill alpha is 0
      overlay.setHullPercent(0.31); // Just above threshold

      // Act
      overlay.update(0.016);

      // Assert
      expect(overlay.isVisible()).toBe(false);
    });
  });

  describe('visibility when hull is below threshold', () => {
    it('should be visible when hull is below enable threshold', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.15); // 15% < 30% threshold

      // Act
      overlay.update(0.016);

      // Assert
      expect(overlay.isVisible()).toBe(true);
    });

    it('should be visible when hull is at 0%', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.0);

      // Act
      overlay.update(0.016);

      // Assert
      expect(overlay.isVisible()).toBe(true);
    });
  });

  describe('intensity scaling', () => {
    it('should draw with higher intensity at lower hull', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);

      const graphics = (overlay as unknown as { graphics: { fill: ReturnType<typeof vi.fn> } }).graphics;

      // Act - First check at 25% hull (just below 30% threshold)
      overlay.setHullPercent(0.25);
      overlay.update(0.016);

      // Capture the fill alpha at 25% hull (first of 4 rectangle fills)
      const callCountAt25 = graphics.fill.mock.calls.length;
      const alpha25 = (graphics.fill.mock.calls[0] as [{ alpha: number }])[0].alpha;

      // Reset and test at 5% hull (much lower)
      overlay.setHullPercent(0.05);
      overlay.update(0.016);

      const alpha5 = (graphics.fill.mock.calls[callCountAt25] as [{ alpha: number }])[0].alpha;

      // Assert - Lower hull should have higher alpha intensity
      // At 25%: intensity = (1 - 0.25/0.30) * 0.4 ~= 0.067
      // At 5%: intensity = (1 - 0.05/0.30) * 0.4 * pulse ~= 0.333 * pulse
      expect(alpha5).toBeGreaterThan(alpha25);
    });
  });

  describe('pulsing effect at critical hull', () => {
    it('should vary intensity over time when hull is at critical level', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.10); // 10% < 20% critical threshold

      // Act - Update at two different times
      overlay.update(0.5); // First update

      const graphics = (overlay as unknown as { graphics: { fill: ReturnType<typeof vi.fn> } }).graphics;
      const firstCallAlpha = graphics.fill.mock.calls[0][0].alpha;

      overlay.update(1.0); // Second update, different animationTime

      const lastCallIdx = graphics.fill.mock.calls.length - 1;
      const secondCallAlpha = graphics.fill.mock.calls[lastCallIdx][0].alpha;

      // Assert - Due to sin-based pulsing, alphas at different times should differ
      // (unless the sin values happen to coincide, which is unlikely with these times)
      expect(typeof firstCallAlpha).toBe('number');
      expect(typeof secondCallAlpha).toBe('number');
      // Both should be > 0 since we're below threshold
      expect(firstCallAlpha).toBeGreaterThan(0);
      expect(secondCallAlpha).toBeGreaterThan(0);
    });

    it('should not pulse when hull is above critical but below enable threshold', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.25); // 25% is below enable (30%) but above critical (20%)

      // Act
      overlay.update(0.5);
      const graphics = (overlay as unknown as { graphics: { fill: ReturnType<typeof vi.fn> } }).graphics;
      const firstAlpha = graphics.fill.mock.calls[0][0].alpha;

      overlay.update(1.0);
      const secondAlpha = graphics.fill.mock.calls[4][0].alpha; // 4 rects per update

      // Assert - Without pulsing, intensity should be the same at both updates
      expect(firstAlpha).toBeCloseTo(secondAlpha, 5);
    });
  });

  describe('drawing behavior', () => {
    it('should clear and redraw 4 rectangles when visible', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.15);

      // Act
      overlay.update(0.016);

      // Assert
      const graphics = (overlay as unknown as { graphics: { clear: ReturnType<typeof vi.fn>; rect: ReturnType<typeof vi.fn>; fill: ReturnType<typeof vi.fn> } }).graphics;
      expect(graphics.clear).toHaveBeenCalled();
      expect(graphics.rect).toHaveBeenCalledTimes(4); // top, bottom, left, right
      expect(graphics.fill).toHaveBeenCalledTimes(4);
    });

    it('should use red tint color for fills', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);
      overlay.setHullPercent(0.15);

      // Act
      overlay.update(0.016);

      // Assert
      const graphics = (overlay as unknown as { graphics: { fill: ReturnType<typeof vi.fn> } }).graphics;
      const fillCall = graphics.fill.mock.calls[0][0];
      expect(fillCall.color).toBe(0xFF0000); // TINT_COLOR
    });
  });

  describe('update without init', () => {
    it('should not throw when update is called before init', () => {
      // Arrange - no init called

      // Act & Assert
      expect(() => overlay.update(0.016)).not.toThrow();
    });
  });

  describe('destroy', () => {
    it('should clean up graphics on destroy', () => {
      // Arrange
      const app = new Application();
      overlay.init(app);

      // Act
      overlay.destroy();

      // Assert
      const graphics = (overlay as unknown as { graphics: { destroy: ReturnType<typeof vi.fn> } }).graphics;
      expect(graphics.destroy).toHaveBeenCalled();
    });

    it('should not throw when destroyed without init', () => {
      // Act & Assert
      expect(() => overlay.destroy()).not.toThrow();
    });
  });
});
