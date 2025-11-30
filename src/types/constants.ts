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
  COLLISION_CELL_SIZE: 64  // Cell size for spatial hash (2x typical entity radius)
} as const;
