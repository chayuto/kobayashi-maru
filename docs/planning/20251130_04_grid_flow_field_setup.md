# Task 04: Grid and Flow Field Setup

## Objective
Create the grid system and data structures needed for flow field pathfinding, which will guide enemy entities toward the Kobayashi Maru.

## Context
The V0 plan specifies using Flow Fields for pathfinding to efficiently move thousands of entities without individual A* paths. This task sets up the grid infrastructure.

## Requirements

### 1. Create Grid System (`src/pathfinding/grid.ts`)
- Define grid cell size (e.g., 32x32 pixels)
- Calculate grid dimensions from WORLD_WIDTH/HEIGHT
- `Grid.getCellIndex(x, y)` - convert world position to grid cell index
- `Grid.getCellCenter(cellIndex)` - get world position of cell center
- `Grid.getNeighbors(cellIndex)` - get adjacent cells (4-directional or 8-directional)

### 2. Create Cost Field (`src/pathfinding/costField.ts`)
- Store movement cost for each grid cell (1 = walkable, 255 = obstacle)
- Initialize all cells to base cost of 1
- `CostField.setCost(cellIndex, cost)` - set obstacle costs
- `CostField.getCost(cellIndex)` - retrieve cell cost
- Support dynamic obstacle updates

### 3. Create Integration Field (`src/pathfinding/integrationField.ts`)
- Store distance-to-goal values using Dijkstra's algorithm
- `IntegrationField.calculate(goalCell, costField)` - compute distances from goal
- Use priority queue for efficient calculation
- Handle unreachable cells (value = MAX_INT)

### 4. Create Flow Field (`src/pathfinding/flowField.ts`)
- Store normalized direction vectors for each cell
- `FlowField.generate(integrationField)` - compute directions from integration field
- Each cell points toward the neighbor with lowest integration value
- `FlowField.getDirection(x, y)` - get flow direction at world position

### 5. Create Pathfinding Index (`src/pathfinding/index.ts`)
- Export all pathfinding modules
- Create convenience function to generate complete flow field from goal position

## Acceptance Criteria
- [ ] Grid converts between world and cell coordinates correctly
- [ ] Cost field stores and retrieves cell costs
- [ ] Integration field calculates distances from goal
- [ ] Flow field generates direction vectors
- [ ] Flow field updates when goal changes
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/pathfinding/grid.ts` (new)
- `src/pathfinding/costField.ts` (new)
- `src/pathfinding/integrationField.ts` (new)
- `src/pathfinding/flowField.ts` (new)
- `src/pathfinding/index.ts` (new)

## Technical Notes
- Use TypedArrays (Float32Array, Uint8Array) for performance
- Grid cell size of 32px with 1920x1080 world = 60x34 = 2040 cells
- Dijkstra's algorithm uses a min-heap priority queue
- Direction vectors should be normalized (length 1)
- Consider using gl-matrix vec2 for vector operations
