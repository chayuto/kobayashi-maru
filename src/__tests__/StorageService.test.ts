// @vitest-environment jsdom
import { describe, test, expect, beforeEach, afterEach, vi, type Mock } from 'vitest';
import { StorageService, StorageKeys } from '../services/StorageService';

describe('StorageService', () => {
    let storageService: StorageService;
    let mockLocalStorage: Storage;

    beforeEach(() => {
        // Mock localStorage
        mockLocalStorage = {
            getItem: vi.fn(),
            setItem: vi.fn(),
            removeItem: vi.fn(),
            clear: vi.fn(),
            key: vi.fn(),
            length: 0,
        };

        Object.defineProperty(window, 'localStorage', {
            value: mockLocalStorage,
            writable: true,
        });

        storageService = new StorageService();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    test('should save data correctly', () => {
        const data = { score: 100 };
        storageService.save(StorageKeys.HIGH_SCORE, data);
        expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
            StorageKeys.HIGH_SCORE,
            JSON.stringify(data)
        );
    });

    test('should load data correctly', () => {
        const data = { score: 100 };
        (mockLocalStorage.getItem as Mock).mockReturnValue(JSON.stringify(data));

        const loadedData = storageService.load(StorageKeys.HIGH_SCORE, { score: 0 });
        expect(loadedData).toEqual(data);
    });

    test('should return default value if key does not exist', () => {
        (mockLocalStorage.getItem as Mock).mockReturnValue(null);

        const defaultValue = { score: 0 };
        const loadedData = storageService.load(StorageKeys.HIGH_SCORE, defaultValue);
        expect(loadedData).toEqual(defaultValue);
    });

    test('should clear data correctly', () => {
        storageService.clear(StorageKeys.HIGH_SCORE);
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(StorageKeys.HIGH_SCORE);
    });

    test('should check if key exists', () => {
        (mockLocalStorage.getItem as Mock).mockReturnValue('some data');
        expect(storageService.has(StorageKeys.HIGH_SCORE)).toBe(true);

        (mockLocalStorage.getItem as Mock).mockReturnValue(null);
        expect(storageService.has(StorageKeys.HIGH_SCORE)).toBe(false);
    });

    test('should fallback to in-memory storage if localStorage is unavailable', () => {
        // Simulate localStorage throwing an error
        Object.defineProperty(window, 'localStorage', {
            get: () => {
                throw new Error('Access denied');
            },
        });

        // Re-initialize service to trigger fallback
        storageService = new StorageService();

        const data = { volume: 0.5 };
        storageService.save(StorageKeys.VOLUME_SFX, data);

        // Verify it was NOT saved to localStorage (since it's unavailable)
        // But we can verify it was saved to the internal in-memory storage by loading it back
        const loadedData = storageService.load(StorageKeys.VOLUME_SFX, { volume: 1 });
        expect(loadedData).toEqual(data);
    });
});
