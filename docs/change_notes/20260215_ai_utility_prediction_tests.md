# AI Utility & Prediction Tests

**Date:** 2026-02-15
**Type:** Test Coverage Expansion (Batch 3)

## Summary

Created comprehensive test file `src/__tests__/aiUtility.test.ts` covering four AI utility and prediction modules with 96 tests total.

## Source Files Tested

| File | Tests |
|------|-------|
| `src/ai/utility/ScoringCurves.ts` | 27 tests |
| `src/ai/utility/DecisionInertia.ts` | 17 tests |
| `src/ai/utility/ActionBucketing.ts` | 14 tests |
| `src/ai/prediction/WavePredictor.ts` | 38 tests |

## Test Coverage Details

### ScoringCurves (27 tests)
- Linear curve: boundary values, midpoint, custom min/max
- Quadratic curve: boundary values, comparison with linear, squared behavior
- Exponential curve: boundary values, steeper growth comparison
- Logistic curve: midpoint, saturation, steepness parameter
- Step curve: below/at/above threshold, custom threshold
- Inversion: all curve types, complementary sum
- Clamping: values below min and above max
- PRESETS: distanceValue, coverageGap, waveTiming

### DecisionInertia (17 tests)
- Constructor: default config, partial config merging
- applyInertia: no current action, bonus to matching type, expiry, just-before-expiry
- shouldSwitch: no current action, expired action, below threshold, above threshold, at threshold
- recordAction: storage, overwrite
- reset: clear action, behavior after reset

### ActionBucketing (14 tests)
- calculateBucketWeights: SURVIVAL activation/deactivation at 50% health, DEFENSE based on threat/coverage, ECONOMY early game bonus and threat penalty, EXPANSION enable/disable conditions, weight normalization
- classifyAction: SELL_TURRET as SURVIVAL, UPGRADE_TURRET as DEFENSE, PLACE_TURRET near/far center
- prioritizeActions: winning bucket selection, priority sorting, empty input

### WavePredictor (38 tests)
- Early game predictions (waves 1-3): factions, behaviors, threat level
- Early-mid game (waves 4-7): mixed factions, STRAFE behavior
- Mid game (waves 8-12): Tholians, medium threat, ORBIT behavior
- Late-mid game (waves 13-18): Borg, SWARM, high threat
- Late game (waves 19+): Species 8472, HUNTER behavior
- Boss waves: every 5th wave detection, threat level, faction additions by tier
- Recommended turrets: counter mapping, deduplication
- shouldSaveForBoss: proximity checks, resource thresholds
- getPredictionSummary: format, faction names, unknown factions

## Validation

- `npm test -- aiUtility`: 96/96 passed
- `npm run test`: All tests pass (47 pre-existing failures in texturesAndSprites.test.ts and turretUpgradeVisuals.test.ts are unrelated PixiJS mocking issues)
- `npm run lint`: Passes with no errors
