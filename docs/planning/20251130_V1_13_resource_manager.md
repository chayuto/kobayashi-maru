# Task 13: Resource Manager

## Objective
Implement an economy system for purchasing turrets.

## Context
Players need resources ("Replication Matter") to build defenses. Resources are gained by defeating enemies.

## Requirements

### 1. Resource Manager (`src/game/ResourceManager.ts`)
- **Properties:**
  - `resources`: number (current amount)
- **Methods:**
  - `add(amount)`: Increase resources.
  - `spend(amount)`: Decrease resources (return boolean if successful).
  - `canAfford(amount)`: Check if enough resources.

### 2. Integration
- **Starting Resources:** Set initial amount (e.g., 500).
- **Earning:** Call `add()` when an enemy is destroyed in `CollisionSystem`.
- **Spending:** Call `spend()` in `PlacementManager` before placing a turret.

## Acceptance Criteria
- [ ] Player starts with fixed resources.
- [ ] Placing a turret deducts resources.
- [ ] Cannot place turret if insufficient resources.
- [ ] Destroying enemies adds resources.

## Files to Create/Modify
- `src/game/ResourceManager.ts`
- `src/game/PlacementManager.ts`
- `src/ecs/systems/collisionSystem.ts`
