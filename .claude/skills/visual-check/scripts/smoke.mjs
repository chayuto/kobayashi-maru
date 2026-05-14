import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, '../screenshots');
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  headless: true,
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

const consoleErrs = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') consoleErrs.push(msg.text());
});

await page.goto('http://localhost:3000');
await page.waitForFunction(() => window.__GAME__?.isReady(), { timeout: 15000 });

await page.evaluate(() => window.__GAME__.freezeStarfield());
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/smoke__01-menu.png`, fullPage: false });

await page.evaluate(() => window.__GAME__.startGame());
await page.waitForFunction(() => window.__GAME__.getSnapshot().state === 'PLAYING', { timeout: 10000 });
await page.evaluate(() => window.__GAME__.setResources(5000));
await page.waitForTimeout(300);
await page.screenshot({ path: `${OUT}/smoke__02-playing-empty.png`, fullPage: false });

await page.evaluate(() => window.__GAME__.placeTurret(1, 760, 540));
await page.evaluate(() => window.__GAME__.placeTurret(1, 1160, 540));
await page.evaluate(() => window.__GAME__.placeTurret(1, 960, 340));
await page.evaluate(() => window.__GAME__.placeTurret(1, 960, 740));
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/smoke__03-turrets-placed.png`, fullPage: false });

const snap = await page.evaluate(() => window.__GAME__.getSnapshot());
const counts = await page.evaluate(() => window.__GAME__.getEntityCounts());

console.log(JSON.stringify({ snap, counts, consoleErrs }, null, 2));

await browser.close();
