# Task 04: AchievementManager Test Coverage

> **Priority**: P2 - Medium Complexity
> **Estimated Time**: 30-40 minutes
> **Lines to Cover**: ~264 lines

## Objective

Add unit tests for `AchievementManager` class in `src/game/AchievementManager.ts`.

## Why This Is a Quick Win

- Self-contained achievement tracking logic
- Event-based but can be tested by calling handlers directly
- LocalStorage mocking is straightforward
- Clear achievement unlock conditions

## Target File

`src/game/AchievementManager.ts`

## Methods to Test

### 1. Achievement Unlocking
- `handleEnemyKilled()` → triggers FIRST_BLOOD, DECIMATOR, KILLS_500
- `handleWaveCompleted()` → triggers WAVE_SURVIVOR_5, WAVE_MASTER
- `handleComboUpdated()` → triggers COMBO_KING
- `onTurretBuilt()` → triggers TURRET_COMMANDER
- `update(deltaTime)` → triggers SURVIVOR (time-based)

### 2. Public API
- `getAchievement(id)` → returns copy of achievement
- `getAllAchievements()` → returns all achievements
- `getUnlockedAchievements()` → filters to unlocked only
- `getUnlockedCount()` / `getTotalCount()` → counters

### 3. State Management
- `resetSession()` → resets session stats, keeps achievements
- `clearAll()` → clears all achievements

## Implementation Instructions

1. Create new test file: `src/__tests__/AchievementManager.test.ts`

2. Follow this structure:

```typescript
/**
 * Tests for AchievementManager
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AchievementManager, AchievementId } from '../game/AchievementManager';

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
        removeItem: vi.fn((key: string) => { delete store[key]; }),
        clear: vi.fn(() => { store = {}; })
    };
})();

vi.stubGlobal('localStorage', localStorageMock);

// Mock EventBus to prevent actual event subscriptions
vi.mock('../core/EventBus', () => ({
    EventBus: {
        getInstance: vi.fn(() => ({
            on: vi.fn(),
            off: vi.fn(),
            emit: vi.fn()
        }))
    }
}));

describe('AchievementManager', () => {
    let manager: AchievementManager;

    beforeEach(() => {
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
            expect(achievements.every(a => !a.unlocked)).toBe(true);
        });

        it('should return correct total count', () => {
            expect(manager.getTotalCount()).toBe(8);
        });
    });

    describe('enemy kill achievements', () => {
        it('should unlock FIRST_BLOOD on first kill', () => {
            // Access private method via any cast for testing
            (manager as any).handleEnemyKilled();
            
            const achievement = manager.getAchievement(AchievementId.FIRST_BLOOD);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should unlock DECIMATOR after 100 kills', () => {
            for (let i = 0; i < 100; i++) {
                (manager as any).handleEnemyKilled();
            }
            
            const achievement = manager.getAchievement(AchievementId.DECIMATOR);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should unlock KILLS_500 after 500 kills', () => {
            for (let i = 0; i < 500; i++) {
                (manager as any).handleEnemyKilled();
            }
            
            const achievement = manager.getAchievement(AchievementId.KILLS_500);
            expect(achievement?.unlocked).toBe(true);
        });
    });

    describe('wave achievements', () => {
        it('should unlock WAVE_SURVIVOR_5 at wave 5', () => {
            (manager as any).handleWaveCompleted({ waveNumber: 5 });
            
            const achievement = manager.getAchievement(AchievementId.WAVE_SURVIVOR_5);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should unlock WAVE_MASTER at wave 10', () => {
            (manager as any).handleWaveCompleted({ waveNumber: 10 });
            
            const achievement = manager.getAchievement(AchievementId.WAVE_MASTER);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should not unlock wave achievements for earlier waves', () => {
            (manager as any).handleWaveCompleted({ waveNumber: 3 });
            
            expect(manager.getAchievement(AchievementId.WAVE_SURVIVOR_5)?.unlocked).toBe(false);
            expect(manager.getAchievement(AchievementId.WAVE_MASTER)?.unlocked).toBe(false);
        });
    });

    describe('combo achievements', () => {
        it('should unlock COMBO_KING at 10x multiplier', () => {
            (manager as any).handleComboUpdated({ multiplier: 10 });
            
            const achievement = manager.getAchievement(AchievementId.COMBO_KING);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should not unlock for lower combos', () => {
            (manager as any).handleComboUpdated({ multiplier: 5 });
            
            expect(manager.getAchievement(AchievementId.COMBO_KING)?.unlocked).toBe(false);
        });
    });

    describe('turret achievements', () => {
        it('should unlock TURRET_COMMANDER after 10 turrets', () => {
            for (let i = 0; i < 10; i++) {
                manager.onTurretBuilt();
            }
            
            const achievement = manager.getAchievement(AchievementId.TURRET_COMMANDER);
            expect(achievement?.unlocked).toBe(true);
        });
    });

    describe('time-based achievements', () => {
        it('should unlock SURVIVOR after 5 minutes', () => {
            // 5 minutes = 300 seconds
            manager.update(300);
            
            const achievement = manager.getAchievement(AchievementId.SURVIVOR);
            expect(achievement?.unlocked).toBe(true);
        });

        it('should not unlock before 5 minutes', () => {
            manager.update(290);
            
            expect(manager.getAchievement(AchievementId.SURVIVOR)?.unlocked).toBe(false);
        });
    });

    describe('session management', () => {
        it('should reset session stats but keep achievements', () => {
            // Unlock some achievements
            (manager as any).handleEnemyKilled(); // FIRST_BLOOD
            
            manager.resetSession();
            
            // Achievement should still be unlocked
            expect(manager.getAchievement(AchievementId.FIRST_BLOOD)?.unlocked).toBe(true);
            expect(manager.getUnlockedCount()).toBe(1);
        });

        it('should clear all achievements on clearAll', () => {
            // Unlock an achievement
            (manager as any).handleEnemyKilled();
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
    });
});
```

## Verification

Run the test:

```bash
npx vitest run src/__tests__/AchievementManager.test.ts
```

Expected: All tests pass, covering achievement unlock logic and state management.

## Dependencies

- Vitest (already installed)
- LocalStorage mock
- EventBus mock

## Notes

- Uses `(manager as any)` to access private handler methods for direct testing
- Mocks EventBus to prevent side effects
- Achievement persistence tested via localStorage mock
