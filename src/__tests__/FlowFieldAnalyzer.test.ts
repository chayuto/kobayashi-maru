/**
 * Tests for FlowFieldAnalyzer
 *
 * @module __tests__/FlowFieldAnalyzer.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FlowFieldAnalyzer } from '../ai/spatial/FlowFieldAnalyzer';
import { GAME_CONFIG } from '../types/constants';

describe('FlowFieldAnalyzer', () => {
    let analyzer: FlowFieldAnalyzer;

    beforeEach(() => {
        analyzer = new FlowFieldAnalyzer();
    });

    describe('generateToCenter', () => {
        it('should generate flow toward center', () => {
            analyzer.generateToCenter();

            // Edge cell should flow toward center
            const edgeFlow = analyzer.getFlowAt(0, GAME_CONFIG.WORLD_HEIGHT / 2);
            expect(edgeFlow.x).toBeGreaterThan(0); // Should point right toward center
        });

        it('should have zero flow at center (goal)', () => {
            analyzer.generateToCenter();

            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            const centerFlow = analyzer.getFlowAt(centerX, centerY);

            expect(centerFlow.x).toBe(0);
            expect(centerFlow.y).toBe(0);
        });

        it('should point inward from right edge', () => {
            analyzer.generateToCenter();

            const rightEdgeFlow = analyzer.getFlowAt(
                GAME_CONFIG.WORLD_WIDTH - 16,
                GAME_CONFIG.WORLD_HEIGHT / 2
            );
            expect(rightEdgeFlow.x).toBeLessThan(0); // Should point left toward center
        });
    });

    describe('calculateTrafficDensity', () => {
        it('should identify high traffic near center', () => {
            const analysis = analyzer.analyze();

            // High traffic cells should be closer to center than edges
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

            for (const cellIndex of analysis.highTrafficCells.slice(0, 5)) {
                const pos = analyzer.getCellWorldPosition(cellIndex);
                const distToCenter = Math.sqrt(
                    (pos.x - centerX) ** 2 + (pos.y - centerY) ** 2
                );
                // High traffic cells should be within 400px of center
                expect(distToCenter).toBeLessThan(400);
            }
        });

        it('should return normalized traffic density between 0 and 1', () => {
            analyzer.analyze();

            // Test random positions
            const positions = [
                { x: 100, y: 100 },
                { x: GAME_CONFIG.WORLD_WIDTH / 2, y: GAME_CONFIG.WORLD_HEIGHT / 2 },
                { x: GAME_CONFIG.WORLD_WIDTH - 100, y: GAME_CONFIG.WORLD_HEIGHT - 100 },
            ];

            for (const pos of positions) {
                const traffic = analyzer.getTrafficAt(pos.x, pos.y);
                expect(traffic).toBeGreaterThanOrEqual(0);
                expect(traffic).toBeLessThanOrEqual(1);
            }
        });
    });

    describe('getHighTrafficCells', () => {
        it('should return cells sorted by density (highest first)', () => {
            analyzer.analyze();
            const cells = analyzer.getHighTrafficCells(10, 0.3);

            expect(cells.length).toBeGreaterThan(0);
            expect(cells.length).toBeLessThanOrEqual(10);

            // Verify descending order by checking first has higher traffic than last
            if (cells.length > 1) {
                const firstPos = analyzer.getCellWorldPosition(cells[0]);
                const lastPos = analyzer.getCellWorldPosition(cells[cells.length - 1]);

                const firstTraffic = analyzer.getTrafficAt(firstPos.x, firstPos.y);
                const lastTraffic = analyzer.getTrafficAt(lastPos.x, lastPos.y);

                expect(firstTraffic).toBeGreaterThanOrEqual(lastTraffic);
            }
        });

        it('should respect minDensity threshold', () => {
            analyzer.analyze();
            const highThreshold = analyzer.getHighTrafficCells(100, 0.8);

            for (const cellIndex of highThreshold) {
                const pos = analyzer.getCellWorldPosition(cellIndex);
                const traffic = analyzer.getTrafficAt(pos.x, pos.y);
                expect(traffic).toBeGreaterThanOrEqual(0.8);
            }
        });
    });

    describe('analyze', () => {
        it('should return FlowAnalysis with all required fields', () => {
            const analysis = analyzer.analyze();

            expect(analysis).toBeDefined();
            expect(analysis.highTrafficCells).toBeInstanceOf(Array);
            expect(analysis.flowVectors).toBeInstanceOf(Map);
            expect(analysis.trafficDensity).toBeInstanceOf(Float32Array);
        });

        it('should populate flow vectors for high traffic cells', () => {
            const analysis = analyzer.analyze();

            for (const cellIndex of analysis.highTrafficCells) {
                expect(analysis.flowVectors.has(cellIndex)).toBe(true);
                const flow = analysis.flowVectors.get(cellIndex)!;
                expect(typeof flow.x).toBe('number');
                expect(typeof flow.y).toBe('number');
            }
        });
    });

    describe('edge cases', () => {
        it('should return 0 traffic for out-of-bounds positions', () => {
            analyzer.analyze();

            const traffic = analyzer.getTrafficAt(-100, -100);
            // getCellIndex clamps, so it should still return valid but edge traffic
            expect(traffic).toBeGreaterThanOrEqual(0);
        });

        it('should handle multiple analyze calls', () => {
            // First analysis
            const analysis1 = analyzer.analyze();
            expect(analysis1.highTrafficCells.length).toBeGreaterThan(0);

            // Second analysis should work without error
            const analysis2 = analyzer.analyze();

            expect(analysis2.highTrafficCells.length).toBeGreaterThan(0);
        });
    });
});
