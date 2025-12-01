/**
 * Enemy Collision System for Kobayashi Maru
 * Handles enemy collision with the Kobayashi Maru (main ship)
 * When enemies reach the ship, they explode and deal damage
 */
import { defineQuery, IWorld, hasComponent } from 'bitecs';
import { Position, Health, Faction, AIBehavior, Shield } from '../ecs/components';
import { FactionId } from '../types/constants';
import { ParticleSystem, EFFECTS } from '../rendering';
import { AudioManager, SoundType } from '../audio';

// Query for enemy entities (have AIBehavior component, non-Federation faction)
const enemyQuery = defineQuery([Position, Health, Faction, AIBehavior]);

// Collision radius for enemy-ship collision (sum of both radii)
const COLLISION_RADIUS = 40;

// Damage dealt by enemy on collision
const COLLISION_DAMAGE = 25;

/**
 * Creates the enemy collision system that handles enemy-ship collisions
 * @param particleSystem - Particle system for explosion effects
 * @param getKobayashiMaruId - Function to get the Kobayashi Maru entity ID
 * @returns System update function and methods
 */
export function createEnemyCollisionSystem(
  particleSystem?: ParticleSystem,
  getKobayashiMaruId?: () => number
) {
  // Track entities that should be destroyed this frame
  const entitiesToDestroy: number[] = [];

  function enemyCollisionSystem(world: IWorld): IWorld {
    // Clear destruction list from last frame
    entitiesToDestroy.length = 0;

    // Get Kobayashi Maru ID
    const kmId = getKobayashiMaruId?.() ?? -1;
    if (kmId === -1) {
      return world;
    }

    // Check if Kobayashi Maru exists and has health
    if (!hasComponent(world, Position, kmId) || !hasComponent(world, Health, kmId)) {
      return world;
    }

    const kmX = Position.x[kmId];
    const kmY = Position.y[kmId];

    // Get all enemies
    const enemies = enemyQuery(world);

    for (const eid of enemies) {
      // Skip Federation entities (should not be in enemyQuery, but double-check)
      if (Faction.id[eid] === FactionId.FEDERATION) {
        continue;
      }

      const enemyX = Position.x[eid];
      const enemyY = Position.y[eid];

      // Check collision with Kobayashi Maru
      const dx = enemyX - kmX;
      const dy = enemyY - kmY;
      const distanceSquared = dx * dx + dy * dy;
      const collisionRadiusSquared = COLLISION_RADIUS * COLLISION_RADIUS;

      if (distanceSquared <= collisionRadiusSquared) {
        // Collision detected!
        
        // Deal damage to Kobayashi Maru (shields first, then hull)
        dealDamageToTarget(kmId, COLLISION_DAMAGE);

        // Spawn explosion effect at enemy position
        if (particleSystem) {
          particleSystem.spawn({
            ...EFFECTS.EXPLOSION_LARGE,
            x: enemyX,
            y: enemyY
          });
        }

        // Play explosion sound
        AudioManager.getInstance().play(SoundType.EXPLOSION_SMALL, { volume: 0.6 });

        // Mark enemy for destruction (set health to 0)
        Health.current[eid] = 0;
        entitiesToDestroy.push(eid);
      }
    }

    return world;
  }

  /**
   * Deal damage to a target entity, applying to shields first then hull
   */
  function dealDamageToTarget(targetId: number, damage: number): void {
    let remainingDamage = damage;

    // Apply damage to shields first
    const currentShield = Shield.current[targetId] ?? 0;
    if (currentShield > 0) {
      const shieldDamage = Math.min(currentShield, remainingDamage);
      Shield.current[targetId] = currentShield - shieldDamage;
      remainingDamage -= shieldDamage;
    }

    // Apply remaining damage to hull
    if (remainingDamage > 0) {
      const currentHealth = Health.current[targetId] ?? 0;
      Health.current[targetId] = Math.max(0, currentHealth - remainingDamage);
    }
  }

  return {
    update: enemyCollisionSystem,
    /**
     * Get entities that were destroyed by collision this frame
     */
    getDestroyedThisFrame: () => [...entitiesToDestroy]
  };
}

export type EnemyCollisionSystem = ReturnType<typeof createEnemyCollisionSystem>;
