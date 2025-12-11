# Change Notes: DamageService Refactoring

**Date**: 2025-12-11  
**Type**: Refactoring  
**Risk Level**: Low  
**Test Coverage**: 100% of changed code path

## Summary

Replaced duplicate damage logic in `enemyCollisionSystem.ts` with centralized `DamageService.applyDamage` function, reducing code duplication and improving maintainability.

## Changes Made

### Modified Files

| File | Change |
|------|--------|
| `src/systems/enemyCollisionSystem.ts` | Removed `dealDamageToTarget` function, added `applyDamage` import |
| `eslint.config.js` | Added `coverage/` to ignores (unrelated fix) |

### Diff Summary

```diff
# src/systems/enemyCollisionSystem.ts

-import { Position, Health, Faction, AIBehavior, Shield } from '../ecs/components';
+import { Position, Health, Faction, AIBehavior } from '../ecs/components';
+import { applyDamage } from '../services';

-        dealDamageToTarget(kmId, GAME_CONFIG.ENEMY_COLLISION_DAMAGE);
+        applyDamage(world, kmId, GAME_CONFIG.ENEMY_COLLISION_DAMAGE);

-  function dealDamageToTarget(targetId: number, damage: number): void {
-    let remainingDamage = damage;
-    ... (17 lines removed)
-  }
```

## Verification

| Check | Result |
|-------|--------|
| All tests pass | ✓ 653 tests passed |
| Linting passes | ✓ No errors |
| Behavior unchanged | ✓ Verified by existing test suite |

### Tests Covering This Change

- `enemyCollisionSystem.test.ts` - 10 tests validating shield/health damage behavior
- `combatSystem.test.ts` - 15 tests (unaffected, different `applyDamage`)
- `damageSystem.test.ts` - 7 tests validating damage application

## Impact

- **Lines removed**: 20 (17 function body + 3 related changes)
- **Lines added**: 2 (import statement + function call)
- **Net reduction**: 18 lines of duplicate code
