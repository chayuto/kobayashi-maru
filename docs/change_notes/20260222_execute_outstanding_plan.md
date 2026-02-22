# Execute Outstanding Roadmap Items

**Date:** 2026-02-22
**Scope:** TD2, TD3, V6, G6 from the post-game-juice roadmap

---

## Summary

Implemented all four outstanding roadmap items in a single pass. All changes maintain backward compatibility with existing tests and add 100+ new test cases.

**Before:** 2540 tests | **After:** 2630 tests (+90)

---

## Phase 1: TD2/P3-P4 — Unify Animation Loops Into Game Ticker

### Problem
4 UI overlays and UIAnimator used `performance.now()` / `requestAnimationFrame`. Animations continued during pause.

### Changes

| File | Change |
|------|--------|
| `src/core/Game.ts` | Thread `dt` through `onUI` callback; pass `uiDeltaTime = 0` when paused |
| `src/core/managers/UIController.ts` | Add `deltaTime` param to `updateHUD()` |
| `src/ui/HUDManager.ts` | Pass `deltaTime` to overlay updates; call `UIAnimator.tick(deltaTime)` |
| `src/ui/overlays/WaveAnnouncement.ts` | Replace `performance.now()` with accumulated `elapsedTime` |
| `src/ui/overlays/AlertStatusOverlay.ts` | Same pattern |
| `src/ui/overlays/TutorialOverlay.ts` | Same pattern |
| `src/ui/panels/ComboPanel.ts` | Replace `popupStartTime` with `popupElapsed` |
| `src/ui/animation/UIAnimator.ts` | Full rewrite: rAF → static animation queue with `tick(deltaTime)` |

### Result
- All UI animations freeze when game is paused
- Zero `requestAnimationFrame` or `performance.now()` calls in animation code
- Visual behavior identical during normal gameplay

---

## Phase 2: TD3 — Switch DamageNumberRenderer to BitmapText

### Problem
`DamageNumberRenderer` used `Text` (canvas texture per string), causing texture upload overhead.

### Changes

| File | Change |
|------|--------|
| `src/rendering/DamageNumberRenderer.ts` | Import `BitmapText`/`BitmapFont`; `BitmapFont.install()` in `init()`; pool uses `BitmapText`; color via `tint` instead of `style.fill` |

### Result
- Single bitmap font atlas shared across all damage numbers
- No per-string canvas re-renders

---

## Phase 3: V6 — Chromatic Aberration at Low Hull

### Problem
No diegetic visual indicator of critical hull status beyond the health bar.

### Changes

| File | Change |
|------|--------|
| `src/config/rendering.config.ts` | Add `CHROMATIC_ABERRATION` config (threshold 50%, max offset 4px, critical 25%) |
| `src/rendering/ChromaticAberrationEffect.ts` | New: custom GLSL filter, stage-level, with pulsing at critical |
| `src/core/services/ServiceContainer.ts` | Register `chromaticAberration` service |
| `src/core/bootstrap/GameBootstrap.ts` | Register factory |
| `src/core/managers/RenderManager.ts` | Lazy init + update in `updateEffects()` |
| `src/core/managers/GameplayManager.ts` | `setHullPercent()` alongside hull damage overlay |

### Result
- RGB channel split appears below 50% hull, intensifies toward 0%
- Pulsing effect below 25% hull (critical)
- Effect only on game world, not HUD

---

## Phase 4: G6 — Prestige / Meta-Progression

### Problem
No persistence between runs. Every game starts identically.

### Changes

**Config & Core:**

| File | Change |
|------|--------|
| `src/config/prestige.config.ts` | New: storage key, reward formula, 5 upgrade definitions |
| `src/config/index.ts` | Export prestige config |
| `src/game/PrestigeManager.ts` | New: localStorage persistence, reward calculation, purchase validation, bonus lookup |
| `src/core/services/ServiceContainer.ts` | Register `prestigeManager` service |
| `src/core/bootstrap/GameBootstrap.ts` | Register prestige manager; apply resource boost and turret discount |

**Bonus Application:**

| Upgrade | File | How Applied |
|---------|------|-------------|
| Resource Boost | `GameBootstrap.ts` | Multiply `INITIAL_RESOURCES` by `(1 + bonus)` |
| Hull Integrity | `GameplayManager.ts` | Multiply KM `Health.max`/`current` after spawn |
| Turret Discount | `PlacementManager.ts` | `costModifier` callback applied to turret costs |
| Score Multiplier | `GameOverScreen.ts` | `calculateScore()` accepts optional bonus param |
| Starting Turret | `GameplayManager.ts` | Create free torpedo turret on spawn if unlocked |

**ResourceManager:**

| File | Change |
|------|--------|
| `src/game/resourceManager.ts` | Store `initialAmount` in constructor for correct `reset()` behavior |

**Award & UI:**

| File | Change |
|------|--------|
| `src/core/managers/GameplayManager.ts` | Award commendations in `triggerGameOver()` |
| `src/core/Game.ts` | Pass `commendationsEarned` through callback chain |
| `src/core/managers/UIController.ts` | Pass `commendationsEarned` to game over screen |
| `src/ui/GameOverScreen.ts` | Prestige panel: commendations earned/total, 5 upgrade rows with click-to-purchase |

### Upgrades

| ID | Name | Max Level | Costs | Bonus per Level |
|----|------|-----------|-------|-----------------|
| `resource_boost` | Supply Requisition | 5 | 50-800 | +10% to +50% starting resources |
| `hull_integrity` | Reinforced Hull | 5 | 75-1200 | +10% to +50% hull |
| `turret_discount` | Fleet Surplus | 5 | 60-960 | -5% to -25% turret cost |
| `score_multiplier` | Tactical Acumen | 5 | 100-1600 | +10% to +50% score |
| `starting_turret` | Advance Guard | 1 | 500 | Free torpedo turret at start |

### Reward Formula
`commendations = floor(10 + waves*10 + kills*0.5 + seconds*0.1)`

### Result
- Commendations awarded on game over, persisted in localStorage
- 5 purchasable upgrades on game over screen
- Bonuses correctly modify starting game state
- Graceful handling of corrupted/missing storage data
- Full reset capability

---

## Test Coverage

| Test File | Tests | Description |
|-----------|-------|-------------|
| `PrestigeManager.test.ts` | 34 | Initial state, rewards, purchases, bonuses, persistence, corruption, reset |
| `prestige.config.test.ts` | 52 | Config validation: costs match maxLevel, positive values, unique IDs |
| `GameOverScreen.test.ts` | +2 | Score multiplier bonus, prestige integration |
| `ChromaticAberrationEffect.test.ts` | 13 | Threshold, intensity, pulsing, destroy |
| Various existing test updates | — | deltaTime params, UIAnimator tick-based, BitmapText mocks |

---

## Verification

```
pnpm run lint   ✓ (0 errors)
pnpm run test   ✓ (2630 tests, 116 files)
pnpm run build  ✓ (932 modules)
```
