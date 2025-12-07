/**
 * Entity Pool Service for Kobayashi Maru
 * 
 * Provides global access to entity pooling to avoid GC spikes.
 * The pool is initialized once and reused across all entity creation.
 * 
 * @module services/EntityPoolService
 * 
 * @example
 * ```typescript
 * import { EntityPoolService } from '../services';
 * 
 * // Initialize once at game start
 * EntityPoolService.initialize(world);
 * 
 * // Use in entity factory
 * const eid = EntityPoolService.acquire();
 * 
 * // Release when entity is destroyed
 * EntityPoolService.release(eid);
 * ```
 */
import { addEntity, removeEntity } from 'bitecs';
import type { GameWorld } from '../ecs/world';

/**
 * Default pool configuration.
 */
const POOL_CONFIG = {
    /** Initial number of entities to pre-allocate */
    INITIAL_SIZE: 5000,
    /** Number of entities to add when pool expands */
    EXPANSION_SIZE: 1000,
} as const;

/**
 * EntityPoolService provides singleton access to entity pooling.
 * Must be initialized before use.
 */
export class EntityPoolService {
    private static world: GameWorld | null = null;
    private static available: number[] = [];
    private static inUse: Set<number> = new Set();
    private static initialized: boolean = false;

    /**
     * Initialize the pool with a world.
     * Should be called once at game start.
     * 
     * @param world - The ECS world
     * @param initialSize - Initial pool size (default: 5000)
     */
    static initialize(world: GameWorld, initialSize: number = POOL_CONFIG.INITIAL_SIZE): void {
        if (EntityPoolService.initialized) {
            console.warn('EntityPoolService: Already initialized');
            return;
        }

        EntityPoolService.world = world;
        EntityPoolService.preallocate(initialSize);
        EntityPoolService.initialized = true;
    }

    /**
     * Pre-allocate entity slots.
     */
    private static preallocate(count: number): void {
        if (!EntityPoolService.world) return;

        for (let i = 0; i < count; i++) {
            const eid = addEntity(EntityPoolService.world);
            EntityPoolService.available.push(eid);
        }
    }

    /**
     * Acquire an entity from the pool.
     * 
     * @returns Entity ID from pool, or creates new if pool exhausted
     */
    static acquire(): number {
        if (!EntityPoolService.initialized || !EntityPoolService.world) {
            // Fallback: create entity directly if pool not initialized
            // This maintains compatibility with existing code
            if (EntityPoolService.world) {
                return addEntity(EntityPoolService.world);
            }
            throw new Error('EntityPoolService: Not initialized. Call initialize() first.');
        }

        let eid: number;

        if (EntityPoolService.available.length > 0) {
            eid = EntityPoolService.available.pop()!;
        } else {
            // Pool exhausted, expand
            EntityPoolService.preallocate(POOL_CONFIG.EXPANSION_SIZE);
            eid = EntityPoolService.available.pop()!;
        }

        EntityPoolService.inUse.add(eid);
        return eid;
    }

    /**
     * Release an entity back to the pool.
     * 
     * @param eid - Entity ID to release
     */
    static release(eid: number): void {
        if (!EntityPoolService.initialized) return;

        if (!EntityPoolService.inUse.has(eid)) {
            return; // Silent return - entity may have been created outside pool
        }

        EntityPoolService.inUse.delete(eid);
        EntityPoolService.available.push(eid);
    }

    /**
     * Check if the pool is initialized.
     */
    static isInitialized(): boolean {
        return EntityPoolService.initialized;
    }

    /**
     * Get pool statistics.
     */
    static getStats(): { available: number; inUse: number; total: number } {
        return {
            available: EntityPoolService.available.length,
            inUse: EntityPoolService.inUse.size,
            total: EntityPoolService.available.length + EntityPoolService.inUse.size,
        };
    }

    /**
     * Reset the pool (for game restart).
     */
    static reset(): void {
        // Move all in-use entities back to available
        for (const eid of EntityPoolService.inUse) {
            EntityPoolService.available.push(eid);
        }
        EntityPoolService.inUse.clear();
    }

    /**
     * Destroy the pool and clean up.
     */
    static destroy(): void {
        if (!EntityPoolService.world) return;

        for (const eid of EntityPoolService.available) {
            removeEntity(EntityPoolService.world, eid);
        }
        for (const eid of EntityPoolService.inUse) {
            removeEntity(EntityPoolService.world, eid);
        }

        EntityPoolService.available = [];
        EntityPoolService.inUse.clear();
        EntityPoolService.world = null;
        EntityPoolService.initialized = false;
    }
}
