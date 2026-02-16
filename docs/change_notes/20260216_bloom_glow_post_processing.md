# Bloom/Glow Post-Processing Tuning

**Date:** 2026-02-16

## Summary

Added centralized bloom configuration and enhanced the GlowManager with intensity control and config-driven enable/disable behavior. Tuned glow presets for sharper weapon beams and more defined shield outlines while keeping explosions maximally glowy.

## Changes

### Config (`src/config/rendering.config.ts`)
- Added `BLOOM` section with `ENABLED: true` and `INTENSITY: 0.7` settings
- Centralizes bloom toggle and intensity into the config system

### GlowManager (`src/rendering/filters/GlowManager.ts`)
- Imports `RENDERING_CONFIG` for config-driven behavior
- `init()` now checks `RENDERING_CONFIG.BLOOM.ENABLED` and disables filters if false
- Added `setIntensity(value: number)` method that adjusts all blur filter strengths and brightness proportionally (clamped 0-1)
- Tuned GLOW_PRESETS:
  - `weapons`: blur 10 -> 6, quality 5 -> 4 (less blurry beams)
  - `shields`: blur 8 -> 5 (more defined shield outlines)
  - `explosions`: unchanged (blur 15, max glow)

### GameBootstrap (`src/core/bootstrap/GameBootstrap.ts`)
- Imports `RENDERING_CONFIG` from config barrel
- After applying glow presets, checks `RENDERING_CONFIG.BLOOM.ENABLED` and calls `glowManager.setEnabled(false)` if disabled

### Tests (`src/__tests__/bloomEffect.test.ts`)
- 20 new tests covering:
  - GlowManager init creates all layers
  - applyGlow sets filters on container
  - setEnabled(false) removes filters from all layers
  - setEnabled(true) restores filters
  - setIntensity adjusts blur filter strengths proportionally
  - setIntensity clamps to 0-1 range
  - BLOOM config values exist and are valid
  - GLOW_PRESETS tuning values verified

## Validation
- All 2377 tests pass (107 test files)
- ESLint passes on changed files
- TypeScript compilation passes for changed files
