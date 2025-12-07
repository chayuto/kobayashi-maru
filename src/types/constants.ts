/**
 * Game Constants and Type Definitions for Kobayashi Maru
 * 
 * This module contains all configuration values, enums, and type definitions
 * used throughout the game. Values here are compile-time constants.
 * 
 * ## Key Constants
 * - `GAME_CONFIG` - World dimensions, collision settings, resource values
 * - `FactionId` - Entity team identifiers
 * - `TurretType` - Weapon type identifiers
 * - `TURRET_CONFIG` - Complete turret stats and costs
 * 
 * @module constants
 */

// =============================================================================
// COLOR PALETTES
// =============================================================================

/**
 * Faction-specific colors for sprites and UI.
 * Each faction has a unique color for easy identification.
 * Colors are 24-bit RGB values in hexadecimal format.
 * 
 * @example
 * ```typescript
 * sprite.tint = FACTION_COLORS.KLINGON; // Red tint
 * ```
 */
export const FACTION_COLORS = {
  /** Federation blue-green (friendly) */
  FEDERATION: 0x33CC99,
  /** Klingon red (aggressive) */
  KLINGON: 0xDD4444,
  /** Romulan lime green (tactical) */
  ROMULAN: 0x99CC33,
  /** Borg neon green (relentless) */
  BORG: 0x22EE22,
  /** Tholian orange (mysterious) */
  THOLIAN: 0xFF7700,
  /** Species 8472 lavender (deadly) */
  SPECIES_8472: 0xCC99FF,
  /** Projectile orange-red (weapon fire) */
  PROJECTILE: 0xFF6600
} as const;

/**
 * LCARS-style UI colors (Star Trek aesthetic).
 * Used for HUD elements, panels, and text.
 */
export const LCARS_COLORS = {
  /** Primary accent color */
  GOLDEN_ORANGE: 0xFF9900,
  /** Secondary accent color */
  GALAXY_BLUE: 0x99CCFF,
  /** Space background */
  BACKGROUND: 0x000000
} as const;

// =============================================================================
// FACTION IDENTIFIERS
// =============================================================================

/**
 * Faction IDs for identifying entity teams in the ECS.
 * 
 * Used by targeting and combat systems to determine friend/foe relationships.
 * Federation and PROJECTILE are friendly; all others are hostile.
 * 
 * @example
 * ```typescript
 * // Check if entity is enemy
 * const factionId = Faction.id[entityId];
 * const isHostile = factionId !== FactionId.FEDERATION && 
 *                   factionId !== FactionId.PROJECTILE;
 * 
 * // Create enemy with specific faction
 * createEnemy(world, FactionId.KLINGON, x, y);
 * ```
 */
export const FactionId = {
  /** Player's team (Kobayashi Maru, turrets) */
  FEDERATION: 0,
  /** Aggressive direct attackers */
  KLINGON: 1,
  /** Tactical strafing attackers */
  ROMULAN: 2,
  /** Swarm behavior attackers */
  BORG: 3,
  /** Orbiting ranged attackers */
  THOLIAN: 4,
  /** Elite hunter attackers */
  SPECIES_8472: 5,
  /** Friendly projectiles (torpedoes, beams) */
  PROJECTILE: 99,
  /** Hostile projectiles (enemy fire) */
  ENEMY_PROJECTILE: 98
} as const;

export type FactionIdType = typeof FactionId[keyof typeof FactionId];

/**
 * Sprite type identifiers for the render system.
 * Maps to specific sprite textures in the asset system.
 */
export const SpriteType = {
  // Faction sprites (match FactionId for convenience)
  FEDERATION: 0,
  KLINGON: 1,
  ROMULAN: 2,
  BORG: 3,
  THOLIAN: 4,
  SPECIES_8472: 5,

  // Turret sprites
  TURRET_PHASER: 10,
  TURRET_TORPEDO: 11,
  TURRET_DISRUPTOR: 12,

  // Projectile sprites
  PROJECTILE: 99,
  ENEMY_PROJECTILE: 98
} as const;

export type SpriteTypeId = typeof SpriteType[keyof typeof SpriteType];

// =============================================================================
// GAME CONFIGURATION
// =============================================================================

/**
 * Core game configuration values.
 * 
 * These are compile-time constants that define world parameters,
 * collision settings, and gameplay balance values.
 * 
 * @example
 * ```typescript
 * // World dimensions
 * const centerX = GAME_CONFIG.WORLD_WIDTH / 2;  // 960
 * const centerY = GAME_CONFIG.WORLD_HEIGHT / 2; // 540
 * 
 * // Check placement distance
 * if (distance < GAME_CONFIG.MIN_TURRET_DISTANCE) {
 *   // Too close to another turret
 * }
 * ```
 */
export const GAME_CONFIG = {
  /** Target frames per second */
  TARGET_FPS: 60,
  /** Initial ECS entity pool size */
  INITIAL_ENTITY_COUNT: 5000,
  /** World width in pixels (canvas scales to fit) */
  WORLD_WIDTH: 1920,
  /** World height in pixels (canvas scales to fit) */
  WORLD_HEIGHT: 1080,
  /** Spatial hash cell size for collision detection */
  COLLISION_CELL_SIZE: 64,
  /** Minimum distance between turret placements (pixels) */
  MIN_TURRET_DISTANCE: 64,
  /** Starting resource amount */
  INITIAL_RESOURCES: 500,
  /** Resources awarded per enemy kill */
  RESOURCE_REWARD: 10,
  /** Collision radius for enemy ships hitting Kobayashi Maru */
  ENEMY_COLLISION_RADIUS: 40,
  /** Damage dealt by enemy collision with Kobayashi Maru */
  ENEMY_COLLISION_DAMAGE: 25,
  /** Speed multiplier when slow mode is active (0.5 = half speed) */
  SLOW_MODE_MULTIPLIER: 0.5,
  /** Orbit behavior: distance from target (pixels) */
  ORBIT_RADIUS: 300,
  /** Orbit behavior: circling speed (pixels/second) */
  ORBIT_SPEED: 50,
  /** Orbit behavior: approach speed before reaching orbit (pixels/second) */
  ORBIT_APPROACH_SPEED: 40,
  /** Kobayashi Maru collision radius (pixels) */
  KOBAYASHI_MARU_RADIUS: 40,
  /** Turret collision radius (pixels) */
  TURRET_RADIUS: 20,
  /** Kobayashi Maru defense weapon range (pixels) */
  KOBAYASHI_MARU_DEFENSE_RANGE: 250,
  /** Kobayashi Maru defense weapon fire rate (shots/second) */
  KOBAYASHI_MARU_DEFENSE_FIRE_RATE: 2,
  /** Kobayashi Maru defense weapon damage per shot */
  KOBAYASHI_MARU_DEFENSE_DAMAGE: 15
} as const;

// =============================================================================
// TURRET TYPES
// =============================================================================

/**
 * Turret type identifiers.
 * 
 * Each type has unique stats and mechanics defined in TURRET_CONFIG.
 * 
 * @example
 * ```typescript
 * // Create a torpedo launcher turret
 * createTurret(world, x, y, TurretType.TORPEDO_LAUNCHER);
 * 
 * // Get turret cost
 * const cost = TURRET_CONFIG[TurretType.PHASER_ARRAY].cost;
 * ```
 */
export const TurretType = {
  /** Fast fire rate, low damage, medium range */
  PHASER_ARRAY: 0,
  /** Slow fire rate, high damage, long range */
  TORPEDO_LAUNCHER: 1,
  /** Medium stats, balanced weapon */
  DISRUPTOR_BANK: 2,
  /** Shield-stripping beam (3x shield, 0.5x hull) */
  TETRYON_BEAM: 3,
  /** Burning projectile (DOT effect) */
  PLASMA_CANNON: 4,
  /** Power-draining beam (slow stacks) */
  POLARON_BEAM: 5
} as const;

export type TurretTypeId = typeof TurretType[keyof typeof TurretType];

// =============================================================================
// AI BEHAVIOR TYPES
// =============================================================================

/**
 * AI behavior patterns for enemy movement.
 * 
 * Each faction has a default behavior type. The AI system uses
 * these to determine how enemies move toward and attack targets.
 * 
 * @see AIBehavior component in components.ts
 * @see aiSystem.ts for behavior implementations
 */
export const AIBehaviorType = {
  /** Bee-line straight to target (Klingon default) */
  DIRECT: 0,
  /** Side-to-side weaving while approaching (Romulan) */
  STRAFE: 1,
  /** Circle around to flank (unused) */
  FLANK: 2,
  /** Move as coordinated group (Borg) */
  SWARM: 3,
  /** Aggressive pursuit, prioritizes turrets (Species 8472) */
  HUNTER: 4,
  /** Slow approach, then orbit and shoot (Tholian) */
  ORBIT: 5
} as const;

export type AIBehaviorTypeId = typeof AIBehaviorType[keyof typeof AIBehaviorType];



// Turret configuration for each type
export const TURRET_CONFIG: Record<number, {
  range: number;
  fireRate: number;
  damage: number;
  cost: number;
  health: number;
  shield: number;
  name: string;
  description: string;  // What the weapon does
  special?: string;     // Special ability description
}> = {
  [TurretType.PHASER_ARRAY]: {
    range: 200,
    fireRate: 4,      // 4 shots per second
    damage: 10,
    cost: 100,
    health: 50,
    shield: 25,
    name: 'Phaser Array',
    description: 'Fast-firing energy weapon',
    special: 'High fire rate, good for swarms'
  },
  [TurretType.TORPEDO_LAUNCHER]: {
    range: 350,
    fireRate: 0.5,    // 1 shot every 2 seconds
    damage: 50,
    cost: 200,
    health: 75,
    shield: 40,
    name: 'Torpedo Launcher',
    description: 'Long-range heavy damage',
    special: 'Highest damage, longest range'
  },
  [TurretType.DISRUPTOR_BANK]: {
    range: 250,
    fireRate: 2,      // 2 shots per second
    damage: 15,
    cost: 150,
    health: 60,
    shield: 30,
    name: 'Disruptor Bank',
    description: 'Balanced beam weapon',
    special: 'Good all-rounder'
  },
  [TurretType.TETRYON_BEAM]: {
    range: 220,
    fireRate: 3,      // 3 shots per second
    damage: 12,
    cost: 150,
    health: 55,
    shield: 28,
    name: 'Tetryon Beam',
    description: 'Shield-stripping weapon',
    special: '3x damage to shields, 0.5x to hull'
  },
  [TurretType.PLASMA_CANNON]: {
    range: 200,
    fireRate: 1,      // 1 shot per second
    damage: 8,        // + 20 burning damage over 5 seconds
    cost: 180,
    health: 65,
    shield: 35,
    name: 'Plasma Cannon',
    description: 'Burning projectile weapon',
    special: 'Applies burning (4 dmg/sec × 5s)'
  },
  [TurretType.POLARON_BEAM]: {
    range: 230,
    fireRate: 2.5,    // 2.5 shots per second
    damage: 11,
    cost: 160,
    health: 58,
    shield: 32,
    name: 'Polaron Beam',
    description: 'Power-draining weapon',
    special: 'Stacking slow (max 3, 10% each)'
  }
};

// Upgrade path types
export const UpgradePath = {
  DAMAGE: 0,       // Increase weapon damage
  RANGE: 1,        // Increase targeting range
  FIRE_RATE: 2,    // Increase fire rate
  MULTI_TARGET: 3, // Enable targeting multiple enemies
  SPECIAL: 4       // Turret-specific special ability
} as const;

export type UpgradePathId = typeof UpgradePath[keyof typeof UpgradePath];

// Upgrade configuration for each path and level
export const UPGRADE_CONFIG = {
  [UpgradePath.DAMAGE]: {
    name: 'Weapon Power',
    description: 'Increase damage output',
    maxLevel: 3,
    costs: [50, 100, 200],          // Cost per level
    bonusPercent: [25, 50, 100]     // +25%, +50%, +100% damage
  },
  [UpgradePath.RANGE]: {
    name: 'Targeting Range',
    description: 'Extend weapon range',
    maxLevel: 3,
    costs: [40, 80, 160],
    bonusPercent: [20, 40, 80]      // +20%, +40%, +80% range
  },
  [UpgradePath.FIRE_RATE]: {
    name: 'Fire Rate',
    description: 'Increase shots per second',
    maxLevel: 3,
    costs: [60, 120, 240],
    bonusPercent: [30, 60, 120]     // +30%, +60%, +120% fire rate
  },
  [UpgradePath.MULTI_TARGET]: {
    name: 'Multi-Target',
    description: 'Target multiple enemies',
    maxLevel: 2,
    costs: [150, 300],              // More expensive, powerful upgrade
    targets: [2, 3]                 // Can target 2 or 3 enemies at once
  },
  [UpgradePath.SPECIAL]: {
    name: 'Special Ability',
    description: 'Turret-specific enhancement',
    maxLevel: 3,
    costs: [75, 150, 300],
    // Effects vary by turret type (see TURRET_SPECIAL_UPGRADES)
  }
} as const;

// Special upgrade effects per turret type
export const TURRET_SPECIAL_UPGRADES: Record<number, {
  name: string;
  levels: string[]; // Description per level
}> = {
  [TurretType.PHASER_ARRAY]: {
    name: 'Overload',
    levels: [
      'Chance to disable enemy weapons',
      'Increased disable duration',
      'Chain lightning to nearby enemies'
    ]
  },
  [TurretType.TORPEDO_LAUNCHER]: {
    name: 'Payload',
    levels: [
      'Small AOE explosion',
      'Larger explosion radius',
      'Armor penetration'
    ]
  },
  [TurretType.DISRUPTOR_BANK]: {
    name: 'Resonance',
    levels: [
      'Shield drain on hit',
      'Increased shield damage',
      'Shield bypass'
    ]
  },
  [TurretType.TETRYON_BEAM]: {
    name: 'Polarize',
    levels: [
      'Weaken enemy shields',
      'Increased hull damage',
      'Shield collapse'
    ]
  },
  [TurretType.PLASMA_CANNON]: {
    name: 'Inferno',
    levels: [
      'Increased burn damage',
      'Longer burn duration',
      'Burn spreads to nearby enemies'
    ]
  },
  [TurretType.POLARON_BEAM]: {
    name: 'Energy Drain',
    levels: [
      'Stronger slow effect',
      'Permanent speed reduction',
      'Disable enemy abilities'
    ]
  }
};

// Sell refund percentage (percent of total investment returned)
export const TURRET_SELL_REFUND_PERCENT = 0.75; // 75% refund

// Projectile Types
export const ProjectileType = {
  PHOTON_TORPEDO: 0,
  QUANTUM_TORPEDO: 1,  // Future: higher damage, faster
  DISRUPTOR_BOLT: 2    // Future: for enemy projectiles
} as const;

export type ProjectileTypeId = typeof ProjectileType[keyof typeof ProjectileType];

// Projectile configuration
export const PROJECTILE_CONFIG: Record<number, {
  speed: number;
  lifetime: number;
  size: number;
  color: number;
}> = {
  [ProjectileType.PHOTON_TORPEDO]: {
    speed: 400,    // Pixels per second
    lifetime: 5,   // 5 seconds max
    size: 8,       // Visual size
    color: 0xFF6600 // Orange-red
  },
  [ProjectileType.QUANTUM_TORPEDO]: {
    speed: 500,
    lifetime: 6,
    size: 9,
    color: 0x00CCFF // Blue-white
  },
  [ProjectileType.DISRUPTOR_BOLT]: {
    speed: 350,
    lifetime: 4,
    size: 6,
    color: 0x00FF00 // Green
  }
};

// ============================================================================
// ENEMY VARIANT SYSTEM
// ============================================================================

/**
 * Enemy rank types
 */
export const EnemyRank = {
  NORMAL: 0,
  ELITE: 1,
  BOSS: 2
} as const;

export type EnemyRankType = typeof EnemyRank[keyof typeof EnemyRank];

/**
 * Stat multipliers for each enemy rank
 */
export const RANK_MULTIPLIERS: Record<number, {
  health: number;
  damage: number;
  size: number;
  score: number;
  resources: number;
}> = {
  [EnemyRank.NORMAL]: {
    health: 1.0,
    damage: 1.0,
    size: 1.0,
    score: 1.0,
    resources: 1.0
  },
  [EnemyRank.ELITE]: {
    health: 3.0,
    damage: 1.5,
    size: 1.3,
    score: 3.0,
    resources: 3.0
  },
  [EnemyRank.BOSS]: {
    health: 10.0,
    damage: 2.0,
    size: 2.0,
    score: 10.0,
    resources: 10.0
  }
};

// ============================================================================
// SPECIAL ABILITY SYSTEM
// ============================================================================

/**
 * Special ability types for enemies
 */
export const AbilityType = {
  TELEPORT: 0,           // Instant relocation to safe area
  CLOAK: 1,              // Temporary invisibility
  SHIELD_REGEN: 2,       // Passive shield regeneration
  SPLIT: 3,              // Split into smaller enemies on death
  SUMMON: 4,             // Summon reinforcements
  DRAIN: 5,              // Drain turret energy
  EMP_BURST: 6,          // Disable nearby turrets
  RAMMING_SPEED: 7       // High-speed charge
} as const;

export type AbilityTypeId = typeof AbilityType[keyof typeof AbilityType];

/**
 * Configuration for each ability type
 */
export const ABILITY_CONFIG: Record<number, {
  cooldown: number;
  duration: number;
  range?: number;
  regenRate?: number;
  splitCount?: { min: number; max: number };
  alphaWhileCloaked?: number;
}> = {
  [AbilityType.TELEPORT]: {
    cooldown: 8.0,
    duration: 0,
    range: 300  // Safe distance from threats
  },
  [AbilityType.CLOAK]: {
    cooldown: 15.0,
    duration: 5.0,
    alphaWhileCloaked: 0.2
  },
  [AbilityType.SHIELD_REGEN]: {
    cooldown: 0,  // Passive ability
    regenRate: 0.05,  // 5% per second
    duration: 0
  },
  [AbilityType.SPLIT]: {
    cooldown: 0,  // Triggered on death
    splitCount: { min: 2, max: 3 },
    duration: 0
  },
  [AbilityType.SUMMON]: {
    cooldown: 20.0,
    duration: 0,
    range: 100  // Summon radius
  },
  [AbilityType.DRAIN]: {
    cooldown: 5.0,
    duration: 3.0,
    range: 200
  },
  [AbilityType.EMP_BURST]: {
    cooldown: 12.0,
    duration: 2.0,
    range: 250
  },
  [AbilityType.RAMMING_SPEED]: {
    cooldown: 10.0,
    duration: 3.0
  }
};
