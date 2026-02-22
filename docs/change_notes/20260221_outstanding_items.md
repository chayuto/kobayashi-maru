# Outstanding Roadmap Items

**Date:** 2026-02-21
**Context:** Status audit of remaining items from the post-game-juice roadmap (`20260216_next_critical_steps.md`)

---

## TD2 — Unify Animation Loops Into Game Ticker

**Priority:** Low effort, Medium impact
**Source:** Next Critical Steps TD2, P3-P4

### Problem

Several UI overlay animations bypass the game loop and use raw browser timing APIs. This means they continue running when the game is paused, breaking the expected pause behavior.

### Current State

| File | Issue |
|------|-------|
| `src/ui/panels/ComboPanel.ts` (~line 148) | Uses `performance.now()` for popup animation timing |
| `src/ui/overlays/WaveAnnouncement.ts` | Uses `performance.now()` for banner slide/fade |
| `src/ui/overlays/AlertStatusOverlay.ts` | Uses `performance.now()` for alert flash/pulse |
| `src/ui/overlays/TutorialOverlay.ts` | Uses `performance.now()` for step transitions |
| `src/ui/UIAnimator.ts` (~lines 62-242) | Uses `requestAnimationFrame` directly for slide/pulse/fade animations |

### Fix

Replace `performance.now()` and `requestAnimationFrame` calls with elapsed-time tracking driven by the game loop's `deltaTime`. Each overlay already has an `update()` method called from `HUDManager` — accumulate `deltaTime` there instead of sampling wall-clock time.

`UIAnimator` needs a larger rework: convert its rAF-based animation queue into a tickable update driven by `GameLoopManager`.

### Acceptance Criteria

- All overlay animations freeze when the game is paused
- No `requestAnimationFrame` calls remain in UI animation code
- No `performance.now()` calls used for animation timing in overlays
- Existing visual behavior is identical during normal gameplay

---

## TD3 — Switch DamageNumberRenderer to BitmapText

**Priority:** Low effort, Medium impact
**Source:** Next Critical Steps TD3, PixiJS v8 Performance research

### Problem

`src/rendering/DamageNumberRenderer.ts` creates pooled `pixi.js` `Text` objects (line 66: `new Text({...})`). Standard `Text` generates a canvas texture per string, which is expensive at scale. With many simultaneous damage numbers (e.g., 500+ enemies in late waves), this becomes a performance bottleneck — texture uploads, canvas allocations, and GC pressure.

### Current State

- `DamageNumberRenderer.ts` imports `Text` from `pixi.js` (line 10)
- Pool of `Text` objects created in constructor
- Each damage number sets `.text` on a pooled `Text` instance, triggering a canvas re-render

### Fix

Switch to `BitmapText` with a pre-generated bitmap font atlas. PixiJS v8 supports `BitmapFont.install()` to create a font from a style at startup. Then replace `Text` with `BitmapText` in the pool — same API surface, but renders from a shared texture atlas instead of per-string canvas.

Steps:
1. In `DamageNumberRenderer` constructor (or a setup method), call `BitmapFont.install()` with the current text style
2. Replace `new Text({...})` with `new BitmapText({...})` using the installed font name
3. Verify visual parity — font size, color, stroke should match

### Acceptance Criteria

- No `Text` imports or instances in `DamageNumberRenderer.ts`
- Bitmap font atlas created once at startup
- Damage numbers look visually identical
- Measurable reduction in texture uploads during heavy combat (can verify via PixiJS devtools or frame profiling)

---

## V6 — Chromatic Aberration at Low Hull

**Priority:** Low effort, Medium impact
**Source:** Next Critical Steps V6, KM Report §6.2

### Problem

There is no diegetic visual indicator of critical hull status beyond the health bar number. The game lacks the visceral "your ship is falling apart" feeling at low hull.

### Design

Apply an RGB channel split (chromatic aberration) filter to the game stage that increases in intensity as hull health drops. This is a common game feel technique — the world literally looks broken when the ship is damaged.

- **Threshold:** Effect begins below 50% hull
- **Scaling:** Linear interpolation from 0 (50% hull) to max offset (0% hull)
- **Max offset:** ~3-5px RGB channel separation
- **Target:** Apply to the main game container (not HUD)

### Implementation

1. Create `src/rendering/ChromaticAberrationFilter.ts` — custom PixiJS filter or use the built-in `RGBSplitFilter` from `@pixi/filter-rgb-split` (check if available in PixiJS v8, otherwise a simple custom shader: sample R at offset, G at center, B at negative offset)
2. Wire into `RenderManager` — add/remove filter based on hull percentage
3. Subscribe to hull damage events or poll `Health.current[kmEntity]` each frame
4. Interpolate filter intensity: `intensity = Math.max(0, 1 - hullPercent / 0.5)`

### Acceptance Criteria

- No visual effect above 50% hull
- Subtle RGB split appears at ~40% hull, intensifies as hull drops
- Maximum aberration at 0% hull (before game over)
- Effect is removed/reset on game restart
- Filter only applies to game world, not HUD overlay

---

## G6 — Prestige / Meta-Progression

**Priority:** High effort, High impact
**Source:** Next Critical Steps G6, KM Report §6.1, Sci-Fi Swarm Sim §7.2

### Problem

The game currently has no persistence between runs. Every game starts identically, which reduces long-term retention. Players have no reason to replay beyond chasing a higher score.

### Design

A prestige system where players earn a meta-currency (e.g., "Starfleet Commendations") based on performance, then spend it on permanent upgrades that carry across runs.

### Key Components

1. **`PrestigeManager`** — Tracks lifetime stats, calculates commendation rewards per run
2. **`StorageService`** — `localStorage` persistence layer with versioned schema and migration support
3. **Prestige upgrade tree** — Permanent bonuses:
   - Starting resources bonus (+10/20/30%)
   - Hull integrity bonus (+5/10/15%)
   - Turret cost discount (-5/10/15%)
   - Unlock starting turret loadouts
   - Score multiplier bonus
4. **UI: Prestige Panel** — Shown on game over / main menu, displays earned commendations and available upgrades
5. **Integration** — `GameplayManager` reads prestige bonuses at game start and applies them to initial state

### Open Questions

- Should prestige reset be possible (for challenge runs)?
- How many prestige tiers / how steep is the curve?
- Should some upgrades be mutually exclusive (build variety)?
- Does prestige affect leaderboard eligibility?

### Acceptance Criteria

- Stats persist in `localStorage` across browser sessions
- Commendations awarded proportionally to wave reached + score
- At least 5 purchasable prestige upgrades
- Prestige bonuses correctly modify starting game state
- UI displays prestige progress on game over screen
- Graceful handling of corrupted/missing storage data
