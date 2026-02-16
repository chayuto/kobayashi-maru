import { test, expect } from '../fixtures/game.fixture';

test.describe('AI Auto-Play', () => {
  test.setTimeout(90000);

  test('AI plays the game without crashing', async ({ page, game }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await game.waitForGameReady();
    await game.startGame();
    await game.waitForState('PLAYING');

    // Enable god mode so game doesn't end during test
    await page.evaluate(() => window.__GAME__.toggleGodMode());

    // Ensure AI auto-play is enabled (it may be on by default)
    const alreadyEnabled = await page.evaluate(() => window.__GAME__.isAIEnabled());
    if (!alreadyEnabled) {
      await page.evaluate(() => window.__GAME__.toggleAI());
    }

    const isAI = await page.evaluate(() => window.__GAME__.isAIEnabled());
    expect(isAI).toBe(true);

    // Give AI extra resources
    await page.evaluate(() => window.__GAME__.setResources(5000));

    // Wait for enemies to spawn first (20s for slow CI environments)
    await game.waitForEnemies(20000);

    // Let AI play until kills happen (up to 45s after enemies spawn)
    // Timing chain: 20s enemies + 45s kills = 65s < 90s test timeout
    await page.waitForFunction(
      () => window.__GAME__.getEventsByType('ENEMY_KILLED').length > 0,
      { timeout: 45000 }
    );

    // Verify game didn't crash — still in playing state
    const snapshot = await game.getSnapshot();
    expect(snapshot.state).toBe('PLAYING');

    // AI should have placed turrets
    const counts = await game.getEntityCounts();
    expect(counts.turrets).toBeGreaterThan(0);

    // Waves should have progressed
    expect(snapshot.wave).toBeGreaterThanOrEqual(1);

    // Kills confirmed above via waitForFunction

    // No console errors during AI play
    expect(errors).toEqual([]);
  });
});
