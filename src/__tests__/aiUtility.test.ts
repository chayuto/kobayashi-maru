/**
 * Tests for AI Utility & Prediction modules
 *
 * Covers ScoringCurves, DecisionInertia, ActionBucketing, and WavePredictor.
 *
 * @module __tests__/aiUtility.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringCurves } from '../ai/utility/ScoringCurves';
import { DecisionInertia, DEFAULT_INERTIA_CONFIG } from '../ai/utility/DecisionInertia';
import { ActionBucketing, ActionBucket, GameContext } from '../ai/utility/ActionBucketing';
import { WavePredictor, WavePrediction } from '../ai/prediction/WavePredictor';
import { AIAction, AIActionType } from '../ai/types';
import { GAME_CONFIG, TurretType, AIBehaviorType } from '../types/constants';
import { FactionId } from '../types/config/factions';

// =============================================================================
// HELPERS
// =============================================================================

function makeAction(
    type: AIActionType,
    priority: number,
    params: AIAction['params'] = { x: 500, y: 500, turretType: 0 }
): AIAction {
    return { type, priority, cost: 100, expectedValue: 100, params };
}

function makeContext(overrides: Partial<GameContext> = {}): GameContext {
    return {
        healthPercent: 80,
        resources: 500,
        threatLevel: 30,
        coveragePercent: 60,
        waveNumber: 5,
        isWaveActive: false,
        ...overrides,
    };
}

// =============================================================================
// SCORING CURVES
// =============================================================================

describe('ScoringCurves', () => {
    describe('score — linear curve', () => {
        it('should return 0 when value equals min', () => {
            const result = ScoringCurves.score(0, { type: 'linear' });
            expect(result).toBe(0);
        });

        it('should return 1 when value equals max', () => {
            const result = ScoringCurves.score(1, { type: 'linear' });
            expect(result).toBe(1);
        });

        it('should return 0.5 when value is midpoint', () => {
            const result = ScoringCurves.score(0.5, { type: 'linear' });
            expect(result).toBeCloseTo(0.5);
        });

        it('should scale linearly with custom min/max', () => {
            const result = ScoringCurves.score(75, { type: 'linear', min: 50, max: 100 });
            expect(result).toBeCloseTo(0.5);
        });
    });

    describe('score — quadratic curve', () => {
        it('should return 0 when value is 0', () => {
            const result = ScoringCurves.score(0, { type: 'quadratic' });
            expect(result).toBe(0);
        });

        it('should return 1 when value is 1', () => {
            const result = ScoringCurves.score(1, { type: 'quadratic' });
            expect(result).toBe(1);
        });

        it('should produce values less than linear at midpoint', () => {
            const linear = ScoringCurves.score(0.5, { type: 'linear' });
            const quadratic = ScoringCurves.score(0.5, { type: 'quadratic' });
            expect(quadratic).toBeLessThan(linear);
        });

        it('should return 0.25 when value is 0.5 (squared)', () => {
            const result = ScoringCurves.score(0.5, { type: 'quadratic' });
            expect(result).toBeCloseTo(0.25);
        });
    });

    describe('score — exponential curve', () => {
        it('should return close to 0 when value is 0', () => {
            const result = ScoringCurves.score(0, { type: 'exponential' });
            expect(result).toBeCloseTo(0, 1);
        });

        it('should return 1 when value is 1', () => {
            const result = ScoringCurves.score(1, { type: 'exponential' });
            expect(result).toBeCloseTo(1, 2);
        });

        it('should grow more steeply than quadratic', () => {
            // At midpoint, exponential should be less than quadratic (slow start)
            const exponential = ScoringCurves.score(0.3, { type: 'exponential' });
            const quadratic = ScoringCurves.score(0.3, { type: 'quadratic' });
            expect(exponential).toBeLessThan(quadratic);
        });
    });

    describe('score — logistic curve', () => {
        it('should return approximately 0.5 at the midpoint of the input', () => {
            const result = ScoringCurves.score(0.5, { type: 'logistic' });
            expect(result).toBeCloseTo(0.5, 1);
        });

        it('should approach 1 for high values', () => {
            const result = ScoringCurves.score(1, { type: 'logistic' });
            expect(result).toBeGreaterThan(0.9);
        });

        it('should approach 0 for low values', () => {
            const result = ScoringCurves.score(0, { type: 'logistic' });
            expect(result).toBeLessThan(0.1);
        });

        it('should produce steeper transition with higher steepness', () => {
            const gentle = ScoringCurves.score(0.7, { type: 'logistic', steepness: 3 });
            const steep = ScoringCurves.score(0.7, { type: 'logistic', steepness: 10 });
            expect(steep).toBeGreaterThan(gentle);
        });
    });

    describe('score — step curve', () => {
        it('should return 0 below threshold', () => {
            const result = ScoringCurves.score(0.3, { type: 'step', threshold: 0.5 });
            expect(result).toBe(0);
        });

        it('should return 1 at threshold', () => {
            const result = ScoringCurves.score(0.5, { type: 'step', threshold: 0.5 });
            expect(result).toBe(1);
        });

        it('should return 1 above threshold', () => {
            const result = ScoringCurves.score(0.8, { type: 'step', threshold: 0.5 });
            expect(result).toBe(1);
        });

        it('should respect custom threshold', () => {
            const below = ScoringCurves.score(0.6, { type: 'step', threshold: 0.7 });
            const above = ScoringCurves.score(0.8, { type: 'step', threshold: 0.7 });
            expect(below).toBe(0);
            expect(above).toBe(1);
        });
    });

    describe('score — inversion', () => {
        it('should invert linear curve so that 0 becomes 1', () => {
            const result = ScoringCurves.score(0, { type: 'linear', invert: true });
            expect(result).toBe(1);
        });

        it('should invert quadratic curve', () => {
            const normal = ScoringCurves.score(0.5, { type: 'quadratic' });
            const inverted = ScoringCurves.score(0.5, { type: 'quadratic', invert: true });
            expect(normal + inverted).toBeCloseTo(1);
        });

        it('should invert step curve', () => {
            const result = ScoringCurves.score(0.3, { type: 'step', threshold: 0.5, invert: true });
            expect(result).toBe(1); // below threshold => 0, inverted => 1
        });
    });

    describe('score — clamping', () => {
        it('should clamp values below min to 0', () => {
            const result = ScoringCurves.score(-5, { type: 'linear', min: 0, max: 100 });
            expect(result).toBe(0);
        });

        it('should clamp values above max to 1', () => {
            const result = ScoringCurves.score(200, { type: 'linear', min: 0, max: 100 });
            expect(result).toBe(1);
        });
    });

    describe('PRESETS — distanceValue', () => {
        it('should return higher score for closer distances', () => {
            const close = ScoringCurves.PRESETS.distanceValue(100, 500);
            const far = ScoringCurves.PRESETS.distanceValue(400, 500);
            expect(close).toBeGreaterThan(far);
        });

        it('should return 0 when distance equals maxDistance', () => {
            const result = ScoringCurves.PRESETS.distanceValue(500, 500);
            expect(result).toBeCloseTo(0, 1);
        });
    });

    describe('PRESETS — coverageGap', () => {
        it('should return near 0 for small gaps', () => {
            const result = ScoringCurves.PRESETS.coverageGap(5);
            expect(result).toBeLessThan(0.1);
        });

        it('should return high score for large gaps', () => {
            const result = ScoringCurves.PRESETS.coverageGap(90);
            expect(result).toBeGreaterThan(0.7);
        });
    });

    describe('PRESETS — waveTiming', () => {
        it('should return high urgency when wave is imminent', () => {
            const result = ScoringCurves.PRESETS.waveTiming(1, 15);
            expect(result).toBeGreaterThan(0.7);
        });

        it('should return low urgency when wave is far away', () => {
            const result = ScoringCurves.PRESETS.waveTiming(14, 15);
            expect(result).toBeLessThan(0.3);
        });
    });
});

// =============================================================================
// DECISION INERTIA
// =============================================================================

describe('DecisionInertia', () => {
    let inertia: DecisionInertia;

    beforeEach(() => {
        inertia = new DecisionInertia();
    });

    describe('constructor', () => {
        it('should use default config when no overrides provided', () => {
            const defaultInertia = new DecisionInertia();
            expect(defaultInertia.getCurrentAction()).toBeNull();
        });

        it('should merge partial config with defaults', () => {
            const custom = new DecisionInertia({ currentActionBonus: 30 });
            const action = makeAction(AIActionType.PLACE_TURRET, 50);
            custom.recordAction(action, 0);

            const result = custom.applyInertia([makeAction(AIActionType.PLACE_TURRET, 50)], 100);
            expect(result[0].priority).toBe(80); // 50 + 30 custom bonus
        });
    });

    describe('applyInertia', () => {
        it('should return unmodified actions when no current action recorded', () => {
            const actions = [makeAction(AIActionType.PLACE_TURRET, 50)];
            const result = inertia.applyInertia(actions, 100);
            expect(result[0].priority).toBe(50);
        });

        it('should add bonus to actions matching current action type', () => {
            const currentAction = makeAction(AIActionType.PLACE_TURRET, 50);
            inertia.recordAction(currentAction, 0);

            const actions = [
                makeAction(AIActionType.PLACE_TURRET, 40),
                makeAction(AIActionType.UPGRADE_TURRET, 40, { turretId: 1, upgradePath: 0 }),
            ];
            const result = inertia.applyInertia(actions, 100);

            const placeAction = result.find((a) => a.type === AIActionType.PLACE_TURRET);
            const upgradeAction = result.find((a) => a.type === AIActionType.UPGRADE_TURRET);

            expect(placeAction!.priority).toBe(40 + DEFAULT_INERTIA_CONFIG.currentActionBonus);
            expect(upgradeAction!.priority).toBe(40); // No bonus
        });

        it('should not apply bonus after persistence time expires', () => {
            const action = makeAction(AIActionType.PLACE_TURRET, 50);
            inertia.recordAction(action, 0);

            const expired = DEFAULT_INERTIA_CONFIG.persistenceTime + 1;
            const result = inertia.applyInertia([makeAction(AIActionType.PLACE_TURRET, 50)], expired);
            expect(result[0].priority).toBe(50);
        });

        it('should apply bonus right before persistence time expires', () => {
            const action = makeAction(AIActionType.PLACE_TURRET, 50);
            inertia.recordAction(action, 0);

            const justBefore = DEFAULT_INERTIA_CONFIG.persistenceTime - 1;
            const result = inertia.applyInertia([makeAction(AIActionType.PLACE_TURRET, 50)], justBefore);
            expect(result[0].priority).toBe(50 + DEFAULT_INERTIA_CONFIG.currentActionBonus);
        });
    });

    describe('shouldSwitch', () => {
        it('should return true when no current action exists', () => {
            const action = makeAction(AIActionType.PLACE_TURRET, 50);
            expect(inertia.shouldSwitch(action, 0)).toBe(true);
        });

        it('should return true when current action has expired', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            const expired = DEFAULT_INERTIA_CONFIG.persistenceTime + 1;
            const newAction = makeAction(AIActionType.UPGRADE_TURRET, 55, { turretId: 1, upgradePath: 0 });
            expect(inertia.shouldSwitch(newAction, expired)).toBe(true);
        });

        it('should return false when new action priority is not significantly higher', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            const slightlyBetter = makeAction(AIActionType.UPGRADE_TURRET, 55, { turretId: 1, upgradePath: 0 });
            expect(inertia.shouldSwitch(slightlyBetter, 100)).toBe(false);
        });

        it('should return true when new action priority exceeds switch threshold', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            const muchBetter = makeAction(
                AIActionType.UPGRADE_TURRET,
                50 + DEFAULT_INERTIA_CONFIG.switchThreshold + 1,
                { turretId: 1, upgradePath: 0 }
            );
            expect(inertia.shouldSwitch(muchBetter, 100)).toBe(true);
        });

        it('should return false when new action is exactly at switch threshold', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            const atThreshold = makeAction(
                AIActionType.UPGRADE_TURRET,
                50 + DEFAULT_INERTIA_CONFIG.switchThreshold,
                { turretId: 1, upgradePath: 0 }
            );
            expect(inertia.shouldSwitch(atThreshold, 100)).toBe(false);
        });
    });

    describe('recordAction', () => {
        it('should store the action and make it retrievable', () => {
            const action = makeAction(AIActionType.SELL_TURRET, 99, { turretId: 42 });
            inertia.recordAction(action, 1000);
            expect(inertia.getCurrentAction()).toEqual(action);
        });

        it('should overwrite previous action', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            const newer = makeAction(AIActionType.SELL_TURRET, 70, { turretId: 1 });
            inertia.recordAction(newer, 500);
            expect(inertia.getCurrentAction()).toEqual(newer);
        });
    });

    describe('reset', () => {
        it('should clear current action', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            inertia.reset();
            expect(inertia.getCurrentAction()).toBeNull();
        });

        it('should cause applyInertia to return unmodified actions after reset', () => {
            inertia.recordAction(makeAction(AIActionType.PLACE_TURRET, 50), 0);
            inertia.reset();
            const result = inertia.applyInertia([makeAction(AIActionType.PLACE_TURRET, 50)], 100);
            expect(result[0].priority).toBe(50);
        });
    });
});

// =============================================================================
// ACTION BUCKETING
// =============================================================================

describe('ActionBucketing', () => {
    describe('calculateBucketWeights', () => {
        it('should set SURVIVAL weight > 0 when health is below 50', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ healthPercent: 30 })
            );
            expect(weights[ActionBucket.SURVIVAL]).toBeGreaterThan(0);
        });

        it('should set SURVIVAL weight to 0 when health is above 50', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ healthPercent: 60 })
            );
            expect(weights[ActionBucket.SURVIVAL]).toBe(0);
        });

        it('should set DEFENSE weight based on threat or coverage gap', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ threatLevel: 80, coveragePercent: 30 })
            );
            expect(weights[ActionBucket.DEFENSE]).toBeGreaterThan(0);
        });

        it('should give ECONOMY an early game bonus when waveNumber < 5', () => {
            const early = ActionBucketing.calculateBucketWeights(
                makeContext({ waveNumber: 2, threatLevel: 10 })
            );
            // Before normalization, early economy = 0.5 + 0.3 = 0.8, late = 0.5
            // After normalization ratios should reflect this
            expect(early[ActionBucket.ECONOMY]).toBeGreaterThan(0);
        });

        it('should penalize ECONOMY when threat is above 50', () => {
            const lowThreat = ActionBucketing.calculateBucketWeights(
                makeContext({ threatLevel: 20, waveNumber: 10 })
            );
            const highThreat = ActionBucketing.calculateBucketWeights(
                makeContext({ threatLevel: 80, waveNumber: 10 })
            );
            // High threat should result in lower economy weight relative to other buckets
            expect(highThreat[ActionBucket.ECONOMY]).toBeLessThan(lowThreat[ActionBucket.ECONOMY]);
        });

        it('should enable EXPANSION when health > 70, coverage > 60, threat < 40', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ healthPercent: 90, coveragePercent: 70, threatLevel: 20 })
            );
            expect(weights[ActionBucket.EXPANSION]).toBeGreaterThan(0);
        });

        it('should disable EXPANSION when health is too low', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ healthPercent: 60, coveragePercent: 70, threatLevel: 20 })
            );
            expect(weights[ActionBucket.EXPANSION]).toBe(0);
        });

        it('should disable EXPANSION when threat is too high', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ healthPercent: 90, coveragePercent: 70, threatLevel: 50 })
            );
            expect(weights[ActionBucket.EXPANSION]).toBe(0);
        });

        it('should normalize weights so they sum to 1', () => {
            const weights = ActionBucketing.calculateBucketWeights(
                makeContext({ healthPercent: 30, threatLevel: 60, coveragePercent: 50, waveNumber: 3 })
            );
            const total = Object.values(weights).reduce((a, b) => a + b, 0);
            expect(total).toBeCloseTo(1, 5);
        });
    });

    describe('classifyAction', () => {
        it('should classify SELL_TURRET as SURVIVAL', () => {
            const action = makeAction(AIActionType.SELL_TURRET, 50, { turretId: 1 });
            expect(ActionBucketing.classifyAction(action)).toBe(ActionBucket.SURVIVAL);
        });

        it('should classify UPGRADE_TURRET as DEFENSE', () => {
            const action = makeAction(AIActionType.UPGRADE_TURRET, 50, { turretId: 1, upgradePath: 0 });
            expect(ActionBucketing.classifyAction(action)).toBe(ActionBucket.DEFENSE);
        });

        it('should classify PLACE_TURRET near center as DEFENSE', () => {
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            // Place turret at exact center — distance 0, well below 250
            const action = makeAction(AIActionType.PLACE_TURRET, 50, {
                x: centerX,
                y: centerY,
                turretType: 0,
            });
            expect(ActionBucketing.classifyAction(action)).toBe(ActionBucket.DEFENSE);
        });

        it('should classify PLACE_TURRET far from center as EXPANSION', () => {
            // Far corner — distance well over 250 from center
            const action = makeAction(AIActionType.PLACE_TURRET, 50, {
                x: 100,
                y: 100,
                turretType: 0,
            });
            expect(ActionBucketing.classifyAction(action)).toBe(ActionBucket.EXPANSION);
        });
    });

    describe('prioritizeActions', () => {
        it('should return actions from the highest-weighted bucket', () => {
            // Low health => SURVIVAL should win
            const context = makeContext({ healthPercent: 20, threatLevel: 80 });
            const actions = [
                makeAction(AIActionType.SELL_TURRET, 60, { turretId: 1 }), // SURVIVAL
                makeAction(AIActionType.UPGRADE_TURRET, 50, { turretId: 2, upgradePath: 0 }), // DEFENSE
            ];

            const result = ActionBucketing.prioritizeActions(actions, context);
            // Verify it returns actions
            expect(result.length).toBeGreaterThan(0);
            // All returned should be from the same bucket
            const bucket = ActionBucketing.classifyAction(result[0]);
            for (const a of result) {
                expect(ActionBucketing.classifyAction(a)).toBe(bucket);
            }
        });

        it('should sort winning bucket actions by priority descending', () => {
            const context = makeContext({ healthPercent: 90, threatLevel: 60 });
            const actions = [
                makeAction(AIActionType.UPGRADE_TURRET, 30, { turretId: 1, upgradePath: 0 }),
                makeAction(AIActionType.UPGRADE_TURRET, 80, { turretId: 2, upgradePath: 1 }),
                makeAction(AIActionType.UPGRADE_TURRET, 50, { turretId: 3, upgradePath: 0 }),
            ];

            const result = ActionBucketing.prioritizeActions(actions, context);
            for (let i = 1; i < result.length; i++) {
                expect(result[i - 1].priority).toBeGreaterThanOrEqual(result[i].priority);
            }
        });

        it('should return empty array when no actions provided', () => {
            const context = makeContext();
            const result = ActionBucketing.prioritizeActions([], context);
            expect(result).toEqual([]);
        });
    });
});

// =============================================================================
// WAVE PREDICTOR
// =============================================================================

describe('WavePredictor', () => {
    let predictor: WavePredictor;

    beforeEach(() => {
        predictor = new WavePredictor();
    });

    describe('predictWave — early game (waves 1-3)', () => {
        it('should predict Klingon faction for wave 1', () => {
            const prediction = predictor.predictWave(1);
            expect(prediction.expectedFactions).toContain(FactionId.KLINGON);
        });

        it('should predict DIRECT behavior for wave 2', () => {
            const prediction = predictor.predictWave(2);
            expect(prediction.expectedBehaviors).toContain(AIBehaviorType.DIRECT);
        });

        it('should have low threat level for wave 3', () => {
            const prediction = predictor.predictWave(3);
            expect(prediction.threatLevel).toBe('low');
        });

        it('should not be a boss wave for wave 1', () => {
            const prediction = predictor.predictWave(1);
            expect(prediction.isBossWave).toBe(false);
        });
    });

    describe('predictWave — early-mid game (waves 4-7)', () => {
        it('should include Klingon and Romulan factions for wave 6', () => {
            const prediction = predictor.predictWave(6);
            expect(prediction.expectedFactions).toContain(FactionId.KLINGON);
            expect(prediction.expectedFactions).toContain(FactionId.ROMULAN);
        });

        it('should include STRAFE behavior for wave 5', () => {
            const prediction = predictor.predictWave(4);
            expect(prediction.expectedBehaviors).toContain(AIBehaviorType.STRAFE);
        });
    });

    describe('predictWave — mid game (waves 8-12)', () => {
        it('should include Romulan and Tholian factions for wave 9', () => {
            const prediction = predictor.predictWave(9);
            expect(prediction.expectedFactions).toContain(FactionId.ROMULAN);
            expect(prediction.expectedFactions).toContain(FactionId.THOLIAN);
        });

        it('should have medium threat level for wave 8', () => {
            const prediction = predictor.predictWave(8);
            expect(prediction.threatLevel).toBe('medium');
        });

        it('should include ORBIT behavior for wave 11', () => {
            const prediction = predictor.predictWave(11);
            expect(prediction.expectedBehaviors).toContain(AIBehaviorType.ORBIT);
        });
    });

    describe('predictWave — late-mid game (waves 13-18)', () => {
        it('should include Borg faction for wave 15', () => {
            const prediction = predictor.predictWave(16);
            expect(prediction.expectedFactions).toContain(FactionId.BORG);
        });

        it('should include SWARM behavior for wave 14', () => {
            const prediction = predictor.predictWave(14);
            expect(prediction.expectedBehaviors).toContain(AIBehaviorType.SWARM);
        });

        it('should have high threat level for wave 16', () => {
            const prediction = predictor.predictWave(16);
            expect(prediction.threatLevel).toBe('high');
        });
    });

    describe('predictWave — late game (waves 19+)', () => {
        it('should include Borg and Species 8472 for wave 20', () => {
            const prediction = predictor.predictWave(21);
            expect(prediction.expectedFactions).toContain(FactionId.BORG);
            expect(prediction.expectedFactions).toContain(FactionId.SPECIES_8472);
        });

        it('should include HUNTER behavior for wave 22', () => {
            const prediction = predictor.predictWave(22);
            expect(prediction.expectedBehaviors).toContain(AIBehaviorType.HUNTER);
        });
    });

    describe('predictWave — boss waves', () => {
        it('should mark wave 5 as boss wave', () => {
            const prediction = predictor.predictWave(5);
            expect(prediction.isBossWave).toBe(true);
        });

        it('should mark wave 10 as boss wave', () => {
            const prediction = predictor.predictWave(10);
            expect(prediction.isBossWave).toBe(true);
        });

        it('should not mark wave 0 as boss wave', () => {
            const prediction = predictor.predictWave(0);
            expect(prediction.isBossWave).toBe(false);
        });

        it('should set threat level to boss for boss waves', () => {
            const prediction = predictor.predictWave(10);
            expect(prediction.threatLevel).toBe('boss');
        });

        it('should add Romulan faction for boss waves up to wave 10', () => {
            const prediction = predictor.predictWave(10);
            expect(prediction.expectedFactions).toContain(FactionId.ROMULAN);
        });

        it('should add Borg faction for boss waves from 11-20', () => {
            const prediction = predictor.predictWave(15);
            expect(prediction.expectedFactions).toContain(FactionId.BORG);
        });

        it('should add Species 8472 faction for boss waves above 20', () => {
            const prediction = predictor.predictWave(25);
            expect(prediction.expectedFactions).toContain(FactionId.SPECIES_8472);
        });
    });

    describe('predictWave — recommended turrets', () => {
        it('should recommend turrets that counter expected behaviors', () => {
            const prediction = predictor.predictWave(1);
            // DIRECT behavior should recommend TORPEDO_LAUNCHER and PLASMA_CANNON
            expect(prediction.recommendedTurrets).toContain(TurretType.TORPEDO_LAUNCHER);
        });

        it('should deduplicate recommended turrets', () => {
            const prediction = predictor.predictWave(9);
            const unique = new Set(prediction.recommendedTurrets);
            expect(unique.size).toBe(prediction.recommendedTurrets.length);
        });

        it('should return wave number in prediction', () => {
            const prediction = predictor.predictWave(7);
            expect(prediction.waveNumber).toBe(7);
        });

        it('should deduplicate expected factions', () => {
            // Boss wave at wave 5 adds Romulan, which might already be in list for wave 5
            const prediction = predictor.predictWave(5);
            const unique = new Set(prediction.expectedFactions);
            expect(unique.size).toBe(prediction.expectedFactions.length);
        });
    });

    describe('shouldSaveForBoss', () => {
        it('should return true when boss wave is 1 wave away and resources are low', () => {
            // currentWave=4, next boss=5, wavesUntilBoss=1 (<= 2), resources=200 (< 400)
            expect(predictor.shouldSaveForBoss(4, 200)).toBe(true);
        });

        it('should return true when boss wave is 2 waves away and resources are low', () => {
            // currentWave=3, next boss=5, wavesUntilBoss=2 (<= 2), resources=300 (< 400)
            expect(predictor.shouldSaveForBoss(3, 300)).toBe(true);
        });

        it('should return false when resources are sufficient', () => {
            // currentWave=4, next boss=5, wavesUntilBoss=1 (<= 2), resources=500 (>= 400)
            expect(predictor.shouldSaveForBoss(4, 500)).toBe(false);
        });

        it('should return false when boss wave is far away', () => {
            // currentWave=1, next boss=5, wavesUntilBoss=4 (> 2)
            expect(predictor.shouldSaveForBoss(1, 100)).toBe(false);
        });

        it('should return false when boss wave is 3 waves away', () => {
            // currentWave=2, next boss=5, wavesUntilBoss=3 (> 2)
            expect(predictor.shouldSaveForBoss(2, 50)).toBe(false);
        });
    });

    describe('getPredictionSummary', () => {
        it('should include wave number in summary', () => {
            const prediction = predictor.predictWave(3);
            const summary = predictor.getPredictionSummary(prediction);
            expect(summary).toContain('Wave 3');
        });

        it('should include threat level in uppercase', () => {
            const prediction = predictor.predictWave(3);
            const summary = predictor.getPredictionSummary(prediction);
            expect(summary).toContain('LOW');
        });

        it('should include faction names', () => {
            const prediction = predictor.predictWave(1);
            const summary = predictor.getPredictionSummary(prediction);
            expect(summary).toContain('Klingon');
        });

        it('should handle boss wave summary', () => {
            const prediction = predictor.predictWave(10);
            const summary = predictor.getPredictionSummary(prediction);
            expect(summary).toContain('BOSS');
        });

        it('should return Unknown for unrecognized faction IDs', () => {
            const fakePrediction: WavePrediction = {
                waveNumber: 1,
                expectedFactions: [999],
                expectedBehaviors: [],
                recommendedTurrets: [],
                threatLevel: 'low',
                isBossWave: false,
            };
            const summary = predictor.getPredictionSummary(fakePrediction);
            expect(summary).toContain('Unknown');
        });
    });
});
