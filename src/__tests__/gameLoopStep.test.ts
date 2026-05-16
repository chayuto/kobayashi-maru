/**
 * Tests for deterministic frame stepping in GameLoopManager.
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// ── Mock pixi.js before importing anything that depends on it ──
vi.mock('pixi.js', async () => {
  const { setupPixiMock } = await import('./helpers/mockPixi');
  return setupPixiMock();
});

import type { Application } from 'pixi.js';
import { GameLoopManager } from '../core/loop/GameLoopManager';

function makeMockApp(): Application {
  return {
    ticker: { add: vi.fn(), remove: vi.fn(), deltaMS: 16, FPS: 60 },
  } as unknown as Application;
}

describe('GameLoopManager.step', () => {
  let loop: GameLoopManager;

  beforeEach(() => {
    loop = new GameLoopManager(makeMockApp());
  });

  it('should run gameplay and physics callbacks once per frame', () => {
    let gameplay = 0;
    let physics = 0;
    loop.onGameplay(() => { gameplay++; });
    loop.onPhysics(() => { physics++; });

    loop.step(1 / 60, 10);

    expect(gameplay).toBe(10);
    expect(physics).toBe(10);
  });

  it('should run render, pre-update and UI callbacks once per frame', () => {
    let pre = 0;
    let render = 0;
    let ui = 0;
    loop.onPreUpdate(() => { pre++; });
    loop.onRender(() => { render++; });
    loop.onUI(() => { ui++; });

    loop.step(1 / 60, 5);

    expect(pre).toBe(5);
    expect(render).toBe(5);
    expect(ui).toBe(5);
  });

  it('should advance game time by the fixed delta each frame', () => {
    loop.step(0.1, 5);
    expect(loop.getGameTime()).toBeCloseTo(0.5, 6);
  });

  it('should pass the fixed delta to callbacks', () => {
    const deltas: number[] = [];
    loop.onPhysics((dt) => { deltas.push(dt); });

    loop.step(0.25, 3);

    expect(deltas).toEqual([0.25, 0.25, 0.25]);
  });

  it('should skip gameplay/physics while paused but still render', () => {
    let gameplay = 0;
    let render = 0;
    loop.onGameplay(() => { gameplay++; });
    loop.onRender(() => { render++; });
    loop.pause();

    loop.step(1 / 60, 8);

    expect(gameplay).toBe(0);
    expect(render).toBe(8);
    expect(loop.getGameTime()).toBe(0);
  });

  it('should default to a single frame', () => {
    let physics = 0;
    loop.onPhysics(() => { physics++; });

    loop.step(1 / 60);

    expect(physics).toBe(1);
  });
});
