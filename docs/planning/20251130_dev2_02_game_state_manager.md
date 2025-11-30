# Task 02: Game State Manager

## Objective
Implement a Finite State Machine (FSM) to manage game states (Menu, Playing, Paused, GameOver).

## Context
The game currently just starts. We need a structured way to switch between different screens and states. This module will handle the logic of state transitions.

## Requirements

### 1. State Definitions (`src/core/gameState.ts`)
- **Enum:** `GameState` { MENU, PLAYING, PAUSED, GAME_OVER }
- **Interface:** `IGameState` with methods `enter()`, `exit()`, `update()`.

### 2. State Manager (`src/core/StateManager.ts`)
- **Properties:**
  - `currentState`: IGameState
- **Methods:**
  - `switchState(newState: GameState)`: Handle exit of old state and enter of new state.
  - `update(deltaTime)`: Delegate update to the current state.

### 3. State Implementations
- Create basic classes for:
  - `MenuState`
  - `PlayingState`
  - `PausedState`
  - `GameOverState`

## Acceptance Criteria
- [ ] StateManager can switch between states.
- [ ] Events `enter` and `exit` are called correctly.
- [ ] Current state can be queried.
- [ ] Independent of the main `Game` class for now (will be integrated later).

## Files to Create/Modify
- `src/core/StateManager.ts`
- `src/core/gameState.ts`
