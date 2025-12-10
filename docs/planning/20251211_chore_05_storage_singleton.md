# Chore Task 05: Convert StorageService to Singleton

**Date:** 2025-12-11  
**Priority:** P2 (Low Impact, Low Risk)  
**Estimated Effort:** 30 minutes  
**Risk Level:** LOW - Pattern change only

---

## Problem Statement

`StorageService` requires instantiation, unlike other services:

```typescript
// Current usage (inconsistent)
const storage = new StorageService();
storage.save(StorageKeys.HIGH_SCORE, data);

// Other services use singleton pattern
const eventBus = EventBus.getInstance();
const audioManager = AudioManager.getInstance();
```

This inconsistency:
- Allows multiple instances (potential bugs)
- Doesn't match established patterns
- Confuses AI agents

---

## Current Implementation

**File:** `src/services/StorageService.ts`

```typescript
export class StorageService {
    private storage: Storage;

    constructor() {
        if (this.isLocalStorageAvailable()) {
            this.storage = window.localStorage;
        } else {
            this.storage = new InMemoryStorage();
        }
    }

    public save<T>(key: StorageKeys, data: T): void { ... }
    public load<T>(key: StorageKeys, defaultValue: T): T { ... }
    public clear(key: StorageKeys): void { ... }
    public has(key: StorageKeys): boolean { ... }
}
```

---

## Solution

Convert to singleton pattern matching other services.

---

## Implementation

### Update `src/services/StorageService.ts`

```typescript
export enum StorageKeys {
    HIGH_SCORE = 'HIGH_SCORE',
    VOLUME_SFX = 'VOLUME_SFX',
    VOLUME_MUSIC = 'VOLUME_MUSIC',
    KEY_BINDINGS = 'KEY_BINDINGS',
    ACHIEVEMENTS = 'ACHIEVEMENTS',  // Add if missing
}

export class StorageService {
    private static instance: StorageService | null = null;
    private storage: Storage;

    private constructor() {
        if (this.isLocalStorageAvailable()) {
            this.storage = window.localStorage;
        } else {
            this.storage = new InMemoryStorage();
        }
    }

    /**
     * Get the singleton StorageService instance.
     */
    public static getInstance(): StorageService {
        if (!StorageService.instance) {
            StorageService.instance = new StorageService();
        }
        return StorageService.instance;
    }

    /**
     * Reset the singleton instance (for testing).
     */
    public static resetInstance(): void {
        StorageService.instance = null;
    }

    public save<T>(key: StorageKeys, data: T): void {
        try {
            const serializedData = JSON.stringify(data);
            this.storage.setItem(key, serializedData);
        } catch (error) {
            console.error(`Failed to save data for key ${key}:`, error);
        }
    }

    public load<T>(key: StorageKeys, defaultValue: T): T {
        try {
            const serializedData = this.storage.getItem(key);
            if (serializedData === null) {
                return defaultValue;
            }
            return JSON.parse(serializedData) as T;
        } catch (error) {
            console.error(`Failed to load data for key ${key}:`, error);
            return defaultValue;
        }
    }

    public clear(key: StorageKeys): void {
        try {
            this.storage.removeItem(key);
        } catch (error) {
            console.error(`Failed to clear data for key ${key}:`, error);
        }
    }

    public has(key: StorageKeys): boolean {
        try {
            return this.storage.getItem(key) !== null;
        } catch (error) {
            console.error(`Failed to check existence for key ${key}:`, error);
            return false;
        }
    }

    private isLocalStorageAvailable(): boolean {
        try {
            const testKey = '__test_storage__';
            window.localStorage.setItem(testKey, testKey);
            window.localStorage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }
}

class InMemoryStorage implements Storage {
    private data: Map<string, string> = new Map();

    get length(): number {
        return this.data.size;
    }

    public clear(): void {
        this.data.clear();
    }

    public getItem(key: string): string | null {
        return this.data.get(key) || null;
    }

    public key(index: number): string | null {
        return Array.from(this.data.keys())[index] || null;
    }

    public removeItem(key: string): void {
        this.data.delete(key);
    }

    public setItem(key: string, value: string): void {
        this.data.set(key, value);
    }
}
```

---

## Files to Update

### `src/game/highScoreManager.ts`

```typescript
// Before
import { StorageService, StorageKeys } from '../services';

export class HighScoreManager {
    private storage: StorageService;

    constructor() {
        this.storage = new StorageService();
    }
}

// After
import { StorageService, StorageKeys } from '../services';

export class HighScoreManager {
    private storage: StorageService;

    constructor() {
        this.storage = StorageService.getInstance();
    }
}
```

### `src/game/AchievementManager.ts` (if using StorageService)

```typescript
// Check if this file uses StorageService and update similarly
```

### `src/audio/AudioManager.ts` (if using StorageService for volume)

```typescript
// Check if this file uses StorageService and update similarly
```

---

## Test Coverage

### Update `src/__tests__/StorageService.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StorageService, StorageKeys } from '../services/StorageService';

describe('StorageService', () => {
    beforeEach(() => {
        // Reset singleton before each test
        StorageService.resetInstance();
    });

    describe('singleton pattern', () => {
        it('should return the same instance', () => {
            const instance1 = StorageService.getInstance();
            const instance2 = StorageService.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should reset instance properly', () => {
            const instance1 = StorageService.getInstance();
            StorageService.resetInstance();
            const instance2 = StorageService.getInstance();
            expect(instance1).not.toBe(instance2);
        });
    });

    describe('save and load', () => {
        it('should save and load data', () => {
            const storage = StorageService.getInstance();
            const testData = { score: 1000, wave: 5 };

            storage.save(StorageKeys.HIGH_SCORE, testData);
            const loaded = storage.load(StorageKeys.HIGH_SCORE, { score: 0, wave: 0 });

            expect(loaded).toEqual(testData);
        });

        it('should return default value when key not found', () => {
            const storage = StorageService.getInstance();
            const defaultValue = { score: 0 };

            const loaded = storage.load(StorageKeys.HIGH_SCORE, defaultValue);

            expect(loaded).toEqual(defaultValue);
        });
    });

    describe('clear', () => {
        it('should clear stored data', () => {
            const storage = StorageService.getInstance();
            storage.save(StorageKeys.HIGH_SCORE, { score: 100 });

            storage.clear(StorageKeys.HIGH_SCORE);

            expect(storage.has(StorageKeys.HIGH_SCORE)).toBe(false);
        });
    });

    describe('has', () => {
        it('should return true for existing key', () => {
            const storage = StorageService.getInstance();
            storage.save(StorageKeys.HIGH_SCORE, { score: 100 });

            expect(storage.has(StorageKeys.HIGH_SCORE)).toBe(true);
        });

        it('should return false for non-existing key', () => {
            const storage = StorageService.getInstance();

            expect(storage.has(StorageKeys.HIGH_SCORE)).toBe(false);
        });
    });
});
```

---

## Verification Checklist

- [ ] Update `src/services/StorageService.ts` to singleton pattern
- [ ] Update `src/game/highScoreManager.ts` to use `getInstance()`
- [ ] Check and update any other files using `new StorageService()`
- [ ] Update `src/__tests__/StorageService.test.ts`
- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] `npm run build` succeeds
- [ ] High scores still save/load correctly (manual test)

---

## AI Agent Instructions

1. Update StorageService to singleton pattern
2. Search for `new StorageService()` in all files
3. Replace with `StorageService.getInstance()`
4. Update tests to use `resetInstance()` in beforeEach
5. Run verification commands
6. Test high score saving in browser

---

## Benefits

1. **Consistency** - Matches EventBus, AudioManager patterns
2. **Safety** - Prevents multiple instances
3. **Testability** - `resetInstance()` for clean test state
4. **AI-Friendly** - Predictable singleton pattern
