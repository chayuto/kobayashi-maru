# Kobayashi Maru - Game Design Report: Wave & Difficulty Scaling

**Prepared for:** Senior Game Designer Consultation  
**Date:** 2025-12-12  
**Version:** 1.0

---

## Wave System Overview

The game features **10 hand-crafted waves** followed by **procedural generation** for endless play. Boss waves occur at waves 5, 10, 15, and 20.

---

## Pre-Defined Wave Progression

| Wave | Factions | Enemy Count | Formation | Story Beat |
|------|----------|-------------|-----------|------------|
| 1 | Klingon | 5 | Random | Introduction |
| 2 | Klingon | 8 | Random | Escalation |
| 3 | Klingon | 10 | V-Formation | Organized attack |
| 4 | Klingon + Romulan | 8 + 4 | Random + Cluster | New threat |
| 5 | Klingon + Romulan | 10 + 6 | V-Formation + Random | **BOSS WAVE** |
| 6 | Klingon + Romulan | 6 + 10 | Random + Cluster | Romulan focus |
| 7 | Klingon + Romulan + Borg | 8 + 6 + 2 | Mixed | Borg introduction |
| 8 | Klingon + Romulan + Borg | 10 + 8 + 4 | Mixed | Borg presence grows |
| 9 | Klingon + Romulan + Borg | 12 + 10 + 6 | Mixed | Full assault prep |
| 10 | All 5 Factions | 15+12+8+4+2 | Mixed | **BOSS WAVE** |

---

## Spawn Formations

| Formation | Description | Use Case |
|-----------|-------------|----------|
| **Random** | Scattered edge spawns | Early waves, variety |
| **Cluster** | Grouped spawns (100px radius) | Romulan, Borg |
| **V-Formation** | Organized arrow (50px spacing) | Klingon attacks |

---

## Spawn Timing

| Wave | Faction | Spawn Delay (ms) | Rate |
|------|---------|------------------|------|
| Early | Klingon | 400-500 | ~2/sec |
| Mid | Klingon | 250-350 | ~3-4/sec |
| Late | Species 8472 | 1200 | ~0.8/sec |
| Boss | Support | 600-800 | ~1.5/sec |

**Max Spawns Per Frame:** 10 (prevents lag spikes)

---

## Difficulty Scaling

### Waves 1-10 (Linear)
```
Scale = 1 + (waveNumber - 1) × 0.05
```
| Wave | Scale Factor |
|------|--------------|
| 1 | 1.00× |
| 5 | 1.20× |
| 10 | 1.45× |

### Waves 11+ (Exponential)
```
Scale = 1.45 × (1.03)^(waveNumber - 10)
```
| Wave | Scale Factor |
|------|--------------|
| 15 | 1.68× |
| 20 | 1.95× |
| 30 | 2.62× |
| 50 | 4.73× |

---

## Procedural Wave Generation (Wave 11+)

### Enemy Counts
```
baseMultiplier = 1 + (wave - 10) × 0.2  // 20% more per wave
exponentialFactor = 1.1^(wave - 10)     // Exponential growth
```

| Wave | Klingon | Romulan | Borg | Tholian | Species 8472 |
|------|---------|---------|------|---------|--------------|
| 10 | 15 | 12 | 8 | 4 | 2 |
| 15 | 27 | 22 | 14 | 7 | 4 |
| 20 | 44 | 36 | 24 | 12 | 6 |
| 30 | 117 | 94 | 63 | 31 | 16 |

### Spawn Delay Scaling
```
delayMultiplier = max(0.5, 1 - (wave - 10) × 0.05)
```
Minimum 50% of original delays (twice as fast spawning)

---

## Boss Wave System

### Boss Wave Schedule
| Wave | Boss Type | Boss Count | Abilities | Reward Multiplier |
|------|-----------|------------|-----------|-------------------|
| 5 | Borg | 1 | Shield Regen, Summon | 2.0× |
| 10 | Species 8472 | 1 | Teleport, Cloak | 3.0× |
| 15 | Romulan | 2 | Cloak, Ramming Speed | 4.0× |
| 20 | Borg | 2 | Shield Regen, Split | 5.0× |

### Boss Support Enemies
| Wave | Boss Support | Additional Support |
|------|--------------|-------------------|
| 5 | 10 Borg | - |
| 10 | 5 Species 8472 | - |
| 15 | 15 Romulan | 10 Klingon |
| 20 | 20 Borg | 10 Tholian |

---

## Elite Spawn System

### Elite Spawn Chance
```
eliteChance = 0.10 + waveNumber × 0.01
```

| Wave | Elite Chance |
|------|--------------|
| 1 | 11% |
| 10 | 20% |
| 20 | 30% |
| 50 | 60% |

---

## Enemy Speed Scaling

### Base Speed
```
baseSpeed = 50 + random(0, 150)  // 50-200 px/s
speedScale = 1 + (wave - 1) × 0.02  // 2% faster per wave
finalSpeed = baseSpeed × speedScale
```

| Wave | Min Speed | Max Speed |
|------|-----------|-----------|
| 1 | 50 | 200 |
| 10 | 59 | 236 |
| 20 | 69 | 276 |

---

## Grace Periods

| Timing | Duration | Purpose |
|--------|----------|---------|
| Initial Grace | 5000 ms | Setup time before wave 1 |
| Wave Complete Delay | 3000 ms | Breather between waves |

---

## Wave Story System

- 50 unique story texts loaded from JSON
- Loops after wave 50 (normalizedWave = ((wave-1) % 50) + 1)
- Adds narrative context to each wave
- Fallback text: "Wave X: The battle continues..."

---

## Design Observations

### Strengths
- Good faction introduction pacing
- Boss waves create memorable moments
- Procedural scaling ensures endless play
- Story texts add immersion

### Potential Improvements
1. **Elite chance** may be too high at wave 50 (60%)
2. **No Tholian** or **Species 8472** until wave 10
3. **Wave 9** has 28 enemies, wave 10 has 41 - big jump
4. **Boss Wave 15** has 2 bosses but also 25 support - may spike difficulty
5. **Speed scaling** is linear - could feel slow at high waves
6. **No wave "rest" mechanic** - constant escalation may fatigue

### Difficulty Curve Visualization
```
Difficulty
    │    ╱
    │   ╱
    │  ╱     ← Exponential (wave 11+)
    │ ╱
    │╱─────── ← Linear (waves 1-10)
    └────────────────── Wave
        10   20   30
```

---

*Part of comprehensive game design analysis for Senior Game Designer consultation.*
