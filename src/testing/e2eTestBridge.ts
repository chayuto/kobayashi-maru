/**
 * E2E Test Bridge for Kobayashi Maru
 *
 * Exposes game internals on `window.__GAME__` for Playwright E2E tests.
 * Only loaded in dev mode via dynamic import — tree-shaken from production.
 *
 * @module testing/e2eTestBridge
 */

import type { Game } from '../core/Game';
import { getServices } from '../core/services';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';
import { query } from 'bitecs';
import { Turret, Health, Shield } from '../ecs/components';
import { seedGameplayRng } from '../utils/gameplayRng';

interface CapturedEvent {
  type: string;
  payload: unknown;
  time: number;
}

export function installTestBridge(game: Game): void {
  const events: CapturedEvent[] = [];
  const eventBus = EventBus.getInstance();

  // Capture key events for test assertions
  const trackedEvents = [
    GameEventType.ENEMY_KILLED,
    GameEventType.WAVE_STARTED,
    GameEventType.WAVE_COMPLETED,
    GameEventType.GAME_OVER,
    GameEventType.RESOURCE_UPDATED,
    GameEventType.PLAYER_DAMAGED,
    GameEventType.COMBO_UPDATED,
  ];

  for (const eventType of trackedEvents) {
    eventBus.on(eventType, (payload: unknown) => {
      events.push({ type: eventType, payload, time: Date.now() });
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__GAME__ = {
    getSnapshot: () => {
      const services = getServices();
      const gameState = services.get('gameState');
      const waveManager = services.get('waveManager');
      const resourceManager = services.get('resourceManager');
      const scoreManager = services.get('scoreManager');
      const kmId = game.getKobayashiMaruId();
      return {
        state: gameState.getState(),
        wave: waveManager.getCurrentWave(),
        waveState: waveManager.getState(),
        activeEnemies: waveManager.getActiveEnemyCount(),
        resources: resourceManager.getResources(),
        score: scoreManager.getScoreData(),
        kmHealth: kmId >= 0 ? (Health.current[kmId] ?? 0) : 0,
        kmMaxHealth: kmId >= 0 ? (Health.max[kmId] ?? 0) : 0,
      };
    },

    getEvents: () => [...events],
    getEventsByType: (type: string) => events.filter(e => e.type === type),
    clearEvents: () => { events.length = 0; },

    startGame: () => game.startGame(),

    // Start a game and immediately freeze the wall-clock ticker, so the
    // simulation only advances via stepFrames(). This eliminates the variable
    // number of real-time frames that would otherwise tick between async test
    // steps — required for frame-exact reproducible E2E runs.
    startDeterministic: () => {
      game.startGame();
      game.stepFrames(0); // stops the ticker, advances zero frames
    },

    pause: () => game.pause(),
    resume: () => game.resume(),
    restart: () => game.restart(),
    toggleGodMode: () => game.toggleGodMode(),
    toggleAI: () => game.toggleAI(),
    isAIEnabled: () => game.isAIEnabled(),

    setResources: (amount: number) => {
      getServices().get('resourceManager').setResources(amount);
    },
    setKMHealth: (health: number) => {
      const kmId = game.getKobayashiMaruId();
      if (kmId >= 0) {
        Health.current[kmId] = health;
        Shield.current[kmId] = 0;
      }
    },
    placeTurret: (turretType: number, x: number, y: number) => {
      const pm = getServices().get('placementManager');
      pm.startPlacing(turretType);
      const result = pm.placeTurret(x, y);
      return result.success;
    },

    getEntityCounts: () => {
      return {
        turrets: query(game.world, [Turret]).length,
        enemies: getServices().get('waveManager').getActiveEnemyCount(),
      };
    },

    freezeStarfield: () => {
      getServices().get('starfield').frozen = true;
    },

    stepFrames: (frames: number, deltaMs?: number) => {
      game.stepFrames(frames, deltaMs);
    },

    // Seed the gameplay RNG so the simulation becomes reproducible. Only the
    // gameplay random stream is affected — rendering and particle randomness
    // stay on Math.random — so visual effects cannot desync the simulation.
    // Combine with stepFrames() for frame-exact deterministic runs.
    seedRandom: (seed: number) => {
      seedGameplayRng(seed);
    },

    isReady: () => true,
  };

  console.log('E2E test bridge installed');
}
