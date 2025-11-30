/**
 * Core Game class for Kobayashi Maru
 * Initializes PixiJS with WebGPU preference and manages the game loop
 */
import { Application } from 'pixi.js';
import { 
  createGameWorld, 
  GameWorld, 
  getEntityCount,
  createKobayashiMaru,
  createKlingonShip,
  createRomulanShip,
  createBorgShip,
  createTholianShip,
  createSpecies8472Ship
} from '../ecs';
import { SpriteManager } from '../rendering';
import { createRenderSystem } from '../systems';
import { GAME_CONFIG, LCARS_COLORS } from '../types';

export class Game {
  public app: Application;
  public world: GameWorld;
  private container: HTMLElement;
  private spriteManager: SpriteManager;
  private renderSystem: ReturnType<typeof createRenderSystem> | null = null;
  private initialized: boolean = false;

  constructor(containerId: string = 'app') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = container;
    this.app = new Application();
    this.world = createGameWorld();
    this.spriteManager = new SpriteManager(this.app);
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
    
    // Initialize sprite manager after app is ready
    this.spriteManager.init();
    
    // Create the render system with the sprite manager
    this.renderSystem = createRenderSystem(this.spriteManager);
    
    // Spawn test entities
    this.spawnTestEntities();
  }

  /**
   * Spawns test entities on game initialization
   */
  private spawnTestEntities(): void {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
    
    // Spawn Kobayashi Maru at center
    createKobayashiMaru(this.world, centerX, centerY);
    console.log('Kobayashi Maru spawned at center');
    
    // Spawn 100 test enemies at random positions around the edges
    const enemyCreators = [
      createKlingonShip,
      createRomulanShip,
      createBorgShip,
      createTholianShip,
      createSpecies8472Ship
    ];
    
    const edgeMargin = 100;
    const width = GAME_CONFIG.WORLD_WIDTH;
    const height = GAME_CONFIG.WORLD_HEIGHT;
    
    for (let i = 0; i < 100; i++) {
      // Randomly select which edge to spawn on
      const edge = Math.floor(Math.random() * 4);
      let x: number, y: number;
      
      switch (edge) {
        case 0: // Top edge
          x = Math.random() * width;
          y = Math.random() * edgeMargin;
          break;
        case 1: // Right edge
          x = width - Math.random() * edgeMargin;
          y = Math.random() * height;
          break;
        case 2: // Bottom edge
          x = Math.random() * width;
          y = height - Math.random() * edgeMargin;
          break;
        case 3: // Left edge
        default:
          x = Math.random() * edgeMargin;
          y = Math.random() * height;
          break;
      }
      
      // Randomly select an enemy type
      const creatorIndex = Math.floor(Math.random() * enemyCreators.length);
      enemyCreators[creatorIndex](this.world, x, y);
    }
    
    console.log('100 test enemies spawned around edges');
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
    // Run the render system to sync sprites with ECS data
    if (this.renderSystem) {
      this.renderSystem(this.world);
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.spriteManager.destroy();
    this.app.destroy(true);
    this.initialized = false;
  }
}
