/**
 * Targeting System for Kobayashi Maru
 * Handles turret target acquisition based on proximity and enemy status
 * Supports multi-target for upgraded turrets
 */
import { defineQuery, hasComponent, IWorld } from 'bitecs';
import { Position, Turret, Target, Faction, Health, TurretUpgrade } from '../ecs/components';
import { FactionId, UPGRADE_CONFIG, UpgradePath } from '../types/constants';
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
      
      // Determine max targets based on multi-target upgrade level
      let maxTargets = 1;
      if (hasComponent(world, TurretUpgrade, turretEid)) {
        const multiTargetLevel = TurretUpgrade.multiTargetLevel[turretEid];
        if (multiTargetLevel > 0 && multiTargetLevel <= UPGRADE_CONFIG[UpgradePath.MULTI_TARGET].targets.length) {
          maxTargets = UPGRADE_CONFIG[UpgradePath.MULTI_TARGET].targets[multiTargetLevel - 1];
        }
      }

      // Validate existing targets
      const currentTargets = [
        { id: Target.entityId[turretEid], hasTarget: Target.hasTarget[turretEid] === 1 },
        { id: Target.entityId2[turretEid], hasTarget: Target.hasTarget2[turretEid] === 1 },
        { id: Target.entityId3[turretEid], hasTarget: Target.hasTarget3[turretEid] === 1 }
      ];

      const validTargets: number[] = [];
      for (let i = 0; i < Math.min(maxTargets, 3); i++) {
        if (currentTargets[i].hasTarget) {
          if (isValidTarget(world, currentTargets[i].id, turretX, turretY, range)) {
            validTargets.push(currentTargets[i].id);
          }
        }
      }

      // If we have enough valid targets, keep them
      if (validTargets.length >= maxTargets) {
        // Update target slots with valid targets
        setTargets(turretEid, validTargets);
        continue;
      }

      // Need to find more targets - query entities in range
      const candidates = spatialHash.query(turretX, turretY, range);
      const targetCandidates: Array<{ eid: number; distSq: number }> = [];

      for (const candidateEid of candidates) {
        // Skip self
        if (candidateEid === turretEid) continue;

        // Skip already targeted enemies
        if (validTargets.includes(candidateEid)) continue;

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

        // Skip if out of range
        if (distSq > range * range) continue;

        // Add to candidates
        targetCandidates.push({ eid: candidateEid, distSq });
      }

      // Sort candidates by distance (closest first)
      targetCandidates.sort((a, b) => a.distSq - b.distSq);

      // Fill valid targets with new candidates
      for (let i = 0; i < targetCandidates.length && validTargets.length < maxTargets; i++) {
        validTargets.push(targetCandidates[i].eid);
      }

      // Set targets (will clear unused slots)
      setTargets(turretEid, validTargets);
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

/**
 * Set target slots for a turret (up to 3 targets)
 * Clears unused slots
 */
function setTargets(turretEid: number, targets: number[]): void {
  // Set primary target
  if (targets.length > 0) {
    Target.entityId[turretEid] = targets[0];
    Target.hasTarget[turretEid] = 1;
  } else {
    Target.entityId[turretEid] = 0;
    Target.hasTarget[turretEid] = 0;
  }

  // Set secondary target
  if (targets.length > 1) {
    Target.entityId2[turretEid] = targets[1];
    Target.hasTarget2[turretEid] = 1;
  } else {
    Target.entityId2[turretEid] = 0;
    Target.hasTarget2[turretEid] = 0;
  }

  // Set tertiary target
  if (targets.length > 2) {
    Target.entityId3[turretEid] = targets[2];
    Target.hasTarget3[turretEid] = 1;
  } else {
    Target.entityId3[turretEid] = 0;
    Target.hasTarget3[turretEid] = 0;
  }
}

export type TargetingSystem = ReturnType<typeof createTargetingSystem>;
