/**
 * Entity Factory Interface
 * Defines the standardized contract for entity creation and lifecycle management.
 * 
 * @module types/interfaces/IEntityFactory
 */

import type { GameWorld } from '../../ecs/world';

/**
 * Base configuration for entity creation
 */
export interface EntityConfig {
  /** X spawn position */
  x: number;
  /** Y spawn position */
  y: number;
}

/**
 * Enemy entity configuration
 */
export interface EnemyConfig extends EntityConfig {
  /** Faction ID for the enemy */
  factionId: number;
}

/**
 * Turret entity configuration
 */
export interface TurretConfig extends EntityConfig {
  /** Type of turret to create */
  turretType: number;
}

/**
 * Projectile entity configuration
 */
export interface ProjectileConfig extends EntityConfig {
  /** Target X position */
  targetX: number;
  /** Target Y position */
  targetY: number;
  /** Damage to deal on impact */
  damage: number;
  /** Type of projectile */
  projectileType: number;
  /** Optional target entity ID for homing projectiles */
  targetEntityId?: number;
}

/**
 * Generic Entity Factory Interface
 * Provides a standardized way to create, recycle, and reset entities.
 * 
 * @template T - The configuration type for this factory
 * 
 * @example
 * ```typescript
 * const enemyFactory: IEntityFactory<EnemyConfig> = {
 *   create: (world, config) => createEnemy(world, config.factionId, config.x, config.y),
 *   recycle: (world, entity) => PoolManager.getInstance().releaseEnemy(entity),
 *   reset: (entity) => resetEntityComponents(entity)
 * };
 * ```
 */
export interface IEntityFactory<T extends EntityConfig> {
  /**
   * Creates a new entity from configuration.
   * 
   * Note: Returns -1 on failure following bitECS convention where entity IDs
   * are always positive integers. This convention is used throughout the codebase
   * for consistency with ECS patterns.
   * 
   * @param world - The ECS world
   * @param config - Entity configuration
   * @returns Entity ID (positive integer), or -1 if creation failed
   */
  create(world: GameWorld, config: T): number;

  /**
   * Recycles an entity back to the pool
   * @param world - The ECS world
   * @param entity - Entity ID to recycle
   */
  recycle(world: GameWorld, entity: number): void;

  /**
   * Resets an entity's components to default values
   * Used when recycling entities from a pool
   * @param entity - Entity ID to reset
   */
  reset(entity: number): void;
}

/**
 * Batch entity creation interface
 * For creating multiple entities of the same type efficiently
 */
export interface IBatchEntityFactory<T extends EntityConfig> extends IEntityFactory<T> {
  /**
   * Creates multiple entities from configurations
   * @param world - The ECS world
   * @param configs - Array of entity configurations
   * @returns Array of entity IDs
   */
  createBatch(world: GameWorld, configs: T[]): number[];
}
