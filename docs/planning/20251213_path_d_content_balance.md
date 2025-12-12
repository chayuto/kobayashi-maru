# Path D: Content & Balance Enhancement Plan

**Date:** 2025-12-13  
**Priority:** Medium  
**Estimated Effort:** 20-25 hours  
**Reference:** Game Improvement Research Proposals - Section 3.1 (Damage Formulas), Appendix A (Damage Type Matrix)

---

## Executive Summary

This path focuses on enhancing game content through a more sophisticated damage type system, new enemy variants, turret abilities, and improved balance mechanics. The goal is to increase strategic depth through meaningful counter-play mechanics.

---

## Problem Statement

Current content limitations:
1. **Simple damage model** - No rock-paper-scissors damage types
2. **Limited enemy variety** - Behaviors exist but no variant diversity within factions
3. **Turret abilities underutilized** - Upgrade paths exist but feel similar
4. **Flat difficulty curve** - Linear scaling doesn't create interesting peaks
5. **No armor/shield system** - All damage is direct to health

---

## Proposed Changes

### Component 1: Damage Type System

#### [NEW] src/types/config/damageTypes.ts

Define damage type interactions:
```typescript
export enum DamageType {
    ENERGY = 0,     // Phasers, Disruptors
    EXPLOSIVE = 1,  // Torpedoes
    KINETIC = 2,    // Plasma cannons
    EMP = 3,        // Tetryon, Polaron
}

export enum ArmorType {
    LIGHT = 0,      // Standard ships
    HEAVY = 1,      // Borg cubes
    SHIELDED = 2,   // Romulans
    ORGANIC = 3,    // Species 8472
}

// Damage multiplier matrix: [AttackType][ArmorType] = multiplier
export const DAMAGE_MATRIX: Record<DamageType, Record<ArmorType, number>> = {
    [DamageType.ENERGY]: {
        [ArmorType.LIGHT]: 1.0,
        [ArmorType.HEAVY]: 0.5,
        [ArmorType.SHIELDED]: 0.7,
        [ArmorType.ORGANIC]: 1.2,
    },
    [DamageType.EXPLOSIVE]: {
        [ArmorType.LIGHT]: 1.2,
        [ArmorType.HEAVY]: 1.5,
        [ArmorType.SHIELDED]: 0.8,
        [ArmorType.ORGANIC]: 0.9,
    },
    [DamageType.KINETIC]: {
        [ArmorType.LIGHT]: 1.0,
        [ArmorType.HEAVY]: 0.8,
        [ArmorType.SHIELDED]: 1.0,
        [ArmorType.ORGANIC]: 1.5,
    },
    [DamageType.EMP]: {
        [ArmorType.LIGHT]: 0.8,
        [ArmorType.HEAVY]: 0.6,
        [ArmorType.SHIELDED]: 2.0,
        [ArmorType.ORGANIC]: 0.5,
    },
};
```

#### [MODIFY] src/systems/damageSystem.ts

Apply damage type modifiers:
```typescript
// In applyDamage()
const damageType = WeaponProperties.damageType[sourceId];
const armorType = EnemyArmor.type[targetId];
const multiplier = DAMAGE_MATRIX[damageType][armorType];
const finalDamage = baseDamage * multiplier;
```

#### [MODIFY] src/ecs/components.ts

Add new components:
```typescript
export const EnemyArmor = {
    type: [] as number[],
    value: [] as number[],  // Flat reduction for heavy armor
};

export const WeaponDamageType = {
    type: [] as number[],
};
```

---

### Component 2: EHP Armor Model

#### [NEW] src/services/DamageCalculation.ts

Implement the Warcraft 3 EHP formula:
```typescript
/**
 * Calculate damage reduction from armor
 * Formula: DR = (k * A) / (1 + k * A) where k = 0.06
 */
export function calculateDamageReduction(armor: number): number {
    const k = 0.06;
    return (k * armor) / (1 + k * armor);
}

/**
 * Calculate final damage after all modifiers
 */
export function calculateFinalDamage(
    baseDamage: number,
    damageType: DamageType,
    armorType: ArmorType,
    armorValue: number
): number {
    const typeMultiplier = DAMAGE_MATRIX[damageType][armorType];
    const armorReduction = calculateDamageReduction(armorValue);
    return baseDamage * typeMultiplier * (1 - armorReduction);
}
```

---

### Component 3: Enemy Variants

#### [MODIFY] src/ecs/entityFactory.ts

Add variant creation:
```typescript
interface EnemyVariant {
    suffix: string;
    healthMultiplier: number;
    speedMultiplier: number;
    armorBonus: number;
    specialAbility?: AbilityType;
}

const ENEMY_VARIANTS: Record<string, EnemyVariant> = {
    normal: { suffix: '', healthMultiplier: 1.0, speedMultiplier: 1.0, armorBonus: 0 },
    veteran: { suffix: ' Veteran', healthMultiplier: 1.5, speedMultiplier: 0.9, armorBonus: 2 },
    elite: { suffix: ' Elite', healthMultiplier: 2.5, speedMultiplier: 0.8, armorBonus: 5, specialAbility: AbilityType.SHIELD_REGEN },
    boss: { suffix: ' Boss', healthMultiplier: 10, speedMultiplier: 0.6, armorBonus: 10, specialAbility: AbilityType.SUMMON },
};
```

#### [MODIFY] src/game/waveConfig.ts

Add variant spawning to wave configs:
```typescript
interface EnemySpawnConfig {
    faction: FactionIdType;
    count: number;
    spawnDelay: number;
    formation?: FormationType;
    variant?: 'normal' | 'veteran' | 'elite' | 'boss';  // NEW
}
```

---

### Component 4: Turret Special Abilities

#### [NEW] src/abilities/TurretAbilities.ts

Define turret special abilities:
```typescript
interface TurretAbility {
    id: string;
    name: string;
    description: string;
    cooldown: number;
    unlockLevel: number;  // Upgrade level required
    effect: (turretId: number, world: GameWorld) => void;
}

const TURRET_ABILITIES: Record<number, TurretAbility[]> = {
    [TurretType.PHASER_ARRAY]: [
        {
            id: 'overcharge',
            name: 'Phaser Overcharge',
            description: 'Triple fire rate for 5 seconds',
            cooldown: 30,
            unlockLevel: 2,
            effect: (turretId) => { /* Apply buff */ }
        }
    ],
    [TurretType.TORPEDO_LAUNCHER]: [
        {
            id: 'spread',
            name: 'Torpedo Spread',
            description: 'Fire 5 torpedoes in a cone',
            cooldown: 45,
            unlockLevel: 2,
            effect: (turretId) => { /* Fire spread */ }
        }
    ],
    // ... more abilities
};
```

#### [MODIFY] src/systems/abilitySystem.ts

Add turret ability activation logic.

---

### Component 5: Wave Difficulty Spikes

#### [MODIFY] src/game/waveManager.ts

Add difficulty curve with peaks:
```typescript
// Replace linear scaling with wave-based difficulty
function getDifficultyMultiplier(wave: number): number {
    const base = 1 + wave * 0.1;  // Linear base
    
    // Boss waves are significantly harder
    if (wave % 5 === 0) {
        return base * 1.5;
    }
    
    // Mini-spikes every 3 waves
    if (wave % 3 === 0) {
        return base * 1.2;
    }
    
    // Breather waves after bosses
    if (wave % 5 === 1) {
        return base * 0.8;
    }
    
    return base;
}
```

---

## File Structure

```
src/
├── types/config/
│   └── damageTypes.ts              # NEW
├── services/
│   └── DamageCalculation.ts        # NEW
├── abilities/
│   └── TurretAbilities.ts          # NEW
├── ecs/
│   ├── components.ts               # MODIFY
│   └── entityFactory.ts            # MODIFY
├── systems/
│   ├── damageSystem.ts             # MODIFY
│   └── abilitySystem.ts            # MODIFY
└── game/
    ├── waveConfig.ts               # MODIFY
    └── waveManager.ts              # MODIFY
```

---

## Implementation Stages

### Stage 1: Damage Types (5-6 hours)
1. Create damage type enums
2. Create damage matrix
3. Modify damage system
4. Add visual indicators for damage types

### Stage 2: Armor System (4-5 hours)
1. Add armor components
2. Implement EHP formula
3. Assign armor types to factions
4. Test damage interactions

### Stage 3: Enemy Variants (5-6 hours)
1. Add variant system to entity factory
2. Modify wave configs for variants
3. Add visual differentiation
4. Balance variant stats

### Stage 4: Turret Abilities (6-8 hours)
1. Create ability definitions
2. Implement ability cooldowns
3. Add ability UI indicators
4. Connect to upgrade system

---

## Verification Plan

### Automated Tests

```bash
npm run test
npm run lint
npm run build
```

#### New Test Files

[NEW] `src/__tests__/services/DamageCalculation.test.ts`
```typescript
describe('DamageCalculation', () => {
    it('should calculate armor reduction correctly', () => {
        expect(calculateDamageReduction(0)).toBe(0);
        expect(calculateDamageReduction(10)).toBeCloseTo(0.375);
    });
    
    it('should apply type multipliers', () => {
        const damage = calculateFinalDamage(100, DamageType.EMP, ArmorType.SHIELDED, 0);
        expect(damage).toBe(200);  // 2.0x multiplier
    });
});
```

### Manual Verification

1. **Damage type test:**
   - Place Tetryon beam
   - Observe damage against Romulan (shielded) - should be high
   - Observe damage against Borg (heavy) - should be low

2. **Armor test:**
   - Observe damage numbers on normal vs elite enemies
   - Elite with armor should take reduced damage

3. **Variant test:**
   - Reach wave with elite enemies
   - Verify they are visually different
   - Verify higher health/slower speed

4. **Ability test:**
   - Upgrade turret to level 2
   - Activate special ability
   - Verify effect occurs

---

## Balance Guidelines

| Damage Type | Strong Against | Weak Against |
|-------------|----------------|--------------|
| Energy | Organic | Heavy |
| Explosive | Heavy | Shielded |
| Kinetic | Organic | Heavy |
| EMP | Shielded | Organic |

| Faction | Armor Type | Counter Turret |
|---------|------------|----------------|
| Klingon | Light | Any |
| Romulan | Shielded | Tetryon, Polaron |
| Borg | Heavy | Torpedo |
| Tholian | Light | Phaser |
| Species 8472 | Organic | Plasma |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Balance issues | High | Medium | Extensive playtesting |
| Complexity for players | Medium | Medium | Clear UI indicators |
| Performance impact | Low | Low | Minimal new calculations |

---

## Success Metrics

- [ ] Damage type multipliers working
- [ ] Armor reduces damage as expected
- [ ] Enemy variants spawning correctly
- [ ] At least 2 turret abilities per type
- [ ] Strategic counter-picking observed in AI decisions
- [ ] Player reports increased depth

---

*Document Version: 1.0*
