# Unique Weapon-Specific Sound Effects for Turret Types

**Date:** 2026-02-16
**Branch:** feels-good

## Summary

Added three unique procedural weapon sounds for Tetryon Beam, Plasma Cannon, and Polaron Beam turrets. Previously these turrets shared sounds with the base Phaser, Torpedo, and Disruptor weapons. Each new sound has a distinct audio character matching its weapon theme.

## Changes

### `src/audio/types.ts`
- Added `TETRYON_FIRE`, `PLASMA_FIRE`, `POLARON_FIRE` to the `SoundType` enum (Weapons section)

### `src/audio/SoundGenerator.ts`
- Added 3 switch cases in `generateSound()` dispatching to new static methods
- Added `createTetryonSound()` -- crystalline high-frequency oscillating beam (0.12s, two sine oscillators at 2000/3000 Hz, 20 Hz amplitude modulation shimmer, exponential decay)
- Added `createPlasmaSound()` -- low rumble with sizzle (0.35s, 150 Hz sine + filtered noise, slow 0.05s attack ramp, then exponential decay)
- Added `createPolaronSound()` -- descending warble (0.18s, frequency sweep 800 to 400 Hz, 15 Hz vibrato modulation, exponential decay)

### `src/systems/combatSystem.ts`
- Updated sound mapping for `TurretType.TETRYON_BEAM` from `PHASER_FIRE` to `TETRYON_FIRE`
- Updated sound mapping for `TurretType.PLASMA_CANNON` from `TORPEDO_FIRE` to `PLASMA_FIRE`
- Updated sound mapping for `TurretType.POLARON_BEAM` from `DISRUPTOR_FIRE` to `POLARON_FIRE`

### `src/__tests__/audioAndWaveEffects.test.ts`
- Added 3 dispatch tests in `generateSound` describe block verifying buffer creation for each new sound type
- Added `createTetryonSound` describe block (buffer length, non-zero data, decaying amplitude)
- Added `createPlasmaSound` describe block (buffer length, non-zero data, slow attack verification)
- Added `createPolaronSound` describe block (buffer length, non-zero data, decaying amplitude)

### `src/__tests__/AudioManager.test.ts`
- Updated comment reflecting new enum count (13 -> 16 sound types)

## Validation
- [x] `pnpm run test` passes (2309 tests, 104 files)
- [ ] `pnpm run lint` (run manually)
- [ ] `pnpm run build` (run manually)
