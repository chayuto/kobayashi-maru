# Batch 14 -- Particles & Effects Tests

**Date:** 2026-02-15

## Summary

Created comprehensive test suite for the particle system sub-components and effect presets.

## Files Created

- `src/__tests__/particlesAndEffects.test.ts` (54 tests)

## Source Files Covered

- `src/rendering/particles/ParticlePool.ts`
- `src/rendering/particles/ParticleEmitter.ts`
- `src/rendering/particles/ParticleRenderer.ts`
- `src/rendering/effectPresets.ts`

## Test Breakdown

### ParticlePool (9 tests)
- Acquire from empty pool creates fresh particle with correct defaults
- Pool size tracking (empty, after release)
- Reuse of released particles
- Sprite removal from container on release
- Trail cleanup on release
- Trail position reset on re-acquire
- Pool clear functionality

### ParticleEmitter (10 tests)
- Velocity output for all 6 emitter patterns (CIRCULAR, CONE, RING, SPIRAL, BURST, FOUNTAIN)
- Speed within configured min/max range
- Default pattern fallback to CIRCULAR
- Spiral counter increment and reset
- CONE fallback to spread when emitterWidth is absent
- FOUNTAIN upward velocity direction

### ParticleRenderer (13 tests)
- drawParticle for all 7 sprite types (circle, square, star, spark, smoke, fire, energy)
- renderTrail no-op when trail is undefined or has <2 positions
- renderTrail segment rendering with 2+ positions
- interpolateColorGradient: empty gradient, single stop, two-stop interpolation, multi-stop segment selection
- Color values at normalizedLife=0 and normalizedLife=1

### Effect Presets (22 tests)
- Individual preset validation for 13 named effects
- Cross-preset invariants: valid speed/life/size ranges, positive counts
- Color gradient stop ordering validation
- Pattern-specific properties (trails, bounce physics, gravity, scale animation)

## Validation

- `npm test -- particlesAndEffects` -- 54 passed
- `npm run test` -- No regressions (3 pre-existing failures in unrelated files)
