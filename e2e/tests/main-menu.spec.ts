import { test, expect } from '../fixtures/game.fixture';

test.describe('Main Menu', () => {
  test('starts in menu state and transitions to playing', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();

    // Should be in menu state
    const menuSnapshot = await game.getSnapshot();
    expect(menuSnapshot.state).toBe('MENU');

    // Start game via test bridge
    await game.startGame();

    // Should transition to playing
    await game.waitForState('PLAYING');
    const playingSnapshot = await game.getSnapshot();
    expect(playingSnapshot.state).toBe('PLAYING');

    // Resources should be at initial value (500)
    expect(playingSnapshot.resources).toBe(500);
  });

  test('can start game by clicking canvas start button', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();

    // Click the "START SIMULATION" button area (center of screen)
    await game.clickCanvas(960, 550);

    // Should transition to playing
    await game.waitForState('PLAYING', 5000);
    const snapshot = await game.getSnapshot();
    expect(snapshot.state).toBe('PLAYING');
  });
});
