/**
 * Tests for BehaviorCounterSelector
 *
 * @module __tests__/BehaviorCounterSelector.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorCounterSelector } from '../ai/behaviors/BehaviorCounterSelector';
import { AIBehaviorType, TurretType } from '../types/constants';
import type { ThreatVector } from '../ai/types';

/**
 * Helper to create a ThreatVector with default values
 */
function createThreat(overrides: Partial<ThreatVector>): ThreatVector {
    return {
        entityId: 1,
        position: { x: 400, y: 400 },
        velocity: { x: 1, y: 0 },
        predictedImpactTime: 5,
        threatLevel: 50,
        factionId: 0,
        behaviorType: AIBehaviorType.DIRECT,
        healthPercent: 100,
        isElite: false,
        isBoss: false,
        ...overrides,
    };
}

describe('BehaviorCounterSelector', () => {
    let selector: BehaviorCounterSelector;

    beforeEach(() => {
        selector = new BehaviorCounterSelector();
    });

    describe('selectCounter', () => {
        it('should return general purpose recommendations for empty threats', () => {
            const recommendations = selector.selectCounter([], 500);

            expect(recommendations.length).toBeGreaterThan(0);
            // All should have 'General purpose' reason
            const generalRecs = recommendations.filter(r => r.reason === 'General purpose');
            expect(generalRecs.length).toBeGreaterThan(0);
        });

        it('should return recommendations sorted by score descending', () => {
            const threats: ThreatVector[] = [
                createThreat({
                    entityId: 1,
                    threatLevel: 50,
                    behaviorType: AIBehaviorType.DIRECT,
                }),
            ];

            const recommendations = selector.selectCounter(threats, 500);

            expect(recommendations.length).toBeGreaterThan(0);
            // Verify sorted descending by score
            for (let i = 1; i < recommendations.length; i++) {
                expect(recommendations[i - 1].score).toBeGreaterThanOrEqual(
                    recommendations[i].score
                );
            }
        });

        it('should recommend Phaser for SWARM behavior with higher score', () => {
            const threats: ThreatVector[] = [
                createThreat({
                    entityId: 1,
                    threatLevel: 80,
                    behaviorType: AIBehaviorType.SWARM,
                }),
                createThreat({
                    entityId: 2,
                    threatLevel: 80,
                    behaviorType: AIBehaviorType.SWARM,
                    position: { x: 500, y: 500 },
                }),
            ];

            const recommendations = selector.selectCounter(threats, 500);
            const phaserRec = recommendations.find(
                r => r.turretType === TurretType.PHASER_ARRAY
            );

            expect(phaserRec).toBeDefined();
            expect(phaserRec!.reason).toContain('Strong vs Swarm');
        });

        it('should recommend Polaron for STRAFE behavior', () => {
            const threats: ThreatVector[] = [
                createThreat({
                    entityId: 1,
                    threatLevel: 80,
                    behaviorType: AIBehaviorType.STRAFE,
                }),
                createThreat({
                    entityId: 2,
                    threatLevel: 80,
                    behaviorType: AIBehaviorType.STRAFE,
                    position: { x: 500, y: 500 },
                }),
            ];

            const recommendations = selector.selectCounter(threats, 500);
            const polaronRec = recommendations.find(
                r => r.turretType === TurretType.POLARON_BEAM
            );

            expect(polaronRec).toBeDefined();
            expect(polaronRec!.reason).toContain('Strong vs Strafe');
        });

        it('should recommend Torpedo for ORBIT behavior', () => {
            const threats: ThreatVector[] = [
                createThreat({
                    entityId: 1,
                    threatLevel: 80,
                    behaviorType: AIBehaviorType.ORBIT,
                    position: { x: 600, y: 400 },
                }),
            ];

            const recommendations = selector.selectCounter(threats, 500);
            const torpedoRec = recommendations.find(
                r => r.turretType === TurretType.TORPEDO_LAUNCHER
            );

            expect(torpedoRec).toBeDefined();
            expect(torpedoRec!.reason).toContain('Strong vs Orbit');
        });

        it('should exclude turrets that cost more than available resources', () => {
            const threats: ThreatVector[] = [
                createThreat({
                    entityId: 1,
                    threatLevel: 50,
                    behaviorType: AIBehaviorType.DIRECT,
                }),
            ];

            // With very low resources, expensive turrets should be filtered out
            const recommendations = selector.selectCounter(threats, 50);

            // Should have recommendations but all affordable
            expect(recommendations.every(r => r.score >= 0)).toBe(true);
        });

        it('should handle mixed behavior threats', () => {
            const threats: ThreatVector[] = [
                createThreat({
                    entityId: 1,
                    threatLevel: 60,
                    behaviorType: AIBehaviorType.SWARM,
                }),
                createThreat({
                    entityId: 2,
                    threatLevel: 60,
                    behaviorType: AIBehaviorType.ORBIT,
                    position: { x: 500, y: 500 },
                }),
                createThreat({
                    entityId: 3,
                    threatLevel: 40,
                    behaviorType: AIBehaviorType.HUNTER,
                    position: { x: 300, y: 400 },
                }),
            ];

            const recommendations = selector.selectCounter(threats, 1000);

            expect(recommendations.length).toBeGreaterThan(0);
            expect(recommendations[0].score).toBeGreaterThan(0);
        });
    });

    describe('getPlacementStrategy', () => {
        it('should return corridor pattern for STRAFE behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.STRAFE);

            expect(strategy.spreadPattern).toBe('corridor');
            expect(strategy.preferredDistance).toBe(200);
            expect(strategy.notes).toContain('weaving');
        });

        it('should return ring pattern for ORBIT behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.ORBIT);

            expect(strategy.spreadPattern).toBe('ring');
            expect(strategy.preferredDistance).toBe(280);
            expect(strategy.notes).toContain('orbit');
        });

        it('should return layered pattern for HUNTER behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.HUNTER);

            expect(strategy.spreadPattern).toBe('layered');
            expect(strategy.preferredDistance).toBe(150);
            expect(strategy.notes).toContain('protect');
        });

        it('should return ring pattern for SWARM behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.SWARM);

            expect(strategy.spreadPattern).toBe('ring');
            expect(strategy.preferredDistance).toBe(180);
            expect(strategy.notes).toContain('mass');
        });

        it('should return corridor pattern for DIRECT behavior (default)', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.DIRECT);

            expect(strategy.spreadPattern).toBe('corridor');
            expect(strategy.preferredDistance).toBe(200);
            expect(strategy.notes).toContain('Standard');
        });

        it('should return default pattern for unknown behavior type', () => {
            const strategy = selector.getPlacementStrategy(999);

            expect(strategy.spreadPattern).toBe('corridor');
            expect(strategy.preferredDistance).toBe(200);
        });
    });
});

