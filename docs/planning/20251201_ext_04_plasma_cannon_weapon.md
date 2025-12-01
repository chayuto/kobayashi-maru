# Plasma Cannon Weapon

**Date:** December 1, 2025  
**Priority:** MEDIUM  
**Estimated Time:** 2 hours  
**Dependencies:** Task 01, Task 02 (Status System)  
**Phase:** 1 - Week 1

## Objective

Add Plasma Cannon weapon - fires slow projectiles that apply burning DOT, ignoring shields to burn hull directly.

## Weapon Stats

- **Cost:** 180 Matter
- **Damage:** 8 initial + 20 over 5 seconds (4 dmg/sec)
- **Fire Rate:** 1 shot/sec
- **Range:** 200
- **Projectile:** Teal/Gold orb, slow moving
- **Effect:** Burning status (5 seconds)
- **Best Against:** Bioships, Borg (hull damage)

## Implementation

### File: `src/types/constants.ts` (modify)

```typescript
PLASMA_CANNON: {
  id: 'plasma_cannon',
  name: 'Plasma Cannon',
  description: 'Burning projectile. Ignores shields, applies DOT.',
  cost: 180,
  damage: 8,
  fireRate: 1.0,
  range: 200,
  projectileSpeed: 150,  // Slower than torpedoes
  color: 0x44CCAA,       // Teal/Gold
  particleType: 'plasma',
  
  // Burning effect
  statusEffectType: 1,   // Burn
  statusEffectChance: 1.0,
  statusEffectDuration: 5.0,
  burnDamagePerTick: 4.0
}
```

### File: `src/systems/combatSystem.ts` (modify)

Add burning application on hit:

```typescript
// In projectile hit handler
if (WeaponProperties.statusEffectType[projectileEid] === 1) {
  // Apply burning
  const duration = WeaponProperties.statusEffectDuration[projectileEid] || 5.0;
  const dps = WeaponProperties.burnDamagePerTick[projectileEid] || 4.0;
  
  addComponent(world, BurningStatus, targetEid);
  applyBurning(world, targetEid, dps, duration);
}
```

### File: `src/game/TurretFactory.ts` (modify)

Add plasma turret creation with properties.

### File: `src/ui/TurretMenu.ts` (modify)

Add plasma cannon button.

## Testing

- [ ] Plasma cannon fires slow teal projectiles
- [ ] Projectiles apply burning on hit
- [ ] Burning deals 4 damage/sec for 5 seconds
- [ ] Total damage: 8 + 20 = 28 per shot
- [ ] Visual: Teal/gold projectile with trail
- [ ] Burning effect visible on enemies

## Success Criteria

- ✅ Plasma weapon added and functional
- ✅ Burning status applied on hit
- ✅ DOT damage works correctly
- ✅ Projectile visual is distinct
- ✅ Balanced damage output

## Related Files

- `src/types/constants.ts`
- `src/systems/combatSystem.ts`
- `src/game/TurretFactory.ts`
- `src/ui/TurretMenu.ts`
