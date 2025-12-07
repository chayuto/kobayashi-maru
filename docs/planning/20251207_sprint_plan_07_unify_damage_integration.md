# Task: Unify Damage Service Integration

**Priority:** 🟠 High  
**Estimated Effort:** Small (1 hour)  
**Dependencies:** None  
**File Focus:** `src/services/DamageService.ts`, various system files

---

## Background

A centralized `DamageService` was created to unify damage logic, but some systems may still have local damage implementations. This task ensures all damage goes through the central service.

## Current State

- `src/services/DamageService.ts` - ✅ Created with `applyDamage()` and `applyDamageDetailed()`
- `combatSystem.ts` - Has local `applyDamage()` (line ~138)
- `projectileSystem.ts` - Should use DamageService
- `enemyProjectileSystem.ts` - Should use DamageService
- `enemyCollisionSystem.ts` - Should use DamageService

---

## Objective

Ensure all damage application uses `DamageService.applyDamage()` or `applyDamageDetailed()`.

---

## Implementation Steps

### Step 1: Audit Damage Logic

```bash
grep -rn "Health\[.*\].*-=\|applyDamage" src/systems/ --include="*.ts"
```

### Step 2: Update combatSystem.ts

The `combatSystem.ts` has a local `applyDamage()` function. Replace with service:

```typescript
// Before (in combatSystem.ts)
function applyDamage(world, entityId, damage, ...) { ... }

// After
import { applyDamageDetailed } from '../services';
// Use applyDamageDetailed instead
```

### Step 3: Verify projectileSystem.ts

Ensure projectile damage uses service:

```typescript
import { applyDamage } from '../services';
// Use service for all damage
```

### Step 4: Verify enemyProjectileSystem.ts

Same pattern for enemy projectiles.

### Step 5: Verify enemyCollisionSystem.ts

Collision damage should also use service.

### Step 6: Remove Duplicate Logic

After migration, remove any local `applyDamage` implementations that duplicate the service.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/systems/combatSystem.ts` | Use DamageService, remove local function if duplicate |
| `src/systems/projectileSystem.ts` | Verify using DamageService |
| `src/systems/enemyProjectileSystem.ts` | Verify using DamageService |
| `src/systems/enemyCollisionSystem.ts` | Verify using DamageService |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ Only one `applyDamage` implementation (in DamageService)
4. ✅ All systems import from services

---

## Verification Commands

```bash
# Find all damage implementations
grep -rn "function applyDamage\|const applyDamage" src/ --include="*.ts" | grep -v DamageService

# Should return empty - all should use the service

# Run all tests
npm test
```

---

## Risk Assessment

- **Low risk** - Service already exists, just ensuring usage
- **Verify:** Run combat tests after changes
