/**
 * Enemy Configuration
 * 
 * Enemy ranks, abilities, and their configurations.
 * 
 * @module types/config/enemies
 */

// =============================================================================
// ENEMY RANKS
// =============================================================================

/** Enemy rank types */
export const EnemyRank = {
    NORMAL: 0,
    ELITE: 1,
    BOSS: 2
} as const;

export type EnemyRankType = typeof EnemyRank[keyof typeof EnemyRank];

/** Stat multipliers for each enemy rank */
export const RANK_MULTIPLIERS: Record<number, {
    health: number;
    damage: number;
    size: number;
    score: number;
    resources: number;
}> = {
    [EnemyRank.NORMAL]: { health: 1.0, damage: 1.0, size: 1.0, score: 1.0, resources: 1.0 },
    [EnemyRank.ELITE]: { health: 3.0, damage: 1.5, size: 1.3, score: 3.0, resources: 3.0 },
    [EnemyRank.BOSS]: { health: 10.0, damage: 2.0, size: 2.0, score: 10.0, resources: 10.0 }
};

// =============================================================================
// SPECIAL ABILITIES
// =============================================================================

/** Special ability types for enemies */
export const AbilityType = {
    TELEPORT: 0,
    CLOAK: 1,
    SHIELD_REGEN: 2,
    SPLIT: 3,
    SUMMON: 4,
    DRAIN: 5,
    EMP_BURST: 6,
    RAMMING_SPEED: 7
} as const;

export type AbilityTypeId = typeof AbilityType[keyof typeof AbilityType];

/** Configuration for each ability type */
export const ABILITY_CONFIG: Record<number, {
    cooldown: number;
    duration: number;
    range?: number;
    regenRate?: number;
    splitCount?: { min: number; max: number };
    alphaWhileCloaked?: number;
}> = {
    [AbilityType.TELEPORT]: { cooldown: 8.0, duration: 0, range: 300 },
    [AbilityType.CLOAK]: { cooldown: 15.0, duration: 5.0, alphaWhileCloaked: 0.2 },
    [AbilityType.SHIELD_REGEN]: { cooldown: 0, duration: 0, regenRate: 0.05 },
    [AbilityType.SPLIT]: { cooldown: 0, duration: 0, splitCount: { min: 2, max: 3 } },
    [AbilityType.SUMMON]: { cooldown: 20.0, duration: 0, range: 100 },
    [AbilityType.DRAIN]: { cooldown: 5.0, duration: 3.0, range: 200 },
    [AbilityType.EMP_BURST]: { cooldown: 12.0, duration: 2.0, range: 250 },
    [AbilityType.RAMMING_SPEED]: { cooldown: 10.0, duration: 3.0 }
};
