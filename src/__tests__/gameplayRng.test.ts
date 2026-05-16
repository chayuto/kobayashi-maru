/**
 * Tests for the seeded gameplay RNG.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  seedGameplayRng,
  resetGameplayRng,
  isGameplayRngSeeded,
  randomFloat,
} from '../utils/gameplayRng';

describe('gameplayRng', () => {
  afterEach(() => {
    // Module-level state — reset so tests do not leak into each other.
    resetGameplayRng();
    vi.restoreAllMocks();
  });

  describe('seed state', () => {
    it('should report not seeded by default', () => {
      expect(isGameplayRngSeeded()).toBe(false);
    });

    it('should report seeded after seedGameplayRng', () => {
      seedGameplayRng(123);
      expect(isGameplayRngSeeded()).toBe(true);
    });

    it('should report not seeded after resetGameplayRng', () => {
      seedGameplayRng(123);
      resetGameplayRng();
      expect(isGameplayRngSeeded()).toBe(false);
    });
  });

  describe('unseeded mode', () => {
    it('should delegate to Math.random when not seeded', () => {
      const spy = vi.spyOn(Math, 'random').mockReturnValue(0.42);
      expect(randomFloat()).toBe(0.42);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should return values in [0, 1)', () => {
      for (let i = 0; i < 100; i++) {
        const v = randomFloat();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });
  });

  describe('seeded mode', () => {
    it('should return values in [0, 1)', () => {
      seedGameplayRng(987654);
      for (let i = 0; i < 100; i++) {
        const v = randomFloat();
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThan(1);
      }
    });

    it('should produce an identical sequence for the same seed', () => {
      seedGameplayRng(424242);
      const runA = Array.from({ length: 50 }, () => randomFloat());

      seedGameplayRng(424242);
      const runB = Array.from({ length: 50 }, () => randomFloat());

      expect(runB).toEqual(runA);
    });

    it('should produce different sequences for different seeds', () => {
      seedGameplayRng(1);
      const runA = Array.from({ length: 50 }, () => randomFloat());

      seedGameplayRng(2);
      const runB = Array.from({ length: 50 }, () => randomFloat());

      expect(runB).not.toEqual(runA);
    });

    it('should not call Math.random when seeded', () => {
      const spy = vi.spyOn(Math, 'random');
      seedGameplayRng(7);
      randomFloat();
      expect(spy).not.toHaveBeenCalled();
    });

    it('should resume Math.random delegation after reset', () => {
      seedGameplayRng(7);
      randomFloat();
      resetGameplayRng();
      vi.spyOn(Math, 'random').mockReturnValue(0.99);
      expect(randomFloat()).toBe(0.99);
    });
  });
});
