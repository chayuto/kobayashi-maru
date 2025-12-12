/**
 * ScoringCurves
 *
 * Mathematical functions for converting game values to utility scores.
 * Different curves model different decision urgencies.
 *
 * @module ai/utility/ScoringCurves
 */

export type CurveType = 'linear' | 'quadratic' | 'exponential' | 'logistic' | 'step';

export interface CurveConfig {
    type: CurveType;
    min?: number; // Input minimum (default 0)
    max?: number; // Input maximum (default 1)
    steepness?: number; // For logistic curve
    threshold?: number; // For step curve
    invert?: boolean; // Flip the curve
}

/**
 * Utility scoring curves for AI decision making
 */
export class ScoringCurves {
    /**
     * Apply a scoring curve to normalize a value to 0-1
     */
    static score(value: number, config: CurveConfig): number {
        const { type, min = 0, max = 1, steepness = 5, threshold = 0.5, invert = false } = config;

        // Normalize input to 0-1
        const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

        let result: number;

        switch (type) {
            case 'linear':
                result = normalized;
                break;

            case 'quadratic':
                // Accelerating curve - slow start, fast finish
                result = normalized * normalized;
                break;

            case 'exponential':
                // Very slow start, very fast finish
                // Good for urgency (health critical, etc.)
                result = (Math.exp(normalized * 3) - 1) / (Math.E ** 3 - 1);
                break;

            case 'logistic': {
                // S-curve - slow start, fast middle, slow finish
                // Good for binary-like decisions with smooth transition
                const x = (normalized - 0.5) * steepness * 2;
                result = 1 / (1 + Math.exp(-x));
                break;
            }

            case 'step':
                // Binary threshold
                result = normalized >= threshold ? 1 : 0;
                break;

            default:
                result = normalized;
        }

        return invert ? 1 - result : result;
    }

    /**
     * Pre-configured curves for common use cases
     */
    static readonly PRESETS = {
        /**
         * Health urgency - exponential
         * Low health = extreme urgency
         */
        healthUrgency: (healthPercent: number): number => {
            // Invert so low health = high score
            return ScoringCurves.score(healthPercent, {
                type: 'exponential',
                invert: true,
            });
        },

        /**
         * Distance scoring - quadratic falloff
         * Closer = higher score, but not linear
         */
        distanceValue: (distance: number, maxDistance: number): number => {
            return ScoringCurves.score(distance, {
                type: 'quadratic',
                max: maxDistance,
                invert: true,
            });
        },

        /**
         * Resource efficiency - linear
         * More resources = more options
         */
        resourceValue: (resources: number, maxResources: number): number => {
            return ScoringCurves.score(resources, {
                type: 'linear',
                max: maxResources,
            });
        },

        /**
         * Threat response - logistic
         * Smooth transition from "ignore" to "respond"
         */
        threatResponse: (threatLevel: number): number => {
            return ScoringCurves.score(threatLevel, {
                type: 'logistic',
                max: 100,
                steepness: 8,
            });
        },

        /**
         * Coverage gap - exponential
         * Large gaps are much more urgent than small ones
         */
        coverageGap: (gapPercent: number): number => {
            return ScoringCurves.score(gapPercent, {
                type: 'exponential',
                max: 100,
            });
        },

        /**
         * Wave timing - logistic
         * Urgency increases as wave approaches
         */
        waveTiming: (timeUntilWave: number, maxTime: number): number => {
            return ScoringCurves.score(timeUntilWave, {
                type: 'logistic',
                max: maxTime,
                steepness: 6,
                invert: true,
            });
        },
    };
}
