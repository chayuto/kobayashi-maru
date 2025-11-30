# Task 03: Basic Movement System

## Objective
Create a movement system that updates entity positions based on their velocity components each frame.

## Context
Entities have Position and Velocity components defined, but no system processes them. This is the foundation for all entity movement before adding flow field pathfinding.

## Requirements

### 1. Create Movement System (`src/systems/movementSystem.ts`)
- Create a bitECS system that applies velocity to position each frame
- Query all entities with Position and Velocity components
- Apply: `Position.x += Velocity.x * deltaTime`
- Apply: `Position.y += Velocity.y * deltaTime`
- Handle delta time correctly for frame-independent movement

### 2. Add Delta Time Support
- Modify Game class to track and provide delta time
- Convert PixiJS ticker delta to seconds
- Pass delta to all systems that need it

### 3. Add Boundary Handling
- Wrap entities that go off-screen (or destroy them)
- Option A: Wrap around to opposite edge
- Option B: Destroy and return to entity pool
- Use GAME_CONFIG.WORLD_WIDTH/HEIGHT for boundaries

### 4. Test Movement
- On game init, spawn enemies with random velocities pointing toward center
- Verify entities move smoothly toward Kobayashi Maru

## Acceptance Criteria
- [ ] Movement system updates positions each frame
- [ ] Movement is frame-rate independent (uses delta time)
- [ ] Entities move smoothly at consistent speeds
- [ ] Boundary handling prevents entities going off-screen
- [ ] Performance maintains 60 FPS with 5,000 moving entities
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/systems/movementSystem.ts` (new)
- `src/systems/index.ts` (modify to export)
- `src/core/Game.ts` (modify - delta time, run movement system)

## Technical Notes
- Use `defineQuery([Position, Velocity])` for the movement query
- PixiJS ticker.deltaMS gives milliseconds, divide by 1000 for seconds
- Typical entity speed: 50-200 pixels per second
- Use `enterQuery` and `exitQuery` for handling entities added/removed mid-frame
