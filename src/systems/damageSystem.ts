/**
 * Damage System for Kobayashi Maru
 * Handles entity destruction when health reaches 0 and returns entities to pool
 */
import { query, removeEntity, World } from 'bitecs';
import { Health, Faction, Position, SpriteRef, CompositeSpriteRef } from '../ecs/components';
import { FactionId } from '../types/constants';
import { GameEventType } from '../types/events';
import { AudioManager, SoundType } from '../audio';
import { decrementEntityCount } from '../ecs/world';
import { ParticleSystem, EFFECTS } from '../rendering';
import { EventBus } from '../core/EventBus';
import { PoolManager } from '../ecs/PoolManager';
import { RENDERING_CONFIG } from '../config';
import type { SpriteManager } from '../rendering/spriteManager';

// Use centralized config for unset sprite index
const SPRITE_INDEX_UNSET = RENDERING_CONFIG.SPRITES.INDEX_UNSET;


/**
 * Creates the damage system that handles entity destruction
 * @param particleSystem - Optional particle system for explosion effects
 * @param spriteManager - Optional sprite manager for immediate sprite removal
 * @returns A system function that processes entity deaths
 */
export function createDamageSystem(particleSystem?: ParticleSystem, spriteManager?: SpriteManager) {
  // Track entities destroyed this frame
  const destroyedThisFrame: number[] = [];
  // Get the EventBus instance
  const eventBus = EventBus.getInstance();
  // Get the PoolManager instance
  const poolManager = PoolManager.getInstance();

  function damageSystem(world: World): World {
    // Clear destroyed list from last frame
    destroyedThisFrame.length = 0;

    const entities = query(world, [Health, Faction, Position]);

    for (const eid of entities) {
      const currentHealth = Health.current[eid];

      // Skip entities that are still alive
      if (currentHealth > 0) continue;

      // Entity destroyed
      const factionId = Faction.id[eid];
      const x = Position.x[eid];
      const y = Position.y[eid];

      // Play explosion sound and visual effect
      const audioManager = AudioManager.getInstance();
      if (factionId === FactionId.FEDERATION) {
        // Turret/Player explosion
        audioManager.play(SoundType.EXPLOSION_LARGE, { volume: 0.7 });

        if (particleSystem) {
          particleSystem.spawn({
            ...EFFECTS.EXPLOSION_LARGE,
            x,
            y
          });
        }
      } else {
        // Enemy explosion
        audioManager.play(SoundType.EXPLOSION_SMALL, { volume: 0.5 });

        if (particleSystem) {
          particleSystem.spawn({
            ...EFFECTS.EXPLOSION_SMALL,
            x,
            y
          });
        }
      }

      // Only process non-Federation entities as enemies
      if (factionId !== FactionId.FEDERATION) {
        // Emit event via EventBus
        eventBus.emit(GameEventType.ENEMY_KILLED, {
          entityId: eid,
          factionId,
          x,
          y
        });
      }

      // Track as destroyed
      destroyedThisFrame.push(eid);

      // Immediately remove sprite before releasing to pool (fixes visual delay)
      const spriteIndex = SpriteRef.index[eid];
      if (spriteIndex !== SPRITE_INDEX_UNSET && spriteManager) {
        spriteManager.removeSprite(spriteIndex);
        SpriteRef.index[eid] = SPRITE_INDEX_UNSET;
      }

      // Immediately remove composite sprites
      const baseIndex = CompositeSpriteRef.baseIndex[eid];
      if (baseIndex !== SPRITE_INDEX_UNSET && spriteManager) {
        spriteManager.removeSprite(baseIndex);
        spriteManager.removeSprite(CompositeSpriteRef.barrelIndex[eid]);
        CompositeSpriteRef.baseIndex[eid] = SPRITE_INDEX_UNSET;
        CompositeSpriteRef.barrelIndex[eid] = SPRITE_INDEX_UNSET;
      }

      // Remove entity from world or Return to appropriate pool
      if (factionId === FactionId.PROJECTILE || factionId === FactionId.ENEMY_PROJECTILE) {
        // Projectile entity
        poolManager.releaseProjectile(eid);
      } else if (factionId !== FactionId.FEDERATION) {
        // Enemy entity
        poolManager.releaseEnemy(eid);
      } else {
        // Federation entities (turrets, Kobayashi Maru) - actually remove
        removeEntity(world, eid);
        decrementEntityCount();
      }
    }

    return world;
  }

  return {
    update: damageSystem,
    /**
     * Get entities destroyed in the current frame
     */
    getDestroyedThisFrame: () => [...destroyedThisFrame]
  };
}

export type DamageSystem = ReturnType<typeof createDamageSystem>;

