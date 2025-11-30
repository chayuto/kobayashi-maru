# Task 06: Spatial Hash Grid for Collision Detection

## Objective
Implement a spatial hash grid to enable efficient O(N) collision detection between entities instead of O(N²) brute force.

## Context
With 5,000+ entities, brute force collision detection would require 25 million checks per frame. Spatial hashing reduces this dramatically by only checking entities in nearby cells.

## Requirements

### 1. Create Spatial Hash (`src/collision/spatialHash.ts`)
- Implement a spatial hash grid data structure
- `SpatialHash.constructor(cellSize, width, height)` - initialize grid
- `SpatialHash.clear()` - remove all entities from grid
- `SpatialHash.insert(eid, x, y)` - add entity to appropriate cell
- `SpatialHash.query(x, y, radius)` - get all entities within radius
- `SpatialHash.queryRect(x, y, width, height)` - get entities in rectangle

### 2. Create Collision System (`src/systems/collisionSystem.ts`)
- Create bitECS system that updates spatial hash each frame
- Query all entities with Position component
- Clear hash at start of frame
- Insert all entities into hash based on position
- Expose method to query nearby entities

### 3. Add Collision Components (`src/ecs/components.ts`)
- `Collider.radius: Types.f32` - collision radius for the entity
- `Collider.layer: Types.ui8` - collision layer (enemies, projectiles, etc.)
- `Collider.mask: Types.ui8` - which layers this entity collides with

### 4. Integration with Game
- Initialize spatial hash in Game class
- Run collision system update each frame (before other systems need it)
- Provide API for other systems to query nearby entities

## Acceptance Criteria
- [ ] Spatial hash correctly buckets entities by position
- [ ] Query returns only entities in requested area
- [ ] Hash updates efficiently each frame
- [ ] Memory usage is bounded and predictable
- [ ] Performance is O(N) for insertion and queries
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/collision/spatialHash.ts` (new)
- `src/collision/index.ts` (new - barrel export)
- `src/systems/collisionSystem.ts` (new)
- `src/systems/index.ts` (modify to export)
- `src/ecs/components.ts` (modify - add Collider)
- `src/core/Game.ts` (modify)

## Technical Notes
- Cell size should be 2x the largest entity radius for optimal performance
- Use Map<number, Set<number>> or array-based storage for cells
- Entities on cell boundaries should be inserted into multiple cells
- Layer/mask system uses bitwise operations: `(a.layer & b.mask) !== 0`
- Typical cell size: 64-128 pixels
