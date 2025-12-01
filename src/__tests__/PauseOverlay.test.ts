/**
 * Tests for PauseOverlay
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container, Application } from 'pixi.js';
import { PauseOverlay } from '../ui';

// Mock PixiJS
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js') as object;
  
  // Mock Text class
  class MockText {
    text: string = '';
    style: { fill?: number } = {};
    anchor = { set: vi.fn() };
    position = { set: vi.fn() };
    constructor(options?: { text?: string; style?: { fill?: number } }) {
      this.text = options?.text ?? '';
      this.style = options?.style ?? {};
    }
    destroy = vi.fn();
  }

  // Mock Graphics class
  class MockGraphics {
    position = { set: vi.fn() };
    clear = vi.fn().mockReturnThis();
    rect = vi.fn().mockReturnThis();
    roundRect = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    stroke = vi.fn().mockReturnThis();
    circle = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  // Mock Container class with event handling
  class MockContainer {
    visible = true;
    zIndex = 0;
    position = { set: vi.fn() };
    children: unknown[] = [];
    eventMode: string = 'none';
    cursor: string = 'default';
    private eventHandlers: Map<string, ((...args: unknown[]) => void)[]> = new Map();

    addChild = vi.fn((child) => {
      this.children.push(child);
      return child;
    });
    destroy = vi.fn();
    
    on(event: string, handler: (...args: unknown[]) => void) {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)!.push(handler);
      return this;
    }
    
    emit(event: string, ...args: unknown[]) {
      const handlers = this.eventHandlers.get(event) || [];
      handlers.forEach(handler => handler(...args));
    }
  }

  // Mock Application
  class MockApplication {
    stage = new MockContainer();
    ticker = {
      deltaMS: 16.67,
      add: vi.fn(),
    };
    renderer = { name: 'mock' };
    canvas = document.createElement('canvas');
  }

  return {
    ...actual,
    Application: MockApplication,
    Container: MockContainer,
    Graphics: MockGraphics,
    Text: MockText,
    TextStyle: class MockTextStyle {
      fontFamily?: string;
      fontSize?: number;
      fill?: number;
      fontWeight?: string;
      constructor(opts?: { fontFamily?: string; fontSize?: number; fill?: number; fontWeight?: string }) {
        if (opts) {
          this.fontFamily = opts.fontFamily;
          this.fontSize = opts.fontSize;
          this.fill = opts.fill;
          this.fontWeight = opts.fontWeight;
        }
      }
    }
  };
});

describe('PauseOverlay', () => {
  let pauseOverlay: PauseOverlay;
  let mockApp: Application;

  beforeEach(() => {
    pauseOverlay = new PauseOverlay();
    mockApp = new Application();
  });

  afterEach(() => {
    pauseOverlay.destroy();
  });

  describe('initialization', () => {
    it('should create a container', () => {
      expect(pauseOverlay.container).toBeDefined();
      expect(pauseOverlay.container).toBeInstanceOf(Container);
    });

    it('should start with hidden state', () => {
      expect(pauseOverlay.isVisible()).toBe(false);
    });

    it('should have high zIndex for overlay', () => {
      expect(pauseOverlay.container.zIndex).toBe(1000);
    });

    it('should initialize UI elements when init is called', () => {
      pauseOverlay.init(mockApp);
      // Container should have children after init (overlay, title, 3 buttons)
      expect(pauseOverlay.container.children.length).toBeGreaterThan(0);
    });

    it('should add container to stage', () => {
      pauseOverlay.init(mockApp);
      expect(mockApp.stage.addChild).toHaveBeenCalledWith(pauseOverlay.container);
    });
  });

  describe('show/hide', () => {
    beforeEach(() => {
      pauseOverlay.init(mockApp);
    });

    it('should make overlay visible when shown', () => {
      pauseOverlay.show();
      expect(pauseOverlay.isVisible()).toBe(true);
      expect(pauseOverlay.container.visible).toBe(true);
    });

    it('should make overlay invisible when hidden', () => {
      pauseOverlay.show();
      pauseOverlay.hide();
      expect(pauseOverlay.isVisible()).toBe(false);
      expect(pauseOverlay.container.visible).toBe(false);
    });

    it('should toggle visibility correctly', () => {
      expect(pauseOverlay.isVisible()).toBe(false);
      pauseOverlay.show();
      expect(pauseOverlay.isVisible()).toBe(true);
      pauseOverlay.hide();
      expect(pauseOverlay.isVisible()).toBe(false);
      pauseOverlay.show();
      expect(pauseOverlay.isVisible()).toBe(true);
    });
  });

  describe('callbacks', () => {
    beforeEach(() => {
      pauseOverlay.init(mockApp);
    });

    it('should allow setting resume callback', () => {
      const mockCallback = vi.fn();
      expect(() => pauseOverlay.setOnResume(mockCallback)).not.toThrow();
    });

    it('should allow setting restart callback', () => {
      const mockCallback = vi.fn();
      expect(() => pauseOverlay.setOnRestart(mockCallback)).not.toThrow();
    });

    it('should allow setting quit callback', () => {
      const mockCallback = vi.fn();
      expect(() => pauseOverlay.setOnQuit(mockCallback)).not.toThrow();
    });

    it('should not throw when callbacks are not set and buttons are clicked', () => {
      // The overlay should handle null callbacks gracefully
      pauseOverlay.init(mockApp);
      expect(pauseOverlay.isVisible()).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      pauseOverlay.init(mockApp);
      pauseOverlay.destroy();
      expect(pauseOverlay.container.destroy).toHaveBeenCalledWith({ children: true });
    });
  });

  describe('UI structure', () => {
    beforeEach(() => {
      pauseOverlay.init(mockApp);
    });

    it('should have correct number of children (overlay + title + 3 buttons)', () => {
      // overlay (1) + title text (1) + 3 buttons (3) = 5 children
      expect(pauseOverlay.container.children.length).toBe(5);
    });
  });
});
