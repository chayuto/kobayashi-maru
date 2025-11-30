# Refactor: ECS System Standardization

## Objective
Standardize all systems to follow the functional ECS pattern used by `bitecs`, ensuring consistency and performance.

## Context
Most systems are factories returning a closure (`createMovementSystem`), but `PlacementSystem` is a class. Some systems might hold state incorrectly.

## Requirements

### 1. Standard System Signature
- `export function createXSystem(dependencies...)`
- Returns: `(world: IWorld, delta: number) => IWorld`

### 2. Refactor Class-based Systems
- Convert `PlacementSystem` (after splitting) to functional style if possible, or clearly designate it as a "Manager" (not a System) if it doesn't process entities in bulk.
- *Note*: `PlacementManager` is likely NOT an ECS system, so renaming it clarifies intent.

### 3. System Registration
- Create a `SystemManager` or helper in `Game.ts` to register and run systems in order.
- Allow systems to define their priority/order.

## Acceptance Criteria
- [ ] All "Systems" follow the functional pattern.
- [ ] Non-system logic (like Placement) is renamed to "Manager" or "Service".
- [ ] System execution order is explicit and easy to modify.

## Files to Create/Modify
- `src/systems/index.ts`
- `src/game/placementSystem.ts` -> `src/game/PlacementManager.ts`
- `src/core/Game.ts`
