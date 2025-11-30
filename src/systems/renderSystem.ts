/**
 * Render System for Kobayashi Maru
 * A bitECS system that syncs entity positions to sprites using SpriteManager
 */
import { defineQuery, defineSystem, IWorld, enterQuery, exitQuery } from 'bitecs';
import { Position, Faction, SpriteRef } from '../ecs/components';
import type { SpriteManager } from '../rendering/spriteManager';

// Query for entities with Position, Faction, and SpriteRef components
const renderQuery = defineQuery([Position, Faction, SpriteRef]);
const renderEnterQuery = enterQuery(renderQuery);
const renderExitQuery = exitQuery(renderQuery);

// Special value to indicate unset sprite index
const SPRITE_INDEX_UNSET = 0;

/**
 * Creates the render system that syncs ECS entities with sprites
 * @param spriteManager - The sprite manager instance
 * @returns A bitECS system function
 */
export function createRenderSystem(spriteManager: SpriteManager) {
  return defineSystem((world: IWorld) => {
    // Handle new entities - create sprites for them
    const enteredEntities = renderEnterQuery(world);
    for (const eid of enteredEntities) {
      // Check if sprite needs to be created (index is unset/placeholder)
      if (SpriteRef.index[eid] === SPRITE_INDEX_UNSET) {
        const factionId = Faction.id[eid];
        const x = Position.x[eid];
        const y = Position.y[eid];
        const spriteIndex = spriteManager.createSprite(factionId, x, y);
        SpriteRef.index[eid] = spriteIndex;
      }
    }

    // Handle removed entities - remove their sprites
    const exitedEntities = renderExitQuery(world);
    for (const eid of exitedEntities) {
      const spriteIndex = SpriteRef.index[eid];
      if (spriteIndex !== SPRITE_INDEX_UNSET) {
        spriteManager.removeSprite(spriteIndex);
        SpriteRef.index[eid] = SPRITE_INDEX_UNSET;
      }
    }

    // Update positions for all existing entities
    const entities = renderQuery(world);
    for (const eid of entities) {
      const spriteIndex = SpriteRef.index[eid];
      if (spriteIndex !== SPRITE_INDEX_UNSET) {
        const x = Position.x[eid];
        const y = Position.y[eid];
        spriteManager.updateSprite(spriteIndex, x, y);
      }
    }

    return world;
  });
}
