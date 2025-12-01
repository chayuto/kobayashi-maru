/**
 * Core Game class for Kobayashi Maru
 * Initializes PixiJS with WebGPU preference and manages the game loop
 */
import { Application } from 'pixi.js';
import { defineQuery, removeEntity } from 'bitecs';
import {
  createGameWorld,
  GameWorld,
  getEntityCount,
  createKobayashiMaru,
  decrementEntityCount
} from '../ecs';
import { Health, Shield, Turret, Position, Faction, SpriteRef } from '../ecs/components';
import { SpriteManager, BeamRenderer, ParticleSystem, HealthBarRenderer, ScreenShake, PlacementRenderer } from '../rendering';
import { createRenderSystem, createMovementSystem, createCollisionSystem, CollisionSystem, createTargetingSystem, createCombatSystem, createDamageSystem, createAISystem, createProjectileSystem, statusEffectSystem, TargetingSystem, CombatSystem, DamageSystem, SystemManager, createEnemyCollisionSystem, EnemyCollisionSystem } from '../systems';

import { GAME_CONFIG, LCARS_COLORS, GameEventType, EnemyKilledPayload, WaveStartedPayload, WaveCompletedPayload } from '../types';
import { SpatialHash } from '../collision';

import { Starfield } from '../rendering/Starfield';

import { DebugManager } from './DebugManager';
import { TouchInputManager } from './TouchInputManager';
import { InputManager } from './InputManager';
import { PerformanceMonitor } from './PerformanceMonitor';
import { QualityManager } from './QualityManager';
import { HapticManager } from './HapticManager';
import { EventBus } from './EventBus';
import { WaveManager, GameState, GameStateType, ScoreManager, HighScoreManager, ResourceManager, PlacementManager } from '../game';
import { HUDManager, GameOverScreen, calculateScore, PauseOverlay } from '../ui';
import { AudioManager } from '../audio';

// Query for counting turrets
const turretQuery = defineQuery([Turret]);

// Query for all entities (for cleanup during restart)
const allEntitiesQuery = defineQuery([Position, Faction, SpriteRef]);

export class Game {
  public app: Application;
  public world: GameWorld;
  private container: HTMLElement;
  private spriteManager: SpriteManager;
  private renderSystem: ReturnType<typeof createRenderSystem> | null = null;
  private movementSystem: ReturnType<typeof createMovementSystem> | null = null;
  private collisionSystem: CollisionSystem | null = null;
  private targetingSystem: TargetingSystem | null = null;
  private combatSystem: CombatSystem | null = null;
  private damageSystem: DamageSystem | null = null;
  private projectileSystem: ReturnType<typeof createProjectileSystem> | null = null;
  private aiSystem: ReturnType<typeof createAISystem> | null = null;
  private enemyCollisionSystem: EnemyCollisionSystem | null = null;
  private systemManager: SystemManager;
  private spatialHash: SpatialHash | null = null;
  private debugManager: DebugManager | null = null;
  private touchInputManager: TouchInputManager | null = null;
  private inputManager: InputManager;
  private hudManager: HUDManager | null = null;
  private starfield: Starfield | null = null;
  private beamRenderer: BeamRenderer | null = null;
  private particleSystem: ParticleSystem | null = null;
  private healthBarRenderer: HealthBarRenderer | null = null;
  private screenShake: ScreenShake | null = null;
  private performanceMonitor: PerformanceMonitor;
  private qualityManager: QualityManager;
  private hapticManager: HapticManager;
  private waveManager: WaveManager;
  private gameState: GameState;
  private scoreManager: ScoreManager;
  private highScoreManager: HighScoreManager;
  private resourceManager: ResourceManager;
  private audioManager: AudioManager;
  private eventBus: EventBus;
  private placementManager: PlacementManager | null = null;
  private placementRenderer: PlacementRenderer | null = null;
  private gameOverScreen: GameOverScreen | null = null;
  private pauseOverlay: PauseOverlay | null = null;
  private kobayashiMaruId: number = -1;
  private initialized: boolean = false;
  private gameTime: number = 0; // Total game time in seconds
  private previousKMHealth: number = 0;
  // Bound event handlers for cleanup
  private boundHandleEnemyKilled: (payload: EnemyKilledPayload) => void;
  private boundHandleWaveStarted: (payload: WaveStartedPayload) => void;
  private boundHandleWaveCompleted: (payload: WaveCompletedPayload) => void;
  private boundHandleKeyDown: (e: KeyboardEvent) => void;
  private killCount: number = 0;
  // God mode and slow mode settings
  private godModeEnabled: boolean = false;
  private slowModeEnabled: boolean = false;

  constructor(containerId: string = 'app') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = container;
    this.app = new Application();
    this.world = createGameWorld();
    this.spriteManager = new SpriteManager(this.app);
    this.debugManager = new DebugManager();
    this.hudManager = new HUDManager();
    this.starfield = new Starfield(this.app);
    this.performanceMonitor = new PerformanceMonitor();
    this.qualityManager = new QualityManager(this.performanceMonitor);
    this.hapticManager = new HapticManager();
    this.waveManager = new WaveManager();
    this.gameState = new GameState();
    this.scoreManager = new ScoreManager();
    this.highScoreManager = new HighScoreManager();
    this.resourceManager = new ResourceManager();
    this.audioManager = AudioManager.getInstance();
    this.eventBus = EventBus.getInstance();
    this.systemManager = new SystemManager();
    this.inputManager = new InputManager();

    // Bind event handlers
    this.boundHandleEnemyKilled = this.handleEnemyKilled.bind(this);
    this.boundHandleWaveStarted = this.handleWaveStarted.bind(this);
    this.boundHandleWaveCompleted = this.handleWaveCompleted.bind(this);
    this.boundHandleKeyDown = this.handleKeyDown.bind(this);
  }

  /**
   * Initialize the game engine
   */
  async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize PixiJS Application with WebGPU preference
    await this.app.init({
      width: GAME_CONFIG.WORLD_WIDTH,
      height: GAME_CONFIG.WORLD_HEIGHT,
      backgroundColor: LCARS_COLORS.BACKGROUND,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      preference: 'webgpu', // Prefer WebGPU for performance
      antialias: true
    });

    // Add canvas to DOM
    this.container.appendChild(this.app.canvas);

    // Initialize touch input manager
    this.touchInputManager = new TouchInputManager(this.app);
    this.touchInputManager.init();

    // Initialize input manager
    this.inputManager.init(this.app.canvas);

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();

    // Initialize audio on first user interaction
    const initAudio = () => {
      this.audioManager.init();
      this.audioManager.resume();
      window.removeEventListener('click', initAudio);
      window.removeEventListener('keydown', initAudio);
      window.removeEventListener('touchstart', initAudio);
    };

    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);

    this.initialized = true;
    console.log('Kobayashi Maru initialized');
    console.log(`Renderer: ${this.app.renderer.name}`);

    // Initialize starfield
    if (this.starfield) {
      const settings = this.qualityManager.getSettings();
      // Calculate multiplier based on default (1000 stars)
      // High: 1000 -> 1.0, Medium: 500 -> 0.5, Low: 200 -> 0.2
      const multiplier = settings.starCount / 1000;
      this.starfield.init(multiplier);
    }

    // Initialize sprite manager after app is ready
    this.spriteManager.init();

    // Initialize beam renderer
    this.beamRenderer = new BeamRenderer(this.app);
    this.beamRenderer.init();

    // Initialize particle system
    this.particleSystem = new ParticleSystem();
    const particleSettings = this.qualityManager.getSettings();
    this.particleSystem.init(this.app, particleSettings.maxParticles, particleSettings.particleSpawnRate);

    // Initialize health bar renderer
    this.healthBarRenderer = new HealthBarRenderer();
    this.healthBarRenderer.init(this.app);

    // Initialize screen shake
    this.screenShake = new ScreenShake();

    // Create the render system with the sprite manager
    this.renderSystem = createRenderSystem(this.spriteManager);

    // Create the movement system with speed multiplier support for slow mode
    this.movementSystem = createMovementSystem(() => this.getSpeedMultiplier());

    // Initialize spatial hash for collision detection
    this.spatialHash = new SpatialHash(
      GAME_CONFIG.COLLISION_CELL_SIZE,
      GAME_CONFIG.WORLD_WIDTH,
      GAME_CONFIG.WORLD_HEIGHT
    );
    this.collisionSystem = createCollisionSystem(this.spatialHash);

    // Initialize targeting system
    this.targetingSystem = createTargetingSystem(this.spatialHash);

    // Initialize combat system
    this.combatSystem = createCombatSystem(this.particleSystem);

    // Initialize damage system
    this.damageSystem = createDamageSystem(this.particleSystem);

    // Initialize AI system
    this.aiSystem = createAISystem();

    // Initialize projectile system
    this.projectileSystem = createProjectileSystem(this.spatialHash);

    // Initialize enemy collision system
    this.enemyCollisionSystem = createEnemyCollisionSystem(
      this.particleSystem,
      () => this.kobayashiMaruId
    );

    // Register systems with SystemManager in execution order
    // Lower priority numbers run first
    this.systemManager.register('collision', this.collisionSystem, 10, { requiresDelta: false });
    this.systemManager.register('ai', this.aiSystem, 20, { requiresGameTime: true });
    this.systemManager.register('movement', this.movementSystem, 30);
    this.systemManager.register('status-effects', statusEffectSystem, 35); // Process status effects after movement
    this.systemManager.register('enemy-collision', this.enemyCollisionSystem, 38, { requiresDelta: false }); // Check enemy collisions after movement
    this.systemManager.register('targeting', this.targetingSystem, 40, { requiresDelta: false });
    this.systemManager.register('combat', this.combatSystem, 50, { requiresGameTime: true });
    this.systemManager.register('projectile', this.projectileSystem, 60);
    this.systemManager.register('damage', this.damageSystem, 70, { requiresDelta: false });

    // Initialize placement manager (pure logic)
    this.placementManager = new PlacementManager(this.world, this.resourceManager);

    // Initialize placement renderer (visual feedback)
    this.placementRenderer = new PlacementRenderer(this.app, this.placementManager);

    // Initialize HUD manager
    if (this.hudManager) {
      this.hudManager.init(this.app, this);

      // Connect Turret Menu to Placement Manager
      const turretMenu = this.hudManager.getTurretMenu();
      if (turretMenu && this.placementManager) {
        turretMenu.onSelect((turretType) => {
          if (this.placementManager) {
            this.placementManager.startPlacing(turretType);
          }
        });
      }
    }

    // Initialize game over screen
    this.gameOverScreen = new GameOverScreen();
    this.gameOverScreen.init(this.app);
    this.gameOverScreen.setOnRestart(() => this.restart());

    // Initialize pause overlay
    this.pauseOverlay = new PauseOverlay();
    this.pauseOverlay.init(this.app);
    this.pauseOverlay.setOnResume(() => this.resume());
    this.pauseOverlay.setOnRestart(() => {
      this.resume();
      this.restart();
    });
    this.pauseOverlay.setOnQuit(() => {
      this.resume();
      // TODO: Return to main menu when implemented
      console.log('Quit to main menu (not yet implemented)');
    });

    // Add keyboard listener for pause
    window.addEventListener('keydown', this.boundHandleKeyDown);

    // Initialize wave manager and spawn Kobayashi Maru
    this.initializeGameplay();
  }

  /**
   * Initializes gameplay elements (Kobayashi Maru and wave system)
   */
  private initializeGameplay(): void {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

    // Spawn Kobayashi Maru at center and store its ID for health monitoring
    this.kobayashiMaruId = createKobayashiMaru(this.world, centerX, centerY);
    this.previousKMHealth = Health.max[this.kobayashiMaruId];
    console.log('Kobayashi Maru spawned at center');

    // Initialize wave manager
    this.waveManager.init(this.world);

    // Subscribe to EventBus for enemy kills
    // This handles: wave manager tracking, score manager kills, and resource rewards
    // Note: ScoreManager now automatically subscribes to ENEMY_KILLED via EventBus
    this.eventBus.on(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
    this.eventBus.on(GameEventType.WAVE_STARTED, this.boundHandleWaveStarted);
    this.eventBus.on(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);

    // Start playing and wave 1
    this.gameState.setState(GameStateType.PLAYING);
    this.waveManager.startWave(1);
    console.log(`Total entity count: ${getEntityCount()}`);
  }

  /**
   * Handle ENEMY_KILLED event from EventBus
   * Updates wave manager tracking and awards resources
   */
  private handleEnemyKilled(payload: EnemyKilledPayload): void {
    // Remove enemy from wave manager tracking
    this.waveManager.removeEnemy(payload.entityId);
    // Award resources (ScoreManager handles kill counting via its own EventBus subscription)
    this.resourceManager.addResources(GAME_CONFIG.RESOURCE_REWARD);
    // Add message to log
    this.killCount++;
    if (this.hudManager) {
      this.hudManager.addLogMessage(`Enemy destroyed (+${GAME_CONFIG.RESOURCE_REWARD} matter)`, 'kill');
    }
  }

  /**
   * Handle WAVE_STARTED event from EventBus
   * Displays wave start message in the log
   */
  private handleWaveStarted(payload: WaveStartedPayload): void {
    if (this.hudManager) {
      this.hudManager.addLogMessage(`⚠ Wave ${payload.waveNumber} started!`, 'wave');
      if (payload.totalEnemies) {
        this.hudManager.addLogMessage(`${payload.totalEnemies} enemies incoming`, 'warning');
      }
    }
  }

  /**
   * Handle WAVE_COMPLETED event from EventBus
   * Displays wave completion message in the log
   */
  private handleWaveCompleted(payload: WaveCompletedPayload): void {
    if (this.hudManager) {
      this.hudManager.addLogMessage(`✓ Wave ${payload.waveNumber} complete!`, 'wave');
    }
  }

  /**
   * Handle keyboard input for pause and other shortcuts
   */
  private handleKeyDown(e: KeyboardEvent): void {
    // ESC key - Toggle pause
    if (e.key === 'Escape') {
      if (this.gameState.isPlaying()) {
        this.pause();
      } else if (this.gameState.isPaused()) {
        this.resume();
      }
    }

    // R key - Restart (when paused)
    if (e.key === 'r' || e.key === 'R') {
      if (this.gameState.isPaused()) {
        this.resume();
        this.restart();
      }
    }

    // Q key - Quit (when paused)
    if (e.key === 'q' || e.key === 'Q') {
      if (this.gameState.isPaused()) {
        this.resume();
        // TODO: Return to main menu when implemented
        console.log('Quit to main menu (not yet implemented)');
      }
    }
  }

  /**
   * Handle window resize to maintain aspect ratio
   */
  private handleResize(): void {
    const { innerWidth, innerHeight } = window;
    const aspectRatio = GAME_CONFIG.WORLD_WIDTH / GAME_CONFIG.WORLD_HEIGHT;

    let width = innerWidth;
    let height = innerWidth / aspectRatio;

    if (height > innerHeight) {
      height = innerHeight;
      width = innerHeight * aspectRatio;
    }

    this.app.renderer.resize(width, height);
    this.app.stage.scale.set(
      width / GAME_CONFIG.WORLD_WIDTH,
      height / GAME_CONFIG.WORLD_HEIGHT
    );
  }

  /**
   * Start the game loop
   */
  start(): void {
    if (!this.initialized) {
      throw new Error('Game not initialized. Call init() first.');
    }

    this.app.ticker.add(this.update.bind(this));
    console.log('Game loop started');
  }

  /**
   * Main update loop
   */
  private update(): void {
    // Start frame timing
    this.performanceMonitor.startFrame();

    // Convert PixiJS ticker delta (in milliseconds) to seconds for frame-independent movement
    const deltaTime = this.app.ticker.deltaMS / 1000;

    // Update starfield (always runs regardless of game state)
    if (this.starfield) {
      // Scroll slowly downwards
      this.starfield.update(deltaTime, 0, 50);
    }

    // Only run gameplay systems when playing
    if (this.gameState.isPlaying()) {
      // Update game time
      this.gameTime += deltaTime;

      // Update score manager time
      this.scoreManager.update(deltaTime);

      // Update wave manager to handle spawning
      this.waveManager.update(deltaTime);

      // Run all gameplay systems via SystemManager
      // Systems run in priority order: collision, ai, movement, targeting, combat, projectile, damage
      this.performanceMonitor.startMeasure('systems');
      this.systemManager.run(this.world, deltaTime, this.gameTime);
      this.performanceMonitor.endMeasure('systems');

      // Check for game over (Kobayashi Maru destroyed)
      this.checkGameOver();

      // Check for damage to Kobayashi Maru for screen shake
      if (this.kobayashiMaruId !== -1 && this.screenShake) {
        const currentHealth = Health.current[this.kobayashiMaruId];
        if (currentHealth < this.previousKMHealth) {
          // Trigger screen shake
          this.screenShake.shake(5, 0.3);
          this.previousKMHealth = currentHealth;
        }
        // Update previous health if it increased (healing)
        if (currentHealth > this.previousKMHealth) {
          this.previousKMHealth = currentHealth;
        }
      }
    }

    // Render system always runs to show current state
    this.performanceMonitor.startRender();
    if (this.renderSystem) {
      this.renderSystem(this.world);
    }

    // Render beam visuals
    if (this.beamRenderer && this.combatSystem) {
      this.beamRenderer.render(this.combatSystem.getActiveBeams());
    }

    // Update particle system
    if (this.particleSystem) {
      this.particleSystem.update(deltaTime);
    }

    // Update health bar renderer
    if (this.healthBarRenderer) {
      this.healthBarRenderer.update(this.world);
    }
    this.performanceMonitor.endRender();

    // Update screen shake
    if (this.screenShake) {
      const { offsetX, offsetY } = this.screenShake.update(deltaTime);
      // Apply shake to stage position (reset to 0,0 first if needed, but stage usually stays at 0,0)
      // We need to be careful not to accumulate offsets if we don't reset.
      // Since we are setting scale in resize, we should probably add a container for game content if we want to shake everything.
      // Or just set position.
      this.app.stage.position.set(offsetX, offsetY);
    }

    // Update performance monitor entity count
    this.performanceMonitor.setEntityCount(getEntityCount());

    // Update debug overlay
    if (this.debugManager) {
      this.debugManager.update(this.app.ticker.deltaMS);
      this.debugManager.updateEntityCount(getEntityCount());

      // Update game stats
      this.debugManager.updateGameStats({
        gameState: this.gameState.getState(),
        waveNumber: this.waveManager.getCurrentWave(),
        waveState: this.waveManager.getState(),
        timeSurvived: this.scoreManager.getTimeSurvived(),
        enemiesDefeated: this.scoreManager.getEnemiesDefeated(),
        activeEnemies: this.waveManager.getActiveEnemyCount(),
        resources: this.resourceManager.getResources()
      });

      // Update performance stats
      this.debugManager.updatePerformanceStats(this.performanceMonitor.getMetrics());
    }

    // Update HUD
    if (this.hudManager) {
      // Get Kobayashi Maru status
      let kmHealth = 0, kmMaxHealth = 0, kmShield = 0, kmMaxShield = 0;
      if (this.kobayashiMaruId !== -1) {
        kmHealth = Health.current[this.kobayashiMaruId] ?? 0;
        kmMaxHealth = Health.max[this.kobayashiMaruId] ?? 0;
        kmShield = Shield.current[this.kobayashiMaruId] ?? 0;
        kmMaxShield = Shield.max[this.kobayashiMaruId] ?? 0;
      }

      // Get turret count
      const turretCount = turretQuery(this.world).length;

      // Get combat stats
      const combatStats = this.combatSystem?.getStats();

      this.hudManager.update({
        waveNumber: this.waveManager.getCurrentWave(),
        waveState: this.waveManager.getState(),
        activeEnemies: this.waveManager.getActiveEnemyCount(),
        resources: this.resourceManager.getResources(),
        timeSurvived: this.scoreManager.getTimeSurvived(),
        enemiesDefeated: this.scoreManager.getEnemiesDefeated(),
        kobayashiMaruHealth: kmHealth,
        kobayashiMaruMaxHealth: kmMaxHealth,
        kobayashiMaruShield: kmShield,
        kobayashiMaruMaxShield: kmMaxShield,
        turretCount: turretCount,
        // Extended stats
        totalDamageDealt: combatStats?.totalDamageDealt ?? 0,
        totalShotsFired: combatStats?.totalShotsFired ?? 0,
        accuracy: combatStats?.accuracy ?? 0,
        dps: combatStats?.dps ?? 0
      });
    }

    // End frame timing
    this.performanceMonitor.endFrame();
  }

  /**
   * Checks if the Kobayashi Maru has been destroyed and triggers game over
   */
  private checkGameOver(): void {
    // Skip game over check if god mode is enabled
    if (this.godModeEnabled) {
      return;
    }

    if (this.kobayashiMaruId === -1) {
      return;
    }

    const health = Health.current[this.kobayashiMaruId];
    if (health === undefined || health <= 0) {
      this.triggerGameOver();
    }
  }

  /**
   * Triggers the game over state
   */
  private triggerGameOver(): void {
    // Set game state to game over
    this.gameState.setState(GameStateType.GAME_OVER);

    // Stop wave spawning
    this.waveManager.setAutoStartNextWave(false);

    // Get previous high score before saving
    const previousHighScore = this.highScoreManager.getHighestScore();
    const previousBestScore = previousHighScore ? calculateScore(previousHighScore) : 0;

    // Save final score
    const finalScore = this.scoreManager.getScoreData();
    const saved = this.highScoreManager.saveScore(finalScore);

    console.log('Game Over!');
    console.log(`Time Survived: ${finalScore.timeSurvived.toFixed(2)}s`);
    console.log(`Wave Reached: ${finalScore.waveReached}`);
    console.log(`Enemies Defeated: ${finalScore.enemiesDefeated}`);
    if (saved) {
      console.log('New high score!');
    }

    // Show game over screen
    if (this.gameOverScreen) {
      this.gameOverScreen.show(finalScore, saved, previousBestScore);
    }
  }

  /**
   * Restart the game after game over
   */
  restart(): void {
    // Hide game over screen
    if (this.gameOverScreen) {
      this.gameOverScreen.hide();
    }

    // Clear all existing entities
    this.clearAllEntities();

    // Reset all managers
    this.scoreManager.reset();
    this.resourceManager.reset();
    this.killCount = 0;
    this.waveManager.reset();
    this.gameTime = 0;

    // Reset combat stats
    if (this.combatSystem) {
      this.combatSystem.resetStats();
    }

    // Reset game state to MENU then PLAYING (to follow valid state transitions)
    this.gameState.reset();

    // Re-enable auto wave progression
    this.waveManager.setAutoStartNextWave(true);

    // Re-initialize gameplay (spawn new Kobayashi Maru and start wave 1)
    this.initializeGameplay();

    console.log('Game restarted');
  }

  /**
   * Pause the game
   */
  pause(): void {
    if (!this.gameState.isPlaying()) {
      return;
    }

    this.gameState.setState(GameStateType.PAUSED);

    // Show pause overlay
    if (this.pauseOverlay) {
      this.pauseOverlay.show();
    }

    console.log('Game paused');
  }

  /**
   * Resume the game
   */
  resume(): void {
    if (!this.gameState.isPaused()) {
      return;
    }

    this.gameState.setState(GameStateType.PLAYING);

    // Hide pause overlay
    if (this.pauseOverlay) {
      this.pauseOverlay.hide();
    }

    console.log('Game resumed');
  }

  /**
   * Get pause state
   */
  isPaused(): boolean {
    return this.gameState.isPaused();
  }

  /**
   * Enable or disable god mode
   * @param enabled - Whether god mode should be enabled
   */
  setGodMode(enabled: boolean): void {
    this.godModeEnabled = enabled;
    console.log(`God mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle god mode on/off
   * @returns The new god mode state
   */
  toggleGodMode(): boolean {
    this.godModeEnabled = !this.godModeEnabled;
    console.log(`God mode ${this.godModeEnabled ? 'enabled' : 'disabled'}`);
    return this.godModeEnabled;
  }

  /**
   * Check if god mode is enabled
   * @returns Whether god mode is enabled
   */
  isGodModeEnabled(): boolean {
    return this.godModeEnabled;
  }

  /**
   * Enable or disable slow mode (half speed for all enemies)
   * @param enabled - Whether slow mode should be enabled
   */
  setSlowMode(enabled: boolean): void {
    this.slowModeEnabled = enabled;
    console.log(`Slow mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Toggle slow mode on/off
   * @returns The new slow mode state
   */
  toggleSlowMode(): boolean {
    this.slowModeEnabled = !this.slowModeEnabled;
    console.log(`Slow mode ${this.slowModeEnabled ? 'enabled' : 'disabled'}`);
    return this.slowModeEnabled;
  }

  /**
   * Check if slow mode is enabled
   * @returns Whether slow mode is enabled
   */
  isSlowModeEnabled(): boolean {
    return this.slowModeEnabled;
  }

  /**
   * Get the slow mode speed multiplier
   * @returns The speed multiplier (1.0 if slow mode disabled, 0.5 if enabled)
   */
  getSpeedMultiplier(): number {
    return this.slowModeEnabled ? GAME_CONFIG.SLOW_MODE_MULTIPLIER : 1.0;
  }

  /**
   * Clear all entities from the world for restart
   */
  private clearAllEntities(): void {
    const entities = allEntitiesQuery(this.world);

    for (const eid of entities) {
      removeEntity(this.world, eid);
      decrementEntityCount();
    }

    // Reset Kobayashi Maru tracking
    this.kobayashiMaruId = -1;

    // Run render system once to clean up sprites for removed entities
    if (this.renderSystem) {
      this.renderSystem(this.world);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    window.removeEventListener('keydown', this.boundHandleKeyDown);
    // Unsubscribe from EventBus
    this.eventBus.off(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
    this.eventBus.off(GameEventType.WAVE_STARTED, this.boundHandleWaveStarted);
    this.eventBus.off(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);
    this.scoreManager.unsubscribe();
    if (this.placementRenderer) {
      this.placementRenderer.destroy();
    }
    if (this.placementManager) {
      this.placementManager.destroy();
    }
    if (this.beamRenderer) {
      this.beamRenderer.destroy();
    }
    if (this.hudManager) {
      this.hudManager.destroy();
    }
    if (this.gameOverScreen) {
      this.gameOverScreen.destroy();
    }
    if (this.pauseOverlay) {
      this.pauseOverlay.destroy();
    }
    if (this.particleSystem) {
      this.particleSystem.destroy();
    }
    if (this.healthBarRenderer) {
      this.healthBarRenderer.destroy();
    }
    this.spriteManager.destroy();
    if (this.touchInputManager) {
      this.touchInputManager.destroy();
    }
    this.inputManager.destroy();
    this.app.destroy(true);
    this.initialized = false;
  }

  /**
   * Get the collision system for querying nearby entities
   * @returns The collision system or null if not initialized
   */
  getCollisionSystem(): CollisionSystem | null {
    return this.collisionSystem;
  }

  /**
   * Get the spatial hash for direct access
   * @returns The spatial hash or null if not initialized
   */
  getSpatialHash(): SpatialHash | null {
    return this.spatialHash;
  }

  /**
   * Get the wave manager for external control
   * @returns The wave manager instance
   */
  getWaveManager(): WaveManager {
    return this.waveManager;
  }

  /**
   * Get the game state manager
   * @returns The game state instance
   */
  getGameState(): GameState {
    return this.gameState;
  }

  /**
   * Get the score manager
   * @returns The score manager instance
   */
  getScoreManager(): ScoreManager {
    return this.scoreManager;
  }

  /**
   * Get the high score manager
   * @returns The high score manager instance
   */
  getHighScoreManager(): HighScoreManager {
    return this.highScoreManager;
  }

  /**
   * Records an enemy kill in the score manager
   * @param factionId - The faction ID of the defeated enemy
   */
  recordEnemyKill(factionId: number): void {
    this.scoreManager.addKill(factionId);
  }

  /**
   * Get the resource manager
   * @returns The resource manager instance
   */
  getResourceManager(): ResourceManager {
    return this.resourceManager;
  }

  /**
   * Get the placement manager
   * @returns The placement manager or null if not initialized
   */
  getPlacementManager(): PlacementManager | null {
    return this.placementManager;
  }

  /**
   * Get the combat system for access to beam visuals
   * @returns The combat system or null if not initialized
   */
  getCombatSystem(): CombatSystem | null {
    return this.combatSystem;
  }

  /**
   * Get the damage system
   * @returns The damage system or null if not initialized
   */
  getDamageSystem(): DamageSystem | null {
    return this.damageSystem;
  }

  /**
   * Get the performance monitor
   * @returns The performance monitor instance
   */
  getPerformanceMonitor(): PerformanceMonitor {
    return this.performanceMonitor;
  }

  /**
   * Get the quality manager
   * @returns The quality manager instance
   */
  getQualityManager(): QualityManager {
    return this.qualityManager;
  }

  /**
   * Get the system manager
   * @returns The system manager instance for managing ECS systems
   */
  getSystemManager(): SystemManager {
    return this.systemManager;
  }

  /**
   * Get the haptic manager
   * @returns The haptic manager instance
   */
  getHapticManager(): HapticManager {
    return this.hapticManager;
  }

  /**
   * Get the input manager
   * @returns The input manager instance
   */
  getInputManager(): InputManager {
    return this.inputManager;
  }
}
