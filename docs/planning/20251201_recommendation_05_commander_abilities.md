# Recommendation: Commander Abilities (Active Skills)

**Date:** 2025-12-01  
**Priority:** HIGH  
**Complexity:** Medium  
**Impact:** Player agency, clutch moments, skill expression

---

## Overview

Introduce active abilities that players can trigger during combat, giving direct control over tactical outcomes and creating exciting "clutch play" moments.

---

## Current State

The game is currently **fully passive** after turret placement:
- Place turrets during setup
- Watch turrets auto-fire at enemies
- No player input during combat phase
- No way to respond to emerging threats

**Problems:**
- Players feel like spectators, not commanders
- No skill expression beyond placement
- Missing excitement of clutch saves
- Low engagement during combat phase

---

## Proposed Ability System

### Core Concept

**"Command the USS Enterprise's tactical systems"**

Players have 3-4 active abilities on cooldowns that can turn the tide of battle when activated at the right moment.

### Ability Framework

```typescript
interface CommanderAbility {
  name: string;
  icon: string;
  cooldown: number;          // Seconds
  duration: number;          // Effect duration
  cost: number;              // Resource cost (0 for free)
  hotkey: string;            // Keyboard shortcut
  targetType: 'instant' | 'point' | 'area' | 'enemy';
  effect: AbilityEffect;
}
```

---

## Ability Roster

### 1. **Photon Spread** (Emergency Damage)

**"All forward torpedo tubes - FIRE!"**

```typescript
{
  name: 'Photon Spread',
  cooldown: 30,
  duration: 0,               // Instant
  cost: 0,
  hotkey: 'Q',
  targetType: 'instant',
  
  effect: {
    type: 'TORPEDO_BARRAGE',
    description: 'Fire 8 photon torpedoes in all directions',
    damage: 35,              // Per torpedo
    spread: 360,             // Degrees (full circle)
    origin: 'kobayashi_maru',
    homingStrength: 0.3      // Slight homing
  }
}
```

**Use Case:** Wave of enemies closing in from all sides, buy time with burst damage.

---

### 2. **Emergency Shield Extension** (Defensive)

**"Extend shield harmonics to the Maru!"**

```typescript
{
  name: 'Shield Extension',
  cooldown: 45,
  duration: 10,
  cost: 100,                 // Costs resources
  hotkey: 'W',
  targetType: 'instant',
  
  effect: {
    type: 'SHIELD_BOOST',
    description: 'Kobayashi Maru gains 300 temporary shields',
    shieldAmount: 300,
    regeneration: 30,        // +30 shield regen per second
    damageReduction: 0.25    // 25% damage reduction
  }
}
```

**Use Case:** KM taking heavy damage, buy time for turrets to clear enemies.

---

### 3. **Tachyon Burst** (Utility/Reveal)

**"Scanning for cloaked vessels..."**

```typescript
{
  name: 'Tachyon Burst',
  cooldown: 25,
  duration: 8,
  cost: 0,
  hotkey: 'E',
  targetType: 'instant',
  
  effect: {
    type: 'REVEAL_ALL',
    description: 'Reveal all enemies and remove their shields for 8 seconds',
    revealInvisible: true,   // Romulans in cloak fields
    shieldDisrupt: true,     // All enemy shields drop to 0
    markedForDeath: true     // All turrets gain +20% damage vs marked
  }
}
```

**Use Case:** High-shield Romulan wave, or to synergize with Torpedo damage.

---

### 4. **Gravity Well** (Crowd Control)

**"Activating tractor beam array!"**

```typescript
{
  name: 'Gravity Well',
  cooldown: 60,
  duration: 5,
  cost: 0,
  hotkey: 'R',
  targetType: 'point',       // Click to place
  
  effect: {
    type: 'GRAVITY_PULL',
    description: 'Create a gravity well that pulls enemies inward',
    radius: 250,             // Effect radius
    pullStrength: 100,       // Pixels per second toward center
    damagePerSecond: 10,     // Damage while trapped
    maxTargets: 50           // Performance limit
  }
}
```

**Use Case:** Scatter enemy formation, group for AOE, buy time by repositioning threats.

---

### 5. **Overload Weapons** (Buff)

**"Diverting auxiliary power to weapons!"**

```typescript
{
  name: 'Weapon Overload',
  cooldown: 40,
  duration: 8,
  cost: 50,
  hotkey: 'F',
  targetType: 'instant',
  
  effect: {
    type: 'TURRET_BUFF',
    description: 'All turrets gain +100% fire rate and +50% damage',
    fireRateMultiplier: 2.0,
    damageMultiplier: 1.5,
    visualEffect: 'turrets glow orange'
  }
}
```

**Use Case:** Boss approaching, maximize DPS window.

---

### 6. **Emergency Warp** (Utility)

**"Relocating to safe coordinates!"**

```typescript
{
  name: 'Emergency Warp',
  cooldown: 90,              // Long cooldown
  duration: 0,
  cost: 200,                 // Expensive
  hotkey: 'Space',
  targetType: 'instant',
  
  effect: {
    type: 'KOBAYASHI_REPOSITION',
    description: 'Teleport Kobayashi Maru to a safe location',
    invulnerabilityDuration: 2, // 2 seconds of immunity during warp
    destinationSelection: 'farthest from enemies',
    cooldownOnUse: true      // Can only use once per game
  }
}
```

**Use Case:** Desperate last resort when KM is surrounded.

---

## UI/UX Design

### Ability Bar

```
┌────────────────────────────────────────────────────────────────┐
│                     COMMANDER ABILITIES                        │
│                                                                │
│  [Q] 💥 Photon     [W] 🛡️ Shields    [E] 📡 Tachyon   [R] 🌀 Gravity │
│      READY           15.2s            READY            42.1s    │
│                      100💎                                       │
│                                                                │
│  ────────────────── SPECIAL ──────────────────                │
│  [F] ⚡ Overload    [SPACE] 🚀 E-Warp                          │
│      READY              READY (1 USE)                          │
│       50💎               200💎                                   │
└────────────────────────────────────────────────────────────────┘
```

### Visual Feedback

**On Activation:**
- Screen flash (brief, color matches ability)
- Sound effect (distinct per ability)
- Ability icon pulses
- Effect radius visible if applicable

**On Cooldown:**
- Grayed out icon
- Countdown timer overlay
- Subtle pulse when ready again

---

## Implementation Architecture

### AbilityManager Class

```typescript
class AbilityManager {
  private abilities: Map<string, AbilityState> = new Map();
  private cooldowns: Map<string, number> = new Map();
  
  constructor() {
    this.registerAbility('photon_spread', PHOTON_SPREAD_CONFIG);
    this.registerAbility('shield_extension', SHIELD_EXTENSION_CONFIG);
    this.registerAbility('tachyon_burst', TACHYON_BURST_CONFIG);
    this.registerAbility('gravity_well', GRAVITY_WELL_CONFIG);
    this.registerAbility('weapon_overload', WEAPON_OVERLOAD_CONFIG);
    this.registerAbility('emergency_warp', EMERGENCY_WARP_CONFIG);
  }
  
  activateAbility(
    abilityId: string, 
    world: GameWorld, 
    targetX?: number, 
    targetY?: number
  ): boolean {
    const ability = this.abilities.get(abilityId);
    if (!ability) return false;
    
    // Check cooldown
    if (this.cooldowns.get(abilityId)! > 0) return false;
    
    // Check resource cost
    if (!this.resourceManager.canAfford(ability.cost)) return false;
    
    // Deduct cost
    this.resourceManager.spendResources(ability.cost);
    
    // Start cooldown
    this.cooldowns.set(abilityId, ability.cooldown);
    
    // Execute effect
    this.executeEffect(ability.effect, world, targetX, targetY);
    
    return true;
  }
  
  update(deltaTime: number): void {
    // Tick down all cooldowns
    for (const [id, remaining] of this.cooldowns) {
      this.cooldowns.set(id, Math.max(0, remaining - deltaTime));
    }
  }
}
```

### Keyboard Integration

```typescript
// In InputManager
window.addEventListener('keydown', (e) => {
  switch (e.key.toLowerCase()) {
    case 'q':
      this.abilityManager.activateAbility('photon_spread', world);
      break;
    case 'w':
      this.abilityManager.activateAbility('shield_extension', world);
      break;
    case 'e':
      this.abilityManager.activateAbility('tachyon_burst', world);
      break;
    case 'r':
      // Show targeting reticle for gravity well
      this.startAbilityTargeting('gravity_well');
      break;
    case 'f':
      this.abilityManager.activateAbility('weapon_overload', world);
      break;
    case ' ':
      this.abilityManager.activateAbility('emergency_warp', world);
      break;
  }
});
```

### Point Targeting System

```typescript
class AbilityTargeting {
  private isTargeting: boolean = false;
  private currentAbility: string | null = null;
  private targetReticle: Graphics | null = null;
  
  startTargeting(abilityId: string): void {
    this.isTargeting = true;
    this.currentAbility = abilityId;
    this.showReticle(this.abilities.get(abilityId)!.effect.radius);
  }
  
  onMouseMove(x: number, y: number): void {
    if (this.targetReticle) {
      this.targetReticle.position.set(x, y);
    }
  }
  
  onMouseClick(x: number, y: number): void {
    if (this.isTargeting && this.currentAbility) {
      this.abilityManager.activateAbility(this.currentAbility, world, x, y);
      this.cancelTargeting();
    }
  }
}
```

---

## Ability Balance

### Cooldown Philosophy

| Ability | Power Level | Cooldown | Reasoning |
|---------|-------------|----------|-----------|
| Photon Spread | Medium | 30s | Reliable damage, usable ~2x per wave |
| Shield Extension | High | 45s | Strong defense, 1x per wave |
| Tachyon Burst | Medium | 25s | Utility, multiple uses |
| Gravity Well | Very High | 60s | Game-changing CC |
| Weapon Overload | High | 40s | Major DPS window |
| Emergency Warp | Emergency | 90s | Once per game |

### Resource Costs

- Free abilities: Balanced by cooldown alone
- Costly abilities: Require strategic resource management
- Most expensive = most desperate (Emergency Warp)

### Anti-Abuse

```typescript
// Prevent ability spam by enforcing global cooldown
const GLOBAL_COOLDOWN = 0.5; // 500ms between any ability
let lastAbilityTime = 0;

function canActivateAbility(): boolean {
  return performance.now() - lastAbilityTime > GLOBAL_COOLDOWN * 1000;
}
```

---

## Mobile Support

### Touch Controls

```
┌────────────────────────────────────────┐
│                                        │
│          [GAME AREA]                   │
│                                        │
├────────────────────────────────────────┤
│  [Q]  [W]  [E]  [R]  [F]  [SPACE]    │
│  💥   🛡️   📡   🌀   ⚡    🚀         │
└────────────────────────────────────────┘
```

- Large touch targets
- Tap to activate instant abilities
- Tap and drag for point-targeted abilities
- Haptic feedback on activation

---

## Player Skill Expression

### Timing Matters

- **Photon Spread** most effective when enemies clustered
- **Shield Extension** best used proactively, not reactively
- **Gravity Well** placement affects pull effectiveness
- **Weapon Overload** wasted if no enemies in range

### Resource Management

- Save resources for emergencies or spend on turrets?
- Balance ability costs with turret investment
- Long-term planning vs short-term survival

### Combos

1. **Tachyon + Overload:** Strip shields, then burst damage
2. **Gravity + Photon:** Group enemies, then AOE
3. **Shield + Overload:** Survive while maximizing damage
4. **Gravity + Plasma turrets:** Group for burn spread

---

## Unlockable Abilities (Future)

### Prestige Unlocks

| Unlock | Requirement | Ability |
|--------|-------------|---------|
| Wave 10 reached | Default | All basic abilities |
| 500 kills | Earn | **Subspace Tear** - Teleport enemies backward |
| 1000 kills | Earn | **Nadion Burst** - Phaser overload, stuns all |
| 50 waves total | Earn | **Temporal Shield** - Freeze time for 3 seconds |

### Ability Loadouts

- Choose 4 abilities from expanded roster
- Specialization builds (DPS, Tank, Control)
- Synergy with turret builds

---

## Audio/Visual Polish

### Sound Design

| Ability | Sound |
|---------|-------|
| Photon Spread | Multiple torpedo launch + impacts |
| Shield Extension | Shield hum + energy surge |
| Tachyon Burst | Scanning sweep + detection ping |
| Gravity Well | Deep rumble + pull whoosh |
| Weapon Overload | Power surge + weapon spin-up |
| Emergency Warp | Warp engine charge + flash |

### Visual Effects

- Each ability has unique particle effects
- Screen-space effects for major abilities
- Consistent with Star Trek aesthetics

---

## Conclusion

Commander Abilities transform the player from a passive observer into an active tactical commander. The ability to make split-second decisions, execute clutch saves, and express skill through timing creates the excitement that's currently missing during combat phases. This single addition significantly increases engagement and replayability.

**Estimated Implementation Time:** 3-4 days  
**Risk Level:** Low (additive system)  
**ROI:** Very high engagement improvement
