# Chore Task 02: Standardize bitECS Query Pattern

**Date:** 2025-12-11  
**Priority:** P1 (Medium Impact, Low Risk)  
**Estimated Effort:** 1 hour  
**Risk Level:** LOW - Pattern standardization only

---

## Problem Statement

The codebase uses inconsistent patterns for bitECS queries:

### Pattern 1: Inline query() calls (Preferred - bitECS 0.4.0+)
```typescript
import { query } from 'bitecs';
const entities = query(world, [Position, Velocity]);
```

### Pattern 2: Module-level defineQuery (Legacy)
```typescript
import { defineQuery } from 'bitecs';
const movementQuery = defineQuery([Position, Velocity]);
// Later...
const entities = movementQuery(world);
```

The project has migrated to bitECS 0.4.0 which prefers inline `query()` calls, but some files still use the old pattern.

---

## Current State Analysis

### Files Using `defineQuery` (Need Update)

```typescript
// src/core/Game.ts - uses query() ✓ (already migrated)

// src/systems/combatSystem.ts - check needed
// src/systems/damageSystem.ts - check needed
// src/systems/targetingSystem.ts - check needed
```

Let me verify the current state:

### Files Already Using `query()` ✓
- `src/systems/combatSystem.ts` - uses `query(world, [...])`
- `src/systems/damageSystem.ts` - uses `query(world, [...])`
- `src/systems/aiSystem.ts` - uses `query(world, [...])`
- `src/core/Game.ts` - uses `query(world, [...])`

### Files Still Using `defineQuery` (Need Migration)
Based on grep analysis, check these files:
- `src/core/GameInputHandler.ts` - uses `defineQuery`
- `src/core/managers/InputRouter.ts` - uses `defineQuery`
- `src/ecs/entityFactory.ts` - may use `defineQuery`

---

## Solution

Migrate remaining `defineQuery` usages to inline `query()` pattern.

---

## Implementation

### Step 1: Update `src/core/GameInputHandler.ts`

```typescript
// Before
import { defineQuery } from 'bitecs';
import { Turret, Position } from '../ecs/components';

const turretQuery = defineQuery([Turret]);

// In method:
const turretEntities = turretQuery(this.context.world);
```

```typescript
// After
import { query } from 'bitecs';
import { Turret, Position } from '../ecs/components';

// In method:
const turretEntities = query(this.context.world, [Turret, Position]);
```

### Step 2: Update `src/core/managers/InputRouter.ts`

```typescript
// Before
import { defineQuery } from 'bitecs';
import { Position, Turret } from '../../ecs/components';

const turretQuery = defineQuery([Position, Turret]);

// In method:
const turretEntities = turretQuery(this.world);
```

```typescript
// After
import { query } from 'bitecs';
import { Position, Turret } from '../../ecs/components';

// In method:
const turretEntities = query(this.world, [Position, Turret]);
```

---

## Files to Check and Update

| File | Current Pattern | Action |
|------|-----------------|--------|
| `src/core/GameInputHandler.ts` | `defineQuery` | Migrate to `query()` |
| `src/core/managers/InputRouter.ts` | `defineQuery` | Migrate to `query()` |
| `src/systems/*.ts` | `query()` | Already correct ✓ |
| `src/core/Game.ts` | `query()` | Already correct ✓ |

---

## Test Coverage

Existing tests should continue to pass. No new tests needed as this is a pattern change with identical behavior.

### Verification Tests

```typescript
// Existing tests in src/__tests__/combatSystem.test.ts
// Existing tests in src/__tests__/damageSystem.test.ts
// Existing tests in src/__tests__/targetingSystem.test.ts
// These all exercise the query patterns indirectly
```

---

## Verification Checklist

- [ ] Update `src/core/GameInputHandler.ts` to use `query()`
- [ ] Update `src/core/managers/InputRouter.ts` to use `query()`
- [ ] Search for any remaining `defineQuery` imports
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] Turret selection still works (manual test)

---

## AI Agent Instructions

1. Search for `defineQuery` in all `.ts` files
2. For each file found:
   - Change import from `defineQuery` to `query`
   - Remove module-level query definitions
   - Replace `queryName(world)` with `query(world, [Components])`
3. Run verification commands
4. Test turret selection in browser

---

## Benefits

1. **Consistency** - All files use same pattern
2. **Simplicity** - No module-level state
3. **AI-Friendly** - Single pattern to learn
4. **Future-Proof** - Aligned with bitECS 0.4.0+ best practices
