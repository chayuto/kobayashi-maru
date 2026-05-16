import { test as base, expect } from '@playwright/test';
import type { GameSnapshot, EntityCounts, CapturedEvent } from '../helpers/game-bridge';

export interface GameHelpers {
  waitForGameReady(): Promise<void>;
  getSnapshot(): Promise<GameSnapshot>;
  getEvents(): Promise<CapturedEvent[]>;
  getEventsByType(type: string): Promise<CapturedEvent[]>;
  clearEvents(): Promise<void>;
  getEntityCounts(): Promise<EntityCounts>;
  waitForState(state: string, timeout?: number): Promise<void>;
  waitForEnemies(timeout?: number): Promise<void>;
  startGame(): Promise<void>;
  startDeterministic(): Promise<void>;
  freezeStarfield(): Promise<void>;
  clickCanvas(worldX: number, worldY: number): Promise<void>;
  stepFrames(frames: number, deltaMs?: number): Promise<void>;
  seedRandom(seed: number): Promise<void>;
}

export const test = base.extend<{ game: GameHelpers }>({
  game: async ({ page }, use) => {
    // Inject E2E flag before page loads
    await page.addInitScript(() => {
      (window as unknown as { __E2E_MODE__: boolean }).__E2E_MODE__ = true;
    });

    const helpers: GameHelpers = {
      waitForGameReady: async () => {
        await page.waitForFunction(
          () => (window as unknown as { __GAME__: { isReady(): boolean } }).__GAME__?.isReady() === true,
          { timeout: 15000 }
        );
      },

      getSnapshot: async () => {
        return page.evaluate(
          () => (window as unknown as { __GAME__: { getSnapshot(): unknown } }).__GAME__.getSnapshot()
        ) as Promise<GameSnapshot>;
      },

      getEvents: async () => {
        return page.evaluate(
          () => (window as unknown as { __GAME__: { getEvents(): unknown[] } }).__GAME__.getEvents()
        ) as Promise<CapturedEvent[]>;
      },

      getEventsByType: async (type: string) => {
        return page.evaluate(
          (t) => (window as unknown as { __GAME__: { getEventsByType(t: string): unknown[] } }).__GAME__.getEventsByType(t),
          type
        ) as Promise<CapturedEvent[]>;
      },

      clearEvents: async () => {
        await page.evaluate(
          () => (window as unknown as { __GAME__: { clearEvents(): void } }).__GAME__.clearEvents()
        );
      },

      getEntityCounts: async () => {
        return page.evaluate(
          () => (window as unknown as { __GAME__: { getEntityCounts(): unknown } }).__GAME__.getEntityCounts()
        ) as Promise<EntityCounts>;
      },

      waitForState: async (state: string, timeout = 10000) => {
        await page.waitForFunction(
          (s) => (window as unknown as { __GAME__: { getSnapshot(): { state: string } } }).__GAME__.getSnapshot().state === s,
          state,
          { timeout }
        );
      },

      waitForEnemies: async (timeout = 20000) => {
        await page.waitForFunction(
          () => (window as unknown as { __GAME__: { getSnapshot(): { activeEnemies: number } } }).__GAME__.getSnapshot().activeEnemies > 0,
          { timeout }
        );
      },

      startGame: async () => {
        await page.evaluate(
          () => (window as unknown as { __GAME__: { startGame(): void } }).__GAME__.startGame()
        );
      },

      startDeterministic: async () => {
        await page.evaluate(
          () => (window as unknown as { __GAME__: { startDeterministic(): void } }).__GAME__.startDeterministic()
        );
      },

      freezeStarfield: async () => {
        await page.evaluate(
          () => (window as unknown as { __GAME__: { freezeStarfield(): void } }).__GAME__.freezeStarfield()
        );
      },

      clickCanvas: async (worldX: number, worldY: number) => {
        const box = await page.locator('canvas').boundingBox();
        if (!box) throw new Error('Canvas not found');
        const scaleX = box.width / 1920;
        const scaleY = box.height / 1080;
        await page.mouse.click(
          box.x + worldX * scaleX,
          box.y + worldY * scaleY
        );
      },

      stepFrames: async (frames: number, deltaMs?: number) => {
        await page.evaluate(
          ({ frames, deltaMs }) => (window as unknown as {
            __GAME__: { stepFrames(f: number, d?: number): void }
          }).__GAME__.stepFrames(frames, deltaMs),
          { frames, deltaMs }
        );
      },

      seedRandom: async (seed: number) => {
        await page.evaluate(
          (s) => (window as unknown as {
            __GAME__: { seedRandom(s: number): void }
          }).__GAME__.seedRandom(s),
          seed
        );
      },
    };

    await use(helpers);
  },
});

export { expect };
