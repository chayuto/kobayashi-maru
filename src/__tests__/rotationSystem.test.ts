/**
 * Tests for Rotation Systems (Turret Aiming & Enemy Facing)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, Rotation, Target, Turret, AIBehavior } from '../ecs/components';
import { createTurretRotationSystem } from '../systems/turretRotationSystem';
import { createEnemyRotationSystem } from '../systems/enemyRotationSystem';
import { PoolManager } from '../ecs/PoolManager';

describe('Rotation Systems', () => {
    let world: ReturnType<typeof createGameWorld>;

    beforeEach(() => {
        world = createGameWorld();
        PoolManager.getInstance().init(world);
    });

    afterEach(() => {
        PoolManager.getInstance().destroy();
    });

    describe('Turret Rotation System', () => {
        it('should aim turret at target', () => {
            const system = createTurretRotationSystem();

            // Create turret
            const turretId = addEntity(world);
            addComponent(world, turretId, Position);
            Position.x[turretId] = 0;
            Position.y[turretId] = 0;
            addComponent(world, turretId, Rotation);
            addComponent(world, turretId, Turret);
            addComponent(world, turretId, Target);

            // Create target
            const targetId = addEntity(world);
            addComponent(world, targetId, Position);
            Position.x[targetId] = 100;
            Position.y[targetId] = 100;

            // Assign target to turret
            Target.hasTarget[turretId] = 1;
            Target.entityId[turretId] = targetId;

            // Run system
            system(world);

            // Expected angle: 45 degrees (PI/4) + 90 degrees offset (PI/2) = 3PI/4
            // PI/4 = 0.785
            // PI/2 = 1.570
            // Total = 2.356
            const expectedAngle = Math.atan2(100, 100) + Math.PI / 2;
            expect(Rotation.angle[turretId]).toBeCloseTo(expectedAngle);
        });

        it('should not rotate if no target', () => {
            const system = createTurretRotationSystem();

            const turretId = addEntity(world);
            addComponent(world, turretId, Position);
            Rotation.angle[turretId] = 0;
            addComponent(world, turretId, Turret);
            addComponent(world, turretId, Target);

            Target.hasTarget[turretId] = 0;

            system(world);

            expect(Rotation.angle[turretId]).toBe(0);
        });
    });

    describe('Enemy Rotation System', () => {
        it('should face movement direction', () => {
            const system = createEnemyRotationSystem();

            const enemyId = addEntity(world);
            addComponent(world, enemyId, Velocity);
            Velocity.x[enemyId] = 10;
            Velocity.y[enemyId] = 0; // Moving right
            addComponent(world, enemyId, Rotation);
            addComponent(world, enemyId, AIBehavior); // Mark as enemy

            system(world);

            // Moving right (angle 0) -> + PI/2 offset = PI/2
            const expectedAngle = Math.atan2(0, 10) + Math.PI / 2;
            expect(Rotation.angle[enemyId]).toBeCloseTo(expectedAngle);
        });

        it('should update facing when direction changes', () => {
            const system = createEnemyRotationSystem();
            const enemyId = addEntity(world);
            addComponent(world, enemyId, Velocity);
            addComponent(world, enemyId, Rotation);
            addComponent(world, enemyId, AIBehavior);

            // Move down
            Velocity.x[enemyId] = 0;
            Velocity.y[enemyId] = 10;

            system(world);

            // Down (PI/2) + Offset (PI/2) = PI
            expect(Rotation.angle[enemyId]).toBeCloseTo(Math.PI);

            // Move left
            Velocity.x[enemyId] = -10;
            Velocity.y[enemyId] = 0;

            system(world);

            // Left (PI) + Offset (PI/2) = 3PI/2 (or -PI/2)
            // Math.atan2(0, -10) is PI. PI + PI/2 = 3PI/2.
            expect(Rotation.angle[enemyId]).toBeCloseTo(Math.PI * 1.5);
        });

        it('should not rotate if stationary', () => {
            const system = createEnemyRotationSystem();
            const enemyId = addEntity(world);
            addComponent(world, enemyId, Velocity);
            Velocity.x[enemyId] = 0;
            Velocity.y[enemyId] = 0;
            addComponent(world, enemyId, Rotation);
            Rotation.angle[enemyId] = 1.23; // Arbitrary existing rotation
            addComponent(world, enemyId, AIBehavior);

            system(world);

            expect(Rotation.angle[enemyId]).toBeCloseTo(1.23);
        });
    });
});
