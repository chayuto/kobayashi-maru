
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIAutoPlayManager } from '../ai/AIAutoPlayManager';
import { createGameWorld } from '../ecs/world';

// Mock dependencies
const mockPlacementManager = {
    isPlacing: () => false,
    placeTurret: vi.fn(),
    startPlacing: vi.fn(),
    cancelPlacement: vi.fn(),
} as any;

const mockUpgradeManager = {
    applyUpgrade: vi.fn(),
    sellTurret: vi.fn(),
} as any;

const mockResourceManager = {
    getResource: () => 1000,
} as any;

const mockGameState = {
    isPlaying: () => true,
    isPaused: () => false,
    isGameOver: () => false,
} as any;

describe('AIAutoPlayManager', () => {
    it('should be enabled by default based on config', () => {
        const world = createGameWorld();
        const manager = new AIAutoPlayManager(
            world,
            mockPlacementManager,
            mockUpgradeManager,
            mockResourceManager,
            mockGameState,
            () => 0 // getKobayashiMaruId
        );

        expect(manager.isEnabled()).toBe(true);
    });

    it('should toggle enabled state', () => {
        const world = createGameWorld();
        const manager = new AIAutoPlayManager(
            world,
            mockPlacementManager,
            mockUpgradeManager,
            mockResourceManager,
            mockGameState,
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
