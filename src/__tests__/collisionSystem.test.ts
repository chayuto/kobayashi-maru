/**
 * Tests for Collision System
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { PoolManager } from '../ecs/PoolManager';
import { createFederationShip } from '../ecs/entityFactory';
import { Position } from '../ecs/components';
import { createCollisionSystem } from '../systems/collisionSystem';
import { SpatialHash } from '../collision/spatialHash';
import { GAME_CONFIG } from '../types/constants';

describe('Collision System', () => {
  let world: ReturnType<typeof createGameWorld>;
  let spatialHash: SpatialHash;
  let collisionSystem: ReturnType<typeof createCollisionSystem>;

  beforeEach(() => {
    world = createGameWorld();
    PoolManager.getInstance().init(world);
    // Use cell size of 64 for testing
    spatialHash = new SpatialHash(64, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    collisionSystem = createCollisionSystem(spatialHash);
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  describe('update', () => {
    it('should insert entities into spatial hash based on position', () => {
      const eid1 = createFederationShip(world, 100, 100);
      const eid2 = createFederationShip(world, 200, 200);

      // Run the collision system
      collisionSystem.update(world);

      // Query should find entities
      const result = collisionSystem.queryNearby(150, 150, 200);

      expect(result).toContain(eid1);
      expect(result).toContain(eid2);
    });

    it('should clear hash before inserting', () => {
      const eid = createFederationShip(world, 100, 100);

      // Run collision system twice
      collisionSystem.update(world);
      collisionSystem.update(world);

      // Entity should only appear once
      const result = collisionSystem.queryNearby(100, 100, 100);
      const count = result.filter(id => id === eid).length;

      expect(count).toBe(1);
    });

    it('should update hash when entity position changes', () => {
      const eid = createFederationShip(world, 100, 100);

      // Run collision system
      collisionSystem.update(world);

      // Entity should be found at original position
      let result = collisionSystem.queryNearby(100, 100, 50);
      expect(result).toContain(eid);

      // Move entity
      Position.x[eid] = 900;
      Position.y[eid] = 900;

      // Run collision system again
      collisionSystem.update(world);

      // Entity should now be at new position
      result = collisionSystem.queryNearby(100, 100, 50);
      expect(result).not.toContain(eid);

      result = collisionSystem.queryNearby(900, 900, 50);
      expect(result).toContain(eid);
    });
  });

  describe('queryNearby', () => {
    it('should return entities within circular radius', () => {
      const eid1 = createFederationShip(world, 100, 100);
      const eid2 = createFederationShip(world, 150, 100);
      const eid3 = createFederationShip(world, 500, 500);

      collisionSystem.update(world);

      const result = collisionSystem.queryNearby(100, 100, 100);

      expect(result).toContain(eid1);
      expect(result).toContain(eid2);
      expect(result).not.toContain(eid3);
    });

    it('should return empty array when no entities nearby', () => {
      createFederationShip(world, 100, 100);

      collisionSystem.update(world);

      const result = collisionSystem.queryNearby(900, 900, 50);

      expect(result.length).toBe(0);
    });
  });

  describe('queryRect', () => {
    it('should return entities within rectangle', () => {
      const eid1 = createFederationShip(world, 100, 100);
      const eid2 = createFederationShip(world, 150, 150);
      const eid3 = createFederationShip(world, 500, 500);

      collisionSystem.update(world);

      const result = collisionSystem.queryRect(50, 50, 200, 200);

      expect(result).toContain(eid1);
      expect(result).toContain(eid2);
      expect(result).not.toContain(eid3);
    });
  });

  describe('getSpatialHash', () => {
    it('should return the underlying spatial hash', () => {
      const hash = collisionSystem.getSpatialHash();

      expect(hash).toBe(spatialHash);
    });
  });

  describe('integration', () => {
    it('should handle multiple entities efficiently', () => {
      // Create 100 entities at random positions
      const entities: number[] = [];
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
        const y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;
        entities.push(createFederationShip(world, x, y));
      }

      // Run collision system
      collisionSystem.update(world);

      // Query should work
      const result = collisionSystem.queryNearby(
        GAME_CONFIG.WORLD_WIDTH / 2,
        GAME_CONFIG.WORLD_HEIGHT / 2,
        200
      );

      // Result should be a subset of all entities
      expect(result.length).toBeLessThanOrEqual(entities.length);
    });
  });
});
