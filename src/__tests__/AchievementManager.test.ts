/**
 * Tests for AchievementManager
 *
 * Uses vi.stubGlobal for localStorage and vi.mock for EventBus.
 * Tests achievement unlock logic, storage, and event handling.
 *
 * @module __tests__/AchievementManager.test
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AchievementManager, AchievementId } from '../game/AchievementManager';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value;
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        key: vi.fn(() => null),
        get length() {
            return Object.keys(store).length;
        },
    };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock EventBus to prevent actual event subscriptions
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();

vi.mock('../core/EventBus', () => ({
    EventBus: {
        getInstance: vi.fn(() => ({
            on: mockOn,
            off: mockOff,
            emit: mockEmit,
        })),
    },
}));

describe('AchievementManager', () => {
    let manager: AchievementManager;

    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.clear();
        manager = new AchievementManager();
    });

    afterEach(() => {
        manager.unsubscribe();
    });

    describe('initialization', () => {
        it('should initialize all achievements as locked', () => {
            const achievements = manager.getAllAchievements();
            expect(achievements.length).toBe(8); // 8 achievements defined
            expect(achievements.every((a) => !a.unlocked)).toBe(true);
        });

        it('should return correct total count', () => {
            expect(manager.getTotalCount()).toBe(8);
        });

        it('should subscribe to game events on construction', () => {
            expect(mockOn).toHaveBeenCalledTimes(3); // 3 event types
        });
    });

    describe('enemy kill achievements', () => {
        it('should unlock FIRST_BLOOD on first kill', () => {
            // Access private method via any cast for testing
            (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();

            const achievement = manager.getAchievement(AchievementId.FIRST_BLOOD);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should unlock DECIMATOR after 100 kills', () => {
            for (let i = 0; i < 100; i++) {
                (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();
            }

            expect(manager.getAchievement(AchievementId.DECIMATOR)?.unlocked).toBe(true);
        });

        it('should not unlock DECIMATOR before 100 kills', () => {
            for (let i = 0; i < 99; i++) {
                (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();
            }

            expect(manager.getAchievement(AchievementId.DECIMATOR)?.unlocked).toBe(false);
        });

        it('should unlock KILLS_500 after 500 kills', () => {
            for (let i = 0; i < 500; i++) {
                (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();
            }

            expect(manager.getAchievement(AchievementId.KILLS_500)?.unlocked).toBe(true);
        });
    });

    describe('wave achievements', () => {
        it('should unlock WAVE_SURVIVOR_5 at wave 5', () => {
            (manager as unknown as { handleWaveCompleted: (p: { waveNumber: number }) => void }).handleWaveCompleted({ waveNumber: 5 });

            expect(manager.getAchievement(AchievementId.WAVE_SURVIVOR_5)?.unlocked).toBe(true);
        });

        it('should unlock WAVE_MASTER at wave 10', () => {
            (manager as unknown as { handleWaveCompleted: (p: { waveNumber: number }) => void }).handleWaveCompleted({ waveNumber: 10 });

            expect(manager.getAchievement(AchievementId.WAVE_MASTER)?.unlocked).toBe(true);
        });

        it('should not unlock wave achievements for earlier waves', () => {
            (manager as unknown as { handleWaveCompleted: (p: { waveNumber: number }) => void }).handleWaveCompleted({ waveNumber: 3 });

            expect(manager.getAchievement(AchievementId.WAVE_SURVIVOR_5)?.unlocked).toBe(false);
            expect(manager.getAchievement(AchievementId.WAVE_MASTER)?.unlocked).toBe(false);
        });
    });

    describe('combo achievements', () => {
        it('should unlock COMBO_KING at 10x multiplier', () => {
            (manager as unknown as { handleComboUpdated: (p: { multiplier: number }) => void }).handleComboUpdated({ multiplier: 10 });

            expect(manager.getAchievement(AchievementId.COMBO_KING)?.unlocked).toBe(true);
        });

        it('should not unlock for lower combos', () => {
            (manager as unknown as { handleComboUpdated: (p: { multiplier: number }) => void }).handleComboUpdated({ multiplier: 5 });

            expect(manager.getAchievement(AchievementId.COMBO_KING)?.unlocked).toBe(false);
        });
    });

    describe('turret achievements', () => {
        it('should unlock TURRET_COMMANDER after 10 turrets', () => {
            for (let i = 0; i < 10; i++) {
                manager.onTurretBuilt();
            }

            expect(manager.getAchievement(AchievementId.TURRET_COMMANDER)?.unlocked).toBe(true);
        });

        it('should not unlock TURRET_COMMANDER before 10 turrets', () => {
            for (let i = 0; i < 9; i++) {
                manager.onTurretBuilt();
            }

            expect(manager.getAchievement(AchievementId.TURRET_COMMANDER)?.unlocked).toBe(false);
        });
    });

    describe('time-based achievements', () => {
        it('should unlock SURVIVOR after 5 minutes', () => {
            // 5 minutes = 300 seconds
            manager.update(300);

            expect(manager.getAchievement(AchievementId.SURVIVOR)?.unlocked).toBe(true);
        });

        it('should not unlock before 5 minutes', () => {
            manager.update(290);

            expect(manager.getAchievement(AchievementId.SURVIVOR)?.unlocked).toBe(false);
        });

        it('should accumulate time across multiple updates', () => {
            manager.update(150);
            expect(manager.getAchievement(AchievementId.SURVIVOR)?.unlocked).toBe(false);

            manager.update(150);
            expect(manager.getAchievement(AchievementId.SURVIVOR)?.unlocked).toBe(true);
        });
    });

    describe('session management', () => {
        it('should reset session stats but keep achievements', () => {
            // Unlock some achievements
            (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled(); // FIRST_BLOOD

            manager.resetSession();

            // Achievement should still be unlocked
            expect(manager.getAchievement(AchievementId.FIRST_BLOOD)?.unlocked).toBe(true);
            expect(manager.getUnlockedCount()).toBe(1);
        });

        it('should clear all achievements on clearAll', () => {
            // Unlock an achievement
            (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();
            expect(manager.getUnlockedCount()).toBe(1);

            manager.clearAll();

            expect(manager.getUnlockedCount()).toBe(0);
        });
    });

    describe('public API', () => {
        it('should return undefined for invalid achievement ID', () => {
            expect(manager.getAchievement('invalid_id')).toBeUndefined();
        });

        it('should return copies of achievements', () => {
            const achievement1 = manager.getAchievement(AchievementId.FIRST_BLOOD);
            const achievement2 = manager.getAchievement(AchievementId.FIRST_BLOOD);

            expect(achievement1).not.toBe(achievement2); // Different objects
            expect(achievement1).toEqual(achievement2); // Same values
        });

        it('should filter unlocked achievements correctly', () => {
            (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();

            const unlocked = manager.getUnlockedAchievements();
            expect(unlocked.length).toBe(1);
            expect(unlocked[0].id).toBe(AchievementId.FIRST_BLOOD);
        });
    });

    describe('storage persistence', () => {
        it('should save to localStorage when achievement unlocked', () => {
            (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();

            expect(localStorageMock.setItem).toHaveBeenCalled();
        });

        it('should emit ACHIEVEMENT_UNLOCKED event when unlocking', () => {
            (manager as unknown as { handleEnemyKilled: () => void }).handleEnemyKilled();

            expect(mockEmit).toHaveBeenCalledWith(
                'ACHIEVEMENT_UNLOCKED',
                expect.objectContaining({
                    achievementId: AchievementId.FIRST_BLOOD,
                    name: 'First Blood',
                })
            );
        });

        it('should load achievements from localStorage on construction', () => {
            // Set up localStorage with saved achievements
            const savedData = {
                [AchievementId.FIRST_BLOOD]: { unlocked: true, unlockedAt: 12345 },
            };
            localStorageMock.setItem('kobayashi-maru-achievements', JSON.stringify(savedData));

            // Create new manager
            const newManager = new AchievementManager();
            const achievement = newManager.getAchievement(AchievementId.FIRST_BLOOD);

            expect(achievement?.unlocked).toBe(true);
            expect(achievement?.unlockedAt).toBe(12345);

            newManager.unsubscribe();
        });
    });

    describe('unsubscribe', () => {
        it('should unregister event handlers on unsubscribe', () => {
            manager.unsubscribe();

            expect(mockOff).toHaveBeenCalledTimes(3); // 3 event types
        });
    });
});
