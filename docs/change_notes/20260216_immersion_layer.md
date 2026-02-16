# Visual Immersion Layer — Tech Debt + Quick Wins + Alert System

**Date:** 2026-02-16
**Branch:** `feels-good`

## Summary

Implemented the "visual immersion layer" on top of the existing game juice features. This includes 3 tech debt fixes, 4 visual quick wins, and a 3-part alert status system.

## Phase 1: Tech Debt (3 items)

### TD1: Replace `setTimeout` in damageSystem with deferred spawn queue
- **Files:** `src/systems/damageSystem.ts`, `src/core/Game.ts`, `src/__tests__/factionExplosions.test.ts`, `src/__tests__/damageSystem.test.ts`
- Added `DeferredSpawn[]` queue processed each frame with deltaTime
- Boss death delayed particles (metal debris, smoke plume) now use frame-driven queue instead of `setTimeout`
- System registration changed to `requiresDelta: true`
- All tests updated to pass deltaTime parameter

### TD2: Replace `requestAnimationFrame` in ComboPanel with `update()` method
- **Files:** `src/ui/panels/ComboPanel.ts`, `src/ui/HUDManager.ts`, `src/__tests__/ComboPanelJuice.test.ts`
- Removed rAF-driven `animatePopup()` loop
- Added polled `update()` method using `performance.now()` (matches WaveAnnouncement pattern)
- ComboPanel added to HUDManager for `update()` calls each frame
- Animation now pauses correctly when game is paused

### TD3: Filter DAMAGE_DEALT events to significant hits only
- **Files:** `src/systems/combatSystem.ts`
- Added significance filter before emitting `DAMAGE_DEALT`:
  - damage >= CRITICAL_THRESHOLD (50)
  - shield absorbed
  - enemy rank >= 1 (elite/boss)
- Reduces visual noise from frequent low-damage hits

## Phase 2: Visual Quick Wins (4 items)

### V5: Faction-colored explosions and shockwaves
- **Files:** `src/systems/damageSystem.ts`, `src/__tests__/factionExplosions.test.ts`
- Added `getFactionExplosionColor(factionId)` helper using `FACTION_COLORS`
- Boss and elite shockwaves now use faction-specific colors instead of hardcoded `0xFFAA00`/`0xFF6600`
- Fallback to `0xFF6600` for unknown factions

### V7: Perlin noise screen shake
- **Files:** `src/rendering/ScreenShake.ts`, `src/config/rendering.config.ts`
- Implemented minimal 2D simplex noise (~80 lines, zero dependencies)
- Replaced `Math.random()` offsets with `simplexNoise2D(elapsed * freq, 0)` for smooth cinematic shake
- Added `NOISE_FREQUENCY: 8` config parameter
- Deterministic permutation table (seeded) for reproducible behavior

### V1: Hit flash on enemies
- **Files (new):** `src/rendering/HitFlashManager.ts`, `src/__tests__/HitFlashManager.test.ts`
- **Files (modified):** `src/rendering/spriteManager.ts`, `src/core/bootstrap/GameBootstrap.ts`, `src/core/services/ServiceContainer.ts`, `src/core/managers/RenderManager.ts`, `src/config/rendering.config.ts`
- Enabled `color: true` on enemy ParticleContainers (KLINGON, ROMULAN, BORG, THOLIAN, SPECIES_8472)
- Non-enemy containers (turrets, projectiles) keep `color: false` for performance
- Added `setTint()` method to SpriteManager
- HitFlashManager subscribes to `DAMAGE_DEALT`, sets white tint for 80ms then resets
- Config: `HIT_FLASH: { DURATION: 0.08, COLOR: 0xFFFFFF }`

### V3: Hit stop (freeze frame) on boss kills
- **Files:** `src/core/loop/GameLoopManager.ts`, `src/core/Game.ts`, `src/config/rendering.config.ts`
- Added `hitStop(frames)` method to GameLoopManager
- During hit stop: gameplay and physics skip, render/UI continue (particles animate, effects decay)
- Boss kill: 4 frames (~67ms), Elite kill: 2 frames (~33ms)
- Uses `Math.max(current, frames)` to prevent stacking
- Config: `HIT_STOP: { BOSS_KILL_FRAMES: 4, ELITE_KILL_FRAMES: 2 }`

## Phase 3: Alert Status System (3 items)

### Alert Types & Config
- **Files:** `src/types/events.ts`, `src/config/ui.config.ts`
- Added `AlertLevel` enum: `NORMAL`, `CAUTION`, `CRITICAL`
- Added `ALERT_LEVEL_CHANGED` event type with `AlertLevelChangedPayload`
- Config: hull thresholds (20%/50%), colors (green/amber/red), pulse speed, banner timing

### AlertStatusManager
- **Files (new):** `src/game/AlertStatusManager.ts`, `src/__tests__/AlertStatusManager.test.ts`
- **Files (modified):** `src/core/managers/GameplayManager.ts`
- Evaluates hull percent + boss wave active state each frame
- CRITICAL: hull <= 20%, CAUTION: hull <= 50% or boss wave, NORMAL: default
- Emits `ALERT_LEVEL_CHANGED` only on transitions (not every frame)
- `alertLevel` added to `GameplaySnapshot` for UI data flow

### Alert Status UI
- **Files (new):** `src/ui/overlays/AlertStatusOverlay.ts`, `src/__tests__/AlertStatusOverlay.test.ts`
- **Files (modified):** `src/ui/panels/StatusPanel.ts`, `src/ui/HUDManager.ts`
- **StatusPanel**: Border color changes on alert level (green → amber → red). CRITICAL state pulses alpha via `Math.sin()`
- **AlertStatusOverlay**: "RED ALERT" / "YELLOW ALERT" banner with FADE_IN → HOLD → FADE_OUT animation (same pattern as WaveAnnouncement)
- Both integrated into HUDManager lifecycle

## New Files (5)
- `src/rendering/HitFlashManager.ts`
- `src/game/AlertStatusManager.ts`
- `src/ui/overlays/AlertStatusOverlay.ts`
- `src/__tests__/HitFlashManager.test.ts`
- `src/__tests__/AlertStatusOverlay.test.ts`

## Validation
- **Lint:** 0 errors
- **Tests:** 104 files, 2300 tests — all pass
- **Build:** TypeScript + Vite clean
