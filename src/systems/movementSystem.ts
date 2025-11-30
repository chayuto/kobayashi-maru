/**
 * Movement System for Kobayashi Maru
 * A bitECS system that applies velocity to position each frame
 */
import { defineQuery, defineSystem, IWorld } from 'bitecs';
import { Position, Velocity } from '../ecs/components';
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
      
      // Boundary handling - wrap around to opposite edge
      let x = Position.x[eid];
      let y = Position.y[eid];
      
      // Wrap horizontally
      if (x < 0) {
        x = worldWidth + (x % worldWidth);
      } else if (x >= worldWidth) {
        x = x % worldWidth;
      }
      
      // Wrap vertically
      if (y < 0) {
        y = worldHeight + (y % worldHeight);
      } else if (y >= worldHeight) {
        y = y % worldHeight;
      }
      
      Position.x[eid] = x;
      Position.y[eid] = y;
    }
    
    return world;
  });
}
