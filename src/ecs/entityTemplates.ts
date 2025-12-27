/**
 * Entity Templates for Kobayashi Maru
 * Configuration-driven entity creation - reduces code duplication and makes
 * adding new entity types easier for AI coding assistants.
 * 
 * Templates provide a data-driven approach to entity creation:
 * - Enemy templates define faction-specific ships with AI and weapons
 * - Turret templates define defensive weapons with upgrades
 * - Projectile templates define ammunition properties
 * 
 * @example
 * ```typescript
 * // Create enemy from template
 * const enemy = createEnemy(world, FactionId.KLINGON, x, y);
 * 
 * // Get turret template for configuration
 * const turretTemplate = getTurretTemplate(TurretType.PHASER_ARRAY);
 * ```
 * 
 * @module ecs/entityTemplates
 */
import { FactionId, AIBehaviorType, ProjectileType, TurretType, TURRET_CONFIG, PROJECTILE_CONFIG } from '../types/constants';

/**
 * Configuration for enemy ship AI behavior.
 */
export interface AIConfig {
    behaviorType: number;
    aggression: number;
}

/**
 * Configuration for enemy weapons (optional).
 */
export interface WeaponConfig {
    range: number;
    fireRate: number;
    damage: number;
    projectileType: number;
}

/**
 * Complete enemy ship template.
 */
export interface EnemyShipTemplate {
    /** Display name for debugging */
    name: string;
    /** Faction ID */
    factionId: number;
    /** Health points */
    health: number;
    /** Shield points */
    shield: number;
    /** AI behavior configuration */
    ai: AIConfig;
    /** Optional weapon configuration (some enemies shoot projectiles) */
    weapon?: WeaponConfig;
}

/**
 * Enemy ship templates indexed by faction ID.
 * To add a new enemy type:
 * 1. Add a new FactionId in constants.ts
 * 2. Add a new entry here with the template
 * 3. The createEnemy() function will automatically support it
 */
export const ENEMY_TEMPLATES: Record<number, EnemyShipTemplate> = {
    [FactionId.KLINGON]: {
        name: 'Klingon Bird of Prey',
        factionId: FactionId.KLINGON,
        health: 80,
        shield: 30,
        ai: {
            behaviorType: AIBehaviorType.DIRECT,
            aggression: 1.0,
        },
    },

    [FactionId.ROMULAN]: {
        name: 'Romulan Warbird',
        factionId: FactionId.ROMULAN,
        health: 70,
        shield: 60,
        ai: {
            behaviorType: AIBehaviorType.STRAFE,
            aggression: 0.6,
        },
    },

    [FactionId.BORG]: {
        name: 'Borg Cube',
        factionId: FactionId.BORG,
        health: 160,
        shield: 110,
        ai: {
            behaviorType: AIBehaviorType.SWARM,
            aggression: 0.8,
        },
    },

    [FactionId.THOLIAN]: {
        name: 'Tholian Vessel',
        factionId: FactionId.THOLIAN,
        health: 60,
        shield: 40,
        ai: {
            behaviorType: AIBehaviorType.ORBIT,
            aggression: 0.5,
        },
        weapon: {
            range: 350,
            fireRate: 0.5,
            damage: 15,
            projectileType: ProjectileType.DISRUPTOR_BOLT,
        },
    },

    [FactionId.SPECIES_8472]: {
        name: 'Species 8472 Bioship',
        factionId: FactionId.SPECIES_8472,
        health: 220,
        shield: 0,
        ai: {
            behaviorType: AIBehaviorType.HUNTER,
            aggression: 1.0,
        },
    },

    [FactionId.FEDERATION]: {
        name: 'Federation Ship',
        factionId: FactionId.FEDERATION,
        health: 100,
        shield: 50,
        ai: {
            behaviorType: AIBehaviorType.DIRECT,
            aggression: 0.5,
        },
    },
};

/**
 * Get an enemy template by faction ID.
 * @param factionId - The faction ID to look up
 * @returns The enemy template, or undefined if not found
 */
export function getEnemyTemplate(factionId: number): EnemyShipTemplate | undefined {
    return ENEMY_TEMPLATES[factionId];
}

/**
 * Get all available enemy faction IDs.
 * Useful for wave generation and spawning.
 * @returns Array of faction IDs that have enemy templates
 */
export function getEnemyFactionIds(): number[] {
    return Object.keys(ENEMY_TEMPLATES).map(Number);
}

// =============================================================================
// TURRET TEMPLATES
// =============================================================================

/**
 * Configuration for weapon properties (status effects, multipliers).
 */
export interface WeaponPropertiesConfig {
    /** Damage multiplier vs shields (default 1.0) */
    shieldDamageMultiplier: number;
    /** Damage multiplier vs hull (default 1.0) */
    hullDamageMultiplier: number;
    /** Critical hit chance 0.0-1.0 */
    critChance: number;
    /** Critical damage multiplier (default 2.0) */
    critMultiplier: number;
    /** AOE explosion radius (0 = no AOE) */
    aoeRadius: number;
    /** Status effect type: 0=none, 1=burn, 2=slow, 3=drain, 4=disable */
    statusEffectType: number;
    /** Chance to apply status 0.0-1.0 */
    statusEffectChance: number;
}

/**
 * Complete turret template.
 * Combines base stats from TURRET_CONFIG with optional weapon properties.
 */
export interface TurretTemplate {
    /** Turret type identifier */
    type: number;
    /** Display name */
    name: string;
    /** Description text */
    description: string;
    /** Maximum targeting distance in pixels */
    range: number;
    /** Shots per second */
    fireRate: number;
    /** Damage dealt per shot */
    damage: number;
    /** Resource cost to build */
    cost: number;
    /** Turret health points */
    health: number;
    /** Turret shield points */
    shield: number;
    /** Special effect description */
    special?: string;
    /** Optional weapon properties for special turrets */
    weaponProperties?: WeaponPropertiesConfig;
}

/**
 * Turret templates indexed by turret type.
 * Built from TURRET_CONFIG with additional weapon properties.
 */
export const TURRET_TEMPLATES: Record<number, TurretTemplate> = {
    [TurretType.PHASER_ARRAY]: {
        type: TurretType.PHASER_ARRAY,
        ...TURRET_CONFIG[TurretType.PHASER_ARRAY],
    },
    [TurretType.TORPEDO_LAUNCHER]: {
        type: TurretType.TORPEDO_LAUNCHER,
        ...TURRET_CONFIG[TurretType.TORPEDO_LAUNCHER],
    },
    [TurretType.DISRUPTOR_BANK]: {
        type: TurretType.DISRUPTOR_BANK,
        ...TURRET_CONFIG[TurretType.DISRUPTOR_BANK],
    },
    [TurretType.TETRYON_BEAM]: {
        type: TurretType.TETRYON_BEAM,
        ...TURRET_CONFIG[TurretType.TETRYON_BEAM],
        weaponProperties: {
            shieldDamageMultiplier: 3.0,
            hullDamageMultiplier: 0.5,
            critChance: 0,
            critMultiplier: 1.0,
            aoeRadius: 0,
            statusEffectType: 0,
            statusEffectChance: 0,
        },
    },
    [TurretType.PLASMA_CANNON]: {
        type: TurretType.PLASMA_CANNON,
        ...TURRET_CONFIG[TurretType.PLASMA_CANNON],
        weaponProperties: {
            shieldDamageMultiplier: 1.0,
            hullDamageMultiplier: 1.0,
            critChance: 0,
            critMultiplier: 1.0,
            aoeRadius: 0,
            statusEffectType: 1, // Burn
            statusEffectChance: 1.0,
        },
    },
    [TurretType.POLARON_BEAM]: {
        type: TurretType.POLARON_BEAM,
        ...TURRET_CONFIG[TurretType.POLARON_BEAM],
        weaponProperties: {
            shieldDamageMultiplier: 1.0,
            hullDamageMultiplier: 1.0,
            critChance: 0,
            critMultiplier: 1.0,
            aoeRadius: 0,
            statusEffectType: 3, // Drain
            statusEffectChance: 1.0,
        },
    },
};

/**
 * Get a turret template by turret type.
 * @param turretType - The turret type to look up
 * @returns The turret template, or undefined if not found
 */
export function getTurretTemplate(turretType: number): TurretTemplate | undefined {
    return TURRET_TEMPLATES[turretType];
}

/**
 * Get all available turret types.
 * @returns Array of turret type IDs that have templates
 */
export function getTurretTypes(): number[] {
    return Object.keys(TURRET_TEMPLATES).map(Number);
}

// =============================================================================
// PROJECTILE TEMPLATES
// =============================================================================

/**
 * Complete projectile template.
 */
export interface ProjectileTemplate {
    /** Projectile type identifier */
    type: number;
    /** Movement speed in pixels per second */
    speed: number;
    /** Seconds before auto-despawn */
    lifetime: number;
    /** Collision radius in pixels */
    size: number;
    /** Visual color */
    color: number;
    /** Whether projectile homes toward target */
    homing: boolean;
}

/**
 * Projectile templates indexed by projectile type.
 * Built from PROJECTILE_CONFIG with additional properties.
 */
export const PROJECTILE_TEMPLATES: Record<number, ProjectileTemplate> = {
    [ProjectileType.PHOTON_TORPEDO]: {
        type: ProjectileType.PHOTON_TORPEDO,
        ...PROJECTILE_CONFIG[ProjectileType.PHOTON_TORPEDO],
        homing: true,
    },
    [ProjectileType.QUANTUM_TORPEDO]: {
        type: ProjectileType.QUANTUM_TORPEDO,
        ...PROJECTILE_CONFIG[ProjectileType.QUANTUM_TORPEDO],
        homing: true,
    },
    [ProjectileType.DISRUPTOR_BOLT]: {
        type: ProjectileType.DISRUPTOR_BOLT,
        ...PROJECTILE_CONFIG[ProjectileType.DISRUPTOR_BOLT],
        homing: false,
    },
};

/**
 * Get a projectile template by projectile type.
 * @param projectileType - The projectile type to look up
 * @returns The projectile template, or undefined if not found
 */
export function getProjectileTemplate(projectileType: number): ProjectileTemplate | undefined {
    return PROJECTILE_TEMPLATES[projectileType];
}

/**
 * Get all available projectile types.
 * @returns Array of projectile type IDs that have templates
 */
export function getProjectileTypes(): number[] {
    return Object.keys(PROJECTILE_TEMPLATES).map(Number);
}
