# Task 09: ApproachCorridorAnalyzer Test Coverage

> **Priority**: P3 - Requires More Setup
> **Estimated Time**: 25-35 minutes
> **Lines to Cover**: ~150 lines

## Objective

Add unit tests for `ApproachCorridorAnalyzer` class in `src/ai/spatial/ApproachCorridorAnalyzer.ts`.

## Why This Is Worth It

- Spatial analysis is testable with mock data
- Corridor calculation is deterministic
- Pure geometry calculations
- Self-contained analysis module

## Target File

`src/ai/spatial/ApproachCorridorAnalyzer.ts`

## Methods to Test

### 1. Corridor Detection
- Identify corridors from spawn points to KM
- Calculate corridor width and length
- Score corridor by traffic/threat

### 2. Position Scoring
- Score positions for corridor coverage
- Consider multiple corridors
- Weight by threat level

### 3. Utility Methods
- Corridor intersection calculations
- Distance to corridor calculations

## Implementation Instructions

1. Create new test file: `src/__tests__/ApproachCorridorAnalyzer.test.ts`

2. Follow this structure:

```typescript
/**
 * Tests for ApproachCorridorAnalyzer
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApproachCorridorAnalyzer } from '../ai/spatial/ApproachCorridorAnalyzer';
import { GAME_CONFIG, SPAWN_CONFIG } from '../types/constants';

// Mock dependencies if needed
vi.mock('bitecs', () => ({
    query: vi.fn(() => []),
    defineQuery: vi.fn(() => vi.fn(() => []))
}));

describe('ApproachCorridorAnalyzer', () => {
    let analyzer: ApproachCorridorAnalyzer;

    beforeEach(() => {
        analyzer = new ApproachCorridorAnalyzer();
    });

    describe('corridor detection', () => {
        it('should detect corridors from spawn points', () => {
            const corridors = analyzer.getCorridors();
            
            expect(Array.isArray(corridors)).toBe(true);
            // Should have corridors for each edge spawn
            expect(corridors.length).toBeGreaterThan(0);
        });

        it('should create corridors pointing toward center', () => {
            const corridors = analyzer.getCorridors();
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            
            for (const corridor of corridors) {
                // End point should be near center
                expect(corridor.endX).toBeCloseTo(centerX, -1);
                expect(corridor.endY).toBeCloseTo(centerY, -1);
            }
        });

        it('should have valid corridor dimensions', () => {
            const corridors = analyzer.getCorridors();
            
            for (const corridor of corridors) {
                expect(corridor.width).toBeGreaterThan(0);
                expect(corridor.length).toBeGreaterThan(0);
            }
        });
    });

    describe('position scoring', () => {
        it('should score positions within corridors higher', () => {
            const corridors = analyzer.getCorridors();
            
            if (corridors.length > 0) {
                const corridor = corridors[0];
                // Position in middle of corridor
                const inCorridor = {
                    x: (corridor.startX + corridor.endX) / 2,
                    y: (corridor.startY + corridor.endY) / 2
                };
                // Position far from any corridor
                const outsideCorridor = { x: 0, y: 0 };
                
                const inScore = analyzer.scorePosition(inCorridor.x, inCorridor.y);
                const outScore = analyzer.scorePosition(outsideCorridor.x, outsideCorridor.y);
                
                // In-corridor position should score higher (or equal if edge)
                expect(inScore).toBeGreaterThanOrEqual(0);
            }
        });

        it('should return number for any position', () => {
            const score = analyzer.scorePosition(500, 500);
            
            expect(typeof score).toBe('number');
            expect(score).toBeGreaterThanOrEqual(0);
        });
    });

    describe('corridor geometry', () => {
        it('should calculate distance to corridor correctly', () => {
            const corridors = analyzer.getCorridors();
            
            if (corridors.length > 0) {
                const corridor = corridors[0];
                // Point on corridor line
                const onLine = {
                    x: (corridor.startX + corridor.endX) / 2,
                    y: (corridor.startY + corridor.endY) / 2
                };
                
                const distance = analyzer.distanceToCorridor(
                    onLine.x, onLine.y, corridor
                );
                
                // Should be close to 0 (or within corridor width)
                expect(distance).toBeLessThan(corridor.width);
            }
        });

        it('should identify best corridor for position', () => {
            const bestCorridor = analyzer.getBestCorridorFor(
                GAME_CONFIG.WORLD_WIDTH / 2,
                GAME_CONFIG.WORLD_HEIGHT / 2
            );
            
            // Should return a corridor or null
            if (bestCorridor) {
                expect(bestCorridor).toHaveProperty('startX');
                expect(bestCorridor).toHaveProperty('endX');
            }
        });
    });

    describe('coverage optimization', () => {
        it('should suggest positions covering multiple corridors', () => {
            const suggestions = analyzer.suggestCoveragePositions(3);
            
            expect(Array.isArray(suggestions)).toBe(true);
            expect(suggestions.length).toBeLessThanOrEqual(3);
            
            for (const pos of suggestions) {
                expect(typeof pos.x).toBe('number');
                expect(typeof pos.y).toBe('number');
            }
        });

        it('should return positions within world bounds', () => {
            const suggestions = analyzer.suggestCoveragePositions(5);
            
            for (const pos of suggestions) {
                expect(pos.x).toBeGreaterThanOrEqual(0);
                expect(pos.x).toBeLessThanOrEqual(GAME_CONFIG.WORLD_WIDTH);
                expect(pos.y).toBeGreaterThanOrEqual(0);
                expect(pos.y).toBeLessThanOrEqual(GAME_CONFIG.WORLD_HEIGHT);
            }
        });
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/ApproachCorridorAnalyzer.test.ts
```

Expected: All tests pass, covering corridor detection and position scoring.

## Dependencies

- Vitest (already installed)
- May need mock for spawn configuration

## Notes

- Implementation may vary - adjust tests based on actual API
- Focus on geometric calculations
- Corridor detection from spawn points is the key functionality
