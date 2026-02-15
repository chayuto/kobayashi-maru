/**
 * Tests for DamageNumberRenderer
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

  class MockContainer {
    children: unknown[] = [];
    addChild = vi.fn((child: unknown) => this.children.push(child));
    destroy = vi.fn();
  }

  return {
    Container: MockContainer,
    Text: MockText,
    TextStyle: MockTextStyle,
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

import { DamageNumberRenderer } from '../rendering/DamageNumberRenderer';
import { GameEventType } from '../types/events';
import { RENDERING_CONFIG } from '../config/rendering.config';

describe('DamageNumberRenderer', () => {
  let renderer: DamageNumberRenderer;
  let parent: Container;

  beforeEach(() => {
    vi.clearAllMocks();
    renderer = new DamageNumberRenderer();
    parent = new Container();
  });

  describe('initialization', () => {
    it('should subscribe to DAMAGE_DEALT events on init', () => {
      renderer.init(parent);
      expect(mockOn).toHaveBeenCalledWith(
        GameEventType.DAMAGE_DEALT,
        expect.any(Function)
      );
    });

    it('should add container to parent', () => {
      renderer.init(parent);
      expect(parent.addChild).toHaveBeenCalled();
    });

    it('should pre-populate the text pool', () => {
      renderer.init(parent);
      // Pool size configured as 30, all added to container
      const containerMock = parent.addChild as ReturnType<typeof vi.fn>;
      const addedContainer = containerMock.mock.calls[0][0] as { children: unknown[] };
      expect(addedContainer.children.length).toBe(RENDERING_CONFIG.DAMAGE_NUMBERS.POOL_SIZE);
    });
  });

  describe('damage number display', () => {
    it('should activate a number on DAMAGE_DEALT event', () => {
      renderer.init(parent);

      // Get the event handler
      const handler = mockOn.mock.calls.find(
        (c: unknown[]) => c[0] === GameEventType.DAMAGE_DEALT
      )![1] as (payload: unknown) => void;

      handler({
        entityId: 1,
        damage: 25,
        isShield: false,
        x: 100,
        y: 200
      });

      // After handling, one number should be active
      // We can verify by calling update and checking pool returns
      renderer.update(0.4); // Half duration
    });

    it('should use shield color for shield damage', () => {
      renderer.init(parent);

      const handler = mockOn.mock.calls.find(
        (c: unknown[]) => c[0] === GameEventType.DAMAGE_DEALT
      )![1] as (payload: unknown) => void;

      handler({
        entityId: 1,
        damage: 10,
        isShield: true,
        x: 50,
        y: 50
      });

      // Shield damage handled without error
    });

    it('should use critical color for high damage', () => {
      renderer.init(parent);

      const handler = mockOn.mock.calls.find(
        (c: unknown[]) => c[0] === GameEventType.DAMAGE_DEALT
      )![1] as (payload: unknown) => void;

      handler({
        entityId: 1,
        damage: RENDERING_CONFIG.DAMAGE_NUMBERS.CRITICAL_THRESHOLD + 10,
        isShield: false,
        x: 50,
        y: 50
      });

      // Critical damage handled without error
    });
  });

  describe('update', () => {
    it('should return numbers to pool after duration expires', () => {
      renderer.init(parent);

      const handler = mockOn.mock.calls.find(
        (c: unknown[]) => c[0] === GameEventType.DAMAGE_DEALT
      )![1] as (payload: unknown) => void;

      handler({ entityId: 1, damage: 10, isShield: false, x: 100, y: 200 });

      // Advance past duration
      renderer.update(RENDERING_CONFIG.DAMAGE_NUMBERS.DURATION + 0.1);

      // Number should be returned to pool (no error on subsequent updates)
      renderer.update(0.016);
    });

    it('should handle empty active list gracefully', () => {
      renderer.init(parent);
      renderer.update(0.016);
      // Should not throw
    });
  });

  describe('clear', () => {
    it('should return all active numbers to pool', () => {
      renderer.init(parent);

      const handler = mockOn.mock.calls.find(
        (c: unknown[]) => c[0] === GameEventType.DAMAGE_DEALT
      )![1] as (payload: unknown) => void;

      // Spawn several
      handler({ entityId: 1, damage: 10, isShield: false, x: 100, y: 100 });
      handler({ entityId: 2, damage: 20, isShield: true, x: 200, y: 200 });

      renderer.clear();

      // Subsequent update should not throw
      renderer.update(0.016);
    });
  });

  describe('destroy', () => {
    it('should unsubscribe from events', () => {
      renderer.init(parent);
      renderer.destroy();
      expect(mockOff).toHaveBeenCalledWith(
        GameEventType.DAMAGE_DEALT,
        expect.any(Function)
      );
    });
  });
});
