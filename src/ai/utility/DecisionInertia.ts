/**
 * DecisionInertia
 *
 * Prevents rapid action switching by giving bonus to current action.
 * Creates more coherent, human-like behavior.
 *
 * @module ai/utility/DecisionInertia
 */

import { AIAction, AIActionType } from '../types';

export interface InertiaConfig {
    /** Bonus added to current action's priority */
    currentActionBonus: number;
    /** How long an action stays "current" after completion (ms) */
    persistenceTime: number;
    /** Minimum priority difference to switch actions */
    switchThreshold: number;
}

export const DEFAULT_INERTIA_CONFIG: InertiaConfig = {
    currentActionBonus: 15,
    persistenceTime: 2000,
    switchThreshold: 10,
};

export class DecisionInertia {
    private currentAction: AIAction | null = null;
    private currentActionType: AIActionType | null = null;
    private lastActionTime: number = 0;
    private config: InertiaConfig;

    constructor(config: Partial<InertiaConfig> = {}) {
        this.config = { ...DEFAULT_INERTIA_CONFIG, ...config };
    }

    /**
     * Apply inertia bonus to actions
     */
    applyInertia(actions: AIAction[], currentTime: number): AIAction[] {
        // Check if current action has expired
        if (currentTime - this.lastActionTime > this.config.persistenceTime) {
            this.currentAction = null;
            this.currentActionType = null;
        }

        if (!this.currentActionType) {
            return actions;
        }

        // Apply bonus to actions of same type
        return actions.map((action) => {
            if (action.type === this.currentActionType) {
                return {
                    ...action,
                    priority: action.priority + this.config.currentActionBonus,
                };
            }
            return action;
        });
    }

    /**
     * Check if we should switch to a new action
     */
    shouldSwitch(newAction: AIAction, currentTime: number): boolean {
        // Always switch if no current action
        if (!this.currentAction) {
            return true;
        }

        // Check if current action expired
        if (currentTime - this.lastActionTime > this.config.persistenceTime) {
            return true;
        }

        // Only switch if new action is significantly better
        const priorityDiff = newAction.priority - this.currentAction.priority;
        return priorityDiff > this.config.switchThreshold;
    }

    /**
     * Record that an action was taken
     */
    recordAction(action: AIAction, currentTime: number): void {
        this.currentAction = action;
        this.currentActionType = action.type;
        this.lastActionTime = currentTime;
    }

    /**
     * Clear current action (e.g., on game reset)
     */
    reset(): void {
        this.currentAction = null;
        this.currentActionType = null;
        this.lastActionTime = 0;
    }

    /**
     * Get current action for debugging
     */
    getCurrentAction(): AIAction | null {
        return this.currentAction;
    }
}
