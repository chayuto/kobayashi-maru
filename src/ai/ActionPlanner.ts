/**
 * Action Planner for AI Auto-Play
 *
 * Plans AI actions based on threat and coverage analysis.
 *
 * @module ai/ActionPlanner
 */

import { TURRET_CONFIG, TurretType } from '../types/constants';
import { AUTOPLAY_CONFIG } from '../config/autoplay.config';
import type { ResourceManager } from '../game/resourceManager';
import type { ThreatAnalyzer } from './ThreatAnalyzer';
import type { CoverageAnalyzer } from './CoverageAnalyzer';
import type { AIAction, PlacementParams } from './types';
import { AIActionType } from './types';

/**
 * Plans AI actions based on game state analysis.
 */
export class ActionPlanner {
    private threatAnalyzer: ThreatAnalyzer;
    private coverageAnalyzer: CoverageAnalyzer;
    private resourceManager: ResourceManager;

    constructor(
        threatAnalyzer: ThreatAnalyzer,
        coverageAnalyzer: CoverageAnalyzer,
        resourceManager: ResourceManager
    ) {
        this.threatAnalyzer = threatAnalyzer;
        this.coverageAnalyzer = coverageAnalyzer;
        this.resourceManager = resourceManager;
    }

    /**
     * Plan actions based on current game state
     * @returns Sorted array of actions (highest priority first)
     */
    planActions(): AIAction[] {
        const actions: AIAction[] = [];
        const resources = this.resourceManager.getResources();
        const reserve = AUTOPLAY_CONFIG.EMERGENCY_RESERVE;
        const availableResources = Math.max(0, resources - reserve);

        // Analyze coverage
        const coverage = this.coverageAnalyzer.analyze();

        // Plan placement if coverage is low
        if (coverage.totalCoverage < AUTOPLAY_CONFIG.UPGRADE_THRESHOLD) {
            const placement = this.planPlacement(availableResources, coverage.weakestSector);
            if (placement) {
                actions.push(placement);
            }
        }

        // Sort by priority (highest first)
        actions.sort((a, b) => b.priority - a.priority);

        return actions;
    }

    /**
     * Plan a turret placement action
     */
    private planPlacement(
        availableResources: number,
        weakestSector: number
    ): AIAction | null {
        // Select turret type based on what we can afford and threat
        const turretType = this.selectTurretType(availableResources);
        if (turretType === null) {
            return null;
        }

        const config = TURRET_CONFIG[turretType];
        if (!config || config.cost > availableResources) {
            return null;
        }

        // Find best position in weakest sector, using threat data
        const threats = this.threatAnalyzer.analyzeThreats();
        const position = this.coverageAnalyzer.findBestPositionInSector(weakestSector, threats);

        // Calculate priority based on coverage gap
        const threatLevel = this.threatAnalyzer.getOverallThreatLevel();
        const coverage = this.coverageAnalyzer.analyze();
        const coverageGap = 1 - coverage.totalCoverage;
        const priority = 50 + coverageGap * 30 + (threatLevel / 100) * 20;

        const params: PlacementParams = {
            x: position.x,
            y: position.y,
            turretType,
        };

        return {
            type: AIActionType.PLACE_TURRET,
            priority,
            cost: config.cost,
            expectedValue: config.damage * config.fireRate * 10, // Simple DPS value
            params,
        };
    }

    /**
     * Select the best turret type based on resources and threats
     */
    private selectTurretType(availableResources: number): number | null {
        // Get affordable turret types, sorted by cost (cheapest first for starter strategy)
        const affordableTurrets: { type: number; cost: number; value: number }[] = [];

        for (const [typeStr, config] of Object.entries(TURRET_CONFIG)) {
            const type = parseInt(typeStr);
            if (config.cost <= availableResources) {
                // Simple value = DPS per cost ratio
                const dps = config.damage * config.fireRate;
                const value = dps / config.cost;
                affordableTurrets.push({ type, cost: config.cost, value });
            }
        }

        if (affordableTurrets.length === 0) {
            return null;
        }

        // For MVP: prefer balanced turrets (Disruptor or Phaser)
        const disruptor = affordableTurrets.find((t) => t.type === TurretType.DISRUPTOR_BANK);
        if (disruptor) {
            return disruptor.type;
        }

        const phaser = affordableTurrets.find((t) => t.type === TurretType.PHASER_ARRAY);
        if (phaser) {
            return phaser.type;
        }

        // Otherwise pick best value
        affordableTurrets.sort((a, b) => b.value - a.value);
        return affordableTurrets[0].type;
    }
}
