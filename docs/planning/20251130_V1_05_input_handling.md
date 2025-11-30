# Task 05: Input Handling System

## Objective
Implement a system to capture and process user input (Mouse/Keyboard) for game interaction.

## Context
The player needs to interact with the game world to place turrets, select units, or navigate menus. We need a centralized input manager.

## Requirements

### 1. Input Manager (`src/core/InputManager.ts`)
- **Properties:**
  - `mouse`: { x: number, y: number, isDown: boolean }
  - `keys`: Map<string, boolean> (state of keys)
- **Methods:**
  - `initialize(element: HTMLElement)`: Attach event listeners.
  - `isKeyDown(key: string)`: Check if a key is pressed.
  - `getMousePosition()`: Get current mouse coordinates relative to the canvas.

### 2. Integration
- Initialize `InputManager` in `Game.initialize()`.
- Update mouse coordinates on `mousemove`.
- Update key states on `keydown` / `keyup`.

## Acceptance Criteria
- [ ] Mouse position is tracked correctly relative to the game canvas.
- [ ] Mouse click state is tracked.
- [ ] Keyboard key states are tracked.
- [ ] Event listeners are cleaned up if necessary (though not strictly required for a singleton game).

## Files to Create/Modify
- `src/core/InputManager.ts`
- `src/core/Game.ts`
