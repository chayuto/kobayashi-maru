import { test, expect } from '../fixtures/game.fixture';

test.describe('Visual Regression', () => {
  // Canvas games have constant animation, so we pause the game and freeze
  // the starfield for deterministic screenshots.
  // First run: `pnpm run e2e:update` to create baselines.
  test.setTimeout(60000);
  test.skip(!!process.env.CI, 'Visual baselines are platform-specific');

  test('main menu screenshot', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.freezeStarfield();

    // Wait for rendering to stabilize
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('main-menu.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
      timeout: 15000,
    });
  });

  test('in-game HUD screenshot', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.freezeStarfield();
    await game.startGame();
    await game.waitForState('PLAYING');

    // Enable god mode and pause for stable screenshot
    await page.evaluate(() => window.__GAME__.toggleGodMode());
    await page.evaluate(() => window.__GAME__.pause());
    await game.waitForState('PAUSED');

    // Wait for render pipeline to flush
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('in-game-hud.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
      timeout: 15000,
    });
  });

  test('pause overlay screenshot', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.freezeStarfield();
    await game.startGame();
    await game.waitForState('PLAYING');

    // Pause the game
    await page.evaluate(() => window.__GAME__.pause());
    await game.waitForState('PAUSED');

    // Wait for pause overlay to render
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('pause-overlay.png', {
      maxDiffPixelRatio: 0.05,
      threshold: 0.3,
      timeout: 15000,
    });
  });
});
