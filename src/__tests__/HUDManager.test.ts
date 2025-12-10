/**
 * Tests for HUDManager and HealthBar components
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container, Application } from 'pixi.js';
import { HUDManager, HealthBar, UI_STYLES, HUDData } from '../ui';

// Mock PixiJS Application
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
    scale = { set: vi.fn() };
    clear = vi.fn().mockReturnThis();
    roundRect = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    stroke = vi.fn().mockReturnThis();
    circle = vi.fn().mockReturnThis();
    destroy = vi.fn();
    children: unknown[] = [];
    addChild = vi.fn((child) => {
      this.children.push(child);
      return child;
    });
  }

  // Mock Container class
  class MockContainer {
    visible = true;
    position = { set: vi.fn() };
    scale = { set: vi.fn() };
    children: unknown[] = [];
    addChild = vi.fn((child) => {
      this.children.push(child);
      return child;
    });
    destroy = vi.fn();
    on = vi.fn();
    off = vi.fn();
    emit = vi.fn();
    eventMode = 'auto';
    cursor = 'default';
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

describe('HealthBar', () => {
  let healthBar: HealthBar;

  beforeEach(() => {
    healthBar = new HealthBar(100, 20, 0x33CC99, 'TEST');
  });

  afterEach(() => {
    healthBar.destroy();
  });

  describe('initialization', () => {
    it('should create a container', () => {
      expect(healthBar.container).toBeDefined();
      expect(healthBar.container).toBeInstanceOf(Container);
    });

    it('should initialize with default parameters', () => {
      const defaultBar = new HealthBar();
      expect(defaultBar.container).toBeDefined();
      defaultBar.destroy();
    });
  });

  describe('update', () => {
    it('should update values when called', () => {
      // Should not throw
      expect(() => healthBar.update(50, 100)).not.toThrow();
    });

    it('should handle zero max value gracefully', () => {
      expect(() => healthBar.update(0, 0)).not.toThrow();
    });

    it('should handle negative values gracefully', () => {
      expect(() => healthBar.update(-10, 100)).not.toThrow();
    });
  });

  describe('setPosition', () => {
    it('should set position on container', () => {
      healthBar.setPosition(100, 200);
      expect(healthBar.container.position.set).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('setColor', () => {
    it('should allow changing fill color', () => {
      expect(() => healthBar.setColor(0xDD4444)).not.toThrow();
    });
  });

  describe('visibility', () => {
    it('should show the health bar', () => {
      healthBar.hide();
      healthBar.show();
      expect(healthBar.container.visible).toBe(true);
    });

    it('should hide the health bar', () => {
      healthBar.hide();
      expect(healthBar.container.visible).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      const bar = new HealthBar();
      bar.destroy();
      expect(bar.container.destroy).toHaveBeenCalledWith({ children: true });
    });
  });
});

describe('HUDManager', () => {
  let hudManager: HUDManager;
  let mockApp: Application;

  beforeEach(() => {
    hudManager = new HUDManager();
    mockApp = new Application();
  });

  afterEach(() => {
    hudManager.destroy();
  });

  describe('initialization', () => {
    it('should create a container', () => {
      expect(hudManager.container).toBeDefined();
      expect(hudManager.container).toBeInstanceOf(Container);
    });

    it('should initialize with visible state', () => {
      expect(hudManager.isVisible()).toBe(true);
    });

    it('should initialize HUD elements when init is called', () => {
      hudManager.init(mockApp);
      // Container should have children after init
      expect(hudManager.container.children.length).toBeGreaterThan(0);
    });

    it('should add container to stage', () => {
      hudManager.init(mockApp);
      expect(mockApp.stage.addChild).toHaveBeenCalledWith(hudManager.container);
    });
  });

  describe('update', () => {
    const mockHUDData: HUDData = {
      waveNumber: 5,
      waveState: 'active',
      activeEnemies: 10,
      resources: 750,
      timeSurvived: 125.5,
      enemiesDefeated: 42,
      kobayashiMaruHealth: 400,
      kobayashiMaruMaxHealth: 500,
      kobayashiMaruShield: 150,
      kobayashiMaruMaxShield: 200,
      turretCount: 3
    };

    it('should not throw when updating with valid data', () => {
      hudManager.init(mockApp);
      expect(() => hudManager.update(mockHUDData)).not.toThrow();
    });

    it('should not update when hidden', () => {
      hudManager.init(mockApp);
      hudManager.hide();
      // Should return early without errors
      expect(() => hudManager.update(mockHUDData)).not.toThrow();
    });

    it('should handle all wave states', () => {
      hudManager.init(mockApp);

      const states: HUDData['waveState'][] = ['idle', 'spawning', 'active', 'complete'];
      states.forEach(state => {
        expect(() => hudManager.update({ ...mockHUDData, waveState: state })).not.toThrow();
      });
    });

    it('should handle edge cases for health values', () => {
      hudManager.init(mockApp);

      // Zero health
      expect(() => hudManager.update({
        ...mockHUDData,
        kobayashiMaruHealth: 0,
        kobayashiMaruMaxHealth: 500
      })).not.toThrow();

      // Low health (should trigger danger color)
      expect(() => hudManager.update({
        ...mockHUDData,
        kobayashiMaruHealth: 50,
        kobayashiMaruMaxHealth: 500
      })).not.toThrow();
    });
  });

  describe('visibility', () => {
    it('should show HUD', () => {
      hudManager.hide();
      hudManager.show();
      expect(hudManager.isVisible()).toBe(true);
      expect(hudManager.container.visible).toBe(true);
    });

    it('should hide HUD', () => {
      hudManager.hide();
      expect(hudManager.isVisible()).toBe(false);
      expect(hudManager.container.visible).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      hudManager.init(mockApp);
      hudManager.destroy();
      expect(hudManager.container.destroy).toHaveBeenCalledWith({ children: true });
    });
  });

  describe('cheat modes', () => {
    it('should initialize with callbacks', () => {
      const callbacks = {
        onToggleGodMode: vi.fn(),
        onToggleSlowMode: vi.fn()
      };

      expect(() => hudManager.init(mockApp, callbacks)).not.toThrow();
    });

    it('should update local state from HUDData', () => {
      hudManager.init(mockApp);

      const mockHUDData: HUDData = {
        waveNumber: 5,
        waveState: 'active',
        activeEnemies: 10,
        resources: 750,
        timeSurvived: 125.5,
        enemiesDefeated: 42,
        kobayashiMaruHealth: 400,
        kobayashiMaruMaxHealth: 500,
        kobayashiMaruShield: 150,
        kobayashiMaruMaxShield: 200,
        turretCount: 3
      };

      const dataWithCheats: HUDData = {
        ...mockHUDData,
        godModeEnabled: true,
        slowModeEnabled: true
      };

      expect(() => hudManager.update(dataWithCheats)).not.toThrow();
    });
  });
});

describe('UI_STYLES', () => {
  it('should have expected color constants', () => {
    expect(UI_STYLES.COLORS.PRIMARY).toBe(0xFF9900);
    expect(UI_STYLES.COLORS.SECONDARY).toBe(0x99CCFF);
    expect(UI_STYLES.COLORS.HEALTH).toBe(0x33CC99);
    expect(UI_STYLES.COLORS.SHIELD).toBe(0x66AAFF);
    expect(UI_STYLES.COLORS.DANGER).toBe(0xDD4444);
    expect(UI_STYLES.COLORS.BACKGROUND).toBe(0x000000);
  });

  it('should have expected sizing constants', () => {
    expect(UI_STYLES.FONT_SIZE_LARGE).toBe(24);
    expect(UI_STYLES.FONT_SIZE_MEDIUM).toBe(18);
    expect(UI_STYLES.FONT_SIZE_SMALL).toBe(14);
    expect(UI_STYLES.PADDING).toBe(16);
    expect(UI_STYLES.BAR_HEIGHT).toBe(20);
    expect(UI_STYLES.BAR_WIDTH).toBe(300);
  });

  it('should use monospace font family', () => {
    expect(UI_STYLES.FONT_FAMILY).toBe('monospace');
  });
});
