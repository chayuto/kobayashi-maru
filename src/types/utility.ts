/**
 * Utility Types for Kobayashi Maru
 *
 * Domain-specific utility types for improved type safety and AI agent compatibility.
 * These types help prevent logical errors at compile time and make code self-documenting.
 *
 * @module types/utility
 */

// =============================================================================
// EXHAUSTIVE PATTERN MATCHING
// =============================================================================

/**
 * Utility function for exhaustive pattern matching in switch statements.
 *
 * Use in the default case of switch statements on union types to ensure
 * all cases are handled. If a new value is added to the union, TypeScript
 * will emit a compile error at the assertNever call.
 *
 * @param value - The value that should never reach this point
 * @throws Error if called at runtime (indicates incomplete switch)
 *
 * @example
 * ```typescript
 * type Status = 'pending' | 'active' | 'completed';
 *
 * function handleStatus(status: Status): void {
 *   switch (status) {
 *     case 'pending':
 *       // handle pending
 *       break;
 *     case 'active':
 *       // handle active
 *       break;
 *     case 'completed':
 *       // handle completed
 *       break;
 *     default:
 *       // If a new status is added, this causes a compile error
 *       assertNever(status);
 *   }
 * }
 * ```
 */
export function assertNever(value: never): never {
    throw new Error(`Unexpected value: ${value}`);
}

// =============================================================================
// BRANDED TYPES FOR ENTITY IDS
// =============================================================================

/**
 * Base branded type for all entity IDs.
 * Prevents accidental mixing of entity IDs with plain numbers.
 */
export type EntityId = number & { readonly __brand: 'EntityId' };

/**
 * Branded type for enemy entity IDs.
 * Use this type for functions that specifically operate on enemies.
 */
export type EnemyId = EntityId & { readonly __enemyBrand: 'EnemyId' };

/**
 * Branded type for turret entity IDs.
 * Use this type for functions that specifically operate on turrets.
 */
export type TurretId = EntityId & { readonly __turretBrand: 'TurretId' };

/**
 * Branded type for projectile entity IDs.
 * Use this type for functions that specifically operate on projectiles.
 */
export type ProjectileId = EntityId & { readonly __projectileBrand: 'ProjectileId' };

// =============================================================================
// TYPE UTILITIES
// =============================================================================

/**
 * Make specific properties required in a type.
 *
 * @example
 * ```typescript
 * interface Config {
 *   name?: string;
 *   value?: number;
 * }
 * type RequiredName = WithRequired<Config, 'name'>;
 * // { name: string; value?: number }
 * ```
 */
export type WithRequired<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make all properties of an object and nested objects readonly.
 *
 * @example
 * ```typescript
 * const config: DeepReadonly<{ nested: { value: number } }> = { nested: { value: 1 } };
 * // config.nested.value = 2; // Error: Cannot assign to 'value'
 * ```
 */
export type DeepReadonly<T> = {
    readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};
