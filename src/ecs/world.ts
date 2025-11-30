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

/**
 * Create a new ECS world
 * @returns A new bitecs world instance
 */
export function createGameWorld(): IWorld {
  return createWorld();
}

export type GameWorld = IWorld;

/**
 * Gets the current entity count in the world
 * Note: bitECS tracks entities internally, we use a simple approach
 * by checking the world's entitySparseSet size
 * @param world - The ECS world
 * @returns Number of active entities
 */
export function getEntityCount(world: GameWorld): number {
  // bitECS stores entity count in world.entitySparseSet.dense.length
  // We access it safely through the world object
  const worldObj = world as unknown as { entitySparseSet?: { dense?: number[] } };
  return worldObj.entitySparseSet?.dense?.length ?? 0;
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
