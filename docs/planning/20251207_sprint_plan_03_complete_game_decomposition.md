# Task: Further Decompose Game.ts

**Priority:** 🔴 Critical  
**Estimated Effort:** Large (4-6 hours)  
**Dependencies:** Ideally after Task 1 (HUD decomposition)  
**File Focus:** `src/core/Game.ts`, `src/core/`

---

## Background

`Game.ts` is a 1233-line "God class" that handles too many responsibilities. Prior work extracted `GameInputHandler`, `GameStateController`, and `GameCheatManager`, but more decomposition is needed.

## Current State

Existing extractions in `src/core/`:
- `GameInputHandler.ts` - Keyboard input ✅
- `GameStateController.ts` - Pause/restart logic ✅
- `GameCheatManager.ts` - God mode/slow mode ✅

Remaining in `Game.ts` (to extract):
- **Entity lifecycle** - `clearAllEntities()`, entity queries
- **Turret selection** - `handleCanvasClick()`, `findTurretAtPosition()`, `selectTurret()`
- **Event handling** - `handleEnemyKilled()`, `handleWaveStarted()`, `handleWaveCompleted()`
- **System coordination** - System manager setup and update loop
- **Rendering setup** - Sprite manager, particle system, render system init

---

## Objective

Extract remaining Game.ts logic into focused manager classes:
1. `GameEntityManager.ts` - Entity lifecycle and queries
2. `GameTurretController.ts` - Turret selection and interaction
3. `GameEventHandler.ts` - Event bus subscriptions and handlers

---

## Implementation Steps

### Step 1: Create GameEntityManager.ts

Extract entity-related logic:

```typescript
// src/core/GameEntityManager.ts
export class GameEntityManager {
  private world: GameWorld;
  
  constructor(world: GameWorld) {
    this.world = world;
  }
  
  clearAllEntities(): void {
    // Move logic from Game.clearAllEntities()
  }
  
  getEntityCount(): number {
    // Query and return count
  }
}
```

### Step 2: Create GameTurretController.ts

Extract turret interaction logic:

```typescript
// src/core/GameTurretController.ts
export class GameTurretController {
  private world: GameWorld;
  private hudManager: HUDManager;
  
  handleCanvasClick(event: PointerEvent): void {
    // Move from Game.handleCanvasClick()
  }
  
  findTurretAtPosition(x: number, y: number): number | null {
    // Move from Game.findTurretAtPosition()
  }
  
  selectTurret(turretId: number): void {
    // Move from Game.selectTurret()
  }
}
```

### Step 3: Create GameEventHandler.ts

Extract EventBus subscription logic:

```typescript
// src/core/GameEventHandler.ts
export class GameEventHandler {
  private waveManager: WaveManager;
  private resourceManager: ResourceManager;
  private hudManager: HUDManager;
  
  subscribeToEvents(): void {
    EventBus.subscribe(GameEventType.ENEMY_KILLED, this.handleEnemyKilled);
    EventBus.subscribe(GameEventType.WAVE_STARTED, this.handleWaveStarted);
    EventBus.subscribe(GameEventType.WAVE_COMPLETED, this.handleWaveCompleted);
  }
  
  private handleEnemyKilled = (payload: EnemyKilledPayload): void => {
    // Move from Game.handleEnemyKilled()
  };
}
```

### Step 4: Update Game.ts to Use New Managers

```typescript
import { GameEntityManager } from './GameEntityManager';
import { GameTurretController } from './GameTurretController';
import { GameEventHandler } from './GameEventHandler';

export class Game {
  private entityManager: GameEntityManager;
  private turretController: GameTurretController;
  private eventHandler: GameEventHandler;
  
  // Initialize in init() method
  this.entityManager = new GameEntityManager(this.world);
  this.turretController = new GameTurretController(this.world, this.hudManager);
  this.eventHandler = new GameEventHandler(...);
}
```

### Step 5: Update Barrel Export

Add new files to `src/core/index.ts`:

```typescript
export { GameEntityManager } from './GameEntityManager';
export { GameTurretController } from './GameTurretController';
export { GameEventHandler } from './GameEventHandler';
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/core/GameEntityManager.ts` | Entity lifecycle management |
| `src/core/GameTurretController.ts` | Turret selection and UI |
| `src/core/GameEventHandler.ts` | EventBus subscriptions |

## Files to Modify

| File | Changes |
|------|---------|
| `src/core/Game.ts` | Remove logic, use new managers |
| `src/core/index.ts` | Add new exports |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ ESLint passes: `npm run lint`
4. ✅ `Game.ts` line count reduced to <400 lines
5. ✅ Game runs correctly: `npm run dev`

---

## Verification Commands

```bash
# Run all tests
npm test

# Type check
npx tsc --noEmit

# Count lines in Game.ts
wc -l src/core/Game.ts
```

---

## Risk Assessment

- **High risk** - Core game class modifications
- **Mitigation:** Extract incrementally, run tests after each class
- **Rollback:** Git stash/revert if issues arise
