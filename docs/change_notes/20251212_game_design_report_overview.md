# Kobayashi Maru - Game Design Report: Overview

**Prepared for:** Senior Game Designer Consultation  
**Date:** 2025-12-12  
**Version:** 1.0

---

## Executive Summary

Kobayashi Maru is a tower defense game built on an Entity-Component-System (ECS) architecture using bitECS. The player defends a central objective (the Kobayashi Maru ship) against waves of enemies from multiple hostile factions. The game features a Star Trek-inspired theme with 6 enemy factions, 6 turret types, and a rich upgrade system.

---

## Game Concept

### Core Loop
1. **Wave Announcement** - Story text introduces each wave
2. **Enemy Spawning** - Enemies spawn from screen edges in formations
3. **Active Combat** - Turrets automatically target and fire at enemies
4. **Resource Collection** - 10 resources per enemy kill
5. **Turret Placement/Upgrades** - Player spends resources between waves
6. **Wave Completion** - 3-second delay before next wave
7. **Repeat until defeat** - Game ends when Kobayashi Maru is destroyed

### Win/Lose Conditions
- **Lose:** Kobayashi Maru health reaches 0
- **Win:** Survival-based scoring (no definitive win state - endless waves)

---

## Technical Architecture

### ECS Framework
| Layer | Description |
|-------|-------------|
| **Components** | Data-only arrays indexed by entity ID (Position, Health, Turret, etc.) |
| **Systems** | Logic processors that operate on entities with matching components |
| **Entities** | Integer IDs with component compositions |

### Core Systems (17 total)
| System | Purpose |
|--------|---------|
| AI System | Controls enemy movement behaviors |
| Combat System | Handles turret firing, damage, beams |
| Targeting System | Finds and assigns targets to turrets |
| Projectile System | Manages projectile movement and hits |
| Status Effect System | Processes burn, slow, drain effects |
| Ability System | Executes special enemy abilities |
| Damage System | Central damage calculation |
| Movement System | Applies velocities to positions |
| Render System | Sprite management and drawing |

### Game Managers (11 total)
| Manager | Purpose |
|---------|---------|
| Wave Manager | Spawning, progression, boss waves |
| Resource Manager | Currency tracking |
| Upgrade Manager | Turret upgrades and selling |
| Score Manager | Metrics, combo system |
| Placement Manager | Valid turret placement |
| Achievement Manager | Unlockables (if implemented) |
| High Score Manager | Leaderboard persistence |

---

## World Configuration

| Parameter | Value |
|-----------|-------|
| World Size | 1920 × 1080 pixels |
| Target FPS | 60 |
| Collision Cell Size | 64 pixels |
| Min Turret Distance | 64 pixels |
| Kobayashi Maru Radius | 40 pixels |
| Turret Radius | 20 pixels |

---

## Related Reports

1. **[Faction & Enemy Design](./20251212_game_design_report_factions.md)** - All 6 factions, stats, behaviors
2. **[Turret & Weapon Systems](./20251212_game_design_report_turrets.md)** - All 6 turret types, upgrades
3. **[Wave & Difficulty Scaling](./20251212_game_design_report_waves.md)** - Wave progression, bosses
4. **[Economy & Progression](./20251212_game_design_report_economy.md)** - Resources, combo, scoring
5. **[Combat Mechanics](./20251212_game_design_report_combat.md)** - Damage, status effects, abilities

---

*This document is part of a comprehensive game design analysis for Senior Game Designer consultation.*
