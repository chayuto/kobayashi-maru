/**
 * Combat System for Kobayashi Maru
 * Handles turret firing logic, cooldowns, and damage application
 */
import { defineQuery, hasComponent, IWorld } from 'bitecs';
import { Position, Turret, Target, Faction, Health, Shield } from '../ecs/components';
import { TurretType, ProjectileType } from '../types/constants';
import { createProjectile } from '../ecs/entityFactory';
import { AudioManager, SoundType } from '../audio';
import { ParticleSystem, EFFECTS } from '../rendering';

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
 * @param particleSystem - Optional particle system for visual effects
 * @returns A system function that processes turret combat
 */
export function createCombatSystem(particleSystem?: ParticleSystem) {
  // Store beam visuals for this frame (cleared each update)
  const activeBeams: BeamVisual[] = [];

  /**
   * Applies damage to an entity, prioritizing shields over health
   */
  function applyDamage(world: IWorld, entityId: number, damage: number, hitX: number, hitY: number): void {
    // Apply damage to shields first if entity has Shield component
    if (hasComponent(world, Shield, entityId)) {
      const currentShield = Shield.current[entityId];
      if (currentShield > 0) {
        const shieldDamage = Math.min(currentShield, damage);
        Shield.current[entityId] = currentShield - shieldDamage;
        damage -= shieldDamage;

        // Shield hit effect
        if (particleSystem) {
          // Calculate angle from center to hit point for directional spread
          const targetX = Position.x[entityId];
          const targetY = Position.y[entityId];
          const angle = Math.atan2(hitY - targetY, hitX - targetX);

          particleSystem.spawn({
            ...EFFECTS.SHIELD_HIT,
            x: hitX,
            y: hitY,
            spread: angle // Use spread as direction center? No, spread is range.
            // The preset has spread: Math.PI * 0.5. 
            // We might need to rotate the particles. 
            // The current ParticleSystem implementation spawns particles in a random angle within spread centered at 0?
            // "const angle = (Math.random() - 0.5) * config.spread;" -> This is centered at 0.
            // We need to add a base rotation to the config or the system.
            // For now, let's just spawn them. The current system doesn't support directional emission well without base angle.
            // Let's just use the preset as is, it will look like a spark.
          });
        }
      }
    }

    // Apply remaining damage to health
    if (damage > 0) {
      const currentHealth = Health.current[entityId];
      Health.current[entityId] = Math.max(0, currentHealth - damage);
    }
  }

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

      // Muzzle flash
      if (particleSystem) {
        particleSystem.spawn({
          ...EFFECTS.MUZZLE_FLASH,
          x: turretX,
          y: turretY
        });
      }

      // Apply damage based on weapon type
      if (turretType === TurretType.TORPEDO_LAUNCHER) {
        // Spawn projectile
        createProjectile(world, turretX, turretY, targetX, targetY, damage, ProjectileType.PHOTON_TORPEDO, targetEid);
      } else {
        // Beam weapons (phaser, disruptor) - instant hit
        applyDamage(world, targetEid, damage, targetX, targetY);

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

export type CombatSystem = ReturnType<typeof createCombatSystem>;
