# Tetryon Beam Weapon

**Date:** December 1, 2025  
**Priority:** MEDIUM  
**Estimated Time:** 2 hours  
**Dependencies:** Task 01 (Components), Task 02 (Status System)  
**Phase:** 1 - Week 1

## Objective

Add Tetryon Beam Array weapon - a shield-stripping beam that deals 300% damage to shields, 50% to hull, and reduces shield regen.

## Current State

**What Exists:**
- ✅ 3 weapons: Phaser, Torpedo, Disruptor
- ✅ Weapon firing system
- ✅ Beam rendering
- ✅ Status effect system

**What's Missing:**
- ❌ Tetryon weapon definition
- ❌ Shield damage multiplier logic
- ❌ Shield regen reduction effect

## Implementation

### File: `src/types/constants.ts` (modify)

Add Tetryon weapon config:

```typescript
export const WEAPON_CONFIGS = {
  // ... existing weapons
  
  TETRYON_BEAM: {
    id: 'tetryon_beam',
    name: 'Tetryon Beam Array',
    description: 'Shield-stripping beam. 300% damage to shields, reduces shield regen.',
    cost: 150,
    damage: 12,
    fireRate: 3.0,        // 3 shots per second
    range: 220,
    projectileSpeed: 0,   // Instant beam
    color: 0x00AAFF,      // Bright blue
    particleType: 'tetryon',
    
    // Special properties
    shieldDamageMultiplier: 3.0,
    hullDamageMultiplier: 0.5,
    statusEffectType: 2,  // Shield regen reduction (custom)
    statusEffectChance: 1.0,
    statusEffectDuration: 5.0
  }
};
```

### File: `src/systems/combatSystem.ts` (modify)

Update damage calculation to use multipliers:

```typescript
// In applyDamage or damage calculation function
function calculateDamage(
  baseDamage: number,
  targetEid: number,
  weaponEid: number,
  world: World
): number {
  let finalDamage = baseDamage;
  
  // Check for weapon properties
  if (hasComponent(world, WeaponProperties, weaponEid)) {
    const hasShield = Shield.current[targetEid] > 0;
    
    if (hasShield) {
      // Apply shield damage multiplier
      const shieldMult = WeaponProperties.shieldDamageMultiplier[weaponEid] || 1.0;
      finalDamage *= shieldMult;
    } else {
      // Apply hull damage multiplier
      const hullMult = WeaponProperties.hullDamageMultiplier[weaponEid] || 1.0;
      finalDamage *= hullMult;
    }
  }
  
  return finalDamage;
}
```

### File: `src/game/TurretFactory.ts` (modify)

Add Tetryon turret creation:

```typescript
export function createTurret(
  world: World,
  type: string,
  x: number,
  y: number
): number {
  const eid = addEntity(world);
  
  // ... existing component setup
  
  // Set weapon properties for Tetryon
  if (type === 'tetryon_beam') {
    const config = WEAPON_CONFIGS.TETRYON_BEAM;
    
    addComponent(world, WeaponProperties, eid);
    WeaponProperties.shieldDamageMultiplier[eid] = config.shieldDamageMultiplier;
    WeaponProperties.hullDamageMultiplier[eid] = config.hullDamageMultiplier;
    WeaponProperties.statusEffectType[eid] = config.statusEffectType;
    WeaponProperties.statusEffectChance[eid] = config.statusEffectChance;
  }
  
  return eid;
}
```

### File: `src/ui/TurretMenu.ts` (modify)

Add Tetryon button to turret menu:

```typescript
private createTurretButtons(): void {
  const turretTypes = [
    { type: 'phaser', config: WEAPON_CONFIGS.PHASER_ARRAY },
    { type: 'torpedo', config: WEAPON_CONFIGS.TORPEDO_LAUNCHER },
    { type: 'disruptor', config: WEAPON_CONFIGS.DISRUPTOR_BANK },
    { type: 'tetryon_beam', config: WEAPON_CONFIGS.TETRYON_BEAM }, // NEW
  ];
  
  // ... rest of button creation
}
```

## Testing

### Manual Testing Checklist

- [ ] Tetryon button appears in turret menu
- [ ] Can place Tetryon turret (costs 150 Matter)
- [ ] Turret fires blue beam at 3 shots/sec
- [ ] Beam has 220 range
- [ ] Deals high damage to shielded enemies
- [ ] Deals low damage to unshielded enemies
- [ ] Visual beam effect is blue (#00AAFF)
- [ ] Turret targets enemies correctly
- [ ] No console errors
- [ ] Performance is good

### Balance Testing

Test against different enemies:
- [ ] Romulan (high shields) - should die quickly
- [ ] Klingon (low shields) - should take longer
- [ ] Borg (medium shields) - moderate effectiveness

## Success Criteria

- ✅ Tetryon weapon config added
- ✅ Weapon appears in turret menu
- ✅ Can be placed and fires correctly
- ✅ Shield damage multiplier works (3x)
- ✅ Hull damage multiplier works (0.5x)
- ✅ Blue beam visual effect
- ✅ Proper range and fire rate
- ✅ Balanced against other weapons

## Notes for Agent

- Tetryon is Tier 1 weapon (basic cost)
- Specialized against high-shield enemies
- Weak against unshielded enemies (trade-off)
- Blue color distinguishes from other beams
- Shield regen reduction can be added later
- Focus on core mechanics first

## Next Steps

After completing this task:
1. Task 04: Add Plasma Cannon (burning DOT)
2. Task 05: Add Polaron Beam (power drain)
3. Task 06: Add visual status effect indicators

## Related Files

- `src/types/constants.ts` (modify - add weapon config)
- `src/systems/combatSystem.ts` (modify - damage calculation)
- `src/game/TurretFactory.ts` (modify - turret creation)
- `src/ui/TurretMenu.ts` (modify - add button)
