/**
 * ECS World setup for Kobayashi Maru
 * Creates and manages the bitecs world
 */
import { createWorld, IWorld } from 'bitecs';

/**
 * Create a new ECS world
 * @returns A new bitecs world instance
 */
export function createGameWorld(): IWorld {
  return createWorld();
}

export type GameWorld = IWorld;
