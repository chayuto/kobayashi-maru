# Next Critical Steps — Post Game Juice Audit

**Date:** 2026-02-16
**Context:** Deep validation of `feels-good` branch against 10 research documents
**Baseline:** 6 juice features implemented (damage numbers, rank explosions, screen flash, wave banner, combo celebration, UI micro-animations)

---

## Fixes Applied This Session

1. Removed dead code: `BOSS_EXPLOSION_SEQUENCE` and `FACTION_EXPLOSION_COLORS` (unused exports in `effectPresets.ts`)
2. Replaced hardcoded `1920x1080` in `ScreenFlash.ts` with `GAME_CONFIG.WORLD_WIDTH/HEIGHT`
3. Removed duplicate EventBus mock in `WaveAnnouncement.test.ts`

---

## Technical Debt From This Branch

These are architectural issues introduced by the juice implementation that should be fixed before further work:

| # | Issue | File | Fix | Effort |
|---|---|---|---|---|
| **TD1** | `setTimeout` for delayed boss explosion stages — breaks determinism and game pause | `damageSystem.ts:89,97` | Replace with frame-counted delay queue in game loop | Low |
| **TD2** | `requestAnimationFrame` in `ComboPanel.animatePopup()` — runs outside game ticker, won't pause | `ComboPanel.ts:138-154` | Move to game loop `update()` with elapsed time tracking | Low |
| **TD3** | `Text` objects for damage numbers — expensive at scale | `DamageNumberRenderer.ts` | Switch to `BitmapText` (research explicitly recommends this) | Low |
| **TD4** | Damage numbers fire for ALL hits — will flood at 500+ enemies | `combatSystem.ts:368` | Filter: only emit for crits (50+ dmg), boss/elite hits, and KM damage | Low |

---

## Prioritized Next Steps

### Tier 1: Quick Wins (Low effort, High impact)

**V1. Hit Flash (White Shader) on Enemy Damage**
- Source: KM Report §3.3 — "For the swarm, rely on visual feedback (flashing white shaders on hit)"
- Approach: Add a `ColorMatrixFilter` to enemy sprites on hit, reset after 2 frames
- Complements damage numbers — use flash for normals, numbers only for crits/bosses
- Touches: `combatSystem.ts`, `spriteManager.ts`

**V3. Hit Stop / Freeze Frame on Boss Kill**
- Source: KM Report §3.3, Game Improvement §4.1
- Approach: `GameLoopManager.pause(frames: 8)` — freeze ECS systems for 5-10 frames, keep particle/render updates running
- Touches: `GameLoopManager.ts`, `damageSystem.ts`

**V5. Faction-Specific Explosion Colors**
- Source: Star Trek Design §2.1-2.7
- Approach: Tint particle effects based on `Faction.id[eid]` at death — Klingon=red, Romulan=green, Borg=bright green
- Touches: `damageSystem.ts`, `effectPresets.ts`

**V7. Perlin Noise Screen Shake**
- Source: KM Report §3.3 — "Perlin noise feels heavy, simulating the inertia of a massive starship"
- Approach: Replace random offset in `ScreenShake.ts` with simplex/perlin noise sampling
- Touches: `ScreenShake.ts` only

### Tier 2: High Impact Features (Medium effort)

**U1. Alert Status System (Green → Yellow → Red)**
- Source: Gameplay Extension §4.2, Star Trek Design §5.3
- The single most impactful unimplemented feature for Star Trek immersion
- Approach:
  - Define `AlertLevel` enum (GREEN, YELLOW, RED, INTRUDER)
  - `AlertStatusManager` tracks game state → derives alert level
  - On level change: shift LCARS UI color palette, play klaxon, adjust music layer
  - GREEN = build phase, YELLOW = wave started, RED = hull < 30%
- Touches: New `AlertStatusManager`, `HUDManager`, `ui/styles.ts`, audio system

**V2. Bloom/Glow Post-Processing**
- Source: Sci-Fi Swarm Sim §5.2, KM Report §6.2
- Approach: PixiJS v8 `BlurFilter` on a bright-pass extracted render target, additively blended
- Apply to: weapon beams, shield impacts, explosions, engine trails
- Touches: `RenderManager.ts`, new `BloomFilter.ts`

**V4. Shield Impact Ripple (SDF Shader)**
- Source: KM Report §6.2 — localized ripple/honeycomb at impact point
- Approach: Custom shader on shield sprite that receives impact angle + time uniform
- Touches: New `ShieldImpactShader.ts`, `ShieldRenderer.ts`

**A1. Weapon-Specific Sound Effects**
- Source: Star Trek Design §4.1 — "Phasers: *Vwoooop*, Disruptors: *Kshhh-tew*"
- Audio is "half the experience" and is the largest gap in current implementation
- Approach: Different `SoundType` per turret weapon, with fallback
- Touches: `combatSystem.ts`, `AudioManager.ts`, audio assets

**A2. Audio Concurrency Limiting**
- Source: KM Report §5.1
- Approach: Max N simultaneous sounds per category, newest replaces oldest
- Touches: `AudioManager.ts`

### Tier 3: Strategic Features (High effort, High reward)

**G1. Status Effects (Burn / Slow / Drain)**
- Source: Gameplay Extension §1, Star Trek Design §4.1-4.2
- The most requested gameplay depth feature across all docs
- Approach: `StatusEffect` component + `statusEffectSystem` processing
- Touches: Components, new system, turret configs, visual indicators

**G2. Damage Type System (Rock-Paper-Scissors)**
- Source: Game Improvement §3.1, Sci-Fi Swarm §4.3, BTD6 analysis
- Forces tower variety — energy vs kinetic vs exotic, with resistances per faction
- Touches: Combat config, turret configs, enemy configs, `combatSystem.ts`

**A3. Adaptive Music Layering**
- Source: KM Report §5.2 — idle/combat/horde/critical intensity layers
- Approach: 4 audio stems that crossfade based on combat intensity metric
- Touches: New `MusicManager.ts`, `AudioManager.ts`, music assets

**U3. Main Menu / Pause Menu**
- Source: Gameplay Extension §4.5-4.6
- Basic UX necessity — start screen, settings, pause/resume
- Touches: New `MenuSystem`, scene management

**G6. Prestige / Meta-Progression**
- Source: KM Report §6.1, Sci-Fi Swarm §7.2
- Long-term retention — permanent upgrades across runs
- Touches: New `PrestigeManager`, `StorageService`, UI panels

### Tier 4: Polish & Infrastructure

**U2. Technobabble Generator Log**
- Source: Gameplay Extension §4.3, Star Trek Design §5.2
- Scrolling diagnostic text: "Rerouting auxiliary power to forward deflector array... Complete"
- Low effort, high flavor

**U4. Tutorial System**
- Source: Gameplay Extension §4.8
- Player onboarding — progressive disclosure of mechanics
- Medium effort, critical for new players

**V6. Chromatic Aberration at Low Hull**
- Source: KM Report §6.2
- RGB split filter increases as hull drops — diegetic tension indicator
- Touches: `RenderManager.ts`, PixiJS filters

**P3-P4. Unify animation loops into game ticker**
- Move ComboPanel popup and WaveAnnouncement from `performance.now()` / `requestAnimationFrame` to game loop `deltaTime`
- Ensures animations pause when game pauses

---

## Recommended Next Sprint

Focus on **Tier 1 + Tech Debt** (estimated 1-2 sessions):

1. Fix TD1-TD4 (tech debt from this branch)
2. V1: Hit flash on enemy damage
3. V3: Hit stop on boss kill
4. V5: Faction explosion colors
5. V7: Perlin noise shake

This completes the "visual juice" story before moving to audio (Tier 2) and gameplay depth (Tier 3).

---

## Research Coverage Score

| Document | Coverage by `feels-good` | Key Gaps |
|---|---|---|
| KM Game Improvement Report | 20% (6/~30 recommendations) | Audio, shield SDF, alert system, hit flash, bloom |
| Game Improvement Proposals | 15% (juice principles started) | Audio design, damage types, status effects |
| Star Trek Game Design | 10% (wave banners, basic explosions) | Alert system, faction visuals, audio, LCARS |
| Gameplay Extension Research | 10% (wave announcement, UI reactivity) | Status effects, weapons, alert system, menus |
| Deep Research Summary | 15% (game feel gap partially addressed) | Audio, AI visualization, strategic depth |
| Sci-Fi Swarm Sim | 5% (particle effects) | Bloom, instanced rendering, formation AI |
| PixiJS v8 Performance | 5% (pooling pattern used) | BitmapText, ParticleContainer, bloom filter |
| bitECS Best Practices | 0% (no ECS changes) | Archetypes, query optimization, SIMD |
| AI Autoplay Strategies | 0% (no AI changes) | Debug viz, learning, strategic planning |
| TD Tech Stack | 5% (EventBus pattern used) | Deterministic loop, spatial indexing |
