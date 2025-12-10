# Task B: Migrate Components

**Goal:** Convert all 23 components from `defineComponent()` to plain objects with Regular Arrays.

**Prerequisites:** Task A

**Reference:**
- bitECS 0.4.0 Migration Guide: Components are now plain objects.

**Files:** 
- `src/ecs/components.ts`

**Steps:**
1. Open `src/ecs/components.ts`.
2. Remove import: `import { defineComponent, Types } from 'bitecs';`
3. Replace each component definition. Use regular arrays `[] as number[]`.
   - **Pattern:** `defineComponent({ field: Types.xxx })` -> `{ field: [] as number[] }`
4. Preserve all JSDoc comments.

**Component List & Fields:**
- `Position`: x, y
- `Velocity`: x, y
- `Faction`: id
- `SpriteRef`: index
- `Health`: current, max
- `Shield`: current, max
- `Collider`: radius, layer, mask
- `Turret`: range, fireRate, damage, lastFired, turretType
- `Target`: entityId, hasTarget, entityId2, hasTarget2, entityId3, hasTarget3
- `AIBehavior`: behaviorType, stateTimer, targetX, targetY, aggression
- `Projectile`: damage, speed, lifetime, targetEntityId, projectileType
- `EnemyWeapon`: range, fireRate, damage, lastFired, projectileType
- `BurningStatus`: damagePerTick, ticksRemaining, tickInterval, lastTickTime
- `SlowedStatus`: slowPercent, duration, originalSpeed
- `DrainedStatus`: stacks, duration
- `DisabledStatus`: duration, disabledSystems
- `WeaponProperties`: shieldDamageMultiplier, hullDamageMultiplier, critChance, critMultiplier, aoeRadius, statusEffectType, statusEffectChance
- `TurretUpgrade`: damageLevel, rangeLevel, fireRateLevel, multiTargetLevel, specialLevel
- `EnemyVariant`: rank, sizeScale, statMultiplier
- `SpecialAbility`: abilityType, cooldown, lastUsed, duration, active
- `Rotation`: angle
- `CompositeSpriteRef`: baseIndex, barrelIndex

**Example:**
```typescript
// Before
export const Position = defineComponent({
  x: Types.f32,
  y: Types.f32
});

// After
export const Position = {
  x: [] as number[],
  y: [] as number[]
};
```

**Verification:**
- File should have no TypeScript errors regarding `Types` or `defineComponent`.
