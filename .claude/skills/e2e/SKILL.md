---
name: e2e
description: Write, debug, or update Playwright E2E tests for the game
user-invocable: true
allowed-tools: Bash, Read, Edit, Write, Grep, Glob
argument-hint: "[test-name or 'debug' or 'update-baselines']"
---

Work with Playwright E2E tests for this canvas game. The argument ($ARGUMENTS) determines the action:

- **No argument or test name**: Write a new E2E test or fix an existing one
- **`debug`**: Diagnose why E2E tests are failing
- **`update-baselines`**: Regenerate visual screenshot baselines

## Architecture

```
e2e/
  playwright.config.ts        # Config: Chromium, 1920x1080, webServer on :3000
  fixtures/game.fixture.ts    # GameHelpers: waitForState, waitForEnemies, freezeStarfield, etc.
  helpers/game-bridge.ts      # TypeScript types for window.__GAME__ bridge API
  tests/*.spec.ts             # Test files
  tests/*.spec.ts-snapshots/  # Visual baselines (platform-specific PNGs)

src/testing/e2eTestBridge.ts  # Bridge installed in dev mode — exposes game state on window.__GAME__
```

## Writing a New Test

1. Read `e2e/fixtures/game.fixture.ts` to understand available helpers
2. Read `e2e/helpers/game-bridge.ts` for the full bridge API
3. Read an existing test in `e2e/tests/` for patterns
4. Write test using the `test` and `expect` from `../fixtures/game.fixture`
5. Use `game.freezeStarfield()` before any screenshot
6. Use generous timeouts (10s+ for state waits, 20s+ for enemy spawns)
7. Add timing-chain comments when chaining waits: `// Xa + Yb = Z < test timeout`

### Key Patterns

```typescript
import { test, expect } from '../fixtures/game.fixture';

test('example', async ({ page, game }) => {
  await page.goto('/');
  await game.waitForGameReady();
  await game.startGame();
  await game.waitForState('PLAYING');

  // Use bridge for game manipulation (prefer over raw clicks)
  await page.evaluate(() => window.__GAME__.toggleGodMode());
  await page.evaluate(() => window.__GAME__.setResources(5000));
  await page.evaluate(() => window.__GAME__.placeTurret(1, 960, 540));

  // Wait for game events
  await page.waitForFunction(
    () => window.__GAME__.getEventsByType('ENEMY_KILLED').length > 0,
    { timeout: 45000 }
  );
});
```

### If You Need New Bridge Methods
1. Add to `src/testing/e2eTestBridge.ts` (the `window.__GAME__` object)
2. Add type to `e2e/helpers/game-bridge.ts` (`GameBridge` interface)
3. Add helper to `e2e/fixtures/game.fixture.ts` (`GameHelpers` interface + implementation)

## Debugging Failures

1. Run `pnpm run e2e:headed` to watch in browser
2. Check `e2e/test-results/` for failure screenshots
3. Common causes:
   - **Timeout**: Increase wait timeout or check if game state transition is broken
   - **Visual diff**: Starfield not frozen, or baselines stale — run `pnpm run e2e:update`
   - **Platform mismatch**: Visual baselines are `*-chromium-darwin.png` — CI generates `*-chromium-linux.png`. Visual tests skip on CI
   - **Turret placement miss**: Enemies spawn from random edges — use cardinal positions around (960, 540) with high-range turrets (torpedo type 1)

## Updating Visual Baselines

```bash
pnpm run e2e:update           # Regenerate all baselines
pnpm run e2e:update -- --grep visual  # Only visual tests
pnpm run e2e                  # Verify baselines match
```

After updating, run `pnpm run e2e` at least 2-3 times to confirm repeatability.

## Turret Types Quick Reference

| Type | Name    | Range | Damage | Notes                    |
|------|---------|-------|--------|--------------------------|
| 0    | Phaser  | 200px | 10     | Short range, low damage  |
| 1    | Torpedo | 350px | 60     | Best for E2E tests       |
| 2    | Beam    | 250px | 30     | Continuous damage         |

## Game States

`MENU` → `PLAYING` → `PAUSED` / `GAME_OVER`

KM center is at world coordinates (960, 540) on a 1920x1080 canvas.
