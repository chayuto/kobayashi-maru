/**
 * AI System Configuration
 * 
 * Settings for enemy AI behavior patterns.
 * 
 * @module config/ai
 */

export const AI_CONFIG = {
    /**
     * Default movement speeds (pixels per second)
     */
    SPEED: {
        /** Default speed when velocity is zero */
        DEFAULT: 100,
        /** Romulan strafe behavior base speed */
        STRAFE: 80,
        /** Borg swarm behavior base speed */
        SWARM: 90,
        /** Klingon flank behavior base speed */
        FLANK: 120,
    },

    /**
     * Behavior-specific parameters
     */
    BEHAVIOR: {
        /** Distance threshold for flank angle calculation */
        FLANK_DISTANCE_THRESHOLD: 500,
        /** Strafe oscillation frequency (Hz) */
        STRAFE_FREQUENCY: 3,
        /** Strafe oscillation amplitude (0-1) */
        STRAFE_AMPLITUDE: 0.5,
        /** Swarm noise frequency */
        SWARM_NOISE_FREQUENCY: 0.5,
        /** Swarm noise amplitude */
        SWARM_NOISE_AMPLITUDE: 0.2,
    },

    /**
     * Teleport ability safe positioning
     */
    TELEPORT: {
        /** Margin from screen edges */
        EDGE_MARGIN: 200,
        /** Maximum teleport attempts before fallback */
        MAX_ATTEMPTS: 10,
    },
} as const;

export type AIConfig = typeof AI_CONFIG;
