# Core Managers Full Tests (Batch 19)

**Date:** 2026-02-15

## Summary

Created comprehensive test file `src/__tests__/coreManagersFull.test.ts` with 79 tests covering the four core manager classes.

## Files Created

- `src/__tests__/coreManagersFull.test.ts` — 79 tests across 4 describe blocks

## Test Coverage

### RenderManager (16 tests)
- `init`: First-time initialization of rendering services, idempotent guard
- `setRenderSystem`: Storing and invoking the ECS render system
- `updateEffects`: Delegating to particle system, shockwave, explosion, beam renderers
- `updateBackground`: Starfield update with default and custom scroll values
- `render`: Full render pipeline (render system, beams, health bars, shields, turret visuals)
- `applyPostEffects`: Screen shake offset application
- `shake`: Screen shake trigger with default/custom parameters
- `createExplosion`: Small vs large explosion selection based on size
- `createParticleBurst`: Particle spawn delegation
- `getStats`: Render statistics retrieval
- `destroy`: Cleanup and re-initialization capability

### UIController (18 tests)
- `init`: HUD manager initialization, turret menu wiring, game over/pause overlay callbacks, idempotent guard
- `setCallbacks`: Merging callbacks
- `updateHUD`: Snapshot-to-HUD data mapping, combat stats integration
- `addLogMessage`, `updateAI`, `addAIMessage`: HUD manager delegation
- Overlays: Show/hide game over screen, show/hide pause overlay
- Turret upgrade panel: Show with turret info/resources, null guard for panel/turret info, hide, connect callbacks
- `destroy`: Cleanup and re-initialization

### InputRouter (14 tests)
- `on`/`emit`: Callback registration, unsubscribe function
- Keyboard handling: PAUSE (Escape while playing), RESUME (Escape while paused), RESTART (r/R while paused/game over), TOGGLE_DEBUG (Ctrl+d), state mismatch rejection
- `addKeyBinding`/`removeKeyBinding`: Custom binding management
- Turret selection: Default ID, deselect with event emission, no-op when already deselected
- `destroy`: Listener cleanup and callback clearing

### GameplayManager (31 tests)
- `init`: Event subscription, wave manager initialization, game state + wave start
- `update`: Game time accumulation, manager delegation
- `pause`/`resume`: State transitions with guards
- Cheat modes: God mode toggle, slow mode toggle, speed multiplier
- `getSnapshot`: Full gameplay snapshot composition
- Getters: Kobayashi Maru ID, game time, kill count defaults
- `setCallbacks`: Callback merging
- Event handlers: ENEMY_KILLED (remove enemy, add resources, increment kills, callback), WAVE_STARTED, WAVE_COMPLETED
- `restart`: Manager resets, wave re-initialization, state transitions
- `destroy`: Event unsubscription, state cleanup

## Validation

- `npm run test -- coreManagersFull`: 79/79 passed
- `npm run test` (full suite): 2224/2224 passed (95 test files)
- `npm run lint`: No errors in new file (pre-existing errors in other files)
