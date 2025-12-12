/**
 * Action Planner for AI Auto-Play
 *
 * Plans AI actions based on threat and coverage analysis.
 * Uses faction-aware turret selection for intelligent counter-play.
 *
 * @module ai/ActionPlanner
 */

import { query, hasComponent } from 'bitecs';
import { TURRET_CONFIG, TurretType, UpgradePath, UPGRADE_CONFIG } from '../types/constants';
import { AUTOPLAY_CONFIG } from '../config/autoplay.config';
import { Turret, TurretUpgrade, Position } from '../ecs/components';
import type { GameWorld } from '../ecs/world';
import type { ResourceManager } from '../game/resourceManager';
import type { ThreatAnalyzer } from './ThreatAnalyzer';
import type { CoverageAnalyzer } from './CoverageAnalyzer';
import type { AIAction, PlacementParams, UpgradeParams, ThreatVector } from './types';
import { AIActionType } from './types';

/**
 * Plans AI actions based on game state analysis.
 * Uses faction composition to select optimal turret types.
 */
export class ActionPlanner {
    private threatAnalyzer: ThreatAnalyzer;
    private coverageAnalyzer: CoverageAnalyzer;
    private resourceManager: ResourceManager;
    private world: GameWorld;

    constructor(
        threatAnalyzer: ThreatAnalyzer,
        coverageAnalyzer: CoverageAnalyzer,
        resourceManager: ResourceManager,
        world: GameWorld
    ) {
        this.threatAnalyzer = threatAnalyzer;
        this.coverageAnalyzer = coverageAnalyzer;
        this.resourceManager = resourceManager;
        this.world = world;
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

        // Analyze coverage and threats
        const coverage = this.coverageAnalyzer.analyze();
        const threats = this.threatAnalyzer.analyzeThreats();

        // Plan placement if coverage is low
        if (coverage.totalCoverage < AUTOPLAY_CONFIG.UPGRADE_THRESHOLD) {
            const placement = this.planPlacement(availableResources, coverage.weakestSector, threats);
            if (placement) {
                actions.push(placement);
            }
        } else {
            // Coverage is good, consider upgrading existing turrets
            const upgrade = this.planUpgrade(availableResources, threats);
            if (upgrade) {
                actions.push(upgrade);
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
        weakestSector: number,
        threats: ThreatVector[]
    ): AIAction | null {
        // Find best position in weakest sector first - this determines traffic
        const position = this.coverageAnalyzer.findBestPositionInSector(weakestSector, threats);

        // Select turret type based on traffic at this position
        const turretType = this.selectTurretTypeForPosition(
            position.x,
            position.y,
            availableResources,
            threats
        );

        if (turretType === null) {
            return null;
        }

        const config = TURRET_CONFIG[turretType];
        if (!config || config.cost > availableResources) {
            return null;
        }

        // Calculate priority based on coverage gap and threat
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
            expectedValue: config.damage * config.fireRate * 10,
            params,
        };
    }

    /**
     * Plan an upgrade action for existing turrets
     */
    private planUpgrade(
        availableResources: number,
        threats: ThreatVector[]
    ): AIAction | null {
        // Find all turrets with upgrade potential
        const turrets = query(this.world, [Turret, TurretUpgrade, Position]);

        if (turrets.length === 0) {
            return null;
        }

        let bestUpgrade: {
            turretId: number;
            upgradePath: number;
            cost: number;
            value: number;
        } | null = null;

        for (const turretId of turrets) {
            // Check each upgrade path
            for (const path of [UpgradePath.DAMAGE, UpgradePath.RANGE, UpgradePath.FIRE_RATE]) {
                const currentLevel = this.getUpgradeLevel(turretId, path);
                const maxLevel = UPGRADE_CONFIG[path].maxLevel;

                if (currentLevel >= maxLevel) {
                    continue;
                }

                const cost = UPGRADE_CONFIG[path].costs[currentLevel];
                if (cost > availableResources) {
                    continue;
                }

                // Calculate upgrade value based on turret's position and traffic
                const value = this.calculateUpgradeValue(turretId, path, threats);

                if (!bestUpgrade || value > bestUpgrade.value) {
                    bestUpgrade = { turretId, upgradePath: path, cost, value };
                }
            }
        }

        if (!bestUpgrade) {
            return null;
        }

        const params: UpgradeParams = {
            turretId: bestUpgrade.turretId,
            upgradePath: bestUpgrade.upgradePath,
        };

        // Upgrades have slightly lower priority than placements
        const priority = 40 + (bestUpgrade.value / 100) * 30;

        return {
            type: AIActionType.UPGRADE_TURRET,
            priority,
            cost: bestUpgrade.cost,
            expectedValue: bestUpgrade.value,
            params,
        };
    }

    /**
     * Get current upgrade level for a turret
     */
    private getUpgradeLevel(turretId: number, path: number): number {
        if (!hasComponent(this.world, turretId, TurretUpgrade)) {
            return 0;
        }

        switch (path) {
            case UpgradePath.DAMAGE:
                return TurretUpgrade.damageLevel[turretId];
            case UpgradePath.RANGE:
                return TurretUpgrade.rangeLevel[turretId];
            case UpgradePath.FIRE_RATE:
                return TurretUpgrade.fireRateLevel[turretId];
            case UpgradePath.MULTI_TARGET:
                return TurretUpgrade.multiTargetLevel[turretId];
            case UpgradePath.SPECIAL:
                return TurretUpgrade.specialLevel[turretId];
            default:
                return 0;
        }
    }

    /**
     * Calculate the value of upgrading a specific turret path
     */
    private calculateUpgradeValue(
        turretId: number,
        path: number,
        threats: ThreatVector[]
    ): number {
        const turretX = Position.x[turretId];
        const turretY = Position.y[turretId];
        const range = Turret.range[turretId];

        // Count threats within range
        let threatsInRange = 0;
        for (const threat of threats) {
            const dx = threat.position.x - turretX;
            const dy = threat.position.y - turretY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= range * 1.5) {
                threatsInRange++;
            }
        }

        // Base value from threats in range
        let value = threatsInRange * 20;

        // Add bonus based on upgrade type
        switch (path) {
            case UpgradePath.DAMAGE:
                value += 25; // Damage is always useful
                break;
            case UpgradePath.RANGE:
                value += 15; // Range helps coverage
                break;
            case UpgradePath.FIRE_RATE:
                value += threatsInRange > 3 ? 30 : 10; // Fire rate for high traffic
                break;
        }

        return value;
    }

    /**
     * Select turret type based on traffic density at a specific position
     * High traffic areas get fast-firing turrets, low traffic areas get long-range
     */
    private selectTurretTypeForPosition(
        x: number,
        y: number,
        availableResources: number,
        threats: ThreatVector[]
    ): number | null {
        const flowAnalyzer = this.coverageAnalyzer.getFlowAnalyzer();
        const traffic = flowAnalyzer.getTrafficAt(x, y);

        // High traffic areas need high fire rate turrets for swarms
        if (traffic > 0.7) {
            // Prefer Phaser Array for high-volume areas
            if (TURRET_CONFIG[TurretType.PHASER_ARRAY].cost <= availableResources) {
                return TurretType.PHASER_ARRAY;
            }
        }

        // Medium traffic - balanced turrets
        if (traffic > 0.4) {
            if (TURRET_CONFIG[TurretType.DISRUPTOR_BANK].cost <= availableResources) {
                return TurretType.DISRUPTOR_BANK;
            }
        }

        // Low traffic (flanks) - long range turrets can cover more area
        if (TURRET_CONFIG[TurretType.TORPEDO_LAUNCHER].cost <= availableResources) {
            return TurretType.TORPEDO_LAUNCHER;
        }

        // Fallback to existing faction-based selection
        return this.selectTurretType(availableResources, threats);
    }

    /**
     * Select the best turret type based on resources and current threats
     * Uses faction-based counter logic for intelligent selection
     */
    private selectTurretType(availableResources: number, threats: ThreatVector[]): number | null {
        // Count threats by faction
        const factionCounts: Record<number, number> = {};
        for (const threat of threats) {
            factionCounts[threat.factionId] = (factionCounts[threat.factionId] || 0) + 1;
        }

        // Calculate effectiveness score for each affordable turret type
        const turretScores: { type: number; score: number }[] = [];
        const effectivenessMatrix = AUTOPLAY_CONFIG.TURRET_FACTION_EFFECTIVENESS;

        for (const [typeStr, config] of Object.entries(TURRET_CONFIG)) {
            const type = parseInt(typeStr);
            if (config.cost > availableResources) {
                continue;
            }

            // Calculate weighted effectiveness based on current threats
            let effectivenessScore = 0;
            let totalThreats = 0;

            for (const [factionIdStr, count] of Object.entries(factionCounts)) {
                const factionId = parseInt(factionIdStr);
                const effectiveness = effectivenessMatrix[type]?.[factionId] ?? 1.0;
                effectivenessScore += effectiveness * count;
                totalThreats += count;
            }

            // Normalize by threat count, default to 1.0 if no threats
            const avgEffectiveness = totalThreats > 0 ? effectivenessScore / totalThreats : 1.0;

            // Combine with base DPS/cost value
            const dps = config.damage * config.fireRate;
            const baseValue = dps / config.cost;

            // Final score: effectiveness-weighted value
            const score = baseValue * avgEffectiveness * 100;

            turretScores.push({ type, score });
        }

        if (turretScores.length === 0) {
            return null;
        }

        // If no active threats, prefer balanced turrets (fallback behavior)
        if (threats.length === 0) {
            const disruptor = turretScores.find((t) => t.type === TurretType.DISRUPTOR_BANK);
            if (disruptor) {
                return disruptor.type;
            }
            const phaser = turretScores.find((t) => t.type === TurretType.PHASER_ARRAY);
            if (phaser) {
                return phaser.type;
            }
        }

        // Pick highest scoring turret
        turretScores.sort((a, b) => b.score - a.score);
        return turretScores[0].type;
    }
}
