/**
 * Quality & Performance Configuration
 *
 * Quality presets, frame budgets, and FPS thresholds.
 *
 * @module config/quality
 */

export const QUALITY_CONFIG = {
    /** Quality tier presets */
    PRESETS: {
        HIGH: {
            maxParticles: 2000,
            starCount: 1000,
            resolutionMultiplier: 1.0,
            particleSpawnRate: 1.0,
        },
        MEDIUM: {
            maxParticles: 1000,
            starCount: 500,
            resolutionMultiplier: 1.0,
            particleSpawnRate: 0.5,
        },
        LOW: {
            maxParticles: 500,
            starCount: 200,
            resolutionMultiplier: 0.8,
            particleSpawnRate: 0.25,
        },
    },

    /** FPS threshold to trigger quality downgrade */
    DOWNGRADE_FPS_THRESHOLD: 30,

    /** Hardware detection thresholds */
    HARDWARE: {
        /** Default core count fallback when unavailable */
        DEFAULT_CORES: 4,
        /** Core count thresholds for mobile tier detection */
        MOBILE_HIGH_CORES: 8,
        MOBILE_MID_CORES: 4,
        /** Minimum cores for desktop medium tier */
        DESKTOP_MID_CORES: 4,
    },

    /** Per-system frame budget in milliseconds (target 60 FPS = 16.67ms total) */
    FRAME_BUDGETS: {
        TOTAL: 16.67,
        MOVEMENT: 2.0,
        COLLISION: 2.0,
        AI: 2.0,
        COMBAT: 2.0,
        TARGETING: 1.0,
        PROJECTILE: 1.0,
        DAMAGE: 1.0,
        RENDERING: 5.0,
        OTHER: 3.67,
    },
} as const;

export type QualityConfig = typeof QUALITY_CONFIG;
