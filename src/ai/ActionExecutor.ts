/**
 * Action Executor for AI Auto-Play
 *
 * Executes AI actions using the SAME game APIs as player input.
 * This ensures AI follows all game rules (no cheating).
 *
 * @module ai/ActionExecutor
 */

import type { PlacementManager, PlacementResult } from '../game/PlacementManager';
import type { UpgradeManager, UpgradeResult } from '../game/UpgradeManager';
import type { ResourceManager } from '../game/resourceManager';
import type { AIAction, PlacementParams, UpgradeParams, SellParams, ExecutionResult } from './types';
import { AIActionType } from './types';

/**
 * Executes AI actions using game manager APIs.
 * All actions go through the same validation as player actions.
 */
export class ActionExecutor {
    private placementManager: PlacementManager;
    private upgradeManager: UpgradeManager;
    private resourceManager: ResourceManager;

    constructor(
        placementManager: PlacementManager,
        upgradeManager: UpgradeManager,
        resourceManager: ResourceManager
    ) {
        this.placementManager = placementManager;
        this.upgradeManager = upgradeManager;
        this.resourceManager = resourceManager;
    }

    /**
     * Execute an AI action using game manager APIs.
     * This ensures AI follows all game rules.
     */
    execute(action: AIAction): ExecutionResult {
        // Double-check we can afford this (managers will also check)
        if (!this.resourceManager.canAfford(action.cost)) {
            return { success: false, reason: 'Insufficient resources' };
        }

        switch (action.type) {
            case AIActionType.PLACE_TURRET:
                return this.executePlacement(action.params as PlacementParams);
            case AIActionType.UPGRADE_TURRET:
                return this.executeUpgrade(action.params as UpgradeParams);
            case AIActionType.SELL_TURRET:
                return this.executeSell(action.params as SellParams);
            default:
                return { success: false, reason: 'Unknown action type' };
        }
    }

    /**
     * Execute turret placement via PlacementManager.
     * PlacementManager validates: position bounds, spacing, resource cost.
     */
    private executePlacement(params: PlacementParams): ExecutionResult {
        // Start placement mode
        this.placementManager.startPlacing(params.turretType);

        // Attempt to place at specified position
        const result: PlacementResult = this.placementManager.placeTurret(params.x, params.y);

        if (result.success) {
            return {
                success: true,
                entityId: result.entityId,
            };
        } else {
            // Cancel placement mode if it failed
            this.placementManager.cancelPlacement();
            return {
                success: false,
                reason: result.reason ?? 'Placement failed',
            };
        }
    }

    /**
     * Execute turret upgrade via UpgradeManager.
     * UpgradeManager validates: turret exists, not at max level, resource cost.
     */
    private executeUpgrade(params: UpgradeParams): ExecutionResult {
        const result: UpgradeResult = this.upgradeManager.applyUpgrade(
            params.turretId,
            params.upgradePath
        );

        return {
            success: result.success,
            reason: result.reason,
            entityId: result.success ? params.turretId : undefined,
        };
    }

    /**
     * Execute turret sell via UpgradeManager.
     * UpgradeManager applies the same 75% refund as player sells.
     */
    private executeSell(params: SellParams): ExecutionResult {
        const refund = this.upgradeManager.sellTurret(params.turretId);

        if (refund > 0) {
            return {
                success: true,
                entityId: params.turretId,
            };
        } else {
            return {
                success: false,
                reason: 'Sell failed - invalid turret',
            };
        }
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
