/**
 * Score and Combo System Configuration
 * 
 * Settings for player scoring, combo multipliers, and kill tracking.
 * 
 * @module config/score
 * 
 * @example
 * ```typescript
 * import { SCORE_CONFIG } from '../config';
 * 
 * // Use combo timeout for timer reset
 * this.comboTimer = SCORE_CONFIG.COMBO.TIMEOUT;
 * 
 * // Iterate through tiers to find multiplier
 * for (const tier of SCORE_CONFIG.COMBO.TIERS) {
 *   if (comboCount >= tier.threshold) {
 *     multiplier = tier.multiplier;
 *   }
 * }
 * ```
 */

export const SCORE_CONFIG = {
    /**
     * Combo system configuration for kill streak multipliers.
     */
    COMBO: {
        /** Time window in seconds to maintain combo before it resets */
        TIMEOUT: 4.0,
        /**
         * Combo multiplier tiers - each threshold unlocks a higher multiplier.
         * Sorted by threshold ascending.
         */
        TIERS: [
            { threshold: 0, multiplier: 1 },
            { threshold: 3, multiplier: 2 },
            { threshold: 6, multiplier: 3 },
            { threshold: 10, multiplier: 5 },
            { threshold: 20, multiplier: 8 },
            { threshold: 35, multiplier: 12 },
            { threshold: 50, multiplier: 15 }
        ] as const,
    },
} as const;

export type ScoreConfig = typeof SCORE_CONFIG;
