# Gameplay Extension Quick Reference

**Date:** 2025-12-01  
**Purpose:** Quick lookup for extension features

---

## Weapons Quick Reference

| Tier | Weapon | Cost | DPS | Range | Special | Best Against |
|------|--------|------|-----|-------|---------|--------------|
| 1 | Phaser Array | 100 | 40 | 200 | Disable 5% | Fast swarms |
| 1 | Disruptor Bank | 150 | 30 | 250 | Armor break | Tanks |
| 1 | Torpedo Launcher | 200 | 25 | 350 | High burst | Single target |
| 1 | Tetryon Beam | 150 | 36 | 220 | Shield strip | High shields |
| 1 | Plasma Cannon | 180 | 28 | 200 | Burn DOT | Bioships |
| 2 | Quantum Torpedo | 300 | 37.5 | 400 | Execute | Bosses |
| 2 | Polaron Emitter | 280 | 30 | 240 | Power drain | Fast enemies |
| 2 | Chroniton Torpedo | 350 | 15 | 300 | AOE slow | Choke points |
| 3 | Gravimetric Torpedo | 550 | 13 | 350 | Pull/group | Scattered |
| 3 | Transphasic Torpedo | 700 | 40 | 380 | Shield bypass | High shields |
| 3 | Antiproton Beam | 650 | 54 | 260 | High crit | Raw DPS |
| 3 | Tricobalt Device | 800 | 20 | 450 | Massive AOE | Waves |

---

## Enemy Factions Quick Reference

| Faction | Shape | Color | Behavior | Special Mechanic | Wave |
|---------|-------|-------|----------|------------------|------|
| Klingon | Triangle | Red | DIRECT | Aggressive rush | 1+ |
| Romulan | Crescent | Green | STRAFE | Evasive | 6+ |
| Borg | Square | Green | SWARM | Coordinated | 11+ |
| Tholian | Diamond | Orange | FLANK | Flanking | 11+ |
| Species 8472 | Y-shape | Purple | HUNTER | Targets turrets | 11+ |
| Jem'Hadar | Triangle | Purple | KAMIKAZE | Ramming speed | 8+ |
| Cardassian | Spade | Yellow | ARTILLERY | Long-range fire | 10+ |
| Breen | Hexagon | Cyan | CLOAKING | Energy dampening | 12+ |
| Undine Frigate | Tripod | Lavender | FLUIDIC | Rift spawning | 15+ |
| Borg Tactical Cube | Square | Green | ADAPTIVE | Shield adaptation | 18+ |
| Web Spinners | Diamond | Orange | WEB_WEAVING | Disable turrets | 14+ |
| Borg Queen | Diamond | Green/Purple | COMMAND | Buff allies | 25+ |
| Doomsday Machine | Cone | Gray | PLANET_KILLER | Continuous beam | 30+ |

---

## Status Effects

| Effect | Duration | Impact | Visual |
|--------|----------|--------|--------|
| Burning | 5 sec | 4 dmg/sec, ignores shields | Orange particles |
| Slowed | 4 sec | 50% speed reduction | Blue aura |
| Drained | 3 sec | 30% speed/attack (stacks 3x) | Purple glow |
| Disabled | 3 sec | Systems offline | Red flash |

---

## Upgrade Tiers

| Tier | Cost | Damage | Fire Rate | Range | Visual |
|------|------|--------|-----------|-------|--------|
| 0 (Base) | 100% | 100% | 100% | 100% | Base color |
| 1 (Improved) | +50% | +50% | +25% | +10% | +Glow |
| 2 (Advanced) | +100% | +120% | +50% | +25% | +Size 1.2x |
| 3 (Elite) | +200% | +250% | +100% | +50% | +Pulse anim |

---

## Tech Tree Categories

**Weapon Systems (5 items)**
- Phaser Efficiency I-III
- Torpedo Velocity I-III
- Disruptor Penetration I-III
- Frequency Remodulation

**Defensive Systems (3 items)**
- Shield Harmonics I-III
- Structural Integrity I-III
- Shield Regeneration I-II

**Tactical Systems (3 items)**
- Targeting Computer I-III
- Fire Control I-III
- Sensor Array I-II

**Economic Systems (3 items)**
- Resource Efficiency I-III
- Industrial Replicator I-II
- Salvage Operations

**Special Systems (3 items)**
- Tachyon Detection Grid
- Bio-Molecular Warheads
- Temporal Shielding

---

## LCARS Color Palette

```
Command/Structural:
- Primary: #FF9900 (Orange)
- Secondary: #FFCC99 (Light Orange)

Science/Sensors:
- Primary: #99CCFF (Blue)
- Secondary: #5588EE (Dark Blue)
- Tertiary: #CCDDFF (Light Blue)

Engineering/Systems:
- Primary: #CC99CC (Purple)
- Secondary: #CC6666 (Red)

Status:
- Health: #33CC99 (Teal)
- Shield: #66AAFF (Blue)
- Danger: #DD4444 (Red)
- Warning: #FFCC00 (Yellow)
- Nominal: #33CC99 (Green)

Background:
- Background: #000000 (Black)
- Panel: #111111 (Dark Gray)
```

---

## Alert Status System

| Alert | Color | Audio | Trigger |
|-------|-------|-------|---------|
| Green | Blue/Purple | Bridge hum | No enemies |
| Yellow | Yellow/Gold | Woot... Woot... | Wave incoming |
| Red | Red/Salmon | EEEE-oooo | Combat active |
| Intruder | Grey/Red | "Intruder Alert" | Critical damage |

---

## Implementation Priority

**Phase 1 (2 weeks):**
- Tetryon, Plasma, Polaron weapons
- Jem'Hadar, Cardassian factions
- Status effect system
- Alert status UI
- Technobabble generator

**Phase 2 (4 weeks):**
- Quantum, Chroniton, Gravimetric weapons
- Breen, Undine, Tactical Cube factions
- Upgrade systems
- Tech tree
- Data dashboard

**Phase 3 (2 weeks):**
- Transphasic, Antiproton, Tricobalt weapons
- Borg Queen, Doomsday Machine bosses
- Prestige system
- Tutorial
- Final polish

---

**For full details, see:** `docs/research/20251201_Gameplay_Extension_Research.md`

