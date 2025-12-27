/**
 * Tests for Entity Reset functions
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
    Position,
    Velocity,
    Rotation,
    Faction,
    SpriteRef,
    Health,
    Shield,
    AIBehavior,
    EnemyWeapon,
    Projectile,
    Collider,
    Target,
    BurningStatus,
    SlowedStatus,
    DrainedStatus,
    DisabledStatus,
} from '../ecs/components';
import {
    resetEnemy,
    resetProjectile,
    resetStatusEffects,
    resetTransform,
    resetCombat,
    resetAIBehavior,
} from '../ecs/entityReset';

describe('Entity Reset Functions', () => {
    // Use a simple entity ID for testing
    const testEid = 1;

    beforeEach(() => {
        // Set up test values for the entity
        Position.x[testEid] = 100;
        Position.y[testEid] = 200;
        Velocity.x[testEid] = 50;
        Velocity.y[testEid] = -30;
        Rotation.angle[testEid] = Math.PI / 4;
        Faction.id[testEid] = 3;
        SpriteRef.index[testEid] = 5;
        Health.current[testEid] = 80;
        Health.max[testEid] = 100;
        Shield.current[testEid] = 30;
        Shield.max[testEid] = 50;
    });

    describe('resetTransform', () => {
        it('should reset position, velocity, and rotation to zero', () => {
            resetTransform(testEid);

            expect(Position.x[testEid]).toBe(0);
            expect(Position.y[testEid]).toBe(0);
            expect(Velocity.x[testEid]).toBe(0);
            expect(Velocity.y[testEid]).toBe(0);
            expect(Rotation.angle[testEid]).toBe(0);
        });
    });

    describe('resetCombat', () => {
        it('should reset health and shield to zero', () => {
            resetCombat(testEid);

            expect(Health.current[testEid]).toBe(0);
            expect(Health.max[testEid]).toBe(0);
            expect(Shield.current[testEid]).toBe(0);
            expect(Shield.max[testEid]).toBe(0);
        });
    });

    describe('resetStatusEffects', () => {
        beforeEach(() => {
            // Set up status effect values
            BurningStatus.damagePerTick[testEid] = 5;
            BurningStatus.ticksRemaining[testEid] = 10;
            BurningStatus.tickInterval[testEid] = 0.5;
            BurningStatus.lastTickTime[testEid] = 100;
            SlowedStatus.slowPercent[testEid] = 0.5;
            SlowedStatus.duration[testEid] = 3;
            SlowedStatus.originalSpeed[testEid] = 100;
            DrainedStatus.stacks[testEid] = 3;
            DrainedStatus.duration[testEid] = 5;
            DisabledStatus.duration[testEid] = 2;
            DisabledStatus.disabledSystems[testEid] = 7;
        });

        it('should reset all status effects to zero', () => {
            resetStatusEffects(testEid);

            expect(BurningStatus.damagePerTick[testEid]).toBe(0);
            expect(BurningStatus.ticksRemaining[testEid]).toBe(0);
            expect(BurningStatus.tickInterval[testEid]).toBe(0);
            expect(BurningStatus.lastTickTime[testEid]).toBe(0);
            expect(SlowedStatus.slowPercent[testEid]).toBe(0);
            expect(SlowedStatus.duration[testEid]).toBe(0);
            expect(SlowedStatus.originalSpeed[testEid]).toBe(0);
            expect(DrainedStatus.stacks[testEid]).toBe(0);
            expect(DrainedStatus.duration[testEid]).toBe(0);
            expect(DisabledStatus.duration[testEid]).toBe(0);
            expect(DisabledStatus.disabledSystems[testEid]).toBe(0);
        });
    });

    describe('resetAIBehavior', () => {
        beforeEach(() => {
            AIBehavior.behaviorType[testEid] = 2;
            AIBehavior.stateTimer[testEid] = 5;
            AIBehavior.targetX[testEid] = 500;
            AIBehavior.targetY[testEid] = 400;
            AIBehavior.aggression[testEid] = 0.8;
        });

        it('should reset AI behavior to defaults', () => {
            resetAIBehavior(testEid);

            expect(AIBehavior.behaviorType[testEid]).toBe(0);
            expect(AIBehavior.stateTimer[testEid]).toBe(0);
            expect(AIBehavior.targetX[testEid]).toBe(0);
            expect(AIBehavior.targetY[testEid]).toBe(0);
            expect(AIBehavior.aggression[testEid]).toBe(0);
        });
    });

    describe('resetEnemy', () => {
        beforeEach(() => {
            // Set up additional enemy-specific values
            AIBehavior.behaviorType[testEid] = 2;
            AIBehavior.aggression[testEid] = 0.8;
            EnemyWeapon.range[testEid] = 300;
            EnemyWeapon.fireRate[testEid] = 2;
            EnemyWeapon.damage[testEid] = 10;
            EnemyWeapon.lastFired[testEid] = 50;
            Collider.radius[testEid] = 20;
            Collider.layer[testEid] = 1;
            Target.entityId[testEid] = 5;
            Target.hasTarget[testEid] = 1;
            BurningStatus.damagePerTick[testEid] = 5;
        });

        it('should reset all enemy components', () => {
            resetEnemy(testEid);

            // Transform
            expect(Position.x[testEid]).toBe(0);
            expect(Position.y[testEid]).toBe(0);
            expect(Velocity.x[testEid]).toBe(0);
            expect(Velocity.y[testEid]).toBe(0);

            // Identity
            expect(Faction.id[testEid]).toBe(0);
            expect(SpriteRef.index[testEid]).toBe(0);

            // Combat
            expect(Health.current[testEid]).toBe(0);
            expect(Shield.current[testEid]).toBe(0);

            // AI
            expect(AIBehavior.behaviorType[testEid]).toBe(0);
            expect(AIBehavior.aggression[testEid]).toBe(0);

            // Weapon
            expect(EnemyWeapon.range[testEid]).toBe(0);
            expect(EnemyWeapon.damage[testEid]).toBe(0);

            // Target
            expect(Target.entityId[testEid]).toBe(0);
            expect(Target.hasTarget[testEid]).toBe(0);

            // Status effects
            expect(BurningStatus.damagePerTick[testEid]).toBe(0);
        });
    });

    describe('resetProjectile', () => {
        beforeEach(() => {
            Projectile.damage[testEid] = 25;
            Projectile.speed[testEid] = 400;
            Projectile.lifetime[testEid] = 5;
            Projectile.targetEntityId[testEid] = 10;
            Projectile.projectileType[testEid] = 1;
            Collider.radius[testEid] = 8;
        });

        it('should reset all projectile components', () => {
            resetProjectile(testEid);

            // Transform
            expect(Position.x[testEid]).toBe(0);
            expect(Position.y[testEid]).toBe(0);
            expect(Velocity.x[testEid]).toBe(0);
            expect(Velocity.y[testEid]).toBe(0);

            // Identity
            expect(Faction.id[testEid]).toBe(0);
            expect(SpriteRef.index[testEid]).toBe(0);

            // Collider
            expect(Collider.radius[testEid]).toBe(0);

            // Projectile
            expect(Projectile.damage[testEid]).toBe(0);
            expect(Projectile.speed[testEid]).toBe(0);
            expect(Projectile.lifetime[testEid]).toBe(0);
            expect(Projectile.targetEntityId[testEid]).toBe(0);
            expect(Projectile.projectileType[testEid]).toBe(0);
        });
    });
});
