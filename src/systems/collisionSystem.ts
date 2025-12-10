/**
 * Collision System for Kobayashi Maru
 * A bitECS system that updates spatial hash each frame for efficient collision detection
 */
import { query, World } from 'bitecs';
import { Position } from '../ecs/components';
import { SpatialHash } from '../collision/spatialHash';

/**
 * Creates the collision system that updates spatial hash each frame
 * @param spatialHash The spatial hash instance to update
 * @returns A system function and methods to query nearby entities
 */
export function createCollisionSystem(spatialHash: SpatialHash) {
  function collisionSystemUpdate(world: World): World {
    // Clear hash at start of frame
    spatialHash.clear();

    // Insert all entities with Position into hash based on position
    const entities = query(world, [Position]);
    for (const eid of entities) {
      const x = Position.x[eid];
      const y = Position.y[eid];
      spatialHash.insert(eid, x, y);
    }

    return world;
  }

  return {
    /**
     * Run the collision system update
     */
    update: collisionSystemUpdate,

    /**
     * Query nearby entities within a circular radius
     * @param x Center X position
     * @param y Center Y position
     * @param radius Search radius
     * @returns Array of entity IDs within the radius
     */
    queryNearby: (x: number, y: number, radius: number): number[] => {
      return spatialHash.query(x, y, radius);
    },

    /**
     * Query entities within a rectangular area
     * @param x Top-left X position
     * @param y Top-left Y position
     * @param width Rectangle width
     * @param height Rectangle height
     * @returns Array of entity IDs within the rectangle
     */
    queryRect: (x: number, y: number, width: number, height: number): number[] => {
      return spatialHash.queryRect(x, y, width, height);
    },

    /**
     * Get the underlying spatial hash for direct access
     */
    getSpatialHash: (): SpatialHash => {
      return spatialHash;
    }
  };
}

export type CollisionSystem = ReturnType<typeof createCollisionSystem>;
