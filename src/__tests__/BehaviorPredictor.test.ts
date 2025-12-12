/**
 * Tests for BehaviorPredictor
 *
 * @module __tests__/BehaviorPredictor.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorPredictor } from '../ai/behaviors/BehaviorPredictor';
import { AIBehaviorType, GAME_CONFIG } from '../types/constants';

describe('BehaviorPredictor', () => {
    let predictor: BehaviorPredictor;

    beforeEach(() => {
        predictor = new BehaviorPredictor();
    });

    describe('predictDirect', () => {
        it('should predict linear path for DIRECT behavior', () => {
            const prediction = predictor.predict(100, 540, 100, 0, AIBehaviorType.DIRECT, 1, 3.0);

            // All positions should be along a straight line
            for (const pos of prediction.positions) {
                expect(pos.y).toBeCloseTo(540, 0);
                expect(pos.x).toBeGreaterThan(100);
            }

            expect(prediction.effectiveRange).toBe(20);
        });

        it('should have decreasing confidence over time', () => {
            const prediction = predictor.predict(100, 540, 100, 0, AIBehaviorType.DIRECT, 1, 3.0);

            for (let i = 1; i < prediction.positions.length; i++) {
                expect(prediction.positions[i].confidence).toBeLessThanOrEqual(
                    prediction.positions[i - 1].confidence
                );
            }
        });
    });

    describe('predictStrafe', () => {
        it('should predict weaving pattern for STRAFE behavior', () => {
            const prediction = predictor.predict(100, 540, 80, 0, AIBehaviorType.STRAFE, 1, 3.0);

            // Positions should deviate from straight line
            const straightLineY = 540;
            let maxDeviation = 0;

            for (const pos of prediction.positions) {
                maxDeviation = Math.max(maxDeviation, Math.abs(pos.y - straightLineY));
            }

            expect(maxDeviation).toBeGreaterThan(10); // Some weaving
            expect(prediction.effectiveRange).toBe(80); // Wide range
        });
    });

    describe('predictOrbit', () => {
        it('should predict circular motion for ORBIT behavior at orbit distance', () => {
            const orbitRadius = GAME_CONFIG.ORBIT_RADIUS;
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

            // Start at orbit radius
            const prediction = predictor.predict(
                centerX + orbitRadius,
                centerY,
                0,
                50,
                AIBehaviorType.ORBIT,
                1,
                5.0
            );

            // Should stay near orbit radius
            for (const pos of prediction.positions) {
                const dist = Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2);
                expect(dist).toBeCloseTo(orbitRadius, -1); // Within ~10px
            }
        });

        it('should approach center when far from orbit radius', () => {
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

            // Start far from center
            const prediction = predictor.predict(100, centerY, 0, 0, AIBehaviorType.ORBIT, 1, 5.0);

            // Later positions should be closer to center
            const firstDist = Math.sqrt((prediction.positions[0].x - centerX) ** 2);
            const lastDist = Math.sqrt(
                (prediction.positions[prediction.positions.length - 1].x - centerX) ** 2
            );

            expect(lastDist).toBeLessThan(firstDist);
        });
    });

    describe('predictSwarm', () => {
        it('should predict noisy path for SWARM behavior', () => {
            const prediction = predictor.predict(100, 540, 90, 0, AIBehaviorType.SWARM, 1, 3.0);

            // Should have effective range for noise
            expect(prediction.effectiveRange).toBe(40);

            // Positions should generally move toward center
            expect(
                prediction.positions[prediction.positions.length - 1].x
            ).toBeGreaterThan(100);
        });
    });

    describe('predictHunter', () => {
        it('should predict direct-like path with wider range for HUNTER', () => {
            const prediction = predictor.predict(100, 540, 100, 0, AIBehaviorType.HUNTER, 1, 3.0);

            // Hunter falls back to direct but with wider effective range
            expect(prediction.effectiveRange).toBe(60);
        });
    });
});
