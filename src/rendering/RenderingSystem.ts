/**
 * Rendering System for Kobayashi Maru
 * Manages sprite creation and updates based on ECS data
 */
import { Application, Sprite, Container } from 'pixi.js';
import { defineQuery, IWorld } from 'bitecs';
import { Position, Faction, SpriteRef } from '../ecs/components';
import { FactionId } from '../types/constants';
import { createFactionTextures, FactionTextures } from './textures';

// Query for entities with Position, Faction, and SpriteRef components
const renderableQuery = defineQuery([Position, Faction, SpriteRef]);

/**
 * RenderingSystem manages all visual entities in the game
 */
export class RenderingSystem {
  private app: Application;
  private textures: FactionTextures | null = null;
  private sprites: Map<number, Sprite> = new Map();
  private entityContainer: Container;
  private initialized: boolean = false;

  constructor(app: Application) {
    this.app = app;
    this.entityContainer = new Container();
  }

  /**
   * Initialize the rendering system
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    // Create faction textures
    this.textures = createFactionTextures(this.app);

    // Add entity container to stage
    this.app.stage.addChild(this.entityContainer);

    this.initialized = true;
    console.log('RenderingSystem initialized');
  }

  /**
   * Get texture for a faction
   */
  private getTextureForFaction(factionId: number): Sprite | null {
    if (!this.textures) {
      return null;
    }

    let texture;
    switch (factionId) {
      case FactionId.FEDERATION:
        texture = this.textures.federation;
        break;
      case FactionId.KLINGON:
        texture = this.textures.klingon;
        break;
      case FactionId.ROMULAN:
        texture = this.textures.romulan;
        break;
      case FactionId.BORG:
        texture = this.textures.borg;
        break;
      case FactionId.THOLIAN:
        texture = this.textures.tholian;
        break;
      case FactionId.SPECIES_8472:
        texture = this.textures.species8472;
        break;
      default:
        texture = this.textures.federation;
    }

    return new Sprite(texture);
  }

  /**
   * Create a sprite for an entity
   */
  private createSprite(entityId: number, factionId: number, x: number, y: number): Sprite | null {
    const sprite = this.getTextureForFaction(factionId);
    if (!sprite) {
      return null;
    }

    sprite.anchor.set(0.5, 0.5);
    sprite.position.set(x, y);
    
    this.entityContainer.addChild(sprite);
    this.sprites.set(entityId, sprite);

    return sprite;
  }

  /**
   * Update rendering system - syncs sprites with ECS data
   */
  update(world: IWorld): void {
    if (!this.initialized || !this.textures) {
      return;
    }

    const entities = renderableQuery(world);

    // Update or create sprites for all renderable entities
    for (const eid of entities) {
      const x = Position.x[eid];
      const y = Position.y[eid];
      const factionId = Faction.id[eid];

      let sprite = this.sprites.get(eid);

      if (!sprite) {
        // Create new sprite for this entity
        const newSprite = this.createSprite(eid, factionId, x, y);
        if (newSprite) {
          sprite = newSprite;
        }
      }

      if (sprite) {
        // Update sprite position
        sprite.position.set(x, y);
      }
    }

    // Remove sprites for entities that no longer exist
    const entitySet = new Set(entities);
    for (const [eid, sprite] of this.sprites) {
      if (!entitySet.has(eid)) {
        this.entityContainer.removeChild(sprite);
        sprite.destroy();
        this.sprites.delete(eid);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    for (const sprite of this.sprites.values()) {
      sprite.destroy();
    }
    this.sprites.clear();
    this.entityContainer.destroy({ children: true });
    this.initialized = false;
  }
}
