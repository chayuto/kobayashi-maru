/**
 * Core Game class for Kobayashi Maru
 * Initializes PixiJS with WebGPU preference and manages the game loop
 */
import { Application } from 'pixi.js';
import { createGameWorld, GameWorld } from '../ecs';
import { GAME_CONFIG, LCARS_COLORS } from '../types';

export class Game {
  public app: Application;
  public world: GameWorld;
  private container: HTMLElement;
  private initialized: boolean = false;

  constructor(containerId: string = 'app') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = container;
    this.app = new Application();
    this.world = createGameWorld();
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
    // Game update logic will be added here
    // This will include ECS system updates
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    window.removeEventListener('resize', this.handleResize.bind(this));
    this.app.destroy(true);
    this.initialized = false;
  }
}
