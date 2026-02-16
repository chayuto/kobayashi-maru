# E2E Testing Research Report for Kobayashi Maru

**Date:** 2026-02-16
**Scope:** Comprehensive research into E2E testing possibilities for a PixiJS 8 / bitECS / TypeScript canvas game

---

## Table of Contents

1. [The Core Challenge](#1-the-core-challenge)
2. [Current Project State](#2-current-project-state)
3. [Playwright: The Primary Candidate](#3-playwright-the-primary-candidate)
4. [Alternative Frameworks](#4-alternative-frameworks)
5. [Headless Rendering & CI/CD](#5-headless-rendering--cicd)
6. [Agentic Development Integration](#6-agentic-development-integration)
7. [Deterministic Game Testing](#7-deterministic-game-testing)
8. [Recommended Architecture](#8-recommended-architecture)
9. [Comparison Matrix](#9-comparison-matrix)
10. [Sources](#10-sources)

---

## 1. The Core Challenge

PixiJS renders the entire game into a **single `<canvas>` DOM element**. Unlike traditional web apps with buttons, forms, and divs, there are no DOM nodes for individual game objects (enemies, turrets, projectiles, UI panels). Every pixel is painted by the GPU.

This means:
- **No CSS selectors** for game elements
- **No ARIA roles** to query (unless explicitly added)
- **No text nodes** to search
- **No click targets** except raw canvas coordinates
- Standard E2E tools built for DOM-based UIs are fundamentally mismatched

The solutions fall into **four categories**:

| Strategy | Tests What | Relies On |
|----------|-----------|-----------|
| **Visual regression** (screenshot comparison) | Pixels look correct | Stable rendering across runs |
| **Game state bridge** (expose internals via `window`) | Logic is correct | Instrumenting game code |
| **Accessibility overlay** (PixiJS a11y module) | Interactive elements work | Adding a11y annotations |
| **Coordinate-based interaction** (click at x,y) | Input handling works | Known element positions |

The best approach combines all four.

---

## 2. Current Project State

### What Exists
- **2,224 unit tests** across 95 files using Vitest + jsdom
- PixiJS is always **fully mocked** in tests (`src/__tests__/helpers/mockPixi.ts`)
- One integration test: `turretUpgradePanel.integration.test.ts` (no real rendering)
- One orchestration test: `gameOrchestration.test.ts` (heavily mocked)
- **Zero E2E tests** -- no Playwright, Cypress, or browser-automation infrastructure

### Architecture Relevant to E2E
- **Entry point:** `src/main.ts` creates `Game('app')`, exports the `game` instance
- **HTML:** Single `<div id="app">` -- PixiJS appends canvas via `GameBootstrap.initializePixiJS()`
- **World size:** 1920x1080, scaled to viewport
- **Renderer:** WebGPU preference, WebGL fallback, via PixiJS 8 `Application`
- **All UI is canvas-rendered** -- HUD panels, menus, game over screen are PixiJS Containers/Graphics/Text, not DOM elements
- **No accessibility attributes** anywhere in the codebase
- **EventBus:** Singleton pub/sub with typed events (ENEMY_KILLED, WAVE_STARTED, GAME_OVER, etc.)
- **Game facade:** `Game.ts` exposes public getters for all managers (getWaveManager, getGameState, getScoreManager, getResourceManager)
- **Build:** Vite 7.3.1, dev server on port 3000

### Key Constraints
- TypeScript strict mode, zero `any`
- bitECS components are TypedArrays: `Position.x[eid]`, not objects
- Systems are pure functions in priority order
- `preserveDrawingBuffer` is NOT currently set (screenshots may capture blank canvas)

---

## 3. Playwright: The Primary Candidate

Playwright is the strongest choice for this project. Here's what it can and cannot do with canvas games.

### 3.1 Canvas Coordinate Interaction (Fully Supported)

```typescript
// Click at specific canvas coordinates
await page.click('canvas', { position: { x: 200, y: 350 } });

// Fine-grained mouse control
await page.mouse.click(200, 350);
await page.mouse.click(200, 350, { button: 'right' });

// Drag operations (e.g., turret placement)
await page.mouse.move(100, 100);
await page.mouse.down();
await page.mouse.move(300, 300, { steps: 10 }); // interpolated movement
await page.mouse.up();

// Keyboard (targets window/document, works normally)
await page.keyboard.press('Escape');  // pause
await page.keyboard.press('Space');   // start wave

// Get canvas bounds for coordinate math
const box = await page.locator('canvas').boundingBox();
await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
```

**Verdict:** Full mouse/keyboard interaction works. The challenge is *knowing where* to click, which requires either hardcoded coordinates, a test bridge, or the accessibility overlay.

### 3.2 Visual Regression Testing (Best-in-Class)

```typescript
test('main menu renders correctly', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.locator('canvas').waitFor({ timeout: 15000 });
  await page.waitForTimeout(2000); // let rendering stabilize
  await expect(page).toHaveScreenshot('main-menu.png');
});

test('wave 1 gameplay', async ({ page }) => {
  // Canvas-only screenshot
  const canvas = page.locator('canvas');
  await expect(canvas).toHaveScreenshot('wave-1.png', {
    maxDiffPixelRatio: 0.01,  // Allow 1% pixel difference
    threshold: 0.2,            // Per-pixel color tolerance
  });
});
```

**Configuration options:**
- `maxDiffPixels` -- absolute pixel count allowed to differ
- `maxDiffPixelRatio` -- percentage of pixels (better for varying viewports)
- `threshold` -- per-pixel color sensitivity (0=exact, 1=anything goes)
- `animations: 'disabled'` -- freeze CSS animations

**Baseline management:**
```bash
npx playwright test --update-snapshots  # generate/update baselines
```

Baselines are **platform-specific** (font rendering, anti-aliasing, GPU drivers differ). Solutions: Docker for consistency, or `snapshotPathTemplate` for per-platform baselines.

### 3.3 Clock API for Deterministic Game Frames (Breakthrough)

This is the key technique that makes canvas game testing viable:

```typescript
test('game state at exactly 10 seconds', async ({ page }) => {
  // Install fake timers BEFORE navigation
  // Replaces requestAnimationFrame, setTimeout, setInterval, Date
  await page.clock.install({ time: new Date('2024-01-01T00:00:00') });

  await page.goto('http://localhost:3000');

  // Advance game time by exactly 10 seconds
  await page.clock.runFor(10000);

  // Deterministic screenshot -- can be pixel-exact
  await expect(page).toHaveScreenshot('game-at-10s.png', {
    maxDiffPixels: 0,
  });
});

test('frame-by-frame progression', async ({ page }) => {
  await page.clock.install({ time: new Date('2024-01-01T00:00:00') });
  await page.goto('http://localhost:3000');

  // Step through 60 frames at ~60fps
  for (let i = 0; i < 60; i++) {
    await page.clock.runFor(16); // one frame
  }
  // Exactly 1 second of game time, deterministically
  await expect(page).toHaveScreenshot('after-1-second.png');
});
```

The Clock API replaces `requestAnimationFrame` with a controllable fake, making the game loop fully deterministic from the test's perspective. This eliminates timing-related flakiness.

### 3.4 Game State Bridge via `page.evaluate()` (The Power Pattern)

Since you can't query DOM elements for game state, expose it:

```typescript
// In game code (dev/test builds only):
if (import.meta.env.MODE !== 'production') {
  (window as any).__GAME__ = {
    getState: () => ({
      wave: game.getWaveNumber?.(),
      score: game.getScore?.(),
      health: game.getPlayerHealth?.(),
      resources: game.getResources?.(),
      isGameOver: game.isGameOver?.(),
    }),
    getEnemies: () => enemyQuery(world).map(eid => ({
      id: eid, x: Position.x[eid], y: Position.y[eid],
      health: Health.current[eid],
    })),
    getTurrets: () => turretQuery(world).map(eid => ({
      id: eid, x: Position.x[eid], y: Position.y[eid],
      type: Turret.type[eid],
    })),
    getEvents: () => [...capturedEvents],
  };
}
```

```typescript
// In Playwright test:
test('enemies spawn on wave start', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForFunction(() => window.__GAME__ !== undefined);

  await page.keyboard.press('Space'); // start wave

  await page.waitForFunction(() => {
    return window.__GAME__.getEnemies().length > 0;
  }, { timeout: 5000 });

  const enemies = await page.evaluate(() => window.__GAME__.getEnemies());
  expect(enemies.length).toBeGreaterThan(0);
});
```

**Alternatives:**
- `page.addInitScript()` -- inject test hooks before page loads
- `page.exposeFunction()` -- bidirectional communication (test-to-game callbacks)

### 3.5 PixiJS Accessibility Overlay (Untapped Opportunity)

PixiJS 8 has a built-in accessibility module that creates **real DOM elements** positioned over canvas objects:

```typescript
import 'pixi.js/accessibility';

const startButton = new Container();
startButton.accessible = true;
startButton.accessibleTitle = 'Start Game';
startButton.accessibleType = 'button';
```

This creates invisible DOM `<button>` elements that Playwright can query with standard locators:

```typescript
// Playwright can now find PixiJS elements!
const btn = page.getByRole('button', { name: 'Start Game' });
await btn.click();

// ARIA snapshot testing
await expect(page.locator('body')).toMatchAriaSnapshot(`
  - button "Start Game"
  - button "Turret Slot A3"
`);
```

**Current state:** Your project does NOT use the accessibility module. Adding it would provide both genuine accessibility AND testability.

### 3.6 Network Interception

```typescript
// Mock game config endpoint
await page.route('**/api/game-config', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ startingResources: 500, difficulty: 'easy' }),
  });
});

// Block audio loading for faster tests
await page.route('**/*.mp3', (route) => route.abort());
await page.route('**/*.ogg', (route) => route.abort());
```

---

## 4. Alternative Frameworks

### 4.1 Cypress

| Aspect | Assessment |
|--------|-----------|
| Canvas support | Screenshot-only via plugins (`cypress-image-snapshot`, `cypress-visual-regression`) |
| Interaction | Can click canvas coordinates but no element-level targeting |
| Canvas data | Can extract via `canvas.toDataURL()` in `cy.window()` |
| Clock control | `cy.clock()` exists but less mature than Playwright's for rAF |
| Headless | Yes |
| Multi-browser | Chromium default, Firefox/WebKit experimental |
| **Verdict** | Viable but weaker than Playwright for canvas games |

### 4.2 Puppeteer

| Aspect | Assessment |
|--------|-----------|
| Canvas support | Screenshots + coordinate clicks |
| **Critical bug** | [Known issue #5352](https://github.com/puppeteer/puppeteer/issues/5352): headless mode captures **blank canvas screenshots** |
| Browser support | Chrome/Chromium only |
| Test runner | None built-in (need Jest/Mocha separately) |
| **Verdict** | Avoid -- the blank screenshot bug and Chrome-only support make it inferior to Playwright |

### 4.3 BackstopJS

Open-source visual regression tool. Captures screenshots at URLs via Puppeteer or Playwright backend. Works with canvas since it captures actual rendered pixels. Good for pure visual regression, but no interaction or state testing.

### 4.4 Applitools Eyes

Enterprise AI-powered visual comparison. Uses computer vision to distinguish real bugs from rendering noise (anti-aliasing, font differences). Reduces false positives dramatically vs pixel diffing. Works with any automation driver. **Paid service.** Best for teams needing cross-browser/cross-device visual validation at scale.

### 4.5 Percy (BrowserStack)

Uses DOM snapshots, which **do NOT capture canvas content reliably**. Canvas appears blank or incorrect. Not suitable for PixiJS games.

### 4.6 PixiJS Storybook

Official integration exists: `@pixi/storybook-renderer` + `@pixi/storybook-preset-vite` (v1.0.0).

Stories return PixiJS DisplayObjects:
```typescript
export const TurretStory = {
  view: createTurretSprite(),
  update: (delta) => { /* animate */ },
};
```

Combined with [Chromatic](https://www.chromatic.com/storybook), each story becomes an automated visual regression test across Chrome, Firefox, Safari, and Edge.

**Best for:** Component-level visual testing of individual game elements (turrets, explosions, UI panels) in isolation. Not full game E2E.

### 4.7 Game-Specific Tools

| Tool | Engine | Status | Applicable? |
|------|--------|--------|-------------|
| **canvas-visual-bugs-testbed** | PixiJS | Research prototype (U of Alberta) | Yes -- scene graph + screenshot testing for PixiJS. Early stage. |
| **GameDriver** | Unity only | Active commercial | No |
| **AltTester** | Unity/Unreal | Active commercial | No |
| **Airtest** (NetEase) | Image recognition | Mature (11k stars) | Partially -- vision-based, no canvas internals, requires visible screen |
| **phase-2-e** | Phaser 2 | Abandoned (2016) | No |

---

## 5. Headless Rendering & CI/CD

### 5.1 The SwiftShader Deprecation (Critical Change)

Chrome 137+ (May 2025) **removed automatic SwiftShader fallback** for WebGL. Previously, headless Chrome silently fell back to CPU-based rendering. Now, WebGL context creation **simply fails** unless you explicitly opt in.

**Required flags for headless WebGL:**

```bash
# Option A: SwiftShader via ANGLE (recommended for CI)
--headless=new --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader

# Option B: SwiftShader directly
--headless=new --use-gl=swiftshader --enable-unsafe-swiftshader

# Option C: Vulkan backend (newer)
--headless=new --use-angle=vulkan --enable-features=Vulkan
```

**Performance reality:** SwiftShader runs at **1-5 FPS** (~10-50x slower than GPU). Fine for screenshot-based testing, not for real-time gameplay verification.

**Critical:** You must set `preserveDrawingBuffer: true` on the WebGL context to avoid blank screenshots. The buffer may be cleared between frames otherwise.

### 5.2 GitHub Actions Configuration

```yaml
jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test
        env:
          PLAYWRIGHT_CHROMIUM_ARGS: >-
            --no-sandbox
            --disable-dev-shm-usage
            --use-gl=swiftshader
            --enable-unsafe-swiftshader
```

**Docker considerations:**
- Default `/dev/shm` is 64MB -- SwiftShader will crash. Use `--shm-size=1gb`.
- Playwright's official Docker image (`mcr.microsoft.com/playwright:v1.50.0-jammy`) includes SwiftShader.

**Browser-specific headless support:**

| Browser | Headless GPU | Notes |
|---------|-------------|-------|
| Chromium | Disabled by default, enable via flags | `--headless=new` required since Playwright 1.49 |
| Firefox | Enabled under Xvfb only | Needs `xvfb-run npx playwright test` |
| WebKit | No headless GPU support | Must run headed under Xvfb |

**macOS CI runners** generally have GPU support via Metal/OpenGL -- less configuration needed.

### 5.3 WebGPU Consideration

Your project prefers WebGPU (`preference: 'webgpu'` in GameBootstrap). WebGPU support in headless Chrome is even more recent and experimental. For CI, you may want to **force WebGL fallback** in test configuration to avoid WebGPU compatibility issues.

---

## 6. Agentic Development Integration

### 6.1 The Test-as-Control-Loop Pattern

The emerging consensus: **tests are the control mechanism for agentic development**. The agent doesn't decide when work is done -- the tests do.

```
Agent receives task
  -> Agent writes/modifies code
  -> Agent runs lint + type-check + tests
  -> If fail: agent iterates
  -> If pass: task complete
```

E2E tests extend this loop to catch visual regressions and integration failures that unit tests miss.

### 6.2 Production Case Study: OpenObserve's "Council of Sub Agents"

OpenObserve published the most detailed case study of agentic testing at scale:

- **8 specialized Claude Code agents** automate the entire E2E testing pipeline
- **Results:** Feature analysis 6-10x faster, 85% fewer flaky tests, coverage from 380 to 700+ tests
- **Architecture:** Each agent has a single responsibility (analysis, auditing, debugging, etc.)
- **Stack:** Playwright for E2E, Page Object Model, TestDino for test case management

### 6.3 Meta's JiT Testing (February 2026)

Meta published "Just-in-Time Tests" (JiTTests):
- Tests **automatically generated by LLMs on the fly** to catch bugs before code lands
- Require **no maintenance and no test code review**
- Focus on catching "serious unexpected bugs" rather than comprehensive regression
- Represents a shift from static test suites to dynamically generated coverage

### 6.4 AI-Powered Visual Testing Tools

| Tool | Approach | Canvas Support | Maturity |
|------|----------|---------------|----------|
| **AskUI** | Computer vision agents | First-class canvas support | Medium |
| **TestDriver.ai** | Vision + natural language tests | Canvas, iframe, video | Medium |
| **Claude Computer Use** | Screenshot + reasoning | Any visual app | Medium (slow, expensive) |
| **modl.ai** | RL-based game exploration | Game engines | Early |

**Claude Computer Use** for this project:
- Can smoke-test: "Does the game load? Does the menu appear?"
- Can do exploratory testing: "Play for 2 minutes, report anomalies"
- **Cannot** do real-time gameplay at 60fps (each cycle takes seconds)
- **Cannot** query game state programmatically (sees pixels only)
- Best as a **supplementary exploratory layer**, not primary test framework

### 6.5 Practical Agentic Workflow for Kobayashi Maru

```
1. Claude Code writes ECS system code
2. Agent runs: pnpm test (unit tests via Vitest)
3. Agent runs: pnpm run e2e (Playwright visual + state tests)
4. If screenshots differ: agent evaluates diff, updates baselines if intentional
5. If state assertions fail: agent debugs and fixes
6. All green -> task complete
```

The key enabler: Playwright's `--update-snapshots` flag lets agents regenerate baselines when visual changes are intentional.

---

## 7. Deterministic Game Testing

### 7.1 Three Sources of Non-Determinism

| Source | Solution |
|--------|----------|
| `Math.random()` | Replace with seeded PRNG |
| Time / delta time | Fixed timestep + Playwright Clock API |
| Input timing | Record/replay or scripted inputs |

### 7.2 Seeded Randomness

`Math.random()` cannot be seeded in JavaScript. Use a library:

```typescript
// Lightweight Mulberry32 PRNG (no dependencies)
function mulberry32(seed: number) {
  return function() {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Or use `prando` library for TypeScript-friendly API
import Prando from 'prando';
const rng = new Prando(42); // seed = 42
const value = rng.next();   // always same sequence
```

Inject via ServiceContainer so tests can provide a fixed seed.

### 7.3 Fixed Timestep

```typescript
const FIXED_DT = 1 / 60; // 16.67ms
let accumulator = 0;

function gameLoop(realDeltaTime: number) {
  accumulator += realDeltaTime;
  while (accumulator >= FIXED_DT) {
    updateSimulation(FIXED_DT); // always same dt
    accumulator -= FIXED_DT;
  }
  render(accumulator / FIXED_DT); // interpolation factor
}
```

Combined with Playwright's Clock API, this makes the entire game loop deterministic.

### 7.4 Floating-Point Gotcha

Even with fixed timesteps: `(a + b) + c !== a + (b + c)` in floating-point. Entity iteration order in ECS queries must be deterministic. bitECS queries return entities in insertion order, which is stable as long as entity creation is deterministic.

### 7.5 Rune.ai's Production-Grade Approach

Rune.ai solved JavaScript determinism for multiplayer games by:
- Patching `Math` functions to single-precision floating-point
- Providing an ESLint plugin warning about non-deterministic patterns
- Using predict-rollback networking requiring full determinism

This is the gold standard but may be overkill for testing purposes -- Playwright Clock API + seeded PRNG is sufficient for most E2E test scenarios.

---

## 8. Recommended Architecture

### 8.1 Testing Pyramid for Canvas Games

```
         /\
        /  \  Smoke/Exploratory (AI-powered, optional)
       /    \   - Claude Computer Use / AskUI
      /------\
     /        \  E2E Visual + State (Playwright)
    /          \   - Screenshot regression
   /            \  - Game state bridge assertions
  /              \ - Clock API deterministic frames
 /----------------\
/                  \  Unit + Integration (Vitest, existing)
/                    \  - 2,224 tests, ECS systems, managers
/____________________\
```

### 8.2 Concrete Setup for This Project

**Install:**
```bash
pnpm add -D @playwright/test
npx playwright install chromium
```

**File structure:**
```
e2e/
  playwright.config.ts
  fixtures/
    game.fixture.ts       # Custom fixture with game state helpers
  tests/
    smoke.spec.ts          # Game loads, canvas renders
    main-menu.spec.ts      # Menu interactions
    gameplay.spec.ts       # Wave start, enemy spawn, turret placement
    visual-regression.spec.ts  # Screenshot comparisons
  snapshots/               # Baseline screenshots (git-tracked)
src/
  testing/
    e2eTestBridge.ts       # Window-exposed game state API
```

**Playwright config:**
```typescript
// e2e/playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    launchOptions: {
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
      ],
    },
    viewport: { width: 1920, height: 1080 },
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
  webServer: {
    command: 'pnpm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,  // 2% tolerance for SW rendering
      threshold: 0.3,
    },
  },
});
```

**Test bridge (conditionally included):**
```typescript
// src/testing/e2eTestBridge.ts
import type { Game } from '../core/Game';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';

interface TestBridgeAPI {
  getState(): { wave: number; score: number; health: number; resources: number; isGameOver: boolean };
  getEvents(): Array<{ type: string; payload: unknown; time: number }>;
  clearEvents(): void;
  getEnemyCount(): number;
  getTurretCount(): number;
}

export function installTestBridge(game: Game): void {
  const eventBus = EventBus.getInstance();
  const events: Array<{ type: string; payload: unknown; time: number }> = [];

  // Capture key events
  for (const eventType of [
    GameEventType.ENEMY_KILLED,
    GameEventType.WAVE_STARTED,
    GameEventType.WAVE_COMPLETED,
    GameEventType.GAME_OVER,
    GameEventType.RESOURCE_UPDATED,
  ]) {
    eventBus.on(eventType, (payload) => {
      events.push({ type: eventType, payload, time: Date.now() });
    });
  }

  const api: TestBridgeAPI = {
    getState: () => ({ /* query game managers */ }),
    getEvents: () => [...events],
    clearEvents: () => { events.length = 0; },
    getEnemyCount: () => 0, // wire to ECS query
    getTurretCount: () => 0, // wire to ECS query
  };

  (window as any).__GAME__ = api;
}
```

**Example test:**
```typescript
// e2e/tests/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('game loads and renders canvas', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15000 });

  // Canvas has correct dimensions
  const box = await canvas.boundingBox();
  expect(box.width).toBeGreaterThan(0);
  expect(box.height).toBeGreaterThan(0);

  // Visual baseline
  await page.waitForTimeout(2000);
  await expect(page).toHaveScreenshot('game-loaded.png');
});

test('main menu is interactive', async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__GAME__ !== undefined);

  // Click "Start Game" button at expected coordinates
  await page.click('canvas', { position: { x: 960, y: 540 } });

  // Verify game started via state bridge
  await page.waitForFunction(() => {
    const state = (window as any).__GAME__.getState();
    return state.wave >= 0;
  });
});
```

### 8.3 Layered Test Strategy

| Layer | Tool | Tests What | When to Run |
|-------|------|-----------|-------------|
| **Smoke** | Playwright | Game loads, canvas renders, no crashes | Every commit |
| **Visual regression** | Playwright `toHaveScreenshot()` | Main menu, HUD, key game states look correct | Every commit |
| **Gameplay flow** | Playwright + test bridge | Wave start -> enemies spawn -> combat -> wave complete | Every commit |
| **Deterministic frames** | Playwright Clock API | Exact visual state at specific game times | Before release |
| **Component visual** | PixiJS Storybook + Chromatic | Individual sprites, effects, UI panels render correctly | Optional |
| **Exploratory** | Claude Computer Use / AskUI | "Does the game feel right?" | Manual/periodic |

### 8.4 Required Game Code Changes

To enable E2E testing, the project needs:

1. **`preserveDrawingBuffer: true`** in PixiJS Application config (prevents blank screenshots)
2. **Test bridge module** conditionally loaded in dev/test mode
3. **WebGL fallback** option in test config (WebGPU may not work in headless)
4. **Optional:** PixiJS accessibility annotations on interactive elements
5. **Optional:** Seeded PRNG injected via ServiceContainer

### 8.5 Package.json Scripts

```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:headed": "playwright test --headed",
    "e2e:ui": "playwright test --ui",
    "e2e:update": "playwright test --update-snapshots"
  }
}
```

---

## 9. Comparison Matrix

### E2E Frameworks for Canvas Games

| Framework | Canvas Interaction | Visual Regression | Game State Access | Headless WebGL | Multi-Browser | Clock Control | CI-Ready | Cost |
|-----------|-------------------|-------------------|-------------------|---------------|---------------|--------------|----------|------|
| **Playwright** | Coordinates | Built-in (`toHaveScreenshot`) | via `page.evaluate` | Yes (flags needed) | Chromium, Firefox, WebKit | Clock API (excellent) | Yes | Free |
| **Cypress** | Coordinates | Via plugins | via `cy.window` | Partial | Chromium default | `cy.clock` (limited) | Yes | Free (paid for dashboard) |
| **Puppeteer** | Coordinates | Via jest-image-snapshot | via `page.evaluate` | **Blank screenshot bug** | Chrome only | No | Partial | Free |
| **BackstopJS** | None (screenshot only) | Built-in | None | Via Puppeteer/Playwright | Via backend | No | Yes | Free |
| **Applitools** | Via driver | AI-powered (best) | Via driver | Via driver | Yes | Via driver | Yes | Paid |
| **Percy** | Via driver | DOM snapshots (**breaks canvas**) | Via driver | Via driver | Yes | Via driver | Yes | Paid |

### Visual Testing Approaches

| Approach | False Positive Rate | Canvas Support | Cost | Maintenance |
|----------|-------------------|---------------|------|-------------|
| Pixel diffing (pixelmatch) | High | Yes | Free | High (brittle) |
| Structural similarity (SSIM) | Medium | Yes | Free | Medium |
| AI visual comparison (Applitools) | Low | Yes | Paid | Low |
| Scene graph comparison | Very low | PixiJS only | Free | Medium |
| Game state assertions | Zero | Engine-agnostic | Free | Medium |

### Testing Strategies for Canvas Games

| Strategy | Catches Visual Bugs | Catches Logic Bugs | Deterministic | CI Friendly | Setup Effort |
|----------|--------------------|--------------------|---------------|-------------|-------------|
| Screenshot comparison | Yes | No | With Clock API | Yes | Low |
| Game state bridge | No | Yes | Yes | Yes | Medium |
| Accessibility overlay | No | Partial (interaction) | Yes | Yes | Medium |
| Coordinate clicking | No | Partial (input handling) | Partial | Yes | Low |
| Deterministic replay | Yes + Yes | Yes | Yes | Yes | High |
| AI visual reasoning | Partial | No | No | No | Low |

---

## 10. Sources

### Playwright + Canvas
- [Playwright Mouse API](https://playwright.dev/docs/api/class-mouse)
- [Playwright Visual Comparisons](https://playwright.dev/docs/test-snapshots)
- [Playwright Clock API](https://playwright.dev/docs/clock)
- [Playwright Network Mocking](https://playwright.dev/docs/mock)
- [Playwright ARIA Snapshots](https://playwright.dev/docs/aria-snapshots)
- [playwright-canvas PoC](https://github.com/satelllte/playwright-canvas)
- [End-to-end testing for web games (Barth Cave)](https://barthpaleologue.github.io/Blog/posts/webgl-webgpu-playwright-setup/)
- [Automating Canvas Elements with Playwright](https://smrutisouravsahoo06.medium.com/the-secret-to-automating-canvas-elements-playwright-js-revealed-c2249e522083)
- [Canvas Testing with Object Detection (BioCatch)](https://medium.com/@BioCatchTechBlog/automating-canvas-testing-with-playwright-and-object-detection-models-8d58235b17b7)

### PixiJS
- [PixiJS 8 Accessibility Guide](https://pixijs.com/8.x/guides/components/accessibility)
- [PixiJS Storybook](https://github.com/pixijs/storybook)
- [canvas-visual-bugs-testbed](https://github.com/asgaardlab/canvas-visual-bugs-testbed)
- [PixiJS Testing Discussion #10788](https://github.com/pixijs/pixijs/discussions/10788)

### Headless Rendering
- [Chrome: Supercharge Web AI Model Testing](https://developer.chrome.com/blog/supercharge-web-ai-testing)
- [Remove SwiftShader Fallback - Chrome Status](https://chromestatus.com/feature/5166674414927872)
- [Intent to Remove SwiftShader](https://groups.google.com/a/chromium.org/g/blink-dev/c/yhFguWS_3pM)
- [Enable GPU for Playwright Tests](https://michelkraemer.com/enable-gpu-for-slow-playwright-tests-in-headless-mode/)
- [Headless Chrome WebGL via Playwright](https://www.createit.com/blog/headless-chrome-testing-webgl-using-playwright/)

### CI/CD
- [Playwright with CI/CD: Xvfb](https://www.tothenew.com/blog/playwright-with-ci-cd-harnessing-headless-browsers-xvfb-for-seamless-automation-in-node-js/)
- [coactions/setup-xvfb](https://github.com/coactions/setup-xvfb)
- [GPU Runners for GitHub Actions (RunsOn)](https://runs-on.com/runners/gpu/)
- [OpenGL Tests on GitHub Actions](https://amiralizadeh9480.medium.com/how-to-run-opengl-based-tests-on-github-actions-60f270b1ea2c)

### Agentic Testing
- [Meta JiT Testing (Feb 2026)](https://engineering.fb.com/2026/02/11/developer-tools/the-death-of-traditional-testing-agentic-development-jit-testing-revival/)
- [OpenObserve: Autonomous QA with Claude Code](https://openobserve.ai/blog/autonomous-qa-testing-ai-agents-claude-code/)
- [TDAID: Test-Driven AI Development](https://www.awesome-testing.com/2025/10/test-driven-ai-development-tdaid/)
- [Agentic Software Development 2026](https://www.awesome-testing.com/2026/02/ai-coding-2026-hype-vs-reality)

### AI-Powered Testing
- [AskUI: HTML5 Canvas Testing](https://www.askui.com/blog-posts/html5-canvas-testing-techniques-tools-and-best-practices/)
- [TestDriver.ai](https://testdriver.ai/)
- [Claude Computer Use for Testing](https://medium.com/@itsmo93/automating-e2e-ui-testing-with-claudes-computer-use-feature-c9f516bbbb66)

### Determinism
- [Making JS Deterministic (Rune.ai)](https://developers.rune.ai/blog/making-js-deterministic-for-fun-and-glory)
- [Fixed Timestep Game Loop](https://andreleite.com/posts/2025/game-loop/fixed-timestep-game-loop/)
- [Prando: Seeded PRNG](https://github.com/zeh/prando)

### Alternative Tools
- [Automated Testing for LoL (Riot Games)](https://technology.riotgames.com/news/automated-testing-league-legends)
- [E2E Testing a Phaser Game](https://medium.com/@philscode/e2e-testing-a-video-game-a12c7061385f)
- [Cypress Visual Testing](https://docs.cypress.io/app/tooling/visual-testing)
- [jest-image-snapshot](https://github.com/americanexpress/jest-image-snapshot)
- [BackstopJS](https://github.com/garris/BackstopJS)
- [VLMs for Canvas Bug Detection (arXiv)](https://arxiv.org/html/2501.09236)
