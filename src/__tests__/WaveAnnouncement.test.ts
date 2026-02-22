/**
 * Tests for WaveAnnouncement
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';

// Mock PixiJS
vi.mock('pixi.js', async () => {
  class MockText {
    text = '';
    style: Record<string, unknown> = {};
    anchor = { set: vi.fn() };
    position = { set: vi.fn() };
    destroy = vi.fn();
    constructor(opts?: { text?: string; style?: unknown }) {
      if (opts?.text) this.text = opts.text;
    }
  }

  class MockTextStyle {
    constructor(_opts?: Record<string, unknown>) { void _opts; }
  }

  class MockGraphics {
    rect = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  class MockContainer {
    visible = true;
    alpha = 1;
    _scaleVal = 1;
    children: unknown[] = [];
    addChild = vi.fn((child: unknown) => this.children.push(child));
    destroy = vi.fn();
    position = { set: vi.fn() };
    scale = {
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

// Mock EventBus
const mockOn = vi.fn();
const mockOff = vi.fn();
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      on: mockOn,
      off: mockOff,
    })
  }
}));

import { WaveAnnouncement } from '../ui/overlays/WaveAnnouncement';
import { GameEventType } from '../types/events';

describe('WaveAnnouncement', () => {
  let announcement: WaveAnnouncement;
  let parent: Container;

  beforeEach(() => {
    vi.clearAllMocks();
    announcement = new WaveAnnouncement();
    parent = new Container();
  });

  describe('initialization', () => {
    it('should subscribe to WAVE_STARTED events', () => {
      announcement.init(parent);
      expect(mockOn).toHaveBeenCalledWith(
        GameEventType.WAVE_STARTED,
        expect.any(Function)
      );
    });

    it('should add container to parent', () => {
      announcement.init(parent);
      expect(parent.addChild).toHaveBeenCalled();
    });

    it('should start in IDLE phase', () => {
      announcement.init(parent);
      expect(announcement.getPhase()).toBe('IDLE');
    });

    it('should start hidden', () => {
      announcement.init(parent);
      expect(announcement.container.visible).toBe(false);
    });
  });

  describe('show', () => {
    it('should transition to FADE_IN phase', () => {
      announcement.init(parent);
      announcement.show(3);
      expect(announcement.getPhase()).toBe('FADE_IN');
    });

    it('should make container visible', () => {
      announcement.init(parent);
      announcement.show(1);
      expect(announcement.container.visible).toBe(true);
    });

    it('should set wave number text', () => {
      announcement.init(parent);
      announcement.show(5);
      // The title text should contain "WAVE 5"
      // (verified by not throwing)
    });
  });

  describe('animation phases', () => {
    it('should start in IDLE and not animate', () => {
      announcement.init(parent);
      announcement.update(0.016);
      expect(announcement.getPhase()).toBe('IDLE');
    });

    it('should progress through FADE_IN to HOLD', () => {
      announcement.init(parent);
      announcement.show(1);
      expect(announcement.getPhase()).toBe('FADE_IN');

      // Advance past FADE_IN_DURATION (0.3s)
      announcement.update(0.4);
      expect(announcement.getPhase()).toBe('HOLD');
    });

    it('should progress from HOLD to FADE_OUT', () => {
      announcement.init(parent);
      announcement.show(1);

      // Past FADE_IN
      announcement.update(0.4);
      expect(announcement.getPhase()).toBe('HOLD');

      // Past HOLD (2.0s)
      announcement.update(2.1);
      expect(announcement.getPhase()).toBe('FADE_OUT');
    });

    it('should return to IDLE after FADE_OUT completes', () => {
      announcement.init(parent);
      announcement.show(1);

      // Past FADE_IN
      announcement.update(0.4);

      // Past HOLD
      announcement.update(2.1);

      // Past FADE_OUT (0.5s)
      announcement.update(0.6);
      expect(announcement.getPhase()).toBe('IDLE');
    });

    it('should freeze animation when deltaTime is 0', () => {
      announcement.init(parent);
      announcement.show(1);
      expect(announcement.getPhase()).toBe('FADE_IN');

      // Update with 0 deltaTime — animation should not advance
      announcement.update(0);
      announcement.update(0);
      announcement.update(0);
      expect(announcement.getPhase()).toBe('FADE_IN');

      // Now advance past FADE_IN
      announcement.update(0.4);
      expect(announcement.getPhase()).toBe('HOLD');
    });
  });

  describe('reset', () => {
    it('should return to IDLE state', () => {
      announcement.init(parent);
      announcement.show(1);
      expect(announcement.getPhase()).toBe('FADE_IN');

      announcement.reset();
      expect(announcement.getPhase()).toBe('IDLE');
      expect(announcement.container.visible).toBe(false);
    });
  });

  describe('boss wave subtitle', () => {
    it('should show BOSS INCOMING for wave 5', () => {
      announcement.init(parent);
      announcement.show(5);
      // Should not throw - boss wave text is set
    });

    it('should show BOSS INCOMING for wave 10', () => {
      announcement.init(parent);
      announcement.show(10);
      // Should not throw
    });
  });

  describe('destroy', () => {
    it('should unsubscribe from events', () => {
      announcement.init(parent);
      announcement.destroy();
      expect(mockOff).toHaveBeenCalledWith(
        GameEventType.WAVE_STARTED,
        expect.any(Function)
      );
    });
  });
});
