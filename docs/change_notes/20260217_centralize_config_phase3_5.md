# Centralize Configuration (Phases 3-5)

**Date:** 2026-02-17
**Type:** Refactoring
**Status:** Complete

## Summary

Continued the configuration centralization effort (Phases 3-5), extracting magic numbers and hardcoded values from systems, managers, renderers, and UI components into dedicated config files. This makes the game easier to tune and maintains a single source of truth for all parameters.

## Phase 3: Ability, Achievement, Quality, Input Configs

### New Config Files
- `src/config/ability.config.ts` — Enemy ability thresholds, particle effects, faction colors
- `src/config/achievement.config.ts` — Kill milestones, wave milestones, combo/survival thresholds
- `src/config/quality.config.ts` — Quality presets (HIGH/MEDIUM/LOW), hardware detection, frame budgets
- `src/config/input.config.ts` — Gesture detection thresholds (swipe, pan, pinch)

### Modified Consumers
- `src/systems/abilitySystem.ts` — Uses ABILITY_CONFIG for all ability parameters
- `src/systems/combatSystem.ts` — Uses COMBAT_CONFIG for audio volumes
- `src/systems/statusEffectSystem.ts` — Uses COMBAT_CONFIG for status effect params
- `src/core/GestureManager.ts` — Uses INPUT_CONFIG for gesture thresholds
- `src/core/PerformanceMonitor.ts` — Uses QUALITY_CONFIG for frame budgets
- `src/core/QualityManager.ts` — Uses QUALITY_CONFIG for presets and hardware detection
- `src/game/AchievementManager.ts` — Uses ACHIEVEMENT_CONFIG for all thresholds
- `src/game/wave/EnemySpawner.ts` — Uses WAVE_CONFIG for spawn timing
- `src/game/wave/VariantApplier.ts` — Uses WAVE_CONFIG for elite chance
- `src/config/combat.config.ts` — Extended with STATUS_EFFECTS and AUDIO_VOLUMES
- `src/config/wave.config.ts` — Extended with SPEED_SCALING and ELITE_CHANCE

## Phase 4: Rendering Visual Constants

### Config Additions
- `COMBAT_CONFIG.BEAM.COLORS` — Beam colors by turret type (phaser, disruptor, etc.)
- `RENDERING_CONFIG.BEAM_RENDERING` — Beam layer widths/alphas, impact effect sizes, charge params
- `RENDERING_CONFIG.HEALTH_BAR` — Bar dimensions (32x4), Y offset, health threshold colors
- `RENDERING_CONFIG.STARFIELD` extensions — Tile size, star layer configs, nebula/star color palettes
- `RENDERING_CONFIG.DAMAGE_NUMBERS` extensions — Font family, stroke width/color

### Modified Consumers
- `src/rendering/BeamRenderer.ts` — All beam colors and rendering params from config
- `src/rendering/HealthBarRenderer.ts` — Dimensions, colors, thresholds from config
- `src/rendering/DamageNumberRenderer.ts` — Stroke styling from config
- `src/rendering/Starfield.ts` — Tile size, layer configs, color palettes from config

## Phase 5: UI Layout Magic Numbers

### Config Additions
- `UI_CONFIG.MESSAGE_LOG` — Max messages, fade duration, line height, spacing, bottom offset
- `UI_CONFIG.RESPONSIVE` — Mobile/tablet breakpoints and scale factors
- `UI_CONFIG.PAUSE_OVERLAY` — Background alpha, title/button positions, button dimensions, z-index
- `UI_CONFIG.LEFT_COLUMN` — Mute button height, resource height offset

### Modified Consumers
- `src/ui/HUDManager.ts` — All panel dimensions reference UI_CONFIG.PANELS.*
- `src/ui/HUDLayoutManager.ts` — Left column heights from UI_CONFIG.PANELS.*
- `src/ui/MessageLog.ts` — All display params from UI_CONFIG.MESSAGE_LOG
- `src/ui/ResponsiveUIManager.ts` — Breakpoints from UI_CONFIG.RESPONSIVE
- `src/ui/PauseOverlay.ts` — Layout from UI_CONFIG.PAUSE_OVERLAY
- `src/ui/TurretMenu.ts` — Font sizes from UI_CONFIG.FONTS.SIZE_*

## Stats

- **46 files changed**, 873 insertions, 369 deletions
- **6 new config files** created across all phases
- **All 2,516 tests passing**
- **Zero lint warnings**
- **Build successful**

## Verification

```
pnpm run lint   ✓
pnpm run test   ✓ (2,516 tests, 113 files)
pnpm run build  ✓
```
