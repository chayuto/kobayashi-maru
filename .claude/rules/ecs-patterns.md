---
paths:
  - "src/ecs/**"
  - "src/systems/**"
---

# ECS Rules

- Components are TypedArray storage: access via `Component.field[entityId]`
- Systems are pure functions: `(world, deltaTime) => void`
- Define queries at module scope with `defineQuery()`, never inside system functions
- Use PoolManager for entity lifecycle — never raw `addEntity`/`removeEntity` in game logic
- Systems must not import or reference other systems directly — use EventBus
- Entity creation goes through `entityFactory.ts` or `genericFactory.ts` with templates
- Component validation only in development builds (`componentValidation.ts`)
