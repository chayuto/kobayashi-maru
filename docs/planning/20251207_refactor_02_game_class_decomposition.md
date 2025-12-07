# Refactor Task: Game Class Decomposition

**Date:** December 7, 2025  
**Priority:** 🔴 Critical  
**Complexity:** High  
**Estimated Effort:** 4-6 hours  

---

## Problem Statement

`src/core/Game.ts` is a 1196-line "God Class" that violates the Single Responsibility Principle. It currently handles:

1. PixiJS Application initialization
2. Game loop management
3. System registration and execution
4. Entity lifecycle (Kobayashi Maru creation, cleanup)
5. Input handling (keyboard, canvas clicks)
6. UI coordination (HUD, menus, overlays)
7. Game state transitions
8. Event subscriptions
9. Turret selection and upgrade coordination
10. God mode / slow mode toggles
11. Screen shake coordination
12. Resize handling

---

## Impact

- **Testing:** Cannot unit test individual concerns
- **Coupling:** Changes to one feature risk breaking others
- **Readability:** 1196 lines is too large to comprehend
- **Extension:** Adding features requires modifying this massive file
- **Debugging:** Hard to isolate issues

---

## Proposed Solution

Extract responsibilities into focused manager classes:

### New File Structure

```
src/core/
├── Game.ts                    (~200 lines) - Orchestrator only
├── GameLoop.ts                (~100 lines) - Ticker management
├── GameInitializer.ts         (~150 lines) - Setup and initialization
├── GameplayController.ts      (~200 lines) - Gameplay logic coordination
├── TurretSelectionManager.ts  (~150 lines) - Turret click/selection
├── ScreenEffectsManager.ts    (~100 lines) - Shake, visual effects
└── index.ts                   - Re-exports
```

---

## Implementation Steps

### Step 1: Create GameLoop.ts

Extract game loop concerns:

```typescript
// src/core/GameLoop.ts
export class GameLoop {
  private ticker: Ticker;
  private updateCallback: ((delta: number) => void) | null = null;
  private paused: boolean = false;

  constructor(app: Application) {
    this.ticker = app.ticker;
  }

  start(callback: (delta: number) => void): void {
    this.updateCallback = callback;
    this.ticker.add(this.tick.bind(this));
  }

  private tick(): void {
    if (this.paused || !this.updateCallback) return;
    const deltaTime = this.ticker.deltaMS / 1000;
    this.updateCallback(deltaTime);
  }

  pause(): void { this.paused = true; }
  resume(): void { this.paused = false; }
  isPaused(): boolean { return this.paused; }
}
```

### Step 2: Create GameInitializer.ts

Extract all initialization logic:

```typescript
// src/core/GameInitializer.ts
export interface GameSystems {
  spriteManager: SpriteManager;
  spatialHash: SpatialHash;
  systemManager: SystemManager;
  // ... all systems
}

export interface GameManagers {
  waveManager: WaveManager;
  resourceManager: ResourceManager;
  scoreManager: ScoreManager;
  // ... all managers
}

export class GameInitializer {
  async initializePixi(container: HTMLElement): Promise<Application> {
    const app = new Application();
    await app.init({ /* config */ });
    container.appendChild(app.canvas);
    return app;
  }

  initializeSystems(app: Application, world: GameWorld): GameSystems {
    // Create all systems
  }

  initializeManagers(): GameManagers {
    // Create all managers
  }

  initializeUI(app: Application, game: Game): void {
    // Setup HUD, menus, overlays
  }
}
```

### Step 3: Create TurretSelectionManager.ts

Extract turret click handling:

```typescript
// src/core/TurretSelectionManager.ts
export class TurretSelectionManager {
  private selectedTurretId: number = -1;
  private world: GameWorld;
  private upgradeManager: UpgradeManager;
  private upgradePanel: TurretUpgradePanel;

  constructor(world: GameWorld, upgradeManager: UpgradeManager, upgradePanel: TurretUpgradePanel) {
    this.world = world;
    this.upgradeManager = upgradeManager;
    this.upgradePanel = upgradePanel;
  }

  handleCanvasClick(worldX: number, worldY: number): void {
    const turretId = this.findTurretAtPosition(worldX, worldY);
    if (turretId !== -1) {
      this.selectTurret(turretId);
    } else {
      this.deselectTurret();
    }
  }

  private findTurretAtPosition(x: number, y: number): number {
    // Query turrets, check distance
  }

  selectTurret(turretId: number): void {
    this.selectedTurretId = turretId;
    const info = this.upgradeManager.getTurretInfo(turretId);
    this.upgradePanel.show(info, /* resources */, /* refund */);
  }

  deselectTurret(): void {
    this.selectedTurretId = -1;
    this.upgradePanel.hide();
  }

  getSelectedTurretId(): number {
    return this.selectedTurretId;
  }
}
```

### Step 4: Create GameplayController.ts

Extract gameplay coordination:

```typescript
// src/core/GameplayController.ts
export class GameplayController {
  private world: GameWorld;
  private systemManager: SystemManager;
  private waveManager: WaveManager;
  private scoreManager: ScoreManager;
  private kobayashiMaruId: number = -1;
  private gameTime: number = 0;

  initializeGameplay(): void {
    this.kobayashiMaruId = createKobayashiMaru(this.world, centerX, centerY);
    this.waveManager.init(this.world);
    this.waveManager.startWave(1);
  }

  update(deltaTime: number): void {
    this.gameTime += deltaTime;
    this.scoreManager.update(deltaTime);
    this.waveManager.update(deltaTime);
    this.systemManager.run(this.world, deltaTime, this.gameTime);
  }

  checkGameOver(): boolean {
    if (this.kobayashiMaruId === -1) return false;
    return Health.current[this.kobayashiMaruId] <= 0;
  }

  restart(): void {
    this.clearAllEntities();
    this.resetManagers();
    this.initializeGameplay();
  }
}
```

### Step 5: Refactor Game.ts as Orchestrator

```typescript
// src/core/Game.ts (~200 lines)
export class Game {
  private app: Application;
  private world: GameWorld;
  private gameLoop: GameLoop;
  private initializer: GameInitializer;
  private gameplayController: GameplayController;
  private turretSelection: TurretSelectionManager;
  private screenEffects: ScreenEffectsManager;
  private gameState: GameState;

  constructor(containerId: string) {
    this.initializer = new GameInitializer();
    // Minimal constructor
  }

  async init(): Promise<void> {
    const container = document.getElementById(containerId);
    this.app = await this.initializer.initializePixi(container);
    this.world = createGameWorld();
    
    const systems = this.initializer.initializeSystems(this.app, this.world);
    const managers = this.initializer.initializeManagers();
    
    this.gameLoop = new GameLoop(this.app);
    this.gameplayController = new GameplayController(this.world, systems, managers);
    this.turretSelection = new TurretSelectionManager(/* deps */);
    this.screenEffects = new ScreenEffectsManager(this.app);
    
    this.initializer.initializeUI(this.app, this);
    this.setupEventHandlers();
  }

  start(): void {
    this.gameLoop.start(this.update.bind(this));
    this.gameplayController.initializeGameplay();
  }

  private update(deltaTime: number): void {
    if (!this.gameState.isPlaying()) return;
    
    this.gameplayController.update(deltaTime);
    this.screenEffects.update(deltaTime);
    this.renderSystems(deltaTime);
    
    if (this.gameplayController.checkGameOver()) {
      this.triggerGameOver();
    }
  }

  // Public API methods remain here
  pause(): void { /* delegate */ }
  resume(): void { /* delegate */ }
  restart(): void { /* delegate */ }
}
```

---

## Validation Criteria

1. **Game.ts < 300 lines** after refactoring
2. **All existing tests pass** without modification
3. **No new public API changes** - external interface unchanged
4. **Each new class is independently testable**
5. **No circular dependencies** between new modules

---

## Testing Strategy

1. Create unit tests for each new manager class
2. Verify existing integration tests still pass
3. Manual playtest: start game, place turrets, survive waves, game over, restart

---

## Rollback Plan

If issues arise:
1. All changes are in new files initially
2. Game.ts modifications are incremental
3. Git commits at each step allow easy revert

---

## Files to Create

- `src/core/GameLoop.ts`
- `src/core/GameInitializer.ts`
- `src/core/GameplayController.ts`
- `src/core/TurretSelectionManager.ts`
- `src/core/ScreenEffectsManager.ts`

## Files to Modify

- `src/core/Game.ts` - Major refactor
- `src/core/index.ts` - Update exports
