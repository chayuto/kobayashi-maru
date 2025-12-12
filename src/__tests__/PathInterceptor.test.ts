/**
 * Tests for PathInterceptor
 *
 * @module __tests__/PathInterceptor.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowFieldAnalyzer } from '../ai/spatial/FlowFieldAnalyzer';
import { PathInterceptor, InterceptionConfig } from '../ai/spatial/PathInterceptor';
import { GAME_CONFIG } from '../types/constants';
import type { ThreatVector } from '../ai/types';
import { FactionId } from '../types/config/factions';

describe('PathInterceptor', () => {
    let flowAnalyzer: FlowFieldAnalyzer;
    let interceptor: PathInterceptor;

    beforeEach(() => {
        flowAnalyzer = new FlowFieldAnalyzer();
        flowAnalyzer.analyze();
        interceptor = new PathInterceptor(flowAnalyzer);
    });

    describe('findInterceptionPoints', () => {
        it('should find interception points when enemies are present', () => {
            const threats: ThreatVector[] = [
                {
                    entityId: 1,
                    position: { x: 100, y: GAME_CONFIG.WORLD_HEIGHT / 2 },
                    velocity: { x: 100, y: 0 },
                    predictedImpactTime: 5,
                    threatLevel: 50,
                    factionId: FactionId.KLINGON,
                    behaviorType: 0,
                    healthPercent: 1.0,
                    isElite: false,
                    isBoss: false,
                },
            ];

            const config: InterceptionConfig = {
                turretRange: 200,
                minDwellTime: 1.0,
                maxDistanceFromKM: 400,
                minDistanceFromKM: 100,
            };

            const points = interceptor.findInterceptionPoints(config, threats, []);

            expect(points.length).toBeGreaterThan(0);
        });

        it('should respect distance constraints from KM', () => {
            const config: InterceptionConfig = {
                turretRange: 200,
                minDwellTime: 0.5,
                maxDistanceFromKM: 300,
                minDistanceFromKM: 150,
            };

            const points = interceptor.findInterceptionPoints(config, [], []);

            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

            for (const point of points) {
                const dist = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
                expect(dist).toBeGreaterThanOrEqual(config.minDistanceFromKM);
                expect(dist).toBeLessThanOrEqual(config.maxDistanceFromKM);
            }
        });

        it('should avoid existing turret positions', () => {
            const existingTurrets = [
                { x: 300, y: 300 },
                { x: 500, y: 500 },
            ];

            const config: InterceptionConfig = {
                turretRange: 200,
                minDwellTime: 0.5,
                maxDistanceFromKM: 500,
                minDistanceFromKM: 50,
            };

            const points = interceptor.findInterceptionPoints(config, [], existingTurrets);

            for (const point of points) {
                for (const turret of existingTurrets) {
                    const dist = Math.sqrt((point.x - turret.x) ** 2 + (point.y - turret.y) ** 2);
                    expect(dist).toBeGreaterThanOrEqual(64);
                }
            }
        });

        it('should sort points by score descending', () => {
            const config: InterceptionConfig = {
                turretRange: 200,
                minDwellTime: 0.5,
                maxDistanceFromKM: 500,
                minDistanceFromKM: 50,
            };

            const points = interceptor.findInterceptionPoints(config, [], []);

            for (let i = 1; i < points.length; i++) {
                expect(points[i - 1].score).toBeGreaterThanOrEqual(points[i].score);
            }
        });
    });

    describe('findChokePoints', () => {
        it('should identify choke points near center', () => {
            const chokePoints = interceptor.findChokePoints(3);

            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

            // Choke points should be near center (where paths converge)
            for (const point of chokePoints) {
                const distToCenter = Math.sqrt((point.x - centerX) ** 2 + (point.y - centerY) ** 2);
                expect(distToCenter).toBeLessThan(500);
            }
        });

        it('should limit results to top 10', () => {
            const chokePoints = interceptor.findChokePoints(1);
            expect(chokePoints.length).toBeLessThanOrEqual(10);
        });
    });
});
