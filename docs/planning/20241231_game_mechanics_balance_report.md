# Kobayashi Maru: Game Mechanics & Balance Analysis Report

**Date:** 2024-12-31  
**Purpose:** Expert Game Designer Review for Maximum "Feel Good Fish Tank" Effect  
**Version:** 1.0

---

## Executive Summary

This report provides a comprehensive analysis of the Kobayashi Maru tower defense game mechanics, covering all aspects of game balance including enemy factions, wave progression, damage systems, economy (price/reward), resources, and upgrades. The analysis is intended for expert game designers to evaluate and optimize the game for a satisfying, calming "fish tank" viewing experience.

---

## Table of Contents

1. [Core Game Parameters](#1-core-game-parameters)
2. [Turret System Analysis](#2-turret-system-analysis)
3. [Enemy Faction Analysis](#3-enemy-faction-analysis)
4. [Wave System Analysis](#4-wave-system-analysis)
5. [Damage & Combat Analysis](#5-damage--combat-analysis)
6. [Economy Analysis (Price/Reward)](#6-economy-analysis-pricereward)
7. [Upgrade System Analysis](#7-upgrade-system-analysis)
8. [AI Systems Analysis](#8-ai-systems-analysis)
9. [Status Effects & Special Abilities](#9-status-effects--special-abilities)
10. [Balance Observations & Recommendations](#10-balance-observations--recommendations)

---

## 1. Core Game Parameters

### World Configuration
| Parameter | Value | Notes |
|-----------|-------|-------|
| World Size | 1920 × 1080 px | Full HD resolution |
| Target FPS | 60 | High performance target |
| Entity Capacity | 5000+ | ECS architecture with bitECS |
| Collision Cell Size | 64 px | Spatial hash grid |

### Kobayashi Maru (Defense Objective)
| Parameter | Value | Notes |
|-----------|-------|-------|
| Health | 500 HP | Must defend to survive |
| Shield | 200 | Absorbs damage first |
| Defense Weapon Range | 250 px | Built-in beam weapon |
| Defense Fire Rate | 2 shots/sec | Moderate rate |
| Defense Damage | 15 | Low but constant |
| Radius | 40 px | Collision detection |

### General Combat
| Parameter | Value | Notes |
|-----------|-------|-------|
| Enemy Collision Radius | 40 px | When enemies reach KM |
| Enemy Collision Damage | 25 | Damage dealt on impact |
| Slow Mode Multiplier | 0.5x | For slower gameplay |

---

## 2. Turret System Analysis

### Base Turret Statistics

| Turret Type | Cost | Damage | Fire Rate (shots/sec) | Range (px) | Health | Shield | DPS | Special |
|-------------|------|--------|----------------------|------------|--------|--------|-----|---------|
| **Phaser Array** | 110 | 10 | 3.5 | 200 | 50 | 25 | **35** | High fire rate, good for swarms |
| **Torpedo Launcher** | 160 | 60 | 0.6 | 350 | 75 | 40 | **36** | Highest damage, longest range (projectile) |
| **Disruptor Bank** | 140 | 15 | 2.0 | 250 | 60 | 30 | **30** | Good all-rounder |
| **Tetryon Beam** | 150 | 12 | 3.0 | 220 | 55 | 28 | **36*** | 3× shield damage, 0.5× hull damage |
| **Plasma Cannon** | 160 | 10 | 1.2 | 220 | 65 | 35 | **12+DOT** | Burning (4 dmg/sec × 5s = 20 extra) |
| **Polaron Beam** | 160 | 11 | 2.5 | 230 | 58 | 32 | **27.5** | Stacking slow (max 3 stacks, 10% each) |

### Turret DPS Analysis

```
Base DPS Ranking (without specials):
1. Torpedo Launcher: 36 DPS (burst)
2. Tetryon Beam: 36 DPS (vs shields) / 18 DPS (vs hull)
3. Phaser Array: 35 DPS (consistent)
4. Plasma Cannon: 12 DPS + 20 DOT over 5s = 32 effective DPS per hit
5. Disruptor Bank: 30 DPS
6. Polaron Beam: 27.5 DPS + utility slow
```

### Cost Efficiency Analysis

| Turret | Cost | DPS | DPS per 100 cost | Efficiency Rating |
|--------|------|-----|------------------|-------------------|
| Phaser Array | 110 | 35 | **31.8** | ⭐⭐⭐⭐⭐ Best Value |
| Disruptor Bank | 140 | 30 | 21.4 | ⭐⭐⭐ |
| Torpedo Launcher | 160 | 36 | 22.5 | ⭐⭐⭐ |
| Tetryon Beam | 150 | 36* | 24.0* | ⭐⭐⭐⭐ vs shields |
| Plasma Cannon | 160 | 32 eff. | 20.0 | ⭐⭐⭐ |
| Polaron Beam | 160 | 27.5 | 17.2 | ⭐⭐ (utility focused) |

> **Balance Observation:** Phaser Array offers exceptional DPS per cost, making it the most economically efficient turret. Consider increasing its cost to 130-140 or reducing fire rate to 3.0 for better balance.

---

## 3. Enemy Faction Analysis

### Base Enemy Statistics

| Faction | Health | Shield | Total EHP | AI Behavior | Movement Notes |
|---------|--------|--------|-----------|-------------|----------------|
| **Klingon** | 80 | 30 | 110 | DIRECT | Straight-line, fastest approach |
| **Romulan** | 70 | 60 | 130 | STRAFE | Sinusoidal weaving, evasive |
| **Borg** | 160 | 110 | 270 | SWARM | Coordinated group with noise |
| **Tholian** | 60 | 40 | 100 | ORBIT | Slow approach, circles at 300px |
| **Species 8472** | 220 | 0 | 220 | HUNTER | Targets turrets first |

### AI Behavior Speed Configuration

| Behavior | Default Speed | Notes |
|----------|--------------|-------|
| DIRECT (Klingon) | 100 px/s | Fast, aggressive |
| STRAFE (Romulan) | 80 px/s | 3Hz oscillation, 0.5 amplitude |
| SWARM (Borg) | 90 px/s | 0.5Hz noise, 0.2 amplitude |
| FLANK | 120 px/s | (Currently unused) |
| ORBIT (Tholian) | Approach: 40, Orbit: 50 px/s | Radius: 300px |
| HUNTER | 100 px/s | Same as direct |

### Enemy Toughness Analysis

```
Time to Kill (TTK) at 35 DPS (Phaser):
- Klingon: 110 EHP ÷ 35 = 3.14 seconds
- Romulan: 130 EHP ÷ 35 = 3.71 seconds (harder to hit)
- Borg: 270 EHP ÷ 35 = 7.71 seconds (tank)
- Tholian: 100 EHP ÷ 35 = 2.86 seconds (weakest)
- Species 8472: 220 EHP ÷ 35 = 6.29 seconds
```

### Enemy Weapon Systems

Only **Tholian** has ranged attacks:
| Parameter | Value |
|-----------|-------|
| Range | 350 px |
| Fire Rate | 0.5 shots/sec |
| Damage | 15 |
| Projectile Type | Disruptor Bolt |

---

## 4. Wave System Analysis

### Predefined Waves (1-10)

| Wave | Enemies | Total Count | Factions | Notable |
|------|---------|-------------|----------|---------|
| 1 | Klingon only | 5 | K | Tutorial wave |
| 2 | Klingon | 8 | K | Ramp up |
| 3 | Klingon (V-formation) | 10 | K | Formation intro |
| 4 | Klingon + Romulan | 6 + 6 = 12 | K, R | New faction |
| 5 | Klingon + Romulan | 10 + 6 = 16 | K, R | **BOSS WAVE** |
| 6 | Klingon + Romulan | 6 + 10 = 16 | K, R | Romulan focus |
| 7 | K + R + Borg | 8 + 6 + 2 = 16 | K, R, B | Borg intro |
| 8 | K + R + B | 10 + 8 + 4 = 22 | K, R, B | Mixed assault |
| 9 | K + R + B | 12 + 10 + 6 = 28 | K, R, B | Heavy assault |
| 10 | All factions | 12+10+6+4+2 = 34 | All | **BOSS WAVE** |

### Boss Wave Configuration

| Wave | Boss Type | Boss Count | Abilities | Support | Reward Multiplier |
|------|-----------|------------|-----------|---------|-------------------|
| 5 | Borg | 1 | Shield Regen, Summon | 10 Borg | 2.0× |
| 10 | Species 8472 | 1 | Teleport, Cloak | 5 Species 8472 | 3.0× |
| 15 | Romulan | 2 | Cloak, Ramming Speed | 15 Romulan, 10 Klingon | 4.0× |
| 20 | Borg | 2 | Shield Regen, Split | 20 Borg, 10 Tholian | 5.0× |

### Procedural Wave Generation (Wave 11+)

```typescript
Base Multiplier = 1 + (waveNumber - 10) × 0.2  // +20% per wave
Exponential Factor = 1.08^(waveNumber - 10)    // Compounding growth

Enemy Counts at Wave 15:
- Klingon: 15 × 2.0 × 1.47 ≈ 44
- Romulan: 12 × 2.0 × 1.47 ≈ 35
- Borg: 8 × 2.0 × 1.47 ≈ 23
- Tholian: 4 × 2.0 × 1.47 ≈ 12
- Species 8472: 2 × 2.0 × 1.47 ≈ 6
```

### Difficulty Scaling

| Wave Range | Health/Shield Multiplier | Formula |
|------------|-------------------------|---------|
| 1-10 | 1.0× to 1.45× | 1 + (wave - 1) × 0.05 |
| 11+ | 1.45× × 1.03^(wave-10) | Exponential growth |

Example scaling:
| Wave | Multiplier | Klingon EHP | Borg EHP |
|------|------------|-------------|----------|
| 1 | 1.00× | 110 | 270 |
| 5 | 1.20× | 132 | 324 |
| 10 | 1.45× | 160 | 392 |
| 15 | 1.68× | 185 | 454 |
| 20 | 1.95× | 215 | 527 |
| 30 | 2.62× | 288 | 707 |

### Wave Timing

| Parameter | Value |
|-----------|-------|
| Initial Grace Period | 5000 ms |
| Wave Complete Delay | 3000 ms |
| Max Spawns Per Frame | 10 |
| Spawn Delays | 250-1200 ms (varies by faction/wave) |

---

## 5. Damage & Combat Analysis

### Enemy Variants

| Variant | Health Mult | Damage Mult | Size Mult | Score Mult | Resource Mult |
|---------|-------------|-------------|-----------|------------|---------------|
| Normal | 1.0× | 1.0× | 1.0× | 1.0× | 1.0× |
| Elite | **3.0×** | 1.5× | 1.3× | 3.0× | **3.0×** |
| Boss | **10.0×** | 2.0× | 2.0× | 10.0× | **10.0×** |

### Elite Spawn Chance

```
Elite Chance = 10% + (wave × 1%)
Wave 1: 11%
Wave 10: 20%
Wave 20: 30%
Wave 50: 60%
```

### Variant Effective HP Examples

| Faction | Normal EHP | Elite EHP | Boss EHP |
|---------|------------|-----------|----------|
| Klingon | 110 | 330 | 1,100 |
| Romulan | 130 | 390 | 1,300 |
| Borg | 270 | 810 | 2,700 |
| Species 8472 | 220 | 660 | 2,200 |

### Damage Flow

```
Turret Attack → Shield (if any) → Hull Health
                    ↓
           Damage Multipliers Applied:
           - Shield Damage Mult (Tetryon: 3×)
           - Hull Damage Mult (Tetryon: 0.5×)
           - Status Effects Applied
```

### Projectile System

| Projectile | Speed (px/s) | Lifetime (s) | Size (px) |
|------------|-------------|--------------|-----------|
| Photon Torpedo | 400 | 5 | 8 |
| Quantum Torpedo | 500 | 6 | 9 |
| Disruptor Bolt | 350 | 4 | 6 |

---

## 6. Economy Analysis (Price/Reward)

### Resource System

| Parameter | Value |
|-----------|-------|
| Starting Resources | 500 |
| Resource Per Kill | 12 |
| Sell Refund Rate | 75% |

### Income Analysis

**Normal Kill Income:**
- Base: 12 resources per kill
- Elite: 12 × 3 = 36 resources
- Boss: 12 × 10 = 120 resources

**Wave Income Estimation (No Combo):**
| Wave | ~Enemies | ~Elites | Base Income |
|------|----------|---------|-------------|
| 1 | 5 | 0-1 | 60-84 |
| 5 | 16 | 2-3 | 216-252 |
| 10 | 34 | 7 | 516-552 |
| 15 | ~120 | ~30 | 1,440-2,160 |

### Combo Multiplier System

| Combo | Threshold | Multiplier | Streak Bonus |
|-------|-----------|------------|--------------|
| Tier 1 | 0 | 1× | Base |
| Tier 2 | 3 kills | 2× | Double scoring |
| Tier 3 | 6 kills | 3× | |
| Tier 4 | 10 kills | 5× | Major bonus |
| Tier 5 | 20 kills | 8× | |
| Tier 6 | 35 kills | 12× | |
| Tier 7 | 50 kills | **15×** | Maximum |

- **Combo Timeout:** 4.0 seconds

> **Fish Tank Note:** The combo system rewards continuous enemy flow. For optimal visual effect, spawn delays should allow combos to build but occasionally reset for "wave" visual patterns.

### Turret Investment Analysis

| Turret | Base Cost | Max Upgrade Investment | Total Possible | Sell Return (75%) |
|--------|-----------|----------------------|----------------|-------------------|
| Phaser | 110 | 1,055 | 1,165 | 874 |
| Torpedo | 160 | 1,055 | 1,215 | 911 |
| Disruptor | 140 | 1,055 | 1,195 | 896 |
| Tetryon | 150 | 1,055 | 1,205 | 904 |
| Plasma | 160 | 1,055 | 1,215 | 911 |
| Polaron | 160 | 1,055 | 1,215 | 911 |

---

## 7. Upgrade System Analysis

### Upgrade Paths

| Path | Max Level | Cost Progression | Effect Progression |
|------|-----------|-----------------|-------------------|
| **Damage** | 3 | 50 → 100 → 200 (350 total) | +25% → +50% → +100% |
| **Range** | 3 | 40 → 80 → 160 (280 total) | +20% → +40% → +80% |
| **Fire Rate** | 3 | 60 → 120 → 240 (420 total) | +30% → +60% → +120% |
| **Multi-Target** | 2 | 150 → 300 (450 total) | 2 → 3 targets |
| **Special** | 3 | 75 → 150 → 300 (525 total) | Turret-specific |

### Upgrade Value Analysis

**DPS Increase Per Path (Phaser Array baseline):**

| Upgrade | Cost | DPS Before | DPS After | DPS Gain | Cost per DPS |
|---------|------|------------|-----------|----------|--------------|
| Damage L1 | 50 | 35 | 43.75 | +8.75 | 5.7 |
| Damage L2 | 100 | 43.75 | 52.5 | +8.75 | 11.4 |
| Damage L3 | 200 | 52.5 | 70 | +17.5 | 11.4 |
| Fire Rate L1 | 60 | 35 | 45.5 | +10.5 | 5.7 |
| Fire Rate L2 | 120 | 45.5 | 56 | +10.5 | 11.4 |
| Fire Rate L3 | 240 | 56 | 77 | +21 | 11.4 |
| Multi-Target L1 | 150 | 35 | 70 | +35 | 4.3 |
| Multi-Target L2 | 300 | 70 | 105 | +35 | 8.6 |

> **Balance Finding:** Multi-Target upgrade offers the best DPS/cost ratio, especially for beam weapons.

### Maximum Upgraded Turret Stats

| Turret | Max DPS (L3 all) | Max Range | Max Targets |
|--------|-----------------|-----------|-------------|
| Phaser Array | 35 × 2 × 2.2 × 3 = **462** | 360 px | 3 |
| Torpedo Launcher | 36 × 2 × 2.2 × 3 = **475** | 630 px | 3 |
| Disruptor Bank | 30 × 2 × 2.2 × 3 = **396** | 450 px | 3 |

### Special Upgrade Effects

| Turret | Upgrade Name | Level 1 | Level 2 | Level 3 |
|--------|--------------|---------|---------|---------|
| Phaser | Overload | Disable weapons | Longer disable | Chain lightning |
| Torpedo | Payload | Small AOE | Larger AOE | Armor penetration |
| Disruptor | Resonance | Shield drain | +Shield damage | Shield bypass |
| Tetryon | Polarize | Weaken shields | +Hull damage | Shield collapse |
| Plasma | Inferno | +Burn damage | Longer burn | Burn spreads |
| Polaron | Energy Drain | Stronger slow | Permanent slow | Disable abilities |

---

## 8. AI Systems Analysis

### Enemy AI Behaviors (Detailed)

#### DIRECT (Klingon)
```
- Straight-line approach to Kobayashi Maru
- Preserves current speed while updating direction
- Simple, predictable - good for player learning
```

#### STRAFE (Romulan)
```
- Sinusoidal weaving while approaching
- Frequency: 3Hz, Amplitude: 0.5
- Makes them harder to hit with slow projectiles
- Maintains normalized speed
```

#### SWARM (Borg)
```
- Direct movement with group noise
- Noise Frequency: 0.5Hz, Amplitude: 0.2
- Creates organic "swarm cloud" visual effect
- Entity ID used for variation
```

#### HUNTER (Species 8472)
```
- Finds nearest turret instead of Kobayashi Maru
- If no turrets, targets KM
- Uses DIRECT behavior for movement
- Most dangerous to player defenses
```

#### ORBIT (Tholian)
```
- Phase 1: Slow approach (40 px/s) until reaching orbit radius
- Phase 2: Orbit at 300px radius at 50 px/s
- Oscillation added for variety
- Uses ranged attacks while orbiting
```

### Defender AI (AutoPlay System)

The game includes a full AI player system that can autonomously play the game.

#### AI Decision Timing
| Parameter | Value |
|-----------|-------|
| Decision Interval | 500 ms |
| Placement Cooldown | 1000 ms |
| Upgrade Cooldown | 750 ms |

#### AI Threat Analysis

**Faction Threat Modifiers:**
| Faction | Modifier | Reasoning |
|---------|----------|-----------|
| Klingon | 1.0× | Baseline threat |
| Romulan | 1.2× | Cloaking capability |
| Borg | 1.5× | Shield regen, tanky |
| Tholian | 1.3× | Ranged attacks |
| Species 8472 | **1.8×** | Turret hunter |

#### Turret-Faction Effectiveness Matrix

Values > 1.0 = effective counter, < 1.0 = less effective:

| Turret | Klingon | Romulan | Borg | Tholian | Species 8472 |
|--------|---------|---------|------|---------|--------------|
| Phaser | 1.5 | 0.8 | 0.7 | 1.0 | 0.6 |
| Torpedo | 0.8 | 1.0 | 1.2 | 1.4 | **1.5** |
| Disruptor | 1.0 | 1.0 | 0.9 | 1.0 | 0.9 |
| Tetryon | 0.8 | **1.4** | **1.6** | 1.0 | 0.5 |
| Plasma | 1.3 | 1.0 | 1.3 | 0.8 | 1.2 |
| Polaron | 1.0 | 1.3 | 0.8 | 1.1 | **1.4** |

#### AI Personalities

| Personality | Distance Bias | Coverage vs Damage | Damage vs Utility | Risk Tolerance |
|-------------|--------------|-------------------|-------------------|----------------|
| Balanced | 0 | 0 | 0 | 0.5 |
| Aggressive | -0.5 (closer) | +0.7 (damage) | +0.8 (damage) | 0.8 |
| Defensive | +0.6 (farther) | -0.5 (coverage) | -0.3 (utility) | 0.2 |
| Economic | +0.2 | -0.3 | 0 | 0.4 |
| Adaptive | 0 | 0 | 0 | 0.5 |

#### AI Mood System

The AI expresses emotions based on game state for enhanced "fish tank" engagement:

| Mood | Trigger Conditions |
|------|-------------------|
| CALM | Low threat, stable coverage |
| FOCUSED | Active combat, moderate threat |
| CONCERNED | Rising threat or low KM health |
| STRESSED | High threat level |
| TRIUMPHANT | Wave completed successfully |

---

## 9. Status Effects & Special Abilities

### Status Effects (Applied by Player Weapons)

#### Burning (Plasma Cannon)
| Parameter | Value |
|-----------|-------|
| Damage Per Tick | 4 |
| Tick Interval | 1.0 second |
| Total Duration | 5 seconds |
| Total Extra Damage | 20 |

#### Drained (Polaron Beam)
| Parameter | Value |
|-----------|-------|
| Slow Per Stack | 10% |
| Max Stacks | 3 |
| Maximum Slow | 30% |
| Duration Per Stack | 3 seconds |

#### Slowed
| Parameter | Value |
|-----------|-------|
| Speed Reduction | Variable |
| Duration | Variable |

#### Disabled
| Parameter | Value |
|-----------|-------|
| Effect | Systems offline |
| Duration | Variable |

### Special Abilities (Enemy Bosses/Elites)

#### Teleport
| Parameter | Value |
|-----------|-------|
| Cooldown | 8 seconds |
| Trigger | Health < 30% OR being targeted |
| Range | 300 px (from threats) |

#### Cloak
| Parameter | Value |
|-----------|-------|
| Cooldown | 15 seconds |
| Duration | 5 seconds |
| Trigger | Health < 50% |
| Alpha While Cloaked | 0.2 |

#### Shield Regeneration (Passive)
| Parameter | Value |
|-----------|-------|
| Regen Rate | 5% of max per second |
| Always Active | Yes |

#### Split (On Death)
| Parameter | Value |
|-----------|-------|
| Split Count | 2-3 enemies |
| Child Stats | 50% of parent |
| Child Size | 0.7× scale |

#### Summon
| Parameter | Value |
|-----------|-------|
| Cooldown | 20 seconds |
| Trigger | Health < 50% |
| Spawn Count | 2-3 reinforcements |
| Spawn Radius | 100 px |

#### Energy Drain (Placeholder)
*Not fully implemented*

#### EMP Burst (Placeholder)
*Not fully implemented*

#### Ramming Speed
| Parameter | Value |
|-----------|-------|
| Cooldown | 10 seconds |
| Trigger | Distance < 400 px from target |
| Duration | 3 seconds |
| Effect | 2× velocity |

---

## 10. Balance Observations & Recommendations

### For "Fish Tank" Optimization

The "Feel Good Fish Tank" effect requires:
1. **Visual Continuity:** Constant enemy flow with no dead periods
2. **Satisfying Destruction:** Regular, visible enemy deaths
3. **Power Fantasy:** Player defenses feel effective
4. **Escalating Tension:** Gradual difficulty increase
5. **Strategic Depth:** Meaningful choices that look different

### Current Balance Strengths ✅

1. **Faction Diversity:** Each faction has distinct visual and behavioral patterns
2. **Combo System:** Encourages continuous engagement (4s timeout perfect for flow)
3. **Wave Pacing:** 3s between waves allows for visual reset
4. **AI Variety:** 6 behavior types create interesting movement patterns
5. **Upgrade Visual Impact:** Multi-target creates visible beam "webs"

### Recommended Adjustments ⚠️

#### 1. Turret Balance
```
Issue: Phaser Array is too cost-efficient
Recommendation:
- Increase Phaser cost: 110 → 130
- OR reduce fire rate: 3.5 → 3.0 (DPS: 35 → 30)
```

#### 2. Early Wave Pacing
```
Issue: Waves 1-3 may feel slow for experienced players
Recommendation:
- Reduce spawn delays in early waves by 20%
- Add 2-3 more enemies to Wave 1-2
```

#### 3. Enemy Speed Variance
```
Issue: All enemies except Tholian approach at similar speeds
Recommendation:
- Increase Klingon DIRECT speed: 100 → 130 (aggressive)
- Decrease Borg SWARM speed: 90 → 75 (menacing slow advance)
```

#### 4. Elite Visual Impact
```
Current: 10% + 1%/wave spawn chance
Recommendation: 
- Consider minimum 2 elites per wave after wave 5
- Guaranteed elite at specific wave intervals for drama
```

#### 5. Resource Balance for Fish Tank
```
Issue: Player may become too wealthy in late game
Recommendation:
- Increase late-wave turret costs by 5-10%
- OR reduce resource per kill to 10 (from 12)
- Add resource drain mechanic (maintenance cost?)
```

#### 6. Enhance Visual Variety
```
Recommendation:
- Add more formation types (diamond, pincer, line)
- Vary spawn points more dramatically
- Consider "lull before storm" waves with brief pauses
```

### Suggested Configuration Experiments

#### Experiment A: Faster Pace
```typescript
WAVE_CONFIG.TIMING.COMPLETE_DELAY_MS = 2000;  // Was 3000
SPAWN delays reduced by 30%
```

#### Experiment B: Higher Combo Ceiling
```typescript
SCORE_CONFIG.COMBO.TIERS = [
  { threshold: 0, multiplier: 1 },
  { threshold: 5, multiplier: 2 },   // Was 3
  { threshold: 15, multiplier: 5 },  // Was 10
  { threshold: 30, multiplier: 10 }, // Was 20
  { threshold: 50, multiplier: 20 }, // Was 35
];
```

#### Experiment C: Varied Wave Density
```typescript
// Alternate between "swarm" and "elite" waves
Wave N (odd): 2× enemies, 0% elite chance
Wave N (even): 0.5× enemies, 30% elite chance
```

---

## Appendix A: Quick Reference Tables

### Enemy EHP Quick Reference
| Faction | Normal | Elite | Boss |
|---------|--------|-------|------|
| Klingon | 110 | 330 | 1,100 |
| Romulan | 130 | 390 | 1,300 |
| Borg | 270 | 810 | 2,700 |
| Tholian | 100 | 300 | 1,000 |
| Species 8472 | 220 | 660 | 2,200 |

### Turret Summary
| Type | Cost | DPS | Range | Special |
|------|------|-----|-------|---------|
| Phaser | 110 | 35 | 200 | High RoF |
| Torpedo | 160 | 36 | 350 | Burst |
| Disruptor | 140 | 30 | 250 | Balanced |
| Tetryon | 150 | 36* | 220 | Anti-shield |
| Plasma | 160 | 32 eff | 220 | DOT |
| Polaron | 160 | 27.5 | 230 | Slow |

### Key Timing Values
| Event | Duration |
|-------|----------|
| Wave Grace Period | 5s |
| Between Waves | 3s |
| Combo Timeout | 4s |
| AI Decision | 500ms |
| Cloak Duration | 5s |
| Burn Duration | 5s |

---

## Appendix B: File Reference

Key configuration files for balance tuning:

| File | Contains |
|------|----------|
| `src/types/config/turrets.ts` | Turret stats, costs, upgrades |
| `src/types/config/enemies.ts` | Ranks, abilities |
| `src/types/config/factions.ts` | Faction IDs, colors, AI behaviors |
| `src/types/config/game.ts` | Core game constants |
| `src/ecs/entityTemplates.ts` | Enemy base stats |
| `src/game/waveConfig.ts` | Wave definitions, scaling |
| `src/config/wave.config.ts` | Wave timing |
| `src/config/score.config.ts` | Combo system |
| `src/config/autoplay.config.ts` | AI player settings |

---

**Report End**

*Generated for Kobayashi Maru v1.0 - Star Trek Tower Defense*
