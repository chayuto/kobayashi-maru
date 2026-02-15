# UI Panels (Basic Info) Tests

**Date:** 2026-02-15
**Type:** Test

## Summary

Created comprehensive test suite for five UI panel components:
ScorePanel, ResourcePanel, WavePanel, StatusPanel, and TurretCountPanel.

## Changes

### New File
- `src/__tests__/uiPanels.test.ts` - 67 tests across 5 describe blocks

### Test Coverage by Panel

| Panel | Tests | Areas Covered |
|-------|-------|---------------|
| ScorePanel | 11 | creation, init idempotency, time formatting (zero-pad), kills display, position/scale, dimensions, destroy |
| ResourcePanel | 13 | creation, init idempotency, number formatting (raw/K/M), show/hide visibility, position/scale, dimensions, destroy |
| WavePanel | 17 | creation, init idempotency, wave text, state uppercase, enemy count, state-color mapping (idle/spawning/active/complete/unknown fallback), show/hide, position/scale, dimensions, destroy |
| StatusPanel | 14 | creation, init idempotency, health/shield percentage, zero-max edge cases, show/hide, position/scale, dimensions, destroy |
| TurretCountPanel | 10 | creation, init idempotency, count display, zero count, position/scale, dimensions, destroy |

### Key Patterns
- Uses shared `mockPixi` helper for PixiJS mocking
- Verifies panels do not update before `init()` is called
- Verifies `init()` is idempotent (no double-add to parent)
- Tests formatted output values (time MM:SS, number K/M suffixes, percentages)
- Tests visibility toggling via `show()`/`hide()`
- Tests `destroy()` cleans up and resets initialized flag

## Validation
- `npm test -- uiPanels`: 67/67 passed
- `npm run test` (full suite): 1207/1207 passed, 78 test files
