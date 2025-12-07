/**
 * Game constants and type definitions for Kobayashi Maru
 */

// Faction color palette
export const FACTION_COLORS = {
  FEDERATION: 0x33CC99,  // Teal
  KLINGON: 0xDD4444,     // Red
  ROMULAN: 0x99CC33,     // Lime
  BORG: 0x22EE22,        // Neon Green
  THOLIAN: 0xFF7700,     // Orange
  SPECIES_8472: 0xCC99FF, // Lavender
  PROJECTILE: 0xFF6600   // Orange-red (Photon Torpedo)
} as const;

// LCARS UI colors
export const LCARS_COLORS = {
  GOLDEN_ORANGE: 0xFF9900,
  GALAXY_BLUE: 0x99CCFF,
  BACKGROUND: 0x000000
} as const;

// Faction IDs for ECS
export const FactionId = {
  FEDERATION: 0,
  KLINGON: 1,
  ROMULAN: 2,
  BORG: 3,
  THOLIAN: 4,
  SPECIES_8472: 5,
  PROJECTILE: 99,          // Special faction for friendly projectiles
  ENEMY_PROJECTILE: 98     // Special faction for enemy projectiles
} as const;

export type FactionIdType = typeof FactionId[keyof typeof FactionId];

// Sprite Types for rendering (decoupled from FactionId)
export const SpriteType = {
  // Factions (map 1:1 to FactionId for convenience)
  FEDERATION: 0,
  KLINGON: 1,
  ROMULAN: 2,
  BORG: 3,
  THOLIAN: 4,
  SPECIES_8472: 5,

  // Turrets
  TURRET_PHASER: 10,
  TURRET_TORPEDO: 11,
  TURRET_DISRUPTOR: 12,

  // Projectiles
  PROJECTILE: 99,
  ENEMY_PROJECTILE: 98
} as const;

export type SpriteTypeId = typeof SpriteType[keyof typeof SpriteType];

// Game configuration
export const GAME_CONFIG = {
  TARGET_FPS: 60,
  INITIAL_ENTITY_COUNT: 5000,
  WORLD_WIDTH: 1920,
  WORLD_HEIGHT: 1080,
  COLLISION_CELL_SIZE: 64,  // Cell size for spatial hash (2x typical entity radius)
  MIN_TURRET_DISTANCE: 64,  // Minimum distance between turrets in pixels
  INITIAL_RESOURCES: 500,   // Starting resource amount
  RESOURCE_REWARD: 10,      // Resources gained per enemy kill
  // Enemy collision settings
  ENEMY_COLLISION_RADIUS: 40,   // Collision radius for enemy-ship collision
  ENEMY_COLLISION_DAMAGE: 25,   // Damage dealt by enemy on collision
  // Slow mode settings
  SLOW_MODE_MULTIPLIER: 0.5,    // Speed multiplier when slow mode is enabled
  // Orbit behavior settings
  ORBIT_RADIUS: 300,            // Distance to orbit around target (pixels)
  ORBIT_SPEED: 50,              // Slow orbit speed (pixels per second)
  ORBIT_APPROACH_SPEED: 40,     // Slow approach speed until orbit distance
  // Collision radii for entities
  KOBAYASHI_MARU_RADIUS: 40,    // Collision radius for Kobayashi Maru
  TURRET_RADIUS: 20,            // Collision radius for turrets
  // Kobayashi Maru default defense weapon stats
  KOBAYASHI_MARU_DEFENSE_RANGE: 250,     // Defense weapon range in pixels
  KOBAYASHI_MARU_DEFENSE_FIRE_RATE: 2,   // Defense weapon fire rate (shots per second)
  KOBAYASHI_MARU_DEFENSE_DAMAGE: 15      // Defense weapon damage per shot
} as const;

// Turret type IDs
export const TurretType = {
  PHASER_ARRAY: 0,      // Fast fire rate, low damage, medium range
  TORPEDO_LAUNCHER: 1,  // Slow fire rate, high damage, long range
  DISRUPTOR_BANK: 2,    // Medium fire rate, stacking debuff
  TETRYON_BEAM: 3,      // Shield-stripping beam
  PLASMA_CANNON: 4,     // Burning projectile
  POLARON_BEAM: 5       // Power-draining beam
} as const;

export type TurretTypeId = typeof TurretType[keyof typeof TurretType];

// AI Behavior Types
export const AIBehaviorType = {
  DIRECT: 0,      // Bee-line to target (Klingon default)
  STRAFE: 1,      // Side-to-side movement while approaching (Romulan)
  FLANK: 2,       // Circle around to attack from side (Tholian)
  SWARM: 3,       // Move as group toward nearest threat (Borg)
  HUNTER: 4,      // Aggressive pursuit, targets turrets (Species 8472)
  ORBIT: 5        // Slow approach, then orbit at fixed distance and shoot (Tholian alternate)
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
