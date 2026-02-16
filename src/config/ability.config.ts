/**
 * Ability System Configuration
 *
 * Thresholds, particle effects, and parameters for enemy abilities.
 *
 * @module config/ability
 */

export const ABILITY_CONFIG = {
    TELEPORT: {
        /** Health percent threshold to trigger teleport */
        HEALTH_THRESHOLD: 0.3,
        /** Max attempts to find a safe teleport position */
        MAX_ATTEMPTS: 10,
        /** Particle effect for departure */
        DEPARTURE_PARTICLES: {
            COUNT: 30,
            SPEED: { MIN: 100, MAX: 200 },
            LIFE: { MIN: 0.3, MAX: 0.6 },
            SIZE: { MIN: 4, MAX: 10 },
            COLOR_START: 0xCC99FF,
            COLOR_END: 0x6633CC,
        },
        /** Particle effect for arrival */
        ARRIVAL_PARTICLES: {
            COUNT: 30,
            SPEED: { MIN: 50, MAX: 150 },
            LIFE: { MIN: 0.3, MAX: 0.6 },
            SIZE: { MIN: 4, MAX: 10 },
            COLOR_START: 0x6633CC,
            COLOR_END: 0xCC99FF,
        },
    },

    CLOAK: {
        /** Health percent threshold to activate cloak */
        HEALTH_THRESHOLD: 0.5,
        /** Particle effect for cloak activation/deactivation */
        PARTICLES: {
            COUNT: 20,
            SPEED: { MIN: 30, MAX: 80 },
            LIFE: { MIN: 0.5, MAX: 1.0 },
            SIZE: { MIN: 2, MAX: 6 },
            COLOR: 0x00FF00,
        },
    },

    SHIELD_REGEN: {
        /** Visual feedback frequency multiplier */
        VISUAL_FREQUENCY: 2,
        /** Particle effect for regen ticks */
        PARTICLES: {
            COUNT: 5,
            SPEED: { MIN: 20, MAX: 50 },
            LIFE: { MIN: 0.2, MAX: 0.4 },
            SIZE: { MIN: 2, MAX: 4 },
            COLOR: 0x00CCFF,
        },
    },

    SPLIT: {
        /** Offset distance for split enemies from original position */
        SPAWN_OFFSET: 50,
        /** Stat multiplier for split children */
        STAT_MULTIPLIER: 0.5,
        /** Particle effect for split event */
        PARTICLES: {
            COUNT: 40,
            SPEED: { MIN: 150, MAX: 300 },
            LIFE: { MIN: 0.3, MAX: 0.6 },
            SIZE: { MIN: 3, MAX: 8 },
        },
    },

    SUMMON: {
        /** Health percent threshold to summon reinforcements */
        HEALTH_THRESHOLD: 0.5,
        /** Summon count range */
        COUNT: { MIN: 2, MAX: 4 },
        /** Particle effect for summon event */
        PARTICLES: {
            COUNT: 50,
            SPEED: { MIN: 100, MAX: 200 },
            LIFE: { MIN: 0.5, MAX: 1.0 },
            SIZE: { MIN: 4, MAX: 8 },
        },
    },

    RAMMING: {
        /** Distance threshold to activate ramming speed (pixels) */
        ACTIVATION_DISTANCE: 400,
        /** Velocity multiplier when ramming */
        SPEED_MULTIPLIER: 2,
        /** Velocity restore multiplier when deactivating */
        RESTORE_MULTIPLIER: 0.5,
        /** Particle trail effect */
        PARTICLES: {
            COUNT: 20,
            SPEED: { MIN: 50, MAX: 100 },
            LIFE: { MIN: 0.3, MAX: 0.6 },
            SIZE: { MIN: 3, MAX: 6 },
            COLOR: 0xFF3300,
        },
    },

    /** Faction-specific ability colors */
    FACTION_COLORS: {
        KLINGON: 0xDD4444,
        ROMULAN: 0x99CC33,
        BORG: 0x22EE22,
        THOLIAN: 0xFF7700,
        SPECIES_8472: 0xCC99FF,
        DEFAULT: 0xFFFFFF,
    },
} as const;

export type AbilityConfig = typeof ABILITY_CONFIG;
