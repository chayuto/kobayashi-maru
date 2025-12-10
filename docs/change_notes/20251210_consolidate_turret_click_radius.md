# Consolidate Duplicate TURRET_CLICK_RADIUS Constant

**Date:** 2025-12-10  
**Author:** Chore AI Agent

## Summary
Consolidated duplicate `TURRET_CLICK_RADIUS = 32` constant from 2 files to use the existing centralized `UI_CONFIG.INTERACTION.TURRET_CLICK_RADIUS`.

## Changes

| File | Change |
|------|--------|
| [GameInputHandler.ts](file:///Users/chayut/repos/kobayashi-maru/src/core/GameInputHandler.ts) | Import config, use centralized constant |
| [InputRouter.ts](file:///Users/chayut/repos/kobayashi-maru/src/core/managers/InputRouter.ts) | Import config, use centralized constant |

## Verification

| Check | Result |
|-------|--------|
| `npm test` | ✅ 646 tests passed |
| `npm run lint` | ✅ Clean |

## Impact

- **Risk**: Low — Same value, different source
- **Maintainability**: Improved — Single source of truth for turret click radius
