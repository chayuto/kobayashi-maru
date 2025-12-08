/**
 * Render System for Kobayashi Maru
 * A bitECS system that syncs entity positions to sprites using SpriteManager
 */
import { defineQuery, defineSystem, IWorld, enterQuery, exitQuery, hasComponent } from 'bitecs';
import { Position, Faction, SpriteRef, Turret, Projectile, Rotation, CompositeSpriteRef, Health } from '../ecs/components';
import { TurretType, SpriteType } from '../types/constants';
import type { SpriteManager } from '../rendering/spriteManager';

// Query for entities with Position, Faction, and SpriteRef components
const renderQuery = defineQuery([Position, Faction, SpriteRef]);
const renderEnterQuery = enterQuery(renderQuery);
const renderExitQuery = exitQuery(renderQuery);

// Query for composite sprites (Position, Faction, CompositeSpriteRef)
const compositeQuery = defineQuery([Position, Faction, CompositeSpriteRef]);
const compositeEnterQuery = enterQuery(compositeQuery);
const compositeExitQuery = exitQuery(compositeQuery);

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
        let spriteType = Faction.id[eid]; // Default to faction ID

        // Check if this is the Kobayashi Maru (Federation entity with Health and Turret, not a placed turret)
        // Placed turrets use CompositeSpriteRef, so we check for that to avoid false matches
        const isFederation = Faction.id[eid] === 0; // FactionId.FEDERATION = 0
        const hasTurret = hasComponent(world, Turret, eid);
        const hasHealth = hasComponent(world, Health, eid);
        const hasComposite = hasComponent(world, CompositeSpriteRef, eid);

        if (isFederation && hasHealth && hasTurret && !hasComposite) {
          // This is the Kobayashi Maru - use the special flagship texture
          spriteType = SpriteType.KOBAYASHI_MARU;
        }
        // Override for Turrets (placed turrets without Health)
        else if (hasComponent(world, Turret, eid)) {
          const turretType = Turret.turretType[eid];
          switch (turretType) {
            case TurretType.PHASER_ARRAY:
              spriteType = SpriteType.TURRET_PHASER;
              break;
            case TurretType.TORPEDO_LAUNCHER:
              spriteType = SpriteType.TURRET_TORPEDO;
              break;
            case TurretType.DISRUPTOR_BANK:
              spriteType = SpriteType.TURRET_DISRUPTOR;
              break;
          }
        }
        // Override for Projectiles
        else if (hasComponent(world, Projectile, eid)) {
          spriteType = SpriteType.PROJECTILE;
        }

        const x = Position.x[eid];
        const y = Position.y[eid];
        const spriteIndex = spriteManager.createSprite(spriteType, x, y);
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

    // Update positions and rotation for all existing entities
    const entities = renderQuery(world);
    for (const eid of entities) {
      const spriteIndex = SpriteRef.index[eid];
      if (spriteIndex !== SPRITE_INDEX_UNSET) {
        const x = Position.x[eid];
        const y = Position.y[eid];
        spriteManager.updateSprite(spriteIndex, x, y);

        // Update rotation if entity has Rotation component
        if (hasComponent(world, Rotation, eid)) {
          spriteManager.updateSpriteRotation(spriteIndex, Rotation.angle[eid]);
        }
      }
    }

    // --- Composite Sprite Handling ---

    // Handle new composite entities
    const enteredComposite = compositeEnterQuery(world);
    for (const eid of enteredComposite) {
      if (CompositeSpriteRef.baseIndex[eid] === SPRITE_INDEX_UNSET) {
        let baseType = 0;
        let barrelType = 0;

        if (hasComponent(world, Turret, eid)) {
          switch (Turret.turretType[eid]) {
            case TurretType.PHASER_ARRAY:
              baseType = SpriteType.TURRET_BASE_PHASER;
              barrelType = SpriteType.TURRET_BARREL_PHASER;
              break;
            case TurretType.TORPEDO_LAUNCHER:
              baseType = SpriteType.TURRET_BASE_TORPEDO;
              barrelType = SpriteType.TURRET_BARREL_TORPEDO;
              break;
            case TurretType.DISRUPTOR_BANK:
              baseType = SpriteType.TURRET_BASE_DISRUPTOR;
              barrelType = SpriteType.TURRET_BARREL_DISRUPTOR;
              break;
            default:
              // Fallback
              baseType = SpriteType.TURRET_BASE_PHASER;
              barrelType = SpriteType.TURRET_BARREL_PHASER;
          }
        }

        if (baseType !== 0) {
          const x = Position.x[eid];
          const y = Position.y[eid];
          CompositeSpriteRef.baseIndex[eid] = spriteManager.createSprite(baseType, x, y);
          CompositeSpriteRef.barrelIndex[eid] = spriteManager.createSprite(barrelType, x, y);
        }
      }
    }

    // Handle removed composite entities
    const exitedComposite = compositeExitQuery(world);
    for (const eid of exitedComposite) {
      const baseIndex = CompositeSpriteRef.baseIndex[eid];
      const barrelIndex = CompositeSpriteRef.barrelIndex[eid];
      if (baseIndex !== SPRITE_INDEX_UNSET) {
        spriteManager.removeSprite(baseIndex);
        spriteManager.removeSprite(barrelIndex);
        CompositeSpriteRef.baseIndex[eid] = SPRITE_INDEX_UNSET;
        CompositeSpriteRef.barrelIndex[eid] = SPRITE_INDEX_UNSET;
      }
    }

    // Update composite entities
    const compositeEntities = compositeQuery(world);
    for (const eid of compositeEntities) {
      const baseIndex = CompositeSpriteRef.baseIndex[eid];
      const barrelIndex = CompositeSpriteRef.barrelIndex[eid];
      if (baseIndex !== SPRITE_INDEX_UNSET) {
        const x = Position.x[eid];
        const y = Position.y[eid];

        // Update positions
        spriteManager.updateSprite(baseIndex, x, y);
        spriteManager.updateSprite(barrelIndex, x, y);

        // Update rotation (Barrel only)
        if (hasComponent(world, Rotation, eid)) {
          spriteManager.updateSpriteRotation(barrelIndex, Rotation.angle[eid]);
        }
      }
    }

    return world;
  });
}
