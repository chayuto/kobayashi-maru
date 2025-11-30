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
import { SpriteManager, BeamRenderer } from '../rendering';
import { createRenderSystem, createMovementSystem, createCollisionSystem, CollisionSystem, createTargetingSystem, createCombatSystem, createDamageSystem, TargetingSystem, CombatSystem, DamageSystem } from '../systems';
import { GAME_CONFIG, LCARS_COLORS } from '../types';
import { SpatialHash } from '../collision';

import { Starfield } from '../rendering/Starfield';

import { DebugManager } from './DebugManager';
import { WaveManager, GameState, GameStateType, ScoreManager, HighScoreManager, ResourceManager, PlacementSystem } from '../game';
import { HUDManager, GameOverScreen, calculateScore } from '../ui';

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
  private spatialHash: SpatialHash | null = null;
  private debugManager: DebugManager | null = null;
  private hudManager: HUDManager | null = null;
  private starfield: Starfield | null = null;
  private beamRenderer: BeamRenderer | null = null;
  private waveManager: WaveManager;
  private gameState: GameState;
  private scoreManager: ScoreManager;
  private highScoreManager: HighScoreManager;
  private resourceManager: ResourceManager;
  private placementSystem: PlacementSystem | null = null;
  private gameOverScreen: GameOverScreen | null = null;
  private kobayashiMaruId: number = -1;
  private initialized: boolean = false;
  private gameTime: number = 0; // Total game time in seconds

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
    this.waveManager = new WaveManager();
    this.gameState = new GameState();
    this.scoreManager = new ScoreManager();
    this.highScoreManager = new HighScoreManager();
    this.resourceManager = new ResourceManager();
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

    // Handle window resize
    window.addEventListener('resize', this.handleResize.bind(this));
    this.handleResize();

    this.initialized = true;
    console.log('Kobayashi Maru initialized');
    console.log(`Renderer: ${this.app.renderer.name}`);

    // Initialize starfield
    if (this.starfield) {
      this.starfield.init();
    }

    // Initialize sprite manager after app is ready
    this.spriteManager.init();

    // Initialize beam renderer
    this.beamRenderer = new BeamRenderer(this.app);
    this.beamRenderer.init();

    // Create the render system with the sprite manager
    this.renderSystem = createRenderSystem(this.spriteManager);

    // Create the movement system
    this.movementSystem = createMovementSystem();

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
    this.combatSystem = createCombatSystem();

    // Initialize damage system
    this.damageSystem = createDamageSystem();

    // Initialize placement system
    this.placementSystem = new PlacementSystem(this.app, this.world, this.resourceManager);

    // Initialize HUD manager
    if (this.hudManager) {
      this.hudManager.init(this.app);

      // Connect Turret Menu to Placement System
      const turretMenu = this.hudManager.getTurretMenu();
      if (turretMenu && this.placementSystem) {
        turretMenu.onSelect((turretType) => {
          if (this.placementSystem) {
            this.placementSystem.startPlacing(turretType);
          }
        });
      }
    }

    // Initialize game over screen
    this.gameOverScreen = new GameOverScreen();
    this.gameOverScreen.init(this.app);
    this.gameOverScreen.setOnRestart(() => this.restart());

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
    console.log('Kobayashi Maru spawned at center');

    // Initialize wave manager
    this.waveManager.init(this.world);

    // Set up wave event listeners
    this.waveManager.on('waveStart', (event) => {
      console.log(`Wave ${event.waveNumber} started with ${event.data?.totalEnemies} enemies`);
    });

    this.waveManager.on('waveComplete', (event) => {
      console.log(`Wave ${event.waveNumber} complete!`);
      // Update score manager with wave reached
      this.scoreManager.setWaveReached(event.waveNumber);
    });

    // Set up enemy death callback to update wave manager and score
    if (this.damageSystem) {
      this.damageSystem.onEnemyDeath((entityId, factionId) => {
        // Remove enemy from wave manager tracking
        this.waveManager.removeEnemy(entityId);
        // Record kill in score manager
        this.scoreManager.addKill(factionId);
      });
    }

    // Start playing and wave 1
    this.gameState.setState(GameStateType.PLAYING);
    this.waveManager.startWave(1);
    console.log(`Total entity count: ${getEntityCount()}`);
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

      // Run the collision system first to update spatial hash (before other systems need it)
      if (this.collisionSystem) {
        this.collisionSystem.update(this.world);
      }

      // Run the movement system to update entity positions
      if (this.movementSystem) {
        this.movementSystem(this.world, deltaTime);
      }

      // Run targeting system to find targets for turrets
      if (this.targetingSystem) {
        this.targetingSystem(this.world);
      }

      // Run combat system to handle turret firing
      if (this.combatSystem) {
        this.combatSystem.update(this.world, deltaTime, this.gameTime);
      }

      // Run damage system to handle entity destruction
      if (this.damageSystem) {
        this.damageSystem.update(this.world);
      }

      // Check for game over (Kobayashi Maru destroyed)
      this.checkGameOver();
    }

    // Render system always runs to show current state
    if (this.renderSystem) {
      this.renderSystem(this.world);
    }

    // Render beam visuals
    if (this.beamRenderer && this.combatSystem) {
      this.beamRenderer.render(this.combatSystem.getActiveBeams());
    }

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
        turretCount: turretCount
      });
    }
  }

  /**
   * Checks if the Kobayashi Maru has been destroyed and triggers game over
   */
  private checkGameOver(): void {
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
    this.waveManager.reset();
    this.gameTime = 0;

    // Reset game state to MENU then PLAYING (to follow valid state transitions)
    this.gameState.reset();

    // Re-enable auto wave progression
    this.waveManager.setAutoStartNextWave(true);

    // Re-initialize gameplay (spawn new Kobayashi Maru and start wave 1)
    this.initializeGameplay();

    console.log('Game restarted');
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
    if (this.placementSystem) {
      this.placementSystem.destroy();
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
    this.spriteManager.destroy();
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
   * Get the placement system
   * @returns The placement system or null if not initialized
   */
  getPlacementSystem(): PlacementSystem | null {
    return this.placementSystem;
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
}
