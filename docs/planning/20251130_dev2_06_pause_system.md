# Task 06: Pause System

## Objective
Implement the logic to pause and resume the game loop.

## Context
Players need to be able to pause the game. This requires stopping the ECS updates while keeping the rendering (or showing a static frame) active.

## Requirements

### 1. Pause Logic (`src/core/PauseManager.ts`)
- **State:** `isPaused: boolean`
- **Methods:**
  - `pause()`: Set flag, maybe record time.
  - `resume()`: Clear flag, adjust `lastTime` to prevent huge delta time jump.
  - `toggle()`: Switch state.

### 2. Delta Time Handling
- When paused, the `deltaTime` passed to systems should be 0.
- Alternatively, the game loop simply skips the `update()` call but keeps `render()` (if separate).

## Acceptance Criteria
- [ ] Game freezes when paused.
- [ ] Game resumes smoothly without "jumping" (delta time correction).
- [ ] Can be triggered programmatically.

## Files to Create/Modify
- `src/core/PauseManager.ts`
