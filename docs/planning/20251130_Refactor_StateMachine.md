# Refactor: Game State Machine

## Objective
Implement a formal State Machine to manage game states (Menu, Playing, Paused, GameOver) and their transitions, cleaning up `Game.ts`.

## Context
`Game.ts` currently manages state via a simple `GameState` class and boolean flags. Logic for entering/exiting states (e.g., showing/hiding UI, pausing systems) is scattered in `Game.ts`.

## Requirements

### 1. State Interface (`src/core/fsm/State.ts`)
- Interface `State`:
  - `enter()`: Called when entering state.
  - `exit()`: Called when exiting state.
  - `update(deltaTime)`: Called every frame.

### 2. State Machine (`src/core/fsm/StateMachine.ts`)
- Manages current state.
- `changeState(newState)`: Handles calling `exit()` on old and `enter()` on new.

### 3. Concrete States
- `MenuState`: Shows menu, waits for start.
- `PlayingState`: Runs game loop systems.
- `PausedState`: Stops updates, shows pause menu.
- `GameOverState`: Shows game over screen, waits for restart.

### 4. Refactor Game.ts
- `Game.ts` should delegate `update` to `StateMachine.update()`.
- Move system update calls (movement, collision, etc.) into `PlayingState`.

## Acceptance Criteria
- [ ] `StateMachine` implemented.
- [ ] `Game.ts` update loop delegates to state machine.
- [ ] Pause functionality works correctly (stops game time/systems).
- [ ] Restart functionality works cleanly.

## Files to Create/Modify
- `src/core/fsm/State.ts` (NEW)
- `src/core/fsm/StateMachine.ts` (NEW)
- `src/game/states/MenuState.ts` (NEW)
- `src/game/states/PlayingState.ts` (NEW)
- `src/game/states/GameOverState.ts` (NEW)
- `src/core/Game.ts`
