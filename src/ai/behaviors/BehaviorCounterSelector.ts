/**
 * BehaviorCounterSelector
 *
 * Selects optimal turret types to counter specific enemy behaviors.
 *
 * @module ai/behaviors/BehaviorCounterSelector
 */

import { AIBehaviorType, TurretType, TURRET_CONFIG } from '../../types/constants';
import type { ThreatVector } from '../types';

export interface CounterRecommendation {
    turretType: number;
    score: number;
    reason: string;
}

export class BehaviorCounterSelector {
    /**
     * Counter effectiveness matrix
     * [BehaviorType][TurretType] = effectiveness (0-2)
     */
    private static readonly COUNTER_MATRIX: Record<number, Record<number, number>> = {
        [AIBehaviorType.DIRECT]: {
            [TurretType.PHASER_ARRAY]: 1.0,
            [TurretType.TORPEDO_LAUNCHER]: 1.2,
            [TurretType.DISRUPTOR_BANK]: 1.0,
            [TurretType.TETRYON_BEAM]: 1.0,
            [TurretType.PLASMA_CANNON]: 1.1,
            [TurretType.POLARON_BEAM]: 0.9,
        },
        [AIBehaviorType.STRAFE]: {
            [TurretType.PHASER_ARRAY]: 1.3, // High fire rate catches weaving
            [TurretType.TORPEDO_LAUNCHER]: 0.6, // Slow projectiles miss
            [TurretType.DISRUPTOR_BANK]: 1.1,
            [TurretType.TETRYON_BEAM]: 1.0,
            [TurretType.PLASMA_CANNON]: 0.8,
            [TurretType.POLARON_BEAM]: 1.4, // Slow effect counters weaving
        },
        [AIBehaviorType.ORBIT]: {
            [TurretType.PHASER_ARRAY]: 0.8,
            [TurretType.TORPEDO_LAUNCHER]: 1.5, // Long range hits orbiters
            [TurretType.DISRUPTOR_BANK]: 1.0,
            [TurretType.TETRYON_BEAM]: 1.1,
            [TurretType.PLASMA_CANNON]: 1.2, // DOT while orbiting
            [TurretType.POLARON_BEAM]: 1.0,
        },
        [AIBehaviorType.SWARM]: {
            [TurretType.PHASER_ARRAY]: 1.5, // Best for swarms
            [TurretType.TORPEDO_LAUNCHER]: 0.7,
            [TurretType.DISRUPTOR_BANK]: 1.2,
            [TurretType.TETRYON_BEAM]: 1.0,
            [TurretType.PLASMA_CANNON]: 1.3, // DOT spreads
            [TurretType.POLARON_BEAM]: 0.9,
        },
        [AIBehaviorType.HUNTER]: {
            [TurretType.PHASER_ARRAY]: 1.1,
            [TurretType.TORPEDO_LAUNCHER]: 1.3, // Kill before they reach turrets
            [TurretType.DISRUPTOR_BANK]: 1.2,
            [TurretType.TETRYON_BEAM]: 1.0,
            [TurretType.PLASMA_CANNON]: 1.0,
            [TurretType.POLARON_BEAM]: 1.2, // Slow them down
        },
    };

    /**
     * Get best turret type to counter current threats
     */
    selectCounter(threats: ThreatVector[], availableResources: number): CounterRecommendation[] {
        // Count threats by behavior type
        const behaviorCounts: Record<number, number> = {};
        const behaviorThreat: Record<number, number> = {};

        for (const threat of threats) {
            const behavior = threat.behaviorType;
            behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
            behaviorThreat[behavior] = (behaviorThreat[behavior] || 0) + threat.threatLevel;
        }

        // Score each turret type
        const recommendations: CounterRecommendation[] = [];

        for (const [turretTypeStr, config] of Object.entries(TURRET_CONFIG)) {
            const turretType = parseInt(turretTypeStr);

            if (config.cost > availableResources) continue;

            let totalScore = 0;
            const reasons: string[] = [];

            for (const [behaviorStr, count] of Object.entries(behaviorCounts)) {
                const behavior = parseInt(behaviorStr);
                const effectiveness =
                    BehaviorCounterSelector.COUNTER_MATRIX[behavior]?.[turretType] || 1.0;
                const threatWeight = behaviorThreat[behavior] || 0;

                const contribution = effectiveness * count * (threatWeight / 100);
                totalScore += contribution;

                if (effectiveness > 1.2) {
                    reasons.push(`Strong vs ${this.getBehaviorName(behavior)}`);
                }
            }

            // Cost efficiency bonus
            const dps = config.damage * config.fireRate;
            const efficiency = dps / config.cost;
            totalScore += efficiency * 10;

            recommendations.push({
                turretType,
                score: totalScore,
                reason: reasons.length > 0 ? reasons.join(', ') : 'General purpose',
            });
        }

        // Sort by score
        recommendations.sort((a, b) => b.score - a.score);

        return recommendations;
    }

    /**
     * Get human-readable behavior name
     */
    private getBehaviorName(behavior: number): string {
        switch (behavior) {
            case AIBehaviorType.DIRECT:
                return 'Direct (Klingon)';
            case AIBehaviorType.STRAFE:
                return 'Strafe (Romulan)';
            case AIBehaviorType.ORBIT:
                return 'Orbit (Tholian)';
            case AIBehaviorType.SWARM:
                return 'Swarm (Borg)';
            case AIBehaviorType.HUNTER:
                return 'Hunter (8472)';
            default:
                return 'Unknown';
        }
    }

    /**
     * Get placement strategy for behavior type
     */
    getPlacementStrategy(dominantBehavior: number): {
        preferredDistance: number;
        spreadPattern: 'ring' | 'corridor' | 'layered';
        notes: string;
    } {
        switch (dominantBehavior) {
            case AIBehaviorType.STRAFE:
                return {
                    preferredDistance: 200,
                    spreadPattern: 'corridor',
                    notes: 'Wide coverage to catch weaving enemies',
                };

            case AIBehaviorType.ORBIT:
                return {
                    preferredDistance: 280, // Just inside orbit radius
                    spreadPattern: 'ring',
                    notes: 'Ring at orbit distance to intercept',
                };

            case AIBehaviorType.HUNTER:
                return {
                    preferredDistance: 150,
                    spreadPattern: 'layered',
                    notes: 'Layered defense to protect inner turrets',
                };

            case AIBehaviorType.SWARM:
                return {
                    preferredDistance: 180,
                    spreadPattern: 'ring',
                    notes: 'Even coverage for mass enemies',
                };

            default:
                return {
                    preferredDistance: 200,
                    spreadPattern: 'corridor',
                    notes: 'Standard interception placement',
                };
        }
    }
}
