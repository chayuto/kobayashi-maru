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
- Visual regression: use `toHaveScreenshot()` with tolerant thresholds (2% diff ratio)
- When changing UI coordinates/layout, update E2E tests that reference those positions
- E2E tests are separate and non-blocking — `pnpm run e2e` is not part of `pnpm run test`
