/**
 * System Context Interface
 * Defines the standardized context passed to all ECS systems.
 * 
 * @module types/interfaces/ISystemContext
 */

import type { ServiceContainer } from '../../core/services/ServiceContainer';

/**
 * Context passed to all ECS systems during execution.
 * Provides consistent access to timing and services.
 * 
 * @example
 * ```typescript
 * function movementSystem(world: World, context: SystemContext): World {
 *   const { delta, gameTime, services } = context;
 *   // Process entities using delta time
 *   return world;
 * }
 * ```
 */
export interface SystemContext {
  /**
   * Time delta since last frame in seconds
   */
  delta: number;

  /**
   * Total game time elapsed in seconds
   */
  gameTime: number;

  /**
   * Service container for accessing game services
   * Optional to allow systems to be tested without full DI setup
   */
  services?: ServiceContainer;
}

/**
 * Standard ECS system function signature
 * All systems should conform to this unified signature for consistency.
 * 
 * @example
 * ```typescript
 * const movementSystem: ECSSystem = (world, context) => {
 *   for (const eid of movementQuery(world)) {
 *     Position.x[eid] += Velocity.x[eid] * context.delta;
 *     Position.y[eid] += Velocity.y[eid] * context.delta;
 *   }
 *   return world;
 * };
 * ```
 */
export type ECSSystem = (world: unknown, context: SystemContext) => unknown;

/**
 * System registration options
 */
export interface SystemRegistrationOptions {
  /**
   * Whether this system requires delta time (default: true)
   */
  requiresDelta?: boolean;

  /**
   * Whether this system requires game time (default: false)
   */
  requiresGameTime?: boolean;

  /**
   * Whether this system requires access to services (default: false)
   */
  requiresServices?: boolean;
}
