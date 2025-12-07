/**
 * ECS Components for Kobayashi Maru
 * 
 * Components are data containers used by the Entity-Component-System architecture.
 * Each component is defined using bitecs which stores data in typed arrays for
 * high performance. Components do not contain logic - that belongs in systems.
 * 
 * ## Usage Pattern
 * ```typescript
 * import { Position, Health } from '../ecs/components';
 * 
 * // Access component data for an entity
 * const x = Position.x[entityId];
 * const currentHealth = Health.current[entityId];
 * 
 * // Modify component data
 * Position.x[entityId] = 100;
 * Health.current[entityId] -= damage;
 * ```
 * 
 * @module components
 * @see {@link https://github.com/NateTheGreatt/bitecs} bitECS documentation
 */
import { defineComponent, Types } from 'bitecs';

/**
 * Position component for entity world coordinates.
 * 
 * All entities with visual representation must have Position.
 * Coordinates are in pixels, with (0,0) at top-left of the world.
 * 
 * @property x - Horizontal position (0 to GAME_CONFIG.WORLD_WIDTH, typically 1920)
 * @property y - Vertical position (0 to GAME_CONFIG.WORLD_HEIGHT, typically 1080)
 * 
 * @example
 * ```typescript
 * // Move an entity to the center of the screen
 * Position.x[entityId] = 960;
 * Position.y[entityId] = 540;
 * ```
 */
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

/**
 * Velocity component for movement direction and speed.
 * 
 * The movement system multiplies velocity by delta time each frame
 * to update Position. Units are pixels per second.
 * 
 * @property x - Horizontal velocity (positive = right, negative = left)
 * @property y - Vertical velocity (positive = down, negative = up)
 * 
 * @example
 * ```typescript
 * // Move right at 100 pixels per second
 * Velocity.x[entityId] = 100;
 * Velocity.y[entityId] = 0;
 * 
 * // Move toward a target
 * const dx = targetX - Position.x[entityId];
 * const dy = targetY - Position.y[entityId];
 * const distance = Math.sqrt(dx * dx + dy * dy);
 * Velocity.x[entityId] = (dx / distance) * speed;
 * Velocity.y[entityId] = (dy / distance) * speed;
 * ```
 */
export const Velocity = defineComponent({
  x: Types.f32,
  y: Types.f32
});

/**
 * Faction component identifying which team an entity belongs to.
 * 
 * Used by targeting, combat, and collision systems to determine
 * friend/foe relationships. See FactionId enum in constants.ts.
 * 
 * @property id - Faction identifier (use FactionId enum values)
 * 
 * @example
 * ```typescript
 * import { FactionId } from '../types/constants';
 * 
 * Faction.id[entityId] = FactionId.KLINGON;  // Enemy faction
 * Faction.id[turretId] = FactionId.FEDERATION;  // Friendly faction
 * 
 * // Check if entity is hostile
 * const isEnemy = Faction.id[entityId] !== FactionId.FEDERATION;
 * ```
 */
export const Faction = defineComponent({
  id: Types.ui8
});

/**
 * SpriteRef component linking entity to visual representation.
 * 
 * The render system uses this to manage sprite creation and updates.
 * The index is managed by SpriteManager and should not be set directly.
 * 
 * @property index - Sprite index in the particle container (managed by SpriteManager)
 */
export const SpriteRef = defineComponent({
  index: Types.ui32
});

/**
 * Health component for entity hit points.
 * 
 * When current reaches 0, the entity is considered destroyed.
 * The damage system subtracts from Health after shields are depleted.
 * 
 * @property current - Current health points (0 to max)
 * @property max - Maximum health points
 * 
 * @example
 * ```typescript
 * // Apply damage (should use damage system instead of direct modification)
 * const damage = 25;
 * Health.current[entityId] = Math.max(0, Health.current[entityId] - damage);
 * 
 * // Check if entity is dead
 * const isDead = Health.current[entityId] <= 0;
 * 
 * // Get health percentage
 * const healthPercent = Health.current[entityId] / Health.max[entityId];
 * ```
 */
export const Health = defineComponent({
  current: Types.f32,
  max: Types.f32
});

/**
 * Shield component for damage absorption.
 * 
 * Shields absorb damage before health. When shields reach 0,
 * remaining damage is applied to health. Shields do not regenerate
 * automatically in the current implementation.
 * 
 * @property current - Current shield points (0 to max)
 * @property max - Maximum shield points
 * 
 * @example
 * ```typescript
 * // Check if shields are up
 * const hasShields = Shield.current[entityId] > 0;
 * 
 * // Apply damage to shields first
 * const shieldDamage = Math.min(damage, Shield.current[entityId]);
 * Shield.current[entityId] -= shieldDamage;
 * const remainingDamage = damage - shieldDamage;
 * ```
 */
export const Shield = defineComponent({
  current: Types.f32,
  max: Types.f32
});

/**
 * Collider component for collision detection.
 * 
 * Used by the spatial hash for efficient broad-phase collision detection.
 * The layer/mask system allows selective collision between entity types.
 * 
 * @property radius - Collision circle radius in pixels
 * @property layer - Collision layer this entity occupies (0-7)
 * @property mask - Bitmask of layers this entity collides with
 * 
 * @example
 * ```typescript
 * // Configure an enemy collider
 * Collider.radius[entityId] = 20;
 * Collider.layer[entityId] = 1;  // Enemy layer
 * Collider.mask[entityId] = 0b00000101;  // Collides with layers 0 and 2
 * ```
 */
export const Collider = defineComponent({
  radius: Types.f32,
  layer: Types.ui8,
  mask: Types.ui8
});

/**
 * Turret component for defensive weapons.
 * 
 * Turrets automatically target and fire at enemies within range.
 * The combat system handles firing logic and damage application.
 * 
 * @property range - Maximum targeting distance in pixels (150-400 typical)
 * @property fireRate - Shots per second (0.5 to 4 typical)
 * @property damage - Damage dealt per shot (10-50 typical)
 * @property lastFired - Game time of last shot (updated by combat system)
 * @property turretType - Type identifier (use TurretType enum)
 * 
 * @see TurretType in constants.ts for available turret types
 */
export const Turret = defineComponent({
  range: Types.f32,
  fireRate: Types.f32,
  damage: Types.f32,
  lastFired: Types.f32,
  turretType: Types.ui8
});

/**
 * Target component for tracking attack targets.
 * 
 * Supports up to 3 simultaneous targets for multi-target upgrades.
 * The targeting system populates these, combat system uses them.
 * 
 * @property entityId - Primary target entity ID (0 if no target)
 * @property hasTarget - 0/1 flag: 1 if primary target is valid
 * @property entityId2 - Secondary target (multi-target upgrade level 1)
 * @property hasTarget2 - 0/1 flag for secondary target
 * @property entityId3 - Tertiary target (multi-target upgrade level 2)
 * @property hasTarget3 - 0/1 flag for tertiary target
 */
export const Target = defineComponent({
  entityId: Types.ui32,
  hasTarget: Types.ui8,
  entityId2: Types.ui32,
  hasTarget2: Types.ui8,
  entityId3: Types.ui32,
  hasTarget3: Types.ui8
});

/**
 * AI Behavior component for enemy movement patterns.
 * 
 * The AI system updates entity velocity based on behavior type.
 * Each behavior type has unique movement logic (see aiSystem.ts).
 * 
 * @property behaviorType - Movement pattern (use AIBehaviorType enum)
 * @property stateTimer - Time in current state (for state machine transitions)
 * @property targetX - Intermediate navigation target X
 * @property targetY - Intermediate navigation target Y
 * @property aggression - Movement speed/chase factor (0.0 to 1.0)
 * 
 * @see AIBehaviorType in constants.ts: DIRECT, STRAFE, ORBIT, SWARM, HUNTER
 */
export const AIBehavior = defineComponent({
  behaviorType: Types.ui8,
  stateTimer: Types.f32,
  targetX: Types.f32,
  targetY: Types.f32,
  aggression: Types.f32
});

/**
 * Projectile component for moving weapons (torpedoes, bolts, etc).
 * 
 * Projectiles move toward their target and deal damage on collision.
 * The projectile system handles movement and lifetime management.
 * 
 * @property damage - Damage dealt on impact
 * @property speed - Movement speed in pixels per second
 * @property lifetime - Seconds remaining before auto-despawn
 * @property targetEntityId - Target entity for homing (0 = no homing)
 * @property projectileType - Visual/behavior type (use ProjectileType enum)
 * 
 * @see ProjectileType in constants.ts for available projectile types
 */
export const Projectile = defineComponent({
  damage: Types.f32,
  speed: Types.f32,
  lifetime: Types.f32,
  targetEntityId: Types.ui32,
  projectileType: Types.ui8
});

/**
 * EnemyWeapon component for enemies that fire projectiles.
 * 
 * Attached to enemy ships that can shoot at the Kobayashi Maru.
 * The enemy combat system handles firing logic.
 * 
 * @property range - Maximum firing range in pixels
 * @property fireRate - Shots per second
 * @property damage - Damage per projectile
 * @property lastFired - Game time of last shot
 * @property projectileType - Type of projectile fired (use ProjectileType enum)
 */
export const EnemyWeapon = defineComponent({
  range: Types.f32,
  fireRate: Types.f32,
  damage: Types.f32,
  lastFired: Types.f32,
  projectileType: Types.ui8
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

// ============================================================================
// ENEMY VARIANT & SPECIAL ABILITY COMPONENTS
// ============================================================================

/**
 * EnemyVariant component - identifies enemy rank/variant
 * Used to distinguish Normal, Elite, and Boss enemies
 */
export const EnemyVariant = defineComponent({
  rank: Types.ui8,           // 0=Normal, 1=Elite, 2=Boss
  sizeScale: Types.f32,      // Visual size multiplier
  statMultiplier: Types.f32  // Health/damage multiplier
});

/**
 * SpecialAbility component - tracks ability cooldowns and state
 * Enemies with special abilities use this to manage their unique powers
 */
export const SpecialAbility = defineComponent({
  abilityType: Types.ui8,      // Type of special ability (see AbilityType in constants)
  cooldown: Types.f32,         // Time between uses (seconds)
  lastUsed: Types.f32,         // Timestamp of last use (game time in seconds)
  duration: Types.f32,         // Duration of ability effect (seconds)
  active: Types.ui8            // 0/1 flag if currently active
});

