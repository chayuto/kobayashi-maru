# Task C: Migrate Queries (Systems)

**Goal:** Replace `defineQuery` with `query()` in all system files.

**Prerequisites:** Task B

**Reference:**
- bitECS 0.4.0: `defineQuery` is removed. Use `query(world, components)` directly.

**Files to Modify (17):**
- `src/systems/aiSystem.ts`
- `src/systems/projectileSystem.ts`
- `src/systems/combatSystem.ts`
- `src/systems/targetingSystem.ts`
- `src/systems/movementSystem.ts`
- `src/systems/damageSystem.ts`
- `src/systems/statusEffectSystem.ts`
- `src/systems/enemyCombatSystem.ts`
- `src/systems/enemyProjectileSystem.ts`
- `src/systems/enemyCollisionSystem.ts`
- `src/systems/turretRotationSystem.ts`
- `src/systems/enemyRotationSystem.ts`
- `src/systems/collisionSystem.ts`
- `src/systems/abilitySystem.ts`
- `src/systems/SystemManager.ts` (Update `IWorld` import if needed, ensuring it comes from 'bitecs')

**Steps for each file:**
1. Change import: `import { defineQuery } from 'bitecs';` -> `import { query } from 'bitecs';`
2. Remove module-level declarations like `const xxxQuery = defineQuery([...])`.
3. Locate usages of `xxxQuery(world)`.
4. Replace with direct call: `query(world, [ComponentA, ComponentB])`.

**Example:**
```typescript
// Before
const movementQuery = defineQuery([Position, Velocity]);
// ... inside system ...
const entities = movementQuery(world);

// After
import { query } from 'bitecs';
// ... inside system ...
const entities = query(world, [Position, Velocity]);
```

**Verification:**
- No TypeScript errors in system files regarding `defineQuery`.
