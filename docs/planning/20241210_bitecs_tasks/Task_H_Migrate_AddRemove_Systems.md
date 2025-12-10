# Task H: Migrate add/removeComponent (Systems & Pool)

**Goal:** Fix parameter order for add/remove component in remaining systems and pool manager.

**Prerequisites:** Task B

**Files to Modify:**
- `src/systems/statusEffectSystem.ts`
- `src/ecs/PoolManager.ts`

**Steps:**
1. `statusEffectSystem.ts`:
   - Fix `addComponent` calls: `addComponent(world, eid, Component)`
   - Fix `removeComponent` calls: `removeComponent(world, eid, Component)`
2. `PoolManager.ts`:
   - Fix `removeComponent` calls: `removeComponent(world, eid, Component)`

**Reference:**
- bitECS 0.4.0: `removeComponent(world, eid, Component)`

**Verification:**
- No TypeScript errors.
