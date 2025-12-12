/**
 * Threat Analyzer for AI Auto-Play
 *
 * Analyzes enemy threats by querying ECS components.
 * READ-ONLY access to game state - same data available to player via UI.
 *
 * @module ai/ThreatAnalyzer
 */

import { query, hasComponent } from 'bitecs';
import {
    Position,
    Velocity,
    Faction,
    Health,
    AIBehavior,
    EnemyVariant,
} from '../ecs/components';
import { FactionId } from '../types/config/factions';
import { AUTOPLAY_CONFIG } from '../config/autoplay.config';
import { GAME_CONFIG, AIBehaviorType } from '../types/constants';
import { BehaviorPredictor, BehaviorPrediction } from './behaviors/BehaviorPredictor';
import { BehaviorCounterSelector, CounterRecommendation } from './behaviors/BehaviorCounterSelector';
import type { GameWorld } from '../ecs/world';
import type { ThreatVector } from './types';

/**
 * Analyzes enemy threats for AI decision-making.
 * Uses ECS queries to assess current game state.
 */
export class ThreatAnalyzer {
    private world: GameWorld;
    private kmX: number;
    private kmY: number;
    private getKobayashiMaruId: () => number;
    private behaviorPredictor: BehaviorPredictor;
    private counterSelector: BehaviorCounterSelector;

    constructor(world: GameWorld, getKobayashiMaruId: () => number) {
        this.world = world;
        this.getKobayashiMaruId = getKobayashiMaruId;
        // Default to center
        this.kmX = GAME_CONFIG.WORLD_WIDTH / 2;
        this.kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
        this.behaviorPredictor = new BehaviorPredictor();
        this.counterSelector = new BehaviorCounterSelector();
    }

    /**
     * Update Kobayashi Maru position for threat calculations
     */
    private updateKMPosition(): void {
        const kmId = this.getKobayashiMaruId();
        if (kmId !== -1 && hasComponent(this.world, kmId, Position)) {
            this.kmX = Position.x[kmId];
            this.kmY = Position.y[kmId];
        }
    }

    /**
     * Analyze all enemy threats
     * @returns Sorted array of threat vectors (highest threat first)
     */
    analyzeThreats(): ThreatVector[] {
        this.updateKMPosition();

        const threats: ThreatVector[] = [];
        const enemies = query(this.world, [Position, Velocity, Faction, Health, AIBehavior]);

        for (const eid of enemies) {
            // Only process enemy factions
            const factionId = Faction.id[eid];
            if (factionId === FactionId.FEDERATION) continue;

            const x = Position.x[eid];
            const y = Position.y[eid];
            const vx = Velocity.x[eid];
            const vy = Velocity.y[eid];
            const currentHealth = Health.current[eid] ?? 0;
            const maxHealth = Health.max[eid] ?? 1;

            // Skip dead enemies
            if (currentHealth <= 0) continue;

            // Check for elite/boss status
            const isElite = hasComponent(this.world, eid, EnemyVariant)
                ? EnemyVariant.rank[eid] === 1
                : false;
            const isBoss = hasComponent(this.world, eid, EnemyVariant)
                ? EnemyVariant.rank[eid] === 2
                : false;

            const threatLevel = this.calculateThreatLevel(
                eid,
                x,
                y,
                vx,
                vy,
                currentHealth,
                maxHealth,
                factionId,
                isElite,
                isBoss
            );

            const predictedImpactTime = this.calculateImpactTime(x, y, vx, vy);

            threats.push({
                entityId: eid,
                position: { x, y },
                velocity: { x: vx, y: vy },
                predictedImpactTime,
                threatLevel,
                factionId,
                behaviorType: AIBehavior.behaviorType[eid] ?? 0,
                healthPercent: currentHealth / maxHealth,
                isElite,
                isBoss,
            });
        }

        // Sort by threat level (highest first)
        threats.sort((a, b) => b.threatLevel - a.threatLevel);

        return threats;
    }

    /**
     * Calculate threat level for a single enemy
     */
    private calculateThreatLevel(
        _eid: number,
        x: number,
        y: number,
        vx: number,
        vy: number,
        currentHealth: number,
        maxHealth: number,
        factionId: number,
        isElite: boolean,
        isBoss: boolean
    ): number {
        // Distance factor (0-100, closer = higher)
        const dx = this.kmX - x;
        const dy = this.kmY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const distanceThreat = Math.max(0, 100 - distance / 10);

        // Speed factor (0-30, faster = higher)
        const speed = Math.sqrt(vx * vx + vy * vy);
        const speedThreat = Math.min(30, speed / 5);

        // Health factor (0-20, more HP = harder to kill)
        const healthThreat = (currentHealth / maxHealth) * 20;

        // Faction modifier
        const factionModifier =
            AUTOPLAY_CONFIG.FACTION_THREAT_MODIFIERS[factionId] ?? 1.0;

        // Elite/Boss modifier
        let rankModifier = 1.0;
        if (isBoss) {
            rankModifier = 2.5;
        } else if (isElite) {
            rankModifier = 1.5;
        }

        // Calculate final threat level (capped at 100)
        const baseThreat = distanceThreat + speedThreat + healthThreat;
        return Math.min(100, baseThreat * factionModifier * rankModifier);
    }

    /**
     * Calculate estimated time until enemy reaches Kobayashi Maru
     */
    private calculateImpactTime(
        x: number,
        y: number,
        vx: number,
        vy: number
    ): number {
        const dx = this.kmX - x;
        const dy = this.kmY - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = Math.sqrt(vx * vx + vy * vy);

        if (speed <= 0) {
            return Infinity;
        }

        // Simple linear estimation (doesn't account for AI behavior patterns)
        return distance / speed;
    }

    /**
     * Get overall threat level (0-100)
     */
    getOverallThreatLevel(): number {
        const threats = this.analyzeThreats();

        if (threats.length === 0) {
            return 0;
        }

        // Weight by threat level and count
        const totalThreat = threats.reduce((sum, t) => sum + t.threatLevel, 0);
        const avgThreat = totalThreat / threats.length;

        // Scale by enemy count (more enemies = higher overall threat)
        const countMultiplier = Math.min(2, 1 + threats.length / 20);

        return Math.min(100, avgThreat * countMultiplier);
    }

    /**
     * Get entities sorted by threat for targeting decisions
     */
    getHighestThreats(count: number = 5): ThreatVector[] {
        return this.analyzeThreats().slice(0, count);
    }

    /**
     * Get predicted positions for a threat
     */
    getPredictedPositions(threat: ThreatVector, timeHorizon: number = 5.0): BehaviorPrediction {
        return this.behaviorPredictor.predict(
            threat.position.x,
            threat.position.y,
            threat.velocity.x,
            threat.velocity.y,
            threat.behaviorType,
            threat.entityId,
            timeHorizon
        );
    }

    /**
     * Get dominant behavior type among current threats
     */
    getDominantBehavior(): number {
        const threats = this.analyzeThreats();
        const behaviorCounts: Record<number, number> = {};

        for (const threat of threats) {
            behaviorCounts[threat.behaviorType] = (behaviorCounts[threat.behaviorType] || 0) + 1;
        }

        let dominant: number = AIBehaviorType.DIRECT;
        let maxCount = 0;

        for (const [behavior, count] of Object.entries(behaviorCounts)) {
            if (count > maxCount) {
                maxCount = count;
                dominant = parseInt(behavior);
            }
        }

        return dominant;
    }

    /**
     * Get turret counter recommendations based on threat composition
     */
    getCounterRecommendations(availableResources: number): CounterRecommendation[] {
        const threats = this.analyzeThreats();
        return this.counterSelector.selectCounter(threats, availableResources);
    }

    /**
     * Get placement strategy based on dominant behavior
     */
    getPlacementStrategy(): ReturnType<BehaviorCounterSelector['getPlacementStrategy']> {
        const dominant = this.getDominantBehavior();
        return this.counterSelector.getPlacementStrategy(dominant);
    }
}
