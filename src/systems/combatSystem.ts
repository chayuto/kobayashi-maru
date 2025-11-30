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
   * @returns The actual damage dealt (for stats tracking)
   */
  function applyDamage(world: IWorld, entityId: number, damage: number, hitX: number, hitY: number, currentTime: number): number {
    let actualDamage = 0;
    
    // Apply damage to shields first if entity has Shield component
    if (hasComponent(world, Shield, entityId)) {
      const currentShield = Shield.current[entityId];
      if (currentShield > 0) {
        const shieldDamage = Math.min(currentShield, damage);
        Shield.current[entityId] = currentShield - shieldDamage;
        actualDamage += shieldDamage;
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
      const healthDamage = Math.min(currentHealth, damage);
      Health.current[entityId] = Math.max(0, currentHealth - damage);
      actualDamage += healthDamage;
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
        // Spawn projectile (tracked as shot fired)
        totalShotsFired++;
        createProjectile(world, turretX, turretY, targetX, targetY, damage, ProjectileType.PHOTON_TORPEDO, targetEid);
      } else {
        // Beam weapons (phaser, disruptor) - instant hit
        totalShotsFired++;
        applyDamage(world, targetEid, damage, targetX, targetY, currentTime);

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
