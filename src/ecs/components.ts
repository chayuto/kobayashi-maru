/**
 * ECS Components for Kobayashi Maru
 * Using bitecs for high-performance entity management
 */
import { defineComponent, Types } from 'bitecs';

// Position component - stores x, y coordinates
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// Velocity component - stores movement direction and speed
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// Faction component - identifies which faction an entity belongs to
export const Faction = defineComponent({
  id: Types.ui8
});

// SpriteRef component - reference to the sprite index in the particle container
export const SpriteRef = defineComponent({
  index: Types.ui32
});

// Health component - stores current and max health
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32
});

// Shield component - stores shield values
export const Shield = defineComponent({
  current: Types.f32,
  max: Types.f32
});

// Collider component - stores collision data for spatial hashing
export const Collider = defineComponent({
  radius: Types.f32,     // Collision radius for the entity
  layer: Types.ui8,      // Collision layer (enemies, projectiles, etc.)
  mask: Types.ui8        // Which layers this entity collides with
});

// Turret component - stores turret combat data
export const Turret = defineComponent({
  range: Types.f32,      // Targeting range in pixels
  fireRate: Types.f32,   // Shots per second
  damage: Types.f32,     // Damage per shot
  lastFired: Types.f32,  // Timestamp of last shot (in seconds)
  turretType: Types.ui8  // Type of turret (phaser, torpedo, disruptor)
});

// Target component - stores current target(s) for turrets
// Supports up to 3 targets for multi-target upgrades
export const Target = defineComponent({
  entityId: Types.ui32,    // Primary target entity ID
  hasTarget: Types.ui8,    // 0/1 flag indicating if primary target is valid
  entityId2: Types.ui32,   // Secondary target entity ID (multi-target upgrade)
  hasTarget2: Types.ui8,   // 0/1 flag for secondary target
  entityId3: Types.ui32,   // Tertiary target entity ID (multi-target upgrade level 2)
  hasTarget3: Types.ui8    // 0/1 flag for tertiary target
});

// AI Behavior component - stores AI state and configuration
export const AIBehavior = defineComponent({
  behaviorType: Types.ui8,    // Behavior pattern (0=direct, 1=strafe, 2=flank, etc.)
  stateTimer: Types.f32,      // Timer for state changes
  targetX: Types.f32,         // Intermediate target X
  targetY: Types.f32,         // Intermediate target Y
  aggression: Types.f32       // How aggressively to pursue (0-1)
});

// Projectile component - for torpedoes and other moving weapons
export const Projectile = defineComponent({
  damage: Types.f32,        // Damage on impact
  speed: Types.f32,         // Pixels per second
  lifetime: Types.f32,      // Max seconds before despawn
  targetEntityId: Types.ui32, // Target entity (for homing, optional)
  projectileType: Types.ui8 // Type (torpedo, etc.)
});

// EnemyWeapon component - for enemies that can shoot projectiles
export const EnemyWeapon = defineComponent({
  range: Types.f32,        // Range at which enemy can shoot
  fireRate: Types.f32,     // Shots per second
  damage: Types.f32,       // Damage per shot
  lastFired: Types.f32,    // Timestamp of last shot (in seconds)
  projectileType: Types.ui8 // Type of projectile (uses ProjectileType)
});

// ============================================================================
// STATUS EFFECT COMPONENTS
// ============================================================================

/**
 * Burning status - DOT damage over time
 * Used by: Plasma Cannon
 */
export const BurningStatus = defineComponent({
  damagePerTick: Types.f32,    // Damage dealt per tick
  ticksRemaining: Types.ui8,   // Number of ticks left
  tickInterval: Types.f32,     // Time between ticks (seconds)
  lastTickTime: Types.f32      // Last time damage was applied
});

/**
 * Slowed status - Reduces movement speed
 * Used by: Chroniton Torpedo, Polaron Beam
 */
export const SlowedStatus = defineComponent({
  slowPercent: Types.f32,      // 0.0 to 1.0 (0.5 = 50% slow)
  duration: Types.f32,         // Time remaining (seconds)
  originalSpeed: Types.f32     // Speed before slow applied
});

/**
 * Drained status - Stacking power drain
 * Used by: Polaron Beam Emitter
 */
export const DrainedStatus = defineComponent({
  stacks: Types.ui8,           // 0-3 stacks
  duration: Types.f32          // Time remaining per stack
});

/**
 * Disabled status - Systems offline
 * Used by: Phaser Array (5% chance)
 */
export const DisabledStatus = defineComponent({
  duration: Types.f32,         // Time remaining (seconds)
  disabledSystems: Types.ui8   // Bitfield: 1=weapons, 2=engines, 4=shields
});

// ============================================================================
// WEAPON PROPERTY COMPONENTS
// ============================================================================

/**
 * Extended weapon properties for special mechanics
 * Attached to turret entities
 */
export const WeaponProperties = defineComponent({
  shieldDamageMultiplier: Types.f32,  // Damage multiplier vs shields (default 1.0)
  hullDamageMultiplier: Types.f32,    // Damage multiplier vs hull (default 1.0)
  critChance: Types.f32,              // Critical hit chance 0.0-1.0
  critMultiplier: Types.f32,          // Critical damage multiplier (default 2.0)
  aoeRadius: Types.f32,               // AOE explosion radius (0 = no AOE)
  statusEffectType: Types.ui8,        // 0=none, 1=burn, 2=slow, 3=drain, 4=disable
  statusEffectChance: Types.f32       // Chance to apply status 0.0-1.0
});

/**
 * TurretUpgrade component - tracks upgrade state for turrets
 * Each turret can be upgraded through multiple paths
 */
export const TurretUpgrade = defineComponent({
  damageLevel: Types.ui8,      // Damage upgrade level (0-3)
  rangeLevel: Types.ui8,       // Range upgrade level (0-3)
  fireRateLevel: Types.ui8,    // Fire rate upgrade level (0-3)
  multiTargetLevel: Types.ui8, // Multi-target upgrade level (0-2, enables multiple targets)
  specialLevel: Types.ui8      // Special ability upgrade level (0-3, turret-specific)
});

