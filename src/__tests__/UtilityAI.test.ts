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
