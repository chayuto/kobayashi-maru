# Task I: Migrate Test Files (Batch 1)

**Goal:** Fix `addComponent` parameter order in the first batch of test files.

**Prerequisites:** Task B

**Files to Modify:**
- `src/__tests__/abilitySystem.test.ts`
- `src/__tests__/aiSystem.test.ts`
- `src/__tests__/AudioManager.test.ts`
- `src/__tests__/BeamRenderer.test.ts`
- `src/__tests__/BinaryHeap.test.ts`
- `src/__tests__/bossWaves.test.ts`
- `src/__tests__/collisionSystem.test.ts`
- `src/__tests__/combatSystem.test.ts`
- `src/__tests__/damageSystem.test.ts`
- `src/__tests__/DebugManager.test.ts`
- `src/__tests__/ecs.test.ts`
- `src/__tests__/enemyCollisionSystem.test.ts`
- `src/__tests__/enemyProjectileSystem.test.ts`
- `src/__tests__/enemyRotationSystem.test.ts`
- `src/__tests__/enemyVariants.test.ts`
- `src/__tests__/entityPool.test.ts`
- `src/__tests__/EventBus.test.ts`
- `src/__tests__/ExplosionManager.test.ts`
- `src/__tests__/game.test.ts` (if exists, or similar core tests)
- `src/__tests__/GameInputHandler.test.ts`
- `src/__tests__/GameOverScreen.test.ts`
- `src/__tests__/gameState.test.ts`
- `src/__tests__/GestureManager.test.ts`
- `src/__tests__/GlowManager.test.ts`
- `src/__tests__/highScoreManager.test.ts`

*(Note: Adjust list based on actual alphabetical order of files present)*

**Steps:**
1. Open each file.
2. Find `addComponent(world, Component, eid)` (also check for `addEntity` usage contexts).
3. Replace with `addComponent(world, eid, Component)`.

**Verification:**
- `npm test <filename>` passes for modified files.
