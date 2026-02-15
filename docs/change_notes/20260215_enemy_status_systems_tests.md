# Enemy & Status Systems Tests

**Date:** 2026-02-15
**Type:** Test
**File:** `src/__tests__/enemySystems.test.ts`

## Summary

Added 49 tests covering enemy combat, projectile, status effect, and rotation systems.

## Systems Tested

### EnemyCombatSystem (`src/systems/enemyCombatSystem.ts`)
- Enemy firing when in range with cooldown elapsed
- Out-of-range skip logic
- Cooldown enforcement
- Dead enemy skip
- Federation faction skip
- Zero fire rate skip
- Fallback to world center when no Kobayashi Maru target

### EnemyProjectileSystem (`src/systems/enemyProjectileSystem.ts`)
- Lifetime decrement per frame
- Projectile removal on lifetime expiry
- Collision damage to Federation entities
- Non-Federation entity skip
- Non-enemy projectile skip
- Damage tracking to Kobayashi Maru
- Damage tracking reset
- Dead target skip
- Out-of-radius miss
- Single-target-per-projectile enforcement
- Shield-first damage application

### StatusEffectSystem (`src/systems/statusEffectSystem.ts`)
- **Burning:** DOT per tick, tick interval enforcement, removal on expiry, health floor at 0, refresh behavior
- **Slowed:** Velocity reduction, original speed storage, speed restoration on expiry, duration decrement, zero-velocity edge case
- **Drained:** Per-stack speed reduction, max stack cap (3), stack decrement on expiry, full removal, duration tracking
- **Disabled:** Duration application, duration decrement, removal on expiry, refresh behavior, default systems parameter

### TurretRotationSystem (`src/systems/turretRotationSystem.ts`)
- Rotation toward target (right, above, diagonal)
- No rotation without target

### EnemyRotationSystem (`src/systems/enemyRotationSystem.ts`)
- Facing movement direction (right, down)
- No rotation when stationary
- Below-threshold velocity skip
- Direction change updates
- Negative velocity handling

## Test Count
- **49 tests**, all passing
- No regressions in existing test suite
