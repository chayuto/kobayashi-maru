# Stage 4: Behavior-Aware Threat Analysis

**Date:** December 12, 2025  
**Stage:** 4 of 6  
**Priority:** Medium  
**Estimated Hours:** 3-4  
**Dependencies:** Stages 1-3

---

## Overview

Enemies in Kobayashi Maru have distinct AI behavior patterns (DIRECT, STRAFE, ORBIT, SWARM, HUNTER). The current AI treats all enemies as moving in straight lines. This stage adds behavior-specific threat prediction and counter-turret selection.

---

## Enemy Behavior Analysis

### Current Behavior Types

| Behavior | Faction | Movement Pattern | Turret Counter |
|----------|---------|------------------|----------------|
| DIRECT | Klingon | Straight line to KM | Any (predictable) |
| STRAFE | Romulan | Sinusoidal weave | Polaron (slow), wide coverage |
| ORBIT | Tholian | Approach then circle at 300px | Long range (Torpedo) |
| SWARM | Borg | Direct with noise | High fire rate (Phaser) |
| HUNTER | Species 8472 | Targets nearest turret | Defensive placement |

### Behavior Impact on Placement

```
DIRECT (Klingon):
  ────────────────────────────▶ KM
  Simple interception works well

STRAFE (Romulan):
  ~~~~~~~~~~~~~~~~~~~~▶ KM
  Need wider coverage, perpendicular placement

ORBIT (Tholian):
       ╭──────╮
      ╱        ╲
     │    KM    │  ← Circles at 300px
      ╲        ╱
       ╰──────╯
  Need turrets at orbit radius

HUNTER (Species 8472):
  ──────▶ Turret ──────▶ KM
  Targets turrets first - need defensive depth
```

---

## Implementation Plan

### Task 4.1: Create BehaviorPredictor Class

**File:** `src/ai/behaviors/BehaviorPredictor.ts`

```typescript
/**
 * BehaviorPredictor
 * 
 * Predicts enemy positions based on their AI behavior type.
 * More accurate than simple velocity extrapolation.
 */

import { AIBehaviorType, GAME_CONFIG } from '../../types/constants';

export interface PredictedPosition {
  x: number;
  y: number;
  time: number;      // Seconds from now
  confidence: number; // 0-1, decreases over time
}

export interface BehaviorPrediction {
  positions: PredictedPosition[];
  effectiveRange: number;  // How far from path enemy might deviate
  approachAngle: number;   // Angle of approach to KM
}

export class BehaviorPredictor {
  private kmX: number;
  private kmY: number;
  
  constructor() {
    this.kmX = GAME_CONFIG.WORLD_WIDTH / 2;
    this.kmY = GAME_CONFIG.WORLD_HEIGHT / 2;
  }
  
  /**
   * Predict future positions for an enemy based on behavior type
   */
  predict(
    currentX: number,
    currentY: number,
    velocityX: number,
    velocityY: number,
    behaviorType: number,
    entityId: number,
    timeHorizon: number = 5.0
  ): BehaviorPrediction {
    switch (behaviorType) {
      case AIBehaviorType.DIRECT:
        return this.predictDirect(currentX, currentY, velocityX, velocityY, timeHorizon);
      
      case AIBehaviorType.STRAFE:
        return this.predictStrafe(currentX, currentY, velocityX, velocityY, entityId, timeHorizon);
      
      case AIBehaviorType.ORBIT:
        return this.predictOrbit(currentX, currentY, velocityX, velocityY, timeHorizon);
      
      case AIBehaviorType.SWARM:
        return this.predictSwarm(currentX, currentY, velocityX, velocityY, entityId, timeHorizon);
      
      case AIBehaviorType.HUNTER:
        return this.predictHunter(currentX, currentY, velocityX, velocityY, timeHorizon);
      
      default:
        return this.predictDirect(currentX, currentY, velocityX, velocityY, timeHorizon);
    }
  }
  
  /**
   * DIRECT: Simple linear extrapolation
   */
  private predictDirect(
    x: number, y: number,
    vx: number, vy: number,
    timeHorizon: number
  ): BehaviorPrediction {
    const positions: PredictedPosition[] = [];
    const steps = 10;
    const dt = timeHorizon / steps;
    
    for (let i = 1; i <= steps; i++) {
      const t = i * dt;
      positions.push({
        x: x + vx * t,
        y: y + vy * t,
        time: t,
        confidence: 1.0 - (t / timeHorizon) * 0.3 // High confidence
      });
    }
    
    return {
      positions,
      effectiveRange: 20, // Very predictable
      approachAngle: Math.atan2(this.kmY - y, this.kmX - x)
    };
  }
  
  /**
   * STRAFE: Sinusoidal weaving pattern
   */
  private predictStrafe(
    x: number, y: number,
    vx: number, vy: number,
    entityId: number,
    timeHorizon: number
  ): BehaviorPrediction {
    const positions: PredictedPosition[] = [];
    const steps = 10;
    const dt = timeHorizon / steps;
    
    // Strafe parameters (from aiSystem.ts)
    const frequency = 3; // Hz
    const amplitude = 0.5;
    
    // Direction to KM
    const dx = this.kmX - x;
    const dy = this.kmY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 0;
    const dirY = dist > 0 ? dy / dist : 0;
    
    // Perpendicular direction
    const perpX = -dirY;
    const perpY = dirX;
    
    const speed = Math.sqrt(vx * vx + vy * vy) || 80;
    
    for (let i = 1; i <= steps; i++) {
      const t = i * dt;
      const gameTime = t; // Approximate
      
      // Strafe offset
      const strafe = Math.sin(gameTime * frequency + entityId) * amplitude;
      
      // Combined movement
      const moveX = (dirX + perpX * strafe) * speed * t;
      const moveY = (dirY + perpY * strafe) * speed * t;
      
      positions.push({
        x: x + moveX,
        y: y + moveY,
        time: t,
        confidence: 0.7 - (t / timeHorizon) * 0.4 // Lower confidence due to weaving
      });
    }
    
    return {
      positions,
      effectiveRange: 80, // Wide deviation possible
      approachAngle: Math.atan2(dy, dx)
    };
  }
  
  /**
   * ORBIT: Approach then circle at fixed distance
   */
  private predictOrbit(
    x: number, y: number,
    vx: number, vy: number,
    timeHorizon: number
  ): BehaviorPrediction {
    const positions: PredictedPosition[] = [];
    const steps = 10;
    const dt = timeHorizon / steps;
    
    const orbitRadius = GAME_CONFIG.ORBIT_RADIUS; // 300
    const orbitSpeed = GAME_CONFIG.ORBIT_SPEED; // 50
    const approachSpeed = GAME_CONFIG.ORBIT_APPROACH_SPEED; // 40
    
    const distToKM = Math.sqrt((this.kmX - x) ** 2 + (this.kmY - y) ** 2);
    
    let currentX = x;
    let currentY = y;
    
    for (let i = 1; i <= steps; i++) {
      const t = i * dt;
      const currentDist = Math.sqrt((this.kmX - currentX) ** 2 + (this.kmY - currentY) ** 2);
      
      if (currentDist > orbitRadius + 20) {
        // Still approaching
        const dx = this.kmX - currentX;
        const dy = this.kmY - currentY;
        const d = Math.sqrt(dx * dx + dy * dy);
        
        currentX += (dx / d) * approachSpeed * dt;
        currentY += (dy / d) * approachSpeed * dt;
      } else {
        // Orbiting
        const angle = Math.atan2(currentY - this.kmY, currentX - this.kmX);
        const angularSpeed = orbitSpeed / orbitRadius;
        const newAngle = angle + angularSpeed * dt;
        
        currentX = this.kmX + Math.cos(newAngle) * orbitRadius;
        currentY = this.kmY + Math.sin(newAngle) * orbitRadius;
      }
      
      positions.push({
        x: currentX,
        y: currentY,
        time: t,
        confidence: 0.8 - (t / timeHorizon) * 0.3
      });
    }
    
    return {
      positions,
      effectiveRange: 50,
      approachAngle: Math.atan2(this.kmY - y, this.kmX - x)
    };
  }
  
  /**
   * SWARM: Direct with noise
   */
  private predictSwarm(
    x: number, y: number,
    vx: number, vy: number,
    entityId: number,
    timeHorizon: number
  ): BehaviorPrediction {
    const positions: PredictedPosition[] = [];
    const steps = 10;
    const dt = timeHorizon / steps;
    
    const noiseAmp = 0.2;
    const speed = Math.sqrt(vx * vx + vy * vy) || 90;
    
    const dx = this.kmX - x;
    const dy = this.kmY - y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const dirX = dist > 0 ? dx / dist : 0;
    const dirY = dist > 0 ? dy / dist : 0;
    
    for (let i = 1; i <= steps; i++) {
      const t = i * dt;
      
      // Add noise (simplified - actual uses sin/cos with gameTime)
      const noiseX = (Math.random() - 0.5) * noiseAmp;
      const noiseY = (Math.random() - 0.5) * noiseAmp;
      
      positions.push({
        x: x + (dirX + noiseX) * speed * t,
        y: y + (dirY + noiseY) * speed * t,
        time: t,
        confidence: 0.75 - (t / timeHorizon) * 0.35
      });
    }
    
    return {
      positions,
      effectiveRange: 40,
      approachAngle: Math.atan2(dy, dx)
    };
  }
  
  /**
   * HUNTER: Targets nearest turret, then KM
   * Note: Without turret positions, falls back to direct
   */
  private predictHunter(
    x: number, y: number,
    vx: number, vy: number,
    timeHorizon: number
  ): BehaviorPrediction {
    // Hunter behavior depends on turret positions
    // For prediction, assume direct path (worst case)
    const prediction = this.predictDirect(x, y, vx, vy, timeHorizon);
    prediction.effectiveRange = 60; // Less predictable
    return prediction;
  }
}
```

**Acceptance Criteria:**
- [ ] Predicts STRAFE weaving pattern
- [ ] Predicts ORBIT circular motion
- [ ] Confidence decreases over time
- [ ] Effective range reflects behavior unpredictability

---

### Task 4.2: Create BehaviorCounterSelector

**File:** `src/ai/behaviors/BehaviorCounterSelector.ts`

```typescript
/**
 * BehaviorCounterSelector
 * 
 * Selects optimal turret types to counter specific enemy behaviors.
 */

import { AIBehaviorType, TurretType, TURRET_CONFIG } from '../../types/constants';
import type { ThreatVector } from '../types';

export interface CounterRecommendation {
  turretType: number;
  score: number;
  reason: string;
}

export class BehaviorCounterSelector {
  /**
   * Counter effectiveness matrix
   * [BehaviorType][TurretType] = effectiveness (0-2)
   */
  private static readonly COUNTER_MATRIX: Record<number, Record<number, number>> = {
    [AIBehaviorType.DIRECT]: {
      [TurretType.PHASER_ARRAY]: 1.0,
      [TurretType.TORPEDO_LAUNCHER]: 1.2,
      [TurretType.DISRUPTOR_BANK]: 1.0,
      [TurretType.TETRYON_BEAM]: 1.0,
      [TurretType.PLASMA_CANNON]: 1.1,
      [TurretType.POLARON_BEAM]: 0.9
    },
    [AIBehaviorType.STRAFE]: {
      [TurretType.PHASER_ARRAY]: 1.3,  // High fire rate catches weaving
      [TurretType.TORPEDO_LAUNCHER]: 0.6, // Slow projectiles miss
      [TurretType.DISRUPTOR_BANK]: 1.1,
      [TurretType.TETRYON_BEAM]: 1.0,
      [TurretType.PLASMA_CANNON]: 0.8,
      [TurretType.POLARON_BEAM]: 1.4  // Slow effect counters weaving
    },
    [AIBehaviorType.ORBIT]: {
      [TurretType.PHASER_ARRAY]: 0.8,
      [TurretType.TORPEDO_LAUNCHER]: 1.5, // Long range hits orbiters
      [TurretType.DISRUPTOR_BANK]: 1.0,
      [TurretType.TETRYON_BEAM]: 1.1,
      [TurretType.PLASMA_CANNON]: 1.2,  // DOT while orbiting
      [TurretType.POLARON_BEAM]: 1.0
    },
    [AIBehaviorType.SWARM]: {
      [TurretType.PHASER_ARRAY]: 1.5,  // Best for swarms
      [TurretType.TORPEDO_LAUNCHER]: 0.7,
      [TurretType.DISRUPTOR_BANK]: 1.2,
      [TurretType.TETRYON_BEAM]: 1.0,
      [TurretType.PLASMA_CANNON]: 1.3,  // DOT spreads
      [TurretType.POLARON_BEAM]: 0.9
    },
    [AIBehaviorType.HUNTER]: {
      [TurretType.PHASER_ARRAY]: 1.1,
      [TurretType.TORPEDO_LAUNCHER]: 1.3, // Kill before they reach turrets
      [TurretType.DISRUPTOR_BANK]: 1.2,
      [TurretType.TETRYON_BEAM]: 1.0,
      [TurretType.PLASMA_CANNON]: 1.0,
      [TurretType.POLARON_BEAM]: 1.2  // Slow them down
    }
  };
  
  /**
   * Get best turret type to counter current threats
   */
  selectCounter(
    threats: ThreatVector[],
    availableResources: number
  ): CounterRecommendation[] {
    // Count threats by behavior type
    const behaviorCounts: Record<number, number> = {};
    const behaviorThreat: Record<number, number> = {};
    
    for (const threat of threats) {
      const behavior = threat.behaviorType;
      behaviorCounts[behavior] = (behaviorCounts[behavior] || 0) + 1;
      behaviorThreat[behavior] = (behaviorThreat[behavior] || 0) + threat.threatLevel;
    }
    
    // Score each turret type
    const recommendations: CounterRecommendation[] = [];
    
    for (const [turretTypeStr, config] of Object.entries(TURRET_CONFIG)) {
      const turretType = parseInt(turretTypeStr);
      
      if (config.cost > availableResources) continue;
      
      let totalScore = 0;
      const reasons: string[] = [];
      
      for (const [behaviorStr, count] of Object.entries(behaviorCounts)) {
        const behavior = parseInt(behaviorStr);
        const effectiveness = BehaviorCounterSelector.COUNTER_MATRIX[behavior]?.[turretType] || 1.0;
        const threatWeight = behaviorThreat[behavior] || 0;
        
        const contribution = effectiveness * count * (threatWeight / 100);
        totalScore += contribution;
        
        if (effectiveness > 1.2) {
          reasons.push(`Strong vs ${this.getBehaviorName(behavior)}`);
        }
      }
      
      // Cost efficiency bonus
      const dps = config.damage * config.fireRate;
      const efficiency = dps / config.cost;
      totalScore += efficiency * 10;
      
      recommendations.push({
        turretType,
        score: totalScore,
        reason: reasons.length > 0 ? reasons.join(', ') : 'General purpose'
      });
    }
    
    // Sort by score
    recommendations.sort((a, b) => b.score - a.score);
    
    return recommendations;
  }
  
  /**
   * Get human-readable behavior name
   */
  private getBehaviorName(behavior: number): string {
    switch (behavior) {
      case AIBehaviorType.DIRECT: return 'Direct (Klingon)';
      case AIBehaviorType.STRAFE: return 'Strafe (Romulan)';
      case AIBehaviorType.ORBIT: return 'Orbit (Tholian)';
      case AIBehaviorType.SWARM: return 'Swarm (Borg)';
      case AIBehaviorType.HUNTER: return 'Hunter (8472)';
      default: return 'Unknown';
    }
  }
  
  /**
   * Get placement strategy for behavior type
   */
  getPlacementStrategy(dominantBehavior: number): {
    preferredDistance: number;
    spreadPattern: 'ring' | 'corridor' | 'layered';
    notes: string;
  } {
    switch (dominantBehavior) {
      case AIBehaviorType.STRAFE:
        return {
          preferredDistance: 200,
          spreadPattern: 'corridor',
          notes: 'Wide coverage to catch weaving enemies'
        };
      
      case AIBehaviorType.ORBIT:
        return {
          preferredDistance: 280, // Just inside orbit radius
          spreadPattern: 'ring',
          notes: 'Ring at orbit distance to intercept'
        };
      
      case AIBehaviorType.HUNTER:
        return {
          preferredDistance: 150,
          spreadPattern: 'layered',
          notes: 'Layered defense to protect inner turrets'
        };
      
      case AIBehaviorType.SWARM:
        return {
          preferredDistance: 180,
          spreadPattern: 'ring',
          notes: 'Even coverage for mass enemies'
        };
      
      default:
        return {
          preferredDistance: 200,
          spreadPattern: 'corridor',
          notes: 'Standard interception placement'
        };
    }
  }
}
```

**Acceptance Criteria:**
- [ ] Counter matrix reflects actual effectiveness
- [ ] Recommendations consider threat composition
- [ ] Placement strategy varies by behavior
- [ ] Cost efficiency factored in

---

### Task 4.3: Integrate Behavior Awareness into ThreatAnalyzer

**File:** `src/ai/ThreatAnalyzer.ts` (modify)

```typescript
// Add imports
import { BehaviorPredictor, BehaviorPrediction } from './behaviors/BehaviorPredictor';
import { BehaviorCounterSelector } from './behaviors/BehaviorCounterSelector';

// Add to class
private behaviorPredictor: BehaviorPredictor;
private counterSelector: BehaviorCounterSelector;

constructor(world: GameWorld, getKobayashiMaruId: () => number) {
  // ... existing code ...
  this.behaviorPredictor = new BehaviorPredictor();
  this.counterSelector = new BehaviorCounterSelector();
}

/**
 * Get predicted positions for a threat
 */
getPredictedPositions(threat: ThreatVector, timeHorizon: number = 5.0): BehaviorPrediction {
  return this.behaviorPredictor.predict(
    threat.position.x,
    threat.position.y,
    threat.velocity.x,
    threat.velocity.y,
    threat.behaviorType,
    threat.entityId,
    timeHorizon
  );
}

/**
 * Get dominant behavior type among current threats
 */
getDominantBehavior(): number {
  const threats = this.analyzeThreats();
  const behaviorCounts: Record<number, number> = {};
  
  for (const threat of threats) {
    behaviorCounts[threat.behaviorType] = (behaviorCounts[threat.behaviorType] || 0) + 1;
  }
  
  let dominant = AIBehaviorType.DIRECT;
  let maxCount = 0;
  
  for (const [behavior, count] of Object.entries(behaviorCounts)) {
    if (count > maxCount) {
      maxCount = count;
      dominant = parseInt(behavior);
    }
  }
  
  return dominant;
}

/**
 * Get turret counter recommendations
 */
getCounterRecommendations(availableResources: number): CounterRecommendation[] {
  const threats = this.analyzeThreats();
  return this.counterSelector.selectCounter(threats, availableResources);
}

/**
 * Get placement strategy based on current threats
 */
getPlacementStrategy(): ReturnType<BehaviorCounterSelector['getPlacementStrategy']> {
  const dominant = this.getDominantBehavior();
  return this.counterSelector.getPlacementStrategy(dominant);
}
```

**Acceptance Criteria:**
- [ ] Behavior prediction accessible from ThreatAnalyzer
- [ ] Dominant behavior detection works
- [ ] Counter recommendations integrate with existing flow

---

## Testing

### Unit Tests

```typescript
describe('BehaviorPredictor', () => {
  it('should predict STRAFE weaving pattern', () => {
    const predictor = new BehaviorPredictor();
    const prediction = predictor.predict(
      100, 540, 80, 0, AIBehaviorType.STRAFE, 1, 3.0
    );
    
    // Positions should deviate from straight line
    const straightLineY = 540;
    let maxDeviation = 0;
    
    for (const pos of prediction.positions) {
      maxDeviation = Math.max(maxDeviation, Math.abs(pos.y - straightLineY));
    }
    
    expect(maxDeviation).toBeGreaterThan(20);
  });
  
  it('should predict ORBIT circular motion', () => {
    const predictor = new BehaviorPredictor();
    // Start at orbit radius
    const prediction = predictor.predict(
      960 + 300, 540, 0, 50, AIBehaviorType.ORBIT, 1, 5.0
    );
    
    // Should stay near orbit radius
    for (const pos of prediction.positions) {
      const dist = Math.sqrt((pos.x - 960) ** 2 + (pos.y - 540) ** 2);
      expect(dist).toBeCloseTo(300, -1); // Within 10px
    }
  });
});

describe('BehaviorCounterSelector', () => {
  it('should recommend Phaser for SWARM threats', () => {
    const selector = new BehaviorCounterSelector();
    const threats: ThreatVector[] = [
      { behaviorType: AIBehaviorType.SWARM, threatLevel: 50, ... },
      { behaviorType: AIBehaviorType.SWARM, threatLevel: 50, ... },
    ];
    
    const recommendations = selector.selectCounter(threats, 500);
    expect(recommendations[0].turretType).toBe(TurretType.PHASER_ARRAY);
  });
  
  it('should recommend Torpedo for ORBIT threats', () => {
    const selector = new BehaviorCounterSelector();
    const threats: ThreatVector[] = [
      { behaviorType: AIBehaviorType.ORBIT, threatLevel: 70, ... },
    ];
    
    const recommendations = selector.selectCounter(threats, 500);
    expect(recommendations[0].turretType).toBe(TurretType.TORPEDO_LAUNCHER);
  });
});
```

---

## Expected Impact

| Metric | After Stage 3 | After Stage 4 |
|--------|---------------|---------------|
| Turret hit rate | ~75% | ~80% |
| Counter-play | None | Behavior-specific |
| Prediction accuracy | Linear only | Behavior-aware |
| Turret selection | Faction-based | Behavior-based |

---

## Next Stage

[Stage 5: Utility AI Enhancement](./20251212_ai_autoplay_overhaul_05_utility_ai.md)

---

*Document Version: 1.0*
