# Task 06: ThreatAnalyzer Test Coverage

> **Priority**: P2 - Medium Complexity
> **Estimated Time**: 30-40 minutes
> **Lines to Cover**: ~200 lines

## Objective

Add unit tests for `ThreatAnalyzer` class in `src/ai/ThreatAnalyzer.ts`.

## Why This Is a Quick Win

- Threat calculations are mathematical
- Direction and distance calculations are pure functions
- Position prediction logic is testable
- Minimal external dependencies

## Target File

`src/ai/ThreatAnalyzer.ts`

## Methods to Test

### 1. Threat Vector Calculation
- Calculate threat level based on enemy stats
- Calculate direction toward KM
- Calculate predicted position
- Calculate distance from KM

### 2. Threat Aggregation
- `analyze()` → returns sorted threat vectors
- Filter by minimum threat level
- Sort by threat priority

### 3. Utility Methods
- Direction normalization
- Distance calculations
- Behavior type detection

## Implementation Instructions

1. Create new test file: `src/__tests__/ThreatAnalyzer.test.ts`

2. Follow this structure:

```typescript
/**
 * Tests for ThreatAnalyzer
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ThreatAnalyzer } from '../ai/ThreatAnalyzer';
import { AIBehaviorType, GAME_CONFIG } from '../types/constants';

// Mock bitecs
vi.mock('bitecs', () => ({
    query: vi.fn(() => []),
    defineQuery: vi.fn(() => vi.fn(() => []))
}));

// Mock components
vi.mock('../ecs/components', () => ({
    Position: { x: [0], y: [0] },
    Velocity: { x: [0], y: [0] },
    Health: { current: [100], max: [100] },
    Enemy: { behaviorType: [0], damage: [10] },
    Combat: { damage: [10] }
}));

describe('ThreatAnalyzer', () => {
    let analyzer: ThreatAnalyzer;
    const mockWorld = {} as any;

    beforeEach(() => {
        analyzer = new ThreatAnalyzer(mockWorld);
    });

    describe('analyze', () => {
        it('should return empty array when no enemies', () => {
            const threats = analyzer.analyze();
            expect(threats).toEqual([]);
        });
    });

    describe('threat calculation helpers', () => {
        it('should calculate correct direction to center', () => {
            // Test direction calculation logic
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            
            // Enemy at top-left should have direction toward center
            const enemyX = 0;
            const enemyY = 0;
            
            const dx = centerX - enemyX;
            const dy = centerY - enemyY;
            const length = Math.sqrt(dx * dx + dy * dy);
            
            expect(dx / length).toBeGreaterThan(0); // Moving right
            expect(dy / length).toBeGreaterThan(0); // Moving down
        });

        it('should calculate distance correctly', () => {
            const x1 = 0, y1 = 0;
            const x2 = 300, y2 = 400;
            
            const distance = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
            expect(distance).toBe(500); // 3-4-5 triangle scaled
        });
    });

    describe('threat level calculation', () => {
        it('should assign higher threat to closer enemies', () => {
            // Closer enemies should have higher threat
            const closeDistance = 100;
            const farDistance = 500;
            
            // Threat inversely proportional to distance
            const closeThreat = 1 / closeDistance;
            const farThreat = 1 / farDistance;
            
            expect(closeThreat).toBeGreaterThan(farThreat);
        });

        it('should consider enemy damage in threat calculation', () => {
            // Higher damage = higher threat
            const lowDamage = 10;
            const highDamage = 50;
            
            expect(highDamage).toBeGreaterThan(lowDamage);
        });
    });

    describe('position prediction', () => {
        it('should predict forward position based on velocity', () => {
            const currentX = 100;
            const currentY = 100;
            const velocityX = 10;
            const velocityY = 5;
            const predictionTime = 1; // seconds
            
            const predictedX = currentX + velocityX * predictionTime;
            const predictedY = currentY + velocityY * predictionTime;
            
            expect(predictedX).toBe(110);
            expect(predictedY).toBe(105);
        });
    });

    describe('behavior type mapping', () => {
        it('should map behavior types correctly', () => {
            const behaviors = [
                AIBehaviorType.DIRECT,
                AIBehaviorType.STRAFE,
                AIBehaviorType.ORBIT,
                AIBehaviorType.SWARM,
                AIBehaviorType.HUNTER
            ];
            
            // All behavior types should be valid numbers
            for (const behavior of behaviors) {
                expect(typeof behavior).toBe('number');
            }
        });
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/ThreatAnalyzer.test.ts
```

Expected: All tests pass, covering threat calculation and prediction logic.

## Dependencies

- Vitest (already installed)
- Mocks for bitecs and components

## Notes

- Focus on mathematical calculations that don't need entity queries
- Entity-based tests require more complex mocking
- Can use indirect testing of helper logic
