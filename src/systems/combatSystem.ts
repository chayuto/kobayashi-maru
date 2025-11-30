/**
 * Combat System for Kobayashi Maru
 * Handles turret firing logic, cooldowns, and damage application
 */
import { defineQuery, hasComponent, IWorld } from 'bitecs';
import { Position, Turret, Target, Faction, Health, Shield } from '../ecs/components';
import { TurretType } from '../types/constants';
import { AudioManager, SoundType } from '../audio';

// Query for turrets with targets
const combatQuery = defineQuery([Position, Turret, Target, Faction]);

/**
 * Beam visual data for rendering
 */
export interface BeamVisual {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  turretType: number;
}

/**
 * Creates the combat system that handles turret firing
 * @returns A system function that processes turret combat
 */
export function createCombatSystem() {
  // Store beam visuals for this frame (cleared each update)
  const activeBeams: BeamVisual[] = [];

  function combatSystem(world: IWorld, _deltaTime: number, currentTime: number): IWorld {
    // Clear beam visuals from last frame
    activeBeams.length = 0;

    const turrets = combatQuery(world);

    for (const turretEid of turrets) {
      // Skip if no valid target
      if (Target.hasTarget[turretEid] !== 1) continue;

      const targetEid = Target.entityId[turretEid];

      // Validate target still exists and has health
      if (!hasComponent(world, Health, targetEid)) {
        Target.hasTarget[turretEid] = 0;
        continue;
      }

      if (Health.current[targetEid] <= 0) {
        Target.hasTarget[turretEid] = 0;
        continue;
      }

      // Check fire rate cooldown
      const fireRate = Turret.fireRate[turretEid];

      // Skip if fire rate is invalid (0 or negative)
      if (fireRate <= 0) {
        continue;
      }

      const cooldown = 1 / fireRate; // Convert shots per second to seconds between shots
      const lastFired = Turret.lastFired[turretEid];

      if (currentTime - lastFired < cooldown) {
        continue; // Still on cooldown
      }

      // Ready to fire!
      const turretX = Position.x[turretEid];
      const turretY = Position.y[turretEid];
      const targetX = Position.x[targetEid];
      const targetY = Position.y[targetEid];
      const damage = Turret.damage[turretEid];
      const turretType = Turret.turretType[turretEid];

      // Apply damage based on weapon type
      if (turretType === TurretType.TORPEDO_LAUNCHER) {
        // Projectile weapons - TODO: spawn projectile entity
        // For now, instant hit with damage
        applyDamage(world, targetEid, damage);
      } else {
        // Beam weapons (phaser, disruptor) - instant hit
        applyDamage(world, targetEid, damage);

        // Store beam visual for rendering
        activeBeams.push({
          startX: turretX,
          startY: turretY,
          endX: targetX,
          endY: targetY,
          turretType
        });
      }

      // Play sound
      const audioManager = AudioManager.getInstance();
      switch (turretType) {
        case TurretType.PHASER_ARRAY:
          audioManager.play(SoundType.PHASER_FIRE, { volume: 0.4 });
          break;
        case TurretType.TORPEDO_LAUNCHER:
          audioManager.play(SoundType.TORPEDO_FIRE, { volume: 0.6 });
          break;
        case TurretType.DISRUPTOR_BANK:
          audioManager.play(SoundType.DISRUPTOR_FIRE, { volume: 0.5 });
          break;
      }

      // Update last fired time
      Turret.lastFired[turretEid] = currentTime;

      // Check if target was killed
      if (Health.current[targetEid] <= 0) {
        Target.hasTarget[turretEid] = 0;
      }
    }

    return world;
  }

  return {
    update: combatSystem,
    getActiveBeams: () => activeBeams
  };
}

/**
 * Applies damage to an entity, prioritizing shields over health
 */
function applyDamage(world: IWorld, entityId: number, damage: number): void {
  // Apply damage to shields first if entity has Shield component
  if (hasComponent(world, Shield, entityId)) {
    const currentShield = Shield.current[entityId];
    if (currentShield > 0) {
      const shieldDamage = Math.min(currentShield, damage);
      Shield.current[entityId] = currentShield - shieldDamage;
      damage -= shieldDamage;
    }
  }

  // Apply remaining damage to health
  if (damage > 0) {
    const currentHealth = Health.current[entityId];
    Health.current[entityId] = Math.max(0, currentHealth - damage);
  }
}

export type CombatSystem = ReturnType<typeof createCombatSystem>;
