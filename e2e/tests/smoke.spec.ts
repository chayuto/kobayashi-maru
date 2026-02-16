import { test, expect } from '../fixtures/game.fixture';

test.describe('Smoke Tests', () => {
  test('game loads and canvas renders', async ({ page, game }) => {
    await page.goto('/');

    // Canvas element should appear
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Canvas should have non-zero dimensions
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(0);
    expect(box!.height).toBeGreaterThan(0);

    // Test bridge should be ready
    await game.waitForGameReady();

    // Game should start in menu state
    const snapshot = await game.getSnapshot();
    expect(snapshot.state).toBe('MENU');
  });

  test('no console errors on load', async ({ page, game }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await game.waitForGameReady();

    expect(errors).toEqual([]);
  });
});
