import { test, expect } from '../fixtures/game.fixture';

test.describe('Game Over', () => {
  test.setTimeout(60000);

  test('game over triggers when KM health reaches zero', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.startGame();
    await game.waitForState('PLAYING');

    // Set KM health to 0 — game over should trigger on next frame
    await page.evaluate(() => window.__GAME__.setKMHealth(0));

    // Wait for game over state
    await game.waitForState('GAME_OVER', 10000);

    const snapshot = await game.getSnapshot();
    expect(snapshot.state).toBe('GAME_OVER');
  });

  test('can restart after game over', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.startGame();
    await game.waitForState('PLAYING');

    // Force game over
    await page.evaluate(() => window.__GAME__.setKMHealth(0));
    await game.waitForState('GAME_OVER', 10000);

    // Restart via test bridge
    await page.evaluate(() => window.__GAME__.restart());

    // Should return to playing state (allow time for restart to process)
    await game.waitForState('PLAYING');
    const snapshot = await game.getSnapshot();
    expect(snapshot.state).toBe('PLAYING');
  });
});
