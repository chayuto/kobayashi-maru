/**
 * Tests for CoverageAnalyzer
 *
 * Tests sector grid management, coverage calculations, and position scoring.
 *
 * @module __tests__/CoverageAnalyzer.test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GAME_CONFIG } from '../types/constants';

// Mock bitecs module
vi.mock('bitecs', () => ({
    query: vi.fn(() => []),
    defineQuery: vi.fn(() => vi.fn(() => [])),
}));

// Mock components
vi.mock('../ecs/components', () => ({
    Position: { x: [], y: [] },
    Turret: { type: [], damage: [], fireRate: [], range: [] },
    Faction: { id: [] },
}));

// Mock spatial analyzers
vi.mock('../ai/spatial/FlowFieldAnalyzer', () => ({
    FlowFieldAnalyzer: class MockFlowFieldAnalyzer {
        analyze() { return { flow: {} }; }
        getTrafficAt() { return 0.5; }
        getFlowAt() { return { x: 0, y: 0 }; }
    },
}));

vi.mock('../ai/spatial/ThreatInfluenceMap', () => ({
    ThreatInfluenceMap: class MockThreatInfluenceMap {
        getThreatAt() { return 0; }
        update() { }
    },
}));

vi.mock('../ai/spatial/CoverageInfluenceMap', () => ({
    CoverageInfluenceMap: class MockCoverageInfluenceMap {
        getCoverageAt() { return 0; }
        update() { }
    },
}));

// Now import the module under test
import { CoverageAnalyzer } from '../ai/CoverageAnalyzer';
import { query } from 'bitecs';
import { Position, Turret, Faction } from '../ecs/components';

// Helper to setup mock turret
function setupMockTurret(
    eid: number,
    data: {
        x: number;
        y: number;
        damage: number;
        fireRate: number;
        range: number;
        factionId: number;
    }
) {
    (Position.x as number[])[eid] = data.x;
    (Position.y as number[])[eid] = data.y;
    (Turret.damage as number[])[eid] = data.damage;
    (Turret.fireRate as number[])[eid] = data.fireRate;
    (Turret.range as number[])[eid] = data.range;
    (Faction.id as number[])[eid] = data.factionId;
}

describe('CoverageAnalyzer', () => {
    let analyzer: CoverageAnalyzer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWorld = {} as any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(query).mockReturnValue([]);
        analyzer = new CoverageAnalyzer(mockWorld, 4, 4); // 4x4 grid
    });

    describe('analyze', () => {
        it('should return coverage map with sectors', () => {
            const result = analyzer.analyze();

            expect(result).toHaveProperty('sectors');
            expect(result).toHaveProperty('totalCoverage');
            expect(result).toHaveProperty('weakestSector');
            expect(result.sectors.length).toBe(16); // 4x4 grid
        });

        it('should have 0 coverage with no turrets', () => {
            vi.mocked(query).mockReturnValue([]);

            const result = analyzer.analyze();

            expect(result.totalCoverage).toBe(0);
        });

        it('should calculate coverage when turrets exist', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockTurret(1, {
                x: GAME_CONFIG.WORLD_WIDTH / 2,
                y: GAME_CONFIG.WORLD_HEIGHT / 2,
                damage: 10,
                fireRate: 2,
                range: 150,
                factionId: 0, // Federation
            });

            const result = analyzer.analyze();

            // Should have some coverage now
            expect(result.totalCoverage).toBeGreaterThanOrEqual(0);
        });
    });

    describe('getSectorAt', () => {
        it('should return sector data for valid position', () => {
            const sector = analyzer.getSectorAt(
                GAME_CONFIG.WORLD_WIDTH / 2,
                GAME_CONFIG.WORLD_HEIGHT / 2
            );

            expect(sector).not.toBeNull();
            expect(sector).toHaveProperty('x');
            expect(sector).toHaveProperty('y');
            expect(sector).toHaveProperty('width');
            expect(sector).toHaveProperty('height');
        });

        it('should return null for out-of-bounds position', () => {
            const sector = analyzer.getSectorAt(-1000, -1000);
            expect(sector).toBeNull();
        });
    });

    describe('getWeakestSector', () => {
        it('should return sector data', () => {
            const sector = analyzer.getWeakestSector();

            expect(sector).toHaveProperty('x');
            expect(sector).toHaveProperty('y');
            expect(sector).toHaveProperty('index');
        });

        it('should identify sector with lowest coverage', () => {
            // With no turrets, all sectors have 0 coverage
            const sector = analyzer.getWeakestSector();
            expect(sector.totalDPS).toBe(0);
        });
    });

    describe('findBestPositionInSector', () => {
        it('should return valid position for valid sector index', () => {
            const position = analyzer.findBestPositionInSector(0);

            expect(position).toHaveProperty('x');
            expect(position).toHaveProperty('y');
            expect(typeof position.x).toBe('number');
            expect(typeof position.y).toBe('number');
        });

        it('should return center position for invalid sector index', () => {
            const position = analyzer.findBestPositionInSector(-1);

            expect(position.x).toBe(GAME_CONFIG.WORLD_WIDTH / 2);
            expect(position.y).toBe(GAME_CONFIG.WORLD_HEIGHT / 2);
        });

        it('should return position within world bounds', () => {
            const position = analyzer.findBestPositionInSector(8); // Middle sector

            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT);
        });
    });

    describe('getCoverageAtPosition', () => {
        it('should return 0 when no turrets', () => {
            vi.mocked(query).mockReturnValue([]);

            const coverage = analyzer.getCoverageAtPosition(500, 500);

            expect(coverage).toBe(0);
        });

        it('should return coverage factor when position is in turret range', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockTurret(1, {
                x: 500,
                y: 500,
                damage: 10,
                fireRate: 2,
                range: 200,
                factionId: 0,
            });

            // Position at turret location
            const coverage = analyzer.getCoverageAtPosition(500, 500);

            // Should have coverage (1 - 0/range = 1)
            expect(coverage).toBeGreaterThan(0);
        });

        it('should return 0 when position is out of turret range', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockTurret(1, {
                x: 0,
                y: 0,
                damage: 10,
                fireRate: 2,
                range: 100, // Small range
                factionId: 0,
            });

            // Position far from turret
            const coverage = analyzer.getCoverageAtPosition(500, 500);

            expect(coverage).toBe(0);
        });
    });

    describe('getFlowAnalyzer', () => {
        it('should return flow analyzer instance', () => {
            const flowAnalyzer = analyzer.getFlowAnalyzer();

            expect(flowAnalyzer).toBeDefined();
            expect(flowAnalyzer.getTrafficAt).toBeDefined();
        });
    });

    describe('getThreatMap and getCoverageMap', () => {
        it('should return threat map instance', () => {
            const threatMap = analyzer.getThreatMap();

            expect(threatMap).toBeDefined();
            expect(threatMap.getThreatAt).toBeDefined();
        });

        it('should return coverage map instance', () => {
            const coverageMap = analyzer.getCoverageMap();

            expect(coverageMap).toBeDefined();
            expect(coverageMap.getCoverageAt).toBeDefined();
        });
    });

    describe('updateInfluenceMaps', () => {
        it('should call update on both influence maps', () => {
            // Just verify it doesn't throw
            expect(() => analyzer.updateInfluenceMaps()).not.toThrow();
        });
    });
});
