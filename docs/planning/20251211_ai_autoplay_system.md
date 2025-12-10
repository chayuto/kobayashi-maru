# AI Auto-Play System Design Document

**Date:** December 11, 2025  
**Status:** Planning  
**Priority:** Feature Enhancement

---

## Executive Summary

Design an AI auto-play system that allows players to toggle AI control for strategic turret placement, upgrades, and future game actions. The AI will analyze game state in real-time and make optimal decisions to maximize survival time and score.

---

## 1. System Overview

### 1.1 Core Concept

The AI Auto-Play system acts as an intelligent "Commander" that can take over player decisions when enabled. It observes the game state, predicts threats, and executes strategic actions autonomously.

```
┌─────────────────────────────────────────────────────────────────┐
│                     AI AUTO-PLAY ARCHITECTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Sensors    │───▶│   Brain      │───▶│   Actuators  │       │
│  │  (Analysis)  │    │  (Decision)  │    │  (Actions)   │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│         │                   │                   │                │
│         ▼                   ▼                   ▼                │
│  • Enemy positions    • Strategy eval    • Place turrets        │
│  • Threat vectors     • Priority queue   • Upgrade turrets      │
│  • Resource state     • Risk assessment  • Sell turrets         │
│  • Turret coverage    • Timing decisions • Future: abilities    │
│  • Wave prediction                                               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Design Goals

1. **Follows Game Rules** - AI uses the same APIs as players (no cheating)
2. **Competent Play** - AI should survive at least as long as an average player
3. **Entertaining to Watch** - Decisions should be visible and understandable
4. **Configurable** - Multiple AI personalities/strategies
5. **Extensible** - Easy to add new action types
6. **Non-Intrusive** - Clean integration with existing systems

### 1.3 Game Rules Compliance

**The AI MUST follow all game rules that apply to players:**

| Rule | Enforcement |
|------|-------------|
| Resource costs | AI uses `ResourceManager.canAfford()` before any purchase |
| Turret spacing | AI uses `PlacementManager.validatePosition()` |
| Placement bounds | AI respects world boundaries via PlacementManager |
| Upgrade prerequisites | AI checks `UpgradeManager.canUpgrade()` |
| Sell refund rates | AI gets same 75% refund as players |
| No spawning entities | AI cannot create turrets directly - must use PlacementManager |
| No stat manipulation | AI cannot modify Health, Shield, or Turret components directly |
| Wave timing | AI cannot skip or accelerate waves |
| Pause state | AI does not act when game is paused |

**The AI is NOT allowed to:**
- Access or modify ECS components directly for game advantage
- Bypass resource checks
- Place turrets in invalid positions
- Upgrade beyond max levels
- See enemy spawn points before they spawn
- Predict random events (elite spawns, etc.)
- Act faster than the decision interval allows

---

## 2. Strategic Analysis

### 2.1 Game State Understanding

The AI must understand these key game elements:

| Element | Data Source | Strategic Value |
|---------|-------------|-----------------|
| Enemy positions | `Position`, `Faction` components | Threat assessment |
| Enemy velocities | `Velocity` component | Predict future positions |
| Enemy types | `Faction.id`, `AIBehavior` | Counter-strategy selection |
| Enemy health | `Health`, `Shield` components | Target prioritization |
| Turret positions | `Position`, `Turret` components | Coverage analysis |
| Turret stats | `Turret`, `TurretUpgrade` components | Efficiency evaluation |
| Resources | `ResourceManager` | Action feasibility |
| Wave state | `WaveManager` | Timing decisions |
| KM health | `Health[kobayashiMaruId]` | Urgency assessment |

### 2.2 Threat Analysis Model

```typescript
interface ThreatVector {
  entityId: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  predictedImpactTime: number;  // seconds until reaching KM
  threatLevel: number;          // 0-100 composite score
  factionId: number;
  behaviorType: number;
  healthPercent: number;
  isElite: boolean;
  isBoss: boolean;
}

// Threat level calculation factors:
// - Distance to Kobayashi Maru (closer = higher threat)
// - Speed (faster = higher threat)
// - Health (higher = harder to kill)
// - Faction abilities (Borg regen, Romulan cloak, etc.)
// - Elite/Boss status (multiplier)
// - Current turret coverage (uncovered = higher threat)
```

### 2.3 Coverage Analysis

The AI divides the play area into sectors for coverage analysis:

```
┌─────────────────────────────────────────────────────────────┐
│                    SECTOR GRID (8x6)                         │
├─────────────────────────────────────────────────────────────┤
│  ┌───┬───┬───┬───┬───┬───┬───┬───┐                          │
│  │ 0 │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │  ← Spawn zones (edges)  │
│  ├───┼───┼───┼───┼───┼───┼───┼───┤                          │
│  │ 8 │ 9 │10 │11 │12 │13 │14 │15 │                          │
│  ├───┼───┼───┼───┼───┼───┼───┼───┤                          │
│  │16 │17 │18 │ KM│ KM│21 │22 │23 │  ← Kobayashi Maru       │
│  ├───┼───┼───┼───┼───┼───┼───┼───┤     (center)            │
│  │24 │25 │26 │ KM│ KM│29 │30 │31 │                          │
│  ├───┼───┼───┼───┼───┼───┼───┼───┤                          │
│  │32 │33 │34 │35 │36 │37 │38 │39 │                          │
│  ├───┼───┼───┼───┼───┼───┼───┼───┤                          │
│  │40 │41 │42 │43 │44 │45 │46 │47 │  ← Spawn zones (edges)  │
│  └───┴───┴───┴───┴───┴───┴───┴───┘                          │
│                                                              │
│  Each sector tracks:                                         │
│  • Turret coverage (DPS available)                          │
│  • Enemy presence (threat count)                            │
│  • Predicted enemy flow (from spawn analysis)               │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Decision Engine

### 3.1 Action Priority System

The AI evaluates actions using a priority queue:

```typescript
enum AIActionType {
  PLACE_TURRET = 'PLACE_TURRET',
  UPGRADE_TURRET = 'UPGRADE_TURRET',
  SELL_TURRET = 'SELL_TURRET',
  // Future actions
  ACTIVATE_ABILITY = 'ACTIVATE_ABILITY',
  CALL_REINFORCEMENT = 'CALL_REINFORCEMENT'
}

interface AIAction {
  type: AIActionType;
  priority: number;        // Higher = more urgent (0-100)
  cost: number;            // Resource cost
  expectedValue: number;   // Estimated benefit
  params: ActionParams;    // Type-specific parameters
}

// Priority calculation:
// priority = urgency * importance * feasibility
// - urgency: How soon is this needed? (wave timing, threat proximity)
// - importance: How much impact? (coverage gap, DPS increase)
// - feasibility: Can we afford it? Do we have space?
```

### 3.2 Turret Placement Strategy

```typescript
interface PlacementDecision {
  position: { x: number; y: number };
  turretType: TurretTypeId;
  score: number;
  reasoning: string[];
}

// Placement scoring factors:
// 1. Coverage contribution (+30 max)
//    - How much uncovered area does this position cover?
//    - Bonus for covering high-threat sectors
//
// 2. Synergy bonus (+20 max)
//    - Adjacent turrets of complementary types
//    - Tetryon + Plasma = shield strip + burn
//    - Polaron + Torpedo = slow + high damage
//
// 3. Defensive value (+25 max)
//    - Distance from Kobayashi Maru
//    - Closer = higher defensive value
//    - But not too close (need buffer zone)
//
// 4. Lane coverage (+15 max)
//    - Covers predicted enemy approach paths
//    - Based on spawn point analysis
//
// 5. Resource efficiency (+10 max)
//    - Cost vs expected DPS contribution
//    - Cheaper turrets score higher early game
```

### 3.3 Turret Type Selection

| Turret Type | Best Against | AI Selection Criteria |
|-------------|--------------|----------------------|
| Phaser Array | Swarms, fast enemies | High enemy count, low individual HP |
| Torpedo Launcher | Bosses, elites | High HP targets, long range needed |
| Disruptor Bank | General purpose | Balanced situations |
| Tetryon Beam | Shielded enemies | Borg, high shield enemies |
| Plasma Cannon | Clustered enemies | Groups, DOT value |
| Polaron Beam | Fast enemies | Species 8472, Romulans |

### 3.4 Upgrade Decision Matrix

```typescript
interface UpgradeDecision {
  turretId: number;
  upgradePath: UpgradePathId;
  score: number;
  reasoning: string;
}

// Upgrade priority logic:
// 1. Damage upgrades: When turrets are hitting but not killing fast enough
// 2. Range upgrades: When enemies are slipping through coverage gaps
// 3. Fire rate upgrades: When facing swarms (Klingons, Borg)
// 4. Multi-target: When turret is in high-traffic area
// 5. Special: Based on turret type and current wave composition
```

---

## 4. AI Personalities

### 4.1 Personality Profiles

```typescript
enum AIPersonality {
  BALANCED = 'BALANCED',      // Default, well-rounded
  AGGRESSIVE = 'AGGRESSIVE',  // Prioritizes damage, forward placement
  DEFENSIVE = 'DEFENSIVE',    // Prioritizes coverage, KM protection
  ECONOMIC = 'ECONOMIC',      // Maximizes resource efficiency
  ADAPTIVE = 'ADAPTIVE'       // Changes strategy based on wave composition
}

interface PersonalityConfig {
  placementBias: {
    distanceFromKM: number;     // -1 (far) to 1 (close)
    coverageVsDamage: number;   // -1 (coverage) to 1 (damage)
  };
  upgradeBias: {
    damageVsUtility: number;    // -1 (utility) to 1 (damage)
    earlyVsLate: number;        // -1 (save) to 1 (spend early)
  };
  turretPreferences: Map<TurretTypeId, number>;  // Weight multipliers
  riskTolerance: number;        // 0 (conservative) to 1 (risky)
}
```

### 4.2 Personality Behaviors

| Personality | Placement Style | Upgrade Priority | Resource Usage |
|-------------|-----------------|------------------|----------------|
| Balanced | Ring around KM | Even distribution | Moderate |
| Aggressive | Forward positions | Damage, fire rate | Spend quickly |
| Defensive | Close to KM | Range, multi-target | Conservative |
| Economic | Optimal coverage | Cost-effective | Minimal waste |
| Adaptive | Based on threats | Counter current wave | Reactive |

---

## 5. Implementation Architecture

### 5.1 Class Structure

```typescript
// src/ai/AIAutoPlayManager.ts
export class AIAutoPlayManager {
  private enabled: boolean = false;
  private personality: AIPersonality = AIPersonality.BALANCED;
  private analyzer: ThreatAnalyzer;
  private planner: ActionPlanner;
  private executor: ActionExecutor;
  private decisionInterval: number = 500; // ms between decisions
  private lastDecisionTime: number = 0;
  
  constructor(
    private world: GameWorld,
    private placementManager: PlacementManager,   // REQUIRED: enforces placement rules
    private upgradeManager: UpgradeManager,       // REQUIRED: enforces upgrade rules
    private resourceManager: ResourceManager,     // REQUIRED: enforces resource rules
    private waveManager: WaveManager,
    private gameState: GameState                  // REQUIRED: respects pause/game over
  ) {
    // Analyzer only READS game state - no modifications
    this.analyzer = new ThreatAnalyzer(world);
    this.planner = new ActionPlanner(this.analyzer, resourceManager);
    // Executor uses ONLY the manager APIs - never direct ECS access
    this.executor = new ActionExecutor(placementManager, upgradeManager, resourceManager);
  }
  
  toggle(): boolean;
  setPersonality(personality: AIPersonality): void;
  update(deltaTime: number, gameTime: number): void;
  getStatus(): AIStatus;
}

/**
 * IMPORTANT: Game Rules Enforcement
 * 
 * The AI system enforces game rules through architectural constraints:
 * 
 * 1. ActionExecutor ONLY uses PlacementManager and UpgradeManager
 *    - These managers already validate all game rules
 *    - AI cannot bypass validation
 * 
 * 2. ThreatAnalyzer is READ-ONLY
 *    - Queries ECS components but never modifies them
 *    - Uses same queries as render/targeting systems
 * 
 * 3. ResourceManager checks are MANDATORY
 *    - ActionPlanner filters actions by canAfford()
 *    - ActionExecutor double-checks before execution
 * 
 * 4. GameState is respected
 *    - AI does nothing when paused or game over
 *    - Same as player input being ignored
 */

// src/ai/ThreatAnalyzer.ts
// NOTE: READ-ONLY access to game state - same data available to player via UI
export class ThreatAnalyzer {
  constructor(private world: GameWorld) {}
  
  // Queries existing enemies using standard ECS queries
  // Same data that render system uses - no hidden information
  analyzeThreats(): ThreatVector[];
  
  // Queries existing turrets - same as what player sees
  analyzeCoverage(): CoverageMap;
  
  // Uses PUBLIC wave config - same info shown in wave announcements
  // Does NOT predict random elite/boss spawns
  predictWaveComposition(waveNumber: number): WavePrediction;
  
  getHighestThreatSector(): number;
  getWeakestCoverageSector(): number;
}

// src/ai/ActionPlanner.ts
export class ActionPlanner {
  planActions(
    threats: ThreatVector[],
    coverage: CoverageMap,
    resources: number,
    personality: PersonalityConfig
  ): AIAction[];
  
  evaluatePlacement(x: number, y: number, turretType: number): PlacementDecision;
  evaluateUpgrade(turretId: number, path: number): UpgradeDecision;
}

// src/ai/ActionExecutor.ts
// NOTE: This class ONLY uses manager APIs - never direct ECS manipulation
export class ActionExecutor {
  constructor(
    private placementManager: PlacementManager,
    private upgradeManager: UpgradeManager,
    private resourceManager: ResourceManager
  ) {}
  
  execute(action: AIAction): ExecutionResult {
    // All actions go through the same managers players use
    switch (action.type) {
      case AIActionType.PLACE_TURRET:
        // Uses PlacementManager.placeTurret() - validates position & cost
        return this.executePlacement(action.params);
      case AIActionType.UPGRADE_TURRET:
        // Uses UpgradeManager.applyUpgrade() - validates level & cost
        return this.executeUpgrade(action.params);
      case AIActionType.SELL_TURRET:
        // Uses UpgradeManager.sellTurret() - same refund rate as player
        return this.executeSell(action.params);
    }
  }
  
  canExecute(action: AIAction): boolean {
    // Pre-check using same validation as player actions
    if (!this.resourceManager.canAfford(action.cost)) return false;
    
    if (action.type === AIActionType.PLACE_TURRET) {
      const params = action.params as PlacementParams;
      return this.placementManager.validatePosition(params.x, params.y);
    }
    
    if (action.type === AIActionType.UPGRADE_TURRET) {
      const params = action.params as UpgradeParams;
      return this.upgradeManager.canUpgrade(params.turretId, params.upgradePath);
    }
    
    return true;
  }
}
```

### 5.2 File Structure

```
src/
├── ai/
│   ├── index.ts                    # Barrel exports
│   ├── AIAutoPlayManager.ts        # Main manager class
│   ├── ThreatAnalyzer.ts           # Game state analysis
│   ├── ActionPlanner.ts            # Decision making
│   ├── ActionExecutor.ts           # Action execution
│   ├── CoverageAnalyzer.ts         # Sector coverage analysis
│   ├── PersonalityConfig.ts        # AI personality definitions
│   └── types.ts                    # AI-specific types
├── config/
│   └── ai.config.ts                # AI tuning parameters
```

### 5.3 Integration Points

```typescript
// In Game.ts - Add AI manager
private aiManager: AIAutoPlayManager;

private createManagers(): void {
  // ... existing managers ...
  
  this.aiManager = new AIAutoPlayManager(
    this.world,
    services.get('placementManager'),
    services.get('upgradeManager'),
    services.get('resourceManager'),
    services.get('waveManager')
  );
}

// In game loop - Update AI
this.loopManager.onGameplay((dt) => {
  this.gameplayManager.update(dt);
  
  if (this.aiManager.isEnabled()) {
    this.aiManager.update(dt, this.gameplayManager.getGameTime());
  }
});

// In UIController - Add toggle button
private createAIToggleButton(): void {
  // Add button to HUD for AI toggle
}
```

---

## 6. Configuration

### 6.1 AI Config File

```typescript
// src/config/ai.config.ts
export const AI_CONFIG = {
  // Timing
  DECISION_INTERVAL_MS: 500,        // Time between AI decisions
  PLACEMENT_COOLDOWN_MS: 1000,      // Min time between placements
  UPGRADE_COOLDOWN_MS: 750,         // Min time between upgrades
  
  // Analysis
  SECTOR_GRID_COLS: 8,
  SECTOR_GRID_ROWS: 6,
  THREAT_PREDICTION_SECONDS: 5,     // How far ahead to predict
  
  // Placement
  MIN_TURRET_SPACING: 80,           // Minimum distance between turrets
  OPTIMAL_KM_DISTANCE: 200,         // Ideal distance from Kobayashi Maru
  COVERAGE_OVERLAP_PENALTY: 0.3,    // Penalty for overlapping coverage
  
  // Resources
  EMERGENCY_RESERVE: 100,           // Always keep this much in reserve
  UPGRADE_THRESHOLD: 0.7,           // Upgrade when turret efficiency > 70%
  
  // Thresholds
  THREAT_LEVEL_LOW: 25,
  THREAT_LEVEL_MEDIUM: 50,
  THREAT_LEVEL_HIGH: 75,
  THREAT_LEVEL_CRITICAL: 90,
  
  // Personality defaults
  PERSONALITIES: {
    BALANCED: {
      placementBias: { distanceFromKM: 0, coverageVsDamage: 0 },
      upgradeBias: { damageVsUtility: 0, earlyVsLate: 0 },
      riskTolerance: 0.5
    },
    AGGRESSIVE: {
      placementBias: { distanceFromKM: -0.5, coverageVsDamage: 0.7 },
      upgradeBias: { damageVsUtility: 0.8, earlyVsLate: 0.6 },
      riskTolerance: 0.8
    },
    DEFENSIVE: {
      placementBias: { distanceFromKM: 0.6, coverageVsDamage: -0.5 },
      upgradeBias: { damageVsUtility: -0.3, earlyVsLate: -0.4 },
      riskTolerance: 0.2
    },
    ECONOMIC: {
      placementBias: { distanceFromKM: 0.2, coverageVsDamage: -0.3 },
      upgradeBias: { damageVsUtility: 0, earlyVsLate: -0.6 },
      riskTolerance: 0.4
    },
    ADAPTIVE: {
      placementBias: { distanceFromKM: 0, coverageVsDamage: 0 },
      upgradeBias: { damageVsUtility: 0, earlyVsLate: 0 },
      riskTolerance: 0.5
    }
  }
};
```

---

## 7. UI Integration

### 7.1 AI Control Panel

```
┌─────────────────────────────────────────┐
│  🤖 AI COMMANDER                        │
├─────────────────────────────────────────┤
│  Status: [ACTIVE] / [INACTIVE]          │
│                                         │
│  Personality: [▼ Balanced    ]          │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Current Action:                 │    │
│  │ Placing Phaser Array at (450,   │    │
│  │ 320) - Coverage gap detected    │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Threat Level: ████████░░ 78%           │
│  Coverage:     ██████░░░░ 62%           │
│                                         │
│  [Toggle AI] [Settings]                 │
└─────────────────────────────────────────┘
```

### 7.2 Visual Feedback

When AI is active, show:
- Highlight planned turret placement position
- Show threat vectors as arrows
- Indicate coverage gaps with colored overlays
- Display AI "thinking" indicator during decisions

---

## 8. Implementation Phases

### Phase 1: Foundation (MVP)
- [ ] Create `AIAutoPlayManager` class
- [ ] Implement basic `ThreatAnalyzer`
- [ ] Simple placement logic (fill coverage gaps)
- [ ] Toggle button in UI
- [ ] Basic upgrade decisions

### Phase 2: Intelligence
- [ ] Sector-based coverage analysis
- [ ] Threat prediction (velocity-based)
- [ ] Turret type selection logic
- [ ] Wave composition analysis

### Phase 3: Personalities
- [ ] Implement personality system
- [ ] UI for personality selection
- [ ] Personality-specific behaviors
- [ ] Adaptive personality logic

### Phase 4: Polish
- [ ] Visual feedback system
- [ ] AI decision logging
- [ ] Performance optimization
- [ ] Tuning and balancing

### Phase 5: Extensions
- [ ] Support for future abilities
- [ ] Learning from player behavior
- [ ] Difficulty-based AI scaling
- [ ] Replay/demo mode

---

## 9. Testing Strategy

### 9.1 Unit Tests

```typescript
describe('ThreatAnalyzer', () => {
  it('should calculate threat level based on distance and speed');
  it('should identify coverage gaps');
  it('should predict enemy positions');
});

describe('ActionPlanner', () => {
  it('should prioritize placement when coverage is low');
  it('should prioritize upgrades when resources are high');
  it('should select appropriate turret types');
});

describe('AIAutoPlayManager', () => {
  it('should toggle on/off correctly');
  it('should respect decision interval');
  it('should not act when disabled');
});
```

### 9.2 Integration Tests

- AI survives wave 1-5 consistently
- AI makes reasonable decisions under resource constraints
- AI responds to different wave compositions
- AI doesn't break existing game systems

### 9.3 Performance Tests

- AI decision time < 5ms per frame
- Memory usage stable over long sessions
- No frame drops when AI is active

---

## 10. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Survival time | ≥ Average player | Compare AI vs player stats |
| Decision quality | Reasonable choices | Manual review of decisions |
| Performance impact | < 2ms per frame | Profiling |
| Player satisfaction | Positive feedback | User testing |
| Code quality | Passes all checks | Lint, tests, build |

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI too strong | Reduces player engagement | Tune down, add difficulty levels |
| AI too weak | Frustrating to watch | Improve algorithms, more testing |
| Performance issues | Frame drops | Optimize, reduce decision frequency |
| Complex integration | Bugs, maintenance | Clean interfaces, good tests |
| Scope creep | Delayed delivery | Strict phase boundaries |

---

## 12. Future Considerations

### 12.1 Machine Learning Integration
- Train AI on player replays
- Reinforcement learning for strategy optimization
- Neural network for threat assessment

### 12.2 Multiplayer AI
- AI teammates in co-op mode
- AI opponents in versus mode
- Difficulty scaling based on player skill

### 12.3 Advanced Features
- Commander abilities (special powers)
- Strategic resource management
- Long-term planning (multi-wave strategy)
- Adaptive difficulty based on AI performance

---

## Appendix A: Algorithm Details

### A.1 Threat Level Calculation

```typescript
function calculateThreatLevel(enemy: EnemyData, kmPosition: Position): number {
  const dx = kmPosition.x - enemy.x;
  const dy = kmPosition.y - enemy.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // Base threat from distance (closer = higher)
  const distanceThreat = Math.max(0, 100 - (distance / 10));
  
  // Speed threat (faster = higher)
  const speed = Math.sqrt(enemy.vx * enemy.vx + enemy.vy * enemy.vy);
  const speedThreat = Math.min(30, speed / 5);
  
  // Health threat (more HP = harder to kill)
  const healthThreat = (enemy.health / enemy.maxHealth) * 20;
  
  // Faction modifier
  const factionModifier = FACTION_THREAT_MODIFIERS[enemy.factionId] || 1.0;
  
  // Elite/Boss modifier
  const rankModifier = enemy.isElite ? 1.5 : (enemy.isBoss ? 2.5 : 1.0);
  
  return Math.min(100, 
    (distanceThreat + speedThreat + healthThreat) * factionModifier * rankModifier
  );
}
```

### A.2 Placement Score Calculation

```typescript
function calculatePlacementScore(
  x: number, 
  y: number, 
  turretType: TurretTypeId,
  coverage: CoverageMap,
  threats: ThreatVector[]
): number {
  const config = TURRET_CONFIG[turretType];
  let score = 0;
  
  // Coverage contribution
  const newCoverage = calculateNewCoverage(x, y, config.range, coverage);
  score += newCoverage * 30;
  
  // Threat coverage
  const threatsInRange = threats.filter(t => 
    distance(x, y, t.position.x, t.position.y) <= config.range
  );
  score += Math.min(25, threatsInRange.length * 5);
  
  // Distance from KM (optimal is ~200 pixels)
  const kmDistance = distance(x, y, KM_X, KM_Y);
  const distanceScore = 15 - Math.abs(kmDistance - 200) / 20;
  score += Math.max(0, distanceScore);
  
  // Synergy with nearby turrets
  const nearbyTurrets = getTurretsInRange(x, y, 150);
  score += calculateSynergyBonus(turretType, nearbyTurrets);
  
  // Cost efficiency
  score += (10 - config.cost / 50);
  
  return score;
}
```

---

## Appendix B: Event Integration

```typescript
// AI listens to these events for reactive decisions
const AI_RELEVANT_EVENTS = [
  GameEventType.WAVE_STARTED,      // Prepare for new wave
  GameEventType.WAVE_COMPLETED,    // Evaluate performance
  GameEventType.ENEMY_KILLED,      // Update threat assessment
  GameEventType.PLAYER_DAMAGED,    // Emergency response
  GameEventType.RESOURCE_UPDATED,  // Re-evaluate affordable actions
];
```

---

*Document Version: 1.0*  
*Last Updated: December 11, 2025*
