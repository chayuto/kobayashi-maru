# Task 10: Collision System

## Objective
Implement collision detection between projectiles and ships/enemies.

## Context
Projectiles need to hit targets to deal damage. We will use the Spatial Hash Grid from Task 09 to efficiently find potential collisions.

## Requirements

### 1. Collision System (`src/ecs/systems/collisionSystem.ts`)
- Create `collisionSystem(world)`.
- Query entities with `Position` and `Collider` (or just check all projectiles).
- **Logic:**
  - For each projectile:
    - Query Spatial Grid for nearby enemies.
    - Check distance < (radiusA + radiusB).
    - If collision:
      - Apply damage to target (reduce `Health`).
      - Destroy projectile (remove entity).
      - Trigger impact effect (optional).

### 2. Health Check
- If `Health.current <= 0`, destroy the entity.
- Spawn explosion/debris (optional).

## Acceptance Criteria
- [ ] Projectiles hit enemies.
- [ ] Enemies take damage.
- [ ] Projectiles are destroyed on impact.
- [ ] Enemies are destroyed when health reaches zero.

## Files to Create/Modify
- `src/ecs/systems/collisionSystem.ts`
- `src/ecs/components.ts` (add Collider if needed)
