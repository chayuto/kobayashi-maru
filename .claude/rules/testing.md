---
paths:
  - "src/__tests__/**"
  - "e2e/**"
---

# Testing Rules

## Unit Tests (Vitest)
- Framework: Vitest with jsdom environment
- Pattern: Arrange-Act-Assert with descriptive `it('should [outcome] when [condition]')`
- Create bitECS world in `beforeEach`, clean up after each test
- Mock PixiJS objects (Container, Graphics, Text) — never import real pixi in tests
- For ECS tests: use `addEntity(world)` + set component values directly
- Run single file for fast feedback: `npm test -- <filename>`
- All new/changed code must have corresponding tests

## E2E Tests (Playwright)
- Framework: Playwright with Chromium
- Test files live in `e2e/tests/` (separate from unit tests in `src/__tests__/`)
- Use the custom game fixture from `e2e/fixtures/game.fixture.ts` for state helpers
- Interact with game via test bridge (`window.__GAME__`) not raw coordinate guessing
- Visual regression: use `toHaveScreenshot()` with tolerant thresholds (5% diff ratio)
- When changing UI coordinates/layout, update E2E tests that reference those positions
- E2E tests are separate and non-blocking — `pnpm run e2e` is not part of `pnpm run test`

### Flakiness Prevention
- **Freeze animations** before screenshots: call `game.freezeStarfield()` after `waitForGameReady()` — the starfield scrolls even when paused
- **Visual baselines are platform-specific** (darwin vs linux PNGs differ). Visual tests skip on CI via `test.skip(!!process.env.CI)`. Regenerate locally with `pnpm run e2e:update`
- **Use generous timeouts** for CI (SwiftShader is ~5x slower than local GPU): `waitForState` default 10s, `waitForEnemies` default 20s
- **Cover all spawn directions** when testing combat: place turrets at cardinal positions around KM center (960, 540) — enemies spawn from random edges
- **Prefer high-damage turrets** in tests (torpedo type 1, 350px range, 60 dmg) over phasers (type 0, 200px range, 10 dmg) — faster kills = less waiting = less flakiness
- **Avoid unnecessary state transitions** in visual tests (e.g., resume→pause dance adds non-determinism). Go to target state directly
- **Add timing-chain comments** when tests chain multiple waits: `// 20s enemies + 45s kills = 65s < 90s test timeout`

### Extending the Test Bridge
When adding new game features that need E2E testing:
1. Add method to `src/testing/e2eTestBridge.ts` (the `window.__GAME__` object)
2. Add type to `e2e/helpers/game-bridge.ts` (the `GameBridge` interface)
3. Add helper to `e2e/fixtures/game.fixture.ts` (the `GameHelpers` interface + implementation)
