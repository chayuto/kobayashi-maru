# Task: Consolidate Enemy Factory Functions

**Priority:** 🟠 High  
**Estimated Effort:** Small (1-2 hours)  
**Dependencies:** None  
**File Focus:** `src/ecs/entityFactory.ts`, `src/ecs/genericFactory.ts`

---

## Background

The `entityFactory.ts` contains deprecated faction-specific factory functions that are now superseded by the generic `createEnemy()` function from `genericFactory.ts`. These should be removed.

## Current State

**Deprecated in entityFactory.ts:**
```typescript
/** @deprecated Use createEnemy(world, FactionId.FEDERATION, x, y) instead */
createFederationShip(world, x, y): number

/** @deprecated Use createEnemy(world, FactionId.KLINGON, x, y) instead */
createKlingonShip(world, x, y): number

/** @deprecated Use createEnemy(world, FactionId.ROMULAN, x, y) instead */
createRomulanShip(world, x, y): number

/** @deprecated Use createEnemy(world, FactionId.BORG, x, y) instead */
createBorgShip(world, x, y): number

/** @deprecated Use createEnemy(world, FactionId.THOLIAN, x, y) instead */
createTholianShip(world, x, y): number

/** @deprecated Use createEnemy(world, FactionId.SPECIES_8472, x, y) instead */
createSpecies8472Ship(world, x, y): number
```

**Preferred approach in genericFactory.ts:**
```typescript
createEnemy(world, factionId, x, y): number
createEnemyFromTemplate(world, template, x, y): number
```

---

## Objective

1. Remove all deprecated faction-specific factory functions
2. Ensure all callers use `createEnemy()` instead
3. Update exports in barrel file

---

## Implementation Steps

### Step 1: Find All Usage

```bash
grep -rn "createKlingonShip\|createRomulanShip\|createBorgShip\|createTholianShip\|createSpecies8472Ship\|createFederationShip" src/ --include="*.ts"
```

### Step 2: Migrate Any Remaining Usage

If any callers still use deprecated functions, migrate them:

```typescript
// Before
createKlingonShip(world, x, y)

// After
import { createEnemy } from './genericFactory';
import { FactionId } from '../types/constants';
createEnemy(world, FactionId.KLINGON, x, y)
```

### Step 3: Remove Deprecated Functions

Remove from `entityFactory.ts`:
- `createFederationShip()`
- `createKlingonShip()`
- `createRomulanShip()`
- `createBorgShip()`
- `createTholianShip()`
- `createSpecies8472Ship()`

### Step 4: Update Exports

Update `src/ecs/entityFactory.ts` exports:

```typescript
// Remove deprecated exports, keep only:
export { createKobayashiMaru, createTurret, createProjectile, createEnemyProjectile };

// Already exported from genericFactory:
// createEnemy, createEnemyFromTemplate, createEnemies
```

### Step 5: Update Tests

Check if tests use deprecated functions:

```bash
grep -rn "createKlingonShip\|createRomulanShip" src/__tests__/ --include="*.ts"
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/ecs/entityFactory.ts` | Remove 6 deprecated factory functions |
| Any files using deprecated functions | Migrate to `createEnemy()` |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ No deprecated factory functions remain
4. ✅ `entityFactory.ts` reduced by ~70 lines

---

## Verification Commands

```bash
# Verify no deprecated usage
grep -rn "createKlingonShip\|createRomulanShip\|createBorgShip" src/ --include="*.ts"

# Run all tests
npm test

# Type check
npx tsc --noEmit
```

---

## Risk Assessment

- **Low risk** - Removing clearly deprecated code
- **Pre-check:** Ensure no callers before removal
