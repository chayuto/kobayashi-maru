# Hull Damage Overlay (Red Vignette)

**Date:** 2026-02-16
**Type:** New Feature
**Status:** Complete

## Summary

Added a red vignette overlay that intensifies as the Kobayashi Maru's hull decreases, providing visual feedback of damage state. The overlay starts appearing at 30% hull, increases in intensity as hull drops, and pulses at critical hull levels (below 20%).

## Changes

### New Files
- `src/rendering/HullDamageOverlay.ts` -- Red vignette overlay class that draws border rectangles around screen edges
- `src/__tests__/HullDamageOverlay.test.ts` -- 16 tests covering visibility, intensity scaling, pulsing, drawing, and cleanup

### Modified Files
- `src/config/rendering.config.ts` -- Added `HULL_DAMAGE_OVERLAY` config section with threshold, intensity, pulse, and color settings
- `src/core/services/ServiceContainer.ts` -- Added `hullDamageOverlay` to ServiceRegistry interface
- `src/core/bootstrap/GameBootstrap.ts` -- Registered `hullDamageOverlay` service in rendering services
- `src/core/managers/RenderManager.ts` -- Added overlay update in `updateEffects()` and lazy init in `init()`
- `src/core/managers/GameplayManager.ts` -- Wired hull percent updates from `evaluateAlertStatus()` to overlay

## Configuration

All values in `RENDERING_CONFIG.HULL_DAMAGE_OVERLAY`:
- `ENABLE_THRESHOLD: 0.30` -- Start showing at 30% hull
- `MAX_INTENSITY: 0.4` -- Maximum vignette alpha
- `PULSE_SPEED: 2.0` -- Pulse speed multiplier at critical hull
- `CRITICAL_THRESHOLD: 0.20` -- Below this, overlay pulses
- `TINT_COLOR: 0xFF0000` -- Red tint
- `BORDER_WIDTH: 100` -- Border width in pixels

## Validation

- `npm run lint` -- Passes
- `npm run test` -- 2377 tests pass (107 files), including 16 new tests
- `npm run build` -- TypeScript check + Vite build succeeds
