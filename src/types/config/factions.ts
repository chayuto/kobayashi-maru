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

/** Faction-specific colors for sprites and UI - Enhanced vibrant futuristic palette */
export const FACTION_COLORS = {
    FEDERATION: 0x00FFCC,     // Electric cyan-teal (was 0x33CC99)
    KLINGON: 0xFF3344,        // Crimson with punch (was 0xDD4444)
    ROMULAN: 0x88FF00,        // Bright neon lime (was 0x99CC33)
    BORG: 0x00FF88,           // Matrix-style green (was 0x22EE22)
    THOLIAN: 0xFF8822,        // Warm amber glow (was 0xFF7700)
    SPECIES_8472: 0xDD66FF,   // Vibrant purple-magenta (was 0xCC99FF)
    PROJECTILE: 0xFF6600
} as const;

/** Secondary glow colors for visual effects */
export const FACTION_GLOW_COLORS = {
    FEDERATION: 0x44FFFF,
    KLINGON: 0xFF6666,
    ROMULAN: 0xAAFF44,
    BORG: 0x66FFAA,
    THOLIAN: 0xFFAA44,
    SPECIES_8472: 0xFF88FF
} as const;

/** LCARS-style UI colors (Star Trek aesthetic) - Enhanced for modern look */
export const LCARS_COLORS = {
    GOLDEN_ORANGE: 0xFF9922,  // Warmer orange
    GALAXY_BLUE: 0x66DDFF,    // Brighter blue
    ACCENT_PINK: 0xFF66AA,    // New accent color
    BACKGROUND: 0x0A0A1A,     // Deep space blue-black (not pure black)
    GLOW: 0x00FFCC            // Glow effect color
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
    TURRET_TETRYON: 13,
    TURRET_PLASMA: 14,
    TURRET_POLARON: 15,
    TURRET_BASE_PHASER: 100,
    TURRET_BARREL_PHASER: 101,
    TURRET_BASE_TORPEDO: 102,
    TURRET_BARREL_TORPEDO: 103,
    TURRET_BASE_DISRUPTOR: 104,
    TURRET_BARREL_DISRUPTOR: 105,
    TURRET_BASE_TETRYON: 106,
    TURRET_BARREL_TETRYON: 107,
    TURRET_BASE_PLASMA: 108,
    TURRET_BARREL_PLASMA: 109,
    TURRET_BASE_POLARON: 110,
    TURRET_BARREL_POLARON: 111,
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
