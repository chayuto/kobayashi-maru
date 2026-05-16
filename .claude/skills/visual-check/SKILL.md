---
name: visual-check
description: Drive a headless Chromium browser to take screenshots of the running dev server so Claude can VISUALLY verify its own UI/canvas work via vision-inspection. Use whenever the user asks to "visually check", "take a screenshot", "see how it looks", "verify visually", or after touching code in src/ui/, src/rendering/, src/game/, or anything that produces visible output. This is for ad-hoc visual inspection, NOT for writing Playwright test specs (use the e2e skill for that).
user-invocable: true
allowed-tools: Bash, Read, Write, Edit, Glob, Grep
argument-hint: "[scenario-name or 'list' or 'clean']"
---

# Visual Check — Vision-Inspectable Screenshots

You are about to **visually verify your own work** by driving a real browser at the running dev server and capturing screenshots that you (Claude) will then `Read` as images and inspect with vision.

This skill is **different from the `e2e` skill**:
- `e2e` writes `*.spec.ts` files that ship with the codebase and run in CI.
- `visual-check` is ephemeral — scripts and screenshots stay under `.claude/skills/visual-check/`, gitignored, and exist only to let you (Claude) confirm something with your eyes before claiming a UI/canvas change works.

## Two execution paths — prefer Playwright MCP if available

There are two ways to drive the browser. **Check which path is available first** (`claude mcp list | grep -i playwright`):

### Path A — Playwright MCP server (preferred when installed)

If the user has `@playwright/mcp` registered, the MCP server exposes `browser_*` tools directly to you (the agent). No script files, no `node` invocation — one warm browser per session, you call tools and read results.

**Key MCP tools (~60+ available):**
- `browser_navigate(url)` — load a URL
- `browser_evaluate(function)` — run JS in the page; **this is how you call `window.__GAME__.*`**
- `browser_take_screenshot({ filename, fullPage })` — pixel screenshot → returned as image
- `browser_snapshot()` — accessibility-tree snapshot (text). **Less useful for this project** because the game is a single `<canvas>` with no DOM semantics — prefer screenshots here.
- `browser_console_messages()` — drain console errors
- `browser_wait_for({ text, time })` — wait for text/duration
- `browser_resize(width, height)` — set viewport
- `browser_close()` — tear down

**Install** (one-time, if not already done):
```bash
claude mcp add playwright npx @playwright/mcp@latest -- --headless --viewport-size 1920x1080 --browser chromium --output-dir .claude/skills/visual-check/screenshots
```
Then **reload the Claude Code session** for the new tools to appear in the available-tools list. After install, `claude mcp list` should show `playwright` connected.

**Typical MCP-driven verification (no script files):**
```
1. browser_navigate("http://localhost:3000")
2. browser_evaluate(() => window.__GAME__.isReady()) → expect true
3. browser_evaluate(() => window.__GAME__.freezeStarfield())
4. browser_evaluate(() => window.__GAME__.startGame())
5. browser_wait_for({ time: 0.5 })
6. browser_evaluate(() => window.__GAME__.setResources(5000))
7. browser_evaluate(() => window.__GAME__.placeTurret(1, 960, 540))
8. browser_take_screenshot({ filename: "verify__turret-placed.png" })
9. browser_console_messages() → expect [] (no errors)
10. Read the returned screenshot, describe what you saw.
```

The browser stays warm between checks within a session — subsequent calls don't pay the cold-start cost. **Always pass `--headless`** to the MCP install command (or set `headless: true` at start) — see [Headless rule](#gotchas-from-prior-pain) below.

### Path B — Node script + project's @playwright/test (fallback)

Used when MCP is not installed (and you don't want to ask the user to install it for a one-off check). Self-contained: write a `.mjs` script, run via `node`, screenshots land in `.claude/skills/visual-check/screenshots/`, you `Read` them.

## Preflight (run in order)

1. **Path selection** — `claude mcp list 2>/dev/null | grep -i playwright`. If found → Path A (MCP). Else → Path B (script).
2. **Node 24 LTS** — pnpm 11 requires it. `node -v`. If wrong, `source "$NVM_DIR/nvm.sh" && nvm use 24` (install with `nvm install 24 --lts`). `package.json` pins `engines.node >=24` and `packageManager: pnpm@11.x`.
3. **Dev server up on :3000?** — `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000` should return 200. If not, start it in background:
   ```bash
   source "$NVM_DIR/nvm.sh" && nvm use 24 && cd /Users/chayut/repos/kobayashi-maru && pnpm run dev
   ```
   (Bash `run_in_background: true`, then poll until 200.)
4. **Path B only — project install fresh?** — `pnpm install`. No-op if up to date.
5. **Playwright browser cached?** — Playwright 1.57+ uses **Chrome for Testing**, not Chromium.
   - Path A (MCP): `npx @playwright/mcp@latest install-browser chrome-for-testing`
   - Path B (script): `npx playwright install chromium chromium-headless-shell`
   One-time ~100MB download into `~/Library/Caches/ms-playwright/`.
6. **Bridge present** — verify `window.__GAME__?.isReady()` resolves before driving the game (Path A: `browser_evaluate`. Path B: `await page.waitForFunction(...)`). The bridge is dev-mode only — see `src/testing/e2eTestBridge.ts`.

If any preflight step fails, **report it and stop** — don't paper over it.

## Path B detail — Node script approach

Write a self-contained Node script to `.claude/skills/visual-check/scripts/<scenario>.mjs`. Each script:

1. Launches Chromium via `playwright` (already in `node_modules`).
2. Navigates to `http://localhost:3000`.
3. Drives the game via `window.__GAME__` (state setters, place turrets, freeze starfield).
4. Takes one or more screenshots into `.claude/skills/visual-check/screenshots/<scenario>__<step>.png`.
5. Exits cleanly.

Then you `Read` the PNG with the Read tool — it gets passed to your vision and you inspect it like a human reviewer would.

### Script template

```javascript
// .claude/skills/visual-check/scripts/<scenario>.mjs
import { chromium } from '@playwright/test'; // re-exports chromium from the installed devDep
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../screenshots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true, // ALWAYS headless — user preference. Don't open a visible window.
  args: [
    '--use-gl=angle',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--no-sandbox',
    '--disable-dev-shm-usage',
  ],
});
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
const page = await ctx.newPage();

page.on('console', (msg) => {
  if (msg.type() === 'error') console.error('[browser]', msg.text());
});

await page.goto('http://localhost:3000');
await page.waitForFunction(() => window.__GAME__?.isReady(), { timeout: 15000 });

// --- scenario steps go here ---
await page.evaluate(() => window.__GAME__.freezeStarfield());
await page.evaluate(() => window.__GAME__.startGame());
await page.waitForTimeout(500); // let UI settle
await page.screenshot({ path: `${OUT}/<scenario>__main-menu.png`, fullPage: false });

// example: place a turret and snapshot HUD
await page.evaluate(() => window.__GAME__.setResources(5000));
await page.evaluate(() => window.__GAME__.placeTurret(1, 960, 540));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/<scenario>__after-place.png` });

await browser.close();
console.log('done →', OUT);
```

Run with:
```bash
cd /Users/chayut/repos/kobayashi-maru && node .claude/skills/visual-check/scripts/<scenario>.mjs
```

Then in the same response, **`Read` each generated PNG** and describe what you see / compare against expectations.

## Bridge API (window.__GAME__)

Available in dev mode. See `src/testing/e2eTestBridge.ts` for source of truth.

| Method | Purpose |
|---|---|
| `isReady()` | Returns true once game is initialized |
| `startGame()` / `pause()` / `resume()` / `restart()` | Game lifecycle |
| `startDeterministic()` | Start a game with the wall-clock ticker **frozen** — advance only via `stepFrames()` |
| `seedRandom(seed)` | Seed the gameplay RNG — makes spawns/combat reproducible |
| `stepFrames(n, deltaMs?)` | Advance exactly `n` fixed-delta frames (default 1/60s) |
| `getSnapshot()` | `{ state, wave, waveState, activeEnemies, resources, score, kmHealth, kmMaxHealth }` |
| `setResources(amount)` | Force-set player resources |
| `setKMHealth(health)` | Force-set Kobayashi Maru hull health |
| `placeTurret(type, x, y)` | Place a turret. type 0=phaser, 1=torpedo. world coords (KM at 960,540) |
| `toggleGodMode()` / `toggleAI()` / `isAIEnabled()` | Cheats / AI control |
| `freezeStarfield()` | **ALWAYS call this before screenshots** — animated starfield otherwise causes spurious diffs |
| `getEvents()` / `getEventsByType(type)` / `clearEvents()` | Captured event log |
| `getEntityCounts()` | `{ turrets, enemies }` |

## Deterministic screenshots — reproducible visual states

For visual debugging you usually want the **exact same game state every time**,
so a screenshot diff reflects *your code change* and nothing else. Use the
deterministic trio instead of `startGame()` + a real-time wait:

```
1. browser_navigate("http://localhost:3000")
2. browser_evaluate(() => window.__GAME__.isReady())            → expect true
3. browser_evaluate(() => window.__GAME__.seedRandom(424242))   → seed BEFORE start
4. browser_evaluate(() => window.__GAME__.startDeterministic()) → start + freeze ticker
5. browser_evaluate(() => window.__GAME__.freezeStarfield())
6. browser_evaluate(() => window.__GAME__.setResources(5000))
7. browser_evaluate(() => window.__GAME__.placeTurret(1, 960, 540))
8. browser_evaluate(() => window.__GAME__.stepFrames(600))      → advance 10s instantly
9. browser_take_screenshot({ filename: "verify__wave-in-progress.png" })
10. browser_console_messages() → expect [] (no errors)
11. Read the PNG, describe what you saw.
```

Why this beats a wall-clock wait:
- **Instant** — `stepFrames(600)` simulates 10 seconds in milliseconds.
- **Reproducible** — same seed + same frame count = pixel-identical game state.
  Re-run after a code change and any visual diff is purely your change.
- **No flake** — no animation mid-capture, no "did enough time pass" guessing.

Caveat: the AI Commander autoplay is on by default and has small residual
nondeterminism. For a perfectly reproducible state, disable it right after
`startDeterministic()`:
`browser_evaluate(() => { if (window.__GAME__.isAIEnabled()) window.__GAME__.toggleAI(); })`.

## Gotchas (from prior pain)

- **Freeze the starfield before every screenshot.** It animates even when game is paused.
- **Viewport must be 1920×1080** to match where game elements are positioned (KM at 960, 540).
- **Wait for state before screenshot.** Use `await page.waitForFunction(() => window.__GAME__.getSnapshot().state === 'PLAYING')` rather than fixed timeouts.
- **SwiftShader is slow.** Use 5–15s timeouts for state transitions, 20s+ when waiting for enemies to spawn.
- **The KM center is (960, 540).** Place turrets at cardinal offsets (e.g. ±200) to engage spawns from all directions.
- **Torpedo turrets (type 1) are more reliable** in tests — 350px range, 60 damage, vs phaser's 200px / 20 damage.
- **Don't reuse e2e baselines.** `e2e/tests/*.spec.ts-snapshots/` are platform-pinned baselines for CI; this skill writes fresh screenshots each run.
- **Screenshots are gitignored** (`.claude/skills/visual-check/screenshots/*`). They are ephemeral evidence of *this* check, not artifacts.
- **Headless only.** User preference: never launch a visible Chromium window — `headless: true` always. The vision-inspection loop is Claude reading PNGs; a visible browser adds nothing and steals user focus.

## Argument handling

- **No argument or scenario name** → write/run a script for that scenario, then Read the screenshots.
- **`list`** → `ls -la .claude/skills/visual-check/scripts/ .claude/skills/visual-check/screenshots/` and report what's there.
- **`clean`** → `rm -f .claude/skills/visual-check/screenshots/*.png` (keep `.gitkeep`). Useful before a fresh round.

## When NOT to use this skill

- If the user asks to add a permanent test → use the `e2e` skill.
- If the user just wants to know if tests pass → use the `verify` skill.
- If there's no UI/canvas change involved (pure logic refactor, type fix) → screenshots add no signal; skip.

## Reporting back

After taking screenshots and reading them, give the user a short, specific report:

> Verified the HUD update in `<scenario>__after-place.png`:
> - Resource counter shows 4900 (was 5000, turret cost 100) ✓
> - Torpedo turret rendered at center, both barrels visible ✓
> - Starfield frozen, no animation artifacts ✓
> - **One concern:** turret base sprite appears 1–2 px off-center vs KM hub — see screenshot.

Be concrete. "Looks good" without referencing what you actually saw is not useful.
