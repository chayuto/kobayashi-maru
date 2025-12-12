# Kobayashi Maru - Game Design Report: Economy & Progression

**Prepared for:** Senior Game Designer Consultation  
**Date:** 2025-12-12  
**Version:** 1.0

---

## Economy Overview

The game uses a single currency called **"Replication Matter"** (resources) for all purchases and upgrades.

---

## Resource Flow

### Income Sources
| Source | Amount | Notes |
|--------|--------|-------|
| Initial Resources | 500 | Game start |
| Enemy Kill (Normal) | 10 | Base reward |
| Enemy Kill (Elite) | 30 | 3× multiplier |
| Enemy Kill (Boss) | 100 | 10× multiplier |
| Boss Wave Completion | Varies | 2-5× reward multiplier |

### Expenditures
| Action | Cost Range | Notes |
|--------|------------|-------|
| Turret Placement | 100-200 | Per turret type |
| Turret Upgrade | 40-300 | Per upgrade level |
| Sell Turret | -75% refund | Returns investment |

---

## Turret Cost Analysis

### Base Turret Costs
| Turret | Cost | Kills to Afford |
|--------|------|-----------------|
| Phaser Array | 100 | 10 |
| Disruptor Bank | 150 | 15 |
| Tetryon Beam | 150 | 15 |
| Polaron Beam | 160 | 16 |
| Plasma Cannon | 180 | 18 |
| Torpedo Launcher | 200 | 20 |

### Upgrade Investment Totals
| Upgrade Path | Total Cost (all levels) |
|--------------|-------------------------|
| Damage (3 levels) | 350 |
| Range (3 levels) | 280 |
| Fire Rate (3 levels) | 420 |
| Multi-Target (2 levels) | 450 |
| Special (3 levels) | 525 |
| **All Paths** | **2,025** |

### Fully Upgraded Turret Investment
| Turret | Base + All Upgrades |
|--------|---------------------|
| Phaser Array | 2,125 |
| Disruptor Bank | 2,175 |
| Tetryon Beam | 2,175 |
| Polaron Beam | 2,185 |
| Plasma Cannon | 2,205 |
| Torpedo Launcher | 2,225 |

---

## Sell Refund System

- **Refund Rate:** 75%
- Includes base cost + all upgrade investments
- Encourages experimentation with lower risk

| Scenario | Investment | Refund |
|----------|------------|--------|
| Sell base Phaser | 100 | 75 |
| Sell upgraded Phaser (1 damage) | 150 | 112 |
| Sell full Phaser | 2,125 | 1,594 |

---

## Combo System

### Combo Multiplier Tiers
| Kill Streak | Multiplier | Score Increase |
|-------------|------------|----------------|
| 0-2 kills | 1× | Base |
| 3-5 kills | 2× | +100% |
| 6-9 kills | 3× | +200% |
| 10-19 kills | 5× | +400% |
| 20+ kills | 10× | +900% |

### Combo Mechanics
| Property | Value |
|----------|-------|
| Timeout | 3.0 seconds |
| Reset On | Timer expiration |
| Tracked | Max combo per session |

**Design Note:** Combo currently affects score only, not resources. Consider if resources should also scale.

---

## Scoring System

### Tracked Metrics
| Metric | Usage |
|--------|-------|
| Time Survived | Primary score component |
| Wave Reached | Wave number (1-indexed) |
| Enemies Defeated | Total kills |
| Civilians Saved | (Not actively used) |
| Combo Count | Current streak |
| Max Combo | Session high |
| Kills by Faction | Breakdown stats |

### Score Events (EventBus)
- `ENEMY_KILLED` - Triggers kill count + combo
- `WAVE_COMPLETED` - Updates wave reached
- `COMBO_UPDATED` - UI notification

---

## Wave Economy Flow

### Early Game (Waves 1-5)
| Wave | Enemies | Potential Income | Cumulative |
|------|---------|------------------|------------|
| 1 | 5 | 50 | 550 |
| 2 | 8 | 80 | 630 |
| 3 | 10 | 100 | 730 |
| 4 | 12 | 120 | 850 |
| 5 (Boss) | 16+ | 160+ (×2 boss) | 1,010+ |

### Mid Game (Waves 6-10)
| Wave | Enemies | Potential Income |
|------|---------|------------------|
| 6 | 16 | 160 |
| 7 | 16 | 160 |
| 8 | 22 | 220 |
| 9 | 28 | 280 |
| 10 (Boss) | 41+ | 410+ (×3 boss) |

### Income per Wave (Average)
- Waves 1-5: ~100 resources/wave
- Waves 6-10: ~250 resources/wave
- Waves 11+: Exponential growth

---

## Progression Milestones

### What Players Can Afford
| Resource Level | Available Actions |
|----------------|-------------------|
| 500 (Start) | 2-5 turrets OR 1 turret + upgrades |
| 1,000 | 5-10 turrets OR 3-4 upgraded turrets |
| 2,000 | Full turret grid OR 1 maxed turret |
| 5,000+ | Multiple maxed turrets |

---

## AI Autoplay System

The game includes an AI that can play automatically:

### AI Personalities
| Personality | Focus |
|-------------|-------|
| Balanced | Mixed approach |
| Aggressive | Offense first |
| Defensive | Coverage priority |
| Economic | Resource efficiency |
| Adaptive | Responds to threats |

### AI Actions
| Action | Description |
|--------|-------------|
| Place Turret | Chooses position and type |
| Upgrade Turret | Selects path based on value |
| Sell Turret | Recovers resources if ineffective |

### AI Decision Factors
- Threat Analysis (enemy positions, velocities, impact times)
- Coverage Map (sector DPS, enemy count, threat level)
- Expected Value (cost vs benefit per action)

---

## Design Observations

### Strengths
- Simple single-currency system
- 75% sell refund reduces player anxiety
- Combo system encourages aggressive play
- Elite/Boss multipliers reward skill

### Potential Improvements
1. **Combo doesn't affect resources** - consider resource combos
2. **Initial 500 resources** may limit Wave 1 strategy
3. **No income between waves** - only during combat
4. **Upgrade costs escalate rapidly** - may feel grindy
5. **Civilians Saved** metric tracked but not used
6. **No passive income** or interest mechanics
7. **Boss rewards** (2-5×) may not offset difficulty spike

### Economy Balance Questions
1. Is 10 resources/kill the right amount?
2. Should different factions give different rewards?
3. Is the 75% sell rate too generous or too punishing?
4. Should there be upgrade discounts or bulk deals?
5. Should combos affect resource income?

---

*Part of comprehensive game design analysis for Senior Game Designer consultation.*
