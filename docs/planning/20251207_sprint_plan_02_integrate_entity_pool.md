# Task: Integrate Entity Pool Across Codebase

**Priority:** 🔴 Critical  
**Estimated Effort:** Medium (2-3 hours)  
**Dependencies:** None  
**File Focus:** `src/ecs/entityFactory.ts`, `src/services/EntityPoolService.ts`, `src/game/waveManager.ts`

---

## Background

The `EntityPoolService` exists and provides a singleton entity pool, but most entity creation still uses direct `addEntity()` calls. This causes GC spikes during gameplay when many entities are created/destroyed (e.g., projectiles, particles).

## Current State

- `src/services/EntityPoolService.ts` - ✅ Created, provides pool access
- `src/ecs/entityPool.ts` - ✅ Created, implements pool logic
- Entity creation in factories - ❌ Uses `addEntity()` directly
- Wave spawning - ❌ Uses `addEntity()` directly

---

## Objective

Replace all `addEntity(world)` calls with `EntityPoolService.getInstance().getPool().acquire(world)`.

---

## Implementation Steps

### Step 1: Audit Entity Creation Points

Find all entity creation points:

```bash
grep -r "addEntity" src/ --include="*.ts"
```

Expected locations:
- `src/ecs/entityFactory.ts` - All factory functions
- `src/ecs/genericFactory.ts` - Generic enemy creation
- `src/game/waveManager.ts` - Wave spawning
- `src/systems/abilitySystem.ts` - Summon ability
- `src/systems/combatSystem.ts` - Projectile creation (if any)

### Step 2: Update entityFactory.ts

For each factory function, replace:

```typescript
// Before
const eid = addEntity(world);

// After
import { EntityPoolService } from '../services';
const eid = EntityPoolService.getInstance().getPool().acquire(world);
```

### Step 3: Update genericFactory.ts

Apply same pattern to `createEnemy`, `createEnemyFromTemplate`.

### Step 4: Update waveManager.ts

In `createEnemyByFaction()` and any direct entity creation, use pool.

### Step 5: Update abilitySystem.ts

In `processSummonAbility()` and `processSplitAbility()`, use pool for spawned entities.

### Step 6: Ensure Entity Recycling

When entities are destroyed, ensure they're returned to pool. Find `removeEntity` calls and add:

```typescript
// Before
removeEntity(world, eid);

// After
import { EntityPoolService } from '../services';
EntityPoolService.getInstance().getPool().release(eid);
removeEntity(world, eid);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/ecs/entityFactory.ts` | Use pool for all factory functions |
| `src/ecs/genericFactory.ts` | Use pool for enemy creation |
| `src/game/waveManager.ts` | Use pool for wave spawning |
| `src/systems/abilitySystem.ts` | Use pool for summon/split |
| `src/systems/damageSystem.ts` | Release to pool on death |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ No direct `addEntity()` calls remain (except in pool itself)
4. ✅ Game runs without errors: `npm run dev`
5. ✅ Performance: Reduced GC activity during gameplay (check DebugManager)

---

## Verification Commands

```bash
# Verify no direct addEntity usage (except pool)
grep -r "addEntity" src/ --include="*.ts" | grep -v "entityPool.ts" | grep -v ".test.ts"

# Run all tests
npm test

# Type check
npx tsc --noEmit
```

---

## Risk Assessment

- **Medium risk** - Touching core entity lifecycle
- **Mitigation:** Run full test suite after each file change
- **Rollback:** Git revert if issues arise
