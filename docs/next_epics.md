# Next Epics — Kobayashi Maru

**Date:** 2026-02-22
**Status:** Proposal — pick one or more to execute next

---

## Current State

The game is **feature-complete** as an endless tower defense. Everything from the original post-juice roadmap has been delivered:

| Category | What's Done |
|----------|-------------|
| **Turrets** | 6 types, 5 upgrade paths each, special abilities per turret |
| **Enemies** | 5 factions, 8 special abilities, elite/boss variants |
| **Combat** | Damage types with faction resistances, status effects (burn/slow/drain) |
| **Visuals** | Damage numbers, hit flash, hit stop, screen shake (Perlin), bloom, shield ripple, chromatic aberration, faction explosions |
| **Audio** | Weapon-specific SFX, concurrency limiting, adaptive 4-layer music system |
| **UI** | Main menu, tutorial, HUD with alert status, wave banners, combo panel, technobabble log, prestige panel |
| **Meta** | Prestige system with 5 upgrades, achievements, localStorage persistence |
| **Infra** | 2,630+ unit tests, E2E Playwright suite, centralized config (16 files) |

The question is: **what comes next?**

Below are 6 independent epic options. They can be pursued individually or combined. Each includes scope, key deliverables, estimated complexity, and trade-offs.

---

## Epic A: Roguelite Run Structure

**Theme:** Every run is different. No two games play the same.
**Inspiration:** Slay the Spire, Rogue Tower, Isle of Arrows

### Concept

Transform the linear wave-after-wave loop into a branching run with choices between waves. After each wave, the player picks a path node — a shop, a random event, a modifier, or a relic — before the next combat wave.

### Key Deliverables

1. **Run Map** — Branching node graph (3-4 choices per fork) displayed between waves
   - Node types: Combat Wave, Shop, Event, Elite Wave, Boss
   - Visual: Vertical scrolling star chart (Star Trek-themed sector map)
2. **Relic/Artifact System** — Passive items collected during the run that break rules
   - Examples: "Torpedo explosions apply burn", "Turrets gain +10% range per adjacent turret", "Enemies drop 2x resources but move 30% faster"
   - 20-30 relics at launch, increasing combinatorial depth
3. **Run Modifiers / Mutators** — Global modifiers chosen at run start or offered as event rewards
   - Examples: "Only torpedo turrets available", "All enemies cloaked", "Double resources but no upgrades"
4. **Starter Loadout Drafting** — Pick 1 of 3 randomized starting configurations (turret set + relic + modifier)
5. **Run Summary Screen** — Post-run breakdown: path taken, relics found, stats, commendations earned

### Complexity

**High** (3-5 sessions). New scene management, node graph UI, relic system with modifier hooks across turret/enemy/wave configs.

### Pros
- Massive replayability — solves the "optimal build" problem
- Natural content pipeline (add new relics/events over time)
- Deepens prestige system (unlock new relics/loadouts between runs)

### Cons
- Largest scope of all options
- Requires careful balancing of relic combinations
- May dilute the "Star Trek bridge officer under siege" narrative

---

## Epic B: Commander Abilities (Active Hero Powers)

**Theme:** The player IS the captain. Active decisions during combat, not just placement.
**Inspiration:** Kingdom Rush heroes, Thronefall, Star Trek bridge officer fantasy

### Concept

Add 3-5 activatable captain abilities with cooldowns. The player can intervene during waves, not just watch. This addresses the "tab out during easy waves" problem and reinforces the Star Trek command fantasy.

### Key Deliverables

1. **Ability Bar UI** — Bottom-center bar with 3-5 ability slots, cooldown radials, hotkeys (1-5)
2. **Starter Abilities** (5):
   - **Photon Barrage** — Click to fire a burst of torpedoes at target area (high damage, 30s cooldown)
   - **Emergency Shields** — Grant all turrets temporary shields for 5s (45s cooldown)
   - **Tractor Beam** — Click enemy to slow/hold it in place for 4s (20s cooldown)
   - **Sensor Sweep** — Reveal all cloaked enemies + grant turrets +25% range for 8s (40s cooldown)
   - **Red Alert** — Double all turret fire rates for 6s (60s cooldown)
3. **Commander Profiles** — Unlockable via prestige, each with a different ability loadout
   - Tactical Officer (damage-focused), Engineering Officer (defense-focused), Science Officer (control-focused)
4. **Ability Upgrade Tree** — Spend commendations to improve abilities between runs

### Complexity

**Medium** (2-3 sessions). New UI bar, ability system with cooldowns, targeting for click-based abilities, integration with existing combat/turret systems.

### Pros
- Directly addresses mid-wave engagement gap
- Strong Star Trek thematic fit ("Make it so!")
- Synergizes with prestige system (unlock commanders)
- Relatively contained scope

### Cons
- Balancing active abilities against passive turret damage
- Risk of abilities being "I win" buttons — needs careful cooldown tuning
- Adds complexity for new players (mitigated by tutorial system)

---

## Epic C: Turret Synergy & Placement Puzzle

**Theme:** WHERE you place matters as much as WHAT you place.
**Inspiration:** BTD6 village buffs, Isle of Arrows adjacency, Genshin elemental reactions

### Concept

Add adjacency bonuses and elemental combo reactions that reward thoughtful turret placement over random scattering. Create a spatial puzzle layer on top of the existing combat system.

### Key Deliverables

1. **Adjacency Bonuses** — Turrets within a radius buff each other
   - Same-type cluster: +5% fire rate per adjacent matching turret (max +15%)
   - Mixed-type synergies: Phaser + Disruptor adjacent = "Overcharge" (+10% damage both)
   - Visual: Glowing link lines between synergized turrets
2. **Elemental Combo Reactions** — Status effect interactions
   - Burn + Slow = "Thermal Shock" (instant burst damage)
   - Drain + Burn = "Overload" (AoE explosion on target)
   - Slow + Drain = "System Failure" (target disabled for 2s)
   - Visual: Combo text popup (reuse damage number system)
3. **Support Structure** — New non-combat placement: "Power Node"
   - Buffs all turrets in radius (+range, +damage, or +fire rate depending on upgrade path)
   - Creates placement optimization puzzle: place nodes for maximum turret coverage
4. **Synergy Score HUD** — Shows current synergy bonus total, encourages experimentation

### Complexity

**Medium** (2-3 sessions). Adjacency detection system, combo trigger logic in status effect system, new entity type (power node), UI indicators.

### Pros
- Deepens strategic thinking without adding new input modes
- Encourages experimentation ("what happens if I put these together?")
- Builds on existing status effect and damage type systems
- Creates "aha moments" that drive retention

### Cons
- Adjacency + combo balancing is complex math
- Visual clutter risk (link lines + combo popups + existing damage numbers)
- May overwhelm new players before tutorial teaches it

---

## Epic D: Challenge Modes & Leaderboards

**Theme:** Competitive replayability. Give me a reason to come back tomorrow.
**Inspiration:** BTD6 daily challenges, Vampire Survivors achievements, speedrun culture

### Key Deliverables

1. **Daily Challenge** — Fixed-seed run with predetermined modifiers, same for all players
   - Seeded RNG: identical wave compositions, spawn positions, timings
   - 1-3 mutators (e.g., "phasers only", "double enemy speed", "no upgrades")
   - Single attempt per day, score submitted to leaderboard
2. **Endless Survival Mode** — Separate mode focused purely on wave count
   - No game over from hull damage — instead, lives system (lose 1 life per enemy reaching KM)
   - Escalating difficulty curve is the content
   - Leaderboard: highest wave reached
3. **Faction Challenge** — Locked turret challenges
   - "Federation Standard" — phasers + torpedoes only
   - "Exotic Arsenal" — tetryon + plasma + polaron only
   - Bronze/Silver/Gold medals based on waves survived
4. **Score Attack** — Maximize score in exactly 10 waves
   - Combo multiplier optimization, resource efficiency scoring
   - Global leaderboard with anti-cheat hash
5. **Leaderboard System** — localStorage for local, optional server for global
   - Daily/weekly/all-time views
   - Replay ghost (store key actions for playback)

### Complexity

**Medium-High** (2-4 sessions). Seeded RNG system, new game mode bootstrapping, leaderboard UI, optional backend for global boards.

### Pros
- Directly drives daily retention ("come back for today's challenge")
- Low marginal cost per new challenge (just config)
- Competitive angle makes game shareable/streamable
- Extends lifespan without new features

### Cons
- Seeded RNG needs careful implementation (deterministic game loop)
- Global leaderboard requires a server (even a simple one)
- Anti-cheat in a client-side game is hard
- Daily challenge generation needs automation or manual curation

---

## Epic E: Accessibility & Platform Polish

**Theme:** Make the game playable by everyone, everywhere.
**Inspiration:** WCAG 2.1, Xbox Accessibility Guidelines, PWA best practices

### Key Deliverables

1. **Keyboard-Only Play** — Full game playable without mouse
   - Tab through turret slots, arrow keys to move placement cursor
   - Number keys for turret selection (already partially exists via ability hotkeys)
   - Enter to place, Escape to cancel
2. **Color-Blind Modes** — 3 alternative palettes
   - Deuteranopia (red-green), Protanopia (red), Tritanopia (blue-yellow)
   - Shader-based palette remapping on game container
   - Apply to: faction colors, status effect indicators, alert system
3. **Screen Reader Announcements** — ARIA live region for key events
   - Wave start/end, enemy counts, resource changes, turret placement confirmation
   - Game over summary narration
4. **Mobile Touch Polish** — Improve existing mobile controls
   - Pinch-to-zoom on game area
   - Long-press for turret info tooltip
   - Drag-to-place turrets (currently tap-based)
   - Responsive HUD scaling for small screens
5. **PWA / Offline Support** — Service worker for offline play
   - Install prompt, home screen icon
   - Cache all assets (game is fully client-side)
   - Offline leaderboard sync when reconnected

### Complexity

**Medium** (2-3 sessions). Keyboard navigation system, color filter shaders, ARIA integration, service worker setup, mobile gesture handlers.

### Pros
- Morally important — games should be accessible
- PWA increases discoverability and retention (installable, works offline)
- Mobile polish unlocks a huge audience
- Low risk — purely additive, no gameplay changes

### Cons
- Accessibility testing requires specific tooling and expertise
- Color-blind modes need design review for every visual element
- Screen reader support in canvas games is fundamentally limited
- Mobile testing across devices is time-intensive

---

## Epic F: Replay System & AI Simulation

**Theme:** Watch, learn, and let the data balance the game.
**Inspiration:** StarCraft replays, OpenAI Five, Monte Carlo game testing

### Key Deliverables

1. **Replay Recording** — Capture all player inputs (turret placements, upgrades, ability uses) per frame
   - Compact format: action log + initial seed, not full state snapshots
   - Stored in localStorage or downloadable as file
2. **Replay Playback** — Re-simulate game from action log
   - Playback controls: play, pause, speed (1x/2x/4x), scrub timeline
   - Ghost overlay: show turret placement timing on timeline
3. **AI Autoplay Improvements** — Enhance existing AI system
   - Multiple AI profiles: Aggressive, Defensive, Balanced, Greedy
   - AI vs AI simulation mode (headless, 100x speed)
   - Output: heatmaps of turret placement, DPS curves, wave failure points
4. **Balance Dashboard** — Dev tool showing simulation results
   - Turret win-rate per faction matchup
   - Resource efficiency curves
   - Difficulty spike identification
5. **Share Replay** — Export replay as URL or file for others to watch

### Complexity

**High** (3-5 sessions). Deterministic replay requires verifying game loop determinism, replay UI needs timeline scrubbing, AI simulation needs headless mode optimization.

### Pros
- Replay sharing is highly viral ("watch my crazy run!")
- AI simulation enables data-driven balancing
- Deterministic replay proves game loop correctness
- Community engagement through shared strategies

### Cons
- Deterministic replay is fragile — any floating-point deviation breaks it
- Replay files grow with game length
- AI simulation is a dev tool, not directly player-facing
- High engineering effort for features few players may use

---

## Comparison Matrix

| Epic | Complexity | Player Impact | Replayability | Thematic Fit | Risk |
|------|-----------|---------------|---------------|-------------|------|
| **A: Roguelite Runs** | High | Very High | Very High | Medium | High (balance) |
| **B: Commander Abilities** | Medium | High | Medium | Very High | Low |
| **C: Turret Synergy** | Medium | High | High | High | Medium (balance) |
| **D: Challenge Modes** | Medium-High | High | Very High | High | Medium (infra) |
| **E: Accessibility** | Medium | Medium | Low | N/A | Low |
| **F: Replay & AI Sim** | High | Medium | Medium | Medium | High (determinism) |

---

## Recommended Combinations

### Option 1: "The Next Game" — B + C
Commander abilities + turret synergy. Deepens the core gameplay loop without restructuring the game. Medium scope, high impact. The captain finally has something to DO during waves, and turret placement becomes a real puzzle.

### Option 2: "The Long Game" — A + D
Roguelite runs + challenge modes. Transforms Kobayashi Maru from a single-session game into a multi-session experience. Largest scope but highest retention ceiling. Prestige system becomes the bridge between runs.

### Option 3: "Ship It" — B + E
Commander abilities + accessibility/PWA. Makes the game more engaging AND more accessible. Practical combo that improves the existing experience without massive structural changes. Best path to sharing the game publicly.

### Option 4: "Full Send" — A + B + D
Roguelite + commanders + challenges. The maximalist approach. Transforms the game into a genre-leading title but requires significant investment. Best if this is a long-term project.
