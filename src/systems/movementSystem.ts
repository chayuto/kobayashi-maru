/**
 * Movement System for Kobayashi Maru
 * A bitECS system that applies velocity to position each frame
 */
import { defineQuery, IWorld, hasComponent } from 'bitecs';
import { Position, Velocity, Projectile, AIBehavior } from '../ecs/components';
import { GAME_CONFIG } from '../types';

// Query for entities with Position and Velocity components
const movementQuery = defineQuery([Position, Velocity]);

/**
 * Creates the movement system that updates entity positions based on velocity
 * @param getSpeedMultiplier - Optional function to get speed multiplier for AI entities
 * @returns A bitECS system function that takes world and delta time
 */
export function createMovementSystem(getSpeedMultiplier?: () => number) {
  return function movementSystem(world: IWorld, delta: number): IWorld {
    const entities = movementQuery(world);

    const worldWidth = GAME_CONFIG.WORLD_WIDTH;
    const worldHeight = GAME_CONFIG.WORLD_HEIGHT;

    for (const eid of entities) {
      // Check if this is an AI entity that should have slow mode applied
      const isAIEntity = hasComponent(world, AIBehavior, eid);
      const speedMultiplier = (isAIEntity && getSpeedMultiplier) ? getSpeedMultiplier() : 1.0;

      // Apply velocity to position (delta is in seconds)
      Position.x[eid] += Velocity.x[eid] * delta * speedMultiplier;
      Position.y[eid] += Velocity.y[eid] * delta * speedMultiplier;

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
  };
}
