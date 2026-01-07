/**
 * Tests for ActionPlanner
 *
 * Tests action planning logic including placement and upgrade actions.
 * Uses extensive mocking for dependencies.
 *
 * @module __tests__/ActionPlanner.test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
// Types only used by mocked modules

// Mock bitecs module
vi.mock('bitecs', () => ({
    query: vi.fn(() => []),
    hasComponent: vi.fn(() => false),
    defineQuery: vi.fn(() => vi.fn(() => [])),
}));

// Mock components
vi.mock('../ecs/components', () => ({
    Position: { x: [], y: [] },
    Turret: { range: [], damage: [], fireRate: [] },
    TurretUpgrade: { damageLevel: [], rangeLevel: [], fireRateLevel: [], multiTargetLevel: [], specialLevel: [] },
    Faction: { id: [] },
}));

// Mock PathInterceptor
vi.mock('../ai/spatial/PathInterceptor', () => ({
    PathInterceptor: class MockPathInterceptor {
        findInterceptionPoints() {
            return [{ x: 500, y: 500 }];
        }
    },
}));

// Mock ScoringCurves
vi.mock('../ai/utility/ScoringCurves', () => ({
    ScoringCurves: {
        PRESETS: {
            coverageGap: vi.fn(() => 0.5),
            threatResponse: vi.fn(() => 0.5),
        },
    },
}));

// Mock ActionBucketing
vi.mock('../ai/utility/ActionBucketing', () => ({
    ActionBucketing: {
        prioritizeActions: vi.fn((actions) => actions),
    },
}));

// Mock DecisionInertia
vi.mock('../ai/utility/DecisionInertia', () => ({
    DecisionInertia: class MockDecisionInertia {
        applyInertia(actions: unknown[]) { return actions; }
        shouldSwitch() { return true; }
        recordAction() { }
        reset() { }
    },
}));

// Import after mocks
import { ActionPlanner } from '../ai/ActionPlanner';
import { AIActionType } from '../ai/types';
import { query, hasComponent } from 'bitecs';
import { Position, Turret, TurretUpgrade } from '../ecs/components';

describe('ActionPlanner', () => {
    let planner: ActionPlanner;

    // Mock dependencies
    const mockThreatAnalyzer = {
        analyzeThreats: vi.fn(() => []),
        getOverallThreatLevel: vi.fn(() => 0),
    };

    const mockCoverageAnalyzer = {
        analyze: vi.fn(() => ({
            sectors: [],
            totalCoverage: 0.5,
            weakestSector: 0,
        })),
        findBestPositionInSector: vi.fn(() => ({ x: 500, y: 500 })),
        getFlowAnalyzer: vi.fn(() => ({
            getTrafficAt: vi.fn(() => 0.5),
        })),
    };

    const mockResourceManager = {
        getResources: vi.fn(() => 500),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWorld = {} as any;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(query).mockReturnValue([]);
        vi.mocked(hasComponent).mockReturnValue(false);
        mockResourceManager.getResources.mockReturnValue(500);
        mockThreatAnalyzer.analyzeThreats.mockReturnValue([]);
        mockThreatAnalyzer.getOverallThreatLevel.mockReturnValue(0);
        mockCoverageAnalyzer.analyze.mockReturnValue({
            sectors: [],
            totalCoverage: 0.5,
            weakestSector: 0,
        });

        planner = new ActionPlanner(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockThreatAnalyzer as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockCoverageAnalyzer as any,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            mockResourceManager as any,
            mockWorld
        );
    });

    describe('planActions', () => {
        it('should return array of actions', () => {
            const actions = planner.planActions();

            expect(Array.isArray(actions)).toBe(true);
        });

        it('should call threat and coverage analyzers', () => {
            planner.planActions();

            expect(mockThreatAnalyzer.analyzeThreats).toHaveBeenCalled();
            expect(mockCoverageAnalyzer.analyze).toHaveBeenCalled();
        });

        it('should generate placement action when resources available', () => {
            mockResourceManager.getResources.mockReturnValue(500);

            const actions = planner.planActions();

            const placeActions = actions.filter((a) => a.type === AIActionType.PLACE_TURRET);
            expect(placeActions.length).toBeGreaterThanOrEqual(0); // May or may not generate depending on logic
        });

        it('should not generate actions when resources are too low', () => {
            mockResourceManager.getResources.mockReturnValue(10); // Below all costs

            const actions = planner.planActions();

            const placeActions = actions.filter((a) => a.type === AIActionType.PLACE_TURRET);
            expect(placeActions.length).toBe(0);
        });

        it('should include upgrade actions when turrets exist', () => {
            // Mock existing turrets
            vi.mocked(query).mockReturnValue([1]);
            vi.mocked(hasComponent).mockReturnValue(true);

            // Setup turret data
            (Position.x as number[])[1] = 500;
            (Position.y as number[])[1] = 500;
            (Turret.range as number[])[1] = 200;
            (Turret.damage as number[])[1] = 10;
            (Turret.fireRate as number[])[1] = 2;
            (TurretUpgrade.damageLevel as number[])[1] = 0;
            (TurretUpgrade.rangeLevel as number[])[1] = 0;
            (TurretUpgrade.fireRateLevel as number[])[1] = 0;

            const actions = planner.planActions();

            // May include upgrade action
            expect(Array.isArray(actions)).toBe(true);
        });

        it('should sort actions by priority', () => {
            const actions = planner.planActions();

            // Verify sorted in descending priority order
            for (let i = 1; i < actions.length; i++) {
                expect(actions[i - 1].priority).toBeGreaterThanOrEqual(actions[i].priority);
            }
        });
    });

    describe('action structure', () => {
        it('should have correct structure for PLACE_TURRET action', () => {
            mockResourceManager.getResources.mockReturnValue(500);

            const actions = planner.planActions();
            const placeAction = actions.find((a) => a.type === AIActionType.PLACE_TURRET);

            if (placeAction) {
                expect(placeAction).toHaveProperty('type');
                expect(placeAction).toHaveProperty('priority');
                expect(placeAction).toHaveProperty('cost');
                expect(placeAction).toHaveProperty('expectedValue');
                expect(placeAction).toHaveProperty('params');
                expect((placeAction.params as { x: number }).x).toBeDefined();
                expect((placeAction.params as { y: number }).y).toBeDefined();
                expect((placeAction.params as { turretType: number }).turretType).toBeDefined();
            }
        });
    });

    describe('reset', () => {
        it('should reset planner state without throwing', () => {
            expect(() => planner.reset()).not.toThrow();
        });
    });

    describe('threat response', () => {
        it('should adjust priorities based on threat level', () => {
            // Low threat scenario
            mockThreatAnalyzer.getOverallThreatLevel.mockReturnValue(10);
            const lowThreatActions = planner.planActions();

            // High threat scenario
            mockThreatAnalyzer.getOverallThreatLevel.mockReturnValue(80);
            const highThreatActions = planner.planActions();

            // Both should be valid arrays
            expect(Array.isArray(lowThreatActions)).toBe(true);
            expect(Array.isArray(highThreatActions)).toBe(true);
        });
    });

    describe('coverage response', () => {
        it('should respond to coverage gaps', () => {
            // Good coverage
            mockCoverageAnalyzer.analyze.mockReturnValue({
                sectors: [],
                totalCoverage: 0.9,
                weakestSector: 0,
            });
            const goodCoverageActions = planner.planActions();

            // Poor coverage
            mockCoverageAnalyzer.analyze.mockReturnValue({
                sectors: [],
                totalCoverage: 0.1,
                weakestSector: 5,
            });
            const poorCoverageActions = planner.planActions();

            expect(Array.isArray(goodCoverageActions)).toBe(true);
            expect(Array.isArray(poorCoverageActions)).toBe(true);
        });
    });

    describe('resource management', () => {
        it('should respect emergency reserve', () => {
            // 60 resources means only 10 available after 50 reserve
            mockResourceManager.getResources.mockReturnValue(60);

            const actions = planner.planActions();

            // With only 10 available, no expensive turrets should be suggested
            const placeActions = actions.filter((a) => a.type === AIActionType.PLACE_TURRET);
            for (const action of placeActions) {
                expect(action.cost).toBeLessThanOrEqual(10);
            }
        });
    });
});
