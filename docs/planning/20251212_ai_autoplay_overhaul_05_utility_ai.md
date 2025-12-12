# Stage 5: Utility AI Enhancement

**Date:** December 12, 2025  
**Stage:** 5 of 6  
**Priority:** Medium  
**Estimated Hours:** 4-6  
**Dependencies:** Stages 1-4

---

## Overview

This stage implements proper Utility AI patterns from the research document:
- Mathematical scoring curves (linear, quadratic, exponential)
- Action bucketing (Survival > Combat > Economy)
- Decision inertia to prevent thrashing
- Dynamic weight adjustment based on game state

---

## Research Foundation

From the research document:

> "The core of Utility AI is the conversion of game data into a normalized score (usually 0.0 to 1.0). This conversion is rarely linear. Strategic fidelity is achieved through the use of specific mathematical curves."

Key concepts:
1. **Scoring Curves:** Different curves for different decision types
2. **Bucketing:** Group actions by category, score buckets first
3. **Inertia:** Current action gets bonus to prevent rapid switching
4. **Dynamic Weights:** Adjust based on game phase and urgency

---

## Implementation Plan

### Task 5.1: Create ScoringCurves Utility

**File:** `src/ai/utility/ScoringCurves.ts`

```typescript
/**
 * ScoringCurves
 * 
 * Mathematical functions for converting game values to utility scores.
 * Different curves model different decision urgencies.
 */

export type CurveType = 'linear' | 'quadratic' | 'exponential' | 'logistic' | 'step';

export interface CurveConfig {
  type: CurveType;
  min?: number;      // Input minimum (default 0)
  max?: number;      // Input maximum (default 1)
  steepness?: number; // For logistic curve
  threshold?: number; // For step curve
  invert?: boolean;  // Flip the curve
}

/**
 * Utility scoring curves for AI decision making
 */
export class ScoringCurves {
  /**
   * Apply a scoring curve to normalize a value to 0-1
   */
  static score(value: number, config: CurveConfig): number {
    const { type, min = 0, max = 1, steepness = 5, threshold = 0.5, invert = false } = config;
    
    // Normalize input to 0-1
    const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
    
    let result: number;
    
    switch (type) {
      case 'linear':
        result = normalized;
        break;
      
      case 'quadratic':
        // Accelerating curve - slow start, fast finish
        result = normalized * normalized;
        break;
      
      case 'exponential':
        // Very slow start, very fast finish
        // Good for urgency (health critical, etc.)
        result = (Math.exp(normalized * 3) - 1) / (Math.E ** 3 - 1);
        break;
      
      case 'logistic':
        // S-curve - slow start, fast middle, slow finish
        // Good for binary-like decisions with smooth transition
        const x = (normalized - 0.5) * steepness * 2;
        result = 1 / (1 + Math.exp(-x));
        break;
      
      case 'step':
        // Binary threshold
        result = normalized >= threshold ? 1 : 0;
        break;
      
      default:
        result = normalized;
    }
    
    return invert ? 1 - result : result;
  }
  
  /**
   * Pre-configured curves for common use cases
   */
  static readonly PRESETS = {
    /**
     * Health urgency - exponential
     * Low health = extreme urgency
     */
    healthUrgency: (healthPercent: number): number => {
      // Invert so low health = high score
      return ScoringCurves.score(healthPercent, {
        type: 'exponential',
        invert: true
      });
    },
    
    /**
     * Distance scoring - quadratic falloff
     * Closer = higher score, but not linear
     */
    distanceValue: (distance: number, maxDistance: number): number => {
      return ScoringCurves.score(distance, {
        type: 'quadratic',
        max: maxDistance,
        invert: true
      });
    },
    
    /**
     * Resource efficiency - linear
     * More resources = more options
     */
    resourceValue: (resources: number, maxResources: number): number => {
      return ScoringCurves.score(resources, {
        type: 'linear',
        max: maxResources
      });
    },
    
    /**
     * Threat response - logistic
     * Smooth transition from "ignore" to "respond"
     */
    threatResponse: (threatLevel: number): number => {
      return ScoringCurves.score(threatLevel, {
        type: 'logistic',
        max: 100,
        steepness: 8
      });
    },
    
    /**
     * Coverage gap - exponential
     * Large gaps are much more urgent than small ones
     */
    coverageGap: (gapPercent: number): number => {
      return ScoringCurves.score(gapPercent, {
        type: 'exponential',
        max: 100
      });
    },
    
    /**
     * Wave timing - logistic
     * Urgency increases as wave approaches
     */
    waveTiming: (timeUntilWave: number, maxTime: number): number => {
      return ScoringCurves.score(timeUntilWave, {
        type: 'logistic',
        max: maxTime,
        steepness: 6,
        invert: true
      });
    }
  };
}
```

**Acceptance Criteria:**
- [ ] All curve types implemented correctly
- [ ] Presets cover common use cases
- [ ] Output always in 0-1 range
- [ ] Inversion works correctly

---

### Task 5.2: Create ActionBucketing System

**File:** `src/ai/utility/ActionBucketing.ts`

```typescript
/**
 * ActionBucketing
 * 
 * Groups actions into priority buckets.
 * Buckets are scored first, then actions within winning bucket.
 */

import { AIAction, AIActionType } from '../types';
import { ScoringCurves } from './ScoringCurves';

export enum ActionBucket {
  SURVIVAL = 'SURVIVAL',   // Emergency actions (sell for resources, etc.)
  DEFENSE = 'DEFENSE',     // Placement and upgrades for defense
  ECONOMY = 'ECONOMY',     // Resource optimization
  EXPANSION = 'EXPANSION'  // Forward placement, aggressive moves
}

export interface BucketWeights {
  [ActionBucket.SURVIVAL]: number;
  [ActionBucket.DEFENSE]: number;
  [ActionBucket.ECONOMY]: number;
  [ActionBucket.EXPANSION]: number;
}

export interface GameContext {
  healthPercent: number;      // KM health 0-100
  resources: number;
  threatLevel: number;        // 0-100
  coveragePercent: number;    // 0-100
  waveNumber: number;
  isWaveActive: boolean;
}

export class ActionBucketing {
  /**
   * Calculate bucket weights based on game context
   */
  static calculateBucketWeights(context: GameContext): BucketWeights {
    const weights: BucketWeights = {
      [ActionBucket.SURVIVAL]: 0,
      [ActionBucket.DEFENSE]: 0,
      [ActionBucket.ECONOMY]: 0,
      [ActionBucket.EXPANSION]: 0
    };
    
    // SURVIVAL: Exponential urgency when health is low
    if (context.healthPercent < 50) {
      weights[ActionBucket.SURVIVAL] = ScoringCurves.PRESETS.healthUrgency(
        context.healthPercent / 100
      ) * 2.0; // 2x multiplier for survival
    }
    
    // DEFENSE: High when threat is high or coverage is low
    const threatScore = ScoringCurves.PRESETS.threatResponse(context.threatLevel);
    const coverageGapScore = ScoringCurves.PRESETS.coverageGap(100 - context.coveragePercent);
    weights[ActionBucket.DEFENSE] = Math.max(threatScore, coverageGapScore) * 1.5;
    
    // ECONOMY: Higher in early game, lower when threatened
    const earlyGameBonus = context.waveNumber < 5 ? 0.3 : 0;
    const threatPenalty = context.threatLevel > 50 ? 0.5 : 0;
    weights[ActionBucket.ECONOMY] = 0.5 + earlyGameBonus - threatPenalty;
    
    // EXPANSION: Only when stable
    if (context.healthPercent > 70 && context.coveragePercent > 60 && context.threatLevel < 40) {
      weights[ActionBucket.EXPANSION] = 0.8;
    }
    
    // Normalize weights
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      for (const bucket of Object.keys(weights) as ActionBucket[]) {
        weights[bucket] /= total;
      }
    }
    
    return weights;
  }
  
  /**
   * Classify an action into a bucket
   */
  static classifyAction(action: AIAction, context: GameContext): ActionBucket {
    switch (action.type) {
      case AIActionType.SELL_TURRET:
        // Selling is usually survival (need resources)
        return ActionBucket.SURVIVAL;
      
      case AIActionType.PLACE_TURRET:
        // Placement depends on position
        // Close to KM = defense, far = expansion
        const params = action.params as { x: number; y: number };
        const distFromKM = Math.sqrt(
          (params.x - 960) ** 2 + (params.y - 540) ** 2
        );
        return distFromKM < 250 ? ActionBucket.DEFENSE : ActionBucket.EXPANSION;
      
      case AIActionType.UPGRADE_TURRET:
        // Upgrades are generally defense
        return ActionBucket.DEFENSE;
      
      default:
        return ActionBucket.DEFENSE;
    }
  }
  
  /**
   * Score and filter actions by bucket
   */
  static prioritizeActions(
    actions: AIAction[],
    context: GameContext
  ): AIAction[] {
    const weights = this.calculateBucketWeights(context);
    
    // Group actions by bucket
    const buckets: Record<ActionBucket, AIAction[]> = {
      [ActionBucket.SURVIVAL]: [],
      [ActionBucket.DEFENSE]: [],
      [ActionBucket.ECONOMY]: [],
      [ActionBucket.EXPANSION]: []
    };
    
    for (const action of actions) {
      const bucket = this.classifyAction(action, context);
      buckets[bucket].push(action);
    }
    
    // Find winning bucket (highest weight with actions)
    let winningBucket: ActionBucket = ActionBucket.DEFENSE;
    let highestWeight = 0;
    
    for (const [bucket, bucketActions] of Object.entries(buckets)) {
      if (bucketActions.length > 0) {
        const weight = weights[bucket as ActionBucket];
        if (weight > highestWeight) {
          highestWeight = weight;
          winningBucket = bucket as ActionBucket;
        }
      }
    }
    
    // Return actions from winning bucket, sorted by priority
    const winningActions = buckets[winningBucket];
    winningActions.sort((a, b) => b.priority - a.priority);
    
    return winningActions;
  }
}
```

**Acceptance Criteria:**
- [ ] Bucket weights respond to game context
- [ ] Survival bucket dominates when health is critical
- [ ] Actions correctly classified
- [ ] Winning bucket selection works

---

### Task 5.3: Create DecisionInertia System

**File:** `src/ai/utility/DecisionInertia.ts`

```typescript
/**
 * DecisionInertia
 * 
 * Prevents rapid action switching by giving bonus to current action.
 * Creates more coherent, human-like behavior.
 */

import { AIAction, AIActionType } from '../types';

export interface InertiaConfig {
  /** Bonus added to current action's priority */
  currentActionBonus: number;
  /** How long an action stays "current" after completion (ms) */
  persistenceTime: number;
  /** Minimum priority difference to switch actions */
  switchThreshold: number;
}

export const DEFAULT_INERTIA_CONFIG: InertiaConfig = {
  currentActionBonus: 15,
  persistenceTime: 2000,
  switchThreshold: 10
};

export class DecisionInertia {
  private currentAction: AIAction | null = null;
  private currentActionType: AIActionType | null = null;
  private lastActionTime: number = 0;
  private config: InertiaConfig;
  
  constructor(config: Partial<InertiaConfig> = {}) {
    this.config = { ...DEFAULT_INERTIA_CONFIG, ...config };
  }
  
  /**
   * Apply inertia bonus to actions
   */
  applyInertia(actions: AIAction[], currentTime: number): AIAction[] {
    // Check if current action has expired
    if (currentTime - this.lastActionTime > this.config.persistenceTime) {
      this.currentAction = null;
      this.currentActionType = null;
    }
    
    if (!this.currentActionType) {
      return actions;
    }
    
    // Apply bonus to actions of same type
    return actions.map(action => {
      if (action.type === this.currentActionType) {
        return {
          ...action,
          priority: action.priority + this.config.currentActionBonus
        };
      }
      return action;
    });
  }
  
  /**
   * Check if we should switch to a new action
   */
  shouldSwitch(newAction: AIAction, currentTime: number): boolean {
    // Always switch if no current action
    if (!this.currentAction) {
      return true;
    }
    
    // Check if current action expired
    if (currentTime - this.lastActionTime > this.config.persistenceTime) {
      return true;
    }
    
    // Only switch if new action is significantly better
    const priorityDiff = newAction.priority - this.currentAction.priority;
    return priorityDiff > this.config.switchThreshold;
  }
  
  /**
   * Record that an action was taken
   */
  recordAction(action: AIAction, currentTime: number): void {
    this.currentAction = action;
    this.currentActionType = action.type;
    this.lastActionTime = currentTime;
  }
  
  /**
   * Clear current action (e.g., on game reset)
   */
  reset(): void {
    this.currentAction = null;
    this.currentActionType = null;
    this.lastActionTime = 0;
  }
  
  /**
   * Get current action for debugging
   */
  getCurrentAction(): AIAction | null {
    return this.currentAction;
  }
}
```

**Acceptance Criteria:**
- [ ] Current action gets priority bonus
- [ ] Bonus expires after persistence time
- [ ] Switch threshold prevents thrashing
- [ ] Reset clears state

---

### Task 5.4: Integrate Utility Systems into ActionPlanner

**File:** `src/ai/ActionPlanner.ts` (modify)

```typescript
// Add imports
import { ScoringCurves } from './utility/ScoringCurves';
import { ActionBucketing, GameContext } from './utility/ActionBucketing';
import { DecisionInertia } from './utility/DecisionInertia';

// Add to class
private inertia: DecisionInertia;

constructor(...) {
  // ... existing code ...
  this.inertia = new DecisionInertia();
}

/**
 * REPLACE planActions with utility-enhanced version
 */
planActions(currentTime: number = 0): AIAction[] {
  const resources = this.resourceManager.getResources();
  const reserve = AUTOPLAY_CONFIG.EMERGENCY_RESERVE;
  const availableResources = Math.max(0, resources - reserve);
  
  // Build game context for bucketing
  const context = this.buildGameContext();
  
  // Generate candidate actions
  const candidates: AIAction[] = [];
  
  // Coverage analysis
  const coverage = this.coverageAnalyzer.analyze();
  const threats = this.threatAnalyzer.analyzeThreats();
  
  // Plan placement action
  const placement = this.planPlacement(availableResources, coverage.weakestSector, threats);
  if (placement) {
    // Apply scoring curves to priority
    const coverageGapScore = ScoringCurves.PRESETS.coverageGap(
      (1 - coverage.totalCoverage) * 100
    );
    const threatScore = ScoringCurves.PRESETS.threatResponse(
      this.threatAnalyzer.getOverallThreatLevel()
    );
    
    placement.priority = 50 + coverageGapScore * 30 + threatScore * 20;
    candidates.push(placement);
  }
  
  // Plan upgrade action
  const upgrade = this.planUpgrade(availableResources, threats);
  if (upgrade) {
    candidates.push(upgrade);
  }
  
  // Apply bucketing
  const bucketedActions = ActionBucketing.prioritizeActions(candidates, context);
  
  // Apply inertia
  const withInertia = this.inertia.applyInertia(bucketedActions, currentTime);
  
  // Sort by final priority
  withInertia.sort((a, b) => b.priority - a.priority);
  
  // Record action if we're going to execute it
  if (withInertia.length > 0 && this.inertia.shouldSwitch(withInertia[0], currentTime)) {
    this.inertia.recordAction(withInertia[0], currentTime);
  }
  
  return withInertia;
}

/**
 * Build game context for bucketing decisions
 */
private buildGameContext(): GameContext {
  const coverage = this.coverageAnalyzer.analyze();
  const threatLevel = this.threatAnalyzer.getOverallThreatLevel();
  
  // Get KM health (would need access to KM entity)
  // For now, estimate based on threat level
  const healthPercent = 100 - threatLevel * 0.5;
  
  return {
    healthPercent,
    resources: this.resourceManager.getResources(),
    threatLevel,
    coveragePercent: coverage.totalCoverage * 100,
    waveNumber: 1, // Would need wave manager access
    isWaveActive: threatLevel > 0
  };
}

/**
 * Reset inertia on game restart
 */
reset(): void {
  this.inertia.reset();
}
```

**Acceptance Criteria:**
- [ ] Scoring curves affect action priorities
- [ ] Bucketing filters actions by context
- [ ] Inertia prevents rapid switching
- [ ] Game context built correctly

---

## Testing

### Unit Tests

```typescript
describe('ScoringCurves', () => {
  it('should return 0-1 for all curve types', () => {
    const types: CurveType[] = ['linear', 'quadratic', 'exponential', 'logistic', 'step'];
    
    for (const type of types) {
      for (let i = 0; i <= 10; i++) {
        const value = i / 10;
        const score = ScoringCurves.score(value, { type });
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    }
  });
  
  it('should make low health extremely urgent', () => {
    const lowHealth = ScoringCurves.PRESETS.healthUrgency(0.1);
    const midHealth = ScoringCurves.PRESETS.healthUrgency(0.5);
    const highHealth = ScoringCurves.PRESETS.healthUrgency(0.9);
    
    expect(lowHealth).toBeGreaterThan(midHealth);
    expect(midHealth).toBeGreaterThan(highHealth);
    expect(lowHealth).toBeGreaterThan(0.8); // Very urgent
  });
});

describe('ActionBucketing', () => {
  it('should prioritize SURVIVAL when health is critical', () => {
    const context: GameContext = {
      healthPercent: 20,
      resources: 500,
      threatLevel: 80,
      coveragePercent: 50,
      waveNumber: 5,
      isWaveActive: true
    };
    
    const weights = ActionBucketing.calculateBucketWeights(context);
    expect(weights[ActionBucket.SURVIVAL]).toBeGreaterThan(weights[ActionBucket.ECONOMY]);
  });
  
  it('should prioritize ECONOMY in early game with low threat', () => {
    const context: GameContext = {
      healthPercent: 100,
      resources: 200,
      threatLevel: 10,
      coveragePercent: 30,
      waveNumber: 2,
      isWaveActive: false
    };
    
    const weights = ActionBucketing.calculateBucketWeights(context);
    expect(weights[ActionBucket.ECONOMY]).toBeGreaterThan(0.2);
  });
});

describe('DecisionInertia', () => {
  it('should give bonus to current action type', () => {
    const inertia = new DecisionInertia({ currentActionBonus: 20 });
    
    const action: AIAction = {
      type: AIActionType.PLACE_TURRET,
      priority: 50,
      cost: 100,
      expectedValue: 100,
      params: { x: 500, y: 500, turretType: 0 }
    };
    
    inertia.recordAction(action, 0);
    
    const actions = [
      { ...action, priority: 50 },
      { ...action, type: AIActionType.UPGRADE_TURRET, priority: 55 }
    ];
    
    const withInertia = inertia.applyInertia(actions, 100);
    
    // PLACE_TURRET should now have higher priority due to bonus
    const placeAction = withInertia.find(a => a.type === AIActionType.PLACE_TURRET);
    expect(placeAction?.priority).toBe(70); // 50 + 20 bonus
  });
});
```

---

## Expected Impact

| Metric | After Stage 4 | After Stage 5 |
|--------|---------------|---------------|
| Decision quality | Good | Strategic |
| Action coherence | Some thrashing | Stable |
| Context awareness | Basic | Full utility |
| Emergency response | Delayed | Immediate |

---

## Next Stage

[Stage 6: Polish & Humanization](./20251212_ai_autoplay_overhaul_06_polish.md)

---

*Document Version: 1.0*
