# Task G: Migrate addComponent Order (Game)

**Goal:** Fix parameter order in game logic files.

**Prerequisites:** Task B

**Files to Modify:**
- `src/game/waveManager.ts`
- `src/game/UpgradeManager.ts`

**Steps:**
1. Locate `addComponent` calls.
2. Swap parameters: `addComponent(world, Component, eid)` -> `addComponent(world, eid, Component)`.

**Verification:**
- No TypeScript errors in these files.
