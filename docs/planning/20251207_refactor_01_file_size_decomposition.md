# Refactoring Task: File Size Decomposition

**Date:** 2025-12-07  
**Priority:** HIGH  
**Estimated Effort:** 3-4 days  
**AI Friendliness Impact:** CRITICAL

---

## Problem Statement

Large monolithic files are difficult for AI coding assistants to work with effectively because:
- They exceed typical context window limits
- Changes require understanding too much surrounding code
- Multiple concerns mixed together cause confusion about intent
- Higher risk of merge conflicts when AI makes changes

### Files Exceeding 500 Lines (Current State)

| File | Lines | Primary Concerns |
|------|-------|------------------|
| `src/core/Game.ts` | 1,196 | Game loop, input handling, system management, entity management, UI coordination, restart logic, pause system, debug modes |
| `src/ui/HUDManager.ts` | 952 | 10+ HUD panels, resize handling, message logging, turret menu coordination |
| `src/ecs/entityFactory.ts` | 546 | 11 entity creation functions with repetitive patterns |
| `src/systems/combatSystem.ts` | 425 | Combat logic, beam generation, damage application, stats tracking |
| `src/game/waveManager.ts` | ~400 | Wave spawning, timing, progression |

---

## Recommended Actions

### 1. Split `Game.ts` into Focused Managers

**Create the following modules:**

```
src/core/
├── Game.ts                 # (~200 lines) Main orchestrator only
├── GameLoop.ts             # (~100 lines) Update loop and timing
├── GameInputHandler.ts     # (~150 lines) Keyboard and pointer handling
├── GameSystemRegistration.ts # (~100 lines) System setup and ordering
├── GameStateController.ts  # (~150 lines) Pause, restart, game over
└── index.ts                # Barrel export
```

**Extraction Pattern:**
```typescript
// Before (Game.ts)
export class Game {
  // 1196 lines of mixed concerns
}

// After (Game.ts)
import { GameLoop } from './GameLoop';
import { GameInputHandler } from './GameInputHandler';
import { GameStateController } from './GameStateController';

export class Game {
  private loop: GameLoop;
  private input: GameInputHandler;
  private stateController: GameStateController;
  
  constructor(containerId: string) {
    this.loop = new GameLoop(this);
    this.input = new GameInputHandler(this);
    this.stateController = new GameStateController(this);
  }
  
  // Only coordination methods remain here
}
```

### 2. Split `HUDManager.ts` into Panel Components

**Create panel-specific modules:**

```
src/ui/hud/
├── HUDManager.ts           # (~150 lines) Coordinator
├── WaveInfoPanel.ts        # (~80 lines)
├── ResourcePanel.ts        # (~60 lines)
├── ScorePanel.ts           # (~80 lines)
├── KobayashiMaruPanel.ts   # (~100 lines)
├── StatsPanel.ts           # (~80 lines)
├── ToggleButtons.ts        # (~120 lines)
└── index.ts
```

### 3. Refactor `entityFactory.ts` with Configuration Pattern

**Replace repetitive functions with configuration-driven approach:**

```typescript
// Before: 11 separate functions with duplicated logic
export function createKlingonShip(world, x, y) { /* 40 lines */ }
export function createRomulanShip(world, x, y) { /* 40 lines */ }
// ... 9 more similar functions

// After: Single configurable factory
interface EntityConfig {
  components: ComponentConfig[];
  defaults: Record<string, Record<string, number>>;
}

const ENEMY_CONFIGS: Record<FactionId, EntityConfig> = {
  [FactionId.KLINGON]: {
    components: [Position, Velocity, Health, Shield, Faction, AIBehavior],
    defaults: {
      Health: { current: 100, max: 100 },
      Shield: { current: 50, max: 50 },
      // ...
    }
  },
  // Other factions...
};

export function createEnemy(
  world: GameWorld,
  faction: FactionId,
  x: number,
  y: number
): number {
  const config = ENEMY_CONFIGS[faction];
  const eid = addEntity(world);
  
  for (const [component, values] of Object.entries(config.defaults)) {
    addComponent(world, ComponentMap[component], eid);
    Object.assign(ComponentMap[component], values, eid);
  }
  
  return eid;
}
```

---

## AI-Friendly Target Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Max file lines | 1,196 | < 400 |
| Avg file lines | ~180 | < 150 |
| Single responsibility per file | 60% | 95% |
| Methods per class | Up to 50 | < 15 |

---

## Verification

- [ ] All tests pass after refactoring
- [ ] No circular dependencies introduced
- [ ] Each new file has a clear, single responsibility
- [ ] TypeScript compilation succeeds with strict mode
- [ ] Linting passes without new warnings

---

## Dependencies

- None - can be started immediately
- Recommend completing before other refactoring tasks
