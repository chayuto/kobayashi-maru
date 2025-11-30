# Refactor: Centralized Input Manager

## Objective
Create a centralized `InputManager` to handle all user input (keyboard, mouse, touch) and map them to logical game actions.

## Context
Input handling is currently scattered. `PlacementSystem` handles mouse clicks for placement, `Game.ts` handles some initialization clicks. There is no unified way to handle "Pause", "Menu", or "Fire" actions, making it hard to add key rebinding or gamepad support.

## Requirements

### 1. Input Manager (`src/core/InputManager.ts`)
- Listen for DOM events (keydown, keyup, mousedown, mouseup, touchstart, touchend).
- Maintain state of keys and pointer.
- Map physical keys (e.g., 'KeyW', 'ArrowUp') to logical actions (e.g., `Action.MOVE_UP`).

### 2. Action Mapping
- Define `GameAction` enum:
  - `SELECT_TURRET_1`, `SELECT_TURRET_2`
  - `CANCEL_PLACEMENT`
  - `PAUSE_GAME`
  - `CONFIRM`
- Allow remapping keys to actions.

### 3. Refactor PlacementSystem
- Remove direct DOM event listeners.
- Subscribe to `InputManager` events or poll `InputManager` state.
- Use `InputManager.getPointerPosition()` instead of calculating it manually.

## Acceptance Criteria
- [ ] `InputManager` class implemented.
- [ ] Key rebinding support (data structure level).
- [ ] `PlacementSystem` uses `InputManager`.
- [ ] No direct `addEventListener` in `Game.ts` or systems (except for `InputManager`).

## Files to Create/Modify
- `src/core/InputManager.ts` (NEW)
- `src/game/placementSystem.ts`
- `src/core/Game.ts`
