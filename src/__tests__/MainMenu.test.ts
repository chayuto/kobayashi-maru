/**
 * Tests for MainMenu
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container, Application } from 'pixi.js';
import { MainMenu } from '../ui/screens/MainMenu';

// Mock AudioManager
vi.mock('../audio/AudioManager', () => {
  const mockInstance = {
    isMuted: vi.fn().mockReturnValue(true),
    toggleMute: vi.fn().mockReturnValue(false),
  };
  return {
    AudioManager: {
      getInstance: vi.fn().mockReturnValue(mockInstance),
    },
  };
});

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

describe('MainMenu', () => {
  let mainMenu: MainMenu;
  let mockApp: Application;

  beforeEach(() => {
    mainMenu = new MainMenu();
    mockApp = new Application();
  });

  afterEach(() => {
    mainMenu.destroy();
  });

  describe('initialization', () => {
    it('should create a container', () => {
      expect(mainMenu.container).toBeDefined();
      expect(mainMenu.container).toBeInstanceOf(Container);
    });

    it('should start with hidden state', () => {
      expect(mainMenu.isVisible()).toBe(false);
    });

    it('should have zIndex of 999', () => {
      expect(mainMenu.container.zIndex).toBe(999);
    });

    it('should initialize UI elements when init is called', () => {
      mainMenu.init(mockApp);
      // Container should have children after init
      // overlay (1) + title (1) + subtitle (1) + start button (1) + sound button (1) = 5
      expect(mainMenu.container.children.length).toBeGreaterThan(0);
    });

    it('should add container to stage', () => {
      mainMenu.init(mockApp);
      expect(mockApp.stage.addChild).toHaveBeenCalledWith(mainMenu.container);
    });

    it('should have correct number of children (overlay + title + subtitle + 2 buttons)', () => {
      mainMenu.init(mockApp);
      // overlay (1) + title text (1) + subtitle text (1) + 2 buttons (2) = 5
      expect(mainMenu.container.children.length).toBe(5);
    });
  });

  describe('show/hide', () => {
    beforeEach(() => {
      mainMenu.init(mockApp);
    });

    it('should make menu visible when shown', () => {
      mainMenu.show();
      expect(mainMenu.isVisible()).toBe(true);
      expect(mainMenu.container.visible).toBe(true);
    });

    it('should make menu invisible when hidden', () => {
      mainMenu.show();
      mainMenu.hide();
      expect(mainMenu.isVisible()).toBe(false);
      expect(mainMenu.container.visible).toBe(false);
    });

    it('should toggle visibility correctly', () => {
      expect(mainMenu.isVisible()).toBe(false);
      mainMenu.show();
      expect(mainMenu.isVisible()).toBe(true);
      mainMenu.hide();
      expect(mainMenu.isVisible()).toBe(false);
      mainMenu.show();
      expect(mainMenu.isVisible()).toBe(true);
    });
  });

  describe('start callback', () => {
    beforeEach(() => {
      mainMenu.init(mockApp);
    });

    it('should allow setting start callback', () => {
      const mockCallback = vi.fn();
      expect(() => mainMenu.setOnStart(mockCallback)).not.toThrow();
    });

    it('should fire start callback when start button is clicked', () => {
      const mockCallback = vi.fn();
      mainMenu.setOnStart(mockCallback);

      // The start button is child index 3 (overlay=0, title=1, subtitle=2, start=3)
      const startButton = mainMenu.container.children[3] as Container;
      // Simulate pointerdown event
      (startButton as unknown as { emit: (event: string) => void }).emit('pointerdown');

      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    it('should not throw when start callback is not set and button is clicked', () => {
      // Do not set callback
      const startButton = mainMenu.container.children[3] as Container;
      expect(() => {
        (startButton as unknown as { emit: (event: string) => void }).emit('pointerdown');
      }).not.toThrow();
    });
  });

  describe('sound toggle', () => {
    beforeEach(() => {
      mainMenu.init(mockApp);
    });

    it('should call AudioManager.toggleMute when sound button is clicked', async () => {
      const { AudioManager } = await import('../audio/AudioManager');
      const audioInstance = AudioManager.getInstance();

      // The sound button is child index 4 (overlay=0, title=1, subtitle=2, start=3, sound=4)
      const soundButton = mainMenu.container.children[4] as Container;
      (soundButton as unknown as { emit: (event: string) => void }).emit('pointerdown');

      expect(audioInstance.toggleMute).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      mainMenu.init(mockApp);
      mainMenu.destroy();
      expect(mainMenu.container.destroy).toHaveBeenCalledWith({ children: true });
    });
  });
});
