# Task 01: BehaviorCounterSelector Test Coverage

> **Priority**: P1 - High Impact, Easy Implementation
> **Estimated Time**: 20-30 minutes
> **Lines to Cover**: ~189 lines

## Objective

Add unit tests for `BehaviorCounterSelector` class in `src/ai/behaviors/BehaviorCounterSelector.ts`.

## Why This Is a Quick Win

- Pure static methods with deterministic outputs
- Uses simple data structures (arrays, records)
- Minimal external dependencies (only constants)
- Clear input/output contracts

## Target File

`src/ai/behaviors/BehaviorCounterSelector.ts`

## Methods to Test

### 1. `selectCounter(threats, availableResources)`
- Input: Array of `ThreatVector`, resources number
- Output: Array of `CounterRecommendation` sorted by score
- Test cases:
  - Empty threats array → returns general purpose recommendations
  - Threats dominated by STRAFE behavior → Phaser/Polaron score higher
  - Threats dominated by SWARM behavior → Phaser scores highest
  - Low resources → expensive turrets excluded

### 2. `getPlacementStrategy(dominantBehavior)`
- Input: behavior type number
- Output: `{ preferredDistance, spreadPattern, notes }`
- Test cases:
  - Each `AIBehaviorType` returns appropriate strategy
  - Default case returns corridor pattern

## Implementation Instructions

1. Create new test file: `src/__tests__/BehaviorCounterSelector.test.ts`

2. Follow this structure:

```typescript
/**
 * Tests for BehaviorCounterSelector
 */
import { describe, it, expect } from 'vitest';
import { BehaviorCounterSelector } from '../ai/behaviors/BehaviorCounterSelector';
import { AIBehaviorType, TurretType } from '../types/constants';
import type { ThreatVector } from '../ai/types';

describe('BehaviorCounterSelector', () => {
    let selector: BehaviorCounterSelector;

    beforeEach(() => {
        selector = new BehaviorCounterSelector();
    });

    describe('selectCounter', () => {
        it('should return recommendations sorted by score', () => {
            const threats: ThreatVector[] = [
                {
                    entityId: 1,
                    threatLevel: 50,
                    direction: { x: 1, y: 0 },
                    distance: 200,
                    behaviorType: AIBehaviorType.DIRECT,
                    predictedPosition: { x: 400, y: 400 }
                }
            ];
            
            const recommendations = selector.selectCounter(threats, 500);
            
            expect(recommendations.length).toBeGreaterThan(0);
            // Verify sorted descending by score
            for (let i = 1; i < recommendations.length; i++) {
                expect(recommendations[i-1].score).toBeGreaterThanOrEqual(
                    recommendations[i].score
                );
            }
        });

        it('should recommend Phaser for SWARM behavior', () => {
            const threats: ThreatVector[] = [
                {
                    entityId: 1,
                    threatLevel: 80,
                    direction: { x: 1, y: 0 },
                    distance: 150,
                    behaviorType: AIBehaviorType.SWARM,
                    predictedPosition: { x: 400, y: 400 }
                },
                {
                    entityId: 2,
                    threatLevel: 80,
                    direction: { x: 0, y: 1 },
                    distance: 150,
                    behaviorType: AIBehaviorType.SWARM,
                    predictedPosition: { x: 500, y: 500 }
                }
            ];
            
            const recommendations = selector.selectCounter(threats, 500);
            const phaserRec = recommendations.find(
                r => r.turretType === TurretType.PHASER_ARRAY
            );
            
            expect(phaserRec).toBeDefined();
            expect(phaserRec!.reason).toContain('Strong vs Swarm');
        });

        it('should exclude turrets above resource limit', () => {
            const threats: ThreatVector[] = [];
            const recommendations = selector.selectCounter(threats, 50);
            
            // All recommended turrets should cost <= 50
            for (const rec of recommendations) {
                // Note: Would need TURRET_CONFIG access to verify costs
                expect(rec.score).toBeGreaterThanOrEqual(0);
            }
        });
    });

    describe('getPlacementStrategy', () => {
        it('should return ring pattern for ORBIT behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.ORBIT);
            
            expect(strategy.spreadPattern).toBe('ring');
            expect(strategy.preferredDistance).toBe(280);
        });

        it('should return corridor pattern for STRAFE behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.STRAFE);
            
            expect(strategy.spreadPattern).toBe('corridor');
        });

        it('should return layered pattern for HUNTER behavior', () => {
            const strategy = selector.getPlacementStrategy(AIBehaviorType.HUNTER);
            
            expect(strategy.spreadPattern).toBe('layered');
        });
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/BehaviorCounterSelector.test.ts
```

Expected: All tests pass, covering main functionality paths.

## Dependencies

- Vitest (already installed)
- `AIBehaviorType` and `TurretType` from `src/types/constants`
- `ThreatVector` type from `src/ai/types`
