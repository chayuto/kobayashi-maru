/**
 * ActionBucketing
 *
 * Groups actions into priority buckets.
 * Buckets are scored first, then actions within winning bucket.
 *
 * @module ai/utility/ActionBucketing
 */

import { AIAction, AIActionType } from '../types';
import { ScoringCurves } from './ScoringCurves';
import { GAME_CONFIG } from '../../types/constants';

export enum ActionBucket {
    SURVIVAL = 'SURVIVAL', // Emergency actions (sell for resources, etc.)
    DEFENSE = 'DEFENSE', // Placement and upgrades for defense
    ECONOMY = 'ECONOMY', // Resource optimization
    EXPANSION = 'EXPANSION', // Forward placement, aggressive moves
}

export interface BucketWeights {
    [ActionBucket.SURVIVAL]: number;
    [ActionBucket.DEFENSE]: number;
    [ActionBucket.ECONOMY]: number;
    [ActionBucket.EXPANSION]: number;
}

export interface GameContext {
    healthPercent: number; // KM health 0-100
    resources: number;
    threatLevel: number; // 0-100
    coveragePercent: number; // 0-100
    waveNumber: number;
    isWaveActive: boolean;
}

export class ActionBucketing {
    /**
     * Calculate bucket weights based on game context
     */
    static calculateBucketWeights(context: GameContext): BucketWeights {
        const weights: BucketWeights = {
            [ActionBucket.SURVIVAL]: 0,
            [ActionBucket.DEFENSE]: 0,
            [ActionBucket.ECONOMY]: 0,
            [ActionBucket.EXPANSION]: 0,
        };

        // SURVIVAL: Exponential urgency when health is low
        if (context.healthPercent < 50) {
            weights[ActionBucket.SURVIVAL] =
                ScoringCurves.PRESETS.healthUrgency(context.healthPercent / 100) * 2.0; // 2x multiplier for survival
        }

        // DEFENSE: High when threat is high or coverage is low
        const threatScore = ScoringCurves.PRESETS.threatResponse(context.threatLevel);
        const coverageGapScore = ScoringCurves.PRESETS.coverageGap(100 - context.coveragePercent);
        weights[ActionBucket.DEFENSE] = Math.max(threatScore, coverageGapScore) * 1.5;

        // ECONOMY: Higher in early game, lower when threatened
        const earlyGameBonus = context.waveNumber < 5 ? 0.3 : 0;
        const threatPenalty = context.threatLevel > 50 ? 0.5 : 0;
        weights[ActionBucket.ECONOMY] = 0.5 + earlyGameBonus - threatPenalty;

        // EXPANSION: Only when stable
        if (
            context.healthPercent > 70 &&
            context.coveragePercent > 60 &&
            context.threatLevel < 40
        ) {
            weights[ActionBucket.EXPANSION] = 0.8;
        }

        // Normalize weights
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        if (total > 0) {
            for (const bucket of Object.keys(weights) as ActionBucket[]) {
                weights[bucket] /= total;
            }
        }

        return weights;
    }

    /**
     * Classify an action into a bucket
     */
    static classifyAction(action: AIAction): ActionBucket {
        switch (action.type) {
            case AIActionType.SELL_TURRET:
                // Selling is usually survival (need resources)
                return ActionBucket.SURVIVAL;

            case AIActionType.PLACE_TURRET: {
                // Placement depends on position
                // Close to KM = defense, far = expansion
                const params = action.params as { x: number; y: number };
                const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
                const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
                const distFromKM = Math.sqrt(
                    (params.x - centerX) ** 2 + (params.y - centerY) ** 2
                );
                return distFromKM < 250 ? ActionBucket.DEFENSE : ActionBucket.EXPANSION;
            }

            case AIActionType.UPGRADE_TURRET:
                // Upgrades are generally defense
                return ActionBucket.DEFENSE;

            default:
                return ActionBucket.DEFENSE;
        }
    }

    /**
     * Score and filter actions by bucket
     */
    static prioritizeActions(actions: AIAction[], context: GameContext): AIAction[] {
        const weights = this.calculateBucketWeights(context);

        // Group actions by bucket
        const buckets: Record<ActionBucket, AIAction[]> = {
            [ActionBucket.SURVIVAL]: [],
            [ActionBucket.DEFENSE]: [],
            [ActionBucket.ECONOMY]: [],
            [ActionBucket.EXPANSION]: [],
        };

        for (const action of actions) {
            const bucket = this.classifyAction(action);
            buckets[bucket].push(action);
        }

        // Find winning bucket (highest weight with actions)
        let winningBucket: ActionBucket = ActionBucket.DEFENSE;
        let highestWeight = 0;

        for (const [bucket, bucketActions] of Object.entries(buckets)) {
            if (bucketActions.length > 0) {
                const weight = weights[bucket as ActionBucket];
                if (weight > highestWeight) {
                    highestWeight = weight;
                    winningBucket = bucket as ActionBucket;
                }
            }
        }

        // Return actions from winning bucket, sorted by priority
        const winningActions = buckets[winningBucket];
        winningActions.sort((a, b) => b.priority - a.priority);

        return winningActions;
    }
}
