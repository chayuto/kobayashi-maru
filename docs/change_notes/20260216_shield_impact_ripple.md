# Shield Impact Ripple Effect

**Date:** 2026-02-16

## Summary

Added localized arc-based impact ripple effects on shields when they absorb damage. Ripples appear at the point of impact, expand outward, and fade over a configurable duration.

## Changes

### Config (`src/config/rendering.config.ts`)
- Added `SHIELD_RIPPLE` section with configurable duration (0.3s), radius growth (20px), arc angle (60 degrees), start alpha (0.8), and line width (3).

### ShieldRenderer (`src/rendering/ShieldRenderer.ts`)
- Added `ShieldRipple` interface to represent active ripple state (entityId, angle, age, color).
- Added `activeRipples` array to track all active ripple animations.
- Added `addRipple(entityId, hitX, hitY)` method that calculates the impact angle from entity center to hit point and creates a new ripple entry with the appropriate shield color.
- Modified `update()` to draw active ripples as expanding arcs that fade over time, aging and removing expired ripples each frame.
- Modified `flashShield()` to accept optional `hitX`/`hitY` parameters; when provided, also creates a ripple at the impact location.
- Modified `init()` to subscribe to `DAMAGE_DEALT` events via EventBus; when `isShield` is true, triggers `addRipple()`.
- Modified `destroy()` to clear the `activeRipples` array.

### RenderManager (`src/core/managers/RenderManager.ts`)
- Updated `render()` to accept and pass `deltaTime` parameter to the shield renderer, replacing the previously hardcoded value of `0`.

### Game (`src/core/Game.ts`)
- Updated the render callback to pass `dt` to `renderManager.render()` so shield ripples animate correctly.

### Tests (`src/__tests__/ShieldRipple.test.ts`)
- 25 new tests covering:
  - Ripple creation via `addRipple()`
  - Ripple aging over deltaTime
  - Ripple removal after duration expires
  - Ripple alpha decrease over time
  - Arc angle calculation for hits from all directions (right, left, above, below, diagonal)
  - Shield color matching based on shield health percentage (blue/yellow/red)
  - `flashShield` with and without hit position
  - Update with no ripples (no errors)
  - Multiple simultaneous ripples
  - Cleanup on destroy

## Validation

- `pnpm run lint` passes
- `pnpm run test` passes (2377 tests, 107 test files)
- `pnpm run build` has pre-existing TS errors in unrelated files (HullDamageOverlay.test.ts, HullDamageOverlay.ts, combatSystem.ts) -- no new errors introduced
