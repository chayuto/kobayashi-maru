# Core Utilities Tests

**Date:** 2026-02-15
**Type:** Test coverage expansion (Batch 8)

## Summary

Added `src/__tests__/coreUtilities.test.ts` with 40 tests covering four core utility modules:

- **ScreenShake** (9 tests): Initial state, shake activation, intensity decay, duration expiry, re-shake reset, accumulated elapsed time
- **QualityManager** (9 tests): Initialization from detected tier, preset values for HIGH/MEDIUM/LOW, tier transitions via `setTier`, `checkPerformance` safety
- **GameCheatManager** (13 tests): God mode set/toggle/query, slow mode set/toggle/query, speed multiplier, full reset
- **TouchInputManager** (9 tests): Initialization, event listener registration, TOUCH_START/MOVE/END event emission, empty touch list handling, canvas-null safety, destroy

## Files Changed

| File | Change |
|------|--------|
| `src/__tests__/coreUtilities.test.ts` | New test file (40 tests) |

## Validation

- `npm test -- coreUtilities` -- 40/40 passed
- `npm run test` -- no regressions introduced (pre-existing failures in `texturesAndSprites.test.ts` unrelated to this change)
