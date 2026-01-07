# Test Coverage Gaps Report

> **Generated**: 2024-12-31
> **Purpose**: Identify quick-win opportunities to increase line coverage before major refactoring

## Executive Summary

The codebase has **59 existing test files** with good coverage of core systems. After deep analysis, I identified **9 untested modules** that represent excellent "quick wins" for increasing line coverage:

1. Pure functions with deterministic behavior
2. Self-contained classes with minimal dependencies
3. Simple input/output transformations
4. Static utility methods

## Current Test Structure

| Directory | Test Files | Source Files | Coverage Status |
|-----------|------------|--------------|-----------------|
| `src/__tests__/` | 59 files | - | Central test location |
| `src/ai/` | 4+ covered | 31 files | **Gap identified** |
| `src/systems/` | 12+ covered | 17 files | Good coverage |
| `src/game/` | 8+ covered | 16 files | **Gap identified** |
| `src/core/` | 8+ covered | 22 files | Good coverage |

## Quick-Win Coverage Targets

### Priority 1: High Impact, Easy Implementation

These modules have **pure, testable functions** requiring minimal mocking:

| Module | Location | Lines | Difficulty | Task Document |
|--------|----------|-------|------------|---------------|
| `BehaviorCounterSelector` | `src/ai/behaviors/` | ~189 | ⭐ Easy | [task-01](./20260107_task-01-behavior-counter-selector-tests.md) |
| `AIMoodEngine` | `src/ai/humanization/` | ~347 | ⭐ Easy | [task-02](./20260107_task-02-ai-mood-engine-tests.md) |
| `ScoringCurves` (expand) | `src/ai/utility/` | ~148 | ⭐ Easy | [task-03](./20260107_task-03-scoring-curves-expand.md) |

### Priority 2: Medium Complexity

These require some mocking but have clear, testable interfaces:

| Module | Location | Lines | Difficulty | Task Document |
|--------|----------|-------|------------|---------------|
| `AchievementManager` | `src/game/` | ~264 | ⭐⭐ Medium | [task-04](./20260107_task-04-achievement-manager-tests.md) |
| `CoverageAnalyzer` | `src/ai/` | ~392 | ⭐⭐ Medium | [task-05](./20260107_task-05-coverage-analyzer-tests.md) |
| `ThreatAnalyzer` | `src/ai/` | ~200 | ⭐⭐ Medium | [task-06](./20260107_task-06-threat-analyzer-tests.md) |

### Priority 3: Requires More Setup

These need world/entity mocking but are still valuable:

| Module | Location | Lines | Difficulty | Task Document |
|--------|----------|-------|------------|---------------|
| `ActionPlanner` | `src/ai/` | ~400 | ⭐⭐⭐ Complex | [task-07](./20260107_task-07-action-planner-tests.md) |
| `ActionExecutor` | `src/ai/` | ~120 | ⭐⭐ Medium | [task-08](./20260107_task-08-action-executor-tests.md) |
| `ApproachCorridorAnalyzer` | `src/ai/spatial/` | ~150 | ⭐⭐ Medium | [task-09](./20260107_task-09-approach-corridor-tests.md) |

## Already Well-Tested Modules

The following modules have existing test coverage (found in `src/__tests__/`):

- ✅ `ScoringCurves`, `ActionBucketing`, `DecisionInertia` → `UtilityAI.test.ts`
- ✅ `AIHumanizer`, `SynergyDetector`, `WavePredictor`, `DynamicDifficultyAdjuster` → `AIExtensions.test.ts`
- ✅ `UpgradeManager` → `upgradeManager.test.ts`
- ✅ `PlacementManager` → `PlacementManager.test.ts`
- ✅ `InfluenceMap`, `FlowFieldAnalyzer`, `PathInterceptor` → individual test files
- ✅ All core systems (`damageSystem`, `combatSystem`, `movementSystem`, etc.)

## Test Pattern Examples

### Existing Pattern (from `UtilityAI.test.ts`)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ScoringCurves, CurveType } from '../ai/utility/ScoringCurves';

describe('ScoringCurves', () => {
    describe('score', () => {
        it('should return 0-1 for all curve types', () => {
            const types: CurveType[] = ['linear', 'quadratic', 'exponential', 'logistic', 'step'];
            for (const type of types) {
                for (let i = 0; i <= 10; i++) {
                    const score = ScoringCurves.score(i / 10, { type });
                    expect(score).toBeGreaterThanOrEqual(0);
                    expect(score).toBeLessThanOrEqual(1.0001);
                }
            }
        });
    });
});
```

### Mocking Pattern (from `PlacementManager.test.ts`)

```typescript
import { vi } from 'vitest';

vi.mock('../ecs/entityFactory', () => ({
    createTurret: vi.fn().mockReturnValue(1),
}));
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npx vitest run --coverage
```

## Estimated Coverage Impact

| Priority | Tasks | Est. Lines Covered | Time Est. |
|----------|-------|-------------------|-----------|
| P1 | 3 tasks | ~680 lines | 1-2 hours |
| P2 | 3 tasks | ~850 lines | 2-3 hours |
| P3 | 3 tasks | ~670 lines | 3-4 hours |
| **Total** | **9 tasks** | **~2,200 lines** | **6-9 hours** |

## Recommendations

1. **Start with P1 tasks** - They require minimal mocking and provide immediate wins
2. **Follow existing patterns** - Use `describe/it/expect` from Vitest
3. **Focus on line coverage** - Don't aim for 100% branch coverage, just hit main paths
4. **Test happy paths first** - Edge cases can come in later refactoring
