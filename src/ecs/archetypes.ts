/**
 * Entity Archetypes for Kobayashi Maru
 * 
 * Archetypes define which components each entity type requires.
 * Used for documentation, validation, and ensuring entity consistency.
 * 
 * @example
 * ```typescript
 * // Validate entity matches archetype
 * const isValid = validateArchetype(world, entityId, ARCHETYPES.ENEMY);
 * 
 * // Check required components
 * console.log(ARCHETYPES.TURRET.required);
 * ```
 * 
 * @module ecs/archetypes
 */
import { hasComponent, type World } from 'bitecs';
import {
    Position,
    Velocity,
    Rotation,
    Faction,
    SpriteRef,
    CompositeSpriteRef,
    Health,
    Shield,
    Collider,
    AIBehavior,
    EnemyWeapon,
    Projectile,
    Target,
    Turret,
    TurretUpgrade,
    WeaponProperties,
    EnemyVariant,
    SpecialAbility,
} from './components';

// =============================================================================
// ARCHETYPE TYPES
// =============================================================================

/**
 * Component type for archetype definitions.
 * Uses object with array properties as the component structure.
 */
type ComponentType = Record<string, number[]>;

/**
 * Entity archetype definition.
 * Describes which components an entity type must have and which are optional.
 */
export interface EntityArchetype {
    /** Human-readable name for the archetype */
    name: string;
    /** Description of what this entity type represents */
    description: string;
    /** Components that MUST be present on this entity type */
    required: ComponentType[];
    /** Components that MAY be present on this entity type */
    optional: ComponentType[];
}

// =============================================================================
// ARCHETYPE DEFINITIONS
// =============================================================================

/**
 * All entity archetypes in the game.
 * Used for documentation and validation.
 */
export const ARCHETYPES = {
    /**
     * Enemy archetype - hostile ships that attack the Kobayashi Maru.
     */
    ENEMY: {
        name: 'Enemy',
        description: 'Hostile ships that attack the Kobayashi Maru and player turrets',
        required: [
            Position,
            Velocity,
            Rotation,
            Faction,
            Health,
            Shield,
            AIBehavior,
            SpriteRef,
        ],
        optional: [
            Collider,
            EnemyWeapon,
            EnemyVariant,
            SpecialAbility,
        ],
    },

    /**
     * Turret archetype - player-placed defensive weapons.
     */
    TURRET: {
        name: 'Turret',
        description: 'Player-placed defensive weapons that automatically target enemies',
        required: [
            Position,
            Rotation,
            Faction,
            Health,
            Shield,
            Turret,
            Target,
            CompositeSpriteRef,
        ],
        optional: [
            Velocity,
            TurretUpgrade,
            WeaponProperties,
        ],
    },

    /**
     * Projectile archetype - moving ammunition from turrets.
     */
    PROJECTILE: {
        name: 'Projectile',
        description: 'Moving ammunition fired by turrets or enemies',
        required: [
            Position,
            Velocity,
            Rotation,
            Faction,
            Projectile,
            SpriteRef,
        ],
        optional: [
            Collider,
        ],
    },

    /**
     * Kobayashi Maru archetype - the central objective ship.
     */
    KOBAYASHI_MARU: {
        name: 'Kobayashi Maru',
        description: 'The civilian freighter at the center that must be defended',
        required: [
            Position,
            Velocity,
            Rotation,
            Faction,
            Health,
            Shield,
            Turret,
            Target,
            SpriteRef,
        ],
        optional: [],
    },
} as const satisfies Record<string, EntityArchetype>;

export type ArchetypeName = keyof typeof ARCHETYPES;

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validation result for archetype checking.
 */
export interface ArchetypeValidationResult {
    /** Whether all required components are present */
    valid: boolean;
    /** Names of missing required components */
    missingComponents: string[];
    /** Human-readable error messages */
    errors: string[];
}

/**
 * Get the display name of a component for error messages.
 */
function getComponentName(component: ComponentType): string {
    // Use the first property name as identifier
    const keys = Object.keys(component);
    if (keys.length === 0) return 'Unknown';
    
    // Map known component structures to names
    if ('x' in component && 'y' in component && !('radius' in component)) {
        if ('x' in component && Object.keys(component).length === 2) {
            return 'Position or Velocity';
        }
    }
    if ('current' in component && 'max' in component) {
        return 'Health or Shield';
    }
    if ('angle' in component) return 'Rotation';
    if ('id' in component) return 'Faction';
    if ('index' in component) return 'SpriteRef';
    if ('baseIndex' in component) return 'CompositeSpriteRef';
    if ('radius' in component) return 'Collider';
    if ('behaviorType' in component) return 'AIBehavior';
    if ('turretType' in component) return 'Turret';
    if ('entityId' in component) return 'Target';
    if ('projectileType' in component && 'damage' in component && 'speed' in component) return 'Projectile';
    if ('projectileType' in component && 'fireRate' in component) return 'EnemyWeapon';
    if ('damageLevel' in component) return 'TurretUpgrade';
    if ('shieldDamageMultiplier' in component) return 'WeaponProperties';
    if ('rank' in component) return 'EnemyVariant';
    if ('abilityType' in component) return 'SpecialAbility';
    
    return keys[0];
}

/**
 * Validate that an entity has all required components for an archetype.
 * 
 * @param world - The ECS world
 * @param eid - Entity ID to validate
 * @param archetype - The archetype to validate against
 * @returns Validation result with any missing components
 * 
 * @example
 * ```typescript
 * const result = validateArchetype(world, enemyId, ARCHETYPES.ENEMY);
 * if (!result.valid) {
 *     console.error('Missing components:', result.missingComponents);
 * }
 * ```
 */
export function validateArchetype(
    world: World,
    eid: number,
    archetype: EntityArchetype
): ArchetypeValidationResult {
    const missingComponents: string[] = [];
    const errors: string[] = [];

    for (const component of archetype.required) {
        if (!hasComponent(world, eid, component)) {
            const name = getComponentName(component);
            missingComponents.push(name);
            errors.push(`Entity ${eid} missing required component '${name}' for ${archetype.name}`);
        }
    }

    return {
        valid: missingComponents.length === 0,
        missingComponents,
        errors,
    };
}

/**
 * Validate an entity and log errors in development mode.
 * 
 * @param world - The ECS world
 * @param eid - Entity ID to validate
 * @param archetype - The archetype to validate against
 * @returns Whether the entity is valid
 */
export function validateArchetypeWithLogging(
    world: World,
    eid: number,
    archetype: EntityArchetype
): boolean {
    const result = validateArchetype(world, eid, archetype);
    
    if (!result.valid && import.meta.env.DEV) {
        console.warn(`Archetype validation failed for ${archetype.name}:`, result.errors);
    }
    
    return result.valid;
}
