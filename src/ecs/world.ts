/**
 * ECS World setup for Kobayashi Maru
 * Creates and manages the bitecs world
 */
import { createWorld, IWorld } from 'bitecs';
import {
  createFederationShip,
  createKlingonShip,
  createRomulanShip,
  createBorgShip,
  createTholianShip,
  createSpecies8472Ship,
  createKobayashiMaru
} from './entityFactory';

// Track entity count externally for reliability
let entityCounter = 0;

/**
 * Create a new ECS world
 * @returns A new bitecs world instance
 */
export function createGameWorld(): IWorld {
  entityCounter = 0;
  return createWorld();
}

export type GameWorld = IWorld;

/**
 * Increments the entity counter (called when entities are created)
 */
export function incrementEntityCount(): void {
  entityCounter++;
}

/**
 * Decrements the entity counter (called when entities are removed)
 */
export function decrementEntityCount(): void {
  entityCounter--;
}

/**
 * Gets the current entity count in the world
 * @returns Number of active entities
 */
export function getEntityCount(): number {
  return entityCounter;
}

// Re-export entity creation utilities
export {
  createFederationShip,
  createKlingonShip,
  createRomulanShip,
  createBorgShip,
  createTholianShip,
  createSpecies8472Ship,
  createKobayashiMaru
};
