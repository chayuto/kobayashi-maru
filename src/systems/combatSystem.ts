/**
 * Combat System for Kobayashi Maru
 * Handles turret firing logic, cooldowns, and damage application
 */
import { query, hasComponent, World } from 'bitecs';
import { Position, Turret, Target, Faction, Health, Shield, WeaponProperties, EnemyVariant } from '../ecs/components';
import { TurretType, ProjectileType } from '../types/constants';
import { COMBAT_CONFIG, RENDERING_CONFIG, TURRET_DAMAGE_TYPE, FACTION_RESISTANCES } from '../config';
import { createProjectile } from '../ecs/entityFactory';
import { AudioManager, SoundType } from '../audio';
import { ParticleSystem, EFFECTS } from '../rendering';
import { applyBurning, applySlowed, applyDrained, applyDisabled } from './statusEffectSystem';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';

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
const DPS_WINDOW = COMBAT_CONFIG.STATS.DPS_WINDOW_SECONDS;

/**
 * Generate beam segments with electricity jitter effect
 */
function generateBeamSegments(startX: number, startY: number, endX: number, endY: number, turretType: number): BeamSegment[] {
  const segments: BeamSegment[] = [];

  // Jitter amount varies by weapon type
  let jitter: number = COMBAT_CONFIG.BEAM.JITTER.DEFAULT; // Default jitter
  if (turretType === TurretType.PHASER_ARRAY) {
    jitter = COMBAT_CONFIG.BEAM.JITTER.PHASER; // Less jitter for phasers
  } else if (turretType === TurretType.DISRUPTOR_BANK) {
    jitter = COMBAT_CONFIG.BEAM.JITTER.DISRUPTOR; // More jitter for disruptors
  } else if (turretType === TurretType.TETRYON_BEAM) {
    jitter = COMBAT_CONFIG.BEAM.JITTER.TETRYON; // Even more jitter for tetryons
  } else if (turretType === TurretType.POLARON_BEAM) {
    jitter = COMBAT_CONFIG.BEAM.JITTER.POLARON; // Moderate jitter for polarons
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
 * Combat System class
 * Handles turret firing, damage application, and combat statistics
 */
export class CombatSystem {
  private particleSystem?: ParticleSystem;
  private activeBeams: BeamVisual[] = [];

  // Combat statistics
  private totalDamageDealt = 0;
  private totalShotsFired = 0;
  private shotsHit = 0;
  private damageHistory: { time: number; damage: number }[] = [];

  constructor(particleSystem?: ParticleSystem) {
    this.particleSystem = particleSystem;
  }

  /**
   * Main update method - processes turret combat
   */
  update(world: World, _deltaTime: number, currentTime: number): World {
    // Clear beam visuals from last frame
    this.activeBeams.length = 0;

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

      const cooldown = 1 / fireRate;
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
      if (this.particleSystem) {
        this.particleSystem.spawn({
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
          this.totalShotsFired++;
          createProjectile(world, turretX, turretY, targetX, targetY, damage, ProjectileType.PHOTON_TORPEDO, targetEid);
        } else {
          // Beam weapons - instant hit
          this.totalShotsFired++;
          this.applyDamage(world, targetEid, damage, targetX, targetY, currentTime, turretEid);

          // Generate beam segments for electricity effect
          const segments = generateBeamSegments(turretX, turretY, targetX, targetY, turretType);

          // Store beam visual for rendering with animation properties
          this.activeBeams.push({
            startX: turretX,
            startY: turretY,
            endX: targetX,
            endY: targetY,
            turretType,
            intensity: 1.0,
            segments,
            age: 0
          });
        }
      }

      // Play sound
      const audioManager = AudioManager.getInstance();
      switch (turretType) {
        case TurretType.PHASER_ARRAY:
          audioManager.play(SoundType.PHASER_FIRE, { volume: COMBAT_CONFIG.AUDIO_VOLUMES.PHASER });
          break;
        case TurretType.TORPEDO_LAUNCHER:
          audioManager.play(SoundType.TORPEDO_FIRE, { volume: COMBAT_CONFIG.AUDIO_VOLUMES.TORPEDO });
          break;
        case TurretType.DISRUPTOR_BANK:
          audioManager.play(SoundType.DISRUPTOR_FIRE, { volume: COMBAT_CONFIG.AUDIO_VOLUMES.DISRUPTOR });
          break;
        case TurretType.TETRYON_BEAM:
          audioManager.play(SoundType.TETRYON_FIRE, { volume: COMBAT_CONFIG.AUDIO_VOLUMES.TETRYON });
          break;
        case TurretType.PLASMA_CANNON:
          audioManager.play(SoundType.PLASMA_FIRE, { volume: COMBAT_CONFIG.AUDIO_VOLUMES.PLASMA });
          break;
        case TurretType.POLARON_BEAM:
          audioManager.play(SoundType.POLARON_FIRE, { volume: COMBAT_CONFIG.AUDIO_VOLUMES.POLARON });
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
   * Applies damage to an entity, prioritizing shields over health
   */
  private applyDamage(world: World, entityId: number, damage: number, hitX: number, hitY: number, currentTime: number, turretEid: number): number {
    let finalDamage = damage;

    // Apply faction resistance based on damage type
    const turretType = Turret.turretType[turretEid];
    const damageType = TURRET_DAMAGE_TYPE[turretType];
    if (damageType !== undefined && hasComponent(world, entityId, Faction)) {
      const factionId = Faction.id[entityId];
      const resistances = FACTION_RESISTANCES[factionId];
      if (resistances) {
        const resistMult = resistances[damageType] ?? 1.0;
        finalDamage *= resistMult;
      }
    }

    // Check for weapon properties to modify damage
    if (hasComponent(world, turretEid, WeaponProperties)) {
      const hasShield = hasComponent(world, entityId, Shield) && Shield.current[entityId] > 0;

      if (hasShield) {
        const shieldMult = WeaponProperties.shieldDamageMultiplier[turretEid] || 1.0;
        finalDamage *= shieldMult;
      } else {
        const hullMult = WeaponProperties.hullDamageMultiplier[turretEid] || 1.0;
        finalDamage *= hullMult;
      }
    }

    let actualDamage = 0;
    let shieldAbsorbed = false;

    // Apply damage to shields first if entity has Shield component
    if (hasComponent(world, entityId, Shield)) {
      const currentShield = Shield.current[entityId];
      if (currentShield > 0) {
        const shieldDamage = Math.min(currentShield, finalDamage);
        Shield.current[entityId] = currentShield - shieldDamage;
        actualDamage += shieldDamage;
        finalDamage -= shieldDamage;
        shieldAbsorbed = true;

        // Shield hit effect
        if (this.particleSystem) {
          const targetX = Position.x[entityId];
          const targetY = Position.y[entityId];
          const angle = Math.atan2(hitY - targetY, hitX - targetX);

          this.particleSystem.spawn({
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
          applyBurning(world, entityId, COMBAT_CONFIG.STATUS_EFFECTS.BURNING.DAMAGE_PER_TICK, COMBAT_CONFIG.STATUS_EFFECTS.BURNING.DURATION);
        } else if (statusType === 2) {
          applySlowed(world, entityId, COMBAT_CONFIG.STATUS_EFFECTS.SLOW.PERCENT, COMBAT_CONFIG.STATUS_EFFECTS.SLOW.DURATION); // 30% slow for 3 seconds
        } else if (statusType === 3) {
          applyDrained(world, entityId, COMBAT_CONFIG.STATUS_EFFECTS.DRAIN.DURATION);
        } else if (statusType === 4) {
          applyDisabled(world, entityId, COMBAT_CONFIG.STATUS_EFFECTS.DISABLE.DURATION, COMBAT_CONFIG.STATUS_EFFECTS.DISABLE.SYSTEMS); // 2s weapon disable
        }
      }
    }

    // Track stats
    this.totalDamageDealt += actualDamage;
    this.shotsHit++;
    this.damageHistory.push({ time: currentTime, damage: actualDamage });

    // Clean up old damage history entries
    this.damageHistory = this.damageHistory.filter(entry => currentTime - entry.time < DPS_WINDOW);

    // Emit damage dealt event for visual feedback (damage numbers)
    // Filter to significant hits only to reduce visual noise
    if (actualDamage > 0) {
      const isSignificant = actualDamage >= RENDERING_CONFIG.DAMAGE_NUMBERS.CRITICAL_THRESHOLD
        || shieldAbsorbed
        || (hasComponent(world, entityId, EnemyVariant) && EnemyVariant.rank[entityId] >= 1);

      if (isSignificant) {
        EventBus.getInstance().emit(GameEventType.DAMAGE_DEALT, {
          entityId,
          damage: actualDamage,
          isShield: shieldAbsorbed && finalDamage <= 0,
          x: hitX,
          y: hitY
        });
      }
    }

    return actualDamage;
  }

  /**
   * Get active beam visuals for rendering
   */
  getActiveBeams(): BeamVisual[] {
    return this.activeBeams;
  }

  /**
   * Get current combat statistics
   */
  getStats(): CombatStats {
    const recentDamage = this.damageHistory.reduce((sum, entry) => sum + entry.damage, 0);
    const dps = recentDamage / DPS_WINDOW;

    return {
      totalDamageDealt: this.totalDamageDealt,
      totalShotsFired: this.totalShotsFired,
      shotsHit: this.shotsHit,
      dps,
      accuracy: this.totalShotsFired > 0 ? this.shotsHit / this.totalShotsFired : 0
    };
  }

  /**
   * Reset all combat statistics (for game restart)
   */
  resetStats(): void {
    this.totalDamageDealt = 0;
    this.totalShotsFired = 0;
    this.shotsHit = 0;
    this.damageHistory = [];
  }

  /**
   * Record a projectile hit for stats tracking
   * Called by projectile system when a projectile hits a target
   */
  recordProjectileHit(damage: number, currentTime: number): void {
    this.totalDamageDealt += damage;
    this.shotsHit++;
    this.damageHistory.push({ time: currentTime, damage });
    this.damageHistory = this.damageHistory.filter(entry => currentTime - entry.time < DPS_WINDOW);
  }
}

/**
 * Legacy factory function for backward compatibility
 * @deprecated Use `new CombatSystem(particleSystem)` instead
 */
export function createCombatSystem(particleSystem?: ParticleSystem) {
  const system = new CombatSystem(particleSystem);
  return {
    update: system.update.bind(system),
    getActiveBeams: system.getActiveBeams.bind(system),
    getStats: system.getStats.bind(system),
    resetStats: system.resetStats.bind(system),
    recordProjectileHit: system.recordProjectileHit.bind(system)
  };
}
