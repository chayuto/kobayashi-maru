/**
 * Game Turret Controller for Kobayashi Maru
 * 
 * Handles turret selection, upgrade panel display, and canvas click detection
 * for turret interactions. Extracted from Game.ts to reduce coupling.
 * 
 * @module core/GameTurretController
 */
import { Application } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Turret } from '../ecs/components';
import { GAME_CONFIG } from '../types/constants';
import type { GameWorld } from '../ecs/world';
import type { HUDManager } from '../ui/HUDManager';
import type { UpgradeManager } from '../game/UpgradeManager';
import type { ResourceManager } from '../game/resourceManager';
import type { PlacementManager } from '../game/PlacementManager';

// Query for all turrets
const turretQuery = defineQuery([Position, Turret]);

// Click detection radius for selecting turrets (in pixels)
const TURRET_CLICK_RADIUS = 32;

/**
 * Configuration options for GameTurretController
 */
export interface TurretControllerConfig {
    world: GameWorld;
    app: Application;
    hudManager: HUDManager;
    upgradeManager: UpgradeManager;
    resourceManager: ResourceManager;
    placementManager: PlacementManager | null;
}

/**
 * GameTurretController handles all turret selection and upgrade panel logic.
 * 
 * @example
 * ```typescript
 * const turretController = new GameTurretController({
 *   world, app, hudManager, upgradeManager, resourceManager, placementManager
 * });
 * turretController.init();
 * 
 * // Later: cleanup
 * turretController.destroy();
 * ```
 */
export class GameTurretController {
    private world: GameWorld;
    private app: Application;
    private hudManager: HUDManager;
    private upgradeManager: UpgradeManager;
    private resourceManager: ResourceManager;
    private placementManager: PlacementManager | null;
    private selectedTurretId: number = -1;
    private boundHandleCanvasClick: (e: PointerEvent) => void;

    constructor(config: TurretControllerConfig) {
        this.world = config.world;
        this.app = config.app;
        this.hudManager = config.hudManager;
        this.upgradeManager = config.upgradeManager;
        this.resourceManager = config.resourceManager;
        this.placementManager = config.placementManager;

        // Bind handler
        this.boundHandleCanvasClick = this.handleCanvasClick.bind(this);
    }

    /**
     * Initialize the turret controller and attach event listeners.
     */
    init(): void {
        this.app.canvas.addEventListener('pointerdown', this.boundHandleCanvasClick);
    }

    /**
     * Handle canvas click to select turrets for upgrade.
     */
    private handleCanvasClick(event: PointerEvent): void {
        // Don't handle clicks if in placement mode
        if (this.placementManager?.isPlacing()) {
            return;
        }

        // Get click position in world coordinates
        const rect = this.app.canvas.getBoundingClientRect();
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
     * @returns Entity ID of turret at position, or -1 if none found
     */
    findTurretAtPosition(x: number, y: number): number {
        const turretEntities = turretQuery(this.world);

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
     * @param turretId - Entity ID of the turret to select
     */
    selectTurret(turretId: number): void {
        this.selectedTurretId = turretId;
        this.showTurretUpgradePanel(turretId);
    }

    /**
     * Deselect the current turret and hide the upgrade panel.
     */
    deselectTurret(): void {
        this.selectedTurretId = -1;
        const upgradePanel = this.hudManager?.getTurretUpgradePanel();
        if (upgradePanel) {
            upgradePanel.hide();
        }
    }

    /**
     * Show the turret upgrade panel for a specific turret.
     * @param turretId - Entity ID of the turret
     */
    showTurretUpgradePanel(turretId: number): void {
        const upgradePanel = this.hudManager?.getTurretUpgradePanel();
        if (!upgradePanel) return;

        const turretInfo = this.upgradeManager.getTurretInfo(turretId);
        if (!turretInfo) return;

        const currentResources = this.resourceManager.getResources();
        const refundAmount = this.upgradeManager.getSellRefund(turretId);

        upgradePanel.show(turretInfo, currentResources, refundAmount);
    }

    /**
     * Get the currently selected turret ID.
     * @returns Entity ID of selected turret, or -1 if none selected
     */
    getSelectedTurretId(): number {
        return this.selectedTurretId;
    }

    /**
     * Set the placement manager reference (can be set after construction)
     */
    setPlacementManager(placementManager: PlacementManager): void {
        this.placementManager = placementManager;
    }

    /**
     * Clean up resources and remove event listeners.
     */
    destroy(): void {
        this.app.canvas.removeEventListener('pointerdown', this.boundHandleCanvasClick);
        this.selectedTurretId = -1;
    }
}
