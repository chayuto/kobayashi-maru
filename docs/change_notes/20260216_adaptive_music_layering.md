# Adaptive Music Layering (A3) — Phase D

**Date:** 2026-02-16
**Branch:** `feels-good`

## Summary

Implemented adaptive music system with 4 procedural stems that crossfade based on combat intensity. All audio is generated procedurally via Web Audio API — no external audio files needed.

## Music Stems

| Stem | Frequency/Character | Intensity Range | Duration |
|------|-------------------|-----------------|----------|
| Ambient | 80 Hz drone + 120 Hz triangle, gentle breathing | Always on (fades slightly) | 4s loop |
| Build | 160 Hz pulsing bass (2 Hz rhythm) + 320 Hz harmonic | 0.15 → 0.40 | 2s loop |
| Combat | Percussion noise bursts (4 Hz) + 400 Hz tone + sub bass | 0.40 → 0.65 | 2s loop |
| Critical | 300 Hz alarm + 420 Hz tritone dissonance + fast pulse | 0.70 → 0.90 | 1s loop |

## Intensity Metric

```
intensity = 0.3 * (activeEnemies / 20)
          + 0.3 * (1 - hullPercent)
          + 0.2 * (isBossWave ? 1 : 0)
          + 0.2 * min(dps / 100, 1)
```

- Smoothed via exponential moving average (rate: 2.0)
- Gain transitions use `linearRampToValueAtTime` for click-free crossfading (150ms ramp)

## Architecture

- `MusicManager` creates 4 looping `BufferSourceNode` → `GainNode` → `musicGain` chains
- Connected to `AudioManager.musicGain` node (existing audio routing)
- Updated in gameplay callback (pauses when game pauses)
- Registered as `musicManager` in ServiceContainer
- Initialized and started after first user interaction (same as all audio)

## Files

### New
- `src/audio/MusicManager.ts` — Adaptive music manager with stem generation and crossfading
- `src/__tests__/MusicManager.test.ts` — 35 tests

### Modified
- `src/config/audio.config.ts` — Added `MUSIC` section (volume, smoothing, thresholds, weights)
- `src/audio/AudioManager.ts` — Added `getAudioContext()` and `getMusicGainNode()` accessors
- `src/audio/index.ts` — Barrel export for MusicManager
- `src/core/services/ServiceContainer.ts` — Added `musicManager` to ServiceRegistry
- `src/core/bootstrap/GameBootstrap.ts` — Registered MusicManager service, starts after audio init
- `src/core/Game.ts` — Music update in gameplay callback with snapshot data

## Validation

- **Lint:** 0 errors
- **Tests:** 110 files, 2467 tests — all pass
- **Build:** TypeScript + Vite clean
