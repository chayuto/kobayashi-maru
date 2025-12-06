/**
 * Combat System for Kobayashi Maru
 * Handles turret firing logic, cooldowns, and damage application
 */
import { defineQuery, hasComponent, IWorld } from 'bitecs';
import { Position, Turret, Target, Faction, Health, Shield, WeaponProperties } from '../ecs/components';
import { TurretType, ProjectileType } from '../types/constants';
import { createProjectile } from '../ecs/entityFactory';
import { AudioManager, SoundType } from '../audio';
import { ParticleSystem, EFFECTS } from '../rendering';
import { applyBurning, applyDrained } from './statusEffectSystem';

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
 * Combat statistics for HUD display
 */
export interface CombatStats {
  totalDamageDealt: number;
  totalShotsFired: number;
  shotsHit: number;
  dps: number;
  accuracy: number;
}

/**
 * Creates the combat system that handles turret firing
 * @param particleSystem - Optional particle system for visual effects
 * @returns A system function that processes turret combat
 */
export function createCombatSystem(particleSystem?: ParticleSystem) {
  // Store beam visuals for this frame (cleared each update)
  const activeBeams: BeamVisual[] = [];

  // Combat statistics tracking
  let totalDamageDealt = 0;
  let totalShotsFired = 0;
  let shotsHit = 0;
  let damageHistory: { time: number; damage: number }[] = [];
  const DPS_WINDOW = 5; // Calculate DPS over 5 seconds

  /**
   * Applies damage to an entity, prioritizing shields over health
   * @param turretEid - The turret entity ID (for WeaponProperties)
   * @returns The actual damage dealt (for stats tracking)
   */
  function applyDamage(world: IWorld, entityId: number, damage: number, hitX: number, hitY: number, currentTime: number, turretEid: number): number {
    let finalDamage = damage;

    // Check for weapon properties to modify damage
    if (hasComponent(world, WeaponProperties, turretEid)) {
      const hasShield = hasComponent(world, Shield, entityId) && Shield.current[entityId] > 0;

      if (hasShield) {
        // Apply shield damage multiplier
        const shieldMult = WeaponProperties.shieldDamageMultiplier[turretEid] || 1.0;
        finalDamage *= shieldMult;
      } else {
        // Apply hull damage multiplier
        const hullMult = WeaponProperties.hullDamageMultiplier[turretEid] || 1.0;
        finalDamage *= hullMult;
      }
    }

    let actualDamage = 0;

    // Apply damage to shields first if entity has Shield component
    if (hasComponent(world, Shield, entityId)) {
      const currentShield = Shield.current[entityId];
      if (currentShield > 0) {
        const shieldDamage = Math.min(currentShield, finalDamage);
        Shield.current[entityId] = currentShield - shieldDamage;
        actualDamage += shieldDamage;
        finalDamage -= shieldDamage;

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
            spread: angle
          });
        }
      }
    }

    // Apply remaining damage to health
    if (finalDamage > 0) {
      const currentHealth = Health.current[entityId];
      const healthDamage = Math.min(currentHealth, finalDamage);
      Health.current[entityId] = Math.max(0, currentHealth - finalDamage);
      actualDamage += healthDamage;
    }

    // Apply status effects if weapon has them
    if (hasComponent(world, WeaponProperties, turretEid)) {
      const statusType = WeaponProperties.statusEffectType[turretEid];
      const statusChance = WeaponProperties.statusEffectChance[turretEid];

      if (statusType > 0 && Math.random() < statusChance) {
        if (statusType === 1) {
          // Burning: 4 dmg/sec for 5 seconds
          applyBurning(world, entityId, 4.0, 5.0);
        } else if (statusType === 3) {
          // Drain: 3 second duration per stack
          applyDrained(world, entityId, 3.0);
        }
      }
    }

    // Track stats
    totalDamageDealt += actualDamage;
    shotsHit++;
    damageHistory.push({ time: currentTime, damage: actualDamage });

    // Clean up old damage history entries (keep only last DPS_WINDOW seconds)
    damageHistory = damageHistory.filter(entry => currentTime - entry.time < DPS_WINDOW);

    return actualDamage;
  }

  function combatSystem(world: IWorld, _deltaTime: number, currentTime: number): IWorld {
    // Clear beam visuals from last frame
    activeBeams.length = 0;

    const turrets = combatQuery(world);

    for (const turretEid of turrets) {
      // Collect all valid targets for this turret
      const activeTargets: number[] = [];
      
      if (Target.hasTarget[turretEid] === 1) {
        const targetEid = Target.entityId[turretEid];
        if (hasComponent(world, Health, targetEid) && Health.current[targetEid] > 0) {
          activeTargets.push(targetEid);
        } else {
          Target.hasTarget[turretEid] = 0;
        }
      }
      
      if (Target.hasTarget2[turretEid] === 1) {
        const targetEid2 = Target.entityId2[turretEid];
        if (hasComponent(world, Health, targetEid2) && Health.current[targetEid2] > 0) {
          activeTargets.push(targetEid2);
        } else {
          Target.hasTarget2[turretEid] = 0;
        }
      }
      
      if (Target.hasTarget3[turretEid] === 1) {
        const targetEid3 = Target.entityId3[turretEid];
        if (hasComponent(world, Health, targetEid3) && Health.current[targetEid3] > 0) {
          activeTargets.push(targetEid3);
        } else {
          Target.hasTarget3[turretEid] = 0;
        }
      }
      
      // Skip if no valid targets
      if (activeTargets.length === 0) continue;

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

      // Ready to fire at all targets!
      const turretX = Position.x[turretEid];
      const turretY = Position.y[turretEid];
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

      // Fire at each target
      for (const targetEid of activeTargets) {
        const targetX = Position.x[targetEid];
        const targetY = Position.y[targetEid];

        // Apply damage based on weapon type
        if (turretType === TurretType.TORPEDO_LAUNCHER) {
          // Spawn projectile (tracked as shot fired)
          totalShotsFired++;
          createProjectile(world, turretX, turretY, targetX, targetY, damage, ProjectileType.PHOTON_TORPEDO, targetEid);
        } else {
          // Beam weapons - instant hit
          totalShotsFired++;
          applyDamage(world, targetEid, damage, targetX, targetY, currentTime, turretEid);

          // Store beam visual for rendering
          activeBeams.push({
            startX: turretX,
            startY: turretY,
            endX: targetX,
            endY: targetY,
            turretType
          });
        }
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
        case TurretType.TETRYON_BEAM:
          audioManager.play(SoundType.PHASER_FIRE, { volume: 0.45 }); // Similar to phaser
          break;
        case TurretType.PLASMA_CANNON:
          audioManager.play(SoundType.TORPEDO_FIRE, { volume: 0.55 }); // Similar to torpedo
          break;
        case TurretType.POLARON_BEAM:
          audioManager.play(SoundType.DISRUPTOR_FIRE, { volume: 0.48 }); // Similar to disruptor
          break;
      }

      // Update last fired time
      Turret.lastFired[turretEid] = currentTime;

      // Check if any targets were killed and clear their flags
      if (Target.hasTarget[turretEid] === 1) {
        const targetEid = Target.entityId[turretEid];
        if (!hasComponent(world, Health, targetEid) || Health.current[targetEid] <= 0) {
          Target.hasTarget[turretEid] = 0;
        }
      }
      if (Target.hasTarget2[turretEid] === 1) {
        const targetEid2 = Target.entityId2[turretEid];
        if (!hasComponent(world, Health, targetEid2) || Health.current[targetEid2] <= 0) {
          Target.hasTarget2[turretEid] = 0;
        }
      }
      if (Target.hasTarget3[turretEid] === 1) {
        const targetEid3 = Target.entityId3[turretEid];
        if (!hasComponent(world, Health, targetEid3) || Health.current[targetEid3] <= 0) {
          Target.hasTarget3[turretEid] = 0;
        }
      }
    }

    return world;
  }

  /**
   * Get current combat statistics
   */
  function getStats(): CombatStats {
    // Calculate DPS from damage history
    const recentDamage = damageHistory.reduce((sum, entry) => sum + entry.damage, 0);
    // Use the full DPS_WINDOW or actual elapsed time, whichever gives meaningful results
    const dps = recentDamage / DPS_WINDOW;

    return {
      totalDamageDealt,
      totalShotsFired,
      shotsHit,
      dps,
      accuracy: totalShotsFired > 0 ? shotsHit / totalShotsFired : 0
    };
  }

  /**
   * Reset all combat statistics (for game restart)
   */
  function resetStats(): void {
    totalDamageDealt = 0;
    totalShotsFired = 0;
    shotsHit = 0;
    damageHistory = [];
  }

  /**
   * Record a projectile hit for stats tracking
   * Called by projectile system when a projectile hits a target
   */
  function recordProjectileHit(damage: number, currentTime: number): void {
    totalDamageDealt += damage;
    shotsHit++;
    damageHistory.push({ time: currentTime, damage });
    // Clean up old entries
    damageHistory = damageHistory.filter(entry => currentTime - entry.time < DPS_WINDOW);
  }

  return {
    update: combatSystem,
    getActiveBeams: () => activeBeams,
    getStats,
    resetStats,
    recordProjectileHit
  };
}

export type CombatSystem = ReturnType<typeof createCombatSystem>;
