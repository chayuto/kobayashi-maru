# AI Auto-Play Implementation Tasks

**Date:** December 11, 2025  
**Related:** [AI Auto-Play System Design](./20251211_ai_autoplay_system.md)

---

## Task Overview

This document breaks down the AI Auto-Play system into implementable tasks with estimates and dependencies.

---

## ⚠️ Game Rules Compliance (CRITICAL)

**The AI MUST follow all game rules. It is NOT a cheat system.**

### Mandatory Constraints

| Constraint | How Enforced |
|------------|--------------|
| Resource costs | Use `ResourceManager.canAfford()` and `spendResources()` |
| Turret placement | Use `PlacementManager.validatePosition()` and `placeTurret()` |
| Turret spacing | Enforced by PlacementManager (MIN_TURRET_DISTANCE) |
| World bounds | Enforced by PlacementManager |
| Upgrade limits | Use `UpgradeManager.canUpgrade()` and `applyUpgrade()` |
| Sell refunds | Use `UpgradeManager.sellTurret()` (75% refund) |
| Game state | Check `GameState.isPlaying()` before any action |
| Decision speed | Respect `AI_CONFIG.DECISION_INTERVAL_MS` |

### Forbidden Actions

The AI system MUST NOT:
- ❌ Create entities directly (use PlacementManager)
- ❌ Modify ECS components directly (use managers)
- ❌ Bypass resource checks
- ❌ Place turrets in invalid positions
- ❌ Act when game is paused or over
- ❌ Make decisions faster than the interval allows
- ❌ Access hidden game state (future spawns, RNG seeds)
- ❌ Predict random events (elite spawns)

### Architecture Enforcement

```
Player Input ──────┐
                   ├──▶ PlacementManager ──▶ ECS World
AI ActionExecutor ─┘    UpgradeManager
                        ResourceManager
                        
Both paths use the SAME validation and rules.
```

---

## Phase 1: Foundation (MVP) - Estimated: 8-12 hours

### Task 1.1: Create AI Module Structure
**Priority:** P0 | **Estimate:** 1 hour | **Dependencies:** None

```bash
# Create directory structure
src/ai/
├── index.ts
├── types.ts
├── AIAutoPlayManager.ts
├── ThreatAnalyzer.ts
├── ActionPlanner.ts
├── ActionExecutor.ts
└── CoverageAnalyzer.ts
```

**Acceptance Criteria:**
- [ ] All files created with basic exports
- [ ] Barrel export in `index.ts`
- [ ] Types defined in `types.ts`
- [ ] Builds without errors

---

### Task 1.2: Define AI Types
**Priority:** P0 | **Estimate:** 1 hour | **Dependencies:** 1.1

```typescript
// src/ai/types.ts
export enum AIActionType {
  PLACE_TURRET = 'PLACE_TURRET',
  UPGRADE_TURRET = 'UPGRADE_TURRET',
  SELL_TURRET = 'SELL_TURRET'
}

export enum AIPersonality {
  BALANCED = 'BALANCED',
  AGGRESSIVE = 'AGGRESSIVE',
  DEFENSIVE = 'DEFENSIVE',
  ECONOMIC = 'ECONOMIC',
  ADAPTIVE = 'ADAPTIVE'
}

export interface ThreatVector {
  entityId: number;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  predictedImpactTime: number;
  threatLevel: number;
  factionId: number;
  behaviorType: number;
  healthPercent: number;
  isElite: boolean;
  isBoss: boolean;
}

export interface AIAction {
  type: AIActionType;
  priority: number;
  cost: number;
  expectedValue: number;
  params: PlacementParams | UpgradeParams | SellParams;
}

export interface PlacementParams {
  x: number;
  y: number;
  turretType: number;
}

export interface UpgradeParams {
  turretId: number;
  upgradePath: number;
}

export interface SellParams {
  turretId: number;
}

export interface CoverageMap {
  sectors: SectorData[];
  totalCoverage: number;
  weakestSector: number;
}

export interface SectorData {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  turretCount: number;
  totalDPS: number;
  enemyCount: number;
  threatLevel: number;
}

export interface AIStatus {
  enabled: boolean;
  personality: AIPersonality;
  currentAction: AIAction | null;
  threatLevel: number;
  coveragePercent: number;
  lastDecisionTime: number;
}
```

**Acceptance Criteria:**
- [ ] All types exported
- [ ] No TypeScript errors
- [ ] Types match design document

---

### Task 1.3: Create AI Config
**Priority:** P0 | **Estimate:** 0.5 hours | **Dependencies:** 1.2

```typescript
// src/config/ai.config.ts
export const AI_CONFIG = {
  DECISION_INTERVAL_MS: 500,
  PLACEMENT_COOLDOWN_MS: 1000,
  UPGRADE_COOLDOWN_MS: 750,
  
  SECTOR_GRID_COLS: 8,
  SECTOR_GRID_ROWS: 6,
  THREAT_PREDICTION_SECONDS: 5,
  
  MIN_TURRET_SPACING: 80,
  OPTIMAL_KM_DISTANCE: 200,
  COVERAGE_OVERLAP_PENALTY: 0.3,
  
  EMERGENCY_RESERVE: 100,
  UPGRADE_THRESHOLD: 0.7,
  
  THREAT_LEVEL: {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75,
    CRITICAL: 90
  },
  
  FACTION_THREAT_MODIFIERS: {
    1: 1.0,  // Klingon
    2: 1.2,  // Romulan (cloaking)
    3: 1.5,  // Borg (regen)
    4: 1.3,  // Tholian (orbit)
    5: 1.8   // Species 8472 (hunter)
  }
};
```

**Acceptance Criteria:**
- [ ] Config file created
- [ ] Exported from `src/config/index.ts`
- [ ] Values match design document

---

### Task 1.4: Implement ThreatAnalyzer
**Priority:** P0 | **Estimate:** 2 hours | **Dependencies:** 1.2, 1.3

```typescript
// src/ai/ThreatAnalyzer.ts
export class ThreatAnalyzer {
  constructor(private world: GameWorld) {}
  
  analyzeThreats(): ThreatVector[] {
    // Query all enemies
    // Calculate threat level for each
    // Sort by threat level
    // Return top threats
  }
  
  private calculateThreatLevel(
    entityId: number,
    kmX: number,
    kmY: number
  ): number {
    // Distance factor
    // Speed factor
    // Health factor
    // Faction modifier
    // Elite/Boss modifier
  }
  
  getOverallThreatLevel(): number {
    // Aggregate threat from all enemies
  }
}
```

**Acceptance Criteria:**
- [ ] Correctly identifies all enemies
- [ ] Threat levels calculated accurately
- [ ] Performance < 1ms for 100 enemies
- [ ] Unit tests pass

---

### Task 1.5: Implement CoverageAnalyzer
**Priority:** P0 | **Estimate:** 2 hours | **Dependencies:** 1.2, 1.3

```typescript
// src/ai/CoverageAnalyzer.ts
export class CoverageAnalyzer {
  private sectors: SectorData[];
  
  constructor(
    private world: GameWorld,
    private cols: number = AI_CONFIG.SECTOR_GRID_COLS,
    private rows: number = AI_CONFIG.SECTOR_GRID_ROWS
  ) {
    this.initializeSectors();
  }
  
  analyze(): CoverageMap {
    // Reset sector data
    // Count turrets per sector
    // Calculate DPS per sector
    // Count enemies per sector
    // Find weakest sector
  }
  
  getWeakestSector(): SectorData {
    // Return sector with lowest coverage relative to threat
  }
  
  getSectorAt(x: number, y: number): SectorData {
    // Return sector containing position
  }
  
  getCoverageAtPosition(x: number, y: number): number {
    // Calculate how much turret coverage exists at position
  }
}
```

**Acceptance Criteria:**
- [ ] Sectors correctly divide play area
- [ ] Turret coverage calculated per sector
- [ ] Enemy presence tracked per sector
- [ ] Unit tests pass

---

### Task 1.6: Implement ActionPlanner (Basic)
**Priority:** P0 | **Estimate:** 2 hours | **Dependencies:** 1.4, 1.5

```typescript
// src/ai/ActionPlanner.ts
export class ActionPlanner {
  constructor(
    private threatAnalyzer: ThreatAnalyzer,
    private coverageAnalyzer: CoverageAnalyzer
  ) {}
  
  planActions(resources: number): AIAction[] {
    const actions: AIAction[] = [];
    
    // Check if placement is needed
    const coverage = this.coverageAnalyzer.analyze();
    if (coverage.totalCoverage < 0.7) {
      const placement = this.planPlacement(resources, coverage);
      if (placement) actions.push(placement);
    }
    
    // Check if upgrades are beneficial
    const upgrade = this.planUpgrade(resources);
    if (upgrade) actions.push(upgrade);
    
    // Sort by priority
    return actions.sort((a, b) => b.priority - a.priority);
  }
  
  private planPlacement(
    resources: number,
    coverage: CoverageMap
  ): AIAction | null {
    // Find best position in weakest sector
    // Select appropriate turret type
    // Return placement action
  }
  
  private planUpgrade(resources: number): AIAction | null {
    // Find turret with best upgrade value
    // Return upgrade action
  }
}
```

**Acceptance Criteria:**
- [ ] Returns valid actions
- [ ] Respects resource constraints
- [ ] Prioritizes correctly
- [ ] Unit tests pass

---

### Task 1.7: Implement ActionExecutor
**Priority:** P0 | **Estimate:** 1 hour | **Dependencies:** 1.6

**IMPORTANT: Game Rules Compliance**
- ActionExecutor MUST use PlacementManager and UpgradeManager APIs
- NEVER directly create entities or modify ECS components
- All validation happens through the managers (same as player)

```typescript
// src/ai/ActionExecutor.ts
export class ActionExecutor {
  constructor(
    private placementManager: PlacementManager,
    private upgradeManager: UpgradeManager,
    private resourceManager: ResourceManager
  ) {}
  
  /**
   * Execute an AI action using the SAME game APIs as player input.
   * This ensures AI follows all game rules:
   * - Resource costs are deducted
   * - Position validation is enforced
   * - Upgrade prerequisites are checked
   */
  execute(action: AIAction): boolean {
    // Double-check we can afford this (managers will also check)
    if (!this.resourceManager.canAfford(action.cost)) {
      return false;
    }
    
    switch (action.type) {
      case AIActionType.PLACE_TURRET:
        return this.executePlacement(action.params as PlacementParams);
      case AIActionType.UPGRADE_TURRET:
        return this.executeUpgrade(action.params as UpgradeParams);
      case AIActionType.SELL_TURRET:
        return this.executeSell(action.params as SellParams);
      default:
        return false;
    }
  }
  
  private executePlacement(params: PlacementParams): boolean {
    // Use PlacementManager - it validates:
    // - Position bounds
    // - Minimum turret spacing
    // - Resource cost
    this.placementManager.startPlacing(params.turretType);
    const result = this.placementManager.placeTurret(params.x, params.y);
    return result.success;
  }
  
  private executeUpgrade(params: UpgradeParams): boolean {
    // Use UpgradeManager - it validates:
    // - Turret exists
    // - Not at max level
    // - Resource cost
    const result = this.upgradeManager.applyUpgrade(
      params.turretId,
      params.upgradePath
    );
    return result.success;
  }
  
  private executeSell(params: SellParams): boolean {
    // Use UpgradeManager - same 75% refund as player
    const refund = this.upgradeManager.sellTurret(params.turretId);
    return refund > 0;
  }
  
  /**
   * Pre-validate an action before adding to plan.
   * Uses same validation as player would experience.
   */
  canExecute(action: AIAction): boolean {
    if (!this.resourceManager.canAfford(action.cost)) {
      return false;
    }
    
    if (action.type === AIActionType.PLACE_TURRET) {
      const params = action.params as PlacementParams;
      // Use PlacementManager's validation
      return this.placementManager.validatePosition(params.x, params.y);
    }
    
    if (action.type === AIActionType.UPGRADE_TURRET) {
      const params = action.params as UpgradeParams;
      // Use UpgradeManager's validation
      return this.upgradeManager.canUpgrade(params.turretId, params.upgradePath);
    }
    
    return true;
  }
}
```

**Acceptance Criteria:**
- [ ] Successfully places turrets via PlacementManager
- [ ] Successfully upgrades turrets via UpgradeManager
- [ ] Successfully sells turrets via UpgradeManager
- [ ] Returns correct success/failure
- [ ] **NEVER bypasses manager validation**
- [ ] **NEVER directly modifies ECS components**

---

### Task 1.8: Implement AIAutoPlayManager
**Priority:** P0 | **Estimate:** 2 hours | **Dependencies:** 1.4-1.7

**IMPORTANT: Game Rules Compliance**
- AI must respect game state (paused, game over)
- AI must use manager APIs only (no direct ECS manipulation)
- AI must follow same timing constraints as player

```typescript
// src/ai/AIAutoPlayManager.ts
export class AIAutoPlayManager {
  private enabled: boolean = false;
  private personality: AIPersonality = AIPersonality.BALANCED;
  private threatAnalyzer: ThreatAnalyzer;
  private coverageAnalyzer: CoverageAnalyzer;
  private planner: ActionPlanner;
  private executor: ActionExecutor;
  private lastDecisionTime: number = 0;
  private currentAction: AIAction | null = null;
  
  constructor(
    private world: GameWorld,
    placementManager: PlacementManager,
    upgradeManager: UpgradeManager,
    private resourceManager: ResourceManager,
    private waveManager: WaveManager,
    private gameState: GameState  // Required to respect pause/game over
  ) {
    // Analyzers are READ-ONLY - they query but never modify
    this.threatAnalyzer = new ThreatAnalyzer(world);
    this.coverageAnalyzer = new CoverageAnalyzer(world);
    
    // Planner needs resource manager to filter affordable actions
    this.planner = new ActionPlanner(
      this.threatAnalyzer, 
      this.coverageAnalyzer,
      resourceManager
    );
    
    // Executor uses ONLY manager APIs - enforces all game rules
    this.executor = new ActionExecutor(
      placementManager, 
      upgradeManager,
      resourceManager
    );
  }
  
  toggle(): boolean {
    this.enabled = !this.enabled;
    return this.enabled;
  }
  
  isEnabled(): boolean {
    return this.enabled;
  }
  
  setPersonality(personality: AIPersonality): void {
    this.personality = personality;
  }
  
  update(deltaTime: number, gameTime: number): void {
    // RULE: AI does nothing when disabled
    if (!this.enabled) return;
    
    // RULE: AI respects game state (same as player input)
    if (!this.gameState.isPlaying()) {
      return; // Don't act when paused or game over
    }
    
    // RULE: AI respects decision interval (no superhuman speed)
    if (gameTime - this.lastDecisionTime < AI_CONFIG.DECISION_INTERVAL_MS / 1000) {
      return;
    }
    
    this.lastDecisionTime = gameTime;
    
    // Plan actions (planner filters by what we can afford)
    const resources = this.resourceManager.getResources();
    const actions = this.planner.planActions(resources);
    
    if (actions.length > 0) {
      this.currentAction = actions[0];
      // Execute through managers - they enforce all game rules
      const success = this.executor.execute(this.currentAction);
      if (!success) {
        // Action failed validation - clear it
        this.currentAction = null;
      }
    } else {
      this.currentAction = null;
    }
  }
  
  getStatus(): AIStatus {
    return {
      enabled: this.enabled,
      personality: this.personality,
      currentAction: this.currentAction,
      threatLevel: this.threatAnalyzer.getOverallThreatLevel(),
      coveragePercent: this.coverageAnalyzer.analyze().totalCoverage * 100,
      lastDecisionTime: this.lastDecisionTime
    };
  }
}
```

**Acceptance Criteria:**
- [ ] Toggle works correctly
- [ ] Respects decision interval (no superhuman speed)
- [ ] **Respects game state (no actions when paused/game over)**
- [ ] Executes planned actions via managers only
- [ ] Status returns correct data
- [ ] **NEVER bypasses game rules**

---

### Task 1.9: Integrate with Game.ts
**Priority:** P0 | **Estimate:** 1 hour | **Dependencies:** 1.8

```typescript
// Modifications to src/core/Game.ts

// Add import
import { AIAutoPlayManager } from '../ai';

// Add property
private aiManager!: AIAutoPlayManager;

// In createManagers()
this.aiManager = new AIAutoPlayManager(
  this.world,
  services.get('placementManager'),
  services.get('upgradeManager'),
  services.get('resourceManager'),
  services.get('waveManager')
);

// In setupLoopCallbacks() - onGameplay
this.loopManager.onGameplay((dt) => {
  this.gameplayManager.update(dt);
  
  if (this.aiManager.isEnabled()) {
    this.aiManager.update(dt, this.gameplayManager.getGameTime());
  }
});

// Add public methods
toggleAI(): boolean {
  return this.aiManager.toggle();
}

isAIEnabled(): boolean {
  return this.aiManager.isEnabled();
}

getAIStatus(): AIStatus {
  return this.aiManager.getStatus();
}
```

**Acceptance Criteria:**
- [ ] AI manager created on init
- [ ] AI updated in game loop
- [ ] Public API accessible
- [ ] No regressions in existing functionality

---

### Task 1.10: Add UI Toggle Button
**Priority:** P1 | **Estimate:** 1 hour | **Dependencies:** 1.9

```typescript
// Modifications to src/ui/HUDManager.ts or create new AIPanel.ts

// Add AI toggle button to HUD
private createAIToggle(): void {
  const button = new Button({
    text: '🤖 AI: OFF',
    onClick: () => this.onAIToggle()
  });
  // Position in corner
}

private onAIToggle(): void {
  const enabled = this.callbacks.onToggleAI?.();
  this.aiButton.setText(`🤖 AI: ${enabled ? 'ON' : 'OFF'}`);
}
```

**Acceptance Criteria:**
- [ ] Button visible in HUD
- [ ] Click toggles AI state
- [ ] Visual feedback on state change

---

## Phase 2: Intelligence - Estimated: 6-8 hours

### Task 2.1: Enhanced Threat Prediction
**Priority:** P1 | **Estimate:** 2 hours | **Dependencies:** Phase 1

- Predict enemy positions based on velocity
- Calculate time-to-impact for each enemy
- Factor in AI behavior patterns (strafe, orbit, etc.)

---

### Task 2.2: Turret Type Selection Logic
**Priority:** P1 | **Estimate:** 2 hours | **Dependencies:** Phase 1

- Analyze current wave composition
- Select counter-turrets for enemy types
- Consider existing turret synergies

---

### Task 2.3: Wave Composition Analysis
**Priority:** P1 | **Estimate:** 2 hours | **Dependencies:** 2.1

- Predict upcoming wave composition
- Pre-position turrets for expected threats
- Adjust strategy based on wave number

---

### Task 2.4: Upgrade Priority Optimization
**Priority:** P1 | **Estimate:** 2 hours | **Dependencies:** Phase 1

- Calculate upgrade value per turret
- Consider turret position and traffic
- Balance damage vs utility upgrades

---

## Phase 3: Personalities - Estimated: 4-6 hours

### Task 3.1: Implement Personality System
**Priority:** P2 | **Estimate:** 2 hours | **Dependencies:** Phase 2

- Create PersonalityConfig interface
- Implement personality-specific biases
- Apply biases to placement and upgrade decisions

---

### Task 3.2: Personality Selection UI
**Priority:** P2 | **Estimate:** 1 hour | **Dependencies:** 3.1

- Add dropdown/selector for personality
- Show personality description
- Persist selection

---

### Task 3.3: Adaptive Personality Logic
**Priority:** P2 | **Estimate:** 2 hours | **Dependencies:** 3.1

- Track wave performance
- Adjust strategy based on results
- Switch between aggressive/defensive as needed

---

## Phase 4: Polish - Estimated: 4-6 hours

### Task 4.1: Visual Feedback System
**Priority:** P2 | **Estimate:** 2 hours | **Dependencies:** Phase 3

- Show planned placement position
- Highlight threat vectors
- Display coverage gaps

---

### Task 4.2: AI Decision Logging
**Priority:** P3 | **Estimate:** 1 hour | **Dependencies:** Phase 1

- Log decisions to console (debug mode)
- Show reasoning in UI
- Track decision history

---

### Task 4.3: Performance Optimization
**Priority:** P2 | **Estimate:** 2 hours | **Dependencies:** Phase 2

- Profile AI decision time
- Optimize hot paths
- Add caching where beneficial

---

### Task 4.4: Tuning and Balancing
**Priority:** P2 | **Estimate:** 2 hours | **Dependencies:** Phase 3

- Playtest AI performance
- Adjust config values
- Balance personalities

---

## Testing Tasks

### Test 1: Unit Tests
**Priority:** P0 | **Estimate:** 2 hours | **Dependencies:** Each task

```typescript
// src/__tests__/ai/ThreatAnalyzer.test.ts
describe('ThreatAnalyzer', () => {
  it('should calculate threat level based on distance');
  it('should apply faction modifiers');
  it('should identify elite/boss enemies');
});

// src/__tests__/ai/CoverageAnalyzer.test.ts
describe('CoverageAnalyzer', () => {
  it('should divide area into sectors');
  it('should calculate turret coverage');
  it('should identify weakest sector');
});

// src/__tests__/ai/ActionPlanner.test.ts
describe('ActionPlanner', () => {
  it('should plan placement when coverage is low');
  it('should respect resource constraints');
  it('should prioritize actions correctly');
});
```

---

### Test 2: Integration Tests
**Priority:** P1 | **Estimate:** 2 hours | **Dependencies:** Phase 1

- AI survives waves 1-5
- AI places turrets correctly
- AI upgrades appropriately
- No game crashes with AI enabled

---

## Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Foundation | 10 tasks | 8-12 hours |
| Phase 2: Intelligence | 4 tasks | 6-8 hours |
| Phase 3: Personalities | 3 tasks | 4-6 hours |
| Phase 4: Polish | 4 tasks | 4-6 hours |
| Testing | 2 tasks | 4 hours |
| **Total** | **23 tasks** | **26-36 hours** |

---

## Quick Start Implementation Order

For fastest MVP:

1. Task 1.1: Create module structure
2. Task 1.2: Define types
3. Task 1.3: Create config
4. Task 1.5: CoverageAnalyzer (simpler than threat)
5. Task 1.4: ThreatAnalyzer
6. Task 1.6: ActionPlanner (basic)
7. Task 1.7: ActionExecutor
8. Task 1.8: AIAutoPlayManager
9. Task 1.9: Game.ts integration
10. Task 1.10: UI toggle

This order minimizes blocking dependencies and gets a working AI fastest.

---

*Document Version: 1.0*  
*Last Updated: December 11, 2025*
