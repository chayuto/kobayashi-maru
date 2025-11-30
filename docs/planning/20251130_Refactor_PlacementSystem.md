# Refactor: Decouple Placement System

## Objective
Split `PlacementSystem` into `PlacementManager` (Logic) and `PlacementRenderer` (Visuals) to separate concerns and improve testability.

## Context
`PlacementSystem` currently handles:
1.  Input detection (mouse/touch).
2.  Visuals (ghost sprite, range circle).
3.  Game Logic (resource check, validity check, entity creation).
This violates Single Responsibility Principle.

## Requirements

### 1. PlacementManager (`src/game/PlacementManager.ts`)
- Pure logic class.
- Methods:
  - `startPlacing(turretType)`
  - `validatePosition(x, y)`
  - `placeTurret(x, y)`: Returns success/fail.
- No PixiJS dependencies.

### 2. PlacementRenderer (`src/rendering/PlacementRenderer.ts`)
- Handles visual feedback.
- Subscribes to `PlacementManager` events (or `EventBus`).
- Draws ghost sprite and range circle based on manager state.

### 3. Input Handling
- Use the new `InputManager` (if available) or existing input to drive `PlacementManager`.

## Acceptance Criteria
- [ ] `PlacementSystem.ts` is deleted/replaced.
- [ ] `PlacementManager` has no rendering code.
- [ ] `PlacementRenderer` handles all visuals.
- [ ] Unit tests can be written for `PlacementManager` without mocking PixiJS.

## Files to Create/Modify
- `src/game/PlacementManager.ts` (NEW)
- `src/rendering/PlacementRenderer.ts` (NEW)
- `src/game/placementSystem.ts` (DELETE/MODIFY)
- `src/core/Game.ts`
