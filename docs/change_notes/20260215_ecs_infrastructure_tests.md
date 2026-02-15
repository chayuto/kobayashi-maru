# ECS Infrastructure Tests

**Date:** 2026-02-15
**Type:** Test coverage expansion
**File:** `src/__tests__/ecsInfrastructure.test.ts`

## Summary

Added 82 tests covering the ECS infrastructure layer: component validation, generic entity factory, entity pool, and pool manager.

## Source Files Tested

| File | Coverage Area |
|------|--------------|
| `src/ecs/componentValidation.ts` | All 8 validator functions + entity-level validation with logging |
| `src/ecs/genericFactory.ts` | `createEnemy`, `createEnemyFromTemplate`, `createEnemies` |
| `src/ecs/entityPool.ts` | Pool acquire/release lifecycle, expansion, clear, destroy |
| `src/ecs/PoolManager.ts` | Singleton lifecycle, enemy/projectile acquire/release, stats, clear/destroy |

## Test Breakdown (82 tests)

### Component Validation (48 tests)
- **validatePosition** (7): valid bounds, origin, spawn margin, out-of-bounds x/y, NaN x/y
- **validateVelocity** (5): valid, zero, high speed warning, NaN x/y
- **validateHealth** (6): valid, negative current, zero max, exceeds max warning, NaN current/max
- **validateShield** (7): valid, zero shields, negative current/max, exceeds max warning, NaN current/max
- **validateTurret** (5): valid, invalid type, zero range, zero fireRate, negative damage
- **validateProjectile** (5): valid, negative damage, zero speed, zero lifetime warning, NaN damage
- **validateAIBehavior** (4): valid, invalid type, aggression above 1, negative aggression
- **validateCollider** (4): valid, zero radius, negative radius, large radius warning
- **validateEntity** (4): valid entity, aggregated errors, skipped missing components, warnings collection
- **validateEntityWithLogging** (4): valid return, invalid logging, entity type in log, debug warnings

### Generic Factory (12 tests)
- **createEnemy** (7): Klingon creation, Borg stats, invalid faction returns -1, AI behavior, weapon config, zero velocity, zero rotation
- **createEnemyFromTemplate** (1): direct template creation
- **createEnemies** (3): batch creation, empty array, invalid faction

### EntityPool (9 tests)
- Pool creation, unique IDs on acquire, pool exhaustion with warning, invalid release warning, entity reuse, total size tracking, expansion, clear, destroy

### PoolManager (10 tests)
- Singleton identity, enemy/projectile acquire, throw before init (x2), enemy/projectile release with cleanup, stats reporting, clear, destroy and reset, zero stats before init

## Validation Results

- `npm run lint`: Pass
- `npm test -- ecsInfrastructure`: 82/82 pass
- `npm run test` (full suite): All pre-existing tests unaffected; 29 pre-existing failures in `texturesAndSprites.test.ts` are unrelated (PixiJS mock issue with `graphics.ellipse`)
