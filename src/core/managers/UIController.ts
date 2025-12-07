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
import type { ScoreData } from '../../game/scoreManager';
import type { WaveState } from '../../game/waveManager';

/**
 * UI action callbacks
 */
export interface UICallbacks {
    onRestart?: () => void;
    onResume?: () => void;
    onQuit?: () => void;
    onTurretSelect?: (turretType: number) => void;
    onTurretUpgrade?: (turretId: number, upgradePath: number) => void;
    onTurretSell?: (turretId: number) => void;
}

/**
 * Extended HUD data including combat stats
 */
export interface HUDData {
    // From GameplaySnapshot
    waveNumber: number;
    waveState: WaveState;
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
        // Cast gameRef to any as GameInterface is local to HUDManager
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hudManager.init(this.app, this.gameRef as any);

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
            // Cast string to WaveState if needed, but GameplaySnapshot defines it as string in plan
            // Wait, GameplaySnapshot in GameplayManager defines waveState as string.
            // But WaveManager.getState() returns WaveState.
            // So GameplaySnapshot should have been WaveState, but it was string in the plan.
            // Let's cast it here.
            waveState: snapshot.activeEnemies > 0 ? 'active' : 'idle', // Approximate or cast
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

        // Fix waveState
        hudData.waveState = snapshot.waveState as WaveState;

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
    showGameOver(score: ScoreData, isHighScore: boolean, previousBest: number): void {
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
        onUpgrade: (upgradePath: number) => void,
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
