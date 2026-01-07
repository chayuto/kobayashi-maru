/**
 * Tests for Utility AI Systems
 *
 * @module __tests__/UtilityAI.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringCurves, CurveType } from '../ai/utility/ScoringCurves';
import { ActionBucketing, ActionBucket, GameContext } from '../ai/utility/ActionBucketing';
import { DecisionInertia } from '../ai/utility/DecisionInertia';
import { AIAction, AIActionType } from '../ai/types';

describe('ScoringCurves', () => {
    describe('score', () => {
        it('should return 0-1 for all curve types', () => {
            const types: CurveType[] = ['linear', 'quadratic', 'exponential', 'logistic', 'step'];

            for (const type of types) {
                for (let i = 0; i <= 10; i++) {
                    const value = i / 10;
                    const score = ScoringCurves.score(value, { type });
                    expect(score).toBeGreaterThanOrEqual(0);
                    expect(score).toBeLessThanOrEqual(1.0001); // Allow for floating point
                }
            }
        });

        it('should invert scores correctly', () => {
            const normal = ScoringCurves.score(0.3, { type: 'linear' });
            const inverted = ScoringCurves.score(0.3, { type: 'linear', invert: true });
            expect(normal + inverted).toBeCloseTo(1.0);
        });

        it('should respect min/max range', () => {
            const score = ScoringCurves.score(50, { type: 'linear', min: 0, max: 100 });
            expect(score).toBeCloseTo(0.5);
        });
    });

    describe('PRESETS', () => {
        it('should make low health extremely urgent', () => {
            const lowHealth = ScoringCurves.PRESETS.healthUrgency(0.1);
            const midHealth = ScoringCurves.PRESETS.healthUrgency(0.5);
            const highHealth = ScoringCurves.PRESETS.healthUrgency(0.9);

            expect(lowHealth).toBeGreaterThan(midHealth);
            expect(midHealth).toBeGreaterThan(highHealth);
            expect(lowHealth).toBeGreaterThan(0.7); // Very urgent
        });

        it('should respond to threat levels appropriately', () => {
            const lowThreat = ScoringCurves.PRESETS.threatResponse(10);
            const highThreat = ScoringCurves.PRESETS.threatResponse(90);

            expect(highThreat).toBeGreaterThan(lowThreat);
            expect(highThreat).toBeGreaterThan(0.7);
        });

        it('should score distance with quadratic falloff (closer = higher)', () => {
            const close = ScoringCurves.PRESETS.distanceValue(50, 500);
            const mid = ScoringCurves.PRESETS.distanceValue(250, 500);
            const far = ScoringCurves.PRESETS.distanceValue(450, 500);

            expect(close).toBeGreaterThan(mid);
            expect(mid).toBeGreaterThan(far);
            expect(close).toBeGreaterThan(0.5);
            expect(far).toBeLessThan(0.25); // Quadratic means far is low but not 0
        });

        it('should score resources linearly', () => {
            const low = ScoringCurves.PRESETS.resourceValue(100, 1000);
            const mid = ScoringCurves.PRESETS.resourceValue(500, 1000);
            const high = ScoringCurves.PRESETS.resourceValue(900, 1000);

            expect(low).toBeCloseTo(0.1, 1);
            expect(mid).toBeCloseTo(0.5, 1);
            expect(high).toBeCloseTo(0.9, 1);
        });

        it('should make large coverage gaps more urgent (exponential)', () => {
            const small = ScoringCurves.PRESETS.coverageGap(10);
            const medium = ScoringCurves.PRESETS.coverageGap(50);
            const large = ScoringCurves.PRESETS.coverageGap(90);

            expect(large).toBeGreaterThan(medium);
            expect(medium).toBeGreaterThan(small);
            // Exponential means large gap should be much more urgent
            expect(large).toBeGreaterThan(0.7);
        });

        it('should increase urgency as wave approaches (inverted logistic)', () => {
            const farAway = ScoringCurves.PRESETS.waveTiming(10, 15);
            const approaching = ScoringCurves.PRESETS.waveTiming(5, 15);
            const imminent = ScoringCurves.PRESETS.waveTiming(1, 15);

            expect(imminent).toBeGreaterThan(approaching);
            expect(approaching).toBeGreaterThan(farAway);
            expect(imminent).toBeGreaterThan(0.7);
        });
    });
});

describe('ActionBucketing', () => {
    describe('calculateBucketWeights', () => {
        it('should prioritize SURVIVAL when health is critical', () => {
            const context: GameContext = {
                healthPercent: 20,
                resources: 500,
                threatLevel: 80,
                coveragePercent: 50,
                waveNumber: 5,
                isWaveActive: true,
            };

            const weights = ActionBucketing.calculateBucketWeights(context);
            expect(weights[ActionBucket.SURVIVAL]).toBeGreaterThan(0);
        });

        it('should enable EXPANSION when conditions are stable', () => {
            const context: GameContext = {
                healthPercent: 90,
                resources: 1000,
                threatLevel: 20,
                coveragePercent: 70,
                waveNumber: 3,
                isWaveActive: false,
            };

            const weights = ActionBucketing.calculateBucketWeights(context);
            expect(weights[ActionBucket.EXPANSION]).toBeGreaterThan(0);
        });

        it('should give ECONOMY bonus in early game', () => {
            const context: GameContext = {
                healthPercent: 100,
                resources: 200,
                threatLevel: 10,
                coveragePercent: 40,
                waveNumber: 2,
                isWaveActive: false,
            };

            const weights = ActionBucketing.calculateBucketWeights(context);
            expect(weights[ActionBucket.ECONOMY]).toBeGreaterThan(0.15);
        });
    });
});

describe('DecisionInertia', () => {
    let inertia: DecisionInertia;

    beforeEach(() => {
        inertia = new DecisionInertia({ currentActionBonus: 20, persistenceTime: 2000 });
    });

    it('should give bonus to current action type', () => {
        const action: AIAction = {
            type: AIActionType.PLACE_TURRET,
            priority: 50,
            cost: 100,
            expectedValue: 100,
            params: { x: 500, y: 500, turretType: 0 },
        };

        inertia.recordAction(action, 0);

        const actions = [
            { ...action, priority: 50 },
            { ...action, type: AIActionType.UPGRADE_TURRET, priority: 55 },
        ];

        const withInertia = inertia.applyInertia(actions, 100);

        const placeAction = withInertia.find((a) => a.type === AIActionType.PLACE_TURRET);
        expect(placeAction?.priority).toBe(70); // 50 + 20 bonus
    });

    it('should expire bonus after persistence time', () => {
        const action: AIAction = {
            type: AIActionType.PLACE_TURRET,
            priority: 50,
            cost: 100,
            expectedValue: 100,
            params: { x: 500, y: 500, turretType: 0 },
        };

        inertia.recordAction(action, 0);

        // After persistence time, bonus should not apply
        const withInertia = inertia.applyInertia([action], 3000);

        expect(withInertia[0].priority).toBe(50); // No bonus
    });

    it('should reset correctly', () => {
        const action: AIAction = {
            type: AIActionType.PLACE_TURRET,
            priority: 50,
            cost: 100,
            expectedValue: 100,
            params: { x: 500, y: 500, turretType: 0 },
        };

        inertia.recordAction(action, 0);
        expect(inertia.getCurrentAction()).not.toBeNull();

        inertia.reset();
        expect(inertia.getCurrentAction()).toBeNull();
    });
});
