# Stage 6: Polish & Humanization

**Date:** December 12, 2025  
**Stage:** 6 of 6  
**Priority:** Low  
**Estimated Hours:** 2-4  
**Dependencies:** Stages 1-5

---

## Overview

This final stage adds "Artificial Stupidity" - intentional imperfections that make the AI feel more human and less robotic. It also includes visual feedback and dynamic difficulty adjustment.

---

## Research Foundation

From the research document:

> "A mathematically perfect AI is often frustrating or 'uncanny' to players... designing 'Artificial Stupidity' and human-like constraints is as critical as designing intelligence."

Key concepts:
1. **Reaction Latency:** Humans can't react instantly
2. **Cognitive Load:** Humans can't focus on everything
3. **Aim Error:** Humans don't have perfect aim
4. **Dynamic Difficulty:** Adjust AI performance based on player success

---

## Implementation Plan

### Task 6.1: Create HumanizationConfig

**File:** `src/ai/humanization/HumanizationConfig.ts`

```typescript
/**
 * HumanizationConfig
 * 
 * Configuration for artificial stupidity and human-like behavior.
 */

export interface HumanizationSettings {
  /** Delay before AI reacts to new threats (ms) */
  reactionDelayMs: number;
  
  /** Random variation in reaction delay (ms) */
  reactionDelayVariance: number;
  
  /** Maximum threats AI can "focus" on at once */
  attentionLimit: number;
  
  /** Chance to make a suboptimal decision (0-1) */
  mistakeChance: number;
  
  /** Position error radius for placements (pixels) */
  placementErrorRadius: number;
  
  /** Whether to show AI "thinking" indicator */
  showThinkingIndicator: boolean;
  
  /** Minimum time between actions (ms) - prevents superhuman speed */
  minActionInterval: number;
}

export const HUMANIZATION_PRESETS: Record<string, HumanizationSettings> = {
  /** Perfect AI - no humanization */
  PERFECT: {
    reactionDelayMs: 0,
    reactionDelayVariance: 0,
    attentionLimit: 100,
    mistakeChance: 0,
    placementErrorRadius: 0,
    showThinkingIndicator: false,
    minActionInterval: 100
  },
  
  /** Expert human player */
  EXPERT: {
    reactionDelayMs: 150,
    reactionDelayVariance: 50,
    attentionLimit: 10,
    mistakeChance: 0.05,
    placementErrorRadius: 10,
    showThinkingIndicator: true,
    minActionInterval: 300
  },
  
  /** Average human player */
  AVERAGE: {
    reactionDelayMs: 300,
    reactionDelayVariance: 100,
    attentionLimit: 5,
    mistakeChance: 0.15,
    placementErrorRadius: 25,
    showThinkingIndicator: true,
    minActionInterval: 500
  },
  
  /** Beginner human player */
  BEGINNER: {
    reactionDelayMs: 500,
    reactionDelayVariance: 200,
    attentionLimit: 3,
    mistakeChance: 0.25,
    placementErrorRadius: 40,
    showThinkingIndicator: true,
    minActionInterval: 800
  }
};

export function getHumanizationPreset(name: string): HumanizationSettings {
  return HUMANIZATION_PRESETS[name] || HUMANIZATION_PRESETS.AVERAGE;
}
```

**Acceptance Criteria:**
- [ ] Presets cover skill range
- [ ] Settings are configurable
- [ ] Default is reasonable (AVERAGE)

---

### Task 6.2: Create AIHumanizer Class

**File:** `src/ai/humanization/AIHumanizer.ts`

```typescript
/**
 * AIHumanizer
 * 
 * Applies human-like imperfections to AI decisions.
 */

import { AIAction, PlacementParams } from '../types';
import { HumanizationSettings, getHumanizationPreset } from './HumanizationConfig';

export class AIHumanizer {
  private settings: HumanizationSettings;
  private lastActionTime: number = 0;
  private pendingReaction: {
    action: AIAction;
    readyTime: number;
  } | null = null;
  
  constructor(preset: string = 'AVERAGE') {
    this.settings = getHumanizationPreset(preset);
  }
  
  /**
   * Set humanization level
   */
  setPreset(preset: string): void {
    this.settings = getHumanizationPreset(preset);
  }
  
  /**
   * Set custom settings
   */
  setSettings(settings: Partial<HumanizationSettings>): void {
    this.settings = { ...this.settings, ...settings };
  }
  
  /**
   * Process an action through humanization filters
   */
  processAction(
    action: AIAction,
    currentTime: number
  ): { action: AIAction | null; isThinking: boolean } {
    // Check minimum action interval
    if (currentTime - this.lastActionTime < this.settings.minActionInterval) {
      return { action: null, isThinking: true };
    }
    
    // Check if we have a pending reaction
    if (this.pendingReaction) {
      if (currentTime >= this.pendingReaction.readyTime) {
        const readyAction = this.pendingReaction.action;
        this.pendingReaction = null;
        this.lastActionTime = currentTime;
        return { action: this.applyErrors(readyAction), isThinking: false };
      }
      return { action: null, isThinking: true };
    }
    
    // Apply reaction delay
    const delay = this.settings.reactionDelayMs + 
      (Math.random() - 0.5) * 2 * this.settings.reactionDelayVariance;
    
    if (delay > 0) {
      this.pendingReaction = {
        action,
        readyTime: currentTime + delay
      };
      return { action: null, isThinking: true };
    }
    
    // No delay - execute immediately
    this.lastActionTime = currentTime;
    return { action: this.applyErrors(action), isThinking: false };
  }
  
  /**
   * Apply random errors to action
   */
  private applyErrors(action: AIAction): AIAction {
    // Chance to make a mistake (return null or suboptimal)
    if (Math.random() < this.settings.mistakeChance) {
      // For now, just skip the action (simulates "forgetting")
      // Could also return a suboptimal action
      return action; // TODO: implement suboptimal selection
    }
    
    // Apply placement error
    if (action.type === 'PLACE_TURRET' && this.settings.placementErrorRadius > 0) {
      const params = action.params as PlacementParams;
      const errorAngle = Math.random() * Math.PI * 2;
      const errorDist = Math.random() * this.settings.placementErrorRadius;
      
      return {
        ...action,
        params: {
          ...params,
          x: params.x + Math.cos(errorAngle) * errorDist,
          y: params.y + Math.sin(errorAngle) * errorDist
        }
      };
    }
    
    return action;
  }
  
  /**
   * Filter threats by attention limit
   */
  filterByAttention<T>(items: T[], sortKey: (item: T) => number): T[] {
    // Sort by importance
    const sorted = [...items].sort((a, b) => sortKey(b) - sortKey(a));
    
    // Return only what AI can "focus" on
    return sorted.slice(0, this.settings.attentionLimit);
  }
  
  /**
   * Check if AI should show thinking indicator
   */
  shouldShowThinking(): boolean {
    return this.settings.showThinkingIndicator && this.pendingReaction !== null;
  }
  
  /**
   * Reset state (for game restart)
   */
  reset(): void {
    this.lastActionTime = 0;
    this.pendingReaction = null;
  }
}
```

**Acceptance Criteria:**
- [ ] Reaction delay works
- [ ] Placement error applied
- [ ] Attention limit filters threats
- [ ] Thinking indicator state tracked

---

### Task 6.3: Create DynamicDifficultyAdjuster

**File:** `src/ai/humanization/DynamicDifficultyAdjuster.ts`

```typescript
/**
 * DynamicDifficultyAdjuster
 * 
 * Adjusts AI performance based on player success/failure.
 * Makes AI play better when player is winning, worse when losing.
 */

import { AIHumanizer } from './AIHumanizer';
import { HUMANIZATION_PRESETS } from './HumanizationConfig';

export interface PerformanceMetrics {
  wavesCompleted: number;
  wavesFailed: number;
  averageSurvivalTime: number;
  currentHealthPercent: number;
  turretEfficiency: number; // Kills per turret
}

export class DynamicDifficultyAdjuster {
  private humanizer: AIHumanizer;
  private targetDifficulty: number = 0.5; // 0 = easy, 1 = hard
  private currentDifficulty: number = 0.5;
  private adjustmentRate: number = 0.1;
  
  constructor(humanizer: AIHumanizer) {
    this.humanizer = humanizer;
  }
  
  /**
   * Update difficulty based on performance
   */
  update(metrics: PerformanceMetrics): void {
    // Calculate performance score (0 = struggling, 1 = dominating)
    const performanceScore = this.calculatePerformanceScore(metrics);
    
    // Adjust target difficulty toward performance
    // If player is doing well, make AI worse (lower difficulty)
    // If player is struggling, make AI better (higher difficulty)
    this.targetDifficulty = 1 - performanceScore;
    
    // Smoothly adjust current difficulty
    const diff = this.targetDifficulty - this.currentDifficulty;
    this.currentDifficulty += diff * this.adjustmentRate;
    this.currentDifficulty = Math.max(0, Math.min(1, this.currentDifficulty));
    
    // Apply difficulty to humanizer
    this.applyDifficulty();
  }
  
  /**
   * Calculate performance score from metrics
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics): number {
    let score = 0;
    let weights = 0;
    
    // Wave completion rate
    const totalWaves = metrics.wavesCompleted + metrics.wavesFailed;
    if (totalWaves > 0) {
      score += (metrics.wavesCompleted / totalWaves) * 0.3;
      weights += 0.3;
    }
    
    // Current health
    score += (metrics.currentHealthPercent / 100) * 0.4;
    weights += 0.4;
    
    // Turret efficiency
    const efficiencyScore = Math.min(1, metrics.turretEfficiency / 5);
    score += efficiencyScore * 0.3;
    weights += 0.3;
    
    return weights > 0 ? score / weights : 0.5;
  }
  
  /**
   * Apply current difficulty to humanizer settings
   */
  private applyDifficulty(): void {
    // Interpolate between BEGINNER and EXPERT based on difficulty
    const beginner = HUMANIZATION_PRESETS.BEGINNER;
    const expert = HUMANIZATION_PRESETS.EXPERT;
    const t = this.currentDifficulty;
    
    this.humanizer.setSettings({
      reactionDelayMs: this.lerp(beginner.reactionDelayMs, expert.reactionDelayMs, t),
      reactionDelayVariance: this.lerp(beginner.reactionDelayVariance, expert.reactionDelayVariance, t),
      attentionLimit: Math.round(this.lerp(beginner.attentionLimit, expert.attentionLimit, t)),
      mistakeChance: this.lerp(beginner.mistakeChance, expert.mistakeChance, t),
      placementErrorRadius: this.lerp(beginner.placementErrorRadius, expert.placementErrorRadius, t),
      minActionInterval: this.lerp(beginner.minActionInterval, expert.minActionInterval, t)
    });
  }
  
  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  }
  
  /**
   * Get current difficulty level (for UI display)
   */
  getCurrentDifficulty(): number {
    return this.currentDifficulty;
  }
  
  /**
   * Manually set difficulty (for testing or user preference)
   */
  setDifficulty(difficulty: number): void {
    this.currentDifficulty = Math.max(0, Math.min(1, difficulty));
    this.targetDifficulty = this.currentDifficulty;
    this.applyDifficulty();
  }
  
  /**
   * Reset to default difficulty
   */
  reset(): void {
    this.currentDifficulty = 0.5;
    this.targetDifficulty = 0.5;
    this.applyDifficulty();
  }
}
```

**Acceptance Criteria:**
- [ ] Difficulty adjusts based on performance
- [ ] Smooth transitions between difficulty levels
- [ ] Manual override works
- [ ] Settings interpolate correctly

---

### Task 6.4: Add Visual Feedback for AI Decisions

**File:** `src/ai/visualization/AIVisualFeedback.ts`

```typescript
/**
 * AIVisualFeedback
 * 
 * Visual indicators for AI decision-making.
 * Shows what the AI is "thinking" and planning.
 */

import { Graphics, Text, Container } from 'pixi.js';
import { AIAction, AIActionType, AIStatus } from '../types';
import { GAME_CONFIG } from '../../types/constants';

export class AIVisualFeedback {
  private container: Container;
  private thinkingIndicator: Graphics;
  private plannedPlacementIndicator: Graphics;
  private statusText: Text;
  private isVisible: boolean = true;
  
  constructor() {
    this.container = new Container();
    this.thinkingIndicator = new Graphics();
    this.plannedPlacementIndicator = new Graphics();
    this.statusText = new Text('', {
      fontFamily: 'monospace',
      fontSize: 12,
      fill: 0x00FF00
    });
    
    this.container.addChild(this.thinkingIndicator);
    this.container.addChild(this.plannedPlacementIndicator);
    this.container.addChild(this.statusText);
    
    this.statusText.position.set(10, GAME_CONFIG.WORLD_HEIGHT - 60);
  }
  
  /**
   * Update visual feedback based on AI status
   */
  update(status: AIStatus, isThinking: boolean): void {
    if (!this.isVisible) {
      this.container.visible = false;
      return;
    }
    
    this.container.visible = true;
    
    // Update thinking indicator
    this.updateThinkingIndicator(isThinking);
    
    // Update planned placement
    this.updatePlannedPlacement(status.currentAction);
    
    // Update status text
    this.updateStatusText(status);
  }
  
  /**
   * Show "thinking" animation
   */
  private updateThinkingIndicator(isThinking: boolean): void {
    this.thinkingIndicator.clear();
    
    if (!isThinking) return;
    
    // Pulsing circle in corner
    const time = Date.now() / 500;
    const alpha = 0.3 + Math.sin(time) * 0.2;
    
    this.thinkingIndicator.beginFill(0x00FFFF, alpha);
    this.thinkingIndicator.drawCircle(30, 30, 15);
    this.thinkingIndicator.endFill();
    
    // "AI" text
    this.thinkingIndicator.lineStyle(2, 0x00FFFF, alpha);
    this.thinkingIndicator.drawCircle(30, 30, 20);
  }
  
  /**
   * Show planned turret placement
   */
  private updatePlannedPlacement(action: AIAction | null): void {
    this.plannedPlacementIndicator.clear();
    
    if (!action || action.type !== AIActionType.PLACE_TURRET) return;
    
    const params = action.params as { x: number; y: number; turretType: number };
    
    // Dashed circle at planned position
    this.plannedPlacementIndicator.lineStyle(2, 0x00FF00, 0.5);
    
    const segments = 16;
    const radius = 30;
    for (let i = 0; i < segments; i += 2) {
      const startAngle = (i / segments) * Math.PI * 2;
      const endAngle = ((i + 1) / segments) * Math.PI * 2;
      
      this.plannedPlacementIndicator.moveTo(
        params.x + Math.cos(startAngle) * radius,
        params.y + Math.sin(startAngle) * radius
      );
      this.plannedPlacementIndicator.lineTo(
        params.x + Math.cos(endAngle) * radius,
        params.y + Math.sin(endAngle) * radius
      );
    }
    
    // Crosshair
    this.plannedPlacementIndicator.moveTo(params.x - 10, params.y);
    this.plannedPlacementIndicator.lineTo(params.x + 10, params.y);
    this.plannedPlacementIndicator.moveTo(params.x, params.y - 10);
    this.plannedPlacementIndicator.lineTo(params.x, params.y + 10);
  }
  
  /**
   * Update status text
   */
  private updateStatusText(status: AIStatus): void {
    const lines = [
      `AI: ${status.enabled ? 'ON' : 'OFF'}`,
      `Threat: ${status.threatLevel.toFixed(0)}%`,
      `Coverage: ${status.coveragePercent.toFixed(0)}%`
    ];
    
    if (status.currentAction) {
      lines.push(`Action: ${status.currentAction.type}`);
    }
    
    this.statusText.text = lines.join('\n');
  }
  
  /**
   * Toggle visibility
   */
  setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.container.visible = visible;
  }
  
  /**
   * Get container for adding to stage
   */
  getContainer(): Container {
    return this.container;
  }
  
  /**
   * Clean up resources
   */
  destroy(): void {
    this.container.destroy({ children: true });
  }
}
```

**Acceptance Criteria:**
- [ ] Thinking indicator pulses when AI is processing
- [ ] Planned placement shows target position
- [ ] Status text shows key metrics
- [ ] Can be toggled on/off

---

### Task 6.5: Integrate Humanization into AIAutoPlayManager

**File:** `src/ai/AIAutoPlayManager.ts` (modify)

```typescript
// Add imports
import { AIHumanizer } from './humanization/AIHumanizer';
import { DynamicDifficultyAdjuster } from './humanization/DynamicDifficultyAdjuster';
import { AIVisualFeedback } from './visualization/AIVisualFeedback';

// Add to class
private humanizer: AIHumanizer;
private difficultyAdjuster: DynamicDifficultyAdjuster;
private visualFeedback: AIVisualFeedback;
private isThinking: boolean = false;

constructor(...) {
  // ... existing code ...
  this.humanizer = new AIHumanizer('AVERAGE');
  this.difficultyAdjuster = new DynamicDifficultyAdjuster(this.humanizer);
  this.visualFeedback = new AIVisualFeedback();
}

/**
 * MODIFY update to use humanization
 */
update(_deltaTime: number, gameTime: number): void {
  if (!this.enabled) return;
  if (!this.gameState.isPlaying()) return;
  
  // Check decision interval
  const intervalSeconds = AUTOPLAY_CONFIG.DECISION_INTERVAL_MS / 1000;
  if (gameTime - this.lastDecisionTime < intervalSeconds) {
    // Update visual feedback even when not deciding
    this.visualFeedback.update(this.getStatus(), this.isThinking);
    return;
  }
  
  this.lastDecisionTime = gameTime;
  
  // Plan actions
  const actions = this.planner.planActions(gameTime * 1000);
  
  if (actions.length > 0) {
    // Apply humanization
    const { action, isThinking } = this.humanizer.processAction(
      actions[0],
      gameTime * 1000
    );
    
    this.isThinking = isThinking;
    
    if (action) {
      this.currentAction = action;
      
      if (this.executor.canExecute(action)) {
        const result = this.executor.execute(action);
        if (!result.success) {
          this.currentAction = null;
        }
      } else {
        this.currentAction = null;
      }
    }
  } else {
    this.currentAction = null;
    this.isThinking = false;
  }
  
  // Update visual feedback
  this.visualFeedback.update(this.getStatus(), this.isThinking);
}

/**
 * Set humanization preset
 */
setHumanizationLevel(preset: string): void {
  this.humanizer.setPreset(preset);
}

/**
 * Get visual feedback container
 */
getVisualFeedback(): AIVisualFeedback {
  return this.visualFeedback;
}

/**
 * Update difficulty based on performance
 */
updateDifficulty(metrics: PerformanceMetrics): void {
  this.difficultyAdjuster.update(metrics);
}

/**
 * MODIFY reset to include humanization
 */
reset(): void {
  this.lastDecisionTime = 0;
  this.currentAction = null;
  this.isThinking = false;
  this.humanizer.reset();
  this.difficultyAdjuster.reset();
}
```

**Acceptance Criteria:**
- [ ] Humanization applied to all actions
- [ ] Visual feedback updates each frame
- [ ] Difficulty adjusts over time
- [ ] Reset clears all state

---

## Testing

### Unit Tests

```typescript
describe('AIHumanizer', () => {
  it('should delay reactions', () => {
    const humanizer = new AIHumanizer('AVERAGE');
    const action = createTestAction();
    
    // First call should start delay
    const result1 = humanizer.processAction(action, 0);
    expect(result1.action).toBeNull();
    expect(result1.isThinking).toBe(true);
    
    // After delay, action should be ready
    const result2 = humanizer.processAction(action, 500);
    expect(result2.action).not.toBeNull();
  });
  
  it('should apply placement error', () => {
    const humanizer = new AIHumanizer('BEGINNER');
    humanizer.setSettings({ placementErrorRadius: 50, reactionDelayMs: 0 });
    
    const action = {
      type: AIActionType.PLACE_TURRET,
      params: { x: 500, y: 500, turretType: 0 },
      priority: 50,
      cost: 100,
      expectedValue: 100
    };
    
    // Process multiple times and check for variation
    const positions: { x: number; y: number }[] = [];
    for (let i = 0; i < 10; i++) {
      humanizer.reset();
      const result = humanizer.processAction(action, i * 1000);
      if (result.action) {
        const params = result.action.params as PlacementParams;
        positions.push({ x: params.x, y: params.y });
      }
    }
    
    // Should have some variation
    const hasVariation = positions.some(p => 
      Math.abs(p.x - 500) > 5 || Math.abs(p.y - 500) > 5
    );
    expect(hasVariation).toBe(true);
  });
});

describe('DynamicDifficultyAdjuster', () => {
  it('should increase difficulty when player is struggling', () => {
    const humanizer = new AIHumanizer('AVERAGE');
    const adjuster = new DynamicDifficultyAdjuster(humanizer);
    
    adjuster.setDifficulty(0.5);
    
    // Simulate struggling player
    adjuster.update({
      wavesCompleted: 1,
      wavesFailed: 5,
      averageSurvivalTime: 30,
      currentHealthPercent: 20,
      turretEfficiency: 0.5
    });
    
    expect(adjuster.getCurrentDifficulty()).toBeGreaterThan(0.5);
  });
});
```

---

## Expected Impact

| Metric | After Stage 5 | After Stage 6 |
|--------|---------------|---------------|
| AI feel | Robotic | Human-like |
| Player engagement | Passive watching | Active observation |
| Difficulty curve | Static | Adaptive |
| Visual clarity | None | Full feedback |

---

## Summary

This completes the AI Auto-Play Overhaul. The full implementation provides:

1. **Flow Field Integration** - Turrets placed along enemy paths
2. **Influence Maps** - Threat density and coverage analysis
3. **Path Interception** - Maximize enemy dwell time in range
4. **Behavior Awareness** - Counter-strategies for each enemy type
5. **Utility AI** - Proper scoring curves and bucketing
6. **Humanization** - Natural-feeling AI with visual feedback

---

## Quick Reference

### File Structure (Final)

```
src/ai/
├── index.ts
├── AIAutoPlayManager.ts
├── ThreatAnalyzer.ts
├── CoverageAnalyzer.ts
├── ActionPlanner.ts
├── ActionExecutor.ts
├── types.ts
├── spatial/
│   ├── InfluenceMap.ts
│   ├── ThreatInfluenceMap.ts
│   ├── CoverageInfluenceMap.ts
│   ├── FlowFieldAnalyzer.ts
│   ├── PathInterceptor.ts
│   └── ApproachCorridorAnalyzer.ts
├── utility/
│   ├── ScoringCurves.ts
│   ├── ActionBucketing.ts
│   └── DecisionInertia.ts
├── behaviors/
│   ├── BehaviorPredictor.ts
│   └── BehaviorCounterSelector.ts
├── humanization/
│   ├── HumanizationConfig.ts
│   ├── AIHumanizer.ts
│   └── DynamicDifficultyAdjuster.ts
└── visualization/
    └── AIVisualFeedback.ts
```

### Implementation Order

1. Stage 1: Flow Field (Critical - fixes core placement issue)
2. Stage 2: Influence Maps (High - improves threat response)
3. Stage 3: Path Interception (High - maximizes effectiveness)
4. Stage 4: Behavior Awareness (Medium - counter-play)
5. Stage 5: Utility AI (Medium - decision quality)
6. Stage 6: Polish (Low - user experience)

---

*Document Version: 1.0*
