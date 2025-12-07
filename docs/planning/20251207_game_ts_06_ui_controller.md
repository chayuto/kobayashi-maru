# Task 06: UI Controller Extraction

**Date:** 2025-12-07  
**Priority:** P1 (Manager)  
**Estimated Effort:** 2 hours  
**Dependencies:** Task 01 (Service Container), Task 05 (Gameplay Manager)

---

## Problem Statement

UI logic is scattered throughout Game.ts:

```typescript
// HUD updates in update() - 50+ lines
if (this.hudManager) {
  this.hudManager.update({
    waveNumber: this.waveManager.getCurrentWave(),
    waveState: this.waveManager.getState(),
    activeEnemies: this.waveManager.getActiveEnemyCount(),
    resources: this.resourceManager.getResources(),
    timeSurvived: this.scoreManager.getTimeSurvived(),
    // ... 15+ more properties
  });
}

// Debug overlay updates - 20+ lines
if (this.debugManager) {
  this.debugManager.update(this.app.ticker.deltaMS);
  this.debugManager.updateEntityCount(getEntityCount());
  this.debugManager.updateGameStats({ ... });
  this.debugManager.updatePerformanceStats(this.performanceMonitor.getMetrics());
}

// Game over screen setup in init()
this.gameOverScreen = new GameOverScreen();
this.gameOverScreen.init(this.app);
this.gameOverScreen.setOnRestart(() => this.restart());

// Pause overlay setup in init()
this.pauseOverlay = new PauseOverlay();
this.pauseOverlay.init(this.app);
this.pauseOverlay.setOnResume(() => this.resume());
this.pauseOverlay.setOnRestart(() => { this.resume(); this.restart(); });
```

Issues:
- UI data gathering mixed with game logic
- Overlay callbacks create tight coupling
- Hard to add new UI elements
- Debug overlay logic duplicated

---

## Solution: UIController Class

Create a dedicated UI controller that:
- Owns all UI components
- Provides clean data binding from GameplayManager
- Handles overlay show/hide logic
- Separates UI concerns from game logic

---

## Implementation

### File: `src/core/managers/UIController.ts`

```typescript
/**
 * UI Controller for Kobayashi Maru
 * 
 * Manages all UI components: HUD, overlays, and debug displays.
 * Provides clean data binding from gameplay state.
 * 
 * @module core/managers/UIController
 */

import { Application } from 'pixi.js';
import { getServices } from '../services';
import { getEntityCount } from '../../ecs';
import type { GameplaySnapshot } from './GameplayManager';
import type { CombatSystem } from '../../systems/combatSystem';

/**
 * UI action callbacks
 */
export interface UICallbacks {
  onRestart?: () => void;
  onResume?: () => void;
  onQuit?: () => void;
  onTurretSelect?: (turretType: string) => void;
  onTurretUpgrade?: (turretId: number, upgradePath: string) => void;
  onTurretSell?: (turretId: number) => void;
}

/**
 * Extended HUD data including combat stats
 */
export interface HUDData {
  // From GameplaySnapshot
  waveNumber: number;
  waveState: string;
  activeEnemies: number;
  resources: number;
  timeSurvived: number;
  enemiesDefeated: number;
  kobayashiMaruHealth: number;
  kobayashiMaruMaxHealth: number;
  kobayashiMaruShield: number;
  kobayashiMaruMaxShield: number;
  turretCount: number;
  
  // Combat stats
  totalDamageDealt: number;
  totalShotsFired: number;
  accuracy: number;
  dps: number;
}

/**
 * Manages all UI components.
 */
export class UIController {
  private app: Application;
  private callbacks: UICallbacks = {};
  private initialized: boolean = false;
  
  // Reference to game for HUD init (temporary - will be removed in final refactor)
  private gameRef: unknown = null;
  
  constructor(app: Application) {
    this.app = app;
  }
  
  /**
   * Set UI action callbacks.
   */
  setCallbacks(callbacks: UICallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
  
  /**
   * Set game reference for HUD initialization.
   * This is a temporary bridge until HUD is fully decoupled.
   */
  setGameRef(game: unknown): void {
    this.gameRef = game;
  }
  
  /**
   * Initialize all UI components.
   */
  init(): void {
    if (this.initialized) return;
    
    const services = getServices();
    
    // Initialize HUD
    const hudManager = services.get('hudManager');
    hudManager.init(this.app, this.gameRef);
    
    // Connect turret menu
    const turretMenu = hudManager.getTurretMenu();
    if (turretMenu) {
      turretMenu.onSelect((turretType) => {
        this.callbacks.onTurretSelect?.(turretType);
      });
    }
    
    // Initialize game over screen
    const gameOverScreen = services.get('gameOverScreen');
    gameOverScreen.setOnRestart(() => {
      this.callbacks.onRestart?.();
    });
    
    // Initialize pause overlay
    const pauseOverlay = services.get('pauseOverlay');
    pauseOverlay.setOnResume(() => {
      this.callbacks.onResume?.();
    });
    pauseOverlay.setOnRestart(() => {
      this.callbacks.onResume?.();
      this.callbacks.onRestart?.();
    });
    pauseOverlay.setOnQuit(() => {
      this.callbacks.onResume?.();
      this.callbacks.onQuit?.();
    });
    
    this.initialized = true;
  }
  
  // ==========================================================================
  // HUD UPDATES
  // ==========================================================================
  
  /**
   * Update HUD with gameplay data.
   * 
   * @param snapshot - Current gameplay state
   * @param combatSystem - Combat system for stats (optional)
   * @param turretCount - Number of active turrets
   */
  updateHUD(
    snapshot: GameplaySnapshot,
    combatSystem?: CombatSystem | null,
    turretCount: number = 0
  ): void {
    const services = getServices();
    const hudManager = services.get('hudManager');
    
    // Get combat stats
    const combatStats = combatSystem?.getStats();
    
    const hudData: HUDData = {
      waveNumber: snapshot.waveNumber,
      waveState: snapshot.waveState,
      activeEnemies: snapshot.activeEnemies,
      resources: snapshot.resources,
      timeSurvived: snapshot.timeSurvived,
      enemiesDefeated: snapshot.enemiesDefeated,
      kobayashiMaruHealth: snapshot.kmHealth,
      kobayashiMaruMaxHealth: snapshot.kmMaxHealth,
      kobayashiMaruShield: snapshot.kmShield,
      kobayashiMaruMaxShield: snapshot.kmMaxShield,
      turretCount,
      totalDamageDealt: combatStats?.totalDamageDealt ?? 0,
      totalShotsFired: combatStats?.totalShotsFired ?? 0,
      accuracy: combatStats?.accuracy ?? 0,
      dps: combatStats?.dps ?? 0,
    };
    
    hudManager.update(hudData);
  }
  
  /**
   * Add a message to the HUD log.
   */
  addLogMessage(message: string, type: 'kill' | 'wave' | 'warning' | 'info' = 'info'): void {
    getServices().get('hudManager').addLogMessage(message, type);
  }
  
  // ==========================================================================
  // DEBUG OVERLAY
  // ==========================================================================
  
  /**
   * Update debug overlay.
   * 
   * @param deltaMS - Delta time in milliseconds
   * @param snapshot - Current gameplay state
   */
  updateDebug(deltaMS: number, snapshot: GameplaySnapshot): void {
    const services = getServices();
    const debugManager = services.get('debugManager');
    const perfMon = services.get('performanceMonitor');
    
    debugManager.update(deltaMS);
    debugManager.updateEntityCount(getEntityCount());
    
    debugManager.updateGameStats({
      gameState: snapshot.state,
      waveNumber: snapshot.waveNumber,
      waveState: snapshot.waveState,
      timeSurvived: snapshot.timeSurvived,
      enemiesDefeated: snapshot.enemiesDefeated,
      activeEnemies: snapshot.activeEnemies,
      resources: snapshot.resources,
    });
    
    debugManager.updatePerformanceStats(perfMon.getMetrics());
  }
  
  /**
   * Update performance monitor entity count.
   */
  updateEntityCount(): void {
    getServices().get('performanceMonitor').setEntityCount(getEntityCount());
  }
  
  // ==========================================================================
  // OVERLAYS
  // ==========================================================================
  
  /**
   * Show game over screen.
   * 
   * @param score - Final score data
   * @param isHighScore - Whether this is a new high score
   * @param previousBest - Previous best score for comparison
   */
  showGameOver(score: unknown, isHighScore: boolean, previousBest: number): void {
    getServices().get('gameOverScreen').show(score, isHighScore, previousBest);
  }
  
  /**
   * Hide game over screen.
   */
  hideGameOver(): void {
    getServices().get('gameOverScreen').hide();
  }
  
  /**
   * Show pause overlay.
   */
  showPause(): void {
    getServices().get('pauseOverlay').show();
  }
  
  /**
   * Hide pause overlay.
   */
  hidePause(): void {
    getServices().get('pauseOverlay').hide();
  }
  
  // ==========================================================================
  // TURRET UPGRADE PANEL
  // ==========================================================================
  
  /**
   * Show turret upgrade panel for a specific turret.
   * 
   * @param turretId - Entity ID of the turret
   */
  showTurretUpgradePanel(turretId: number): void {
    const services = getServices();
    const upgradeManager = services.get('upgradeManager');
    const resourceManager = services.get('resourceManager');
    const hudManager = services.get('hudManager');
    
    const upgradePanel = hudManager.getTurretUpgradePanel();
    if (!upgradePanel) return;
    
    const turretInfo = upgradeManager.getTurretInfo(turretId);
    if (!turretInfo) return;
    
    const currentResources = resourceManager.getResources();
    const refundAmount = upgradeManager.getSellRefund(turretId);
    
    upgradePanel.show(turretInfo, currentResources, refundAmount);
  }
  
  /**
   * Hide turret upgrade panel.
   */
  hideTurretUpgradePanel(): void {
    const hudManager = getServices().get('hudManager');
    const upgradePanel = hudManager.getTurretUpgradePanel();
    upgradePanel?.hide();
  }
  
  /**
   * Connect turret upgrade panel callbacks.
   * 
   * @param onUpgrade - Called when upgrade button clicked
   * @param onSell - Called when sell button clicked
   */
  connectTurretUpgradeCallbacks(
    onUpgrade: (upgradePath: string) => void,
    onSell: () => void
  ): void {
    const hudManager = getServices().get('hudManager');
    const upgradePanel = hudManager.getTurretUpgradePanel();
    
    if (upgradePanel) {
      upgradePanel.onUpgrade(onUpgrade);
      upgradePanel.onSell(onSell);
    }
  }
  
  // ==========================================================================
  // CLEANUP
  // ==========================================================================
  
  /**
   * Clean up resources.
   */
  destroy(): void {
    this.callbacks = {};
    this.gameRef = null;
    this.initialized = false;
  }
}
```

---

### Update `src/core/managers/index.ts`

```typescript
export { RenderManager, RenderLayer } from './RenderManager';
export type { RenderStats } from './RenderManager';

export { GameplayManager } from './GameplayManager';
export type { GameplaySnapshot, GameplayCallbacks } from './GameplayManager';

export { UIController } from './UIController';
export type { UICallbacks, HUDData } from './UIController';
```

---

## Integration Example

```typescript
// In Game.ts
import { UIController } from './managers';

class Game {
  private uiController: UIController;
  private gameplayManager: GameplayManager;
  
  async init(): Promise<void> {
    // ... bootstrap
    
    this.uiController = new UIController(this.app);
    this.uiController.setGameRef(this); // Temporary bridge
    
    this.uiController.setCallbacks({
      onRestart: () => this.restart(),
      onResume: () => this.resume(),
      onQuit: () => console.log('Quit not implemented'),
      onTurretSelect: (type) => {
        services.get('placementManager').startPlacing(type);
      },
    });
    
    this.uiController.init();
    
    // Connect gameplay callbacks to UI
    this.gameplayManager.setCallbacks({
      onGameOver: (score, isHighScore) => {
        this.uiController.showGameOver(score, isHighScore, 0);
      },
      onWaveStart: (waveNumber, enemyCount) => {
        this.uiController.addLogMessage(`⚠ Wave ${waveNumber} started!`, 'wave');
        if (enemyCount > 0) {
          this.uiController.addLogMessage(`${enemyCount} enemies incoming`, 'warning');
        }
      },
      onWaveComplete: (waveNumber) => {
        this.uiController.addLogMessage(`✓ Wave ${waveNumber} complete!`, 'wave');
      },
      onEnemyKilled: (reward) => {
        this.uiController.addLogMessage(`Enemy destroyed (+${reward} matter)`, 'kill');
      },
    });
  }
  
  private setupUpdateCallbacks(): void {
    // UI updates (always runs)
    this.loopManager.onUI((dt) => {
      const snapshot = this.gameplayManager.getSnapshot();
      const turretCount = turretQuery(this.world).length;
      
      this.uiController.updateHUD(snapshot, this.combatSystem, turretCount);
      this.uiController.updateDebug(this.app.ticker.deltaMS, snapshot);
      this.uiController.updateEntityCount();
    });
  }
  
  pause(): void {
    this.gameplayManager.pause();
    this.loopManager.pause();
    this.uiController.showPause();
  }
  
  resume(): void {
    this.gameplayManager.resume();
    this.loopManager.resume();
    this.uiController.hidePause();
  }
  
  restart(): void {
    this.uiController.hideGameOver();
    this.gameplayManager.restart();
  }
}
```

---

## Verification Checklist

- [ ] UIController compiles without errors
- [ ] HUD updates correctly with gameplay data
- [ ] Debug overlay shows correct stats
- [ ] Game over screen shows/hides correctly
- [ ] Pause overlay shows/hides correctly
- [ ] Turret menu callbacks work
- [ ] Turret upgrade panel shows correct info

---

## AI Agent Instructions

When implementing this task:

1. Add `UIController.ts` to `src/core/managers/`
2. Update `index.ts` barrel export
3. Run `npm run typecheck` to verify no type errors
4. Do NOT modify Game.ts yet - that comes in Task 08

---

## Next Task

After this task is complete, proceed to:
- **Task 07: Input Router** - Consolidates keyboard and touch input handling
