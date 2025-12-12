# Kobayashi Maru - Game Design Report: Factions & Enemies

**Prepared for:** Senior Game Designer Consultation  
**Date:** 2025-12-12  
**Version:** 1.0

---

## Faction Overview

The game features **6 hostile factions** inspired by Star Trek, each with unique visual themes, stat profiles, and AI behaviors.

---

## Faction Statistics

| Faction | Base HP | Base Shield | AI Behavior | Aggression | Special Traits |
|---------|---------|-------------|-------------|------------|----------------|
| **Klingon** | 80 | 30 | DIRECT | 1.0 | Fastest, aggressive |
| **Romulan** | 70 | 60 | STRAFE | 0.6 | Evasive, high shields |
| **Borg** | 150 | 100 | SWARM | 0.8 | Tanky, group behavior |
| **Tholian** | 60 | 40 | ORBIT | 0.5 | Ranged attacker, circles target |
| **Species 8472** | 200 | 0 | HUNTER | 1.0 | Targets turrets first |
| **Federation** | 100 | 50 | DIRECT | 0.5 | (Not used as enemy) |

---

## AI Behavior Patterns

### DIRECT (Klingon)
- Straight-line approach to Kobayashi Maru
- Maximum aggression, no evasion
- Fastest approach time
- **Tactical Role:** Pressure, overwhelm defenses

### STRAFE (Romulan)
- Sinusoidal weaving while approaching
- Frequency: 3 Hz, Amplitude: 0.5
- Harder to hit with projectiles
- **Tactical Role:** Survival, frustrate targeting

### SWARM (Borg)
- Group movement with noise variance
- Noise Frequency: 0.5, Amplitude: 0.2
- Creates unpredictable group patterns
- **Tactical Role:** Mass assault, absorb damage

### ORBIT (Tholian)
- Two-phase behavior:
  1. **Approach Phase:** Slow approach (40 px/s) until 300px from center
  2. **Orbit Phase:** Circles target at 50 px/s while firing
- **Tactical Role:** Ranged harassment, persistent damage

### HUNTER (Species 8472)
- Prioritizes nearest turret over Kobayashi Maru
- Forces player to defend turrets or lose them
- **Tactical Role:** Counter turrets, force repositioning

### FLANK (Unused)
- Implemented but not assigned to any faction
- Spiral approach at 45-degree angle
- Available for future enemy types

---

## Tholian Weapon System

Only Tholians have ranged weapons:

| Property | Value |
|----------|-------|
| Range | 350 pixels |
| Fire Rate | 0.5 shots/sec |
| Damage | 15 per shot |
| Projectile Type | Disruptor Bolt |
| Speed | 350 px/s |
| Lifetime | 4 seconds |

---

## Enemy Variants

### Normal Enemies
- Base stats as defined above
- Most common spawn type

### Elite Enemies
| Multiplier | Value |
|------------|-------|
| Health | 3.0× |
| Damage | 1.5× |
| Size | 1.3× |
| Score | 3.0× |
| Resources | 3.0× |
| Spawn Chance | 10% + 1%/wave |

### Boss Enemies
| Multiplier | Value |
|------------|-------|
| Health | 10.0× |
| Damage | 2.0× |
| Size | 2.0× |
| Score | 10.0× |
| Resources | 10.0× |

---

## Visual Identity

### Faction Colors (Hex)
| Faction | Primary | Glow |
|---------|---------|------|
| Federation | 0x00FFCC | 0x44FFFF |
| Klingon | 0xFF3344 | 0xFF6666 |
| Romulan | 0x88FF00 | 0xAAFF44 |
| Borg | 0x00FF88 | 0x66FFAA |
| Tholian | 0xFF8822 | 0xFFAA44 |
| Species 8472 | 0xDD66FF | 0xFF88FF |

---

## Design Observations

### Strengths
- Clear faction identity through behavior
- Good variety of tactical roles
- Elite/Boss system adds variety without new faction types

### Potential Improvements
1. **Romulan shields** are higher than HP - consider if this is intentional
2. **Species 8472** has 0 shields - purely HP-based, vulnerable to shield-piercing weapons
3. **Tholian** is only ranged enemy - consider adding more ranged threats
4. **Unused FLANK behavior** could create new enemy type
5. **Weapon variety** for enemies is limited to Tholian only

---

*Part of comprehensive game design analysis for Senior Game Designer consultation.*
