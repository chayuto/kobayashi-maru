/**
 * Tests for AI Autoplay Extensions
 *
 * @module __tests__/AIExtensions.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AIHumanizer } from '../ai/humanization/AIHumanizer';
import { DynamicDifficultyAdjuster, DifficultyMetrics } from '../ai/humanization/DynamicDifficultyAdjuster';
import { SynergyDetector } from '../ai/behaviors/SynergyDetector';
import { WavePredictor } from '../ai/prediction/WavePredictor';
import { TurretType } from '../types/constants';
import { AIActionType } from '../ai/types';

describe('AIHumanizer', () => {
    let humanizer: AIHumanizer;

    beforeEach(() => {
        humanizer = new AIHumanizer({
            reactionDelay: 100,
            skipChance: 0,
            positionVariation: 10,
        });
    });

    it('should delay actions based on reaction time', () => {
        const action = {
            type: AIActionType.PLACE_TURRET,
            priority: 50,
            cost: 100,
            expectedValue: 100,
            params: { x: 500, y: 500, turretType: 0 },
        };

        // First call sets up pending action
        const result1 = humanizer.humanizeAction(action, 0);
        expect(result1).toBeNull(); // Not ready yet

        // After delay, action should be ready
        const result2 = humanizer.humanizeAction(action, 200);
        expect(result2).not.toBeNull();
    });

    it('should add position variation', () => {
        const humanizer2 = new AIHumanizer({
            reactionDelay: 0,
            positionVariation: 50,
            skipChance: 0,
        });

        const action = {
            type: AIActionType.PLACE_TURRET,
            priority: 50,
            cost: 100,
            expectedValue: 100,
            params: { x: 500, y: 500, turretType: 0 },
        };

        // Call twice - first sets pending, second returns humanized
        humanizer2.humanizeAction(action, 0);
        const result = humanizer2.humanizeAction(action, 100);

        expect(result).not.toBeNull();
        const params = result!.params as { x: number; y: number };

        // Position should be varied
        expect(params.x).toBeGreaterThanOrEqual(450);
        expect(params.x).toBeLessThanOrEqual(550);
    });

    it('should reset correctly', () => {
        humanizer.reset();
        expect(humanizer.getTimeSinceLastAction(100)).toBe(100);
    });
});

describe('DynamicDifficultyAdjuster', () => {
    let adjuster: DynamicDifficultyAdjuster;

    beforeEach(() => {
        adjuster = new DynamicDifficultyAdjuster();
    });

    it('should return neutral adjustment with no history', () => {
        const adjustment = adjuster.getAdjustment();
        expect(adjustment.reactionMultiplier).toBe(1.0);
    });

    it('should boost AI when player is struggling', () => {
        const metrics: DifficultyMetrics = {
            healthPercent: 20,
            wavesCompleted: 2,
            totalWaves: 10,
            turretCount: 3,
            killCount: 5,
        };

        adjuster.recordPerformance(metrics);
        const adjustment = adjuster.getAdjustment();

        expect(adjustment.reactionMultiplier).toBeLessThan(1.0); // Faster
        expect(adjustment.accuracyMultiplier).toBeGreaterThan(1.0); // Better
    });

    it('should back off when player is doing well', () => {
        const metrics: DifficultyMetrics = {
            healthPercent: 95,
            wavesCompleted: 8,
            totalWaves: 10,
            turretCount: 5,
            killCount: 100,
        };

        adjuster.recordPerformance(metrics);
        const adjustment = adjuster.getAdjustment();

        expect(adjustment.reactionMultiplier).toBeGreaterThan(1.0); // Slower
    });
});

describe('SynergyDetector', () => {
    let detector: SynergyDetector;

    beforeEach(() => {
        detector = new SynergyDetector();
    });

    it('should detect Tetryon + Torpedo synergy', () => {
        const multiplier = detector.getSynergyMultiplier(
            TurretType.TETRYON_BEAM,
            TurretType.TORPEDO_LAUNCHER
        );
        expect(multiplier).toBe(1.5);
    });

    it('should detect Polaron + Plasma synergy', () => {
        const multiplier = detector.getSynergyMultiplier(
            TurretType.POLARON_BEAM,
            TurretType.PLASMA_CANNON
        );
        expect(multiplier).toBe(1.4);
    });

    it('should calculate placement synergy score', () => {
        const nearby = [TurretType.TETRYON_BEAM, TurretType.PHASER_ARRAY];
        const { score, synergies } = detector.calculatePlacementSynergy(
            TurretType.TORPEDO_LAUNCHER,
            nearby
        );

        expect(score).toBeGreaterThan(0);
        expect(synergies.length).toBeGreaterThan(0);
    });

    it('should find best complement for existing turrets', () => {
        const existing = [TurretType.TETRYON_BEAM];
        const result = detector.findBestComplement(existing, 500);

        expect(result).not.toBeNull();
        expect(result!.synergyScore).toBeGreaterThan(0);
    });
});

describe('WavePredictor', () => {
    let predictor: WavePredictor;

    beforeEach(() => {
        predictor = new WavePredictor();
    });

    it('should predict early waves correctly', () => {
        const prediction = predictor.predictWave(1);
        expect(prediction.threatLevel).toBe('low');
        expect(prediction.isBossWave).toBe(false);
    });

    it('should detect boss waves', () => {
        const prediction = predictor.predictWave(5);
        expect(prediction.isBossWave).toBe(true);
        expect(prediction.threatLevel).toBe('boss');
    });

    it('should recommend turrets based on expected behaviors', () => {
        const prediction = predictor.predictWave(10);
        expect(prediction.recommendedTurrets.length).toBeGreaterThan(0);
    });

    it('should advise saving for boss wave', () => {
        // 2 waves before boss
        const shouldSave = predictor.shouldSaveForBoss(3, 300);
        expect(shouldSave).toBe(true);

        // Far from boss with good resources
        const shouldNotSave = predictor.shouldSaveForBoss(1, 500);
        expect(shouldNotSave).toBe(false);
    });

    it('should increase threat level in late game', () => {
        const late = predictor.predictWave(18);
        expect(late.threatLevel).not.toBe('low');
    });
});
