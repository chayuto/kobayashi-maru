/**
 * Tests for AlertStatusOverlay
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { AlertLevel } from '../types/events';

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
    position = { set: vi.fn() };
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
    rect = vi.fn().mockReturnThis();
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

// Capture event handler
let alertHandler: ((payload: unknown) => void) | null = null;
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      on: vi.fn((_event: string, handler: (payload: unknown) => void) => {
        alertHandler = handler;
      }),
      off: vi.fn(),
    }),
  },
}));

import { AlertStatusOverlay } from '../ui/overlays/AlertStatusOverlay';

describe('AlertStatusOverlay', () => {
  let overlay: AlertStatusOverlay;
  let parent: Container;

  beforeEach(() => {
    vi.clearAllMocks();
    alertHandler = null;
    overlay = new AlertStatusOverlay();
    parent = new Container();
    overlay.init(parent);
  });

  it('should start in IDLE phase', () => {
    expect(overlay.getPhase()).toBe('IDLE');
  });

  it('should show RED ALERT on CRITICAL level change', () => {
    alertHandler!({ level: AlertLevel.CRITICAL, previousLevel: AlertLevel.NORMAL });
    expect(overlay.getPhase()).toBe('FADE_IN');
    expect(overlay.container.visible).toBe(true);
  });

  it('should show YELLOW ALERT on CAUTION level change', () => {
    alertHandler!({ level: AlertLevel.CAUTION, previousLevel: AlertLevel.NORMAL });
    expect(overlay.getPhase()).toBe('FADE_IN');
  });

  it('should not show banner on NORMAL level change', () => {
    alertHandler!({ level: AlertLevel.NORMAL, previousLevel: AlertLevel.CAUTION });
    // Should stay in whatever phase it was (IDLE if nothing was shown before)
    expect(overlay.getPhase()).toBe('IDLE');
  });

  it('should reset to idle', () => {
    alertHandler!({ level: AlertLevel.CRITICAL, previousLevel: AlertLevel.NORMAL });
    overlay.reset();
    expect(overlay.getPhase()).toBe('IDLE');
    expect(overlay.container.visible).toBe(false);
  });

  it('should subscribe to ALERT_LEVEL_CHANGED on init', () => {
    expect(alertHandler).not.toBeNull();
  });
});
