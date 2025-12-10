/**
 * Enemy Projectile System for Kobayashi Maru
 * Handles enemy projectile collisions with Federation entities (Kobayashi Maru, turrets)
 */
import { query, hasComponent, World, removeEntity } from 'bitecs';
import { Position, Velocity, Projectile, Collider, Health, Faction, Turret } from '../ecs/components';
import { SpatialHash } from '../collision';
import { decrementEntityCount } from '../ecs/world';
import { FactionId, GAME_CONFIG } from '../types/constants';
import { applyDamage } from '../services';

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

  function enemyProjectileSystem(world: World, deltaTime: number): World {
    const projectiles = query(world, [Position, Velocity, Projectile, Collider, Faction]);
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

        // Check if target has health component and is alive (early filtering)
        if (!hasComponent(world, targetEid, Health) || Health.current[targetEid] <= 0) continue;

        // Check faction (only hit Federation entities)
        if (!hasComponent(world, targetEid, Faction) || Faction.id[targetEid] !== FactionId.FEDERATION) {
          continue;
        }

        // Simple circle collision check
        const targetX = Position.x[targetEid];
        const targetY = Position.y[targetEid];
        // Use configured collision radii for Kobayashi Maru and turrets
        const targetRadius = hasComponent(world, targetEid, Collider)
          ? Collider.radius[targetEid]
          : (hasComponent(world, targetEid, Turret) ? GAME_CONFIG.TURRET_RADIUS : GAME_CONFIG.KOBAYASHI_MARU_RADIUS);

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

export type EnemyProjectileSystem = ReturnType<typeof createEnemyProjectileSystem>;
