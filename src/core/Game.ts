/**
 * Core Game class for Kobayashi Maru
 * 
 * Thin facade that orchestrates game managers.
 * All logic is delegated to specialized managers.
 * 
 * @module core/Game
 */

import { Application } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Turret } from '../ecs/components';
import { GameWorld } from '../ecs';
import {
  createRenderSystem, createMovementSystem, createCollisionSystem, createTargetingSystem,
  createCombatSystem, createDamageSystem, createAISystem, createProjectileSystem,
  statusEffectSystem, createEnemyCollisionSystem, createEnemyCombatSystem,
  createEnemyProjectileSystem, createAbilitySystem,
  createTurretRotationSystem, createEnemyRotationSystem,
  CollisionSystem, CombatSystem, BeamVisual
} from '../systems';

import { bootstrapGame } from './bootstrap';
import { getServices, resetServices } from './services';
import { GameLoopManager } from './loop';
import { RenderManager, GameplayManager, UIController, InputRouter, InputAction } from './managers';
import { PoolManager } from '../ecs/PoolManager';
import { getWaveStoryText } from '../game/waveConfig';

// Query for counting turrets
const turretQuery = defineQuery([Turret]);

/**
 * Main game class - orchestrates all game systems.
 */
export class Game {
  public app!: Application;
  public world!: GameWorld;

  private containerId: string;
  private initialized: boolean = false;

  // Managers
  private loopManager!: GameLoopManager;
  private renderManager!: RenderManager;
  private gameplayManager!: GameplayManager;
  private uiController!: UIController;
  private inputRouter!: InputRouter;

  // Key Systems (stored for backward compatibility / access)
  private collisionSystem: CollisionSystem | undefined;
  private combatSystem: CombatSystem | undefined;

  // Resize handler
  private boundResizeHandler: (() => void) | null = null;

  constructor(containerId: string = 'app') {
    this.containerId = containerId;
  }

  /**
   * Initialize the game engine.
   */
  async init(): Promise<void> {
    if (this.initialized) return;

    // Bootstrap PixiJS and register all services
    const { app, world } = await bootstrapGame(this.containerId);
    this.app = app;
    this.world = world;

    // Initialize entity pools
    PoolManager.getInstance().init(this.world);

    // Create managers
    this.createManagers();

    // Register ECS systems
    this.registerSystems();

    // Setup game loop callbacks
    this.setupLoopCallbacks();

    // Setup resize handling
    this.setupResizeHandler();

    // Initialize gameplay
    this.gameplayManager.init();

    this.initialized = true;
    console.log('Kobayashi Maru initialized');
  }

  /**
   * Create all game managers.
   */
  private createManagers(): void {
    const services = getServices();

    // Game loop manager
    this.loopManager = new GameLoopManager(this.app);

    // Render manager
    this.renderManager = new RenderManager(this.world);
    this.renderManager.init();

    // Gameplay manager
    this.gameplayManager = new GameplayManager(this.world);
    this.gameplayManager.setCallbacks({
      onGameOver: (score, isHighScore) => {
        this.uiController.showGameOver(score, isHighScore, 0);
      },
      onWaveStart: (waveNumber, enemyCount) => {
        this.uiController.addLogMessage(`⚠ Wave ${waveNumber} started!`, 'wave');
        // Display story text for the wave
        const storyText = getWaveStoryText(waveNumber);
        if (storyText) {
          this.uiController.addLogMessage(storyText, 'info');
        }
        if (enemyCount > 0) {
          this.uiController.addLogMessage(`${enemyCount} enemies incoming`, 'warning');
        }
      },
      onWaveComplete: (waveNumber) => {
        this.uiController.addLogMessage(`✓ Wave ${waveNumber} complete!`, 'wave');
      },
      onEnemyKilled: () => {
        // Kill logging removed intentionally - was too spammy
      },
      onKobayashiMaruDamaged: () => {
        this.renderManager.shake(5, 0.3);
      },
    });

    // UI controller
    this.uiController = new UIController(this.app);
    this.uiController.setCallbacks({
      onRestart: () => this.restart(),
      onResume: () => this.resume(),
      onQuit: () => console.log('Quit to main menu (not yet implemented)'),
      onTurretSelect: (type) => {
        services.get('placementManager').startPlacing(type);
      },
      onToggleGodMode: () => this.toggleGodMode(),
      onToggleSlowMode: () => this.toggleSlowMode(),
    });
    this.uiController.init();

    // Connect turret upgrade callbacks
    this.uiController.connectTurretUpgradeCallbacks(
      (upgradePath) => {
        const turretId = this.inputRouter.getSelectedTurretId();
        if (turretId !== -1) {
          const result = services.get('upgradeManager').applyUpgrade(turretId, upgradePath);
          if (result.success) {
            this.uiController.showTurretUpgradePanel(turretId);
          }
        }
      },
      () => {
        const turretId = this.inputRouter.getSelectedTurretId();
        if (turretId !== -1) {
          const refund = services.get('upgradeManager').sellTurret(turretId);
          if (refund > 0) {
            // Remove turret entity handled by upgrade manager
            this.inputRouter.deselectTurret();
          }
        }
      }
    );

    // Input router
    this.inputRouter = new InputRouter(this.app, this.world);
    this.inputRouter.setStateCheckers({
      isPlaying: () => services.get('gameState').isPlaying(),
      isPaused: () => services.get('gameState').isPaused(),
      isGameOver: () => services.get('gameState').isGameOver(),
      isPlacingTurret: () => services.get('placementManager').isPlacing(),
    });
    this.setupInputHandlers();
    this.inputRouter.init();
  }

  /**
   * Register ECS systems with SystemManager.
   */
  private registerSystems(): void {
    const services = getServices();
    const systemManager = services.get('systemManager');
    const spatialHash = services.get('spatialHash');
    const particleSystem = services.get('particleSystem');
    const spriteManager = services.get('spriteManager');
    const audioManager = services.get('audioManager');

    // Create systems
    const renderSystem = createRenderSystem(spriteManager);
    const movementSystem = createMovementSystem(() => this.gameplayManager.getSpeedMultiplier());
    const collisionSystem = createCollisionSystem(spatialHash);
    const targetingSystem = createTargetingSystem(spatialHash);
    const combatSystem = createCombatSystem(particleSystem);
    const damageSystem = createDamageSystem(particleSystem, spriteManager);
    const aiSystem = createAISystem();
    const abilitySystem = createAbilitySystem(particleSystem, spriteManager, audioManager, spatialHash);
    const projectileSystem = createProjectileSystem(spatialHash);
    const enemyCollisionSystem = createEnemyCollisionSystem(
      particleSystem,
      () => this.gameplayManager.getKobayashiMaruId()
    );
    const enemyCombatSystem = createEnemyCombatSystem(
      () => this.gameplayManager.getKobayashiMaruId()
    );
    const enemyProjectileSystem = createEnemyProjectileSystem(
      spatialHash,
      () => this.gameplayManager.getKobayashiMaruId()
    );
    const turretRotationSystem = createTurretRotationSystem();
    const enemyRotationSystem = createEnemyRotationSystem();

    // Store systems locally
    this.collisionSystem = collisionSystem;
    this.combatSystem = combatSystem;

    // Set render system on render manager
    this.renderManager.setRenderSystem(renderSystem);

    // Register systems in execution order
    systemManager.register('collision', collisionSystem, 10, { requiresDelta: false });
    systemManager.register('ai', aiSystem, 20, { requiresGameTime: true });
    systemManager.register('ability', abilitySystem, 25);
    systemManager.register('movement', movementSystem, 30);
    systemManager.register('turret-rotation', turretRotationSystem, 31);
    systemManager.register('enemy-rotation', enemyRotationSystem, 32);
    systemManager.register('status-effects', statusEffectSystem, 35);
    systemManager.register('enemy-collision', enemyCollisionSystem, 38, { requiresDelta: false });
    systemManager.register('targeting', targetingSystem, 40, { requiresDelta: false });
    systemManager.register('combat', combatSystem, 50, { requiresGameTime: true });
    systemManager.register('enemy-combat', enemyCombatSystem, 55, { requiresGameTime: true });
    systemManager.register('projectile', projectileSystem, 60);
    systemManager.register('enemy-projectile', enemyProjectileSystem, 62);
    systemManager.register('damage', damageSystem, 70, { requiresDelta: false });
  }

  /**
   * Setup game loop callbacks.
   */
  private setupLoopCallbacks(): void {
    const services = getServices();

    // Pre-update: background
    this.loopManager.onPreUpdate((dt) => {
      this.renderManager.updateBackground(dt);
    });

    // Gameplay: game logic
    this.loopManager.onGameplay((dt) => {
      this.gameplayManager.update(dt);
    });

    // Physics: ECS systems
    this.loopManager.onPhysics((dt, gameTime) => {
      services.get('systemManager').run(this.world, dt, gameTime);
    });

    // Render: visual updates
    this.loopManager.onRender((dt) => {
      this.renderManager.updateEffects(dt);

      const activeBeams = this.combatSystem?.getActiveBeams() ?? [];
      this.renderManager.render(activeBeams as BeamVisual[]);
    });

    // Post-render: screen effects
    this.loopManager.onPostRender((dt) => {
      this.renderManager.applyPostEffects(dt);
    });

    // UI: HUD and debug
    this.loopManager.onUI(() => {
      const snapshot = this.gameplayManager.getSnapshot();
      const turretCount = turretQuery(this.world).length;

      this.uiController.updateHUD(snapshot, this.combatSystem, turretCount);
      this.uiController.updateDebug(snapshot);
      this.uiController.updateEntityCount();
    });
  }

  /**
   * Setup input action handlers.
   */
  private setupInputHandlers(): void {
    const services = getServices();

    this.inputRouter.on(InputAction.PAUSE, () => this.pause());
    this.inputRouter.on(InputAction.RESUME, () => this.resume());
    this.inputRouter.on(InputAction.RESTART, () => this.restart());
    this.inputRouter.on(InputAction.QUIT, () => console.log('Quit not implemented'));

    this.inputRouter.on(InputAction.SELECT_TURRET, ({ data }) => {
      if (data?.turretId !== undefined) {
        this.uiController.showTurretUpgradePanel(data.turretId);
      }
    });

    this.inputRouter.on(InputAction.DESELECT_TURRET, () => {
      this.uiController.hideTurretUpgradePanel();
    });

    this.inputRouter.on(InputAction.PLACE_TURRET, ({ data }) => {
      if (data?.worldX !== undefined && data?.worldY !== undefined) {
        services.get('placementManager').placeTurret(data.worldX, data.worldY);
      }
    });

    this.inputRouter.on(InputAction.CANCEL_PLACEMENT, () => {
      services.get('placementManager').cancelPlacement();
    });

    this.inputRouter.on(InputAction.TOGGLE_GOD_MODE, () => {
      this.gameplayManager.toggleGodMode();
    });

    this.inputRouter.on(InputAction.TOGGLE_SLOW_MODE, () => {
      this.gameplayManager.toggleSlowMode();
    });
  }

  /**
   * Setup window resize handler.
   */
  private setupResizeHandler(): void {
    this.boundResizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundResizeHandler);
    this.handleResize();
  }

  /**
   * Handle window resize.
   */
  private handleResize(): void {
    const { innerWidth, innerHeight } = window;
    const WORLD_WIDTH = 1920;
    const WORLD_HEIGHT = 1080;
    const aspectRatio = WORLD_WIDTH / WORLD_HEIGHT;

    let width = innerWidth;
    let height = innerWidth / aspectRatio;

    if (height > innerHeight) {
      height = innerHeight;
      width = innerHeight * aspectRatio;
    }

    this.app.renderer.resize(width, height);
    this.app.stage.scale.set(width / WORLD_WIDTH, height / WORLD_HEIGHT);
  }

  // ==========================================================================
  // PUBLIC API (Backward Compatible)
  // ==========================================================================

  /**
   * Start the game loop.
   */
  start(): void {
    if (!this.initialized) {
      throw new Error('Game not initialized. Call init() first.');
    }
    this.loopManager.start();
    console.log('Game loop started');
  }

  /**
   * Pause the game.
   */
  pause(): void {
    this.gameplayManager.pause();
    this.loopManager.pause();
    this.uiController.showPause();
  }

  /**
   * Resume the game.
   */
  resume(): void {
    this.gameplayManager.resume();
    this.loopManager.resume();
    this.uiController.hidePause();
  }

  /**
   * Restart the game.
   */
  restart(): void {
    this.uiController.hideGameOver();
    this.gameplayManager.restart();
    PoolManager.getInstance().clear();
    this.inputRouter.deselectTurret();
  }

  /**
   * Check if game is paused.
   */
  isPaused(): boolean {
    return this.loopManager.isPaused();
  }

  // Cheat mode methods (delegate to gameplay manager)
  setGodMode(enabled: boolean): void {
    if (enabled) {
      if (!this.isGodModeEnabled()) this.gameplayManager.toggleGodMode();
    } else {
      if (this.isGodModeEnabled()) this.gameplayManager.toggleGodMode();
    }
  }

  toggleGodMode(): boolean {
    return this.gameplayManager.toggleGodMode();
  }

  isGodModeEnabled(): boolean {
    return this.gameplayManager.isGodModeEnabled();
  }

  setSlowMode(enabled: boolean): void {
    if (enabled) {
      if (!this.isSlowModeEnabled()) this.gameplayManager.toggleSlowMode();
    } else {
      if (this.isSlowModeEnabled()) this.gameplayManager.toggleSlowMode();
    }
  }

  toggleSlowMode(): boolean {
    return this.gameplayManager.toggleSlowMode();
  }

  isSlowModeEnabled(): boolean {
    return this.gameplayManager.isSlowModeEnabled();
  }

  getSpeedMultiplier(): number {
    return this.gameplayManager.getSpeedMultiplier();
  }

  // Getter methods (delegate to services)
  getCollisionSystem() { return this.collisionSystem || null; }
  getSpatialHash() { return getServices().tryGet('spatialHash'); }
  getWaveManager() { return getServices().get('waveManager'); }
  getGameState() { return getServices().get('gameState'); }
  getScoreManager() { return getServices().get('scoreManager'); }
  getHighScoreManager() { return getServices().get('highScoreManager'); }
  getResourceManager() { return getServices().get('resourceManager'); }
  getPlacementManager() { return getServices().tryGet('placementManager'); }
  getCombatSystem() { return this.combatSystem || null; }
  getDamageSystem() { return null; } // TODO: Store reference if needed
  getPerformanceMonitor() { return getServices().get('performanceMonitor'); }
  getQualityManager() { return getServices().get('qualityManager'); }
  getSystemManager() { return getServices().get('systemManager'); }
  getHapticManager() { return getServices().get('hapticManager'); }
  getInputManager() { return getServices().get('inputManager'); }

  /**
   * Clean up resources.
   */
  destroy(): void {
    if (this.boundResizeHandler) {
      window.removeEventListener('resize', this.boundResizeHandler);
    }

    this.inputRouter.destroy();
    this.uiController.destroy();
    this.gameplayManager.destroy();
    this.renderManager.destroy();
    this.loopManager.destroy();
    PoolManager.getInstance().destroy();

    resetServices();
    this.app.destroy(true);
    this.initialized = false;
  }
}
