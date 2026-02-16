# Audio Concurrency Limiting

**Date:** 2026-02-16
**Branch:** feels-good

## Summary

Added per-category concurrency limiting to the AudioManager to prevent audio flooding when many entities fire simultaneously (e.g., 500+ enemies with fast-firing turrets).

## Changes

### New File: `src/config/audio.config.ts`
- Created `AUDIO_CONFIG` with concurrency limits per sound category:
  - WEAPONS: 3 simultaneous sounds
  - COMBAT: 2 simultaneous sounds
  - UI: 4 simultaneous sounds
  - AMBIENT: 2 simultaneous sounds
- Maps each `SoundType` string value to its category for lookup

### Modified: `src/config/index.ts`
- Added `export * from './audio.config'` to centralized config barrel

### Modified: `src/audio/AudioManager.ts`
- Added `activeSounds` Map tracking active count per category
- Added `categoryMap` Map for sound-type-to-category lookup
- Added `buildCategoryMap()` private method, called during `init()`
- Modified `play()` to check concurrency limits before creating a BufferSourceNode
- Added `source.onended` callback to decrement active count when sound finishes
- Public API remains unchanged

### Modified: `src/__tests__/AudioManager.test.ts`
- Updated mock `createBufferSource` to include `onended` property
- Added 8 new tests in `concurrency limiting` describe block:
  - categoryMap built correctly on init
  - Sounds allowed up to concurrency limit
  - Sounds blocked when exceeding concurrency limit
  - Per-category independence
  - Active count decremented via onended
  - onended callback is set on source nodes
  - Active count cannot go below zero

## Validation
- `npm run lint` -- passes
- `npm run test` -- 2316 tests pass (104 files)
- `npm run build` -- succeeds
