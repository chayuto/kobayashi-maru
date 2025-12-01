/**
 * Movement System for Kobayashi Maru
 * A bitECS system that applies velocity to position each frame
 */
import { defineQuery, defineSystem, IWorld, hasComponent } from 'bitecs';
import { Position, Velocity, Projectile } from '../ecs/components';
import { GAME_CONFIG } from '../types';

// Query for entities with Position and Velocity components
const movementQuery = defineQuery([Position, Velocity]);

/**
 * Creates the movement system that updates entity positions based on velocity
 * @returns A bitECS system function that takes world and delta time
 */
export function createMovementSystem() {
  return defineSystem((world: IWorld, delta: number) => {
    const entities = movementQuery(world);

    const worldWidth = GAME_CONFIG.WORLD_WIDTH;
    const worldHeight = GAME_CONFIG.WORLD_HEIGHT;

    for (const eid of entities) {
      // Apply velocity to position (delta is in seconds)
      Position.x[eid] += Velocity.x[eid] * delta;
      Position.y[eid] += Velocity.y[eid] * delta;

      // Skip wrapping for projectiles - they should fly off screen
      if (hasComponent(world, Projectile, eid)) {
        continue;
      }

      // Boundary handling - wrap around to opposite edge using robust modulo
      // The formula ((value % size) + size) % size handles both positive and negative values
      const x = Position.x[eid];
      const y = Position.y[eid];

      Position.x[eid] = ((x % worldWidth) + worldWidth) % worldWidth;
      Position.y[eid] = ((y % worldHeight) + worldHeight) % worldHeight;
    }

    return world;
  });
}
