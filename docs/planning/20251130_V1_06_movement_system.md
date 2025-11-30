# Task 06: Movement System

## Objective
Implement the ECS Movement System to update entity positions based on velocity.

## Context
Entities with `Position` and `Velocity` components should move each frame. This is the most basic physics simulation.

## Requirements

### 1. Movement System (`src/ecs/systems/movementSystem.ts`)
- Create a `movementSystem(world)` function.
- Query all entities with `Position` and `Velocity`.
- **Logic:**
  - `Position.x += Velocity.x * deltaTime`
  - `Position.y += Velocity.y * deltaTime`
- Handle rotation if necessary (e.g., face direction of movement).

### 2. Integration
- Add `movementSystem` to the `Game` systems list.
- Ensure `deltaTime` is passed correctly from the game loop.

## Acceptance Criteria
- [ ] Entities with velocity move across the screen.
- [ ] Movement is framerate independent (uses delta time).
- [ ] System is registered in the main game loop.

## Files to Create/Modify
- `src/ecs/systems/movementSystem.ts`
- `src/core/Game.ts`
