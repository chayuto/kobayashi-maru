# Batch 21: Game & Bootstrap Tests

**Date:** 2026-02-15
**File:** `src/__tests__/gameOrchestration.test.ts`

## Summary

Added 28 tests covering the `Game` class (`src/core/Game.ts`) and `GameBootstrap` (`src/core/bootstrap/GameBootstrap.ts`) public API surface.

## What was tested

### Game class (26 tests)
- **init()**: First-time initialization, idempotency guard, manager creation, resize handler setup, gameplay/UI/loop callback wiring
- **start()**: Game loop start after init, error when called before init
- **pause()**: Delegates to gameplay manager, loop manager, and UI controller
- **resume()**: Delegates to gameplay manager, loop manager, and UI controller
- **restart()**: Hides game over screen, restarts gameplay, clears pools, deselects turret
- **isPaused()**: Returns loop manager paused state (true and false cases)
- **destroy()**: Cleans up all managers (AI debug, input, UI, gameplay, render, loop, pool), resets services, destroys PixiJS app, removes resize listener, allows re-initialization
- **Cheat modes**: toggleGodMode, toggleSlowMode, isGodModeEnabled, getSpeedMultiplier delegation
- **AI auto-play**: toggleAI, isAIEnabled, getAIStatus delegation
- **Service getters**: getCollisionSystem, getDamageSystem

### GameBootstrap (2 tests)
- bootstrapGame convenience function call forwarding
- Bootstrap result (app + world) passthrough

## Approach

Heavy module-level mocking with `vi.hoisted()` + `vi.mock()` to isolate the Game facade from its many dependencies (16 ECS systems, 5 managers, AI modules, services container, PoolManager). Constructor mocks use regular `function` expressions (not arrow functions) to support `new` invocation.

## Validation

- `npm test -- gameOrchestration`: 28/28 passed
- `npm run test`: 2224/2224 passed (95 test files, no regressions)
- `npm run lint`: No new lint errors (12 pre-existing errors in other files)
