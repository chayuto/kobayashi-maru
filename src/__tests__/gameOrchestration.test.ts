/**
 * Tests for Game orchestration and GameBootstrap
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ── Hoisted mock instances (available before vi.mock factory runs) ──────────
const {
  mockBootstrapGame,
  mockGetServices,
  mockResetServices,
  mockPoolManagerInstance,
  mockLoopManager,
  mockRenderManager,
  mockGameplayManager,
  mockUIController,
  mockInputRouter,
  mockAIManager,
  mockAIDebugVisualizer,
} = vi.hoisted(() => ({
  mockBootstrapGame: vi.fn(),
  mockGetServices: vi.fn(),
  mockResetServices: vi.fn(),
  mockPoolManagerInstance: {
    init: vi.fn(),
    clear: vi.fn(),
    destroy: vi.fn(),
  },
  mockLoopManager: {
    start: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    isPaused: vi.fn(() => false),
    destroy: vi.fn(),
    onPreUpdate: vi.fn(() => vi.fn()),
    onGameplay: vi.fn(() => vi.fn()),
    onPhysics: vi.fn(() => vi.fn()),
    onRender: vi.fn(() => vi.fn()),
    onPostRender: vi.fn(() => vi.fn()),
    onUI: vi.fn(() => vi.fn()),
  },
  mockRenderManager: {
    init: vi.fn(),
    destroy: vi.fn(),
    setRenderSystem: vi.fn(),
    updateBackground: vi.fn(),
    updateEffects: vi.fn(),
    render: vi.fn(),
    applyPostEffects: vi.fn(),
    shake: vi.fn(),
  },
  mockGameplayManager: {
    init: vi.fn(),
    destroy: vi.fn(),
    setCallbacks: vi.fn(),
    update: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    restart: vi.fn(),
    toggleGodMode: vi.fn(() => true),
    toggleSlowMode: vi.fn(() => true),
    isGodModeEnabled: vi.fn(() => false),
    isSlowModeEnabled: vi.fn(() => false),
    getSpeedMultiplier: vi.fn(() => 1.0),
    getSnapshot: vi.fn(() => ({
      state: 'playing',
      gameTime: 0,
      waveNumber: 1,
      waveState: 'active',
      activeEnemies: 0,
      resources: 100,
      timeSurvived: 0,
      enemiesDefeated: 0,
      killCount: 0,
      kmHealth: 100,
      kmMaxHealth: 100,
      kmShield: 50,
      kmMaxShield: 50,
      godModeEnabled: false,
      slowModeEnabled: false,
    })),
    getKobayashiMaruId: vi.fn(() => 1),
    getGameTime: vi.fn(() => 0),
  },
  mockUIController: {
    init: vi.fn(),
    destroy: vi.fn(),
    setCallbacks: vi.fn(),
    showGameOver: vi.fn(),
    hideGameOver: vi.fn(),
    showPause: vi.fn(),
    hidePause: vi.fn(),
    addLogMessage: vi.fn(),
    updateHUD: vi.fn(),
    updateDebug: vi.fn(),
    updateEntityCount: vi.fn(),
    showTurretUpgradePanel: vi.fn(),
    hideTurretUpgradePanel: vi.fn(),
    connectTurretUpgradeCallbacks: vi.fn(),
    updateAI: vi.fn(),
  },
  mockInputRouter: {
    init: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(() => vi.fn()),
    setStateCheckers: vi.fn(),
    getSelectedTurretId: vi.fn(() => -1),
    deselectTurret: vi.fn(),
  },
  mockAIManager: {
    toggle: vi.fn(() => true),
    isEnabled: vi.fn(() => false),
    getStatus: vi.fn(() => null),
    getExtendedStatus: vi.fn(() => ({})),
    setPersonality: vi.fn(),
    update: vi.fn(),
    updateHUDContext: vi.fn(),
    getCoverageAnalyzer: vi.fn(() => ({})),
  },
  mockAIDebugVisualizer: {
    toggle: vi.fn(),
    toggleLayer: vi.fn(),
    isEnabled: vi.fn(() => false),
    update: vi.fn(),
    destroy: vi.fn(),
  },
}));

// ── Pixi mock ──────────────────────────────────────────────────────────────
vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

// ── Module-level mocks ─────────────────────────────────────────────────────

vi.mock('../core/bootstrap', () => ({
  bootstrapGame: mockBootstrapGame,
  GameBootstrap: vi.fn(),
}));

vi.mock('../core/services', () => ({
  getServices: mockGetServices,
  resetServices: mockResetServices,
}));

vi.mock('../ecs/PoolManager', () => ({
  PoolManager: {
    getInstance: () => mockPoolManagerInstance,
  },
}));

vi.mock('../core/loop', () => {
  // Use a function expression (not arrow) so it's callable with `new`
  const GameLoopManager = function () { return mockLoopManager; };
  return { GameLoopManager };
});

vi.mock('../core/managers/RenderManager', () => {
  const RenderManager = function () { return mockRenderManager; };
  return {
    RenderManager,
    RenderLayer: { BACKGROUND: 0, ENTITIES: 100, EFFECTS: 200, OVERLAYS: 300, UI: 400 },
  };
});

vi.mock('../core/managers/GameplayManager', () => {
  const GameplayManager = function () { return mockGameplayManager; };
  return { GameplayManager };
});

vi.mock('../core/managers/UIController', () => {
  const UIController = function () { return mockUIController; };
  return { UIController };
});

vi.mock('../core/managers/InputRouter', () => {
  const InputRouter = function () { return mockInputRouter; };
  return {
    InputRouter,
    InputAction: {
      PAUSE: 'pause',
      RESUME: 'resume',
      RESTART: 'restart',
      QUIT: 'quit',
      SELECT_TURRET: 'select_turret',
      DESELECT_TURRET: 'deselect_turret',
      PLACE_TURRET: 'place_turret',
      CANCEL_PLACEMENT: 'cancel_placement',
      TOGGLE_DEBUG: 'toggle_debug',
      TOGGLE_GOD_MODE: 'toggle_god_mode',
      TOGGLE_SLOW_MODE: 'toggle_slow_mode',
    },
  };
});

vi.mock('../systems', () => {
  const CombatSystem = function () {
    return {
      getActiveBeams: vi.fn(() => []),
      getStats: vi.fn(() => ({})),
    };
  };
  return {
    createRenderSystem: vi.fn(() => vi.fn()),
    createMovementSystem: vi.fn(() => vi.fn()),
    createCollisionSystem: vi.fn(() => ({ update: vi.fn() })),
    createTargetingSystem: vi.fn(() => vi.fn()),
    createDamageSystem: vi.fn(() => vi.fn()),
    createAISystem: vi.fn(() => vi.fn()),
    createProjectileSystem: vi.fn(() => vi.fn()),
    statusEffectSystem: vi.fn(),
    createEnemyCollisionSystem: vi.fn(() => vi.fn()),
    createEnemyCombatSystem: vi.fn(() => vi.fn()),
    createEnemyProjectileSystem: vi.fn(() => vi.fn()),
    createAbilitySystem: vi.fn(() => vi.fn()),
    createTurretRotationSystem: vi.fn(() => vi.fn()),
    createEnemyRotationSystem: vi.fn(() => vi.fn()),
    CollisionSystem: vi.fn(),
    CombatSystem,
    BeamVisual: vi.fn(),
  };
});

vi.mock('bitecs', () => ({
  query: vi.fn(() => []),
  createWorld: vi.fn(() => ({})),
  addEntity: vi.fn(() => 1),
  removeEntity: vi.fn(),
  defineQuery: vi.fn(() => vi.fn(() => [])),
  addComponent: vi.fn(),
  removeComponent: vi.fn(),
}));

vi.mock('../ecs', () => ({
  GameWorld: vi.fn(),
  createGameWorld: vi.fn(() => ({ entityCount: 0 })),
  getEntityCount: vi.fn(() => 0),
}));

vi.mock('../ecs/components', () => ({
  Turret: {},
  Position: {},
  Health: { current: [], max: [] },
  Shield: { current: [], max: [] },
  Velocity: {},
  AIBehavior: {},
  Projectile: {},
  Collider: {},
}));

vi.mock('../game/waveConfig', () => ({
  getWaveStoryText: vi.fn(() => null),
}));

vi.mock('../ai', () => {
  const AIAutoPlayManager = function () { return mockAIManager; };
  return {
    AIAutoPlayManager,
    AIStatus: {},
    AIPersonality: {},
  };
});

vi.mock('../ai/visualization', () => {
  const AIDebugVisualizer = function () { return mockAIDebugVisualizer; };
  return { AIDebugVisualizer };
});

// ── Import after mocks ─────────────────────────────────────────────────────
import { Game } from '../core/Game';
import { bootstrapGame } from '../core/bootstrap';

// ── Shared mock services factory ────────────────────────────────────────────
function createMockServices() {
  return {
    get: vi.fn((name: string) => {
      const serviceMap: Record<string, unknown> = {
        systemManager: {
          register: vi.fn(),
          run: vi.fn(),
        },
        spatialHash: {},
        particleSystem: { update: vi.fn(), init: vi.fn() },
        spriteManager: { init: vi.fn(), destroy: vi.fn(), removeSprite: vi.fn() },
        audioManager: { init: vi.fn(), resume: vi.fn() },
        placementManager: {
          startPlacing: vi.fn(),
          cancelPlacement: vi.fn(),
          placeTurret: vi.fn(),
          isPlacing: vi.fn(() => false),
          on: vi.fn(),
        },
        upgradeManager: {
          applyUpgrade: vi.fn(() => ({ success: true })),
          sellTurret: vi.fn(() => 50),
        },
        gameState: {
          isPlaying: vi.fn(() => true),
          isPaused: vi.fn(() => false),
          isGameOver: vi.fn(() => false),
        },
        resourceManager: {},
        waveManager: {},
        scoreManager: {},
        highScoreManager: {},
        performanceMonitor: {},
        qualityManager: {},
        hapticManager: {},
        inputManager: {},
        eventBus: {
          on: vi.fn(),
          off: vi.fn(),
          emit: vi.fn(),
        },
      };
      return serviceMap[name] ?? {};
    }),
    tryGet: vi.fn((name: string) => {
      if (name === 'placementManager') {
        return {
          startPlacing: vi.fn(),
          cancelPlacement: vi.fn(),
          isPlacing: vi.fn(() => false),
          on: vi.fn(),
        };
      }
      return null;
    }),
    register: vi.fn(),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Game class tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Game', () => {
  let game: Game;
  let mockServices: ReturnType<typeof createMockServices>;
  let mockApp: {
    stage: { scale: { set: ReturnType<typeof vi.fn> }; addChild: ReturnType<typeof vi.fn> };
    ticker: { add: ReturnType<typeof vi.fn>; remove: ReturnType<typeof vi.fn>; deltaMS: number };
    renderer: { resize: ReturnType<typeof vi.fn>; name: string };
    canvas: HTMLCanvasElement;
    destroy: ReturnType<typeof vi.fn>;
  };
  let mockWorld: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup mock app and world
    mockApp = {
      stage: { scale: { set: vi.fn() }, addChild: vi.fn() },
      ticker: { add: vi.fn(), remove: vi.fn(), deltaMS: 16.67 },
      renderer: { resize: vi.fn(), name: 'mock' },
      canvas: document.createElement('canvas'),
      destroy: vi.fn(),
    };
    mockWorld = { entityCount: 0 };

    // Setup mock services
    mockServices = createMockServices();
    mockGetServices.mockReturnValue(mockServices);

    // Setup bootstrapGame mock
    mockBootstrapGame.mockResolvedValue({ app: mockApp, world: mockWorld });

    // Create game instance
    game = new Game('test-container');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── init ──────────────────────────────────────────────────────────────────

  describe('init()', () => {
    it('should initialize the game when called for the first time', async () => {
      // Act
      await game.init();

      // Assert
      expect(mockBootstrapGame).toHaveBeenCalledWith('test-container');
      expect(mockPoolManagerInstance.init).toHaveBeenCalledWith(mockWorld);
      expect(mockGameplayManager.init).toHaveBeenCalled();
    });

    it('should skip initialization when already initialized', async () => {
      // Arrange
      await game.init();
      mockBootstrapGame.mockClear();

      // Act
      await game.init();

      // Assert
      expect(mockBootstrapGame).not.toHaveBeenCalled();
    });

    it('should create all managers during initialization', async () => {
      // Act
      await game.init();

      // Assert
      expect(mockRenderManager.init).toHaveBeenCalled();
      expect(mockUIController.init).toHaveBeenCalled();
      expect(mockInputRouter.init).toHaveBeenCalled();
    });

    it('should set up resize handler during initialization', async () => {
      // Arrange
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      // Act
      await game.init();

      // Assert
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should setup gameplay manager callbacks during init', async () => {
      // Act
      await game.init();

      // Assert
      expect(mockGameplayManager.setCallbacks).toHaveBeenCalledWith(
        expect.objectContaining({
          onGameOver: expect.any(Function),
          onWaveStart: expect.any(Function),
          onWaveComplete: expect.any(Function),
          onEnemyKilled: expect.any(Function),
          onKobayashiMaruDamaged: expect.any(Function),
        })
      );
    });

    it('should setup UI controller callbacks during init', async () => {
      // Act
      await game.init();

      // Assert
      expect(mockUIController.setCallbacks).toHaveBeenCalledWith(
        expect.objectContaining({
          onRestart: expect.any(Function),
          onResume: expect.any(Function),
          onQuit: expect.any(Function),
          onTurretSelect: expect.any(Function),
          onToggleGodMode: expect.any(Function),
          onToggleSlowMode: expect.any(Function),
          onToggleAI: expect.any(Function),
        })
      );
    });

    it('should setup loop callbacks during init', async () => {
      // Act
      await game.init();

      // Assert
      expect(mockLoopManager.onPreUpdate).toHaveBeenCalled();
      expect(mockLoopManager.onGameplay).toHaveBeenCalled();
      expect(mockLoopManager.onPhysics).toHaveBeenCalled();
      expect(mockLoopManager.onRender).toHaveBeenCalled();
      expect(mockLoopManager.onPostRender).toHaveBeenCalled();
      expect(mockLoopManager.onUI).toHaveBeenCalled();
    });
  });

  // ── start ─────────────────────────────────────────────────────────────────

  describe('start()', () => {
    it('should start the game loop when initialized', async () => {
      // Arrange
      await game.init();

      // Act
      game.start();

      // Assert
      expect(mockLoopManager.start).toHaveBeenCalled();
    });

    it('should throw an error when called before init', () => {
      // Act & Assert
      expect(() => game.start()).toThrow('Game not initialized. Call init() first.');
    });
  });

  // ── pause ─────────────────────────────────────────────────────────────────

  describe('pause()', () => {
    it('should pause gameplay and loop when called', async () => {
      // Arrange
      await game.init();
      game.start();

      // Act
      game.pause();

      // Assert
      expect(mockGameplayManager.pause).toHaveBeenCalled();
      expect(mockLoopManager.pause).toHaveBeenCalled();
      expect(mockUIController.showPause).toHaveBeenCalled();
    });
  });

  // ── resume ────────────────────────────────────────────────────────────────

  describe('resume()', () => {
    it('should resume gameplay and loop when called', async () => {
      // Arrange
      await game.init();
      game.start();

      // Act
      game.resume();

      // Assert
      expect(mockGameplayManager.resume).toHaveBeenCalled();
      expect(mockLoopManager.resume).toHaveBeenCalled();
      expect(mockUIController.hidePause).toHaveBeenCalled();
    });
  });

  // ── restart ───────────────────────────────────────────────────────────────

  describe('restart()', () => {
    it('should restart the game and clear pools when called', async () => {
      // Arrange
      await game.init();

      // Act
      game.restart();

      // Assert
      expect(mockUIController.hideGameOver).toHaveBeenCalled();
      expect(mockGameplayManager.restart).toHaveBeenCalled();
      expect(mockPoolManagerInstance.clear).toHaveBeenCalled();
      expect(mockInputRouter.deselectTurret).toHaveBeenCalled();
    });
  });

  // ── isPaused ──────────────────────────────────────────────────────────────

  describe('isPaused()', () => {
    it('should return false when game is not paused', async () => {
      // Arrange
      await game.init();
      mockLoopManager.isPaused.mockReturnValue(false);

      // Act & Assert
      expect(game.isPaused()).toBe(false);
    });

    it('should return true when game is paused', async () => {
      // Arrange
      await game.init();
      mockLoopManager.isPaused.mockReturnValue(true);

      // Act & Assert
      expect(game.isPaused()).toBe(true);
    });
  });

  // ── destroy ───────────────────────────────────────────────────────────────

  describe('destroy()', () => {
    it('should clean up all managers and services when called', async () => {
      // Arrange
      await game.init();

      // Act
      game.destroy();

      // Assert
      expect(mockAIDebugVisualizer.destroy).toHaveBeenCalled();
      expect(mockInputRouter.destroy).toHaveBeenCalled();
      expect(mockUIController.destroy).toHaveBeenCalled();
      expect(mockGameplayManager.destroy).toHaveBeenCalled();
      expect(mockRenderManager.destroy).toHaveBeenCalled();
      expect(mockLoopManager.destroy).toHaveBeenCalled();
      expect(mockPoolManagerInstance.destroy).toHaveBeenCalled();
      expect(mockResetServices).toHaveBeenCalled();
      expect(mockApp.destroy).toHaveBeenCalledWith(true);
    });

    it('should remove the resize event listener when destroyed', async () => {
      // Arrange
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      await game.init();

      // Act
      game.destroy();

      // Assert
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });

    it('should allow re-initialization after destroy', async () => {
      // Arrange
      await game.init();
      game.destroy();
      mockBootstrapGame.mockClear();

      // Act
      await game.init();

      // Assert
      expect(mockBootstrapGame).toHaveBeenCalledWith('test-container');
    });
  });

  // ── Cheat mode delegation ─────────────────────────────────────────────────

  describe('cheat modes', () => {
    it('should toggle god mode via gameplay manager', async () => {
      // Arrange
      await game.init();

      // Act
      const result = game.toggleGodMode();

      // Assert
      expect(mockGameplayManager.toggleGodMode).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should toggle slow mode via gameplay manager', async () => {
      // Arrange
      await game.init();

      // Act
      const result = game.toggleSlowMode();

      // Assert
      expect(mockGameplayManager.toggleSlowMode).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return god mode state from gameplay manager', async () => {
      // Arrange
      await game.init();
      mockGameplayManager.isGodModeEnabled.mockReturnValue(true);

      // Act & Assert
      expect(game.isGodModeEnabled()).toBe(true);
    });

    it('should return speed multiplier from gameplay manager', async () => {
      // Arrange
      await game.init();
      mockGameplayManager.getSpeedMultiplier.mockReturnValue(0.5);

      // Act & Assert
      expect(game.getSpeedMultiplier()).toBe(0.5);
    });
  });

  // ── AI methods ────────────────────────────────────────────────────────────

  describe('AI auto-play', () => {
    it('should toggle AI auto-play when called', async () => {
      // Arrange
      await game.init();

      // Act
      const result = game.toggleAI();

      // Assert
      expect(mockAIManager.toggle).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return AI enabled state', async () => {
      // Arrange
      await game.init();
      mockAIManager.isEnabled.mockReturnValue(true);

      // Act & Assert
      expect(game.isAIEnabled()).toBe(true);
    });

    it('should return AI status', async () => {
      // Arrange
      await game.init();
      const status = { enabled: true, personality: 'aggressive' } as never;
      mockAIManager.getStatus.mockReturnValue(status);

      // Act
      const result = game.getAIStatus();

      // Assert
      expect(result).toEqual(status);
    });
  });

  // ── Service getters ──────────────────────────────────────────────────────

  describe('service getters', () => {
    it('should return collision system reference', async () => {
      // Arrange
      await game.init();

      // Act
      const result = game.getCollisionSystem();

      // Assert
      expect(result).not.toBeUndefined();
    });

    it('should return null for damage system', async () => {
      // Arrange
      await game.init();

      // Act & Assert
      expect(game.getDamageSystem()).toBeNull();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// GameBootstrap tests
// ═══════════════════════════════════════════════════════════════════════════

describe('GameBootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('bootstrapGame()', () => {
    it('should call bootstrapGame with the provided container ID', async () => {
      // Arrange
      mockBootstrapGame.mockResolvedValue({
        app: {},
        world: {},
      });

      // Act
      await bootstrapGame('my-container');

      // Assert
      expect(mockBootstrapGame).toHaveBeenCalledWith('my-container');
    });

    it('should return app and world from bootstrap result', async () => {
      // Arrange
      const fakeApp = { stage: {} };
      const fakeWorld = { entityCount: 0 };
      mockBootstrapGame.mockResolvedValue({
        app: fakeApp,
        world: fakeWorld,
      });

      // Act
      const result = await bootstrapGame('container');

      // Assert
      expect(result.app).toBe(fakeApp);
      expect(result.world).toBe(fakeWorld);
    });
  });
});
