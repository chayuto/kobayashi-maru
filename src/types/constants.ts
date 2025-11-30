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
  SPECIES_8472: 0xCC99FF // Lavender
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
  SPECIES_8472: 5
} as const;

export type FactionIdType = typeof FactionId[keyof typeof FactionId];

// Game configuration
export const GAME_CONFIG = {
  TARGET_FPS: 60,
  INITIAL_ENTITY_COUNT: 5000,
  WORLD_WIDTH: 1920,
  WORLD_HEIGHT: 1080,
  COLLISION_CELL_SIZE: 64,  // Cell size for spatial hash (2x typical entity radius)
  MIN_TURRET_DISTANCE: 64,  // Minimum distance between turrets in pixels
  INITIAL_RESOURCES: 500    // Starting resource amount
} as const;

// Turret type IDs
export const TurretType = {
  PHASER_ARRAY: 0,      // Fast fire rate, low damage, medium range
  TORPEDO_LAUNCHER: 1,  // Slow fire rate, high damage, long range
  DISRUPTOR_BANK: 2     // Medium fire rate, stacking debuff
} as const;

export type TurretTypeId = typeof TurretType[keyof typeof TurretType];

// AI Behavior Types
export const AIBehaviorType = {
  DIRECT: 0,      // Bee-line to target (Klingon default)
  STRAFE: 1,      // Side-to-side movement while approaching (Romulan)
  FLANK: 2,       // Circle around to attack from side (Tholian)
  SWARM: 3,       // Move as group toward nearest threat (Borg)
  HUNTER: 4       // Aggressive pursuit, targets turrets (Species 8472)
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
}> = {
  [TurretType.PHASER_ARRAY]: {
    range: 200,
    fireRate: 4,      // 4 shots per second
    damage: 10,
    cost: 100,
    health: 50,
    shield: 25,
    name: 'Phaser Array'
  },
  [TurretType.TORPEDO_LAUNCHER]: {
    range: 350,
    fireRate: 0.5,    // 1 shot every 2 seconds
    damage: 50,
    cost: 200,
    health: 75,
    shield: 40,
    name: 'Torpedo Launcher'
  },
  [TurretType.DISRUPTOR_BANK]: {
    range: 250,
    fireRate: 2,      // 2 shots per second
    damage: 15,
    cost: 150,
    health: 60,
    shield: 30,
    name: 'Disruptor Bank'
  }
};
