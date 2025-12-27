/**
 * Component Validation for Kobayashi Maru
 * 
 * Development-time validation to catch invalid component states early.
 * These checks only run in development mode to avoid production overhead.
 * 
 * @example
 * ```typescript
 * // Validate entity after creation
 * if (import.meta.env.DEV) {
 *     const result = validateEntity(world, entityId);
 *     if (!result.valid) {
 *         console.warn('Validation errors:', result.errors);
 *     }
 * }
 * ```
 * 
 * @module ecs/componentValidation
 */
import { hasComponent, type World } from 'bitecs';
import {
    Position,
    Velocity,
    Health,
    Shield,
    Turret,
    Projectile,
    AIBehavior,
    Collider,
} from './components';
import { GAME_CONFIG, TURRET_CONFIG, AIBehaviorType } from '../types/constants';

// =============================================================================
// VALIDATION TYPES
// =============================================================================

/**
 * Result of entity validation.
 */
export interface ValidationResult {
    /** Whether all validations passed */
    valid: boolean;
    /** List of validation errors */
    errors: string[];
    /** List of validation warnings (non-critical issues) */
    warnings: string[];
}

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validate Position component values.
 * Checks that position is within reasonable world bounds.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validatePosition(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const x = Position.x[eid];
    const y = Position.y[eid];
    
    // Allow some margin outside world bounds for spawning/despawning
    const margin = 200;
    const minX = -margin;
    const maxX = GAME_CONFIG.WORLD_WIDTH + margin;
    const minY = -margin;
    const maxY = GAME_CONFIG.WORLD_HEIGHT + margin;
    
    if (x < minX || x > maxX) {
        errors.push(`Position.x out of bounds: ${x} (valid: ${minX} to ${maxX})`);
    }
    if (y < minY || y > maxY) {
        errors.push(`Position.y out of bounds: ${y} (valid: ${minY} to ${maxY})`);
    }
    
    // Check for NaN
    if (isNaN(x)) {
        errors.push('Position.x is NaN');
    }
    if (isNaN(y)) {
        errors.push('Position.y is NaN');
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate Velocity component values.
 * Checks for reasonable speed values.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateVelocity(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const vx = Velocity.x[eid];
    const vy = Velocity.y[eid];
    
    // Maximum reasonable velocity (pixels per second)
    const maxSpeed = 2000;
    
    if (isNaN(vx)) {
        errors.push('Velocity.x is NaN');
    }
    if (isNaN(vy)) {
        errors.push('Velocity.y is NaN');
    }
    
    const speed = Math.sqrt(vx * vx + vy * vy);
    if (speed > maxSpeed) {
        warnings.push(`Velocity unusually high: ${speed.toFixed(0)} px/s`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate Health component values.
 * Checks that health is non-negative and <= max.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateHealth(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const current = Health.current[eid];
    const max = Health.max[eid];
    
    if (isNaN(current)) {
        errors.push('Health.current is NaN');
    }
    if (isNaN(max)) {
        errors.push('Health.max is NaN');
    }
    
    if (current < 0) {
        errors.push(`Health.current is negative: ${current}`);
    }
    if (max <= 0) {
        errors.push(`Health.max must be positive: ${max}`);
    }
    if (current > max) {
        warnings.push(`Health.current exceeds max: ${current} > ${max}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate Shield component values.
 * Checks that shield is non-negative and <= max.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateShield(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const current = Shield.current[eid];
    const max = Shield.max[eid];
    
    if (isNaN(current)) {
        errors.push('Shield.current is NaN');
    }
    if (isNaN(max)) {
        errors.push('Shield.max is NaN');
    }
    
    if (current < 0) {
        errors.push(`Shield.current is negative: ${current}`);
    }
    if (max < 0) {
        errors.push(`Shield.max is negative: ${max}`);
    }
    if (current > max) {
        warnings.push(`Shield.current exceeds max: ${current} > ${max}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate Turret component values.
 * Checks that turret type is valid.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateTurret(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const turretType = Turret.turretType[eid];
    const range = Turret.range[eid];
    const fireRate = Turret.fireRate[eid];
    const damage = Turret.damage[eid];
    
    if (!(turretType in TURRET_CONFIG)) {
        errors.push(`Invalid turret type: ${turretType}`);
    }
    
    if (range <= 0) {
        errors.push(`Turret.range must be positive: ${range}`);
    }
    if (fireRate <= 0) {
        errors.push(`Turret.fireRate must be positive: ${fireRate}`);
    }
    if (damage < 0) {
        errors.push(`Turret.damage cannot be negative: ${damage}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate Projectile component values.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateProjectile(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const damage = Projectile.damage[eid];
    const speed = Projectile.speed[eid];
    const lifetime = Projectile.lifetime[eid];
    
    if (isNaN(damage)) {
        errors.push('Projectile.damage is NaN');
    }
    if (damage < 0) {
        errors.push(`Projectile.damage cannot be negative: ${damage}`);
    }
    
    if (speed <= 0) {
        errors.push(`Projectile.speed must be positive: ${speed}`);
    }
    
    if (lifetime <= 0) {
        warnings.push(`Projectile.lifetime should be positive: ${lifetime}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate AIBehavior component values.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateAIBehavior(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const behaviorType = AIBehavior.behaviorType[eid];
    const aggression = AIBehavior.aggression[eid];
    
    const validBehaviors = Object.values(AIBehaviorType) as number[];
    if (!validBehaviors.includes(behaviorType)) {
        errors.push(`Invalid AI behavior type: ${behaviorType}`);
    }
    
    if (aggression < 0 || aggression > 1) {
        warnings.push(`AIBehavior.aggression should be 0.0-1.0: ${aggression}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

/**
 * Validate Collider component values.
 * 
 * @param eid - Entity ID
 * @returns Validation result
 */
export function validateCollider(eid: number): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    const radius = Collider.radius[eid];
    
    if (radius <= 0) {
        errors.push(`Collider.radius must be positive: ${radius}`);
    }
    if (radius > 500) {
        warnings.push(`Collider.radius unusually large: ${radius}`);
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}

// =============================================================================
// ENTITY VALIDATION
// =============================================================================

/**
 * Validate all components of an entity.
 * Only validates components that are present.
 * 
 * @param world - The ECS world
 * @param eid - Entity ID to validate
 * @returns Combined validation result
 * 
 * @example
 * ```typescript
 * if (import.meta.env.DEV) {
 *     const result = validateEntity(world, newEntity);
 *     if (!result.valid) {
 *         console.warn('Entity validation failed:', result.errors);
 *     }
 * }
 * ```
 */
export function validateEntity(world: World, eid: number): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];
    
    // Validate each component if present
    if (hasComponent(world, eid, Position)) {
        const result = validatePosition(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, Velocity)) {
        const result = validateVelocity(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, Health)) {
        const result = validateHealth(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, Shield)) {
        const result = validateShield(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, Turret)) {
        const result = validateTurret(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, Projectile)) {
        const result = validateProjectile(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, AIBehavior)) {
        const result = validateAIBehavior(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    if (hasComponent(world, eid, Collider)) {
        const result = validateCollider(eid);
        allErrors.push(...result.errors);
        allWarnings.push(...result.warnings);
    }
    
    return {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings,
    };
}

/**
 * Validate entity and log results in development mode.
 * 
 * @param world - The ECS world
 * @param eid - Entity ID to validate
 * @param entityType - Optional entity type name for better error messages
 * @returns Whether entity is valid
 */
export function validateEntityWithLogging(
    world: World,
    eid: number,
    entityType?: string
): boolean {
    // Skip validation in production
    if (!import.meta.env.DEV) {
        return true;
    }
    
    const result = validateEntity(world, eid);
    
    if (!result.valid) {
        const prefix = entityType ? `${entityType} entity ${eid}` : `Entity ${eid}`;
        console.warn(`${prefix} validation failed:`, result.errors);
    }
    
    if (result.warnings.length > 0) {
        const prefix = entityType ? `${entityType} entity ${eid}` : `Entity ${eid}`;
        console.debug(`${prefix} validation warnings:`, result.warnings);
    }
    
    return result.valid;
}
