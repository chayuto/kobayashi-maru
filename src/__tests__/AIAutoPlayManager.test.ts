
import { describe, it, expect, vi } from 'vitest';
import { AIAutoPlayManager } from '../ai/AIAutoPlayManager';
import { createGameWorld } from '../ecs/world';
import type { PlacementManager } from '../game/PlacementManager';
import type { UpgradeManager } from '../game/UpgradeManager';
import type { ResourceManager } from '../game/resourceManager';
import type { GameState } from '../game/gameState';

// Mock dependencies
const mockPlacementManager: Partial<PlacementManager> = {
    isPlacing: () => false,
    placeTurret: vi.fn(),
    startPlacing: vi.fn(),
    cancelPlacement: vi.fn(),
};

const mockUpgradeManager: Partial<UpgradeManager> = {
    applyUpgrade: vi.fn(),
    sellTurret: vi.fn(),
};

const mockResourceManager: Partial<ResourceManager> = {
    getResources: () => 1000,
};

const mockGameState: Partial<GameState> = {
    isPlaying: () => true,
    isPaused: () => false,
    isGameOver: () => false,
};

describe('AIAutoPlayManager', () => {
    it('should be enabled by default based on config', () => {
        const world = createGameWorld();
        const manager = new AIAutoPlayManager(
            world,
            mockPlacementManager as unknown as PlacementManager,
            mockUpgradeManager as unknown as UpgradeManager,
            mockResourceManager as unknown as ResourceManager,
            mockGameState as unknown as GameState,
            () => 0 // getKobayashiMaruId
        );

        expect(manager.isEnabled()).toBe(true);
    });

    it('should toggle enabled state', () => {
        const world = createGameWorld();
        const manager = new AIAutoPlayManager(
            world,
            mockPlacementManager as unknown as PlacementManager,
            mockUpgradeManager as unknown as UpgradeManager,
            mockResourceManager as unknown as ResourceManager,
            mockGameState as unknown as GameState,
            () => 0
        );

        // Starts enabled (true)
        expect(manager.isEnabled()).toBe(true);

        // Toggle to disabled (false)
        manager.toggle();
        expect(manager.isEnabled()).toBe(false);

        // Toggle back to enabled (true)
        manager.toggle();
        expect(manager.isEnabled()).toBe(true);
    });
});
