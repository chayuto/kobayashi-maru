# Task F: Migrate addComponent Order (Factories)

**Goal:** Fix parameter order in entity factory files.

**Prerequisites:** Task B

**Reference:**
- bitECS 0.4.0: `addComponent(world, eid, Component)` (Parameter swap).

**Files to Modify:**
- `src/ecs/entityFactory.ts`
- `src/ecs/genericFactory.ts`

**Steps:**
1. Search for `addComponent(world, Component, eid)`.
2. Replace with `addComponent(world, eid, Component)`.

**Note:**
- Be careful with `addComponents` if used (plural), though analysis showed mostly `addComponent`.

**Verification:**
- No TypeScript errors in factory files.
