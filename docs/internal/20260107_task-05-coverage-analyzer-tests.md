# Task 05: CoverageAnalyzer Test Coverage

> **Priority**: P2 - Medium Complexity
> **Estimated Time**: 40-50 minutes
> **Lines to Cover**: ~392 lines

## Objective

Add unit tests for `CoverageAnalyzer` class in `src/ai/CoverageAnalyzer.ts`.

## Why This Is a Quick Win

- Core analysis logic is deterministic
- Sector grid calculations are pure math
- Can mock the world/entity queries
- Key coverage calculation methods are testable

## Target File

`src/ai/CoverageAnalyzer.ts`

## Key Methods to Test

### 1. Sector Management
- `initializeSectors()` → creates sector grid
- `getSectorIndex(x, y)` → maps position to sector
- `getSectorAt(x, y)` → returns sector data

### 2. Coverage Calculation
- `getCoverageAtPosition(x, y)` → calculates DPS coverage
- `findWeakestSector()` → identifies lowest coverage sector
- `findBestPositionInSector(sectorIndex, threats?)` → optimal placement

### 3. Utility Methods
- `distanceToLine(px, py, x1, y1, x2, y2)` → point-to-line distance
- `scorePosition(x, y, kmX, kmY, threats?)` → position scoring

## Implementation Instructions

1. Create new test file: `src/__tests__/CoverageAnalyzer.test.ts`

2. Mock the bitecs query and world:

```typescript
/**
 * Tests for CoverageAnalyzer
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoverageAnalyzer } from '../ai/CoverageAnalyzer';
import { GAME_CONFIG } from '../types/constants';

// Mock bitecs
vi.mock('bitecs', () => ({
    query: vi.fn(() => []),
    defineQuery: vi.fn(() => vi.fn(() => []))
}));

// Mock components
vi.mock('../ecs/components', () => ({
    Position: { x: [], y: [] },
    Turret: { type: [] },
    Combat: { damage: [], cooldown: [], range: [] }
}));

// Mock spatial analyzers
vi.mock('../ai/spatial/FlowFieldAnalyzer', () => ({
    FlowFieldAnalyzer: vi.fn().mockImplementation(() => ({
        getTrafficAt: vi.fn(() => 0),
        update: vi.fn()
    }))
}));

vi.mock('../ai/spatial/ThreatInfluenceMap', () => ({
    ThreatInfluenceMap: vi.fn().mockImplementation(() => ({
        getThreatAt: vi.fn(() => 0),
        update: vi.fn()
    }))
}));

vi.mock('../ai/spatial/CoverageInfluenceMap', () => ({
    CoverageInfluenceMap: vi.fn().mockImplementation(() => ({
        getCoverageAt: vi.fn(() => 0),
        update: vi.fn()
    }))
}));

describe('CoverageAnalyzer', () => {
    let analyzer: CoverageAnalyzer;
    const mockWorld = {} as any;

    beforeEach(() => {
        analyzer = new CoverageAnalyzer(mockWorld, 4, 4); // 4x4 grid
    });

    describe('getSectorIndex', () => {
        it('should return 0 for top-left corner', () => {
            const index = analyzer.getSectorIndex(0, 0);
            expect(index).toBe(0);
        });

        it('should return correct index for center', () => {
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            const index = analyzer.getSectorIndex(centerX, centerY);
            
            // Should be in middle of grid
            expect(index).toBeGreaterThan(0);
            expect(index).toBeLessThan(16); // 4x4 = 16 sectors
        });

        it('should clamp out-of-bounds positions', () => {
            const index = analyzer.getSectorIndex(-100, -100);
            expect(index).toBe(0); // Clamped to first sector
        });
    });

    describe('getSectorAt', () => {
        it('should return sector data for valid position', () => {
            const sector = analyzer.getSectorAt(
                GAME_CONFIG.WORLD_WIDTH / 2,
                GAME_CONFIG.WORLD_HEIGHT / 2
            );
            
            expect(sector).not.toBeNull();
            expect(sector).toHaveProperty('centerX');
            expect(sector).toHaveProperty('centerY');
            expect(sector).toHaveProperty('dpsCoverage');
        });

        it('should return null for out-of-bounds position', () => {
            const sector = analyzer.getSectorAt(-1000, -1000);
            expect(sector).toBeNull();
        });
    });

    describe('distanceToLine', () => {
        it('should return 0 when point is on line', () => {
            const dist = analyzer.distanceToLine(
                5, 5,  // point on line
                0, 0,  // line start
                10, 10 // line end
            );
            expect(dist).toBeCloseTo(0, 5);
        });

        it('should return perpendicular distance', () => {
            // Point at (5, 0) distance from line y = 5
            const dist = analyzer.distanceToLine(
                5, 0,  // point
                0, 5,  // line start
                10, 5  // line end
            );
            expect(dist).toBeCloseTo(5, 1);
        });

        it('should return distance to nearest endpoint when outside segment', () => {
            // Point beyond line segment
            const dist = analyzer.distanceToLine(
                20, 0,  // point
                0, 0,   // line start
                10, 0   // line end
            );
            expect(dist).toBeCloseTo(10, 1);
        });
    });

    describe('analyze', () => {
        it('should return coverage map with sectors', () => {
            const result = analyzer.analyze();
            
            expect(result).toHaveProperty('sectors');
            expect(result).toHaveProperty('overallCoverage');
            expect(result).toHaveProperty('weakestSectorIndex');
            expect(result.sectors.length).toBe(16); // 4x4 grid
        });

        it('should identify weakest sector correctly', () => {
            const result = analyzer.analyze();
            
            expect(typeof result.weakestSectorIndex).toBe('number');
            expect(result.weakestSectorIndex).toBeGreaterThanOrEqual(0);
            expect(result.weakestSectorIndex).toBeLessThan(16);
        });
    });

    describe('findBestPositionInSector', () => {
        it('should return valid position within sector', () => {
            const position = analyzer.findBestPositionInSector(0);
            
            expect(position).toHaveProperty('x');
            expect(position).toHaveProperty('y');
            expect(typeof position.x).toBe('number');
            expect(typeof position.y).toBe('number');
        });

        it('should return position within world bounds', () => {
            const position = analyzer.findBestPositionInSector(8); // Middle sector
            
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT);
        });
    });

    describe('getWeakestSector', () => {
        it('should return sector data', () => {
            const sector = analyzer.getWeakestSector();
            
            expect(sector).toHaveProperty('centerX');
            expect(sector).toHaveProperty('centerY');
            expect(sector).toHaveProperty('dpsCoverage');
        });
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/CoverageAnalyzer.test.ts
```

Expected: All tests pass, covering sector management and coverage calculation.

## Dependencies

- Vitest (already installed)
- Mocks for bitecs, components, and spatial analyzers

## Notes

- Heavy mocking required for world and entity queries
- Focus on testing pure calculation methods
- Grid math calculations are the key coverage target
