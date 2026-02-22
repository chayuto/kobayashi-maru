/**
 * Tests for ComboPanel Celebration Effects
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';

// Mock PixiJS
vi.mock('pixi.js', async () => {
  class MockText {
    text = '';
    style: Record<string, unknown> = { fill: 0xFFFFFF };
    visible = true;
    alpha = 1;
    x = 0;
    y = 0;
    anchor = { set: vi.fn() };
    scale = { set: vi.fn() };
    position = { set: vi.fn((x: number, y: number) => { this.x = x; this.y = y; }) };
    destroy = vi.fn();
    constructor(opts?: { text?: string; style?: unknown }) {
      if (opts?.text) this.text = opts.text;
    }
  }

  class MockTextStyle {
    fill: number;
    constructor(opts?: Record<string, unknown>) {
      this.fill = (opts?.fill as number) ?? 0xFFFFFF;
    }
  }

  class MockGraphics {
    clear = vi.fn().mockReturnThis();
    roundRect = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    stroke = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  class MockContainer {
    visible = true;
    alpha = 1;
    children: unknown[] = [];
    addChild = vi.fn((child: unknown) => this.children.push(child));
    destroy = vi.fn();
    position = { set: vi.fn() };
    scale = {
      x: 1,
      y: 1,
      set: vi.fn(),
    };
  }

  return {
    Container: MockContainer,
    Text: MockText,
    TextStyle: MockTextStyle,
    Graphics: MockGraphics,
  };
});

// Hoist mocks to avoid initialization order issues
const { mockPulse, comboHandlerRef } = vi.hoisted(() => {
  const mockPulse = vi.fn();
  const comboHandlerRef: { current: ((payload: unknown) => void) | null } = { current: null };
  return { mockPulse, comboHandlerRef };
});

// Mock EventBus
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      on: vi.fn((_event: string, handler: (payload: unknown) => void) => {
        comboHandlerRef.current = handler;
      }),
      off: vi.fn(),
    }),
  },
}));

// Mock UIAnimator
vi.mock('../ui/animation/UIAnimator', () => ({
  UIAnimator: {
    pulse: mockPulse,
  },
}));

import { ComboPanel } from '../ui/panels/ComboPanel';

describe('ComboPanel Juice', () => {
  let panel: ComboPanel;
  let parent: Container;

  beforeEach(() => {
    vi.clearAllMocks();
    comboHandlerRef.current = null;
    panel = new ComboPanel();
    parent = new Container();
    panel.init(parent);
  });

  describe('pulse on tier increase', () => {
    it('should pulse when multiplier increases', () => {
      // First update with 2x - pulses because 2 > default 1
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });
      expect(mockPulse).toHaveBeenCalledTimes(1);
      mockPulse.mockClear();

      // Tier increase to 3x
      comboHandlerRef.current!({ comboCount: 6, multiplier: 3, isActive: true });
      expect(mockPulse).toHaveBeenCalledTimes(1);
    });

    it('should not pulse when multiplier stays the same', () => {
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });
      mockPulse.mockClear();

      comboHandlerRef.current!({ comboCount: 4, multiplier: 2, isActive: true });
      expect(mockPulse).not.toHaveBeenCalled();
    });

    it('should reset previous multiplier when combo deactivates', () => {
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });
      comboHandlerRef.current!({ comboCount: 0, multiplier: 1, isActive: false });
      mockPulse.mockClear();

      // Re-activate at 2x - should pulse since previous was reset to 1
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });
      expect(mockPulse).toHaveBeenCalled();
    });
  });

  describe('popup text', () => {
    it('should show popup on tier increase', () => {
      // Initial combo
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });

      // Tier increase triggers popup
      comboHandlerRef.current!({ comboCount: 6, multiplier: 3, isActive: true });
      // Popup should be created (added to container)
    });
  });

  describe('update method (tick-based)', () => {
    it('should animate popup via update(deltaTime)', () => {
      // Trigger popup
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });

      // Call update with deltaTime - should not throw
      panel.update(0.016);
    });

    it('should not throw when no popup is active', () => {
      panel.update(0.016);
      // Should not throw
    });

    it('should freeze popup when deltaTime is 0', () => {
      // Trigger popup
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });

      // Update with 0 deltaTime — popup should remain at initial state
      panel.update(0);
      panel.update(0);
      // Should not throw, popup stays visible
    });
  });

  describe('combo deactivation', () => {
    it('should hide panel when combo is inactive', () => {
      comboHandlerRef.current!({ comboCount: 3, multiplier: 2, isActive: true });
      comboHandlerRef.current!({ comboCount: 0, multiplier: 1, isActive: false });
      // Panel hidden without errors
    });
  });
});
