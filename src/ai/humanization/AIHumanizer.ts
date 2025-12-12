/**
 * AIHumanizer
 *
 * Makes AI behavior feel more natural/human-like.
 * Adds reaction delays, decision variation, and imperfection.
 *
 * @module ai/humanization/AIHumanizer
 */

import type { AIAction } from '../types';

export interface HumanizationConfig {
    /** Base reaction delay in ms (AI thinks before acting) */
    reactionDelay: number;
    /** Random variation added to delay (0-1) */
    delayVariation: number;
    /** Chance to skip an action (0-1, simulates distraction) */
    skipChance: number;
    /** Position variation in pixels (imprecise placement) */
    positionVariation: number;
    /** Chance to make suboptimal choice (0-1) */
    suboptimalChance: number;
}

export const DEFAULT_HUMANIZATION_CONFIG: HumanizationConfig = {
    reactionDelay: 200,
    delayVariation: 0.3,
    skipChance: 0.05,
    positionVariation: 20,
    suboptimalChance: 0.1,
};

export class AIHumanizer {
    private config: HumanizationConfig;
    private lastActionTime: number = 0;
    private pendingAction: AIAction | null = null;
    private pendingActionTime: number = 0;

    constructor(config: Partial<HumanizationConfig> = {}) {
        this.config = { ...DEFAULT_HUMANIZATION_CONFIG, ...config };
    }

    /**
     * Apply humanization to an action
     * Returns null if action should be skipped or delayed
     */
    humanizeAction(action: AIAction, currentTime: number): AIAction | null {
        // Check if we should skip (distraction)
        if (Math.random() < this.config.skipChance) {
            return null;
        }

        // Apply reaction delay
        if (!this.pendingAction || action !== this.pendingAction) {
            this.pendingAction = action;
            const delay = this.calculateDelay();
            this.pendingActionTime = currentTime + delay;
        }

        // Not ready yet
        if (currentTime < this.pendingActionTime) {
            return null;
        }

        // Clear pending
        this.pendingAction = null;
        this.lastActionTime = currentTime;

        // Apply imperfection
        return this.addImperfection(action);
    }

    /**
     * Calculate reaction delay with variation
     */
    private calculateDelay(): number {
        const base = this.config.reactionDelay;
        const variation = base * this.config.delayVariation * (Math.random() * 2 - 1);
        return Math.max(50, base + variation);
    }

    /**
     * Add slight imperfection to actions
     */
    private addImperfection(action: AIAction): AIAction {
        const result = { ...action };

        // Maybe make suboptimal choice (affects priority, executor can use this)
        if (Math.random() < this.config.suboptimalChance) {
            result.priority *= 0.9; // Slightly lower priority
        }

        // Add position variation for placement
        if ('x' in result.params && 'y' in result.params) {
            const params = result.params as { x: number; y: number; turretType: number };
            const variation = this.config.positionVariation;
            result.params = {
                ...params,
                x: params.x + (Math.random() - 0.5) * variation * 2,
                y: params.y + (Math.random() - 0.5) * variation * 2,
            };
        }

        return result;
    }

    /**
     * Reset humanizer state
     */
    reset(): void {
        this.lastActionTime = 0;
        this.pendingAction = null;
        this.pendingActionTime = 0;
    }

    /**
     * Get time since last action (for pacing)
     */
    getTimeSinceLastAction(currentTime: number): number {
        return currentTime - this.lastActionTime;
    }
}
