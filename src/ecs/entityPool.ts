/**
 * Entity Pool System for Kobayashi Maru
 * Implements object pooling to avoid garbage collection spikes
 */
import { addEntity, removeEntity } from 'bitecs';
import type { GameWorld } from './world';

/**
 * EntityPool manages a pool of pre-allocated entity IDs to avoid GC spikes
 * Supports pool sizes of 10,000+ entities
 */
export class EntityPool {
  private world: GameWorld;
  private available: number[] = [];
  private inUse: Set<number> = new Set();
  private initialSize: number;

  /**
   * Creates a new EntityPool
   * @param world - The ECS world
   * @param initialSize - Initial number of entities to pre-allocate (default: 10000)
   */
  constructor(world: GameWorld, initialSize: number = 10000) {
    this.world = world;
    this.initialSize = initialSize;
    this.preallocate(initialSize);
  }

  /**
   * Pre-allocates entity slots to avoid allocation during gameplay
   * @param count - Number of entities to pre-allocate
   */
  private preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      const eid = addEntity(this.world);
      this.available.push(eid);
    }
  }

  /**
   * Acquires an entity from the pool
   * @returns Entity ID from the pool, or a new entity if pool is empty
   */
  acquire(): number {
    let eid: number;
    
    if (this.available.length > 0) {
      eid = this.available.pop()!;
    } else {
      // Pool exhausted, create a new entity and log warning
      console.warn('EntityPool: Pool exhausted, creating new entity. Consider increasing pool size.');
      eid = addEntity(this.world);
    }
    
    this.inUse.add(eid);
    return eid;
  }

  /**
   * Releases an entity back to the pool
   * @param eid - Entity ID to release
   */
  release(eid: number): void {
    if (!this.inUse.has(eid)) {
      console.warn(`EntityPool: Attempted to release entity ${eid} that is not in use`);
      return;
    }
    
    this.inUse.delete(eid);
    this.available.push(eid);
  }

  /**
   * Gets the number of available entities in the pool
   * @returns Number of available entities
   */
  getAvailableCount(): number {
    return this.available.length;
  }

  /**
   * Gets the number of entities currently in use
   * @returns Number of entities in use
   */
  getInUseCount(): number {
    return this.inUse.size;
  }

  /**
   * Gets the total pool size (available + in use)
   * @returns Total pool size
   */
  getTotalSize(): number {
    return this.available.length + this.inUse.size;
  }

  /**
   * Expands the pool by adding more pre-allocated entities
   * @param count - Number of entities to add
   */
  expand(count: number): void {
    this.preallocate(count);
  }

  /**
   * Releases all entities and clears the pool
   */
  clear(): void {
    // Release all in-use entities back to available
    for (const eid of this.inUse) {
      this.available.push(eid);
    }
    this.inUse.clear();
  }

  /**
   * Destroys the pool and removes all entities from the world
   */
  destroy(): void {
    // Remove all entities from the world
    for (const eid of this.available) {
      removeEntity(this.world, eid);
    }
    for (const eid of this.inUse) {
      removeEntity(this.world, eid);
    }
    
    this.available = [];
    this.inUse.clear();
  }

  /**
   * Gets the initial size of the pool
   * @returns Initial pool size
   */
  getInitialSize(): number {
    return this.initialSize;
  }
}
