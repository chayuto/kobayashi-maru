# Recommendation: Dynamic Difficulty System

**Date:** 2025-12-01  
**Priority:** HIGH  
**Complexity:** Medium  
**Impact:** High engagement, extended play sessions

---

## Overview

Implement an adaptive difficulty system that responds to player performance in real-time, creating a personalized challenge curve that maintains engagement without overwhelming or boring players.

---

## Current State

The game currently uses **static difficulty scaling**:
- Enemy health/shields increase by 5% per wave (up to wave 10)
- 3% exponential growth after wave 10
- No adjustment based on player performance
- One-size-fits-all approach

**Problems:**
- Skilled players find early waves boring
- New players get overwhelmed around wave 5-7
- No "rubber banding" to prevent runaway difficulty
- Fixed curve doesn't adapt to turret efficiency

---

## Proposed System

### Performance Metrics Tracking

```typescript
interface PerformanceMetrics {
  kobayashiMaruHealthPercent: number;  // 0-100%
  turretEfficiency: number;            // kills per turret per minute
  resourceUtilization: number;         // resources spent vs earned
  averageTimeToKill: number;           // seconds to kill each enemy
  damageLeakage: number;               // damage taken vs damage dealt
  waveCompletionTime: number;          // seconds to complete wave
}
```

### Difficulty Modifiers

| Metric | If HIGH | If LOW |
|--------|---------|--------|
| KM Health | Increase enemy count +10% | Decrease count -10% |
| Turret Efficiency | Spawn enemies faster | Spawn slower |
| Resource Utilization | Reduce rewards -5% | Increase rewards +10% |
| Time to Kill | Add more tank enemies | Add more weak enemies |
| Damage Leakage | Add enemy ranged attacks | Reduce enemy damage |

### Adaptive Scaling Formula

```typescript
function calculateDifficultyModifier(metrics: PerformanceMetrics): number {
  // Base difficulty from wave number
  let baseDifficulty = getWaveDifficulty(currentWave);
  
  // Performance factor (-0.3 to +0.3)
  const performanceFactor = 
    (metrics.kobayashiMaruHealthPercent / 100 - 0.5) * 0.2 +
    (metrics.turretEfficiency / targetEfficiency - 1) * 0.1 +
    (metrics.resourceUtilization - 1) * 0.05;
  
  // Clamp to prevent extreme swings
  const modifier = clamp(performanceFactor, -0.3, 0.3);
  
  return baseDifficulty * (1 + modifier);
}
```

### Difficulty Zones

```
┌─────────────────────────────────────────────────────────────┐
│ FLOW ZONE (Optimal)                                        │
│ • KM Health: 50-80%                                        │
│ • Slight resource pressure                                 │
│ • Enemies challenging but manageable                       │
└─────────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌────────────────────┐    ┌────────────────────────────────┐
│ TOO EASY           │    │ TOO HARD                       │
│ • KM Health: 90%+  │    │ • KM Health: <40%              │
│ • Resource surplus │    │ • Resource starved             │
│ ACTION: Increase   │    │ ACTION: Decrease difficulty    │
│ difficulty         │    │ or provide bonus               │
└────────────────────┘    └────────────────────────────────┘
```

---

## Implementation Details

### New Components

```typescript
// DifficultyState.ts
export interface DifficultyState {
  currentModifier: number;      // 0.7 to 1.3 (multiplier)
  recentPerformance: number[];  // Rolling window of 5 waves
  adaptiveEnabled: boolean;     // Can be toggled off
  targetFlowState: FlowState;   // EASY, OPTIMAL, HARD
}

export enum FlowState {
  TOO_EASY = 'TOO_EASY',
  OPTIMAL = 'OPTIMAL',
  TOO_HARD = 'TOO_HARD',
  CRITICAL = 'CRITICAL'  // About to lose
}
```

### New DifficultyManager Class

```typescript
class DifficultyManager {
  private state: DifficultyState;
  private performanceHistory: PerformanceMetrics[] = [];
  
  // Called at end of each wave
  evaluatePerformance(metrics: PerformanceMetrics): void {
    this.performanceHistory.push(metrics);
    if (this.performanceHistory.length > 5) {
      this.performanceHistory.shift();
    }
    
    this.state.currentModifier = this.calculateModifier();
    this.state.targetFlowState = this.determineFlowState(metrics);
  }
  
  // Applied to wave configuration
  modifyWaveConfig(config: WaveConfig): WaveConfig {
    return {
      ...config,
      enemies: config.enemies.map(e => ({
        ...e,
        count: Math.floor(e.count * this.state.currentModifier),
        spawnDelay: e.spawnDelay / (0.8 + this.state.currentModifier * 0.4)
      }))
    };
  }
  
  // Emergency intervention
  triggerMercyMechanic(): void {
    if (this.state.targetFlowState === FlowState.CRITICAL) {
      // Clear 50% of remaining enemies
      // Grant bonus resources
      // Reduce next wave difficulty
    }
  }
}
```

---

## Player Experience Benefits

### 1. Extended Play Sessions
- Players stay in "flow state" longer
- Reduced frustration from spike difficulty
- Natural difficulty curve feels personal

### 2. Onboarding Improvement
- New players get gentler introduction
- System identifies struggling players automatically
- Gradual ramp-up prevents early dropoff

### 3. Skilled Player Retention
- Veterans challenged immediately
- No boring early waves
- Endless mode feels appropriately endless

### 4. Replayability
- Each run feels different
- Builds and strategies affect difficulty
- Emergent gameplay from adaptive system

---

## UI/UX Considerations

### Transparency Options

```
[Settings]
Adaptive Difficulty: [ON] [OFF]
Difficulty Display:  [Hidden] [Subtle] [Detailed]
```

### Subtle Indicators

- Shield icon color shifts (green → yellow → red)
- Wave announcement includes modifier hint
- "Tactical Assessment" log entries:
  - "Enemy reinforcements detected" (difficulty up)
  - "Enemy morale wavering" (difficulty down)

### Avoid Feeling "Cheated"

- Never tell player explicitly "made it easier"
- Frame reductions as tactical victories
- Use technobabble: "Subspace interference detected - enemy coordination disrupted"

---

## Balance Considerations

### Caps and Limits

| Parameter | Minimum | Maximum |
|-----------|---------|---------|
| Difficulty Modifier | 0.7x | 1.3x |
| Enemy Count Change | -20% | +30% |
| Spawn Rate Change | -25% | +25% |
| Stat Multiplier | -15% | +20% |

### Cooldowns

- Re-evaluation only at wave end
- Modifier changes capped at ±5% per wave
- "Mercy mechanic" only once per 5 waves

---

## Testing Strategy

### A/B Testing Metrics

- Session length (target: +30% with adaptive)
- Retry rate (target: +20% retention)
- Average wave reached (target: tighter distribution)
- Player-reported satisfaction (target: +15%)

### Edge Cases

1. **AFK Player** - Detect no turret placement, pause adaptive
2. **Intentional Farming** - Cap resource bonuses
3. **Speed Runner** - Allow disabling for leaderboards
4. **New Game+** - Start with higher base difficulty

---

## Conclusion

A dynamic difficulty system transforms Kobayashi Maru from a "memorize the wave patterns" game into a responsive, engaging experience that meets players where they are. This creates longer play sessions, better onboarding, and increased replay value without significantly changing core mechanics.

**Estimated Implementation Time:** 2-3 days  
**Risk Level:** Low (non-destructive addition)  
**ROI:** High engagement improvement
