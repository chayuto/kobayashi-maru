# Path B: Strategic AI Depth Plan

**Date:** 2025-12-13  
**Priority:** High  
**Estimated Effort:** 20-25 hours  
**Reference:** AI Autoplay Strategies - Section 6 (HRL), Section 5 (Resource Management)

---

## Executive Summary

This path focuses on enhancing the AI's strategic depth, enabling long-term planning, performance tracking, and adaptive learning. The goal is to transform the AI from a reactive system to a proactive strategic planner.

---

## Problem Statement

Current AI limitations:
1. **Greedy decision-making** - Optimizes for current wave, not long-term survival
2. **No sell/reposition capability** - Underperforming turrets never replaced
3. **No performance tracking** - Can't identify ineffective turrets
4. **No learning** - Doesn't adapt to player preferences or patterns
5. **Limited phase awareness** - Doesn't strongly differentiate early/mid/late game

---

## Proposed Changes

### Component 1: Turret Performance Tracking

#### [NEW] src/ai/analytics/TurretPerformanceTracker.ts

Track turret effectiveness metrics:
```typescript
interface TurretPerformance {
    turretId: number;
    turretType: number;
    position: { x: number; y: number };
    
    // Metrics
    kills: number;
    damageDealt: number;
    shotsFired: number;
    shotsHit: number;
    timeActive: number;
    
    // Derived
    efficiency: number;  // kills per second
    accuracy: number;    // hits / fired
    dpsCoverage: number; // actual DPS achieved
}

class TurretPerformanceTracker {
    recordKill(turretId: number, enemyValue: number): void;
    recordDamage(turretId: number, damage: number): void;
    recordShot(turretId: number, hit: boolean): void;
    getPerformance(turretId: number): TurretPerformance;
    getUnderperformers(threshold: number): TurretPerformance[];
    getTopPerformers(count: number): TurretPerformance[];
}
```

#### [MODIFY] src/systems/combatSystem.ts

Add hooks to record turret performance events.

---

### Component 2: Sell & Reposition Logic

#### [NEW] src/ai/strategy/SellAnalyzer.ts

Analyze when selling a turret is beneficial:
```typescript
interface SellAnalysis {
    turretId: number;
    currentValue: number;      // Performance score
    replacementValue: number;  // Expected value of replacement
    sellReturn: number;        // Gold returned
    shouldSell: boolean;
    reason: string;
}

class SellAnalyzer {
    analyzeSell(turretId: number): SellAnalysis;
    findBestReplacement(position: Position, budget: number): TurretType;
}
```

#### [MODIFY] src/ai/ActionPlanner.ts

Add SELL_TURRET action planning:
- Identify underperforming turrets
- Calculate sell + replace value
- Queue sell actions when profitable

---

### Component 3: Multi-Wave Strategic Planning

#### [NEW] src/ai/strategy/StrategicPlanner.ts

Plan actions across multiple waves:
```typescript
interface StrategicPhase {
    name: 'early' | 'mid' | 'late' | 'boss_prep' | 'crisis';
    economicBudget: number;     // % of resources for economy
    defenseBudget: number;      // % of resources for defense
    reserveTarget: number;      // Resources to hold for emergencies
}

interface StrategicPlan {
    currentPhase: StrategicPhase;
    wavesAhead: number;             // How far to plan
    upcomingBossWave: number | null;
    resourceAllocation: ResourceAllocation[];
}

class StrategicPlanner {
    getPhase(waveNumber: number, healthPercent: number): StrategicPhase;
    planResourceAllocation(currentWave: number, resources: number): Plan;
    shouldSaveForBoss(currentWave: number, resources: number): boolean;
}
```

---

### Component 4: Player Behavior Learning

#### [NEW] src/ai/learning/PlayerBehaviorLearner.ts

Learn from player placements when AI is disabled:
```typescript
interface PlacementRecord {
    position: { x: number; y: number };
    turretType: number;
    waveNumber: number;
    success: boolean;  // Did player survive this wave?
}

class PlayerBehaviorLearner {
    // Recording
    recordPlacement(data: PlacementRecord): void;
    recordWaveResult(waveNumber: number, survived: boolean): void;
    
    // Learning
    getPreferredPositions(waveNumber: number): Position[];
    getPreferredTurretType(position: Position): number;
    getSuccessfulPatterns(): PlacementPattern[];
    
    // Persistence
    save(): void;
    load(): void;
}
```

#### [MODIFY] src/game/PlacementManager.ts

Add hooks to record player placements when AI is disabled.

---

### Component 5: Enhanced Phase System

#### [MODIFY] src/ai/AIAutoPlayManager.ts

Integrate strategic planning into decision loop:
```typescript
// In update()
const phase = this.strategicPlanner.getPhase(
    this.waveNumber,
    this.kobayashiMaruHealthPercent
);

// Adjust action weights based on phase
if (phase.name === 'early') {
    this.actionBucketing.setWeight('economy', 1.5);
} else if (phase.name === 'boss_prep') {
    this.actionBucketing.setWeight('defense', 2.0);
}
```

---

## File Structure

```
src/ai/
├── analytics/                      # NEW
│   ├── TurretPerformanceTracker.ts
│   └── PositionHeatmap.ts
├── strategy/                       # NEW
│   ├── StrategicPlanner.ts
│   ├── SellAnalyzer.ts
│   └── ResourceForecaster.ts
├── learning/                       # NEW
│   ├── PlayerBehaviorLearner.ts
│   └── PatternMatcher.ts
├── ActionPlanner.ts                # MODIFY
├── AIAutoPlayManager.ts            # MODIFY
└── types.ts                        # MODIFY
```

---

## Implementation Stages

### Stage 1: Performance Tracking (4-5 hours)
1. Create `TurretPerformanceTracker.ts`
2. Add combat system hooks
3. Create efficiency metrics

### Stage 2: Sell/Reposition (5-6 hours)
1. Create `SellAnalyzer.ts`
2. Extend ActionPlanner with SELL actions
3. Implement ActionExecutor sell logic
4. Test sell decision quality

### Stage 3: Strategic Planning (5-6 hours)
1. Create `StrategicPlanner.ts`
2. Define phase transitions
3. Integrate with action bucketing
4. Test phase-appropriate behavior

### Stage 4: Learning System (5-6 hours)
1. Create `PlayerBehaviorLearner.ts`
2. Add placement recording hooks
3. Implement localStorage persistence
4. Integrate learned patterns into scoring

---

## Verification Plan

### Automated Tests

```bash
# Run existing tests
npm run test

# Run specific AI tests (if they exist)
npm run test -- --grep "AI"
```

#### New Test Files

[NEW] `src/__tests__/ai/TurretPerformanceTracker.test.ts`
- Test kill/damage recording
- Test efficiency calculation
- Test underperformer detection

[NEW] `src/__tests__/ai/StrategicPlanner.test.ts`
- Test phase transitions
- Test resource allocation
- Test boss wave preparation

### Manual Verification

1. **Performance tracking test:**
   - Play multiple waves with AI enabled
   - Check console logs for turret efficiency stats
   - Verify metrics accumulate correctly

2. **Sell logic test:**
   - Observe AI over 20+ waves
   - Verify AI eventually sells underperforming turrets
   - Verify replacements are better positioned

3. **Strategic planning test:**
   - Watch AI behavior in early waves (should be economic)
   - Watch AI behavior before wave 5 (should save resources)
   - Watch AI in late waves (should be defensive)

4. **Learning test:**
   - Play manually for 10 waves with good placements
   - Enable AI and observe if it uses similar positions

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Sell decisions too aggressive | Medium | Medium | Conservative thresholds |
| Learning overfits to bad patterns | Medium | Low | Require multiple successes |
| Strategic planning complexity | High | Low | Incremental implementation |

---

## Dependencies

- WavePredictor (already exists)
- ActionBucketing (already exists)
- LocalStorage API for persistence

---

## Success Metrics

- [ ] AI sells underperforming turrets when appropriate
- [ ] AI saves resources before boss waves
- [ ] AI behavior differs in early vs late game
- [ ] Learned patterns influence placement (when data exists)
- [ ] Average survival waves increase by 20%+

---

*Document Version: 1.0*
