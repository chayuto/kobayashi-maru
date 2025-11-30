# Task 05: Flow Field Movement Integration

## Objective
Integrate the flow field pathfinding with the movement system so enemies navigate toward the Kobayashi Maru using the flow field.

## Context
Task 04 created the flow field infrastructure. This task connects it to the existing movement system so entities follow the flow field directions.

## Requirements

### 1. Create Flow Field Movement System (`src/systems/flowFieldMovementSystem.ts`)
- Create a bitECS system for flow field-guided movement
- Query entities with Position, Velocity, and a new FlowFieldFollower component
- Each frame:
  1. Get entity's current cell from position
  2. Look up flow direction for that cell
  3. Set velocity based on flow direction and entity speed
  4. Apply velocity to position

### 2. Add FlowFieldFollower Component (`src/ecs/components.ts`)
- `FlowFieldFollower.speed: Types.f32` - entity's movement speed
- `FlowFieldFollower.enabled: Types.ui8` - 0/1 flag for enabling/disabling

### 3. Initialize Flow Field in Game
- Create flow field with Kobayashi Maru position as goal
- Store flow field reference in Game class
- Pass flow field to movement system

### 4. Spawn Enemies as Flow Field Followers
- Update entity factory to add FlowFieldFollower component to enemies
- Set appropriate speeds per faction:
  - Klingon: 120 (fast)
  - Romulan: 80 (medium)
  - Borg: 40 (slow)
  - Tholian: 60 (medium-slow)
  - Species 8472: 100 (fast)

### 5. Visual Debug Mode (Optional)
- Add debug rendering to visualize flow field arrows
- Toggle with keyboard key (e.g., 'D')

## Acceptance Criteria
- [ ] Enemies navigate toward Kobayashi Maru using flow field
- [ ] Different factions move at different speeds
- [ ] Movement is smooth and natural-looking
- [ ] Flow field updates if goal position changes
- [ ] Performance maintains 60 FPS with 5,000 following entities
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/systems/flowFieldMovementSystem.ts` (new)
- `src/systems/index.ts` (modify to export)
- `src/ecs/components.ts` (modify - add FlowFieldFollower)
- `src/ecs/entityFactory.ts` (modify - use FlowFieldFollower)
- `src/core/Game.ts` (modify - initialize and use flow field)

## Technical Notes
- Flow field lookup should be O(1) using cell index
- Interpolate between cell directions for smoother movement
- Consider adding small random offset to prevent perfect stacking
- Speed values are in pixels per second
