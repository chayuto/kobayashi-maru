---
paths:
  - "src/ecs/**"
  - "src/systems/**"
---

# ECS Rules

- Components are TypedArray storage: access via `Component.field[entityId]`
- Systems are pure functions: `(world: World, deltaTime: number) => World`
- bitECS 0.4.0: use `query(world, [Component1, Component2])` to query entities
- Use PoolManager for entity lifecycle — never raw `addEntity`/`removeEntity` in game logic
- Systems must not import or reference other systems directly — use EventBus
- Entity creation goes through `entityFactory.ts` or `genericFactory.ts` with templates
- Component validation only in development builds (`componentValidation.ts`)
- World type is `World` from bitECS (not `IWorld`)
