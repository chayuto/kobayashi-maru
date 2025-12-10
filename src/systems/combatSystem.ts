/**
 * Combat System for Kobayashi Maru
 * Handles turret firing logic, cooldowns, and damage application
 */
import { query, hasComponent, World } from 'bitecs';
import { Position, Turret, Target, Faction, Health, Shield, WeaponProperties } from '../ecs/components';
import { TurretType, ProjectileType } from '../types/constants';
import { COMBAT_CONFIG } from '../config';
import { createProjectile } from '../ecs/entityFactory';
import { AudioManager, SoundType } from '../audio';
import { ParticleSystem, EFFECTS } from '../rendering';
import { applyBurning, applyDrained } from './statusEffectSystem';

/**
 * Beam segment for multi-segment beams with jitter
 */
export interface BeamSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  offset: number;  // Random perpendicular offset
}

/**
 * Beam visual data for rendering
 */
export interface BeamVisual {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  turretType: number;
  intensity: number;    // 0-1, for pulsing effect
  segments: BeamSegment[];
  age: number;          // Time since created (for animation)
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

// Beam generation constants (from centralized config)
const MIN_BEAM_LENGTH = COMBAT_CONFIG.BEAM.MIN_LENGTH;
const BEAM_SEGMENT_COUNT = COMBAT_CONFIG.BEAM.SEGMENT_COUNT;

/**
 * Generate beam segments with electricity jitter effect (private helper function)
 * @param startX - Beam start X coordinate
 * @param startY - Beam start Y coordinate
 * @param endX - Beam end X coordinate
 * @param endY - Beam end Y coordinate
 * @param turretType - Type of turret (affects jitter amount)
 * @returns Array of beam segments with perpendicular offsets
 */
function generateBeamSegments(startX: number, startY: number, endX: number, endY: number, turretType: number): BeamSegment[] {
  const segments: BeamSegment[] = [];

  // Jitter amount varies by weapon type
  let jitter = 8; // Default jitter
  if (turretType === TurretType.PHASER_ARRAY) {
    jitter = 6; // Less jitter for phasers
  } else if (turretType === TurretType.DISRUPTOR_BANK) {
    jitter = 10; // More jitter for disruptors
  } else if (turretType === TurretType.TETRYON_BEAM) {
    jitter = 12; // Even more jitter for tetryons
  } else if (turretType === TurretType.POLARON_BEAM) {
    jitter = 9; // Moderate jitter for polarons
  }

  // Calculate perpendicular vector for offset
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  // Handle zero-length beams
  if (length < MIN_BEAM_LENGTH) {
    return segments;
  }

  const perpX = -dy / length;
  const perpY = dx / length;

  for (let i = 0; i < BEAM_SEGMENT_COUNT; i++) {
    const t1 = i / BEAM_SEGMENT_COUNT;
    const t2 = (i + 1) / BEAM_SEGMENT_COUNT;

    // Interpolate along beam path
    const x1 = startX + dx * t1;
    const y1 = startY + dy * t1;
    const x2 = startX + dx * t2;
    const y2 = startY + dy * t2;

    // Add random offset (less at endpoints for smooth connection)
    // midFactor ranges from 0 at endpoints to 1 at beam center
    // This creates stronger jitter in the middle and smoother connections at the ends
    const midFactor = 1 - Math.abs(t1 - 0.5) * 2;
    const offset = (Math.random() - 0.5) * jitter * midFactor;

    segments.push({
      startX: x1 + perpX * offset,
      startY: y1 + perpY * offset,
      endX: x2 + perpX * offset,
      endY: y2 + perpY * offset,
      offset
    });
  }

  return segments;
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
  const DPS_WINDOW = COMBAT_CONFIG.STATS.DPS_WINDOW_SECONDS;

  /**
   * Applies damage to an entity, prioritizing shields over health
   * @param turretEid - The turret entity ID (for WeaponProperties)
   * @returns The actual damage dealt (for stats tracking)
   */
  function applyDamage(world: World, entityId: number, damage: number, hitX: number, hitY: number, currentTime: number, turretEid: number): number {
    let finalDamage = damage;

    // Check for weapon properties to modify damage
    if (hasComponent(world, turretEid, WeaponProperties)) {
      const hasShield = hasComponent(world, entityId, Shield) && Shield.current[entityId] > 0;

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
    if (hasComponent(world, entityId, Shield)) {
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
    if (hasComponent(world, turretEid, WeaponProperties)) {
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

  function combatSystem(world: World, _deltaTime: number, currentTime: number): World {
    // Clear beam visuals from last frame
    activeBeams.length = 0;

    const turrets = query(world, [Position, Turret, Target, Faction]);

    for (const turretEid of turrets) {
      // Collect all valid targets for this turret
      const activeTargets: number[] = [];

      if (Target.hasTarget[turretEid] === 1) {
        const targetEid = Target.entityId[turretEid];
        if (hasComponent(world, targetEid, Health) && Health.current[targetEid] > 0) {
          activeTargets.push(targetEid);
        } else {
          Target.hasTarget[turretEid] = 0;
        }
      }

      if (Target.hasTarget2[turretEid] === 1) {
        const targetEid2 = Target.entityId2[turretEid];
        if (hasComponent(world, targetEid2, Health) && Health.current[targetEid2] > 0) {
          activeTargets.push(targetEid2);
        } else {
          Target.hasTarget2[turretEid] = 0;
        }
      }

      if (Target.hasTarget3[turretEid] === 1) {
        const targetEid3 = Target.entityId3[turretEid];
        if (hasComponent(world, targetEid3, Health) && Health.current[targetEid3] > 0) {
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

          // Generate beam segments for electricity effect
          const segments = generateBeamSegments(turretX, turretY, targetX, targetY, turretType);

          // Store beam visual for rendering with animation properties
          activeBeams.push({
            startX: turretX,
            startY: turretY,
            endX: targetX,
            endY: targetY,
            turretType,
            intensity: 1.0,  // Full intensity when just fired
            segments,
            age: 0  // Just created
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
        if (!hasComponent(world, targetEid, Health) || Health.current[targetEid] <= 0) {
          Target.hasTarget[turretEid] = 0;
        }
      }
      if (Target.hasTarget2[turretEid] === 1) {
        const targetEid2 = Target.entityId2[turretEid];
        if (!hasComponent(world, targetEid2, Health) || Health.current[targetEid2] <= 0) {
          Target.hasTarget2[turretEid] = 0;
        }
      }
      if (Target.hasTarget3[turretEid] === 1) {
        const targetEid3 = Target.entityId3[turretEid];
        if (!hasComponent(world, targetEid3, Health) || Health.current[targetEid3] <= 0) {
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
