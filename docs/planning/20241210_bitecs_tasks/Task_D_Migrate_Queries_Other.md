# Task D: Migrate Queries (Rendering/Game/Core)

**Goal:** Replace `defineQuery` with `query()` in rendering, game, and core files.

**Prerequisites:** Task B

**Files to Modify (9):**
- `src/rendering/ShieldRenderer.ts`
- `src/rendering/PlacementRenderer.ts`
- `src/rendering/HealthBarRenderer.ts`
- `src/rendering/RenderingSystem.ts`
- `src/rendering/TurretUpgradeVisuals.ts`
- `src/game/PlacementManager.ts`
- `src/core/Game.ts`
- `src/core/GameInputHandler.ts`
- `src/core/managers/InputRouter.ts`

**Steps:**
Follow the same pattern as Task C: defineQuery removal and replacement with direct `query(world, [...])` calls.

**Example:**
```typescript
// Before
const turretQuery = defineQuery([Position, Turret]);
const entities = turretQuery(world);

// After
// import { query } from 'bitecs';
const entities = query(world, [Position, Turret]);
```

**Verification:**
- No TypeScript errors regarding `defineQuery` in these files.
