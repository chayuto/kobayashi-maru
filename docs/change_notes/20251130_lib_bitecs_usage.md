# Library Usage: bitECS (v0.3.40)

## Overview
bitECS is the Entity Component System (ECS) framework driving the game logic. It uses Structure-of-Arrays (SoA) data layout with TypedArrays, ensuring CPU cache friendliness and zero garbage collection overhead during the game loop.

## Current Implementation

### 1. Components (`src/ecs/components.ts`)
Components are defined as schemas of TypedArrays:
```typescript
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});
```
- **Data Locality**: All `x` positions are stored contiguously in memory.
- **Access**: `Position.x[eid]` gives direct access to the value.

### 2. Systems (`src/systems/*.ts`)
Systems are functions that process entities matching specific queries:
- **Queries**: `defineQuery([Position, Velocity])` creates a cached list of matching entities.
- **Execution**: Systems iterate over these arrays.
```typescript
const entities = movementQuery(world);
for (let i = 0; i < entities.length; i++) {
  const eid = entities[i];
  // Logic here
}
```

### 3. Entity Management (`src/ecs/entityFactory.ts`)
- **Creation**: `addEntity(world)` reserves an ID.
- **Component Assignment**: `addComponent(world, Component, eid)` allocates storage.
- **Pooling**: We implement a custom `EntityPool` (`src/ecs/entityPool.ts`) to reuse entity IDs and reset component data, preventing memory fragmentation.

## Best Practices for Extension
- **Strict Data/Logic Separation**: Systems should only contain logic; Components should only contain data.
- **Avoid Object Allocation**: Do not create objects inside the system loop. Use pre-allocated arrays or static variables.
- **Query Optimization**: Use `enterQuery` and `exitQuery` for one-time setup/teardown logic (e.g., spawning effects).
- **Component Granularity**: Keep components small and focused (e.g., `Health`, `Shield`, `Armor` instead of one giant `Stats` component).

## Optimization Opportunities
- **Multithreading**: bitECS is designed to work with Web Workers. Systems could be offloaded to separate threads.
- **SIMD**: While JS doesn't support explicit SIMD yet, SoA layout helps the browser's JIT compiler vectorize operations.
