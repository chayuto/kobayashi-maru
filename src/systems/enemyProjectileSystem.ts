/**
 * Enemy Projectile System for Kobayashi Maru
 * Handles enemy projectile collisions with Federation entities (Kobayashi Maru, turrets)
 */
import { defineQuery, hasComponent, IWorld, removeEntity } from 'bitecs';
import { Position, Velocity, Projectile, Collider, Health, Shield, Faction, Turret } from '../ecs/components';
import { SpatialHash } from '../collision';
import { decrementEntityCount } from '../ecs/world';
import { FactionId } from '../types/constants';

// Query for enemy projectiles
const enemyProjectileQuery = defineQuery([Position, Velocity, Projectile, Collider, Faction]);

/**
 * Creates the enemy projectile system
 * @param spatialHash - Spatial hash for collision detection
 * @param getKobayashiMaruId - Function to get the Kobayashi Maru entity ID
 * @returns A system function that updates enemy projectiles
 */
export function createEnemyProjectileSystem(
  spatialHash: SpatialHash,
  getKobayashiMaruId?: () => number
) {
  // Track total damage dealt to the Kobayashi Maru
  let totalDamageToKM = 0;

  function enemyProjectileSystem(world: IWorld, deltaTime: number): IWorld {
    const projectiles = enemyProjectileQuery(world);
    const kmId = getKobayashiMaruId?.() ?? -1;

    for (const eid of projectiles) {
      // Only handle enemy projectiles
      if (Faction.id[eid] !== FactionId.ENEMY_PROJECTILE) continue;

      // 1. Update lifetime
      Projectile.lifetime[eid] -= deltaTime;
      if (Projectile.lifetime[eid] <= 0) {
        removeEntity(world, eid);
        decrementEntityCount();
        continue;
      }

      // 2. Collision Detection with Federation entities
      const x = Position.x[eid];
      const y = Position.y[eid];
      const radius = Collider.radius[eid];
      const damage = Projectile.damage[eid];

      // Query nearby entities using spatial hash
      const nearby = spatialHash.query(x, y, radius);

      let hit = false;

      for (const targetEid of nearby) {
        // Skip self
        if (targetEid === eid) continue;

        // Check if target is valid and has health
        if (!hasComponent(world, Health, targetEid)) continue;
        if (Health.current[targetEid] <= 0) continue;

        // Check faction (only hit Federation entities)
        if (hasComponent(world, Faction, targetEid)) {
          const targetFaction = Faction.id[targetEid];
          // Only hit Federation entities (Kobayashi Maru and turrets)
          if (targetFaction !== FactionId.FEDERATION) continue;
        } else {
          continue;
        }

        // Simple circle collision check
        const targetX = Position.x[targetEid];
        const targetY = Position.y[targetEid];
        // Turrets have radius of about 20, Kobayashi Maru has larger radius
        const targetRadius = hasComponent(world, Collider, targetEid) 
          ? Collider.radius[targetEid] 
          : (hasComponent(world, Turret, targetEid) ? 20 : 40);

        const dx = x - targetX;
        const dy = y - targetY;
        const distSq = dx * dx + dy * dy;
        const radiusSum = radius + targetRadius;

        if (distSq <= radiusSum * radiusSum) {
          // Collision!
          const actualDamage = applyDamage(world, targetEid, damage);
          
          // Track damage to Kobayashi Maru specifically
          if (targetEid === kmId && actualDamage > 0) {
            totalDamageToKM += actualDamage;
          }
          
          hit = true;
          break; // Only hit one target
        }
      }

      if (hit) {
        removeEntity(world, eid);
        decrementEntityCount();
      }
    }

    return world;
  }

  /**
   * Get total damage dealt to the Kobayashi Maru by enemy projectiles
   */
  function getTotalDamageToKM(): number {
    return totalDamageToKM;
  }

  /**
   * Reset damage tracking (for game restart)
   */
  function resetDamageTracking(): void {
    totalDamageToKM = 0;
  }

  return {
    update: enemyProjectileSystem,
    getTotalDamageToKM,
    resetDamageTracking
  };
}

/**
 * Applies damage to an entity, prioritizing shields over health
 */
function applyDamage(world: IWorld, entityId: number, damage: number): number {
  let totalDamageDealt = 0;

  // Apply damage to shields first if entity has Shield component
  if (hasComponent(world, Shield, entityId)) {
    const currentShield = Shield.current[entityId];
    if (currentShield > 0) {
      const shieldDamage = Math.min(currentShield, damage);
      Shield.current[entityId] = currentShield - shieldDamage;
      damage -= shieldDamage;
      totalDamageDealt += shieldDamage;
    }
  }

  // Apply remaining damage to health
  if (damage > 0) {
    const currentHealth = Health.current[entityId];
    const healthDamage = Math.min(currentHealth, damage);
    Health.current[entityId] = currentHealth - healthDamage;
    totalDamageDealt += healthDamage;
  }

  return totalDamageDealt;
}

export type EnemyProjectileSystem = ReturnType<typeof createEnemyProjectileSystem>;
