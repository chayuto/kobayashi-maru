/**
 * Tests for ActionExecutor
 *
 * @module __tests__/ActionExecutor.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionExecutor } from '../ai/ActionExecutor';
import { AIActionType, AIAction, PlacementParams, UpgradeParams, SellParams } from '../ai/types';

// Mock types for managers
interface MockPlacementManager {
    startPlacing: ReturnType<typeof vi.fn>;
    placeTurret: ReturnType<typeof vi.fn>;
    cancelPlacement: ReturnType<typeof vi.fn>;
    validatePosition: ReturnType<typeof vi.fn>;
}

interface MockUpgradeManager {
    applyUpgrade: ReturnType<typeof vi.fn>;
    sellTurret: ReturnType<typeof vi.fn>;
    canUpgrade: ReturnType<typeof vi.fn>;
}

interface MockResourceManager {
    canAfford: ReturnType<typeof vi.fn>;
}

function createMockPlacementManager(): MockPlacementManager {
    return {
        startPlacing: vi.fn(),
        placeTurret: vi.fn().mockReturnValue({ success: true, entityId: 123 }),
        cancelPlacement: vi.fn(),
        validatePosition: vi.fn().mockReturnValue(true),
    };
}

function createMockUpgradeManager(): MockUpgradeManager {
    return {
        applyUpgrade: vi.fn().mockReturnValue({ success: true }),
        sellTurret: vi.fn().mockReturnValue(75),
        canUpgrade: vi.fn().mockReturnValue(true),
    };
}

function createMockResourceManager(): MockResourceManager {
    return {
        canAfford: vi.fn().mockReturnValue(true),
    };
}

describe('ActionExecutor', () => {
    let executor: ActionExecutor;
    let placementManager: MockPlacementManager;
    let upgradeManager: MockUpgradeManager;
    let resourceManager: MockResourceManager;

    beforeEach(() => {
        placementManager = createMockPlacementManager();
        upgradeManager = createMockUpgradeManager();
        resourceManager = createMockResourceManager();

        executor = new ActionExecutor(
            placementManager as unknown as Parameters<typeof ActionExecutor['prototype']['constructor']>[0],
            upgradeManager as unknown as Parameters<typeof ActionExecutor['prototype']['constructor']>[1],
            resourceManager as unknown as Parameters<typeof ActionExecutor['prototype']['constructor']>[2]
        );
    });

    describe('execute', () => {
        it('should reject action if resources are insufficient', () => {
            resourceManager.canAfford.mockReturnValue(false);

            const action: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: { x: 400, y: 400, turretType: 0 },
            };

            const result = executor.execute(action);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Insufficient resources');
        });

        it('should execute turret placement successfully', () => {
            const action: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: { x: 400, y: 400, turretType: 0 } as PlacementParams,
            };

            const result = executor.execute(action);

            expect(placementManager.startPlacing).toHaveBeenCalledWith(0);
            expect(placementManager.placeTurret).toHaveBeenCalledWith(400, 400);
            expect(result.success).toBe(true);
            expect(result.entityId).toBe(123);
        });

        it('should cancel placement on failure', () => {
            placementManager.placeTurret.mockReturnValue({ success: false, reason: 'Invalid position' });

            const action: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: { x: 400, y: 400, turretType: 0 } as PlacementParams,
            };

            const result = executor.execute(action);

            expect(placementManager.cancelPlacement).toHaveBeenCalled();
            expect(result.success).toBe(false);
            expect(result.reason).toBe('Invalid position');
        });

        it('should execute turret upgrade successfully', () => {
            const action: AIAction = {
                type: AIActionType.UPGRADE_TURRET,
                priority: 50,
                cost: 50,
                expectedValue: 100,
                params: { turretId: 10, upgradePath: 1 } as UpgradeParams,
            };

            const result = executor.execute(action);

            expect(upgradeManager.applyUpgrade).toHaveBeenCalledWith(10, 1);
            expect(result.success).toBe(true);
        });

        it('should execute turret sell successfully', () => {
            const action: AIAction = {
                type: AIActionType.SELL_TURRET,
                priority: 50,
                cost: 0,
                expectedValue: 75,
                params: { turretId: 10 } as SellParams,
            };

            const result = executor.execute(action);

            expect(upgradeManager.sellTurret).toHaveBeenCalledWith(10);
            expect(result.success).toBe(true);
            expect(result.entityId).toBe(10);
        });

        it('should fail sell if refund is 0', () => {
            upgradeManager.sellTurret.mockReturnValue(0);

            const action: AIAction = {
                type: AIActionType.SELL_TURRET,
                priority: 50,
                cost: 0,
                expectedValue: 75,
                params: { turretId: 999 } as SellParams,
            };

            const result = executor.execute(action);

            expect(result.success).toBe(false);
            expect(result.reason).toBe('Sell failed - invalid turret');
        });
    });

    describe('canExecute', () => {
        it('should return false if cannot afford', () => {
            resourceManager.canAfford.mockReturnValue(false);

            const action: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: { x: 400, y: 400, turretType: 0 } as PlacementParams,
            };

            expect(executor.canExecute(action)).toBe(false);
        });

        it('should validate placement position', () => {
            const action: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: { x: 400, y: 400, turretType: 0 } as PlacementParams,
            };

            expect(executor.canExecute(action)).toBe(true);
            expect(placementManager.validatePosition).toHaveBeenCalledWith(400, 400);
        });

        it('should return false for invalid placement position', () => {
            placementManager.validatePosition.mockReturnValue(false);

            const action: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: { x: -100, y: -100, turretType: 0 } as PlacementParams,
            };

            expect(executor.canExecute(action)).toBe(false);
        });

        it('should validate upgrade availability', () => {
            const action: AIAction = {
                type: AIActionType.UPGRADE_TURRET,
                priority: 50,
                cost: 50,
                expectedValue: 100,
                params: { turretId: 10, upgradePath: 1 } as UpgradeParams,
            };

            expect(executor.canExecute(action)).toBe(true);
            expect(upgradeManager.canUpgrade).toHaveBeenCalledWith(10, 1);
        });

        it('should return false for unavailable upgrade', () => {
            upgradeManager.canUpgrade.mockReturnValue(false);

            const action: AIAction = {
                type: AIActionType.UPGRADE_TURRET,
                priority: 50,
                cost: 50,
                expectedValue: 100,
                params: { turretId: 10, upgradePath: 1 } as UpgradeParams,
            };

            expect(executor.canExecute(action)).toBe(false);
        });

        it('should return true for sell actions (always valid if affordable)', () => {
            const action: AIAction = {
                type: AIActionType.SELL_TURRET,
                priority: 50,
                cost: 0,
                expectedValue: 75,
                params: { turretId: 10 } as SellParams,
            };

            expect(executor.canExecute(action)).toBe(true);
        });
    });
});
