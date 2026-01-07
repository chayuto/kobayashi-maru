/**
 * Tests for ApproachCorridorAnalyzer
 *
 * Tests corridor identification, position scoring, and defense position calculation.
 *
 * @module __tests__/ApproachCorridorAnalyzer.test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApproachCorridorAnalyzer } from '../ai/spatial/ApproachCorridorAnalyzer';
import { GAME_CONFIG } from '../types/constants';

// Create mock flow analyzer
const mockGetTrafficAt = vi.fn(() => 0.5);
const mockGetFlowAt = vi.fn(() => ({ x: 0.5, y: 0.5 }));

const mockFlowFieldAnalyzer = {
    analyze: vi.fn(),
    getTrafficAt: mockGetTrafficAt,
    getFlowAt: mockGetFlowAt,
};

describe('ApproachCorridorAnalyzer', () => {
    let analyzer: ApproachCorridorAnalyzer;

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset flow to always point toward center
        mockGetFlowAt.mockImplementation((x: number, y: number) => {
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            const dx = centerX - x;
            const dy = centerY - y;
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len === 0) return { x: 0, y: 0 };
            return { x: dx / len, y: dy / len };
        });
        mockGetTrafficAt.mockReturnValue(0.5);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        analyzer = new ApproachCorridorAnalyzer(mockFlowFieldAnalyzer as any);
    });

    describe('identifyCorridors', () => {
        it('should return array of corridors', () => {
            const corridors = analyzer.identifyCorridors();

            expect(Array.isArray(corridors)).toBe(true);
        });

        it('should have corridors from each edge', () => {
            const corridors = analyzer.identifyCorridors();

            // Should have corridors from top, right, bottom, left
            const edges = new Set(corridors.map((c) => c.startEdge));
            expect(edges.size).toBe(4);
            expect(edges.has('top')).toBe(true);
            expect(edges.has('right')).toBe(true);
            expect(edges.has('bottom')).toBe(true);
            expect(edges.has('left')).toBe(true);
        });

        it('should have valid corridor structure', () => {
            const corridors = analyzer.identifyCorridors();

            for (const corridor of corridors) {
                expect(corridor).toHaveProperty('id');
                expect(corridor).toHaveProperty('startEdge');
                expect(corridor).toHaveProperty('centerLine');
                expect(corridor).toHaveProperty('width');
                expect(corridor).toHaveProperty('trafficVolume');
                expect(Array.isArray(corridor.centerLine)).toBe(true);
            }
        });

        it('should have center lines pointing toward center', () => {
            const corridors = analyzer.identifyCorridors();
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

            for (const corridor of corridors) {
                if (corridor.centerLine.length > 1) {
                    const lastPoint = corridor.centerLine[corridor.centerLine.length - 1];
                    const distToCenter = Math.sqrt(
                        (lastPoint.x - centerX) ** 2 + (lastPoint.y - centerY) ** 2
                    );
                    // Last point should be within 100 of center (or close due to step size)
                    expect(distToCenter).toBeLessThan(200);
                }
            }
        });
    });

    describe('getCorridorDefensePositions', () => {
        it('should return defense positions along corridor', () => {
            const corridors = analyzer.identifyCorridors();

            if (corridors.length > 0) {
                const corridor = corridors[0];
                const positions = analyzer.getCorridorDefensePositions(corridor, 150, 3);

                expect(Array.isArray(positions)).toBe(true);
                expect(positions.length).toBeLessThanOrEqual(3);

                for (const pos of positions) {
                    expect(typeof pos.x).toBe('number');
                    expect(typeof pos.y).toBe('number');
                }
            }
        });

        it('should return positions within world bounds', () => {
            const corridors = analyzer.identifyCorridors();

            if (corridors.length > 0) {
                const corridor = corridors[0];
                const positions = analyzer.getCorridorDefensePositions(corridor, 150, 3);

                for (const pos of positions) {
                    expect(pos.x).toBeGreaterThanOrEqual(-50); // Some margin
                    expect(pos.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH + 50);
                    expect(pos.y).toBeGreaterThanOrEqual(-50);
                    expect(pos.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT + 50);
                }
            }
        });

        it('should space positions along corridor', () => {
            const corridors = analyzer.identifyCorridors();

            if (corridors.length > 0) {
                const corridor = corridors[0];
                const positions = analyzer.getCorridorDefensePositions(corridor, 150, 3);

                if (positions.length >= 2) {
                    // Check positions are spaced out
                    const dx = positions[1].x - positions[0].x;
                    const dy = positions[1].y - positions[0].y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    expect(distance).toBeGreaterThan(10); // Should have some spacing
                }
            }
        });
    });

    describe('corridor IDs', () => {
        it('should assign unique IDs to corridors', () => {
            const corridors = analyzer.identifyCorridors();
            const ids = corridors.map((c) => c.id);
            const uniqueIds = new Set(ids);

            expect(uniqueIds.size).toBe(ids.length);
        });

        it('should have sequential IDs starting from 0', () => {
            const corridors = analyzer.identifyCorridors();

            if (corridors.length > 0) {
                const ids = corridors.map((c) => c.id).sort((a, b) => a - b);
                expect(ids[0]).toBe(0);

                // Check sequential
                for (let i = 1; i < ids.length; i++) {
                    expect(ids[i]).toBe(ids[i - 1] + 1);
                }
            }
        });
    });

    describe('edge coverage', () => {
        it('should sample multiple points per edge', () => {
            const corridors = analyzer.identifyCorridors();

            // Count corridors per edge
            const edgeCounts: Record<string, number> = { top: 0, right: 0, bottom: 0, left: 0 };
            for (const corridor of corridors) {
                edgeCounts[corridor.startEdge]++;
            }

            // Each edge should have multiple sample points (5 by default)
            expect(edgeCounts.top).toBe(5);
            expect(edgeCounts.right).toBe(5);
            expect(edgeCounts.bottom).toBe(5);
            expect(edgeCounts.left).toBe(5);
        });
    });

    describe('flow field integration', () => {
        it('should call getTrafficAt during identification', () => {
            analyzer.identifyCorridors();

            expect(mockGetTrafficAt).toHaveBeenCalled();
        });

        it('should call getFlowAt during path tracing', () => {
            analyzer.identifyCorridors();

            expect(mockGetFlowAt).toHaveBeenCalled();
        });
    });
});
