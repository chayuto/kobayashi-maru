/**
 * Seeded gameplay RNG for Kobayashi Maru.
 *
 * A single deterministic random stream for all gameplay-affecting randomness
 * (enemy spawns, speed rolls, variant/elite rolls, ability rolls, status-effect
 * procs). Kept deliberately SEPARATE from rendering and particle randomness —
 * those stay on `Math.random()` so visual effects can never desync the
 * simulation.
 *
 * Unseeded, `randomFloat()` falls back to `Math.random()`, so production
 * behaviour is byte-for-byte unchanged. Calling `seedGameplayRng()` (done by
 * the E2E test bridge) switches the stream to a deterministic mulberry32 PRNG,
 * enabling frame-exact reproducible runs when combined with fixed-timestep
 * stepping.
 *
 * @module utils/gameplayRng
 */

let state: number | null = null;

/**
 * Seed the gameplay RNG, switching it to deterministic mode.
 * @param seed - any 32-bit integer
 */
export function seedGameplayRng(seed: number): void {
  state = seed >>> 0;
}

/**
 * Clear the seed, reverting to `Math.random()` (production default).
 */
export function resetGameplayRng(): void {
  state = null;
}

/**
 * Whether the gameplay RNG is currently in deterministic (seeded) mode.
 */
export function isGameplayRngSeeded(): boolean {
  return state !== null;
}

/**
 * Returns a float in [0, 1). Deterministic (mulberry32) when seeded,
 * otherwise delegates to `Math.random()`.
 */
export function randomFloat(): number {
  if (state === null) {
    return Math.random();
  }
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
