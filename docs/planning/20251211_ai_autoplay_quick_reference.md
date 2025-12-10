# AI Auto-Play Quick Reference

**Date:** December 11, 2025

---

## Overview

The AI Auto-Play system allows the game to play itself by making strategic decisions about turret placement and upgrades.

**⚠️ The AI follows all game rules - it is NOT a cheat system.**

---

## Game Rules Compliance

The AI uses the same APIs as player input:

| Action | API Used | Validation |
|--------|----------|------------|
| Place turret | `PlacementManager.placeTurret()` | Position, spacing, cost |
| Upgrade | `UpgradeManager.applyUpgrade()` | Level, cost |
| Sell | `UpgradeManager.sellTurret()` | 75% refund |

**AI cannot:**
- Bypass resource costs
- Place in invalid positions
- Act when paused
- See future spawns

---

## Architecture at a Glance

```
┌─────────────────────────────────────────────────────────────┐
│                    AIAutoPlayManager                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Threat    │  │   Action    │  │   Action    │          │
│  │  Analyzer   │─▶│   Planner   │─▶│  Executor   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Coverage   │  │ Personality │  │  Placement  │          │
│  │  Analyzer   │  │   Config    │  │   Manager   │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Classes

| Class | Purpose | Location |
|-------|---------|----------|
| `AIAutoPlayManager` | Main controller | `src/ai/AIAutoPlayManager.ts` |
| `ThreatAnalyzer` | Enemy analysis | `src/ai/ThreatAnalyzer.ts` |
| `CoverageAnalyzer` | Turret coverage | `src/ai/CoverageAnalyzer.ts` |
| `ActionPlanner` | Decision making | `src/ai/ActionPlanner.ts` |
| `ActionExecutor` | Action execution | `src/ai/ActionExecutor.ts` |

---

## Usage

### Toggle AI

```typescript
// In Game.ts
const isEnabled = game.toggleAI();
console.log(`AI is now ${isEnabled ? 'ON' : 'OFF'}`);
```

### Check Status

```typescript
const status = game.getAIStatus();
console.log(`Threat Level: ${status.threatLevel}%`);
console.log(`Coverage: ${status.coveragePercent}%`);
console.log(`Current Action: ${status.currentAction?.type}`);
```

### Set Personality

```typescript
import { AIPersonality } from '../ai';

game.setAIPersonality(AIPersonality.AGGRESSIVE);
```

---

## AI Personalities

| Personality | Placement | Upgrades | Style |
|-------------|-----------|----------|-------|
| **Balanced** | Ring around KM | Even | Default |
| **Aggressive** | Forward | Damage focus | High risk |
| **Defensive** | Close to KM | Range/utility | Conservative |
| **Economic** | Optimal | Cost-effective | Efficient |
| **Adaptive** | Based on threats | Counter-wave | Reactive |

---

## Decision Flow

```
Every 500ms:
  1. Analyze threats (enemy positions, velocities)
  2. Analyze coverage (turret positions, DPS)
  3. Plan actions (placement, upgrades)
  4. Execute highest priority action
```

---

## Configuration

```typescript
// src/config/ai.config.ts
AI_CONFIG = {
  DECISION_INTERVAL_MS: 500,    // How often AI thinks
  EMERGENCY_RESERVE: 100,       // Resources to keep
  OPTIMAL_KM_DISTANCE: 200,     // Ideal turret distance
  THREAT_LEVEL: {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 90
  }
}
```

---

## Threat Calculation

```
Threat Level = (Distance + Speed + Health) × Faction × Rank

Where:
- Distance: 0-100 (closer = higher)
- Speed: 0-30 (faster = higher)
- Health: 0-20 (more HP = higher)
- Faction: 1.0-1.8 multiplier
- Rank: 1.0 (normal), 1.5 (elite), 2.5 (boss)
```

---

## Placement Scoring

```
Score = Coverage + Threat + Distance + Synergy + Efficiency

Where:
- Coverage: +30 max (new area covered)
- Threat: +25 max (enemies in range)
- Distance: +15 max (optimal KM distance)
- Synergy: +20 max (complementary turrets)
- Efficiency: +10 max (cost vs DPS)
```

---

## Turret Selection Guide

| Enemy Type | Best Counter | Reason |
|------------|--------------|--------|
| Klingon (swarm) | Phaser Array | High fire rate |
| Romulan (strafe) | Polaron Beam | Slow effect |
| Borg (regen) | Tetryon Beam | Shield strip |
| Tholian (orbit) | Torpedo | Long range |
| Species 8472 | Plasma Cannon | DOT damage |
| Bosses | Torpedo + Tetryon | Burst + strip |

---

## Events

The AI listens to:
- `WAVE_STARTED` - Prepare defenses
- `WAVE_COMPLETED` - Evaluate performance
- `ENEMY_KILLED` - Update threat map
- `PLAYER_DAMAGED` - Emergency response
- `RESOURCE_UPDATED` - Re-plan actions

---

## Debug Mode

```typescript
// Enable AI logging
AI_CONFIG.DEBUG = true;

// Console output:
// [AI] Threat: 45% | Coverage: 72%
// [AI] Planning: PLACE_TURRET (Phaser) at (450, 320)
// [AI] Reason: Coverage gap in sector 12
```

---

## Performance

| Metric | Target | Actual |
|--------|--------|--------|
| Decision time | < 5ms | TBD |
| Memory overhead | < 1MB | TBD |
| Frame impact | < 2ms | TBD |

---

## Related Documents

- [Full Design Document](./20251211_ai_autoplay_system.md)
- [Implementation Tasks](./20251211_ai_autoplay_implementation_tasks.md)

---

*Quick Reference v1.0*
