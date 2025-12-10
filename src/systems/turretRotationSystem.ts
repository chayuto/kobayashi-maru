/**
 * Turret Rotation System
 * 
 * Rotates turrets to face their targets.
 */
import { query, World } from 'bitecs';
import { Position, Rotation, Target, Turret } from '../ecs/components';

/**
 * Creates the turret rotation system
 * @returns A system function
 */
export function createTurretRotationSystem() {
    return function turretRotationSystem(world: World): World {
        const turrets = query(world, [Position, Rotation, Turret, Target]);

        for (const eid of turrets) {
            // Check if turret has a valid target
            if (Target.hasTarget[eid]) {
                const targetId = Target.entityId[eid];

                // Ensure target still exists and has position (simple check, ideally check world)
                // Position X/Y are typed arrays, so safe to access even if entity destroyed (garbage data maybe)
                // But logic should rely on targeting system ensuring target validity

                const dx = Position.x[targetId] - Position.x[eid];
                const dy = Position.y[targetId] - Position.y[eid];

                // Calculate angle and add 90 degrees offset because sprites point UP by default
                const angle = Math.atan2(dy, dx);
                Rotation.angle[eid] = angle + Math.PI / 2;
            }
        }

        return world;
    };
}
