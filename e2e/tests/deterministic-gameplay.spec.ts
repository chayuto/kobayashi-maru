import { test, expect } from '../fixtures/game.fixture';
import type { Page } from '@playwright/test';
import type { GameHelpers } from '../fixtures/game.fixture';
import type { GameSnapshot, EntityCounts } from '../helpers/game-bridge';

/**
 * Deterministic gameplay tests.
 *
 * These exercise the game as a player would — start a game, build a turret
 * defence, survive waves — but use `seedRandom()` + `stepFrames()` so the
 * simulation is frame-exact and wall-clock independent. A 30-second battle
 * runs in milliseconds and produces the same result every time, which lets
 * us assert on exact state instead of loose bounds with generous timeouts.
 *
 * The AI Commander autoplay is disabled for the reproducibility tests so the
 * test harness is the sole actor — its economic micro-decisions still carry
 * a small residual nondeterminism. The AI path is covered separately by the
 * "AI Commander" functional test with loose bounds.
 */
test.describe('Deterministic Gameplay', () => {
  test.setTimeout(60000);

  interface RunResult {
    snapshot: GameSnapshot;
    counts: EntityCounts;
  }

  /** The full set of state proven reproducible under a fixed seed. */
  function deterministicState(run: RunResult) {
    return {
      wave: run.snapshot.wave,
      waveState: run.snapshot.waveState,
      activeEnemies: run.snapshot.activeEnemies,
      kmHealth: run.snapshot.kmHealth,
      kmMaxHealth: run.snapshot.kmMaxHealth,
      enemiesDefeated: run.snapshot.score.enemiesDefeated,
      comboCount: run.snapshot.score.comboCount,
      maxCombo: run.snapshot.score.maxCombo,
      resources: run.snapshot.resources,
      turrets: run.counts.turrets,
      enemies: run.counts.enemies,
    };
  }

  /**
   * Play a full defended battle: seed the RNG, start a game with the wall
   * clock frozen, disable the AI Commander, build a cardinal ring of torpedo
   * turrets around the Kobayashi Maru, then advance exactly `frames` frames.
   */
  async function playSeededBattle(
    page: Page,
    game: GameHelpers,
    seed: number,
    frames = 1800,
  ): Promise<RunResult> {
    await page.goto('/');
    await game.waitForGameReady();
    await game.seedRandom(seed);
    await game.startDeterministic();
    await page.evaluate(() => {
      if (window.__GAME__.isAIEnabled()) window.__GAME__.toggleAI();
    });
    await game.waitForState('PLAYING');
    await game.freezeStarfield();
    await page.evaluate(() => window.__GAME__.setResources(99999));
    // Player builds a defensive ring around the KM at (960, 540).
    await page.evaluate(() => {
      window.__GAME__.placeTurret(1, 960, 340);
      window.__GAME__.placeTurret(1, 960, 740);
      window.__GAME__.placeTurret(1, 660, 540);
      window.__GAME__.placeTurret(1, 1260, 540);
    });
    await game.clearEvents();
    await game.stepFrames(frames);
    return { snapshot: await game.getSnapshot(), counts: await game.getEntityCounts() };
  }

  test('a seeded battle is byte-for-byte reproducible', async ({ page, game }) => {
    const runA = await playSeededBattle(page, game, 424242);
    const runB = await playSeededBattle(page, game, 424242);
    expect(deterministicState(runB)).toEqual(deterministicState(runA));
  });

  test('different seeds produce different battles', async ({ page, game }) => {
    const runA = await playSeededBattle(page, game, 1);
    const runB = await playSeededBattle(page, game, 999999);
    expect(deterministicState(runB)).not.toEqual(deterministicState(runA));
  });

  test('player defends the Kobayashi Maru and clears enemies', async ({ page, game }) => {
    const { snapshot } = await playSeededBattle(page, game, 424242);
    // The defended KM survives the battle.
    expect(snapshot.kmHealth).toBeGreaterThan(0);
    // Turrets actually destroy enemies.
    expect(snapshot.score.enemiesDefeated).toBeGreaterThan(0);
    // Waves progress over 30 simulated seconds.
    expect(snapshot.wave).toBeGreaterThanOrEqual(2);
  });

  test('enemy-kill events match the score counter', async ({ page, game }) => {
    const { snapshot } = await playSeededBattle(page, game, 424242);
    const killEvents = await game.getEventsByType('ENEMY_KILLED');
    expect(killEvents.length).toBe(snapshot.score.enemiesDefeated);
  });

  test('god mode keeps the KM at full health through a long battle', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.seedRandom(31337);
    await game.startDeterministic();
    await game.waitForState('PLAYING');
    await page.evaluate(() => window.__GAME__.toggleGodMode());
    await game.stepFrames(3600); // 60 simulated seconds, no turrets placed
    const snapshot = await game.getSnapshot();
    expect(snapshot.kmHealth).toBe(snapshot.kmMaxHealth);
  });

  test('stepFrames advances wave progression', async ({ page, game }) => {
    await page.goto('/');
    await game.waitForGameReady();
    await game.seedRandom(100);
    await game.startDeterministic();
    await game.waitForState('PLAYING');
    const before = await game.getSnapshot();
    await game.stepFrames(900); // 15 simulated seconds
    const after = await game.getSnapshot();
    expect(after.wave).toBeGreaterThanOrEqual(before.wave);
    expect(after.score.timeSurvived).toBeGreaterThan(before.score.timeSurvived);
  });

  test('the AI Commander autoplays and mounts a defence', async ({ page, game }) => {
    // AI is enabled by default — let it run and verify it functions.
    await page.goto('/');
    await game.waitForGameReady();
    await game.seedRandom(2024);
    await game.startDeterministic();
    await game.waitForState('PLAYING');
    expect(await page.evaluate(() => window.__GAME__.isAIEnabled())).toBe(true);
    const before = await game.getEntityCounts();
    await game.stepFrames(3600); // 60 simulated seconds of autoplay
    const after = await game.getEntityCounts();
    // The AI Commander builds turrets to defend the KM.
    expect(after.turrets).toBeGreaterThan(before.turrets);
  });

  test('a deterministic battle produces no page errors', async ({ page, game }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => { errors.push(error.message); });
    await playSeededBattle(page, game, 555);
    expect(errors).toEqual([]);
  });
});
