/**
 * Game Input Handler for Kobayashi Maru
 * Handles keyboard and pointer input for the game.
 * Extracted from Game.ts for better modularity.
 */
import { defineQuery } from 'bitecs';
import { Turret, Position } from '../ecs/components';
import { GAME_CONFIG } from '../types';
import { GameWorld } from '../ecs';
import type { GameState } from '../game';
import type { PlacementManager, UpgradeManager } from '../game';
import type { HUDManager } from '../ui';

// Query for turret entities
const turretQuery = defineQuery([Turret]);

// Click detection radius for selecting turrets (in pixels)
const TURRET_CLICK_RADIUS = 32;

/**
 * Interface for Game methods that GameInputHandler needs access to.
 * This avoids circular dependency issues.
 */
export interface GameInputContext {
    world: GameWorld;
    gameState: GameState;
    placementManager: PlacementManager | null;
    upgradeManager: UpgradeManager;
    hudManager: HUDManager | null;
    resourceManager: { getResources(): number };
    canvas: HTMLCanvasElement;
    pause(): void;
    resume(): void;
    restart(): void;
}

/**
 * Handles all user input for the game.
 * Manages keyboard shortcuts and turret selection via pointer events.
 */
export class GameInputHandler {
    private context: GameInputContext;
    private selectedTurretId: number = -1;

    // Bound event handlers for cleanup
    private boundHandleKeyDown: (e: KeyboardEvent) => void;
    private boundHandleCanvasClick: (e: PointerEvent) => void;

    constructor(context: GameInputContext) {
        this.context = context;
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleCanvasClick = this.handleCanvasClick.bind(this);
    }

    /**
     * Initialize input handlers by attaching event listeners.
     */
    init(): void {
        window.addEventListener('keydown', this.boundHandleKeyDown);
        this.context.canvas.addEventListener('pointerdown', this.boundHandleCanvasClick);
    }

    /**
     * Clean up event listeners.
     */
    destroy(): void {
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        this.context.canvas.removeEventListener('pointerdown', this.boundHandleCanvasClick);
    }

    /**
     * Get the currently selected turret ID.
     * @returns The selected turret entity ID, or -1 if none selected
     */
    getSelectedTurretId(): number {
        return this.selectedTurretId;
    }

    /**
     * Reset the turret selection (e.g., after selling a turret).
     */
    resetSelection(): void {
        this.selectedTurretId = -1;
    }

    /**
     * Handle keyboard input for pause and other shortcuts.
     */
    private handleKeyDown(e: KeyboardEvent): void {
        const { gameState } = this.context;

        // ESC key - Toggle pause
        if (e.key === 'Escape') {
            if (gameState.isPlaying()) {
                this.context.pause();
            } else if (gameState.isPaused()) {
                this.context.resume();
            }
        }

        // R key - Restart (when paused)
        if (e.key === 'r' || e.key === 'R') {
            if (gameState.isPaused()) {
                this.context.resume();
                this.context.restart();
            }
        }

        // Q key - Quit (when paused)
        if (e.key === 'q' || e.key === 'Q') {
            if (gameState.isPaused()) {
                this.context.resume();
                // TODO: Return to main menu when implemented
                console.log('Quit to main menu (not yet implemented)');
            }
        }
    }

    /**
     * Handle canvas click to select turrets for upgrade.
     */
    private handleCanvasClick(event: PointerEvent): void {
        const { placementManager, canvas } = this.context;

        // Don't handle clicks if in placement mode
        if (placementManager?.isPlacing()) {
            return;
        }

        // Get click position in world coordinates
        const rect = canvas.getBoundingClientRect();
        const scaleX = GAME_CONFIG.WORLD_WIDTH / rect.width;
        const scaleY = GAME_CONFIG.WORLD_HEIGHT / rect.height;
        const worldX = (event.clientX - rect.left) * scaleX;
        const worldY = (event.clientY - rect.top) * scaleY;

        // Find turret at click position
        const clickedTurretId = this.findTurretAtPosition(worldX, worldY);

        if (clickedTurretId !== -1) {
            this.selectTurret(clickedTurretId);
        } else {
            // Clicked on empty space - deselect turret
            this.deselectTurret();
        }
    }

    /**
     * Find a turret at the given position.
     * @param x - World X coordinate
     * @param y - World Y coordinate
     * @returns The turret entity ID, or -1 if none found
     */
    private findTurretAtPosition(x: number, y: number): number {
        const turretEntities = turretQuery(this.context.world);

        for (const eid of turretEntities) {
            const turretX = Position.x[eid];
            const turretY = Position.y[eid];
            const dx = turretX - x;
            const dy = turretY - y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= TURRET_CLICK_RADIUS * TURRET_CLICK_RADIUS) {
                return eid;
            }
        }

        return -1;
    }

    /**
     * Select a turret and show the upgrade panel.
     */
    private selectTurret(turretId: number): void {
        this.selectedTurretId = turretId;
        this.showTurretUpgradePanel(turretId);
    }

    /**
     * Deselect the current turret and hide the upgrade panel.
     */
    private deselectTurret(): void {
        this.selectedTurretId = -1;
        const upgradePanel = this.context.hudManager?.getTurretUpgradePanel();
        if (upgradePanel) {
            upgradePanel.hide();
        }
    }

    /**
     * Show the turret upgrade panel for a specific turret.
     */
    private showTurretUpgradePanel(turretId: number): void {
        const { hudManager, upgradeManager, resourceManager } = this.context;
        const upgradePanel = hudManager?.getTurretUpgradePanel();
        if (!upgradePanel) return;

        const turretInfo = upgradeManager.getTurretInfo(turretId);
        if (!turretInfo) return;

        const currentResources = resourceManager.getResources();
        const refundAmount = upgradeManager.getSellRefund(turretId);

        upgradePanel.show(turretInfo, currentResources, refundAmount);
    }

    /**
     * Manually show upgrade panel (called externally when needed).
     */
    showUpgradePanelForTurret(turretId: number): void {
        this.selectedTurretId = turretId;
        this.showTurretUpgradePanel(turretId);
    }
}
