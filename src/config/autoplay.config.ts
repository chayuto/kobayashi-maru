/**
 * AI Auto-Play Configuration
 *
 * Settings for the AI auto-play system.
 * This is separate from ai.config.ts which configures enemy AI behavior.
 *
 * @module config/autoplay
 */

export const AUTOPLAY_CONFIG = {
    // =========================================================================
    // TIMING
    // =========================================================================

    /** Time between AI decisions (ms) */
    DECISION_INTERVAL_MS: 500,

    /** Minimum time between placements (ms) */
    PLACEMENT_COOLDOWN_MS: 1000,

    /** Minimum time between upgrades (ms) */
    UPGRADE_COOLDOWN_MS: 750,

    // =========================================================================
    // ANALYSIS
    // =========================================================================

    /** Number of columns in the sector grid */
    SECTOR_GRID_COLS: 8,

    /** Number of rows in the sector grid */
    SECTOR_GRID_ROWS: 6,

    /** How far ahead to predict enemy positions (seconds) */
    THREAT_PREDICTION_SECONDS: 5,

    // =========================================================================
    // PLACEMENT
    // =========================================================================

    /** Ideal distance from Kobayashi Maru for turrets (pixels) */
    OPTIMAL_KM_DISTANCE: 200,

    /** Penalty for overlapping turret coverage (0-1) */
    COVERAGE_OVERLAP_PENALTY: 0.3,

    // =========================================================================
    // RESOURCES
    // =========================================================================

    /** Minimum resources to keep in reserve */
    EMERGENCY_RESERVE: 100,

    /** Threshold for upgrading vs placing (0-1) */
    UPGRADE_THRESHOLD: 0.7,

    // =========================================================================
    // THREAT LEVELS
    // =========================================================================

    THREAT_LEVEL: {
        LOW: 25,
        MEDIUM: 50,
        HIGH: 75,
        CRITICAL: 90,
    },

    // =========================================================================
    // FACTION THREAT MODIFIERS
    // =========================================================================

    /** Threat multipliers by faction ID */
    FACTION_THREAT_MODIFIERS: {
        1: 1.0, // Klingon
        2: 1.2, // Romulan (cloaking)
        3: 1.5, // Borg (regen)
        4: 1.3, // Tholian (orbit)
        5: 1.8, // Species 8472 (hunter)
    } as Record<number, number>,

    // =========================================================================
    // PERSONALITIES
    // =========================================================================

    PERSONALITIES: {
        BALANCED: {
            placementBias: { distanceFromKM: 0, coverageVsDamage: 0 },
            upgradeBias: { damageVsUtility: 0, earlyVsLate: 0 },
            riskTolerance: 0.5,
        },
        AGGRESSIVE: {
            placementBias: { distanceFromKM: -0.5, coverageVsDamage: 0.7 },
            upgradeBias: { damageVsUtility: 0.8, earlyVsLate: 0.6 },
            riskTolerance: 0.8,
        },
        DEFENSIVE: {
            placementBias: { distanceFromKM: 0.6, coverageVsDamage: -0.5 },
            upgradeBias: { damageVsUtility: -0.3, earlyVsLate: -0.4 },
            riskTolerance: 0.2,
        },
        ECONOMIC: {
            placementBias: { distanceFromKM: 0.2, coverageVsDamage: -0.3 },
            upgradeBias: { damageVsUtility: 0, earlyVsLate: -0.6 },
            riskTolerance: 0.4,
        },
        ADAPTIVE: {
            placementBias: { distanceFromKM: 0, coverageVsDamage: 0 },
            upgradeBias: { damageVsUtility: 0, earlyVsLate: 0 },
            riskTolerance: 0.5,
        },
    },
} as const;

export type AutoplayConfig = typeof AUTOPLAY_CONFIG;
