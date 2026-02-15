# Change Notes: Audio & Wave Effects Tests

**Date:** 2026-02-15
**Batch:** 20 — Audio & Wave Effects Tests

## Summary

Created comprehensive test file `src/__tests__/audioAndWaveEffects.test.ts` with 40 tests covering three source modules:

- `src/audio/SoundGenerator.ts`
- `src/game/wave/SpawnEffects.ts`
- `src/game/wave/VariantApplier.ts`

## Test Breakdown

### SoundGenerator (22 tests)

- **generateSound dispatch** (10 tests): Verifies that each `SoundType` enum value routes to the correct creation method and returns an `AudioBuffer` with the expected duration/length.
- **createPhaserSound** (1 test): Validates buffer length and non-zero waveform data.
- **createTorpedoSound** (1 test): Validates buffer creation with expected sample count.
- **createExplosionSound** (2 tests): Tests different durations and noise-like data characteristics.
- **createBeepSound** (4 tests): Tests all four oscillator types (sine, square, sawtooth, triangle) including value range validation.
- **createWaveCompleteSound** (1 test): Validates arpeggio buffer creation with audible content.
- Default/fallback case for unknown sound types.

### SpawnEffects (5 tests)

- Setting particle system dependency without error.
- Early return (no crash) when particle system is not set.
- Elite glow: correct particle config (golden color, 15 particles, correct position).
- Boss glow: correct particle config (red color, 30 particles, correct position).
- Boss spawns more particles than elite.

### VariantApplier (13 tests)

- No-op when world dependency is not set.
- Boss variant applied when boss wave faction matches.
- Boss variant skipped when faction does not match.
- Elite variant applied when random chance succeeds.
- No elite variant when random chance fails.
- Health/shield stat multiplication for elite and boss.
- EnemyWeapon damage scaling for elite and boss.
- Sprite scale set via spriteManager for both ranks.
- Particle glow effects triggered for both ranks.
- SpecialAbility component added with correct config for boss.
- SpecialAbility not added when bossAbilities array is empty.

## Mocking Strategy

- **Web Audio API**: Custom `createMockAudioContext` that returns a mock `AudioContext` with working `createBuffer` that allocates real `Float32Array` buffers.
- **ParticleSystem**: Simple mock with `spawn` spy for verifying particle configs.
- **SpriteManager**: Simple mock with `setScale` spy.
- **bitECS**: Used real `createWorld`/`addEntity`/`addComponent` from bitecs for accurate ECS testing.
- **Math.random**: Spied on and mocked for deterministic elite/boss variant testing.

## Validation

- `npm test -- audioAndWaveEffects`: 40/40 passed
- `npm run lint`: passed (no errors)
- `npm run test` (full suite): pre-existing failures in unrelated files (uiLayout.test.ts, upgradeSystem.test.ts, systemContext.test.ts); no regressions from this change
