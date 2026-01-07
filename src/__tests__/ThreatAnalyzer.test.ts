/**
 * Tests for ThreatAnalyzer
 *
 * Tests threat analysis logic including threat level calculation,
 * impact time prediction, and behavior-based recommendations.
 * Uses simplified mocking approach for bitecs.
 *
 * @module __tests__/ThreatAnalyzer.test
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AIBehaviorType, GAME_CONFIG } from '../types/constants';

// Mock bitecs module before importing ThreatAnalyzer
vi.mock('bitecs', () => ({
    query: vi.fn(() => []),
    hasComponent: vi.fn(() => false),
    defineQuery: vi.fn(() => vi.fn(() => [])),
}));

// Mock components with simple arrays
vi.mock('../ecs/components', () => ({
    Position: { x: [], y: [] },
    Velocity: { x: [], y: [] },
    Faction: { id: [] },
    Health: { current: [], max: [] },
    AIBehavior: { behaviorType: [] },
    EnemyVariant: { rank: [] },
}));

// Mock BehaviorPredictor and BehaviorCounterSelector using class syntax
vi.mock('../ai/behaviors/BehaviorPredictor', () => ({
    BehaviorPredictor: class MockBehaviorPredictor {
        predict() {
            return {
                positions: [],
                confidence: 0.5,
            };
        }
    },
}));

vi.mock('../ai/behaviors/BehaviorCounterSelector', () => ({
    BehaviorCounterSelector: class MockBehaviorCounterSelector {
        selectCounter() {
            return [];
        }
        getPlacementStrategy() {
            return {
                prioritizeCorners: false,
                prioritizePaths: true,
                spacing: 100,
            };
        }
    },
}));

// Now import the module under test
import { ThreatAnalyzer } from '../ai/ThreatAnalyzer';
import { query, hasComponent } from 'bitecs';
import { Position, Velocity, Faction, Health, AIBehavior, EnemyVariant } from '../ecs/components';

// Helper to setup mock entity data
function setupMockEntity(
    eid: number,
    data: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        factionId: number;
        health: number;
        maxHealth: number;
        behaviorType: number;
        rank?: number;
    }
) {
    (Position.x as number[])[eid] = data.x;
    (Position.y as number[])[eid] = data.y;
    (Velocity.x as number[])[eid] = data.vx;
    (Velocity.y as number[])[eid] = data.vy;
    (Faction.id as number[])[eid] = data.factionId;
    (Health.current as number[])[eid] = data.health;
    (Health.max as number[])[eid] = data.maxHealth;
    (AIBehavior.behaviorType as number[])[eid] = data.behaviorType;
    if (data.rank !== undefined) {
        (EnemyVariant.rank as number[])[eid] = data.rank;
    }
}

describe('ThreatAnalyzer', () => {
    let analyzer: ThreatAnalyzer;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mockWorld = {} as any;
    const mockGetKM = vi.fn(() => -1);

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(query).mockReturnValue([]);
        vi.mocked(hasComponent).mockReturnValue(false);
        mockGetKM.mockReturnValue(-1);
        analyzer = new ThreatAnalyzer(mockWorld, mockGetKM);
    });

    describe('analyzeThreats', () => {
        it('should return empty array when no enemies', () => {
            vi.mocked(query).mockReturnValue([]);

            const threats = analyzer.analyzeThreats();

            expect(threats).toEqual([]);
        });

        it('should analyze enemy threats and return array', () => {
            // Setup mock enemy
            const enemies = [1];
            vi.mocked(query).mockReturnValue(enemies);

            setupMockEntity(1, {
                x: GAME_CONFIG.WORLD_WIDTH / 2 + 100,
                y: GAME_CONFIG.WORLD_HEIGHT / 2,
                vx: 50,
                vy: 0,
                factionId: 1, // Non-federation
                health: 100,
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            const threats = analyzer.analyzeThreats();

            expect(threats.length).toBe(1);
            expect(threats[0].entityId).toBe(1);
            expect(threats[0].threatLevel).toBeGreaterThan(0);
        });

        it('should skip dead enemies', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockEntity(1, {
                x: 100,
                y: 100,
                vx: 10,
                vy: 0,
                factionId: 1,
                health: 0, // Dead
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            const threats = analyzer.analyzeThreats();

            expect(threats.length).toBe(0);
        });

        it('should skip federation entities', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockEntity(1, {
                x: 100,
                y: 100,
                vx: 10,
                vy: 0,
                factionId: 0, // Federation
                health: 100,
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            const threats = analyzer.analyzeThreats();

            expect(threats.length).toBe(0);
        });

        it('should sort threats by threat level (highest first)', () => {
            vi.mocked(query).mockReturnValue([1, 2]);

            // Entity 1: close to center (higher threat)
            setupMockEntity(1, {
                x: GAME_CONFIG.WORLD_WIDTH / 2 + 50,
                y: GAME_CONFIG.WORLD_HEIGHT / 2,
                vx: 10,
                vy: 0,
                factionId: 1,
                health: 100,
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            // Entity 2: far from center (lower threat)
            setupMockEntity(2, {
                x: 50,
                y: 50,
                vx: 10,
                vy: 0,
                factionId: 1,
                health: 100,
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            const threats = analyzer.analyzeThreats();

            expect(threats.length).toBe(2);
            expect(threats[0].threatLevel).toBeGreaterThanOrEqual(threats[1].threatLevel);
        });
    });

    describe('getOverallThreatLevel', () => {
        it('should return 0 when no enemies', () => {
            vi.mocked(query).mockReturnValue([]);

            expect(analyzer.getOverallThreatLevel()).toBe(0);
        });

        it('should return aggregated threat level', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockEntity(1, {
                x: GAME_CONFIG.WORLD_WIDTH / 2 + 100,
                y: GAME_CONFIG.WORLD_HEIGHT / 2,
                vx: 50,
                vy: 0,
                factionId: 1,
                health: 100,
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            const overall = analyzer.getOverallThreatLevel();

            expect(overall).toBeGreaterThan(0);
            expect(overall).toBeLessThanOrEqual(100);
        });
    });

    describe('getHighestThreats', () => {
        it('should return top N threats', () => {
            vi.mocked(query).mockReturnValue([1, 2, 3]);

            // Setup 3 enemies at different distances
            for (let i = 1; i <= 3; i++) {
                setupMockEntity(i, {
                    x: 100 * i,
                    y: 100,
                    vx: 10,
                    vy: 0,
                    factionId: 1,
                    health: 100,
                    maxHealth: 100,
                    behaviorType: AIBehaviorType.DIRECT,
                });
            }

            const topThreats = analyzer.getHighestThreats(2);

            expect(topThreats.length).toBe(2);
        });

        it('should default to 5 threats', () => {
            vi.mocked(query).mockReturnValue([1, 2]);

            setupMockEntity(1, { x: 100, y: 100, vx: 10, vy: 0, factionId: 1, health: 100, maxHealth: 100, behaviorType: AIBehaviorType.DIRECT });
            setupMockEntity(2, { x: 200, y: 100, vx: 10, vy: 0, factionId: 1, health: 100, maxHealth: 100, behaviorType: AIBehaviorType.DIRECT });

            const topThreats = analyzer.getHighestThreats();

            expect(topThreats.length).toBe(2); // Only 2 available
        });
    });

    describe('getDominantBehavior', () => {
        it('should return DIRECT when no enemies', () => {
            vi.mocked(query).mockReturnValue([]);

            expect(analyzer.getDominantBehavior()).toBe(AIBehaviorType.DIRECT);
        });

        it('should return most common behavior type', () => {
            vi.mocked(query).mockReturnValue([1, 2, 3]);

            // 2 STRAFE, 1 DIRECT
            setupMockEntity(1, { x: 100, y: 100, vx: 10, vy: 0, factionId: 1, health: 100, maxHealth: 100, behaviorType: AIBehaviorType.STRAFE });
            setupMockEntity(2, { x: 200, y: 100, vx: 10, vy: 0, factionId: 1, health: 100, maxHealth: 100, behaviorType: AIBehaviorType.STRAFE });
            setupMockEntity(3, { x: 300, y: 100, vx: 10, vy: 0, factionId: 1, health: 100, maxHealth: 100, behaviorType: AIBehaviorType.DIRECT });

            const dominant = analyzer.getDominantBehavior();

            expect(dominant).toBe(AIBehaviorType.STRAFE);
        });
    });

    describe('getCounterRecommendations', () => {
        it('should return recommendations array', () => {
            const recommendations = analyzer.getCounterRecommendations(500);

            expect(Array.isArray(recommendations)).toBe(true);
        });
    });

    describe('getPlacementStrategy', () => {
        it('should return placement strategy object', () => {
            const strategy = analyzer.getPlacementStrategy();

            expect(strategy).toHaveProperty('prioritizeCorners');
            expect(strategy).toHaveProperty('prioritizePaths');
            expect(strategy).toHaveProperty('spacing');
        });
    });

    describe('getPredictedPositions', () => {
        it('should return prediction for threat', () => {
            vi.mocked(query).mockReturnValue([1]);

            setupMockEntity(1, {
                x: 200,
                y: 200,
                vx: 50,
                vy: 50,
                factionId: 1,
                health: 100,
                maxHealth: 100,
                behaviorType: AIBehaviorType.DIRECT,
            });

            const threats = analyzer.analyzeThreats();
            expect(threats.length).toBe(1);

            const prediction = analyzer.getPredictedPositions(threats[0]);

            expect(prediction).toHaveProperty('positions');
            expect(prediction).toHaveProperty('confidence');
        });
    });
});
