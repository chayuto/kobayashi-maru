/**
 * Tests for Entity Pool system
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { EntityPool } from '../ecs/entityPool';

describe('EntityPool', () => {
  let world: ReturnType<typeof createGameWorld>;
  
  beforeEach(() => {
    world = createGameWorld();
  });

  it('should create a pool with specified initial size', () => {
    const pool = new EntityPool(world, 100);
    
    expect(pool.getAvailableCount()).toBe(100);
    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getTotalSize()).toBe(100);
    expect(pool.getInitialSize()).toBe(100);
  });

  it('should acquire entities from the pool', () => {
    const pool = new EntityPool(world, 10);
    
    const eid1 = pool.acquire();
    const eid2 = pool.acquire();
    
    expect(eid1).toBeDefined();
    expect(eid2).toBeDefined();
    expect(eid1).not.toBe(eid2);
    expect(pool.getAvailableCount()).toBe(8);
    expect(pool.getInUseCount()).toBe(2);
  });

  it('should release entities back to the pool', () => {
    const pool = new EntityPool(world, 10);
    
    const eid = pool.acquire();
    expect(pool.getInUseCount()).toBe(1);
    
    pool.release(eid);
    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getAvailableCount()).toBe(10);
  });

  it('should expand the pool when needed', () => {
    const pool = new EntityPool(world, 5);
    
    pool.expand(5);
    expect(pool.getAvailableCount()).toBe(10);
    expect(pool.getTotalSize()).toBe(10);
  });

  it('should clear all entities back to available', () => {
    const pool = new EntityPool(world, 10);
    
    // Acquire several entities
    pool.acquire();
    pool.acquire();
    pool.acquire();
    
    expect(pool.getInUseCount()).toBe(3);
    expect(pool.getAvailableCount()).toBe(7);
    
    pool.clear();
    
    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getAvailableCount()).toBe(10);
  });

  it('should destroy pool and remove all entities', () => {
    const pool = new EntityPool(world, 10);
    
    pool.acquire();
    pool.acquire();
    
    pool.destroy();
    
    expect(pool.getAvailableCount()).toBe(0);
    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getTotalSize()).toBe(0);
  });
});
