/**
 * Sprite Manager for Kobayashi Maru
 * Manages PixiJS ParticleContainer for high-performance rendering of 5,000+ entities at 60 FPS
 */
import { Application, Texture, ParticleContainer, Particle } from 'pixi.js';
import { SpriteType } from '../types/constants';
import { createFactionTextures, FactionTextures } from './textures';
import { RENDERING_CONFIG } from '../config';

// Maximum number of particles supported (from centralized config)
const MAX_PARTICLES = RENDERING_CONFIG.PARTICLES.MAX_COUNT;


/**
 * SpriteManager handles particle creation, updates, and removal using a ParticleContainer
 * for maximum performance with large numbers of entities
 */
export class SpriteManager {
  private app: Application;
  private textures: FactionTextures | null = null;
  private containers: Map<number, ParticleContainer> = new Map();
  private particles: Map<number, { particle: Particle; spriteType: number }> = new Map();
  private particlePool: Map<number, Particle[]> = new Map();
  private nextParticleIndex: number = 1; // Start at 1, 0 is reserved for "unset"
  private initialized: boolean = false;

  constructor(app: Application) {
    this.app = app;
  }

  /**
   * Initialize the sprite manager - must be called after PixiJS app is initialized
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    // Create faction textures
    this.textures = createFactionTextures(this.app);

    // Create a ParticleContainer for each sprite type to handle different textures
    this.createSpriteContainers();

    this.initialized = true;
    console.log('SpriteManager initialized with ParticleContainer');
  }

  /**
   * Create ParticleContainers for each sprite type
   */
  private createSpriteContainers(): void {
    if (!this.textures) return;

    const factionTextures: Array<[number, Texture]> = [
      [SpriteType.FEDERATION, this.textures.federation],
      [SpriteType.KOBAYASHI_MARU, this.textures.kobayashiMaru],
      [SpriteType.KLINGON, this.textures.klingon],
      [SpriteType.ROMULAN, this.textures.romulan],
      [SpriteType.BORG, this.textures.borg],
      [SpriteType.THOLIAN, this.textures.tholian],
      [SpriteType.SPECIES_8472, this.textures.species8472],
      [SpriteType.PROJECTILE, this.textures.projectile],
      [SpriteType.TURRET_PHASER, this.textures.turretPhaser],
      [SpriteType.TURRET_TORPEDO, this.textures.turretTorpedo],
      [SpriteType.TURRET_DISRUPTOR, this.textures.turretDisruptor],
      [SpriteType.TURRET_TETRYON, this.textures.turretTetryon],
      [SpriteType.TURRET_PLASMA, this.textures.turretPlasma],
      [SpriteType.TURRET_POLARON, this.textures.turretPolaron],
      // Composite turret sprites (base + barrel)
      [SpriteType.TURRET_BASE_PHASER, this.textures.turretBasePhaser],
      [SpriteType.TURRET_BARREL_PHASER, this.textures.turretBarrelPhaser],
      [SpriteType.TURRET_BASE_TORPEDO, this.textures.turretBaseTorpedo],
      [SpriteType.TURRET_BARREL_TORPEDO, this.textures.turretBarrelTorpedo],
      [SpriteType.TURRET_BASE_DISRUPTOR, this.textures.turretBaseDisruptor],
      [SpriteType.TURRET_BARREL_DISRUPTOR, this.textures.turretBarrelDisruptor],
      [SpriteType.TURRET_BASE_TETRYON, this.textures.turretBaseTetryon],
      [SpriteType.TURRET_BARREL_TETRYON, this.textures.turretBarrelTetryon],
      [SpriteType.TURRET_BASE_PLASMA, this.textures.turretBasePlasma],
      [SpriteType.TURRET_BARREL_PLASMA, this.textures.turretBarrelPlasma],
      [SpriteType.TURRET_BASE_POLARON, this.textures.turretBasePolaron],
      [SpriteType.TURRET_BARREL_POLARON, this.textures.turretBarrelPolaron]
    ];

    for (const [spriteType, texture] of factionTextures) {
      const container = new ParticleContainer({
        dynamicProperties: {
          position: true,
          scale: true,
          rotation: true,
          color: false
        }
      });
      container.texture = texture;
      this.containers.set(spriteType, container);
      this.particlePool.set(spriteType, []);
      this.app.stage.addChild(container);
    }
  }

  /**
   * Get texture for a sprite type
   */
  private getTextureForType(spriteType: number): Texture | null {
    if (!this.textures) {
      return null;
    }

    switch (spriteType) {
      case SpriteType.FEDERATION:
        return this.textures.federation;
      case SpriteType.KOBAYASHI_MARU:
        return this.textures.kobayashiMaru;
      case SpriteType.KLINGON:
        return this.textures.klingon;
      case SpriteType.ROMULAN:
        return this.textures.romulan;
      case SpriteType.BORG:
        return this.textures.borg;
      case SpriteType.THOLIAN:
        return this.textures.tholian;
      case SpriteType.SPECIES_8472:
        return this.textures.species8472;
      case SpriteType.PROJECTILE:
        return this.textures.projectile;
      case SpriteType.TURRET_PHASER:
        return this.textures.turretPhaser;
      case SpriteType.TURRET_TORPEDO:
        return this.textures.turretTorpedo;
      case SpriteType.TURRET_DISRUPTOR:
        return this.textures.turretDisruptor;
      // Composite turret sprites
      case SpriteType.TURRET_BASE_PHASER:
        return this.textures.turretBasePhaser;
      case SpriteType.TURRET_BARREL_PHASER:
        return this.textures.turretBarrelPhaser;
      case SpriteType.TURRET_BASE_TORPEDO:
        return this.textures.turretBaseTorpedo;
      case SpriteType.TURRET_BARREL_TORPEDO:
        return this.textures.turretBarrelTorpedo;
      case SpriteType.TURRET_BASE_DISRUPTOR:
        return this.textures.turretBaseDisruptor;
      case SpriteType.TURRET_BARREL_DISRUPTOR:
        return this.textures.turretBarrelDisruptor;
      case SpriteType.TURRET_TETRYON:
        return this.textures.turretTetryon;
      case SpriteType.TURRET_PLASMA:
        return this.textures.turretPlasma;
      case SpriteType.TURRET_POLARON:
        return this.textures.turretPolaron;
      case SpriteType.TURRET_BASE_TETRYON:
        return this.textures.turretBaseTetryon;
      case SpriteType.TURRET_BARREL_TETRYON:
        return this.textures.turretBarrelTetryon;
      case SpriteType.TURRET_BASE_PLASMA:
        return this.textures.turretBasePlasma;
      case SpriteType.TURRET_BARREL_PLASMA:
        return this.textures.turretBarrelPlasma;
      case SpriteType.TURRET_BASE_POLARON:
        return this.textures.turretBasePolaron;
      case SpriteType.TURRET_BARREL_POLARON:
        return this.textures.turretBarrelPolaron;
      default:
        return this.textures.federation;
    }
  }

  /**
   * Create a particle for an entity with the correct texture
   * @param spriteType - The sprite type to determine texture
   * @param x - Initial X position
   * @param y - Initial Y position
   * @returns The particle index for referencing this particle
   */
  createSprite(spriteType: number, x: number = 0, y: number = 0): number {
    if (!this.initialized || !this.textures) {
      console.warn('SpriteManager not initialized');
      return 0;
    }

    if (this.particles.size >= MAX_PARTICLES) {
      console.warn('SpriteManager: Maximum particle count reached');
      return 0;
    }

    // Get the container for this sprite type
    const container = this.containers.get(spriteType);
    if (!container) {
      console.warn(`SpriteManager: No container for sprite type ${spriteType}`);
      return 0;
    }

    let particle: Particle;
    const pool = this.particlePool.get(spriteType);

    // Try to get a particle from the pool
    if (pool && pool.length > 0) {
      particle = pool.pop()!;
    } else {
      // Pool exhausted, create new particle
      const texture = this.getTextureForType(spriteType);
      if (!texture) {
        console.warn('SpriteManager: No texture for sprite type');
        return 0;
      }
      particle = new Particle({
        texture,
        anchorX: 0.5,
        anchorY: 0.5
      });
    }

    // Set position
    particle.x = x;
    particle.y = y;
    particle.rotation = 0; // Reset rotation
    particle.scaleX = 1; // Reset scale
    particle.scaleY = 1;

    // Add to container
    container.addParticle(particle);

    // Store particle with index
    const index = this.nextParticleIndex++;
    this.particles.set(index, { particle, spriteType });

    return index;
  }

  /**
   * Update particle position
   * @param index - The particle index
   * @param x - New X position
   * @param y - New Y position
   */
  updateSprite(index: number, x: number, y: number): void {
    const entry = this.particles.get(index);
    if (entry) {
      entry.particle.x = x;
      entry.particle.y = y;
    }
  }

  /**
   * Update particle rotation
   * @param index - The particle index
   * @param rotation - New rotation in radians
   */
  updateSpriteRotation(index: number, rotation: number): void {
    const entry = this.particles.get(index);
    if (entry) {
      entry.particle.rotation = rotation;
    }
  }

  /**
   * Remove a particle and return it to the pool
   * @param index - The particle index to remove
   */
  removeSprite(index: number): void {
    const entry = this.particles.get(index);
    if (entry) {
      const { particle, spriteType } = entry;

      // Remove from container
      const container = this.containers.get(spriteType);
      if (container) {
        container.removeParticle(particle);
      }

      // Return to pool
      const pool = this.particlePool.get(spriteType);
      if (pool) {
        pool.push(particle);
      }

      this.particles.delete(index);
    }
  }

  /**
   * Get the number of active particles
   */
  getActiveCount(): number {
    return this.particles.size;
  }

  /**
   * Get the total number of particles in pools
   */
  getPoolCount(): number {
    let count = 0;
    for (const pool of this.particlePool.values()) {
      count += pool.length;
    }
    return count;
  }

  /**
   * Check if the manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Clear all particles
    this.particles.clear();

    // Clear pools
    this.particlePool.clear();

    // Destroy containers
    for (const container of this.containers.values()) {
      container.destroy({ children: true });
    }
    this.containers.clear();

    this.initialized = false;
  }
}
