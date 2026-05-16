---
name: e2e
description: Write, debug, or update Playwright E2E tests for the game — including fast, frame-exact deterministic tests using seeded RNG and fixed-timestep stepping.
user-invocable: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
argument-hint: "[test-name or 'debug' or 'update-baselines']"
---

Work with Playwright E2E tests for this canvas game. The argument ($ARGUMENTS) determines the action:

- **No argument or test name**: Write a new E2E test or fix an existing one
- **`debug`**: Diagnose why E2E tests are failing
- **`update-baselines`**: Regenerate visual screenshot baselines

## Toolchain (keep current)

- **Node 24 LTS**, **pnpm 11**, **Playwright 1.59**, Vite 7, Vitest 4.
- `package.json` pins `packageManager` (pnpm@11.x) and `engines.node >=24`.
- If `node -v` is wrong in a shell: `source "$NVM_DIR/nvm.sh" && nvm use 24`.
- Playwright 1.57+ runs **Chrome for Testing**, not Chromium. If a browser is missing:
  `npx playwright install chrome-for-testing chromium-headless-shell`.
- Run E2E: `pnpm run e2e` (headless, CI mode) — see Commands below.

## Architecture

```
e2e/
  playwright.config.ts        # Config: Chromium, 1920x1080, webServer on :3000
  fixtures/game.fixture.ts    # GameHelpers: waitForState, stepFrames, seedRandom, etc.
  helpers/game-bridge.ts      # TypeScript types for window.__GAME__ bridge API
  tests/*.spec.ts             # Test files
  tests/*.spec.ts-snapshots/  # Visual baselines (platform-specific PNGs)

src/testing/e2eTestBridge.ts  # Bridge installed in dev mode — exposes game state on window.__GAME__
src/utils/gameplayRng.ts      # Seeded gameplay RNG — the seam that makes runs reproducible
```

## Two ways to write a test

### A. Deterministic (preferred for gameplay logic) — fast, frame-exact

Use `seedRandom()` + `startDeterministic()` + `stepFrames()`. The simulation
advances by a fixed number of fixed-delta frames, decoupled from the wall
clock, so **30 simulated seconds run in milliseconds** and produce the **same
result every run**. Assert on exact state — no `toBeGreaterThan`, no generous
timeouts. Reference: `e2e/tests/deterministic-gameplay.spec.ts`.

```typescript
import { test, expect } from '../fixtures/game.fixture';

test('seeded battle is reproducible', async ({ page, game }) => {
  async function run(seed: number) {
    await page.goto('/');
    await game.waitForGameReady();
    await game.seedRandom(seed);          // seed BEFORE startDeterministic
    await game.startDeterministic();      // starts game + freezes the wall-clock ticker
    await page.evaluate(() => {            // disable AI for byte-exact runs (see caveat)
      if (window.__GAME__.isAIEnabled()) window.__GAME__.toggleAI();
    });
    await game.waitForState('PLAYING');
    await page.evaluate(() => window.__GAME__.setResources(99999));
    await page.evaluate(() => window.__GAME__.placeTurret(1, 960, 340));
    await game.stepFrames(1800);          // advance exactly 1800 frames (30s @ 60fps)
    return game.getSnapshot();
  }
  expect(await run(424242)).toEqual(await run(424242));
});
```

**Rules for deterministic tests:**
- Call `seedRandom(seed)` *before* `startDeterministic()` — wave 1 spawns during start.
- Use `startDeterministic()`, not `startGame()` — it freezes the ticker so no
  variable number of real frames tick between async test steps.
- The sim only advances via `stepFrames(n)`. Setup calls (`setResources`,
  `placeTurret`, `freezeStarfield`) are safe between steps — the sim is frozen.
- **Caveat — the AI Commander.** Autoplay is ON by default and its economic
  micro-decisions carry residual nondeterminism. For *byte-exact* reproducibility
  disable it (`toggleAI()`). Core simulation (spawns, combat, kills, health,
  waves) is fully deterministic with AI off. Cover the AI path separately with
  loose-bound assertions.

### B. Wall-clock (for menu/UI flows that can't be stepped)

The classic approach — `startGame()`, then wait for real time. Needs generous
timeouts. Use only when deterministic stepping doesn't fit (e.g. testing the
real-time loop, input handling, or menu transitions).

```typescript
test('wave 1 spawns enemies', async ({ page, game }) => {
  await page.goto('/');
  await game.waitForGameReady();
  await game.startGame();
  await game.waitForState('PLAYING');
  await game.waitForEnemies(20000);       // SwiftShader on CI is ~5x slower
  expect((await game.getSnapshot()).activeEnemies).toBeGreaterThan(0);
});
```

## Writing a New Test — checklist

1. Read `e2e/fixtures/game.fixture.ts` for available helpers.
2. Read `e2e/helpers/game-bridge.ts` for the full bridge API.
3. Read `e2e/tests/deterministic-gameplay.spec.ts` (deterministic) or
   `e2e/tests/gameplay.spec.ts` (wall-clock) for patterns.
4. Prefer approach **A** for anything testing gameplay/simulation outcomes.
5. `import { test, expect } from '../fixtures/game.fixture'`.
6. `game.freezeStarfield()` before any screenshot.
7. For wall-clock waits: generous timeouts (10s+ state, 20s+ enemies) and add
   timing-chain comments: `// 20s enemies + 45s kills = 65s < 90s test timeout`.

## Bridge API (window.__GAME__)

Source of truth: `src/testing/e2eTestBridge.ts`. Key methods:

| Method | Purpose |
|---|---|
| `isReady()` | True once the game is initialized |
| `startGame()` | Start a game (wall-clock ticker runs) |
| `startDeterministic()` | Start a game with the ticker **frozen** — advance only via `stepFrames()` |
| `seedRandom(seed)` | Seed the gameplay RNG (mulberry32) — makes spawns/combat reproducible |
| `stepFrames(n, deltaMs?)` | Advance exactly `n` fixed-delta frames (default 1/60s) |
| `pause()` / `resume()` / `restart()` | Lifecycle |
| `getSnapshot()` | `{ state, wave, waveState, activeEnemies, resources, score, kmHealth, kmMaxHealth }` |
| `getEvents()` / `getEventsByType(t)` / `clearEvents()` | Captured event log |
| `getEntityCounts()` | `{ turrets, enemies }` |
| `setResources(n)` / `setKMHealth(n)` / `placeTurret(type,x,y)` | State manipulation |
| `toggleGodMode()` / `toggleAI()` / `isAIEnabled()` | Cheats / AI control |
| `freezeStarfield()` | Freeze the animated starfield before screenshots |

### If You Need New Bridge Methods
Keep all three layers in sync:
1. `src/testing/e2eTestBridge.ts` — the `window.__GAME__` object
2. `e2e/helpers/game-bridge.ts` — the `GameBridge` interface
3. `e2e/fixtures/game.fixture.ts` — the `GameHelpers` interface + implementation

## How determinism works (so you can extend it)

- `src/utils/gameplayRng.ts` — a seeded mulberry32 stream. Unseeded it falls
  back to `Math.random()`, so production behaviour is unchanged.
- Gameplay-affecting RNG (enemy spawns, speeds, variant rolls, ability rolls,
  status procs, AI humanization) calls `randomFloat()` from this module.
  Rendering/particle randomness deliberately stays on `Math.random()` so visual
  effects can never desync the simulation.
- `GameLoopManager.step()` runs the update phases with a fixed delta;
  `Game.stepFrames()` stops the wall-clock ticker and steps.
- **If you add new gameplay randomness, import `randomFloat` from `../utils`** —
  not `Math.random()` — or you reintroduce nondeterminism.

## Commands

```bash
pnpm run e2e            # Headless (CI mode) — default
pnpm run e2e:headed     # Watch in a visible browser
pnpm run e2e:ui         # Interactive Playwright UI
pnpm run e2e:update     # Regenerate visual baselines
# Single spec:
npx playwright test --config e2e/playwright.config.ts deterministic-gameplay
```

## Debugging Failures

1. `pnpm run e2e:headed` to watch in browser, or `npx playwright test ... --workers=1`.
2. Check `e2e/test-results/` for failure screenshots + traces.
3. Common causes:
   - **Nondeterministic deterministic test**: did you `seedRandom()` *before*
     `startDeterministic()`? Is the AI disabled? Did new code call
     `Math.random()` instead of `randomFloat()` in a gameplay path?
   - **Timeout** (wall-clock tests): increase wait or check state transition.
   - **Visual diff**: starfield not frozen, or baselines stale (`pnpm run e2e:update`).
   - **Platform mismatch**: baselines are `*-chromium-darwin.png`; CI is
     `*-chromium-linux.png`. Visual tests skip on CI.
   - **Turret placement miss**: enemies spawn from random edges — use cardinal
     positions around (960, 540) with torpedo turrets (type 1).

## Reference

| Turret | Type | Range | Damage | Notes |
|---|---|---|---|---|
| Phaser | 0 | 200px | 10 | Short range |
| Torpedo | 1 | 350px | 60 | Best for tests |
| Beam | 2 | 250px | 30 | Continuous |

Game states: `MENU` → `PLAYING` → `PAUSED` / `GAME_OVER`.
KM center is world (960, 540) on a 1920×1080 canvas.
