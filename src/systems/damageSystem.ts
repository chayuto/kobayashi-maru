/**
 * Damage System for Kobayashi Maru
 * Handles entity destruction when health reaches 0 and returns entities to pool
 */
import { defineQuery, removeEntity, IWorld } from 'bitecs';
import { Health, Faction, Position } from '../ecs/components';
import { FactionId } from '../types/constants';
import { AudioManager, SoundType } from '../audio';
import { decrementEntityCount } from '../ecs/world';
import { ParticleSystem, EFFECTS } from '../rendering';

// Query for entities with Health component
const healthQuery = defineQuery([Health, Faction, Position]);

/**
 * Callback type for enemy death events
 */
export type EnemyDeathCallback = (entityId: number, factionId: number) => void;

/**
 * Creates the damage system that handles entity destruction
 * @param particleSystem - Optional particle system for explosion effects
 * @returns A system function that processes entity deaths
 */
export function createDamageSystem(particleSystem?: ParticleSystem) {
  // Store callbacks for enemy death
  const deathCallbacks: EnemyDeathCallback[] = [];
  // Track entities destroyed this frame
  const destroyedThisFrame: number[] = [];

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
        // Notify callbacks about enemy death
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
     */
    onEnemyDeath: (callback: EnemyDeathCallback) => {
      deathCallbacks.push(callback);
    },
    /**
     * Remove a death callback
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
