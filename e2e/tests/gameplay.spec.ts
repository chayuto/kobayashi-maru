import { test, expect } from '../fixtures/game.fixture';

test.describe('Gameplay Flow', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.startGame();
    await game.waitForState('PLAYING');
  });

  test('wave 1 starts and enemies spawn', async ({ game }) => {
    // Wait for wave 1 to start
    await game.waitForEnemies(15000);

    const snapshot = await game.getSnapshot();
    expect(snapshot.wave).toBeGreaterThanOrEqual(1);
    expect(snapshot.activeEnemies).toBeGreaterThan(0);
  });

  test('can place a turret and resources decrease', async ({ page, game }) => {
    const initialSnapshot = await game.getSnapshot();
    const initialResources = initialSnapshot.resources;

    // Place a turret via test bridge (turret type 0 = phaser, position away from KM)
    const success = await page.evaluate(() => {
      return window.__GAME__.placeTurret(0, 400, 400);
    });
    expect(success).toBe(true);

    // Resources should have decreased
    const afterSnapshot = await game.getSnapshot();
    expect(afterSnapshot.resources).toBeLessThan(initialResources);

    // Turret count should have increased
    const counts = await game.getEntityCounts();
    expect(counts.turrets).toBeGreaterThanOrEqual(1);
  });

  test('enemies die and generate kill events', async ({ page, game }) => {
    // Enable god mode to prevent game over
    await page.evaluate(() => window.__GAME__.toggleGodMode());

    // Give resources for turrets
    await page.evaluate(() => window.__GAME__.setResources(5000));

    // Place torpedo turrets (type 1, 350px range, 60 dmg) at cardinal positions
    // around KM center (960, 540) to cover all approach vectors
    await page.evaluate(() => {
      window.__GAME__.placeTurret(1, 960, 340);   // north
      window.__GAME__.placeTurret(1, 760, 540);   // west
      window.__GAME__.placeTurret(1, 1160, 540);  // east
      window.__GAME__.placeTurret(1, 960, 740);   // south
    });

    // Clear events and wait for kills
    await game.clearEvents();
    await game.waitForEnemies();

    // Wait for enemy kill events (up to 45s)
    await page.waitForFunction(
      () => window.__GAME__.getEventsByType('ENEMY_KILLED').length > 0,
      { timeout: 45000 }
    );

    const killEvents = await game.getEventsByType('ENEMY_KILLED');
    expect(killEvents.length).toBeGreaterThan(0);
  });
});
