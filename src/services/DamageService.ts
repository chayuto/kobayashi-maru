/**
 * Damage Service for Kobayashi Maru
 * 
 * Centralized damage application logic. This service handles damage calculation
 * with proper shield/health prioritization, eliminating code duplication across
 * combat, projectile, and enemy projectile systems.
 * 
 * ## Damage Flow
 * 1. Check if entity has shields
 * 2. Apply damage to shields first
 * 3. Remaining damage goes to health
 * 4. Return total damage dealt (for stats tracking)
 * 
 * @module services/DamageService
 * 
 * @example
 * ```typescript
 * import { applyDamage } from '../services/DamageService';
 * 
 * const actualDamage = applyDamage(world, targetEid, 50);
 * if (actualDamage > 0) {
 *   recordHit(actualDamage);
 * }
 * ```
 */
import { hasComponent, World } from 'bitecs';
import { Health, Shield } from '../ecs/components';

/**
 * Result of applying damage to an entity.
 */
export interface DamageResult {
    /** Total damage actually dealt */
    totalDamage: number;
    /** Damage absorbed by shields */
    shieldDamage: number;
    /** Damage dealt to health */
    healthDamage: number;
    /** Whether the entity was killed */
    killed: boolean;
}

/**
 * Applies damage to an entity, prioritizing shields over health.
 * 
 * This is the core damage function used by all combat systems.
 * Shields absorb damage first, then remaining damage goes to health.
 * 
 * @param world - The ECS world
 * @param entityId - Target entity ID
 * @param damage - Amount of damage to apply
 * @returns Total damage actually dealt (useful for stats)
 * 
 * @example
 * ```typescript
 * // Simple usage
 * const dealt = applyDamage(world, enemyEid, 25);
 * 
 * // Check if target was killed
 * if (Health.current[enemyEid] <= 0) {
 *   handleDeath(enemyEid);
 * }
 * ```
 */
export function applyDamage(world: World, entityId: number, damage: number): number {
    let totalDamageDealt = 0;

    // Apply damage to shields first if entity has Shield component
    if (hasComponent(world, entityId, Shield)) {
        const currentShield = Shield.current[entityId];
        if (currentShield > 0) {
            const shieldDamage = Math.min(currentShield, damage);
            Shield.current[entityId] = currentShield - shieldDamage;
            damage -= shieldDamage;
            totalDamageDealt += shieldDamage;
        }
    }

    // Apply remaining damage to health
    if (damage > 0 && hasComponent(world, entityId, Health)) {
        const currentHealth = Health.current[entityId];
        const healthDamage = Math.min(currentHealth, damage);
        Health.current[entityId] = currentHealth - healthDamage;
        totalDamageDealt += healthDamage;
    }

    return totalDamageDealt;
}

/**
 * Applies damage and returns detailed result information.
 * 
 * Use this when you need to know the breakdown of damage dealt
 * or whether the entity was killed.
 * 
 * @param world - The ECS world
 * @param entityId - Target entity ID
 * @param damage - Amount of damage to apply
 * @returns Detailed damage result
 * 
 * @example
 * ```typescript
 * const result = applyDamageDetailed(world, enemyEid, 50);
 * if (result.killed) {
 *   playDeathAnimation(enemyEid);
 * }
 * console.log(`Dealt ${result.shieldDamage} shield, ${result.healthDamage} health`);
 * ```
 */
export function applyDamageDetailed(world: World, entityId: number, damage: number): DamageResult {
    let shieldDamage = 0;
    let healthDamage = 0;
    let remainingDamage = damage;

    // Apply damage to shields first
    if (hasComponent(world, entityId, Shield)) {
        const currentShield = Shield.current[entityId];
        if (currentShield > 0) {
            shieldDamage = Math.min(currentShield, remainingDamage);
            Shield.current[entityId] = currentShield - shieldDamage;
            remainingDamage -= shieldDamage;
        }
    }

    // Apply remaining damage to health
    if (remainingDamage > 0 && hasComponent(world, entityId, Health)) {
        const currentHealth = Health.current[entityId];
        healthDamage = Math.min(currentHealth, remainingDamage);
        Health.current[entityId] = currentHealth - healthDamage;
    }

    const killed = hasComponent(world, entityId, Health) && Health.current[entityId] <= 0;

    return {
        totalDamage: shieldDamage + healthDamage,
        shieldDamage,
        healthDamage,
        killed
    };
}
