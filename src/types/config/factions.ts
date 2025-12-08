/**
 * Faction Configuration
 * 
 * Faction IDs, colors, and sprite types for entity team identification.
 * 
 * @module types/config/factions
 */

// =============================================================================
// COLOR PALETTES
// =============================================================================

/** Faction-specific colors for sprites and UI */
export const FACTION_COLORS = {
    FEDERATION: 0x33CC99,
    KLINGON: 0xDD4444,
    ROMULAN: 0x99CC33,
    BORG: 0x22EE22,
    THOLIAN: 0xFF7700,
    SPECIES_8472: 0xCC99FF,
    PROJECTILE: 0xFF6600
} as const;

/** LCARS-style UI colors (Star Trek aesthetic) */
export const LCARS_COLORS = {
    GOLDEN_ORANGE: 0xFF9900,
    GALAXY_BLUE: 0x99CCFF,
    BACKGROUND: 0x000000
} as const;

// =============================================================================
// FACTION IDENTIFIERS
// =============================================================================

/** Faction IDs for identifying entity teams in the ECS */
export const FactionId = {
    FEDERATION: 0,
    KLINGON: 1,
    ROMULAN: 2,
    BORG: 3,
    THOLIAN: 4,
    SPECIES_8472: 5,
    PROJECTILE: 99,
    ENEMY_PROJECTILE: 98
} as const;

export type FactionIdType = typeof FactionId[keyof typeof FactionId];

/** Sprite type identifiers for the render system */
export const SpriteType = {
    FEDERATION: 0,
    KLINGON: 1,
    ROMULAN: 2,
    BORG: 3,
    THOLIAN: 4,
    SPECIES_8472: 5,
    KOBAYASHI_MARU: 6,
    TURRET_PHASER: 10,
    TURRET_TORPEDO: 11,
    TURRET_DISRUPTOR: 12,
    TURRET_BASE_PHASER: 100,
    TURRET_BARREL_PHASER: 101,
    TURRET_BASE_TORPEDO: 102,
    TURRET_BARREL_TORPEDO: 103,
    TURRET_BASE_DISRUPTOR: 104,
    TURRET_BARREL_DISRUPTOR: 105,
    PROJECTILE: 99,
    ENEMY_PROJECTILE: 98
} as const;

export type SpriteTypeId = typeof SpriteType[keyof typeof SpriteType];

// =============================================================================
// AI BEHAVIOR TYPES
// =============================================================================

/** AI behavior patterns for enemy movement */
export const AIBehaviorType = {
    DIRECT: 0,
    STRAFE: 1,
    FLANK: 2,
    SWARM: 3,
    HUNTER: 4,
    ORBIT: 5
} as const;

export type AIBehaviorTypeId = typeof AIBehaviorType[keyof typeof AIBehaviorType];
