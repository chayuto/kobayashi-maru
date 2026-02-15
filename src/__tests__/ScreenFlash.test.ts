/**
 * Tests for ScreenFlash
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

import { ScreenFlash } from '../rendering/ScreenFlash';
import { Application } from 'pixi.js';

describe('ScreenFlash', () => {
  let screenFlash: ScreenFlash;

  beforeEach(() => {
    screenFlash = new ScreenFlash();
  });

  describe('initialization', () => {
    it('should add overlay to app stage', () => {
      const app = new Application();
      screenFlash.init(app);
      expect(app.stage.addChild).toHaveBeenCalled();
    });
  });

  describe('flash', () => {
    it('should activate flash with given parameters', () => {
      const app = new Application();
      screenFlash.init(app);

      screenFlash.flash(0xFF0000, 0.5, 0.3);

      expect(screenFlash.isActive()).toBe(true);
      expect(screenFlash.getColor()).toBe(0xFF0000);
    });

    it('should clamp intensity to MAX_INTENSITY', () => {
      const app = new Application();
      screenFlash.init(app);

      screenFlash.flash(0xFF0000, 1.0, 0.3); // 1.0 > MAX_INTENSITY

      expect(screenFlash.isActive()).toBe(true);
    });
  });

  describe('update', () => {
    it('should decay flash over time', () => {
      const app = new Application();
      screenFlash.init(app);

      screenFlash.flash(0xFF0000, 0.5, 1.0); // 1s duration

      // At 50% through
      screenFlash.update(0.5);
      expect(screenFlash.isActive()).toBe(true);

      // At 100%
      screenFlash.update(0.5);
      expect(screenFlash.isActive()).toBe(false);
    });

    it('should be inactive when no flash is triggered', () => {
      const app = new Application();
      screenFlash.init(app);

      expect(screenFlash.isActive()).toBe(false);
      screenFlash.update(0.016);
      expect(screenFlash.isActive()).toBe(false);
    });

    it('should deactivate after full duration', () => {
      const app = new Application();
      screenFlash.init(app);

      screenFlash.flash(0xFFFFFF, 0.4, 0.5);
      screenFlash.update(0.6); // Past duration

      expect(screenFlash.isActive()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should not throw when destroyed', () => {
      const app = new Application();
      screenFlash.init(app);
      expect(() => screenFlash.destroy()).not.toThrow();
    });
  });
});
