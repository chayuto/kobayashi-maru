# Refactoring: Game.ts Monolith Deconstruction

**Date:** 2025-12-07  
**Epic:** Game.ts Refactoring  
**Status:** Complete

## Overview
This document summarizes the changes made to the Kobayashi Maru codebase to refactor the monolithic `Game.ts` class into a modular, maintainable, and testable architecture. The primary goal was to improve code organization, reduce the complexity of the main game class, and implement a robust Dependency Injection system.

## Key Architectural Changes

### 1. Service Container Pattern
We introduced a **Service Container** (`src/core/services/ServiceContainer.ts`) to manage dependencies.
- **Benefits:**
  - Decoupled components.
  - Lazy initialization of services.
  - Easier testing through mock injection.
- **Implementation:** `ServiceContainer` is a singleton available via `getServices()`. All major systems (Audio, Resources, ECS, etc.) are registered here.

### 2. Bootstrapping
We extracted game initialization logic into `GameBootstrap` (`src/core/bootstrap/GameBootstrap.ts`).
- **Function:** Handles the complex sequence of initializing PixiJS, creating the ECS world, registering services, and loading resources.
- **Result:** `Game.ts` `init()` method reduced from hundreds of lines to a single call to `bootstrapGame()`.

### 3. Game Loop Manager
We created `GameLoopManager` (`src/core/loop/GameLoopManager.ts`) to formalize the game loop phases.
- **Phases:**
  1. **Pre-Update:** Input polling, background updates.
  2. **Gameplay:** Game rules, waves, scoring (pausable).
  3. **Physics:** ECS system execution (pausable).
  4. **Render:** Visual updates (always runs).
  5. **Post-Render:** Screen effects.
  6. **UI:** HUD and debug overlays.

### 4. Specialized Managers
Responsibilities previously held by `Game.ts` were moved to focused managers:
- **RenderManager** (`src/core/managers/RenderManager.ts`): Handles high-level rendering orchestration, background, and screen effects.
- **GameplayManager** (`src/core/managers/GameplayManager.ts`): Manages game state, wave spawning logic, scoring, and cheat modes (God Mode, Slow Mode).
- **UIController** (`src/core/managers/UIController.ts`): Centralized interface for HUD, Pause/Game Over screens, and notifications.
- **InputRouter** (`src/core/managers/InputRouter.ts`): Maps raw input events to semantic Game Actions (Action-based Input).

### 5. Game Facade
The original `Game.ts` was rewritten as a thin facade.
- **Size Reduction:** Reduced from ~1200 lines to ~400 lines.
- **Role:** Orchestrates the managers and provides a backward-compatible public API.
- **Compatibility:** Maintains methods like `start()`, `pause()`, `toggleGodMode()` by delegating to the appropriate manager.

## Cleanup
- **Deleted:** `src/core/Game.ts.bak` (Backup of the monolith).
- **Deleted:** `src/core/GameTurretController.ts` (Merged into placement logic).
- **Deleted:** `src/core/GameStateController.ts` (Merged into GameplayManager).
- **Deprecated:** Direct property access in `Game` class (replaced with service lookups).

## Verification
- **Compilation:** `npx tsc --noEmit` passes with 0 errors.
- **Testing:** `npm test` passes (600+ tests).
- **Runtime:** Verified stable in browser (FPS, Game Loop, UI, Input).

## Future Work
- **Integration Tests:** Add more specific integration tests for the interaction between the new managers.
- **Event Bus:** Continue migrating direct method calls to `EventBus` events where loose coupling is preferred.
