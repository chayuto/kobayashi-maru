/**
 * Entity Templates for Kobayashi Maru
 * Configuration-driven entity creation - reduces code duplication and makes
 * adding new entity types easier for AI coding assistants.
 */
import { FactionId, AIBehaviorType, ProjectileType } from '../types/constants';

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
