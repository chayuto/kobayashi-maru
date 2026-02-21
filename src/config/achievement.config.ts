/**
 * Achievement System Configuration
 *
 * Unlock thresholds for all achievements.
 *
 * @module config/achievement
 */

export const ACHIEVEMENT_CONFIG = {
    /** Kill-count milestones */
    KILLS: {
        FIRST_BLOOD: 1,
        DECIMATOR: 100,
        EXTERMINATOR: 500,
    },
    /** Wave milestones */
    WAVES: {
        EARLY_BIRD: 5,
        WAVE_MASTER: 10,
    },
    /** Combo multiplier milestone */
    COMBO_KING_MULTIPLIER: 10,
    /** Survival time in seconds (5 minutes) */
    SURVIVOR_TIME: 300,
    /** Number of turrets for Turret Commander */
    TURRET_COMMANDER_COUNT: 10,
} as const;

export type AchievementConfig = typeof ACHIEVEMENT_CONFIG;
