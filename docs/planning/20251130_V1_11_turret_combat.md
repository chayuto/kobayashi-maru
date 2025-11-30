# Task 11: Turret Combat System

## Objective
Implement turret targeting and firing logic.

## Context
Turrets need to detect enemies within range, rotate to face them, and fire projectiles.

## Requirements

### 1. Turret System (`src/ecs/systems/turretSystem.ts`)
- Create `turretSystem(world)`.
- Query entities with `Position`, `Turret` (Range, Cooldown), and `Sprite`.
- **Logic:**
  - **Targeting:**
    - If no target, query Spatial Grid for nearest enemy within `Range`.
    - Store target ID in `Target` component.
  - **Tracking:**
    - If has target, check if still valid (alive, in range).
    - Rotate turret sprite to face target.
  - **Firing:**
    - If `Cooldown.current <= 0` and has target:
      - Spawn projectile (using `EntityFactory`).
      - Reset `Cooldown`.
    - Decrement `Cooldown` by `deltaTime`.

## Acceptance Criteria
- [ ] Turrets detect enemies in range.
- [ ] Turrets rotate to face target.
- [ ] Turrets fire projectiles at the correct rate.
- [ ] Turrets stop firing if target dies or leaves range.

## Files to Create/Modify
- `src/ecs/systems/turretSystem.ts`
