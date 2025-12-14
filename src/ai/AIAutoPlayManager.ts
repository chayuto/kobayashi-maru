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
import { AIMoodEngine, MoodContext } from './humanization/AIMoodEngine';
import { AIMessageGenerator, AIMessage } from './humanization/AIMessageGenerator';
import type { PlacementManager } from '../game/PlacementManager';
import type { UpgradeManager } from '../game/UpgradeManager';
import type { ResourceManager } from '../game/resourceManager';
import type { GameState } from '../game/gameState';
import type { GameWorld } from '../ecs/world';
import type { AIAction, AIStatus, AIStatusExtended, PlacementParams } from './types';
import { AIPersonality, AIMood, AIPhase } from './types';

/**
 * Context for HUD updates (provided by game)
 */
export interface AIHUDContext {
    waveNumber: number;
    isBossWave: boolean;
    kmHealthPercent: number;
    resources: number;
}

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

    // HUD engagement components
    private moodEngine: AIMoodEngine;
    private messageGenerator: AIMessageGenerator;
    private lastMood: AIMood = AIMood.CALM;
    private lastMoodMessage: string = 'Awaiting orders.';
    private lastPhase: AIPhase = AIPhase.EARLY_EXPANSION;
    private plannedAction: AIAction | null = null;
    private decisionsThisWave: number = 0;
    private successfulActions: number = 0;
    private currentWave: number = 0;

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
            resourceManager,
            world
        );

        // Executor uses ONLY manager APIs - enforces all game rules
        this.executor = new ActionExecutor(
            placementManager,
            upgradeManager,
            resourceManager
        );

        // HUD engagement
        this.moodEngine = new AIMoodEngine();
        this.messageGenerator = new AIMessageGenerator();
        this.messageGenerator.setPersonality(this.personality);
    }

    /**
     * Get coverage analyzer for debug visualization
     */
    getCoverageAnalyzer(): CoverageAnalyzer {
        return this.coverageAnalyzer;
    }

    /**
     * Toggle AI enabled state
     */
    toggle(): boolean {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.currentAction = null;
            this.plannedAction = null;
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
        this.messageGenerator.setPersonality(personality);
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

        // Store planned action for HUD ghost preview
        this.plannedAction = actions.length > 0 ? actions[0] : null;

        if (actions.length > 0) {
            this.currentAction = actions[0];
            this.decisionsThisWave++;

            // Validate action before execution
            if (this.executor.canExecute(this.currentAction)) {
                // Execute through managers - they enforce all game rules
                const result = this.executor.execute(this.currentAction);
                if (result.success) {
                    this.successfulActions++;
                    // Generate message for successful action
                    this.messageGenerator.generateActionMessage(this.currentAction);
                } else {
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
     * Update HUD context (call from game loop)
     */
    updateHUDContext(context: AIHUDContext): void {
        // Reset wave stats on new wave
        if (context.waveNumber !== this.currentWave) {
            this.currentWave = context.waveNumber;
            this.decisionsThisWave = 0;
        }

        // Update mood
        const coveragePercent = this.coverageAnalyzer.analyze().totalCoverage * 100;
        const moodContext: MoodContext = {
            threatLevel: this.threatAnalyzer.getOverallThreatLevel(),
            coveragePercent,
            kmHealthPercent: context.kmHealthPercent,
            resources: context.resources,
            waveNumber: context.waveNumber,
            isBossWave: context.isBossWave,
            personality: this.personality,
        };

        const moodResult = this.moodEngine.calculateMood(moodContext);
        this.lastMood = moodResult.mood;
        this.lastMoodMessage = moodResult.message;

        // Update phase
        this.lastPhase = this.moodEngine.calculatePhase(
            context.waveNumber,
            context.isBossWave,
            context.kmHealthPercent
        );
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
     * Get extended AI status for engaging HUD display
     */
    getExtendedStatus(): AIStatusExtended {
        const baseStatus = this.getStatus();
        const plannedPosition = this.getPlannedPosition();

        return {
            ...baseStatus,
            mood: this.lastMood,
            moodMessage: this.lastMoodMessage,
            currentPhase: this.lastPhase,
            phaseFocus: this.moodEngine.getPhaseFocus(this.lastPhase),
            plannedAction: this.plannedAction,
            plannedPosition,
            upgradeTarget: null, // TODO: implement
            decisionsThisWave: this.decisionsThisWave,
            successfulActions: this.successfulActions,
        };
    }

    /**
     * Get planned placement position for ghost preview
     */
    private getPlannedPosition(): { x: number; y: number } | null {
        if (!this.plannedAction) return null;

        const params = this.plannedAction.params as PlacementParams;
        if (typeof params.x === 'number' && typeof params.y === 'number') {
            return { x: params.x, y: params.y };
        }

        return null;
    }

    /**
     * Get message history for AI thought feed
     */
    getMessageHistory(): AIMessage[] {
        return this.messageGenerator.getHistory();
    }

    /**
     * Get the message generator for adding custom messages
     */
    getMessageGenerator(): AIMessageGenerator {
        return this.messageGenerator;
    }

    /**
     * Reset AI state (for game restart)
     */
    reset(): void {
        this.lastDecisionTime = 0;
        this.currentAction = null;
        this.plannedAction = null;
        this.decisionsThisWave = 0;
        this.successfulActions = 0;
        this.currentWave = 0;
        this.lastMood = AIMood.CALM;
        this.lastMoodMessage = 'Awaiting orders.';
        this.lastPhase = AIPhase.EARLY_EXPANSION;
        this.moodEngine.reset();
        this.messageGenerator.reset();
        // Keep enabled state and personality
    }
}
