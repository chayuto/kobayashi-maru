/**
 * Damage System for Kobayashi Maru
 * Handles entity destruction when health reaches 0 and returns entities to pool
 */
import { defineQuery, removeEntity, IWorld } from 'bitecs';
import { Health, Faction, Position } from '../ecs/components';
import { FactionId } from '../types/constants';
import { GameEventType } from '../types/events';
import { AudioManager, SoundType } from '../audio';
import { decrementEntityCount } from '../ecs/world';
import { ParticleSystem, EFFECTS } from '../rendering';
import { EventBus } from '../core/EventBus';

// Query for entities with Health component
const healthQuery = defineQuery([Health, Faction, Position]);

/**
 * Callback type for enemy death events
 * @deprecated Use EventBus.on(GameEventType.ENEMY_KILLED) instead
 */
export type EnemyDeathCallback = (entityId: number, factionId: number) => void;

/**
 * Creates the damage system that handles entity destruction
 * @param particleSystem - Optional particle system for explosion effects
 * @returns A system function that processes entity deaths
 */
export function createDamageSystem(particleSystem?: ParticleSystem) {
  // Store callbacks for enemy death (kept for backward compatibility)
  const deathCallbacks: EnemyDeathCallback[] = [];
  // Track entities destroyed this frame
  const destroyedThisFrame: number[] = [];
  // Get the EventBus instance
  const eventBus = EventBus.getInstance();

  function damageSystem(world: IWorld): IWorld {
    // Clear destroyed list from last frame
    destroyedThisFrame.length = 0;

    const entities = healthQuery(world);

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

        // Notify callbacks about enemy death (backward compatibility)
        for (const callback of deathCallbacks) {
          callback(eid, factionId);
        }
      }

      // Track as destroyed
      destroyedThisFrame.push(eid);

      // Remove entity from world
      removeEntity(world, eid);
      decrementEntityCount();
    }

    return world;
  }

  return {
    update: damageSystem,
    /**
     * Register a callback for enemy death events
     * @deprecated Use EventBus.on(GameEventType.ENEMY_KILLED) instead
     */
    onEnemyDeath: (callback: EnemyDeathCallback) => {
      deathCallbacks.push(callback);
    },
    /**
     * Remove a death callback
     * @deprecated Use EventBus.off(GameEventType.ENEMY_KILLED) instead
     */
    offEnemyDeath: (callback: EnemyDeathCallback) => {
      const index = deathCallbacks.indexOf(callback);
      if (index !== -1) {
        deathCallbacks.splice(index, 1);
      }
    },
    /**
     * Get entities destroyed in the current frame
     */
    getDestroyedThisFrame: () => [...destroyedThisFrame]
  };
}

export type DamageSystem = ReturnType<typeof createDamageSystem>;
