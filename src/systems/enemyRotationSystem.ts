/**
 * Enemy Rotation System
 * 
 * Rotates enemies to face their movement direction.
 */
import { query, World } from 'bitecs';
import { Velocity, Rotation, AIBehavior } from '../ecs/components';

/**
 * Creates the enemy rotation system
 * @returns A system function
 */
export function createEnemyRotationSystem() {
    return function enemyRotationSystem(world: World): World {
        const enemies = query(world, [Velocity, Rotation, AIBehavior]);

        for (const eid of enemies) {
            const vx = Velocity.x[eid];
            const vy = Velocity.y[eid];

            // key check: only rotate if moving significantly
            if (Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1) {
                // Calculate angle from velocity vector
                const angle = Math.atan2(vy, vx);

                // Add 90 degrees offset because sprites point UP by default
                Rotation.angle[eid] = angle + Math.PI / 2;
            }
        }

        return world;
    };
}
