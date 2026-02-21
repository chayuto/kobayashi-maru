/**
 * Combat System Configuration
 * 
 * Settings for weapons, beams, projectiles, and damage calculation.
 * 
 * @module config/combat
 */

/**
 * Combat system configuration values.
 * 
 * @example
 * ```typescript
 * import { COMBAT_CONFIG } from '../config';
 * 
 * // Use beam settings
 * const segments = COMBAT_CONFIG.BEAM.SEGMENT_COUNT;
 * const jitter = COMBAT_CONFIG.BEAM.JITTER.PHASER;
 * 
 * // Use DPS window
 * const dpsWindow = COMBAT_CONFIG.STATS.DPS_WINDOW_SECONDS;
 * ```
 */
export const COMBAT_CONFIG = {
    /**
     * Beam weapon visual and mechanical settings.
     */
    BEAM: {
        /** Minimum beam length to render (prevents division by zero) */
        MIN_LENGTH: 0.001,
        /** Number of segments for electricity jitter effect */
        SEGMENT_COUNT: 5,
        /** Maximum charge effect radius in pixels */
        MAX_CHARGE_RADIUS: 15,
        /** Base alpha for beam core */
        BASE_CORE_ALPHA: 0.3,
        /** Pulse effect amplitude (0.0 - 1.0) */
        PULSE_AMPLITUDE: 0.2,
        /** Pulse effect frequency (cycles per second) */
        PULSE_FREQUENCY: 4,
        /** Jitter amount by turret type (pixels of random offset) */
        JITTER: {
            PHASER: 6,
            DISRUPTOR: 10,
            TETRYON: 12,
            POLARON: 9,
            PLASMA: 8,
            DEFAULT: 8,
        },
        /** Beam colors by turret type */
        COLORS: {
            PHASER: 0xFF9900,
            DISRUPTOR: 0x00FF00,
            TORPEDO: 0xFF0000,
            TETRYON: 0x00CCFF,
            PLASMA: 0xFF00FF,
            POLARON: 0xFFFF00,
        },
    },

    /**
     * Combat statistics tracking settings.
     */
    STATS: {
        /** Rolling window in seconds for DPS calculation */
        DPS_WINDOW_SECONDS: 5,
    },

    /**
     * Projectile default settings (can be overridden per projectile type).
     */
    PROJECTILE: {
        /** Default torpedo speed in pixels per second */
        DEFAULT_SPEED: 300,
        /** Default lifetime in seconds */
        DEFAULT_LIFETIME: 5,
    },
    /**
     * Status effect parameters applied by weapons.
     */
    STATUS_EFFECTS: {
        BURNING: { DAMAGE_PER_TICK: 4.0, DURATION: 5.0, TICK_INTERVAL: 1.0 },
        SLOW: { PERCENT: 0.3, DURATION: 3.0 },
        DRAIN: { DURATION: 3.0, MAX_STACKS: 3, SLOW_PER_STACK: 0.1 },
        DISABLE: { DURATION: 2.0, SYSTEMS: 1 },
    },

    /**
     * Weapon fire audio volume per turret type (0.0 – 1.0).
     */
    AUDIO_VOLUMES: {
        PHASER: 0.4,
        TORPEDO: 0.6,
        DISRUPTOR: 0.5,
        TETRYON: 0.45,
        PLASMA: 0.55,
        POLARON: 0.48,
    },
} as const;

export type CombatConfig = typeof COMBAT_CONFIG;
