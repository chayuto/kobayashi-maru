# E2E Testing Framework Setup

**Date:** 2026-02-16
**Type:** Infrastructure / Testing
**Branch:** feels-good

## Summary

Added end-to-end testing using Playwright with Chromium. The project had 2,224 unit tests but zero E2E tests — all rendering was mocked, meaning visual regressions, canvas interaction bugs, and full gameplay flow breakages went undetected.

## What Changed

### New Files (11)
- `e2e/playwright.config.ts` — Playwright config (Chromium, SwiftShader, port 3000)
- `e2e/tsconfig.json` — Separate TypeScript config for E2E tests
- `e2e/fixtures/game.fixture.ts` — Custom test fixture with game state helpers
- `e2e/helpers/game-bridge.ts` — TypeScript types for `window.__GAME__` API
- `e2e/tests/smoke.spec.ts` — Game loads, canvas renders, no errors
- `e2e/tests/main-menu.spec.ts` — Menu to gameplay transition
- `e2e/tests/gameplay.spec.ts` — Wave start, turret placement, enemy kills
- `e2e/tests/game-over.spec.ts` — Game over and restart flow
- `e2e/tests/visual.spec.ts` — Screenshot regression (menu, HUD, pause)
- `e2e/tests/ai-autoplay.spec.ts` — AI plays game without crashing
- `src/testing/e2eTestBridge.ts` — Dev-only bridge exposing game state on `window.__GAME__`

### Modified Files (8)
- `package.json` — Added `@playwright/test` devDep + 4 e2e scripts
- `src/main.ts` — Conditional test bridge import in dev mode (3 lines)
- `src/core/bootstrap/GameBootstrap.ts` — `preserveDrawingBuffer` in dev, WebGL fallback for E2E
- `.github/workflows/ci.yml` — Added non-blocking e2e-tests job
- `AGENTS.md` — Added E2E testing section + e2e commands
- `CLAUDE.md` — Added e2e command
- `.claude/rules/testing.md` — Added E2E testing rules
- `.claude/rules/task-workflow.md` — Added E2E to validation checklist
- `.gitignore` — Added Playwright artifacts
- `eslint.config.js` — Added e2e/ to ignores

## Design Decisions

1. **Test bridge over coordinate-only testing** — `window.__GAME__.getSnapshot()` is deterministic; coordinate clicks are fragile
2. **Dev-only bridge** — Uses `import.meta.env.DEV` + dynamic `import()`, tree-shaken from production
3. **WebGL fallback for E2E** — WebGPU doesn't work in headless SwiftShader; `__E2E_MODE__` flag switches to WebGL
4. **Chromium only** — Canvas rendering is identical across browsers at the PixiJS level
5. **Non-blocking CI** — E2E job uses `continue-on-error: true`, doesn't gate PRs
6. **AI auto-play as extended smoke test** — Exercises full stack naturally with minimal test code

## Running

```bash
pnpm run e2e           # Headless
pnpm run e2e:headed    # Visible browser
pnpm run e2e:ui        # Interactive Playwright UI
pnpm run e2e:update    # Update screenshot baselines
```
