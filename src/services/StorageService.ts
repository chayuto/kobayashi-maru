export enum StorageKeys {
    HIGH_SCORE = 'HIGH_SCORE',
    VOLUME_SFX = 'VOLUME_SFX',
    VOLUME_MUSIC = 'VOLUME_MUSIC',
    KEY_BINDINGS = 'KEY_BINDINGS',
}

export class StorageService {
    private storage: Storage;

    constructor() {
        if (this.isLocalStorageAvailable()) {
            this.storage = window.localStorage;
        } else {
            this.storage = new InMemoryStorage();
        }
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
