# Recommendation: Turret Synergy System

**Date:** 2025-12-01  
**Priority:** MEDIUM-HIGH  
**Complexity:** Medium  
**Impact:** Strategic depth, build variety, emergent gameplay

---

## Overview

Implement a turret synergy system where turrets placed near each other create combo effects, bonus damage, or special abilities. This encourages thoughtful placement and creates emergent strategic gameplay.

---

## Current State

Turrets currently operate independently:
- Each turret targets and fires on its own
- No interaction between turret types
- Placement is only limited by spacing rules (64px minimum)
- No reason to group or separate turret types

**Problems:**
- Optimal strategy is just "place best turret everywhere"
- No reason to consider turret positioning beyond coverage
- Missing depth for experienced players
- No emergent combinations to discover

---

## Proposed Synergy System

### Synergy Detection

```typescript
// Synergies activate when turrets are within SYNERGY_RANGE
const SYNERGY_RANGE = 150; // pixels

interface Synergy {
  turrets: [TurretType, TurretType];  // Required pair
  range: number;                       // Max distance
  effect: SynergyEffect;              // What happens
  visualIndicator: string;            // UI feedback
}
```

### Core Synergy Combinations

#### 1. **Shield Breaker** (Tetryon + Torpedo)
**"Lower shields and deliver the killing blow!"**

```typescript
{
  turrets: [TurretType.TETRYON_BEAM, TurretType.TORPEDO_LAUNCHER],
  effect: {
    name: 'Shield Breaker',
    description: 'Torpedo deals +100% damage to targets with no shields',
    mechanism: 'Tetryon strips shields, torpedo follows up'
  }
}
```

**Gameplay:** Place Tetryon near Torpedo. Tetryon strips shields (3x shield damage), then Torpedo's high damage hits unshielded hull.

---

#### 2. **Burn Zone** (Plasma + Disruptor)
**"Superheated plasma cascade!"**

```typescript
{
  turrets: [TurretType.PLASMA_CANNON, TurretType.DISRUPTOR_BANK],
  effect: {
    name: 'Burn Zone',
    description: 'Burning enemies take +25% damage from all sources',
    mechanism: 'Disruptor debuff amplifies burn damage'
  }
}
```

**Gameplay:** Plasma applies burn, Disruptor's constant fire + burn synergy = high DPS.

---

#### 3. **Stasis Field** (Polaron + Phaser)
**"They can't dodge what they can't see coming!"**

```typescript
{
  turrets: [TurretType.POLARON_BEAM, TurretType.PHASER_ARRAY],
  effect: {
    name: 'Stasis Field',
    description: 'Drained enemies have 15% chance to be stunned',
    mechanism: 'Polaron slows, Phaser can stun slowed targets'
  }
}
```

**Gameplay:** Polaron slows (stacking drain), Phaser gets bonus stun chance on slowed targets.

---

#### 4. **Precision Strike** (Phaser + Torpedo)
**"Mark the target for torpedo lock!"**

```typescript
{
  turrets: [TurretType.PHASER_ARRAY, TurretType.TORPEDO_LAUNCHER],
  effect: {
    name: 'Precision Strike',
    description: 'Torpedoes home more accurately on Phaser-marked targets',
    mechanism: 'Phaser hits mark target, torpedo gains perfect tracking'
  }
}
```

**Gameplay:** Phaser "paints" targets, torpedoes never miss marked enemies.

---

#### 5. **Plasma Cascade** (Plasma + Plasma)
**"More fuel for the fire!"**

```typescript
{
  turrets: [TurretType.PLASMA_CANNON, TurretType.PLASMA_CANNON],
  effect: {
    name: 'Plasma Cascade',
    description: 'Burning spreads to nearby enemies',
    mechanism: 'Same-type synergy: burn damage becomes AOE',
    radius: 50  // Spread radius
  }
}
```

**Gameplay:** Group Plasma Cannons to create spreading burn zones.

---

#### 6. **Polaron Web** (Polaron + Polaron + Polaron)
**"Complete power drain initiated!"**

```typescript
{
  turrets: [TurretType.POLARON_BEAM, TurretType.POLARON_BEAM, TurretType.POLARON_BEAM],
  effect: {
    name: 'Polaron Web',
    description: 'Triangle formation creates slow field for all enemies',
    mechanism: '3 Polaron turrets slow ALL enemies in their triangle area',
    requiresFormation: true
  }
}
```

**Gameplay:** Arrange 3 Polaron turrets in triangle = area slow effect.

---

### Synergy Reference Table

| Combo | Turrets | Effect | Range |
|-------|---------|--------|-------|
| Shield Breaker | Tetryon + Torpedo | +100% torpedo damage vs no shields | 150px |
| Burn Zone | Plasma + Disruptor | +25% damage to burning enemies | 150px |
| Stasis Field | Polaron + Phaser | 15% stun on drained enemies | 150px |
| Precision Strike | Phaser + Torpedo | Perfect torpedo homing | 150px |
| Plasma Cascade | Plasma + Plasma | Burn spreads to nearby | 100px |
| Polaron Web | 3x Polaron | Area slow field | 200px triangle |
| Disruptor Overload | Disruptor + Disruptor | Debuff stacks 2x faster | 100px |
| Tetryon Resonance | Tetryon + Tetryon | Chain to nearby shielded targets | 150px |

---

## Visual Feedback System

### Synergy Indicators

#### During Placement
```
[Ghost turret shows synergy preview]
┌─────────────────────────────────────────┐
│  ★ SYNERGY: Shield Breaker             │
│  Placing Torpedo near Tetryon          │
│  +100% damage vs unshielded targets    │
└─────────────────────────────────────────┘
```

#### Active Synergy Display
```
[Between linked turrets]
───●═══════════●───
   Tetryon  Torpedo
   
[Animated energy link effect]
[Pulsing glow on synergized turrets]
```

#### HUD Integration
```
┌─ ACTIVE SYNERGIES ─────────────────────┐
│ ★ Shield Breaker (x2)                  │
│ ★ Burn Zone (x1)                       │
│ ★ Polaron Web (x1)                     │
└────────────────────────────────────────┘
```

---

## Implementation Architecture

### SynergyComponent

```typescript
export const TurretSynergy = defineComponent({
  synergyType: Types.ui8,       // Which synergy is active (0 = none)
  partnerEntityId: Types.ui32,  // Linked turret entity ID
  bonusMultiplier: Types.f32    // Damage/effect multiplier
});
```

### SynergySystem

```typescript
function createSynergySystem(spatialHash: SpatialHash) {
  return function synergySystem(world: GameWorld): void {
    const turrets = turretQuery(world);
    
    // Reset synergies each frame (recalculate)
    for (const eid of turrets) {
      TurretSynergy.synergyType[eid] = 0;
      TurretSynergy.partnerEntityId[eid] = 0;
      TurretSynergy.bonusMultiplier[eid] = 1.0;
    }
    
    // Check each turret against nearby turrets
    for (const eid of turrets) {
      const x = Position.x[eid];
      const y = Position.y[eid];
      const type = Turret.turretType[eid];
      
      const nearby = spatialHash.query(x, y, SYNERGY_RANGE);
      
      for (const nearbyEid of nearby) {
        if (nearbyEid === eid) continue;
        if (!hasComponent(world, Turret, nearbyEid)) continue;
        
        const nearbyType = Turret.turretType[nearbyEid];
        const synergy = getSynergy(type, nearbyType);
        
        if (synergy) {
          activateSynergy(world, eid, nearbyEid, synergy);
        }
      }
    }
  };
}
```

### Integration with Combat System

```typescript
// In combatSystem.ts
function applyDamage(world, targetEid, baseDamage, turretEid) {
  let damage = baseDamage;
  
  // Check for active synergies
  if (hasComponent(world, TurretSynergy, turretEid)) {
    const synergyType = TurretSynergy.synergyType[turretEid];
    const multiplier = TurretSynergy.bonusMultiplier[turretEid];
    
    if (synergyType === SynergyType.SHIELD_BREAKER) {
      if (Shield.current[targetEid] <= 0) {
        damage *= 2.0;  // +100% vs no shields
      }
    }
    // ... other synergy effects
  }
  
  return damage;
}
```

---

## Strategic Depth Additions

### Build Archetypes

**"Shield Stripper" Build:**
- Focus: Tetryon + Torpedo combos
- Strategy: Strip shields fast, burst down hull
- Best against: High-shield enemies (Romulan, Borg)

**"DOT Master" Build:**
- Focus: Plasma + Disruptor combos
- Strategy: Apply burns, stack debuffs, let damage tick
- Best against: High-health enemies (Borg, Species 8472)

**"Control Zone" Build:**
- Focus: Polaron Web + Phaser stuns
- Strategy: Slow everything, pick off immobilized enemies
- Best against: Fast enemies (Klingon, Romulan)

**"All-Round" Build:**
- Mix of synergies for versatility
- Adaptable to any wave composition
- Good for procedural waves

---

## Synergy Discovery System

### Progressive Revelation

```typescript
// Synergies are "discovered" on first activation
interface SynergyProgress {
  discovered: Set<SynergyType>;
  usageCount: Map<SynergyType, number>;
  mastered: Set<SynergyType>;  // Used 50+ times
}

// On first use:
"★ NEW SYNERGY DISCOVERED: Shield Breaker!"
"Tetryon + Torpedo = +100% damage vs unshielded"
```

### Codex Entry

```
┌─ SYNERGY CODEX ────────────────────────┐
│                                        │
│ ★ Shield Breaker (DISCOVERED)         │
│   Used: 23 times | Kills: 156         │
│                                        │
│ ★ Burn Zone (DISCOVERED)              │
│   Used: 8 times | Kills: 42           │
│                                        │
│ ★ ??? (NOT DISCOVERED)                │
│   Hint: Try combining speed debuffs   │
│                                        │
│ ★ ??? (NOT DISCOVERED)                │
│   Hint: Group plasma turrets closely  │
│                                        │
└────────────────────────────────────────┘
```

---

## Balance Considerations

### Preventing "One Best Build"

- Each synergy strong against specific enemy types
- Wave composition varies, requiring adaptability
- Boss waves may nullify certain synergies

### Synergy Costs

- Synergized turrets must be close = concentrated defenses
- Leaves gaps in coverage elsewhere
- Risk vs reward in positioning

### Anti-Stacking

```typescript
// Each turret can only contribute to ONE synergy
// Prevents infinite chain bonuses
if (TurretSynergy.synergyType[eid] !== 0) {
  continue;  // Already synergized
}
```

---

## Future Expansion

### Unlockable Synergies
- Complete challenges to unlock new combinations
- Prestige system unlocks "Advanced Synergies"

### Faction-Specific Counters
```
Borg: Immune to burn (adaptation)
Romulan: Resistant to slow (superior engines)
Tholian: Takes bonus damage from combos (crystalline weakness)
```

### Triple Synergies
- Unlock after mastering all dual synergies
- Phaser + Tetryon + Torpedo = "Alpha Strike"
- Plasma + Polaron + Disruptor = "Total Debilitation"

---

## Player Engagement Benefits

### Intellectual Challenge
- Players experiment to discover combos
- Theory-crafting in community
- "I found a new strategy!" moments

### Replayability
- Different builds create different experiences
- No single "solved" strategy
- Adapting to procedural waves

### Social Sharing
- Share build screenshots
- "My build dominated Wave 30!"
- Community build guides

---

## Conclusion

The Turret Synergy System transforms placement from a simple coverage problem into a rich strategic puzzle. Players must balance synergy benefits against coverage needs, adapt builds to wave compositions, and discover powerful combinations through experimentation. This creates depth for experienced players while remaining approachable for newcomers.

**Estimated Implementation Time:** 3-4 days  
**Risk Level:** Low (additive system)  
**ROI:** Significant strategic depth and replayability
