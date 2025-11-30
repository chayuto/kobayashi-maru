# Task 09: Spatial Hashing System

## Objective
Implement a Spatial Hash Grid to optimize spatial queries (collision detection, range checks).

## Context
Checking every entity against every other entity is O(N^2). A spatial grid reduces this to near O(N) by only checking nearby entities.

## Requirements

### 1. SpatialHashGrid Class (`src/core/SpatialHashGrid.ts`)
- **Properties:**
  - `cellSize`: number (e.g., 64 or 128)
  - `buckets`: Map<string, Set<eid>>
- **Methods:**
  - `insert(eid, x, y)`: Add entity to bucket(s).
  - `remove(eid)`: Remove entity.
  - `update(eid, oldX, oldY, newX, newY)`: Move entity between buckets.
  - `query(x, y, radius)`: Return entities in nearby buckets.
  - `clear()`: Reset the grid (call every frame or update dynamically).

### 2. Integration
- Create a global `SpatialHashGrid` instance in `Game`.
- Update the grid in the `MovementSystem` or a dedicated `SpatialSystem`.

## Acceptance Criteria
- [ ] Entities are correctly inserted into the grid.
- [ ] Querying a location returns nearby entities.
- [ ] Performance is better than brute force for high entity counts (can be verified later).
- [ ] Unit tests for the grid logic.

## Files to Create/Modify
- `src/core/SpatialHashGrid.ts`
- `src/core/Game.ts`
