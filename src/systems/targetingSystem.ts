/**
 * Targeting System for Kobayashi Maru
 * Handles turret target acquisition based on proximity and enemy status
 */
import { defineQuery, hasComponent, IWorld } from 'bitecs';
import { Position, Turret, Target, Faction, Health } from '../ecs/components';
import { FactionId } from '../types/constants';
import { SpatialHash } from '../collision/spatialHash';

// Query for turrets with targeting capability
const turretQuery = defineQuery([Position, Turret, Target]);

/**
 * Creates the targeting system that finds enemies within turret range
 * @param spatialHash The spatial hash instance for efficient proximity queries
 * @returns A system function that updates turret targets
 */
export function createTargetingSystem(spatialHash: SpatialHash) {
  return function targetingSystem(world: IWorld): IWorld {
    const turrets = turretQuery(world);

    for (const turretEid of turrets) {
      const turretX = Position.x[turretEid];
      const turretY = Position.y[turretEid];
      const range = Turret.range[turretEid];
      const currentTargetId = Target.entityId[turretEid];
      const hasTarget = Target.hasTarget[turretEid] === 1;

      // Check if current target is still valid
      if (hasTarget) {
        const isTargetValid = isValidTarget(world, currentTargetId, turretX, turretY, range);
        if (!isTargetValid) {
          Target.hasTarget[turretEid] = 0;
          Target.entityId[turretEid] = 0;
        } else {
          // Current target is still valid, continue targeting it
          continue;
        }
      }

      // Find new target - query entities in range
      const candidates = spatialHash.query(turretX, turretY, range);
      let closestEnemy: number | null = null;
      let closestDistSq = range * range;

      for (const candidateEid of candidates) {
        // Skip self
        if (candidateEid === turretEid) continue;

        // Check if it's an enemy (not Federation)
        if (!hasComponent(world, Faction, candidateEid)) continue;
        if (Faction.id[candidateEid] === FactionId.FEDERATION) continue;

        // Check if it has health (is alive)
        if (!hasComponent(world, Health, candidateEid)) continue;
        if (Health.current[candidateEid] <= 0) continue;

        // Check if it has position
        if (!hasComponent(world, Position, candidateEid)) continue;

        // Calculate distance
        const dx = Position.x[candidateEid] - turretX;
        const dy = Position.y[candidateEid] - turretY;
        const distSq = dx * dx + dy * dy;

        // Check if actually within range (fine-grained check)
        if (distSq > closestDistSq) continue;

        // Found a closer enemy
        closestEnemy = candidateEid;
        closestDistSq = distSq;
      }

      // Set new target if found
      if (closestEnemy !== null) {
        Target.entityId[turretEid] = closestEnemy;
        Target.hasTarget[turretEid] = 1;
      }
    }

    return world;
  };
}

/**
 * Checks if a target entity is still valid (alive, in range, exists)
 */
function isValidTarget(
  world: IWorld,
  targetEid: number,
  turretX: number,
  turretY: number,
  range: number
): boolean {
  // Check if entity still has required components
  if (!hasComponent(world, Position, targetEid)) return false;
  if (!hasComponent(world, Health, targetEid)) return false;
  if (!hasComponent(world, Faction, targetEid)) return false;

  // Check if still an enemy
  if (Faction.id[targetEid] === FactionId.FEDERATION) return false;

  // Check if still alive
  if (Health.current[targetEid] <= 0) return false;

  // Check if still in range
  const dx = Position.x[targetEid] - turretX;
  const dy = Position.y[targetEid] - turretY;
  const distSq = dx * dx + dy * dy;
  if (distSq > range * range) return false;

  return true;
}

export type TargetingSystem = ReturnType<typeof createTargetingSystem>;
