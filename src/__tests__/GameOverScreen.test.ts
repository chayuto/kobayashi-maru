/**
 * Tests for GameOverScreen
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Container, Application } from 'pixi.js';
import { GameOverScreen, calculateScore } from '../ui';
import type { ScoreData } from '../game/scoreManager';

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

  // Mock Container class
  class MockContainer {
    visible = true;
    zIndex = 0;
    position = { set: vi.fn() };
    children: unknown[] = [];
    addChild = vi.fn((child) => {
      this.children.push(child);
      return child;
    });
    destroy = vi.fn();
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

describe('GameOverScreen', () => {
  let gameOverScreen: GameOverScreen;
  let mockApp: Application;

  beforeEach(() => {
    gameOverScreen = new GameOverScreen();
    mockApp = new Application();
  });

  afterEach(() => {
    gameOverScreen.destroy();
  });

  describe('initialization', () => {
    it('should create a container', () => {
      expect(gameOverScreen.container).toBeDefined();
      expect(gameOverScreen.container).toBeInstanceOf(Container);
    });

    it('should start with hidden state', () => {
      expect(gameOverScreen.isVisible()).toBe(false);
    });

    it('should have high zIndex for overlay', () => {
      expect(gameOverScreen.container.zIndex).toBe(1000);
    });

    it('should initialize UI elements when init is called', () => {
      gameOverScreen.init(mockApp);
      // Container should have children after init
      expect(gameOverScreen.container.children.length).toBeGreaterThan(0);
    });

    it('should add container to stage', () => {
      gameOverScreen.init(mockApp);
      expect(mockApp.stage.addChild).toHaveBeenCalledWith(gameOverScreen.container);
    });
  });

  describe('show', () => {
    const mockScoreData: ScoreData = {
      timeSurvived: 165.5, // 2m 45.5s
      waveReached: 8,
      enemiesDefeated: 47,
      civiliansSaved: 0
    };

    beforeEach(() => {
      gameOverScreen.init(mockApp);
    });

    it('should make screen visible when shown', () => {
      gameOverScreen.show(mockScoreData, false);
      expect(gameOverScreen.isVisible()).toBe(true);
      expect(gameOverScreen.container.visible).toBe(true);
    });

    it('should display high score indicator when isHighScore is true', () => {
      gameOverScreen.show(mockScoreData, true);
      expect(gameOverScreen.isVisible()).toBe(true);
    });

    it('should not throw when showing with previous high score', () => {
      expect(() => gameOverScreen.show(mockScoreData, false, 5000)).not.toThrow();
    });
  });

  describe('hide', () => {
    beforeEach(() => {
      gameOverScreen.init(mockApp);
    });

    it('should make screen invisible when hidden', () => {
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      gameOverScreen.hide();
      
      expect(gameOverScreen.isVisible()).toBe(false);
      expect(gameOverScreen.container.visible).toBe(false);
    });
  });

  describe('restart callback', () => {
    beforeEach(() => {
      gameOverScreen.init(mockApp);
    });

    it('should allow setting restart callback', () => {
      const mockCallback = vi.fn();
      expect(() => gameOverScreen.setOnRestart(mockCallback)).not.toThrow();
    });

    it('should trigger restart callback on Enter key', () => {
      const mockCallback = vi.fn();
      gameOverScreen.setOnRestart(mockCallback);
      
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      
      // Simulate Enter key
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should trigger restart callback on R key', () => {
      const mockCallback = vi.fn();
      gameOverScreen.setOnRestart(mockCallback);
      
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      
      // Simulate R key
      const event = new KeyboardEvent('keydown', { key: 'r' });
      document.dispatchEvent(event);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should trigger restart callback on uppercase R key', () => {
      const mockCallback = vi.fn();
      gameOverScreen.setOnRestart(mockCallback);
      
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      
      // Simulate uppercase R key
      const event = new KeyboardEvent('keydown', { key: 'R' });
      document.dispatchEvent(event);
      
      expect(mockCallback).toHaveBeenCalled();
    });

    it('should not trigger restart on other keys', () => {
      const mockCallback = vi.fn();
      gameOverScreen.setOnRestart(mockCallback);
      
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      
      // Simulate Space key
      const event = new KeyboardEvent('keydown', { key: ' ' });
      document.dispatchEvent(event);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });

    it('should remove event listeners when hidden', () => {
      const mockCallback = vi.fn();
      gameOverScreen.setOnRestart(mockCallback);
      
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      gameOverScreen.hide();
      
      // Simulate Enter key after hiding
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
      
      // Should not trigger callback since event listener was removed
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clean up resources', () => {
      gameOverScreen.init(mockApp);
      gameOverScreen.destroy();
      expect(gameOverScreen.container.destroy).toHaveBeenCalledWith({ children: true });
    });

    it('should remove event listeners on destroy', () => {
      const mockCallback = vi.fn();
      gameOverScreen.init(mockApp);
      gameOverScreen.setOnRestart(mockCallback);
      
      const mockScoreData: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 20,
        civiliansSaved: 0
      };
      gameOverScreen.show(mockScoreData, false);
      gameOverScreen.destroy();
      
      // Simulate Enter key after destroy
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      document.dispatchEvent(event);
      
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});

describe('calculateScore', () => {
  it('should calculate score correctly', () => {
    const scoreData: ScoreData = {
      timeSurvived: 165, // 2m 45s -> 165 * 10 = 1650
      waveReached: 8,    // 8 * 500 = 4000
      enemiesDefeated: 47, // 47 * 100 = 4700
      civiliansSaved: 0
    };
    // Total = 1650 + 4700 + 4000 = 10350
    expect(calculateScore(scoreData)).toBe(10350);
  });

  it('should handle zero values', () => {
    const scoreData: ScoreData = {
      timeSurvived: 0,
      waveReached: 0,
      enemiesDefeated: 0,
      civiliansSaved: 0
    };
    expect(calculateScore(scoreData)).toBe(0);
  });

  it('should floor time survived for calculation', () => {
    const scoreData: ScoreData = {
      timeSurvived: 10.9, // Should floor to 10, 10 * 10 = 100
      waveReached: 1,     // 1 * 500 = 500
      enemiesDefeated: 5, // 5 * 100 = 500
      civiliansSaved: 0
    };
    // Total = 100 + 500 + 500 = 1100
    expect(calculateScore(scoreData)).toBe(1100);
  });

  it('should handle large values', () => {
    const scoreData: ScoreData = {
      timeSurvived: 600,    // 10 minutes = 600 * 10 = 6000
      waveReached: 50,      // 50 * 500 = 25000
      enemiesDefeated: 500, // 500 * 100 = 50000
      civiliansSaved: 0
    };
    // Total = 6000 + 50000 + 25000 = 81000
    expect(calculateScore(scoreData)).toBe(81000);
  });
});
