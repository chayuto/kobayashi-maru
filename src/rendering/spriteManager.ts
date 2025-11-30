/**
 * Sprite Manager for Kobayashi Maru
 * Manages PixiJS ParticleContainer for high-performance rendering of 10,000+ sprites
 */
import { Application, Texture, ParticleContainer, Particle } from 'pixi.js';
import { FactionId } from '../types/constants';
import { createFactionTextures, FactionTextures } from './textures';

// Maximum number of particles supported
const MAX_PARTICLES = 15000;

/**
 * SpriteManager handles particle creation, updates, and removal using a ParticleContainer
 * for maximum performance with large numbers of entities
 */
export class SpriteManager {
  private app: Application;
  private textures: FactionTextures | null = null;
  private containers: Map<number, ParticleContainer> = new Map();
  private particles: Map<number, { particle: Particle; factionId: number }> = new Map();
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

    // Create a ParticleContainer for each faction to handle different textures
    this.createFactionContainers();

    this.initialized = true;
    console.log('SpriteManager initialized with ParticleContainer');
  }

  /**
   * Create ParticleContainers for each faction
   */
  private createFactionContainers(): void {
    if (!this.textures) return;

    const factionTextures: Array<[number, Texture]> = [
      [FactionId.FEDERATION, this.textures.federation],
      [FactionId.KLINGON, this.textures.klingon],
      [FactionId.ROMULAN, this.textures.romulan],
      [FactionId.BORG, this.textures.borg],
      [FactionId.THOLIAN, this.textures.tholian],
      [FactionId.SPECIES_8472, this.textures.species8472]
    ];

    for (const [factionId, texture] of factionTextures) {
      const container = new ParticleContainer({
        dynamicProperties: {
          position: true,
          scale: false,
          rotation: false,
          color: false
        }
      });
      container.texture = texture;
      this.containers.set(factionId, container);
      this.particlePool.set(factionId, []);
      this.app.stage.addChild(container);
    }
  }

  /**
   * Get texture for a faction
   */
  private getTextureForFaction(factionId: number): Texture | null {
    if (!this.textures) {
      return null;
    }

    switch (factionId) {
      case FactionId.FEDERATION:
        return this.textures.federation;
      case FactionId.KLINGON:
        return this.textures.klingon;
      case FactionId.ROMULAN:
        return this.textures.romulan;
      case FactionId.BORG:
        return this.textures.borg;
      case FactionId.THOLIAN:
        return this.textures.tholian;
      case FactionId.SPECIES_8472:
        return this.textures.species8472;
      default:
        return this.textures.federation;
    }
  }

  /**
   * Create a particle for an entity with the correct faction texture
   * @param factionId - The faction ID to determine texture
   * @param x - Initial X position
   * @param y - Initial Y position
   * @returns The particle index for referencing this particle
   */
  createSprite(factionId: number, x: number = 0, y: number = 0): number {
    if (!this.initialized || !this.textures) {
      console.warn('SpriteManager not initialized');
      return 0;
    }

    if (this.particles.size >= MAX_PARTICLES) {
      console.warn('SpriteManager: Maximum particle count reached');
      return 0;
    }

    // Get the container for this faction
    const container = this.containers.get(factionId);
    if (!container) {
      console.warn(`SpriteManager: No container for faction ${factionId}`);
      return 0;
    }

    let particle: Particle;
    const pool = this.particlePool.get(factionId);

    // Try to get a particle from the pool
    if (pool && pool.length > 0) {
      particle = pool.pop()!;
    } else {
      // Pool exhausted, create new particle
      const texture = this.getTextureForFaction(factionId);
      if (!texture) {
        console.warn('SpriteManager: No texture for faction');
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

    // Add to container
    container.addParticle(particle);

    // Store particle with index
    const index = this.nextParticleIndex++;
    this.particles.set(index, { particle, factionId });

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
   * Remove a particle and return it to the pool
   * @param index - The particle index to remove
   */
  removeSprite(index: number): void {
    const entry = this.particles.get(index);
    if (entry) {
      const { particle, factionId } = entry;
      
      // Remove from container
      const container = this.containers.get(factionId);
      if (container) {
        container.removeParticle(particle);
      }
      
      // Return to pool
      const pool = this.particlePool.get(factionId);
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
