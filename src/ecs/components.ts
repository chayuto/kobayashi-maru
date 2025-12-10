/**
 * ECS Components for Kobayashi Maru
 * 
 * Components are data containers used by the Entity-Component-System architecture.
 * Each component stores data in arrays indexed by entity ID for high performance.
 * Components do not contain logic - that belongs in systems.
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
export const Position = {
  x: [] as number[],
  y: [] as number[]
};

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
export const Velocity = {
  x: [] as number[],
  y: [] as number[]
};

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
export const Faction = {
  id: [] as number[]
};

/**
 * SpriteRef component linking entity to visual representation.
 * 
 * The render system uses this to manage sprite creation and updates.
 * The index is managed by SpriteManager and should not be set directly.
 * 
 * @property index - Sprite index in the particle container (managed by SpriteManager)
 */
export const SpriteRef = {
  index: [] as number[]
};

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
export const Health = {
  current: [] as number[],
  max: [] as number[]
};

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
export const Shield = {
  current: [] as number[],
  max: [] as number[]
};

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
export const Collider = {
  radius: [] as number[],
  layer: [] as number[],
  mask: [] as number[]
};

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
export const Turret = {
  range: [] as number[],
  fireRate: [] as number[],
  damage: [] as number[],
  lastFired: [] as number[],
  turretType: [] as number[]
};

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
export const Target = {
  entityId: [] as number[],
  hasTarget: [] as number[],
  entityId2: [] as number[],
  hasTarget2: [] as number[],
  entityId3: [] as number[],
  hasTarget3: [] as number[]
};

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
export const AIBehavior = {
  behaviorType: [] as number[],
  stateTimer: [] as number[],
  targetX: [] as number[],
  targetY: [] as number[],
  aggression: [] as number[]
};

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
export const Projectile = {
  damage: [] as number[],
  speed: [] as number[],
  lifetime: [] as number[],
  targetEntityId: [] as number[],
  projectileType: [] as number[]
};

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
export const EnemyWeapon = {
  range: [] as number[],
  fireRate: [] as number[],
  damage: [] as number[],
  lastFired: [] as number[],
  projectileType: [] as number[]
};



// ============================================================================
// STATUS EFFECT COMPONENTS
// ============================================================================

/**
 * Burning status - DOT damage over time
 * Used by: Plasma Cannon
 */
export const BurningStatus = {
  damagePerTick: [] as number[],    // Damage dealt per tick
  ticksRemaining: [] as number[],   // Number of ticks left
  tickInterval: [] as number[],     // Time between ticks (seconds)
  lastTickTime: [] as number[]      // Last time damage was applied
};

/**
 * Slowed status - Reduces movement speed
 * Used by: Chroniton Torpedo, Polaron Beam
 */
export const SlowedStatus = {
  slowPercent: [] as number[],      // 0.0 to 1.0 (0.5 = 50% slow)
  duration: [] as number[],         // Time remaining (seconds)
  originalSpeed: [] as number[]     // Speed before slow applied
};

/**
 * Drained status - Stacking power drain
 * Used by: Polaron Beam Emitter
 */
export const DrainedStatus = {
  stacks: [] as number[],           // 0-3 stacks
  duration: [] as number[]          // Time remaining per stack
};

/**
 * Disabled status - Systems offline
 * Used by: Phaser Array (5% chance)
 */
export const DisabledStatus = {
  duration: [] as number[],         // Time remaining (seconds)
  disabledSystems: [] as number[]   // Bitfield: 1=weapons, 2=engines, 4=shields
};

// ============================================================================
// WEAPON PROPERTY COMPONENTS
// ============================================================================

/**
 * Extended weapon properties for special mechanics
 * Attached to turret entities
 */
export const WeaponProperties = {
  shieldDamageMultiplier: [] as number[],  // Damage multiplier vs shields (default 1.0)
  hullDamageMultiplier: [] as number[],    // Damage multiplier vs hull (default 1.0)
  critChance: [] as number[],              // Critical hit chance 0.0-1.0
  critMultiplier: [] as number[],          // Critical damage multiplier (default 2.0)
  aoeRadius: [] as number[],               // AOE explosion radius (0 = no AOE)
  statusEffectType: [] as number[],        // 0=none, 1=burn, 2=slow, 3=drain, 4=disable
  statusEffectChance: [] as number[]       // Chance to apply status 0.0-1.0
};

/**
 * TurretUpgrade component - tracks upgrade state for turrets
 * Each turret can be upgraded through multiple paths
 */
export const TurretUpgrade = {
  damageLevel: [] as number[],      // Damage upgrade level (0-3)
  rangeLevel: [] as number[],       // Range upgrade level (0-3)
  fireRateLevel: [] as number[],    // Fire rate upgrade level (0-3)
  multiTargetLevel: [] as number[], // Multi-target upgrade level (0-2, enables multiple targets)
  specialLevel: [] as number[]      // Special ability upgrade level (0-3, turret-specific)
};

// ============================================================================
// ENEMY VARIANT & SPECIAL ABILITY COMPONENTS
// ============================================================================

/**
 * EnemyVariant component - identifies enemy rank/variant
 * Used to distinguish Normal, Elite, and Boss enemies
 */
export const EnemyVariant = {
  rank: [] as number[],           // 0=Normal, 1=Elite, 2=Boss
  sizeScale: [] as number[],      // Visual size multiplier
  statMultiplier: [] as number[]  // Health/damage multiplier
};

/**
 * SpecialAbility component - tracks ability cooldowns and state
 * Enemies with special abilities use this to manage their unique powers
 */
export const SpecialAbility = {
  abilityType: [] as number[],      // Type of special ability (see AbilityType in constants)
  cooldown: [] as number[],         // Time between uses (seconds)
  lastUsed: [] as number[],         // Timestamp of last use (game time in seconds)
  duration: [] as number[],         // Duration of ability effect (seconds)
  active: [] as number[]            // 0/1 flag if currently active
};


/**
 * Rotation component for entity orientation.
 * 
 * Used by the render system to rotate sprites.
 * Units are in radians.
 * 
 * @property angle - Rotation angle in radians
 */
export const Rotation = {
  angle: [] as number[]
};

/**
 * Composite sprite reference for entities with multiple parts (e.g., base + turret).
 * 
 * @property baseIndex - Sprite index for stationary base
 * @property barrelIndex - Sprite index for rotating barrel
 */
export const CompositeSpriteRef = {
  baseIndex: [] as number[],
  barrelIndex: [] as number[]
};
