# Kobayashi Maru - Game Design Report: Turrets & Weapons

**Prepared for:** Senior Game Designer Consultation  
**Date:** 2025-12-12  
**Version:** 1.0

---

## Turret System Overview

The game features **6 turret types**, each with unique stats, visuals, and special mechanics. Turrets automatically target and fire at enemies within range.

---

## Turret Statistics

| Turret | Range | Fire Rate | Damage | Cost | HP | Shield | Special Mechanic |
|--------|-------|-----------|--------|------|-----|--------|------------------|
| **Phaser Array** | 200 | 4.0/s | 10 | 100 | 50 | 25 | High fire rate, good vs swarms |
| **Torpedo Launcher** | 350 | 0.5/s | 50 | 200 | 75 | 40 | Projectile-based, long range |
| **Disruptor Bank** | 250 | 2.0/s | 15 | 150 | 60 | 30 | Good all-rounder |
| **Tetryon Beam** | 220 | 3.0/s | 12 | 150 | 55 | 28 | 3× shield damage, 0.5× hull |
| **Plasma Cannon** | 200 | 1.0/s | 8 | 180 | 65 | 35 | Applies Burning (4 dmg/s × 5s) |
| **Polaron Beam** | 230 | 2.5/s | 11 | 160 | 58 | 32 | Stacking slow (max 3, 10% each) |

---

## Weapon Types

### Beam Weapons
- **Phaser Array, Disruptor Bank, Tetryon Beam, Polaron Beam**
- Instant hit (hitscan)
- Visual: Electricity jitter effect with 5 segments
- Jitter amounts vary by type (6-12 pixels)

### Projectile Weapons
- **Torpedo Launcher, Plasma Cannon**
- Physical projectile travels to target
- Can miss if target moves (homing for torpedoes)
- Torpedo: 400 px/s, 5s lifetime
- Has collision detection with enemies

---

## DPS Calculations

| Turret | Raw DPS | Effective DPS vs Shield | Effective DPS vs Hull |
|--------|---------|-------------------------|----------------------|
| Phaser Array | 40.0 | 40.0 | 40.0 |
| Torpedo Launcher | 25.0 | 25.0 | 25.0 |
| Disruptor Bank | 30.0 | 30.0 | 30.0 |
| Tetryon Beam | 36.0 | 108.0 | 18.0 |
| Plasma Cannon | 8.0 + DoT | 8.0 | 8.0 + 20 (DoT) |
| Polaron Beam | 27.5 | 27.5 | 27.5 |

**Plasma DoT:** 4 dmg/tick × 5 ticks = 20 additional damage over 5 seconds

---

## Upgrade System

### Upgrade Paths (5 total)

| Path | Max Level | Costs (per level) | Bonus |
|------|-----------|-------------------|-------|
| **Damage** | 3 | 50 / 100 / 200 | +25% / +50% / +100% |
| **Range** | 3 | 40 / 80 / 160 | +20% / +40% / +80% |
| **Fire Rate** | 3 | 60 / 120 / 240 | +30% / +60% / +120% |
| **Multi-Target** | 2 | 150 / 300 | 2 / 3 targets |
| **Special** | 3 | 75 / 150 / 300 | Turret-specific |

### Total Upgrade Costs
- **All paths to max:** 50+100+200 + 40+80+160 + 60+120+240 + 150+300 + 75+150+300 = **2,025 resources per turret**

---

## Special Upgrade Effects

| Turret | Ability Name | Levels |
|--------|--------------|--------|
| **Phaser Array** | Overload | 1: Disable enemy weapons, 2: Longer disable, 3: Chain lightning |
| **Torpedo Launcher** | Payload | 1: Small AOE, 2: Larger AOE, 3: Armor penetration |
| **Disruptor Bank** | Resonance | 1: Shield drain, 2: +Shield damage, 3: Shield bypass |
| **Tetryon Beam** | Polarize | 1: Weaken shields, 2: +Hull damage, 3: Shield collapse |
| **Plasma Cannon** | Inferno | 1: +Burn damage, 2: +Burn duration, 3: Burn spreads |
| **Polaron Beam** | Energy Drain | 1: Stronger slow, 2: Permanent slow, 3: Disable abilities |

---

## Turret Sell System

- **Refund Rate:** 75% of total investment
- Includes base cost + all upgrade costs
- Sprites properly cleaned up on sell

---

## Multi-Target Mechanics

| State | Max Targets | Requirement |
|-------|-------------|-------------|
| Base | 1 | None |
| Level 1 | 2 | 150 resources |
| Level 2 | 3 | 300 resources |

- Targeting prioritizes closest enemies
- Each target receives full damage (no split)
- Spatial hash used for efficient queries

---

## Kobayashi Maru Defense

The central ship has a built-in weapon:

| Property | Value |
|----------|-------|
| Type | Disruptor Bank (behavior) |
| Range | 250 pixels |
| Fire Rate | 2.0 shots/sec |
| Damage | 15 per hit |
| HP | 500 |
| Shield | 200 |

---

## Design Observations

### Strengths
- Good weapon variety with distinct roles
- Status effects add tactical depth
- Upgrade paths provide meaningful choices

### Potential Improvements
1. **Tetryon** is extremely specialized - may need balancing against shield-heavy factions
2. **Plasma DPS** appears low (8 + DoT) compared to alternatives
3. **Torpedo** has lowest DPS despite highest cost - projectile nature may cause misses
4. **Special upgrades** not fully implemented - effects are defined but not all coded
5. **Multi-target** very powerful at level 2 (triple targets) for 450 total cost

### Cost Efficiency Analysis
| Turret | Cost/DPS | Rating |
|--------|----------|--------|
| Phaser Array | 2.5 | Excellent |
| Disruptor Bank | 5.0 | Good |
| Tetryon Beam | 4.2 (avg) | Good vs shields |
| Polaron Beam | 5.8 | Fair + utility |
| Plasma Cannon | 6.4* | Fair + DoT |
| Torpedo Launcher | 8.0 | Poor base, range advantage |

*Plasma efficiency improves significantly with DoT fully applied

---

*Part of comprehensive game design analysis for Senior Game Designer consultation.*
