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

    /** Whether AI is enabled by default on game start */
    ENABLED_BY_DEFAULT: true,

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

    /** Weight for threat interception when scoring positions (0-1) */
    THREAT_INTERCEPT_WEIGHT: 0.6,

    /** Maximum distance from approach path to consider (pixels) */
    APPROACH_PATH_TOLERANCE: 120,

    /** Weight for preferring defensive positions closer to KM (0-1) */
    DEFENSIVE_DISTANCE_WEIGHT: 0.4,

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
    // TURRET-FACTION EFFECTIVENESS
    // =========================================================================

    /**
     * Effectiveness multipliers for each turret type against each faction.
     * Values > 1.0 = effective counter, < 1.0 = less effective
     * TurretType -> FactionId -> effectiveness
     */
    TURRET_FACTION_EFFECTIVENESS: {
        // Phaser Array (0): High fire rate, good for swarms
        0: { 1: 1.5, 2: 0.8, 3: 0.7, 4: 1.0, 5: 0.6 },
        // Torpedo Launcher (1): High damage, long range - good for bosses/tough targets
        1: { 1: 0.8, 2: 1.0, 3: 1.2, 4: 1.4, 5: 1.5 },
        // Disruptor Bank (2): Balanced all-rounder
        2: { 1: 1.0, 2: 1.0, 3: 0.9, 4: 1.0, 5: 0.9 },
        // Tetryon Beam (3): Shield stripper - excellent vs Borg/Romulan shields
        3: { 1: 0.8, 2: 1.4, 3: 1.6, 4: 1.0, 5: 0.5 },
        // Plasma Cannon (4): DOT damage - good for clustered enemies
        4: { 1: 1.3, 2: 1.0, 3: 1.3, 4: 0.8, 5: 1.2 },
        // Polaron Beam (5): Slowing effect - good vs fast enemies
        5: { 1: 1.0, 2: 1.3, 3: 0.8, 4: 1.1, 5: 1.4 },
    } as Record<number, Record<number, number>>,

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
