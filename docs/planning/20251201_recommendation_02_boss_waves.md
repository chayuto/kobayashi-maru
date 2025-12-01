# Recommendation: Boss Wave Mechanics

**Date:** 2025-12-01  
**Priority:** HIGH  
**Complexity:** Medium-High  
**Impact:** Dramatic moments, memorable encounters, pacing variety

---

## Overview

Introduce special Boss Waves at milestone intervals that feature unique, powerful enemies with special mechanics, creating dramatic moments that break up the standard wave progression.

---

## Current State

The game currently treats all waves uniformly:
- Waves 1-10 are pre-defined with increasing enemy counts
- Wave 10 introduces all factions but no special mechanics
- Procedural waves post-10 just scale numbers
- No memorable "milestone" moments

**Problems:**
- Monotonous feel after extended play
- No sense of progression milestones
- Species 8472 (boss-tier faction) is just a stronger enemy
- Missing the Star Trek tradition of dramatic confrontations

---

## Proposed Boss System

### Boss Wave Schedule

| Wave | Boss Type | Theme | Special Mechanic |
|------|-----------|-------|------------------|
| 5 | **Klingon Vor'cha** | Honor Duel | Calls reinforcements when damaged |
| 10 | **Romulan Warbird** | Ambush | Cloaks and repositions |
| 15 | **Borg Cube** | Adaptation | Gains resistance to recent damage types |
| 20 | **Tholian Web Spinner** | Entrapment | Creates web walls that block fire |
| 25 | **Species 8472 Bioship** | Annihilation | Devastating beam attack |
| 30 | **Dominion Fleet** | Combined Arms | Mini-boss with escorts |
| Every 10 thereafter | Random Boss | Increasing difficulty | Combined mechanics |

---

## Boss Designs

### 1. Klingon Vor'cha (Wave 5)

**"Today is a good day to die!"**

```typescript
interface VorchaBoss {
  health: 1500,
  shield: 500,
  size: 3x normal,
  behavior: 'DIRECT_AGGRESSIVE',
  
  abilities: {
    honorGuard: {
      trigger: 'health < 75%',
      effect: 'Spawn 5 Klingon escorts',
      cooldown: 15000  // Once per 15 seconds
    },
    rampage: {
      trigger: 'health < 25%',
      effect: 'Speed +100%, damage +50%',
      duration: 10000
    }
  }
}
```

**Player Strategy:**
- Burst it down quickly before reinforcements
- Focus fire to prevent rampage phase
- Position turrets to handle spawned escorts

---

### 2. Romulan Warbird (Wave 10)

**"The Romulan way is patience... and opportunity."**

```typescript
interface WarbirdBoss {
  health: 1200,
  shield: 1000,  // Shields are the main challenge
  size: 3.5x normal,
  behavior: 'AMBUSH_CLOAK',
  
  abilities: {
    cloak: {
      trigger: 'every 20 seconds',
      effect: 'Become invisible and untargetable',
      duration: 5000,
      onUncloak: 'Teleport to random screen edge'
    },
    plasmaVolley: {
      trigger: 'after uncloak',
      effect: 'Fire 8 plasma torpedoes at KM',
      damage: 30 each
    }
  }
}
```

**Player Strategy:**
- Use Tetryon Beams to strip shields quickly
- Predict decloak positions
- Spread turret coverage across map

---

### 3. Borg Cube (Wave 15)

**"Resistance is futile. Your technological distinctiveness will be added to our own."**

```typescript
interface BorgCubeBoss {
  health: 3000,
  shield: 1500,
  size: 4x normal,
  behavior: 'SLOW_RELENTLESS',
  
  abilities: {
    adaptation: {
      trigger: 'after receiving 500 damage of one type',
      effect: 'Gain 50% resistance to that damage type',
      types: ['phaser', 'torpedo', 'disruptor', 'tetryon', 'plasma', 'polaron'],
      maxAdaptations: 3
    },
    regeneration: {
      trigger: 'constant',
      effect: '+5 HP per second',
      disabled: 'when taking damage'
    },
    assimilate: {
      trigger: 'health < 30%',
      effect: 'Nearby turrets deal 50% less damage',
      range: 200
    }
  }
}
```

**Player Strategy:**
- Rotate damage types to prevent full adaptation
- Maintain constant damage to stop regeneration
- Keep turrets spread to avoid assimilation debuff

---

### 4. Tholian Web Spinner (Wave 20)

**"They're weaving something... a web?"**

```typescript
interface TholianWebSpinner {
  health: 800,
  shield: 600,
  size: 2x normal,
  count: 4,  // Spawns as a group
  behavior: 'ORBIT_COORDINATED',
  
  abilities: {
    webConstruction: {
      trigger: 'When 2+ Web Spinners line up',
      effect: 'Create energy barrier between them',
      barrierProperties: {
        blocksProjectiles: true,
        damagesOnContact: 10,
        duration: 10000
      }
    },
    webEncase: {
      trigger: 'All 4 surround Kobayashi Maru',
      effect: 'Start 15-second countdown to instant loss',
      counter: 'Kill any Web Spinner to break web'
    }
  }
}
```

**Player Strategy:**
- Prevent Web Spinners from aligning
- Prioritize kills before encasement
- Use splash damage to hit through webs

---

### 5. Species 8472 Bioship (Wave 25)

**"The weak shall perish."**

```typescript
interface BioshipBoss {
  health: 5000,
  shield: 0,  // No shields, pure hull
  size: 5x normal,
  behavior: 'HUNTER_DESTROYER',
  
  abilities: {
    bioBeam: {
      trigger: 'every 10 seconds',
      effect: 'Charge for 3 seconds, then fire devastating beam',
      damage: 200,
      target: 'Kobayashi Maru or highest-damage turret',
      warning: 'Visible charge-up animation'
    },
    fluidicShift: {
      trigger: 'on bioBeam charge',
      effect: 'Phase through projectiles during charge',
      vulnerability: 'Beam weapons still hit'
    },
    spawnLesser: {
      trigger: 'every 30 seconds',
      effect: 'Spawn 2 normal Species 8472 ships'
    }
  }
}
```

**Player Strategy:**
- Watch for charge-up, maximize damage during vulnerability
- Use beam weapons during fluidic shift
- Handle spawned minions quickly

---

## Boss UI Elements

### Health Bar Display

```
┌──────────────────────────────────────────────────────────┐
│ ⚠ BOSS: BORG CUBE                                       │
│ ████████████████████████████░░░░░░░░░░░ HULL: 67%       │
│ ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ SHIELD: 22%     │
│                                                          │
│ ADAPTATIONS: [Phaser: 50%] [Torpedo: 50%]               │
│ STATUS: REGENERATING                                     │
└──────────────────────────────────────────────────────────┘
```

### Warning System

```
T-10: "Long-range sensors detect massive energy signature."
T-5:  "Boss vessel entering sensor range!"
T-0:  "RED ALERT: [BOSS NAME] has arrived!"

During fight:
"WARNING: Borg adapting to phaser fire!"
"WARNING: Web encasement in progress!"
"WARNING: Bio-beam charging!"
```

---

## Rewards System

### Boss Kill Rewards

| Boss | Resource Reward | Special Drop |
|------|-----------------|--------------|
| Vor'cha | 500 Matter | +10% Turret Damage (1 wave) |
| Warbird | 750 Matter | Cloaking Scanner (reveals invisible) |
| Borg Cube | 1000 Matter | Frequency Modulator (bypass adaptation) |
| Web Spinner | 600 Matter | Phase Shield (immune to webs) |
| Bioship | 1500 Matter | Bio-Enhancement (all turrets +25% for 1 wave) |

### Temporary Powerups

Boss kills can drop temporary buffs:
- **Overcharge:** +50% fire rate for 30 seconds
- **Shield Boost:** KM gains 200 temporary shields
- **Matter Surge:** +100% resource gain for 1 wave

---

## Implementation Architecture

### New Components

```typescript
// BossComponent.ts
export const Boss = defineComponent({
  bossType: Types.ui8,        // Enum for boss type
  phase: Types.ui8,           // Current phase (1-3)
  specialCooldown: Types.f32, // Time until next ability
  adaptations: Types.ui32,    // Bitfield for Borg adaptations
  isCharging: Types.ui8,      // For beam attack
  chargeTime: Types.f32       // Current charge progress
});
```

### Boss System

```typescript
function createBossSystem() {
  const bossQuery = defineQuery([Boss, Position, Health]);
  
  return function bossSystem(world: GameWorld, deltaTime: number) {
    const bosses = bossQuery(world);
    
    for (const eid of bosses) {
      const bossType = Boss.bossType[eid];
      
      switch (bossType) {
        case BossType.VORCHA:
          handleVorchaBehavior(world, eid, deltaTime);
          break;
        case BossType.WARBIRD:
          handleWarbirdBehavior(world, eid, deltaTime);
          break;
        case BossType.BORG_CUBE:
          handleBorgCubeBehavior(world, eid, deltaTime);
          break;
        // etc.
      }
    }
  };
}
```

---

## Player Experience Goals

### Tension Building
- Warning announcements create anticipation
- Resource stockpiling decisions become meaningful
- "Should I spend now or save for boss?"

### Memorable Moments
- Boss defeats feel like real victories
- Stories to share ("I barely survived the Borg Cube!")
- Screenshot-worthy encounters

### Strategic Depth
- Boss mechanics reward preparation
- Different builds counter different bosses
- Replayability through varied approaches

### Pacing Variety
- Boss waves break monotony of standard waves
- Recovery period after boss (easier wave follows)
- Emotional peaks and valleys

---

## Audio/Visual Enhancements

### Boss-Specific Music
- Standard waves: ambient space music
- Boss approach: tension building cue
- Boss fight: intense combat theme
- Boss defeat: victory fanfare

### Visual Effects
- Larger, more detailed sprites for bosses
- Screen shake on boss abilities
- Warning indicators (red glow for beam charge)
- Particle effects for special abilities

---

## Balance Considerations

### First-Time vs Repeat Encounters
- First boss encounter should be beatable with default build
- Later bosses encourage strategic preparation
- No "unfair" instant-kills

### Difficulty Curve
- Boss health scales with wave difficulty modifiers
- Ability damage doesn't scale (predictable threat)
- Escort spawns scale with wave number

### Edge Cases
- What if player has zero turrets at boss?
  - Boss moves slower, gives time to build
- What if boss killed instantly?
  - Still provides rewards
  - Consider minimum fight duration for drama

---

## Conclusion

Boss waves transform Kobayashi Maru from an incremental survival game into an epic space battle narrative. Each boss encounter creates memorable moments, encourages strategic thinking, and provides clear milestones in the player's journey. The variety of boss mechanics ensures fresh challenges and rewards mastery of different turret combinations.

**Estimated Implementation Time:** 5-7 days  
**Risk Level:** Medium (requires new systems)  
**ROI:** Significant engagement and memorability improvement
