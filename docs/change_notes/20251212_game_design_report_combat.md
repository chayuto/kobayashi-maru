# Kobayashi Maru - Game Design Report: Combat Mechanics

**Prepared for:** Senior Game Designer Consultation  
**Date:** 2025-12-12  
**Version:** 1.0

---

## Combat System Overview

Combat is fully automated - turrets target and fire at enemies without player input. The player's role is strategic placement and upgrades, not direct control.

---

## Damage Flow

```
Turret Fires
    │
    ▼
Weapon Type Check
    │
    ├─► Beam: Instant hit ──────────────────────────┐
    │                                                │
    └─► Projectile: Spawn projectile ──► Travel ──► Hit
                                                     │
                                                     ▼
                                            Apply Weapon Properties
                                            (shield/hull multipliers)
                                                     │
                                                     ▼
                                            Damage Shields First
                                            (if any remain)
                                                     │
                                                     ▼
                                            Damage Hull
                                            (remaining damage)
                                                     │
                                                     ▼
                                            Apply Status Effects
                                            (if weapon has them)
```

---

## Weapon Property Modifiers

### Shield/Hull Damage Multipliers
| Turret | Shield Damage | Hull Damage | Net Effect |
|--------|---------------|-------------|------------|
| Standard | 1.0× | 1.0× | Balanced |
| Tetryon Beam | 3.0× | 0.5× | Anti-shield specialist |

### Status Effect Application
| Turret | Effect | Chance | Parameters |
|--------|--------|--------|------------|
| Plasma Cannon | Burning | 100% | 4 dmg/tick × 5 ticks |
| Polaron Beam | Drained | 100% | 3s duration, stacks to 3 |
| Phaser Array | Disabled | (planned) | Not implemented |

---

## Status Effects

### Burning
| Property | Value |
|----------|-------|
| Damage per Tick | 4 |
| Tick Interval | 1.0 second |
| Duration | 5 seconds |
| Total Damage | 20 |
| Stacks | No (refreshes) |

### Slowed (Applied externally)
| Property | Value |
|----------|-------|
| Speed Reduction | Variable (0-100%) |
| Duration | Variable |
| Stacks | No |
| Recovery | Original speed restored |

### Drained (Polaron)
| Property | Value |
|----------|-------|
| Speed Reduction | 10% per stack |
| Max Stacks | 3 (30% total) |
| Duration per Stack | 3 seconds |
| Stacking | Additive |

### Disabled (Planned)
| Property | Value |
|----------|-------|
| Affected Systems | Bitfield (1=weapons, 2=engines, 4=shields) |
| Duration | Variable |
| Usage | Phaser special upgrade (not implemented) |

---

## Enemy Special Abilities

### Ability Overview
| Ability | Cooldown | Duration | Trigger Condition |
|---------|----------|----------|-------------------|
| Teleport | 8.0s | Instant | <30% HP or targeted |
| Cloak | 15.0s | 5.0s | <50% HP |
| Shield Regen | Passive | Constant | Always (if shields < max) |
| Split | On Death | Instant | HP reaches 0 |
| Summon | 20.0s | Instant | <50% HP |
| Drain | 5.0s | 3.0s | (Placeholder) |
| EMP Burst | 12.0s | 2.0s | (Placeholder) |
| Ramming Speed | 10.0s | 3.0s | <400px from target |

### Detailed Ability Mechanics

#### Teleport
- Triggers when health <30% or being targeted
- Finds safe position away from turrets and center
- Range: 300 pixels from threats
- Particle effect at both positions

#### Cloak
- Triggers when health <50%
- Reduces sprite alpha to 0.2 (TODO: implement)
- Duration: 5 seconds
- Cannot be re-triggered during cooldown

#### Shield Regeneration
- Passive ability, no cooldown
- Regen Rate: 5% of max shields per second
- Visual: Blue particles every 0.5s

#### Split
- Triggers on death
- Creates 2-3 smaller copies
- New enemies have 50% HP of original
- Spread in circle around death position

#### Summon
- Triggers when health <50%
- Spawns 2-3 reinforcements of same faction
- Spawn radius: 100 pixels
- 20 second cooldown prevents spam

#### Ramming Speed
- Activates within 400 pixels of target
- Doubles velocity for 3 seconds
- Increases collision damage potential
- Trail particle effect

---

## Collision System

### Collision Layers
| Layer | Entities |
|-------|----------|
| 0 | Federation (Kobayashi Maru, Turrets) |
| 1 | Enemies |
| 2 | Player Projectiles |
| 3 | Enemy Projectiles |

### Collision Masks
| Entity Type | Collides With |
|-------------|---------------|
| Player Projectile | Enemies (Layer 1) |
| Enemy Projectile | Federation (Layer 0) |
| Enemies | Federation (Layer 0) |

### Collision Damage
| Property | Value |
|----------|-------|
| Enemy Collision Radius | 40 pixels |
| Enemy Collision Damage | 25 HP |
| Kobayashi Maru Radius | 40 pixels |
| Turret Radius | 20 pixels |

---

## Targeting System

### Target Selection Criteria
1. Must be enemy (non-Federation faction)
2. Must be alive (HP > 0)
3. Must be within turret range
4. Prioritized by distance (closest first)

### Multi-Target System
| Upgrade Level | Max Targets | Behavior |
|---------------|-------------|----------|
| 0 | 1 | Standard |
| 1 | 2 | 150 resources |
| 2 | 3 | 300 resources |

Each target receives full damage (no splitting).

### Target Validation
- Checked every frame
- Invalid targets cleared automatically
- Reasons: death, out of range, removed

---

## Beam Weapon Visuals

### Electricity Jitter Effect
| Property | Value |
|----------|-------|
| Segment Count | 5 |
| Update Rate | Per frame |
| Perpendicular Offset | Random |

### Jitter Amounts by Turret
| Turret | Jitter (pixels) |
|--------|-----------------|
| Phaser Array | 6 |
| Plasma Cannon | 8 |
| Polaron Beam | 9 |
| Disruptor Bank | 10 |
| Tetryon Beam | 12 |

---

## Projectile System

### Projectile Types
| Type | Speed | Lifetime | Size | Color |
|------|-------|----------|------|-------|
| Photon Torpedo | 400 px/s | 5s | 8px | 0xFF6600 |
| Quantum Torpedo | 500 px/s | 6s | 9px | 0x00CCFF |
| Disruptor Bolt | 350 px/s | 4s | 6px | 0x00FF00 |

### Homing Behavior
- Player torpedoes track target entity
- Enemy projectiles do not home
- Velocity recalculated toward target position

### Object Pooling
- Projectiles use object pool
- Reduces garbage collection
- Configured via `USE_POOLING = true`

---

## Combat Statistics

### Tracked Metrics
| Metric | Purpose |
|--------|---------|
| Total Damage Dealt | Session total |
| Total Shots Fired | Accuracy base |
| Shots Hit | Accuracy numerator |
| DPS | Rolling 5-second window |
| Accuracy | shots hit / shots fired |

---

## Audio Feedback

### Weapon Sounds
| Sound Type | Turrets | Volume |
|------------|---------|--------|
| PHASER_FIRE | Phaser, Tetryon | 0.4-0.45 |
| TORPEDO_FIRE | Torpedo, Plasma | 0.55-0.6 |
| DISRUPTOR_FIRE | Disruptor, Polaron | 0.48-0.5 |

### Other Combat Audio
- WAVE_START: 0.7 volume
- WAVE_COMPLETE: 0.7 volume
- TURRET_PLACE: 0.7 volume (for upgrades)
- ERROR_BEEP: 0.5 volume (for sell)

---

## Design Observations

### Strengths
- Clear damage flow (shields → hull)
- Status effects add tactical variety
- Enemy abilities create emergent situations
- Spatial hash enables efficient collision

### Potential Improvements
1. **Disabled status** not fully implemented
2. **Drain ability** for enemies is placeholder
3. **EMP Burst ability** is placeholder
4. **No critical hits** despite component support
5. **No AOE damage** except torpedo special upgrade
6. **Shield bypass** mentioned but not implemented
7. **Beam weapons always hit** - consider evasion mechanic?

### Balance Considerations
1. Tetryon is very specialized - strong vs high-shield enemies only
2. Plasma DoT (20 damage) nearly doubles effective damage
3. Multi-target at level 2 triples DPS for 450 resources
4. Enemy collision damage (25) is significant vs turret HP (50-75)
5. Boss 10× HP with abilities may require specific counter-strategies

---

*Part of comprehensive game design analysis for Senior Game Designer consultation.*
