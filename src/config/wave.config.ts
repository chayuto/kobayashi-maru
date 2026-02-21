/**
 * Wave System Configuration
 * 
 * Settings for wave spawning, timing, and enemy spawn points.
 * 
 * @module config/wave
 */

/**
 * Wave system configuration values.
 * 
 * @example
 * ```typescript
 * import { WAVE_CONFIG } from '../config';
 * 
 * const delay = WAVE_CONFIG.TIMING.COMPLETE_DELAY_MS;
 * const margin = WAVE_CONFIG.SPAWN.EDGE_MARGIN;
 * ```
 */
export const WAVE_CONFIG = {
    /**
     * Wave timing settings.
     */
    TIMING: {
        /** Delay after wave complete before next wave (milliseconds) */
        COMPLETE_DELAY_MS: 3000,
        /** Grace period at game start (milliseconds) */
        INITIAL_GRACE_PERIOD_MS: 5000,
    },

    /**
     * Spawn system settings.
     */
    SPAWN: {
        /** Maximum enemies to spawn per frame (prevents lag spikes) */
        MAX_SPAWNS_PER_FRAME: 10,
        /** Margin from screen edge for spawn points (pixels) */
        EDGE_MARGIN: 50,
    },

    /**
     * Scoring settings.
     */
    SCORING: {
        /** Maximum high scores to store */
        MAX_HIGH_SCORES: 10,
    },

    /**
     * Spawn formation settings.
     */
    FORMATION: {
        /** Default cluster radius for grouped spawns */
        DEFAULT_CLUSTER_RADIUS: 100,
        /** V-formation spacing */
        V_FORMATION_SPACING: 50,
    },
    /**
     * Enemy base speed settings.
     */
    ENEMY_SPEED: {
        /** Minimum base speed (pixels/second) */
        BASE_MIN: 50,
        /** Random range added to minimum */
        BASE_RANGE: 150,
        /** Speed increase per wave (2% per wave) */
        SCALE_PER_WAVE: 0.02,
    },

    /**
     * Elite variant chance settings.
     */
    ELITE_CHANCE: {
        /** Base probability for elite spawns */
        BASE: 0.1,
        /** Additional probability per wave */
        PER_WAVE: 0.01,
    },
} as const;

export type WaveConfig = typeof WAVE_CONFIG;
