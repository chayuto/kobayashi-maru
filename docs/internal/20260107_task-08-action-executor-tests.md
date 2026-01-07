# Task 08: ActionExecutor Test Coverage

> **Priority**: P3 - Requires More Setup
> **Estimated Time**: 25-35 minutes
> **Lines to Cover**: ~120 lines

## Objective

Add unit tests for `ActionExecutor` class in `src/ai/ActionExecutor.ts`.

## Why This Is Worth It

- Executes AI decisions - critical for game behavior
- Mapping actions to game commands
- Validates action execution flow
- Relatively small file with clear logic

## Target File

`src/ai/ActionExecutor.ts`

## Methods to Test

### 1. `execute(action: AIAction)`
- Execute PLACE_TURRET action
- Execute UPGRADE_TURRET action
- Execute SELL_TURRET action

### 2. Result Handling
- Return success/failure status
- Handle invalid actions
- Handle resource constraints

## Implementation Instructions

1. Create new test file: `src/__tests__/ActionExecutor.test.ts`

2. Follow this structure:

```typescript
/**
 * Tests for ActionExecutor
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActionExecutor } from '../ai/ActionExecutor';
import { AIActionType, AIAction } from '../ai/types';
import { TurretType } from '../types/constants';

// Mock dependencies
const mockPlacementManager = {
    placeTurret: vi.fn(() => 1), // Returns entity ID
    canPlace: vi.fn(() => true),
    sellTurret: vi.fn(() => true)
};

const mockUpgradeManager = {
    upgradeTurret: vi.fn(() => true),
    canUpgrade: vi.fn(() => true)
};

const mockResourceManager = {
    getResources: vi.fn(() => 500),
    canAfford: vi.fn(() => true),
    spend: vi.fn(() => true),
    add: vi.fn()
};

describe('ActionExecutor', () => {
    let executor: ActionExecutor;

    beforeEach(() => {
        vi.clearAllMocks();
        executor = new ActionExecutor(
            mockPlacementManager as any,
            mockUpgradeManager as any,
            mockResourceManager as any
        );
    });

    describe('execute PLACE_TURRET', () => {
        const placeAction: AIAction = {
            type: AIActionType.PLACE_TURRET,
            priority: 50,
            cost: 100,
            expectedValue: 150,
            params: {
                x: 500,
                y: 500,
                turretType: TurretType.PHASER_ARRAY
            }
        };

        it('should call placeTurret with correct params', () => {
            executor.execute(placeAction);
            
            expect(mockPlacementManager.placeTurret).toHaveBeenCalledWith(
                500, 500, TurretType.PHASER_ARRAY
            );
        });

        it('should return success when placement succeeds', () => {
            mockPlacementManager.placeTurret.mockReturnValue(1);
            
            const result = executor.execute(placeAction);
            
            expect(result.success).toBe(true);
        });

        it('should return failure when placement fails', () => {
            mockPlacementManager.placeTurret.mockReturnValue(null);
            
            const result = executor.execute(placeAction);
            
            expect(result.success).toBe(false);
        });

        it('should not place when cannot afford', () => {
            mockResourceManager.canAfford.mockReturnValue(false);
            
            const result = executor.execute(placeAction);
            
            expect(result.success).toBe(false);
            expect(mockPlacementManager.placeTurret).not.toHaveBeenCalled();
        });
    });

    describe('execute UPGRADE_TURRET', () => {
        const upgradeAction: AIAction = {
            type: AIActionType.UPGRADE_TURRET,
            priority: 40,
            cost: 150,
            expectedValue: 200,
            params: {
                entityId: 1
            }
        };

        it('should call upgradeTurret with entity ID', () => {
            executor.execute(upgradeAction);
            
            expect(mockUpgradeManager.upgradeTurret).toHaveBeenCalledWith(1);
        });

        it('should return success when upgrade succeeds', () => {
            mockUpgradeManager.upgradeTurret.mockReturnValue(true);
            
            const result = executor.execute(upgradeAction);
            
            expect(result.success).toBe(true);
        });

        it('should return failure when cannot upgrade', () => {
            mockUpgradeManager.canUpgrade.mockReturnValue(false);
            
            const result = executor.execute(upgradeAction);
            
            expect(result.success).toBe(false);
        });
    });

    describe('execute SELL_TURRET', () => {
        const sellAction: AIAction = {
            type: AIActionType.SELL_TURRET,
            priority: 30,
            cost: 0,
            expectedValue: 50,
            params: {
                entityId: 1
            }
        };

        it('should call sellTurret with entity ID', () => {
            executor.execute(sellAction);
            
            expect(mockPlacementManager.sellTurret).toHaveBeenCalledWith(1);
        });

        it('should add resources when selling', () => {
            mockPlacementManager.sellTurret.mockReturnValue(50);
            
            executor.execute(sellAction);
            
            expect(mockResourceManager.add).toHaveBeenCalled();
        });
    });

    describe('invalid actions', () => {
        it('should handle unknown action type gracefully', () => {
            const invalidAction = {
                type: 'UNKNOWN_TYPE' as AIActionType,
                priority: 0,
                cost: 0,
                expectedValue: 0,
                params: {}
            };
            
            const result = executor.execute(invalidAction);
            
            expect(result.success).toBe(false);
        });

        it('should handle missing params gracefully', () => {
            const noParamsAction: AIAction = {
                type: AIActionType.PLACE_TURRET,
                priority: 50,
                cost: 100,
                expectedValue: 150,
                params: {} // Missing x, y, turretType
            };
            
            // Should not crash
            expect(() => executor.execute(noParamsAction)).not.toThrow();
        });
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/ActionExecutor.test.ts
```

Expected: All tests pass, covering action execution logic.

## Dependencies

- Vitest (already installed)
- Mocks for PlacementManager, UpgradeManager, ResourceManager

## Notes

- Simpler than ActionPlanner testing
- Focus on action-to-command mapping
- Error handling is important to test
