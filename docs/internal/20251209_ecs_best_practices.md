# ECS Best Practices
**Date:** 2024-05-22
**Status:** Active

## Overview

Specific guidelines for working with `bitECS` in this project.

## Components (`src/ecs/components.ts`)

- **Definition**: Use `defineComponent`.
- **Types**: Use typed arrays (Types.f32, Types.i8, etc.) for minimal memory usage.
- **Naming**: PascalCase (e.g., `Position`, `Velocity`).

```typescript
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});
```

- **Flags**: Use Tag Components (empty components) for boolean states.
```typescript
export const IsEnemy = defineComponent(); // Tag
```

## Systems (`src/systems/`)

- **Definition**: A function that takes `world` and optional `dt`.
- **Queries**: Define queries outside the function scope.

```typescript
const movementQuery = defineQuery([Position, Velocity]);

export const createMovementSystem = () => {
  return (world: IWorld, dt: number) => {
    const entities = movementQuery(world);
    for (let i = 0; i < entities.length; i++) {
      const eid = entities[i];
      Position.x[eid] += Velocity.x[eid] * dt;
      Position.y[eid] += Velocity.y[eid] * dt;
    }
  };
};
```

## Entity Lifecycle

- **Creation**: Use `addEntity(world)` or `EntityFactory` helpers.
- **Destruction**: Use `removeEntity(world, eid)`.
- **Component Management**: `addComponent(world, Component, eid)` / `removeComponent(world, Component, eid)`.

## Pitfalls to Avoid

1. **Stale Entities**: If you store an entity ID in a component (e.g., `Target.id[eid]`), ensure you check if that target still exists before accessing it.
2. **Reactive Logic**: ECS is polled, not event-driven. If you need event-like behavior (e.g., "OnDeath"), use a transient component (e.g., `JustDied`) that is removed at the end of the frame, or check for state changes.
3. **Sparse Arrays**: bitECS handles sparse data well, but iterating over all entities to check for one component is slow. Always use queries.
