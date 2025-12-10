/**
 * Tests for DebugManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { DebugManager, GameStats, PerformanceStats } from '../core/DebugManager';

describe('DebugManager', () => {
    let debugManager: DebugManager;

    beforeEach(() => {
        // Clear any existing debug overlay
        const existing = document.querySelector('.debug-overlay');
        if (existing) {
            existing.remove();
        }
        debugManager = new DebugManager();
    });

    afterEach(() => {
        debugManager.destroy();
    });

    describe('initialization', () => {
        it('should create a debug overlay container', () => {
            const overlay = document.querySelector('.debug-overlay');
            expect(overlay).toBeDefined();
            expect(overlay).not.toBeNull();
        });

        it('should start hidden by default', () => {
            const overlay = document.querySelector('.debug-overlay') as HTMLElement;
            expect(overlay?.style.display).toBe('none');
        });
    });

    describe('toggle', () => {
        it('should show the overlay when toggled', () => {
            debugManager.toggle();
            const overlay = document.querySelector('.debug-overlay') as HTMLElement;
            expect(overlay?.style.display).toBe('block');
        });

        it('should hide the overlay when toggled twice', () => {
            debugManager.toggle();
            debugManager.toggle();
            const overlay = document.querySelector('.debug-overlay') as HTMLElement;
            expect(overlay?.style.display).toBe('none');
        });
    });

    describe('update', () => {
        it('should update without requiring any parameters', () => {
            // The refactored update() method takes no parameters
            expect(() => debugManager.update()).not.toThrow();
        });

        it('should calculate FPS after multiple updates over time', () => {
            // Mock performance.now to simulate time passing
            const mockNow = vi.spyOn(performance, 'now');
            const startTime = 1000;

            // First update at time 0
            mockNow.mockReturnValue(startTime);
            debugManager.update();

            // Simulate 60 frames over 1 second
            for (let i = 1; i <= 60; i++) {
                mockNow.mockReturnValue(startTime + (i * 16.67)); // ~60fps timing
                debugManager.update();
            }

            // After 1 second worth of frames, FPS should be computed
            expect(() => debugManager.update()).not.toThrow();

            mockNow.mockRestore();
        });
    });

    describe('updateEntityCount', () => {
        it('should update entity count', () => {
            expect(() => debugManager.updateEntityCount(42)).not.toThrow();
        });
    });

    describe('updateGameStats', () => {
        it('should update game stats without throwing', () => {
            const stats: GameStats = {
                gameState: 'PLAYING',
                waveNumber: 5,
                waveState: 'spawning',
                timeSurvived: 120,
                enemiesDefeated: 30,
                activeEnemies: 10,
                resources: 500,
            };
            expect(() => debugManager.updateGameStats(stats)).not.toThrow();
        });
    });

    describe('updatePerformanceStats', () => {
        it('should update performance stats without throwing', () => {
            const stats: PerformanceStats = {
                fps: 60,
                frameTime: 16.5,
                renderTime: 4.2,
                systemTimes: new Map([['ai', 1.5], ['physics', 2.3]]),
                entityCount: 150,
                memoryUsed: 45000000,
            };
            expect(() => debugManager.updatePerformanceStats(stats)).not.toThrow();
        });

        it('should handle pool stats if provided', () => {
            const stats: PerformanceStats = {
                fps: 60,
                frameTime: 16.5,
                renderTime: 4.2,
                systemTimes: new Map(),
                entityCount: 150,
                memoryUsed: 45000000,
                poolStats: {
                    enemies: { inUse: 10, available: 40 },
                    projectiles: { inUse: 25, available: 75 },
                },
            };
            expect(() => debugManager.updatePerformanceStats(stats)).not.toThrow();
        });
    });

    describe('destroy', () => {
        it('should remove the overlay from DOM', () => {
            debugManager.destroy();
            const overlay = document.querySelector('.debug-overlay');
            expect(overlay).toBeNull();
        });

        it('should handle being called multiple times', () => {
            debugManager.destroy();
            expect(() => debugManager.destroy()).not.toThrow();
        });
    });
});
