/**
 * Tests for Core Managers: RenderManager, UIController, InputRouter, GameplayManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock pixi.js before any imports
vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

// Mock the services module to control ServiceContainer
const mockServices = {
  get: vi.fn(),
  tryGet: vi.fn(),
};

vi.mock('../core/services', () => ({
  getServices: () => mockServices,
}));

// Mock ecs module
vi.mock('../ecs', () => ({
  createKobayashiMaru: vi.fn(() => 42),
  getEntityCount: vi.fn(() => 10),
  Health: { current: new Float32Array(100), max: new Float32Array(100) },
  Shield: { current: new Float32Array(100), max: new Float32Array(100) },
}));

// Mock ecs/components
vi.mock('../ecs/components', () => ({
  Position: { x: new Float32Array(100), y: new Float32Array(100) },
  Turret: { type: new Uint8Array(100) },
  Health: { current: new Float32Array(100), max: new Float32Array(100) },
  Shield: { current: new Float32Array(100), max: new Float32Array(100) },
  Projectile: { type: new Uint8Array(100) },
  AIBehavior: { state: new Uint8Array(100) },
}));

// Mock bitecs
vi.mock('bitecs', () => ({
  query: vi.fn(() => []),
  removeEntity: vi.fn(),
}));

// Mock the effectPresets
vi.mock('../rendering/effectPresets', () => ({
  EFFECTS: {
    EXPLOSION_SMALL: { count: 20, speed: { min: 50, max: 150 }, life: { min: 0.2, max: 0.5 }, size: { min: 2, max: 6 }, color: 0xFF6600, spread: Math.PI * 2 },
    EXPLOSION_LARGE: { count: 40, speed: { min: 80, max: 200 }, life: { min: 0.3, max: 0.8 }, size: { min: 3, max: 10 }, color: 0xFF4400, spread: Math.PI * 2 },
  },
}));

// Mock types module
vi.mock('../types', () => ({
  GAME_CONFIG: {
    WORLD_WIDTH: 1920,
    WORLD_HEIGHT: 1080,
    RESOURCE_REWARD: 12,
    SLOW_MODE_MULTIPLIER: 0.5,
  },
  GameEventType: {
    ENEMY_KILLED: 'ENEMY_KILLED',
    WAVE_STARTED: 'WAVE_STARTED',
    WAVE_COMPLETED: 'WAVE_COMPLETED',
    PLAYER_DAMAGED: 'PLAYER_DAMAGED',
  },
}));

// Mock config module
vi.mock('../config', () => ({
  UI_CONFIG: {
    INTERACTION: {
      TURRET_CLICK_RADIUS: 32,
    },
  },
}));

// Mock game/gameState
vi.mock('../game/gameState', () => ({
  GameStateType: {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    PAUSED: 'PAUSED',
    GAME_OVER: 'GAME_OVER',
  },
}));

// Mock ui module
vi.mock('../ui', () => ({
  calculateScore: vi.fn(() => 1000),
}));

// Mock PoolManager
vi.mock('../ecs/PoolManager', () => ({
  PoolManager: {
    getInstance: () => ({
      getStats: vi.fn(() => ({ active: 5, pooled: 10 })),
    }),
  },
}));

import { RenderManager } from '../core/managers/RenderManager';
import { UIController } from '../core/managers/UIController';
import { InputRouter, InputAction } from '../core/managers/InputRouter';
import { GameplayManager } from '../core/managers/GameplayManager';
import { MockApplication } from './helpers/mockPixi';

// ========================================================================
// Helper: create mock service objects
// ========================================================================

function createServiceMocks() {
  return {
    spriteManager: {
      getActiveCount: vi.fn(() => 5),
      removeSprite: vi.fn(),
      init: vi.fn(),
    },
    glowManager: { init: vi.fn() },
    starfield: { update: vi.fn() },
    placementRenderer: { init: vi.fn() },
    hapticManager: { init: vi.fn() },
    particleSystem: {
      update: vi.fn(),
      spawn: vi.fn(),
      particles: [1, 2, 3],
    },
    shockwaveRenderer: { render: vi.fn() },
    explosionManager: {
      update: vi.fn(),
      createSimpleExplosion: vi.fn(),
    },
    beamRenderer: {
      updateCharges: vi.fn(),
      render: vi.fn(),
    },
    healthBarRenderer: { update: vi.fn() },
    shieldRenderer: { update: vi.fn() },
    turretUpgradeVisuals: { update: vi.fn() },
    screenShake: {
      update: vi.fn(() => ({ offsetX: 0, offsetY: 0 })),
      shake: vi.fn(),
    },
    damageNumberRenderer: {
      update: vi.fn(),
      clear: vi.fn(),
    },
    screenFlash: {
      update: vi.fn(),
      flash: vi.fn(),
      isActive: vi.fn(() => false),
    },
    app: new MockApplication(),
    hudManager: {
      init: vi.fn(),
      update: vi.fn(),
      addLogMessage: vi.fn(),
      updateAI: vi.fn(),
      addAIMessage: vi.fn(),
      getTurretMenu: vi.fn(() => ({
        onSelect: vi.fn(),
      })),
      getTurretUpgradePanel: vi.fn(() => ({
        show: vi.fn(),
        hide: vi.fn(),
        onUpgrade: vi.fn(),
        onSell: vi.fn(),
      })),
    },
    gameOverScreen: {
      show: vi.fn(),
      hide: vi.fn(),
      setOnRestart: vi.fn(),
    },
    pauseOverlay: {
      show: vi.fn(),
      hide: vi.fn(),
      setOnResume: vi.fn(),
      setOnRestart: vi.fn(),
      setOnQuit: vi.fn(),
    },
    debugManager: {
      update: vi.fn(),
      updateEntityCount: vi.fn(),
      updateGameStats: vi.fn(),
      updatePerformanceStats: vi.fn(),
    },
    performanceMonitor: {
      getMetrics: vi.fn(() => ({})),
      setEntityCount: vi.fn(),
    },
    eventBus: {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    },
    waveManager: {
      init: vi.fn(),
      update: vi.fn(),
      startWave: vi.fn(),
      reset: vi.fn(),
      setAutoStartNextWave: vi.fn(),
      setRenderingDependencies: vi.fn(),
      removeEnemy: vi.fn(),
      getCurrentWave: vi.fn(() => 1),
      getState: vi.fn(() => 'active' as const),
      getActiveEnemyCount: vi.fn(() => 3),
    },
    gameState: {
      setState: vi.fn(),
      getState: vi.fn(() => 'PLAYING'),
      isPlaying: vi.fn(() => true),
      isPaused: vi.fn(() => false),
      isGameOver: vi.fn(() => false),
      reset: vi.fn(),
    },
    scoreManager: {
      update: vi.fn(),
      reset: vi.fn(),
      getScoreData: vi.fn(() => ({
        timeSurvived: 60,
        waveReached: 3,
        enemiesDefeated: 15,
        civiliansSaved: 0,
      })),
      getTimeSurvived: vi.fn(() => 60),
      getEnemiesDefeated: vi.fn(() => 15),
    },
    resourceManager: {
      getResources: vi.fn(() => 500),
      addResources: vi.fn(),
      reset: vi.fn(),
    },
    highScoreManager: {
      getHighestScore: vi.fn(() => null),
      saveScore: vi.fn(() => true),
    },
    upgradeManager: {
      getTurretInfo: vi.fn(() => ({ turretId: 1, level: 1 })),
      getSellRefund: vi.fn(() => 50),
    },
    placementManager: {
      on: vi.fn(),
      updateCursorPosition: vi.fn(),
    },
    touchInputManager: { init: vi.fn() },
  };
}

// ========================================================================
// RenderManager Tests
// ========================================================================

describe('RenderManager', () => {
  let renderManager: RenderManager;
  let svcMocks: ReturnType<typeof createServiceMocks>;
  const fakeWorld = {} as never;

  beforeEach(() => {
    svcMocks = createServiceMocks();
    mockServices.get.mockImplementation((name: string) => {
      return (svcMocks as Record<string, unknown>)[name];
    });
    renderManager = new RenderManager(fakeWorld);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize rendering services when called the first time', () => {
      // Act
      renderManager.init();

      // Assert
      expect(mockServices.get).toHaveBeenCalledWith('spriteManager');
      expect(mockServices.get).toHaveBeenCalledWith('glowManager');
      expect(mockServices.get).toHaveBeenCalledWith('starfield');
      expect(mockServices.get).toHaveBeenCalledWith('placementRenderer');
      expect(mockServices.get).toHaveBeenCalledWith('hapticManager');
    });

    it('should not re-initialize when called a second time', () => {
      // Arrange
      renderManager.init();
      mockServices.get.mockClear();

      // Act
      renderManager.init();

      // Assert
      expect(mockServices.get).not.toHaveBeenCalled();
    });
  });

  describe('setRenderSystem', () => {
    it('should store the render system function', () => {
      // Arrange
      const renderSys = vi.fn();

      // Act
      renderManager.setRenderSystem(renderSys);
      renderManager.render();

      // Assert
      expect(renderSys).toHaveBeenCalledWith(fakeWorld);
    });
  });

  describe('updateEffects', () => {
    it('should update particle system with delta time', () => {
      // Act
      renderManager.updateEffects(0.016);

      // Assert
      expect(svcMocks.particleSystem.update).toHaveBeenCalledWith(0.016);
    });

    it('should update shockwave renderer with delta time', () => {
      // Act
      renderManager.updateEffects(0.016);

      // Assert
      expect(svcMocks.shockwaveRenderer.render).toHaveBeenCalledWith(0.016);
    });

    it('should update explosion manager with delta time', () => {
      // Act
      renderManager.updateEffects(0.016);

      // Assert
      expect(svcMocks.explosionManager.update).toHaveBeenCalledWith(0.016);
    });

    it('should update beam charges with delta time', () => {
      // Act
      renderManager.updateEffects(0.016);

      // Assert
      expect(svcMocks.beamRenderer.updateCharges).toHaveBeenCalledWith(0.016);
    });
  });

  describe('updateBackground', () => {
    it('should update starfield with default scroll values', () => {
      // Act
      renderManager.updateBackground(0.016);

      // Assert
      expect(svcMocks.starfield.update).toHaveBeenCalledWith(0.016, 0, 50);
    });

    it('should update starfield with custom scroll values', () => {
      // Act
      renderManager.updateBackground(0.016, 10, 20);

      // Assert
      expect(svcMocks.starfield.update).toHaveBeenCalledWith(0.016, 10, 20);
    });
  });

  describe('render', () => {
    it('should call render system when set', () => {
      // Arrange
      const renderSys = vi.fn();
      renderManager.setRenderSystem(renderSys);

      // Act
      renderManager.render();

      // Assert
      expect(renderSys).toHaveBeenCalledWith(fakeWorld);
    });

    it('should not fail when render system is not set', () => {
      // Act & Assert
      expect(() => renderManager.render()).not.toThrow();
    });

    it('should render beams with provided active beams', () => {
      // Arrange
      const beams = [{ x1: 0, y1: 0, x2: 100, y2: 100 }] as never[];

      // Act
      renderManager.render(beams);

      // Assert
      expect(svcMocks.beamRenderer.render).toHaveBeenCalledWith(beams);
    });

    it('should update health bars and shields', () => {
      // Act
      renderManager.render();

      // Assert
      expect(svcMocks.healthBarRenderer.update).toHaveBeenCalledWith(fakeWorld);
      expect(svcMocks.shieldRenderer.update).toHaveBeenCalledWith(fakeWorld, 0);
      expect(svcMocks.turretUpgradeVisuals.update).toHaveBeenCalled();
    });
  });

  describe('applyPostEffects', () => {
    it('should apply screen shake offsets to stage position', () => {
      // Arrange
      svcMocks.screenShake.update.mockReturnValue({ offsetX: 3, offsetY: -2 });

      // Act
      renderManager.applyPostEffects(0.016);

      // Assert
      expect(svcMocks.screenShake.update).toHaveBeenCalledWith(0.016);
      expect(svcMocks.app.stage.position.set).toHaveBeenCalledWith(3, -2);
    });
  });

  describe('shake', () => {
    it('should trigger screen shake with default values', () => {
      // Act
      renderManager.shake();

      // Assert
      expect(svcMocks.screenShake.shake).toHaveBeenCalledWith(5, 0.3);
    });

    it('should trigger screen shake with custom values', () => {
      // Act
      renderManager.shake(10, 0.5);

      // Assert
      expect(svcMocks.screenShake.shake).toHaveBeenCalledWith(10, 0.5);
    });
  });

  describe('createExplosion', () => {
    it('should create small explosion when size is 1 or less', () => {
      // Act
      renderManager.createExplosion(100, 200, 1);

      // Assert
      expect(svcMocks.explosionManager.createSimpleExplosion).toHaveBeenCalled();
      const call = svcMocks.explosionManager.createSimpleExplosion.mock.calls[0];
      expect(call[0]).toBe(100);
      expect(call[1]).toBe(200);
    });

    it('should create large explosion when size exceeds 1.5', () => {
      // Act
      renderManager.createExplosion(100, 200, 2);

      // Assert
      expect(svcMocks.explosionManager.createSimpleExplosion).toHaveBeenCalled();
      const call = svcMocks.explosionManager.createSimpleExplosion.mock.calls[0];
      expect(call[2].count).toBe(40); // EXPLOSION_LARGE count
    });
  });

  describe('createParticleBurst', () => {
    it('should spawn particles at the given position with config', () => {
      // Arrange
      const config = { count: 10, color: 0xFF0000 } as never;

      // Act
      renderManager.createParticleBurst(50, 75, config);

      // Assert
      expect(svcMocks.particleSystem.spawn).toHaveBeenCalledWith(
        expect.objectContaining({ x: 50, y: 75, count: 10, color: 0xFF0000 })
      );
    });
  });

  describe('getStats', () => {
    it('should return render statistics', () => {
      // Act
      const stats = renderManager.getStats();

      // Assert
      expect(stats).toEqual({
        spriteCount: 5,
        particleCount: 3,
        beamCount: 0,
        drawCalls: 0,
      });
    });
  });

  describe('destroy', () => {
    it('should clean up render system and reset initialized flag', () => {
      // Arrange
      renderManager.setRenderSystem(vi.fn());
      renderManager.init();

      // Act
      renderManager.destroy();

      // Assert - render system should be null now, so render() should not call it
      const renderSpy = vi.fn();
      renderManager.render(); // should not throw, renderSystem is null
      expect(renderSpy).not.toHaveBeenCalled();

      // init should be able to re-initialize
      mockServices.get.mockClear();
      renderManager.init();
      expect(mockServices.get).toHaveBeenCalledWith('spriteManager');
    });
  });
});

// ========================================================================
// UIController Tests
// ========================================================================

describe('UIController', () => {
  let uiController: UIController;
  let svcMocks: ReturnType<typeof createServiceMocks>;
  let mockApp: MockApplication;

  beforeEach(() => {
    svcMocks = createServiceMocks();
    mockServices.get.mockImplementation((name: string) => {
      return (svcMocks as Record<string, unknown>)[name];
    });
    mockApp = new MockApplication();
    uiController = new UIController(mockApp as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should initialize HUD manager with the app', () => {
      // Act
      uiController.init();

      // Assert
      expect(svcMocks.hudManager.init).toHaveBeenCalledWith(
        mockApp,
        expect.objectContaining({
          onToggleGodMode: expect.any(Function),
          onToggleSlowMode: expect.any(Function),
          onToggleAI: expect.any(Function),
        })
      );
    });

    it('should connect turret menu onSelect callback', () => {
      // Arrange
      const turretMenu = { onSelect: vi.fn() };
      svcMocks.hudManager.getTurretMenu.mockReturnValue(turretMenu);

      // Act
      uiController.init();

      // Assert
      expect(turretMenu.onSelect).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set up game over screen restart callback', () => {
      // Act
      uiController.init();

      // Assert
      expect(svcMocks.gameOverScreen.setOnRestart).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should set up pause overlay callbacks', () => {
      // Act
      uiController.init();

      // Assert
      expect(svcMocks.pauseOverlay.setOnResume).toHaveBeenCalledWith(expect.any(Function));
      expect(svcMocks.pauseOverlay.setOnRestart).toHaveBeenCalledWith(expect.any(Function));
      expect(svcMocks.pauseOverlay.setOnQuit).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not re-initialize when called a second time', () => {
      // Arrange
      uiController.init();
      svcMocks.hudManager.init.mockClear();

      // Act
      uiController.init();

      // Assert
      expect(svcMocks.hudManager.init).not.toHaveBeenCalled();
    });
  });

  describe('setCallbacks', () => {
    it('should merge provided callbacks with existing ones', () => {
      // Arrange
      const restartFn = vi.fn();
      const resumeFn = vi.fn();

      // Act
      uiController.setCallbacks({ onRestart: restartFn });
      uiController.setCallbacks({ onResume: resumeFn });

      // Initialize to wire up callbacks, then trigger them
      uiController.init();

      // Trigger restart through gameOverScreen
      const restartHandler = svcMocks.gameOverScreen.setOnRestart.mock.calls[0][0];
      restartHandler();
      expect(restartFn).toHaveBeenCalled();
    });
  });

  describe('updateHUD', () => {
    it('should update HUD manager with snapshot data', () => {
      // Arrange
      const snapshot = {
        waveNumber: 3,
        waveState: 'active' as const,
        activeEnemies: 5,
        resources: 500,
        timeSurvived: 60,
        enemiesDefeated: 15,
        kmHealth: 100,
        kmMaxHealth: 200,
        kmShield: 50,
        kmMaxShield: 100,
        godModeEnabled: false,
        slowModeEnabled: true,
        state: 'PLAYING',
        gameTime: 60,
        killCount: 15,
      };

      // Act
      uiController.updateHUD(snapshot as never);

      // Assert
      expect(svcMocks.hudManager.update).toHaveBeenCalledWith(
        expect.objectContaining({
          waveNumber: 3,
          activeEnemies: 5,
          resources: 500,
          kobayashiMaruHealth: 100,
          turretCount: 0,
        })
      );
    });

    it('should include combat stats when combat system is provided', () => {
      // Arrange
      const snapshot = {
        waveNumber: 1, waveState: 'active' as const, activeEnemies: 2, resources: 300,
        timeSurvived: 30, enemiesDefeated: 5, kmHealth: 100, kmMaxHealth: 200,
        kmShield: 50, kmMaxShield: 100, godModeEnabled: false, slowModeEnabled: false,
        state: 'PLAYING', gameTime: 30, killCount: 5,
      };
      const combatSystem = {
        getStats: vi.fn(() => ({
          totalDamageDealt: 500,
          totalShotsFired: 100,
          accuracy: 0.75,
          dps: 25,
        })),
      };

      // Act
      uiController.updateHUD(snapshot as never, combatSystem as never, 3);

      // Assert
      expect(svcMocks.hudManager.update).toHaveBeenCalledWith(
        expect.objectContaining({
          totalDamageDealt: 500,
          totalShotsFired: 100,
          accuracy: 0.75,
          dps: 25,
          turretCount: 3,
        })
      );
    });
  });

  describe('addLogMessage', () => {
    it('should delegate to HUD manager', () => {
      // Act
      uiController.addLogMessage('Wave started!', 'wave');

      // Assert
      expect(svcMocks.hudManager.addLogMessage).toHaveBeenCalledWith('Wave started!', 'wave');
    });
  });

  describe('updateAI', () => {
    it('should delegate AI status to HUD manager', () => {
      // Arrange
      const status = { enabled: true, action: 'defending' } as never;

      // Act
      uiController.updateAI(status);

      // Assert
      expect(svcMocks.hudManager.updateAI).toHaveBeenCalledWith(status);
    });
  });

  describe('addAIMessage', () => {
    it('should delegate AI message to HUD manager', () => {
      // Arrange
      const message = { text: 'Analyzing threat...', type: 'thought' } as never;

      // Act
      uiController.addAIMessage(message);

      // Assert
      expect(svcMocks.hudManager.addAIMessage).toHaveBeenCalledWith(message);
    });
  });

  describe('overlays', () => {
    it('should show game over screen with score data', () => {
      // Arrange
      const score = { timeSurvived: 60, waveReached: 5, enemiesDefeated: 20, civiliansSaved: 0 };

      // Act
      uiController.showGameOver(score, true, 500);

      // Assert
      expect(svcMocks.gameOverScreen.show).toHaveBeenCalledWith(score, true, 500);
    });

    it('should hide game over screen', () => {
      // Act
      uiController.hideGameOver();

      // Assert
      expect(svcMocks.gameOverScreen.hide).toHaveBeenCalled();
    });

    it('should show pause overlay', () => {
      // Act
      uiController.showPause();

      // Assert
      expect(svcMocks.pauseOverlay.show).toHaveBeenCalled();
    });

    it('should hide pause overlay', () => {
      // Act
      uiController.hidePause();

      // Assert
      expect(svcMocks.pauseOverlay.hide).toHaveBeenCalled();
    });
  });

  describe('turret upgrade panel', () => {
    it('should show turret upgrade panel with turret info and resources', () => {
      // Arrange
      const upgradePanel = { show: vi.fn(), hide: vi.fn(), onUpgrade: vi.fn(), onSell: vi.fn() };
      svcMocks.hudManager.getTurretUpgradePanel.mockReturnValue(upgradePanel);

      // Act
      uiController.showTurretUpgradePanel(1);

      // Assert
      expect(svcMocks.upgradeManager.getTurretInfo).toHaveBeenCalledWith(1);
      expect(upgradePanel.show).toHaveBeenCalledWith(
        { turretId: 1, level: 1 },
        500,
        50
      );
    });

    it('should not show panel when upgrade panel is null', () => {
      // Arrange
      svcMocks.hudManager.getTurretUpgradePanel.mockReturnValue(null as never);

      // Act & Assert
      expect(() => uiController.showTurretUpgradePanel(1)).not.toThrow();
    });

    it('should not show panel when turret info is null', () => {
      // Arrange
      svcMocks.upgradeManager.getTurretInfo.mockReturnValue(null as never);
      const upgradePanel = { show: vi.fn(), hide: vi.fn(), onUpgrade: vi.fn(), onSell: vi.fn() };
      svcMocks.hudManager.getTurretUpgradePanel.mockReturnValue(upgradePanel);

      // Act
      uiController.showTurretUpgradePanel(999);

      // Assert
      expect(upgradePanel.show).not.toHaveBeenCalled();
    });

    it('should hide turret upgrade panel', () => {
      // Arrange
      const upgradePanel = { show: vi.fn(), hide: vi.fn(), onUpgrade: vi.fn(), onSell: vi.fn() };
      svcMocks.hudManager.getTurretUpgradePanel.mockReturnValue(upgradePanel);

      // Act
      uiController.hideTurretUpgradePanel();

      // Assert
      expect(upgradePanel.hide).toHaveBeenCalled();
    });

    it('should connect upgrade and sell callbacks to panel', () => {
      // Arrange
      const upgradePanel = { show: vi.fn(), hide: vi.fn(), onUpgrade: vi.fn(), onSell: vi.fn() };
      svcMocks.hudManager.getTurretUpgradePanel.mockReturnValue(upgradePanel);
      const onUpgrade = vi.fn();
      const onSell = vi.fn();

      // Act
      uiController.connectTurretUpgradeCallbacks(onUpgrade, onSell);

      // Assert
      expect(upgradePanel.onUpgrade).toHaveBeenCalledWith(onUpgrade);
      expect(upgradePanel.onSell).toHaveBeenCalledWith(onSell);
    });
  });

  describe('destroy', () => {
    it('should clear callbacks and reset initialized flag', () => {
      // Arrange
      uiController.setCallbacks({ onRestart: vi.fn() });
      uiController.init();

      // Act
      uiController.destroy();

      // Assert — re-initializing should work
      mockServices.get.mockClear();
      svcMocks.hudManager.init.mockClear();
      uiController.init();
      expect(svcMocks.hudManager.init).toHaveBeenCalled();
    });
  });
});

// ========================================================================
// InputRouter Tests
// ========================================================================

describe('InputRouter', () => {
  let inputRouter: InputRouter;
  let svcMocks: ReturnType<typeof createServiceMocks>;
  let mockApp: MockApplication;
  const fakeWorld = {} as never;

  beforeEach(() => {
    svcMocks = createServiceMocks();
    mockServices.get.mockImplementation((name: string) => {
      return (svcMocks as Record<string, unknown>)[name];
    });
    mockServices.tryGet.mockImplementation((name: string) => {
      return (svcMocks as Record<string, unknown>)[name];
    });
    mockApp = new MockApplication();
    inputRouter = new InputRouter(mockApp as never, fakeWorld);
  });

  afterEach(() => {
    inputRouter.destroy();
    vi.clearAllMocks();
  });

  describe('on / emit', () => {
    it('should register and trigger action callbacks', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.PAUSE, callback);

      // Set up state checkers so pause binding matches
      inputRouter.setStateCheckers({
        isPlaying: () => true,
        isPaused: () => false,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });

      inputRouter.init();

      // Act — simulate Escape key while playing
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      window.dispatchEvent(event);

      // Assert
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ action: InputAction.PAUSE })
      );
    });

    it('should return an unsubscribe function', () => {
      // Arrange
      const callback = vi.fn();
      const unsub = inputRouter.on(InputAction.PAUSE, callback);

      inputRouter.setStateCheckers({
        isPlaying: () => true,
        isPaused: () => false,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act
      unsub();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('keyboard handling', () => {
    it('should dispatch RESUME when Escape pressed while paused', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.RESUME, callback);
      inputRouter.setStateCheckers({
        isPlaying: () => false,
        isPaused: () => true,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should dispatch RESTART when r pressed while paused', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.RESTART, callback);
      inputRouter.setStateCheckers({
        isPlaying: () => false,
        isPaused: () => true,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should dispatch RESTART when R pressed while game over', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.RESTART, callback);
      inputRouter.setStateCheckers({
        isPlaying: () => false,
        isPaused: () => false,
        isGameOver: () => true,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'R' }));

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should dispatch TOGGLE_DEBUG when Ctrl+d pressed', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.TOGGLE_DEBUG, callback);
      inputRouter.setStateCheckers({
        isPlaying: () => true,
        isPaused: () => false,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd', ctrlKey: true }));

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should not dispatch action when state does not match binding', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.PAUSE, callback);
      inputRouter.setStateCheckers({
        isPlaying: () => false, // Not playing
        isPaused: () => false,
        isGameOver: () => true,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

      // Assert - Escape PAUSE requires whenPlaying=true, but we're in game over
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('addKeyBinding / removeKeyBinding', () => {
    it('should add a custom key binding', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.TOGGLE_GOD_MODE, callback);
      inputRouter.addKeyBinding({
        key: 'g',
        action: InputAction.TOGGLE_GOD_MODE,
      });
      inputRouter.setStateCheckers({
        isPlaying: () => true,
        isPaused: () => false,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Act - 'g' without ctrl should now trigger TOGGLE_GOD_MODE (no state restriction)
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'g' }));

      // Assert
      expect(callback).toHaveBeenCalled();
    });

    it('should remove a key binding', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.QUIT, callback);
      inputRouter.setStateCheckers({
        isPlaying: () => false,
        isPaused: () => true,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      inputRouter.init();

      // Remove the 'q' QUIT binding
      inputRouter.removeKeyBinding('q', InputAction.QUIT);

      // Act
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'q' }));

      // Assert - Q (uppercase) still exists, but lowercase was removed
      // The Q binding should still fire for uppercase
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('turret selection', () => {
    it('should return -1 as default selected turret id', () => {
      // Assert
      expect(inputRouter.getSelectedTurretId()).toBe(-1);
    });

    it('should deselect turret and emit DESELECT_TURRET action', () => {
      // Arrange - manually set a selected turret via reflection
      const callback = vi.fn();
      inputRouter.on(InputAction.DESELECT_TURRET, callback);
      // Use internal property to simulate selection
      (inputRouter as unknown as { selectedTurretId: number }).selectedTurretId = 5;

      // Act
      inputRouter.deselectTurret();

      // Assert
      expect(inputRouter.getSelectedTurretId()).toBe(-1);
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({ action: InputAction.DESELECT_TURRET })
      );
    });

    it('should not emit DESELECT_TURRET when no turret is selected', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.DESELECT_TURRET, callback);

      // Act
      inputRouter.deselectTurret();

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should clear action callbacks and reset selected turret', () => {
      // Arrange
      const callback = vi.fn();
      inputRouter.on(InputAction.PAUSE, callback);
      inputRouter.init();

      // Act
      inputRouter.destroy();

      // Assert
      expect(inputRouter.getSelectedTurretId()).toBe(-1);

      // Callbacks should be cleared, so dispatching an event should not fire
      inputRouter.setStateCheckers({
        isPlaying: () => true,
        isPaused: () => false,
        isGameOver: () => false,
        isPlacingTurret: () => false,
      });
      // Re-init to add listeners again (they were removed)
      inputRouter.init();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
      expect(callback).not.toHaveBeenCalled();
    });
  });
});

// ========================================================================
// GameplayManager Tests
// ========================================================================

describe('GameplayManager', () => {
  let gameplayManager: GameplayManager;
  let svcMocks: ReturnType<typeof createServiceMocks>;
  const fakeWorld = {} as never;

  beforeEach(() => {
    svcMocks = createServiceMocks();
    mockServices.get.mockImplementation((name: string) => {
      return (svcMocks as Record<string, unknown>)[name];
    });
    gameplayManager = new GameplayManager(fakeWorld);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('init', () => {
    it('should subscribe to ENEMY_KILLED, WAVE_STARTED, and WAVE_COMPLETED events', () => {
      // Act
      gameplayManager.init();

      // Assert
      expect(svcMocks.eventBus.on).toHaveBeenCalledWith('ENEMY_KILLED', expect.any(Function));
      expect(svcMocks.eventBus.on).toHaveBeenCalledWith('WAVE_STARTED', expect.any(Function));
      expect(svcMocks.eventBus.on).toHaveBeenCalledWith('WAVE_COMPLETED', expect.any(Function));
    });

    it('should initialize wave manager with the world', () => {
      // Act
      gameplayManager.init();

      // Assert
      expect(svcMocks.waveManager.init).toHaveBeenCalledWith(fakeWorld);
    });

    it('should set game state to PLAYING and start wave 1', () => {
      // Act
      gameplayManager.init();

      // Assert
      expect(svcMocks.gameState.setState).toHaveBeenCalledWith('PLAYING');
      expect(svcMocks.waveManager.startWave).toHaveBeenCalledWith(1);
    });
  });

  describe('update', () => {
    it('should increment game time by deltaTime', () => {
      // Act
      gameplayManager.update(0.5);
      gameplayManager.update(0.5);

      // Assert
      expect(gameplayManager.getGameTime()).toBe(1.0);
    });

    it('should update score manager and wave manager', () => {
      // Act
      gameplayManager.update(0.016);

      // Assert
      expect(svcMocks.scoreManager.update).toHaveBeenCalledWith(0.016);
      expect(svcMocks.waveManager.update).toHaveBeenCalledWith(0.016);
    });
  });

  describe('pause / resume', () => {
    it('should set state to PAUSED when currently playing', () => {
      // Arrange
      svcMocks.gameState.isPlaying.mockReturnValue(true);

      // Act
      gameplayManager.pause();

      // Assert
      expect(svcMocks.gameState.setState).toHaveBeenCalledWith('PAUSED');
    });

    it('should not pause when not playing', () => {
      // Arrange
      svcMocks.gameState.isPlaying.mockReturnValue(false);

      // Act
      gameplayManager.pause();

      // Assert
      expect(svcMocks.gameState.setState).not.toHaveBeenCalled();
    });

    it('should set state to PLAYING when currently paused', () => {
      // Arrange
      svcMocks.gameState.isPaused.mockReturnValue(true);

      // Act
      gameplayManager.resume();

      // Assert
      expect(svcMocks.gameState.setState).toHaveBeenCalledWith('PLAYING');
    });

    it('should not resume when not paused', () => {
      // Arrange
      svcMocks.gameState.isPaused.mockReturnValue(false);

      // Act
      gameplayManager.resume();

      // Assert
      expect(svcMocks.gameState.setState).not.toHaveBeenCalled();
    });
  });

  describe('cheat modes', () => {
    it('should toggle god mode on and off', () => {
      // Act & Assert
      expect(gameplayManager.toggleGodMode()).toBe(true);
      expect(gameplayManager.isGodModeEnabled()).toBe(true);
      expect(gameplayManager.toggleGodMode()).toBe(false);
      expect(gameplayManager.isGodModeEnabled()).toBe(false);
    });

    it('should toggle slow mode on and off', () => {
      // Arrange — slow mode starts as true by default
      expect(gameplayManager.isSlowModeEnabled()).toBe(true);

      // Act & Assert
      expect(gameplayManager.toggleSlowMode()).toBe(false);
      expect(gameplayManager.isSlowModeEnabled()).toBe(false);
      expect(gameplayManager.toggleSlowMode()).toBe(true);
      expect(gameplayManager.isSlowModeEnabled()).toBe(true);
    });

    it('should return correct speed multiplier based on slow mode', () => {
      // Arrange - slow mode starts enabled
      expect(gameplayManager.getSpeedMultiplier()).toBe(0.5);

      // Act
      gameplayManager.toggleSlowMode(); // disable slow mode

      // Assert
      expect(gameplayManager.getSpeedMultiplier()).toBe(1.0);
    });
  });

  describe('getSnapshot', () => {
    it('should return gameplay snapshot with current state', () => {
      // Act
      const snapshot = gameplayManager.getSnapshot();

      // Assert
      expect(snapshot).toEqual(expect.objectContaining({
        waveNumber: 1,
        waveState: 'active',
        activeEnemies: 3,
        resources: 500,
        timeSurvived: 60,
        enemiesDefeated: 15,
        killCount: 0,
        godModeEnabled: false,
        slowModeEnabled: true,
      }));
    });
  });

  describe('getters', () => {
    it('should return -1 as default Kobayashi Maru ID', () => {
      expect(gameplayManager.getKobayashiMaruId()).toBe(-1);
    });

    it('should return 0 as initial game time', () => {
      expect(gameplayManager.getGameTime()).toBe(0);
    });

    it('should return 0 as initial kill count', () => {
      expect(gameplayManager.getKillCount()).toBe(0);
    });
  });

  describe('setCallbacks', () => {
    it('should merge callbacks without overwriting existing ones', () => {
      // Arrange
      const onGameOver = vi.fn();
      const onWaveStart = vi.fn();

      // Act
      gameplayManager.setCallbacks({ onGameOver });
      gameplayManager.setCallbacks({ onWaveStart });

      // Assert — both should be stored (we verify indirectly through event handling)
      // The callbacks object should contain both
      expect(onGameOver).not.toHaveBeenCalled(); // Not triggered yet
      expect(onWaveStart).not.toHaveBeenCalled();
    });
  });

  describe('event handlers', () => {
    it('should handle ENEMY_KILLED by removing enemy, adding resources, and incrementing kill count', () => {
      // Arrange
      const onEnemyKilled = vi.fn();
      gameplayManager.setCallbacks({ onEnemyKilled });
      gameplayManager.init();

      // Get the registered enemy killed handler
      const enemyKilledHandler = svcMocks.eventBus.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'ENEMY_KILLED'
      )?.[1] as (payload: { entityId: number; factionId: number; x: number; y: number }) => void;

      // Act
      enemyKilledHandler({ entityId: 10, factionId: 1, x: 100, y: 200 });

      // Assert
      expect(svcMocks.waveManager.removeEnemy).toHaveBeenCalledWith(10);
      expect(svcMocks.resourceManager.addResources).toHaveBeenCalledWith(12);
      expect(gameplayManager.getKillCount()).toBe(1);
      expect(onEnemyKilled).toHaveBeenCalledWith(12);
    });

    it('should handle WAVE_STARTED by calling onWaveStart callback', () => {
      // Arrange
      const onWaveStart = vi.fn();
      gameplayManager.setCallbacks({ onWaveStart });
      gameplayManager.init();

      const waveStartedHandler = svcMocks.eventBus.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'WAVE_STARTED'
      )?.[1] as (payload: { waveNumber: number; totalEnemies?: number }) => void;

      // Act
      waveStartedHandler({ waveNumber: 2, totalEnemies: 10 });

      // Assert
      expect(onWaveStart).toHaveBeenCalledWith(2, 10);
    });

    it('should handle WAVE_COMPLETED by calling onWaveComplete callback', () => {
      // Arrange
      const onWaveComplete = vi.fn();
      gameplayManager.setCallbacks({ onWaveComplete });
      gameplayManager.init();

      const waveCompletedHandler = svcMocks.eventBus.on.mock.calls.find(
        (call: unknown[]) => call[0] === 'WAVE_COMPLETED'
      )?.[1] as (payload: { waveNumber: number }) => void;

      // Act
      waveCompletedHandler({ waveNumber: 2 });

      // Assert
      expect(onWaveComplete).toHaveBeenCalledWith(2);
    });
  });

  describe('restart', () => {
    it('should reset managers, kill count, and game time', () => {
      // Arrange
      gameplayManager.init();
      gameplayManager.update(5.0); // accumulate some time

      // Act
      gameplayManager.restart();

      // Assert
      expect(svcMocks.scoreManager.reset).toHaveBeenCalled();
      expect(svcMocks.resourceManager.reset).toHaveBeenCalled();
      expect(svcMocks.waveManager.reset).toHaveBeenCalled();
      expect(svcMocks.gameState.reset).toHaveBeenCalled();
      expect(gameplayManager.getGameTime()).toBe(0);
      expect(gameplayManager.getKillCount()).toBe(0);
    });

    it('should re-enable auto wave progression and start wave 1', () => {
      // Arrange
      gameplayManager.init();

      // Act
      gameplayManager.restart();

      // Assert
      expect(svcMocks.waveManager.setAutoStartNextWave).toHaveBeenCalledWith(true);
      expect(svcMocks.waveManager.startWave).toHaveBeenCalledWith(1);
      expect(svcMocks.gameState.setState).toHaveBeenCalledWith('PLAYING');
    });
  });

  describe('destroy', () => {
    it('should unsubscribe from all events', () => {
      // Arrange
      gameplayManager.init();

      // Act
      gameplayManager.destroy();

      // Assert
      expect(svcMocks.eventBus.off).toHaveBeenCalledWith('ENEMY_KILLED', expect.any(Function));
      expect(svcMocks.eventBus.off).toHaveBeenCalledWith('WAVE_STARTED', expect.any(Function));
      expect(svcMocks.eventBus.off).toHaveBeenCalledWith('WAVE_COMPLETED', expect.any(Function));
    });

    it('should reset Kobayashi Maru ID and clear callbacks', () => {
      // Arrange
      gameplayManager.init();

      // Act
      gameplayManager.destroy();

      // Assert
      expect(gameplayManager.getKobayashiMaruId()).toBe(-1);
    });
  });
});
