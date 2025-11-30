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
import { SpriteManager, BeamRenderer, ParticleSystem, HealthBarRenderer, ScreenShake } from '../rendering';
import { createRenderSystem, createMovementSystem, createCollisionSystem, CollisionSystem, createTargetingSystem, createCombatSystem, createDamageSystem, createAISystem, createProjectileSystem, TargetingSystem, CombatSystem, DamageSystem } from '../systems';
import { GAME_CONFIG, LCARS_COLORS } from '../types';
import { SpatialHash } from '../collision';

import { Starfield } from '../rendering/Starfield';

import { DebugManager } from './DebugManager';
import { WaveManager, GameState, GameStateType, ScoreManager, HighScoreManager, ResourceManager, PlacementSystem } from '../game';
import { HUDManager, GameOverScreen, calculateScore } from '../ui';
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
  private spatialHash: SpatialHash | null = null;
  private debugManager: DebugManager | null = null;
  private hudManager: HUDManager | null = null;
  private starfield: Starfield | null = null;
  private beamRenderer: BeamRenderer | null = null;
  private particleSystem: ParticleSystem | null = null;
  private healthBarRenderer: HealthBarRenderer | null = null;
  private screenShake: ScreenShake | null = null;
  private waveManager: WaveManager;
  private gameState: GameState;
  private scoreManager: ScoreManager;
  private highScoreManager: HighScoreManager;
  private resourceManager: ResourceManager;
  private audioManager: AudioManager;
  private placementSystem: PlacementSystem | null = null;
  private gameOverScreen: GameOverScreen | null = null;
  private kobayashiMaruId: number = -1;
  private initialized: boolean = false;
  private gameTime: number = 0; // Total game time in seconds
  private previousKMHealth: number = 0;

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
    this.audioManager = AudioManager.getInstance();
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
      this.starfield.init();
    }

    // Initialize sprite manager after app is ready
    this.spriteManager.init();

    // Initialize beam renderer
    this.beamRenderer = new BeamRenderer(this.app);
    this.beamRenderer.init();

    // Initialize particle system
    this.particleSystem = new ParticleSystem();
    this.particleSystem.init(this.app);

    // Initialize health bar renderer
    this.healthBarRenderer = new HealthBarRenderer();
    this.healthBarRenderer.init(this.app);

    // Initialize screen shake
    this.screenShake = new ScreenShake();

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
    this.combatSystem = createCombatSystem(this.particleSystem);

    // Initialize damage system
    this.damageSystem = createDamageSystem(this.particleSystem);

    // Initialize AI system
    this.aiSystem = createAISystem();

    // Initialize projectile system
    this.projectileSystem = createProjectileSystem(this.spatialHash);

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
    this.previousKMHealth = Health.max[this.kobayashiMaruId];
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

      // Run AI system to update velocities based on behavior
      if (this.aiSystem) {
        this.aiSystem(this.world, deltaTime, this.gameTime);
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

      // Run projectile system to handle active projectiles
      if (this.projectileSystem) {
        this.projectileSystem(this.world, deltaTime);
      }

      // Run damage system to handle entity destruction
      if (this.damageSystem) {
        this.damageSystem.update(this.world);
      }

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

    // Update screen shake
    if (this.screenShake) {
      const { offsetX, offsetY } = this.screenShake.update(deltaTime);
      // Apply shake to stage position (reset to 0,0 first if needed, but stage usually stays at 0,0)
      // We need to be careful not to accumulate offsets if we don't reset.
      // Since we are setting scale in resize, we should probably add a container for game content if we want to shake everything.
      // Or just set position.
      this.app.stage.position.set(offsetX, offsetY);
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
    if (this.particleSystem) {
      this.particleSystem.destroy();
    }
    if (this.healthBarRenderer) {
      this.healthBarRenderer.destroy();
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
