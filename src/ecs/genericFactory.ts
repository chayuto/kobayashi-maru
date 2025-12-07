/**
 * Generic Entity Factory for Kobayashi Maru
 * Creates entities from templates using a configuration-driven approach.
 * This reduces code duplication and makes adding new entity types easier.
 */
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Faction, SpriteRef, Health, Shield, AIBehavior, EnemyWeapon } from './components';
import { getEnemyTemplate, EnemyShipTemplate } from './entityTemplates';
import type { GameWorld } from './world';
import { incrementEntityCount } from './world';

// Placeholder sprite index - will be replaced when sprite system is implemented
const PLACEHOLDER_SPRITE_INDEX = 0;

/**
 * Creates an enemy ship from a template.
 * This is the preferred way to create enemy entities - it uses configuration
 * data instead of hard-coded values.
 * 
 * @param world - The ECS world
 * @param factionId - The faction ID (determines which template to use)
 * @param x - X spawn position
 * @param y - Y spawn position
 * @returns Entity ID, or -1 if the faction has no template
 * 
 * @example
 * ```typescript
 * // Create a Klingon ship at position (100, 200)
 * const eid = createEnemy(world, FactionId.KLINGON, 100, 200);
 * 
 * // Create a Borg ship at random position
 * const eid = createEnemy(world, FactionId.BORG, Math.random() * 1920, 0);
 * ```
 */
export function createEnemy(
    world: GameWorld,
    factionId: number,
    x: number,
    y: number
): number {
    const template = getEnemyTemplate(factionId);

    if (!template) {
        console.warn(`No enemy template found for faction ID: ${factionId}`);
        return -1;
    }

    return createEnemyFromTemplate(world, template, x, y);
}

/**
 * Creates an enemy ship from a specific template.
 * Useful when you have the template object directly.
 * 
 * @param world - The ECS world
 * @param template - The enemy ship template
 * @param x - X spawn position
 * @param y - Y spawn position
 * @returns Entity ID
 */
export function createEnemyFromTemplate(
    world: GameWorld,
    template: EnemyShipTemplate,
    x: number,
    y: number
): number {
    const eid = addEntity(world);

    // Position component
    addComponent(world, Position, eid);
    Position.x[eid] = x;
    Position.y[eid] = y;

    // Velocity component (starts stationary)
    addComponent(world, Velocity, eid);
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    // Faction component
    addComponent(world, Faction, eid);
    Faction.id[eid] = template.factionId;

    // Sprite component
    addComponent(world, SpriteRef, eid);
    SpriteRef.index[eid] = PLACEHOLDER_SPRITE_INDEX;

    // Health component
    addComponent(world, Health, eid);
    Health.current[eid] = template.health;
    Health.max[eid] = template.health;

    // Shield component
    addComponent(world, Shield, eid);
    Shield.current[eid] = template.shield;
    Shield.max[eid] = template.shield;

    // AI Behavior component (if template has AI config)
    if (template.ai) {
        addComponent(world, AIBehavior, eid);
        AIBehavior.behaviorType[eid] = template.ai.behaviorType;
        AIBehavior.aggression[eid] = template.ai.aggression;
        AIBehavior.stateTimer[eid] = 0;
    }

    // Enemy Weapon component (if template has weapon config)
    if (template.weapon) {
        addComponent(world, EnemyWeapon, eid);
        EnemyWeapon.range[eid] = template.weapon.range;
        EnemyWeapon.fireRate[eid] = template.weapon.fireRate;
        EnemyWeapon.damage[eid] = template.weapon.damage;
        EnemyWeapon.lastFired[eid] = 0;
        EnemyWeapon.projectileType[eid] = template.weapon.projectileType;
    }

    incrementEntityCount();
    return eid;
}

/**
 * Creates multiple enemies of the same type at specified positions.
 * Useful for wave spawning.
 * 
 * @param world - The ECS world
 * @param factionId - The faction ID for all enemies
 * @param positions - Array of {x, y} positions
 * @returns Array of entity IDs
 */
export function createEnemies(
    world: GameWorld,
    factionId: number,
    positions: Array<{ x: number; y: number }>
): number[] {
    return positions.map(pos => createEnemy(world, factionId, pos.x, pos.y));
}
