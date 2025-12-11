/**
 * AI Auto-Play Manager
 *
 * Main controller for the AI auto-play system.
 * Orchestrates threat analysis, coverage analysis, action planning, and execution.
 *
 * The AI MUST follow all game rules:
 * - Uses the same manager APIs as player input
 * - Respects game state (paused, game over)
 * - Does not act faster than decision interval allows
 *
 * @module ai/AIAutoPlayManager
 */

import { AUTOPLAY_CONFIG } from '../config/autoplay.config';
import { ThreatAnalyzer } from './ThreatAnalyzer';
import { CoverageAnalyzer } from './CoverageAnalyzer';
import { ActionPlanner } from './ActionPlanner';
import { ActionExecutor } from './ActionExecutor';
import type { PlacementManager } from '../game/PlacementManager';
import type { UpgradeManager } from '../game/UpgradeManager';
import type { ResourceManager } from '../game/resourceManager';
import type { GameState } from '../game/gameState';
import type { GameWorld } from '../ecs/world';
import type { AIAction, AIStatus } from './types';
import { AIPersonality } from './types';

/**
 * Main AI Auto-Play controller.
 */
export class AIAutoPlayManager {
    private enabled: boolean = AUTOPLAY_CONFIG.ENABLED_BY_DEFAULT;
    private personality: AIPersonality = AIPersonality.BALANCED;
    private threatAnalyzer: ThreatAnalyzer;
    private coverageAnalyzer: CoverageAnalyzer;
    private planner: ActionPlanner;
    private executor: ActionExecutor;
    private gameState: GameState;
    private lastDecisionTime: number = 0;
    private currentAction: AIAction | null = null;

    constructor(
        world: GameWorld,
        placementManager: PlacementManager,
        upgradeManager: UpgradeManager,
        resourceManager: ResourceManager,
        gameState: GameState,
        getKobayashiMaruId: () => number
    ) {
        this.gameState = gameState;

        // Analyzers are READ-ONLY - they query but never modify
        this.threatAnalyzer = new ThreatAnalyzer(world, getKobayashiMaruId);
        this.coverageAnalyzer = new CoverageAnalyzer(world);

        // Planner uses analyzers and resource manager
        this.planner = new ActionPlanner(
            this.threatAnalyzer,
            this.coverageAnalyzer,
            resourceManager
        );

        // Executor uses ONLY manager APIs - enforces all game rules
        this.executor = new ActionExecutor(
            placementManager,
            upgradeManager,
            resourceManager
        );
    }

    /**
     * Toggle AI enabled state
     */
    toggle(): boolean {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.currentAction = null;
        }
        return this.enabled;
    }

    /**
     * Check if AI is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Set AI personality
     */
    setPersonality(personality: AIPersonality): void {
        this.personality = personality;
    }

    /**
     * Get current personality
     */
    getPersonality(): AIPersonality {
        return this.personality;
    }

    /**
     * Update AI - called each frame when enabled
     * @param _deltaTime - Time since last frame (unused but may be needed for timing)
     * @param gameTime - Current game time in seconds
     */
    update(_deltaTime: number, gameTime: number): void {
        // RULE: AI does nothing when disabled
        if (!this.enabled) return;

        // RULE: AI respects game state (same as player input)
        if (!this.gameState.isPlaying()) {
            return; // Don't act when paused or game over
        }

        // RULE: AI respects decision interval (no superhuman speed)
        const intervalSeconds = AUTOPLAY_CONFIG.DECISION_INTERVAL_MS / 1000;
        if (gameTime - this.lastDecisionTime < intervalSeconds) {
            return;
        }

        this.lastDecisionTime = gameTime;

        // Plan actions
        const actions = this.planner.planActions();

        if (actions.length > 0) {
            this.currentAction = actions[0];

            // Validate action before execution
            if (this.executor.canExecute(this.currentAction)) {
                // Execute through managers - they enforce all game rules
                const result = this.executor.execute(this.currentAction);
                if (!result.success) {
                    // Action failed validation - clear it
                    this.currentAction = null;
                }
            } else {
                this.currentAction = null;
            }
        } else {
            this.currentAction = null;
        }
    }

    /**
     * Get current AI status for UI display
     */
    getStatus(): AIStatus {
        return {
            enabled: this.enabled,
            personality: this.personality,
            currentAction: this.currentAction,
            threatLevel: this.threatAnalyzer.getOverallThreatLevel(),
            coveragePercent: this.coverageAnalyzer.analyze().totalCoverage * 100,
            lastDecisionTime: this.lastDecisionTime,
        };
    }

    /**
     * Reset AI state (for game restart)
     */
    reset(): void {
        this.lastDecisionTime = 0;
        this.currentAction = null;
        // Keep enabled state and personality
    }
}
