/**
 * Audio Configuration
 *
 * Settings for sound playback, concurrency, and music.
 * Concurrency limits prevent audio flooding when many entities fire simultaneously.
 *
 * @module config/audio
 *
 * @example
 * ```typescript
 * import { AUDIO_CONFIG } from '../config';
 *
 * // Check concurrency limit for a category
 * const maxWeapons = AUDIO_CONFIG.CONCURRENCY.WEAPONS;
 *
 * // Look up which category a sound belongs to
 * const weaponSounds = AUDIO_CONFIG.CATEGORIES.WEAPONS;
 * ```
 */

export const AUDIO_CONFIG = {
    /** Maximum simultaneous sounds per category */
    CONCURRENCY: {
        /** Max simultaneous weapon fire sounds */
        WEAPONS: 3,
        /** Max simultaneous combat sounds (explosions, impacts) */
        COMBAT: 2,
        /** Max simultaneous UI sounds */
        UI: 4,
        /** Max simultaneous ambient sounds */
        AMBIENT: 2,
    },
    /** Sound type to category mapping */
    CATEGORIES: {
        WEAPONS: ['phaser_fire', 'torpedo_fire', 'disruptor_fire', 'tetryon_fire', 'plasma_fire', 'polaron_fire'] as string[],
        COMBAT: ['explosion_small', 'explosion_large', 'shield_hit', 'hull_hit'] as string[],
        UI: ['turret_place', 'turret_select', 'resource_gain', 'error_beep'] as string[],
        AMBIENT: ['space_ambient', 'alert_klaxon', 'wave_start', 'wave_complete', 'game_over'] as string[],
    },
    /** Sound effect volume levels (0-1) */
    SFX: {
        /** Turret selection feedback */
        TURRET_SELECT: 0.5,
        /** Turret placement confirmation */
        TURRET_PLACE: 0.6,
        /** Turret upgrade confirmation */
        TURRET_UPGRADE: 0.7,
        /** Error/invalid action feedback */
        ERROR_BEEP: 0.5,
        /** Wave lifecycle announcements */
        WAVE_START: 0.7,
        /** Wave completion announcement */
        WAVE_COMPLETE: 0.7,
        /** Large explosion (turret/player destruction, boss death) */
        EXPLOSION_LARGE: 0.8,
        /** Small explosion (normal/elite enemy death, collision) */
        EXPLOSION_SMALL: 0.6,
    },
    /** Adaptive music layering settings */
    MUSIC: {
        /** Enable adaptive music */
        ENABLED: true,
        /** Overall music volume multiplier (0-1) */
        VOLUME: 0.25,
        /** Intensity smoothing rate (higher = faster response) */
        SMOOTHING_RATE: 2.0,
        /** Gain ramp time in seconds (for click-free transitions) */
        GAIN_RAMP_TIME: 0.15,
        /** Stem loop durations in seconds */
        STEM_DURATIONS: {
            AMBIENT: 4.0,
            BUILD: 2.0,
            COMBAT: 2.0,
            CRITICAL: 1.0,
        },
        /** Intensity thresholds for each stem to start fading in */
        STEM_THRESHOLDS: {
            /** Build stem starts fading in at this intensity */
            BUILD_START: 0.15,
            /** Build stem at full volume at this intensity */
            BUILD_FULL: 0.40,
            /** Combat stem starts fading in */
            COMBAT_START: 0.40,
            /** Combat stem at full volume */
            COMBAT_FULL: 0.65,
            /** Critical stem starts fading in */
            CRITICAL_START: 0.70,
            /** Critical stem at full volume */
            CRITICAL_FULL: 0.90,
        },
        /** Intensity metric weights (must sum to ~1.0) */
        INTENSITY_WEIGHTS: {
            ACTIVE_ENEMIES: 0.3,
            HULL_DAMAGE: 0.3,
            BOSS_WAVE: 0.2,
            DPS: 0.2,
        },
        /** Normalizer denominators for the intensity calculation */
        INTENSITY_NORMALIZERS: {
            /** Intensity = 1.0 when active enemies reach this count */
            MAX_ENEMIES: 20,
            /** Intensity = 1.0 when DPS reaches this value */
            MAX_DPS: 100,
        },
    },
} as const;

export type AudioConfig = typeof AUDIO_CONFIG;
