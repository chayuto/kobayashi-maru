/**
 * Tests for UI Panel Micro-Animations
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
    position = { set: vi.fn() };
    scale = { x: 1, y: 1, set: vi.fn() };
    anchor = { set: vi.fn() };
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
    scale = { x: 1, y: 1, set: vi.fn() };
  }

  return {
    Container: MockContainer,
    Text: MockText,
    TextStyle: MockTextStyle,
    Graphics: MockGraphics,
  };
});

// Mock EventBus
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      on: vi.fn(),
      off: vi.fn(),
    }),
  },
}));

// Hoist mocks to avoid initialization order issues
const { mockPulse, mockSlideIn } = vi.hoisted(() => ({
  mockPulse: vi.fn(),
  mockSlideIn: vi.fn(),
}));

// Mock UIAnimator
vi.mock('../ui/animation/UIAnimator', () => ({
  UIAnimator: {
    pulse: mockPulse,
    slideIn: mockSlideIn,
  },
}));

import { ResourcePanel } from '../ui/panels/ResourcePanel';
import { ScorePanel } from '../ui/panels/ScorePanel';

describe('UI Panel Micro-Animations', () => {
  let parent: Container;

  beforeEach(() => {
    vi.clearAllMocks();
    parent = new Container();
  });

  describe('ResourcePanel', () => {
    it('should pulse on resource gain', () => {
      const panel = new ResourcePanel();
      panel.init(parent);

      // First update (sets baseline)
      panel.update({ resources: 100 });
      expect(mockPulse).not.toHaveBeenCalled();

      // Second update with increase
      panel.update({ resources: 200 });
      expect(mockPulse).toHaveBeenCalledWith(
        expect.anything(),
        1.08,
        expect.objectContaining({ duration: 0.15 })
      );
    });

    it('should not pulse on resource decrease', () => {
      const panel = new ResourcePanel();
      panel.init(parent);

      panel.update({ resources: 200 });
      mockPulse.mockClear();

      panel.update({ resources: 100 });
      expect(mockPulse).not.toHaveBeenCalled();
    });

    it('should not pulse on same resource amount', () => {
      const panel = new ResourcePanel();
      panel.init(parent);

      panel.update({ resources: 100 });
      mockPulse.mockClear();

      panel.update({ resources: 100 });
      expect(mockPulse).not.toHaveBeenCalled();
    });

    it('should not pulse on first update from zero', () => {
      const panel = new ResourcePanel();
      panel.init(parent);

      panel.update({ resources: 500 });
      expect(mockPulse).not.toHaveBeenCalled();
    });
  });

  describe('ScorePanel', () => {
    it('should pulse kills text on new kill', () => {
      const panel = new ScorePanel();
      panel.init(parent);

      // First update (sets baseline)
      panel.update({ timeSurvived: 10, enemiesDefeated: 1 });
      expect(mockPulse).not.toHaveBeenCalled();

      // Kill count increases
      panel.update({ timeSurvived: 11, enemiesDefeated: 2 });
      expect(mockPulse).toHaveBeenCalledWith(
        expect.anything(),
        1.12,
        expect.objectContaining({ duration: 0.15 })
      );
    });

    it('should not pulse when kill count stays the same', () => {
      const panel = new ScorePanel();
      panel.init(parent);

      panel.update({ timeSurvived: 10, enemiesDefeated: 5 });
      mockPulse.mockClear();

      panel.update({ timeSurvived: 11, enemiesDefeated: 5 });
      expect(mockPulse).not.toHaveBeenCalled();
    });

    it('should not pulse on first update from zero', () => {
      const panel = new ScorePanel();
      panel.init(parent);

      panel.update({ timeSurvived: 0, enemiesDefeated: 3 });
      expect(mockPulse).not.toHaveBeenCalled();
    });
  });
});
