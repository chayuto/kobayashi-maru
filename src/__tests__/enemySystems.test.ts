/**
 * Tests for Enemy & Status Systems
 *
 * Covers:
 * - enemyCombatSystem: enemy firing logic toward Kobayashi Maru
 * - enemyProjectileSystem: enemy projectile collisions with Federation entities
 * - statusEffectSystem: burning, slowed, drained, disabled processing
 * - turretRotationSystem: turret aiming at targets
 * - enemyRotationSystem: enemy facing movement direction
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import {
    Position,
    Velocity,
    Rotation,
    Health,
    Shield,
    Faction,
    Turret,
    Target,
    EnemyWeapon,
    AIBehavior,
    Projectile,
    Collider,
    BurningStatus,
    SlowedStatus,
    DrainedStatus,
    DisabledStatus,
} from '../ecs/components';
import { createEnemyCombatSystem } from '../systems/enemyCombatSystem';
import { createEnemyProjectileSystem } from '../systems/enemyProjectileSystem';
import {
    statusEffectSystem,
    applyBurning,
    applySlowed,
    applyDrained,
    applyDisabled,
} from '../systems/statusEffectSystem';
import { createTurretRotationSystem } from '../systems/turretRotationSystem';
import { createEnemyRotationSystem } from '../systems/enemyRotationSystem';
import { SpatialHash } from '../collision';
import { FactionId, GAME_CONFIG, ProjectileType } from '../types/constants';
import {
    createTestWorld,
    cleanupTestWorld,
    createTestKobayashiMaru,
} from './helpers';
import type { GameWorld } from '../ecs/world';

// ---------------------------------------------------------------------------
// Helper to create a minimal enemy entity with EnemyWeapon + required components
// ---------------------------------------------------------------------------
function createArmedEnemy(
    world: GameWorld,
    opts: {
        x?: number;
        y?: number;
        factionId?: number;
        health?: number;
        range?: number;
        fireRate?: number;
        damage?: number;
        projectileType?: number;
        lastFired?: number;
    } = {}
): number {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    Position.x[eid] = opts.x ?? 200;
    Position.y[eid] = opts.y ?? 200;

    addComponent(world, eid, Health);
    Health.current[eid] = opts.health ?? 100;
    Health.max[eid] = opts.health ?? 100;

    addComponent(world, eid, Faction);
    Faction.id[eid] = opts.factionId ?? FactionId.KLINGON;

    addComponent(world, eid, AIBehavior);
    AIBehavior.behaviorType[eid] = 0;

    addComponent(world, eid, EnemyWeapon);
    EnemyWeapon.range[eid] = opts.range ?? 500;
    EnemyWeapon.fireRate[eid] = opts.fireRate ?? 2;
    EnemyWeapon.damage[eid] = opts.damage ?? 10;
    EnemyWeapon.projectileType[eid] = opts.projectileType ?? ProjectileType.DISRUPTOR_BOLT;
    EnemyWeapon.lastFired[eid] = opts.lastFired ?? 0;

    return eid;
}

// ---------------------------------------------------------------------------
// Helper to create a minimal enemy projectile entity
// ---------------------------------------------------------------------------
function createEnemyProjectileEntity(
    world: GameWorld,
    opts: {
        x?: number;
        y?: number;
        vx?: number;
        vy?: number;
        damage?: number;
        lifetime?: number;
        colliderRadius?: number;
    } = {}
): number {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    Position.x[eid] = opts.x ?? 100;
    Position.y[eid] = opts.y ?? 100;

    addComponent(world, eid, Velocity);
    Velocity.x[eid] = opts.vx ?? 0;
    Velocity.y[eid] = opts.vy ?? 0;

    addComponent(world, eid, Projectile);
    Projectile.damage[eid] = opts.damage ?? 20;
    Projectile.lifetime[eid] = opts.lifetime ?? 3;
    Projectile.speed[eid] = 300;
    Projectile.projectileType[eid] = ProjectileType.DISRUPTOR_BOLT;

    addComponent(world, eid, Collider);
    Collider.radius[eid] = opts.colliderRadius ?? 5;

    addComponent(world, eid, Faction);
    Faction.id[eid] = FactionId.ENEMY_PROJECTILE;

    return eid;
}

// ---------------------------------------------------------------------------
// Helper to create a Federation target (turret or KM)
// ---------------------------------------------------------------------------
function createFederationTarget(
    world: GameWorld,
    opts: {
        x?: number;
        y?: number;
        health?: number;
        shield?: number;
        colliderRadius?: number;
        hasTurret?: boolean;
    } = {}
): number {
    const eid = addEntity(world);
    addComponent(world, eid, Position);
    Position.x[eid] = opts.x ?? 500;
    Position.y[eid] = opts.y ?? 500;

    addComponent(world, eid, Health);
    Health.current[eid] = opts.health ?? 100;
    Health.max[eid] = opts.health ?? 100;

    addComponent(world, eid, Faction);
    Faction.id[eid] = FactionId.FEDERATION;

    if (opts.shield !== undefined && opts.shield > 0) {
        addComponent(world, eid, Shield);
        Shield.current[eid] = opts.shield;
        Shield.max[eid] = opts.shield;
    }

    if (opts.colliderRadius !== undefined) {
        addComponent(world, eid, Collider);
        Collider.radius[eid] = opts.colliderRadius;
    }

    if (opts.hasTurret) {
        addComponent(world, eid, Turret);
    }

    return eid;
}

// ---------------------------------------------------------------------------
// Helper to create entity with status-effect-relevant components
// ---------------------------------------------------------------------------
function createStatusTarget(
    world: GameWorld,
    opts: {
        health?: number;
        vx?: number;
        vy?: number;
    } = {}
): number {
    const eid = addEntity(world);

    addComponent(world, eid, Health);
    Health.current[eid] = opts.health ?? 100;
    Health.max[eid] = opts.health ?? 100;

    addComponent(world, eid, Velocity);
    Velocity.x[eid] = opts.vx ?? 10;
    Velocity.y[eid] = opts.vy ?? 0;

    addComponent(world, eid, AIBehavior);
    AIBehavior.behaviorType[eid] = 0;

    return eid;
}

// ============================================================================
// TESTS
// ============================================================================

describe('Enemy & Status Systems', () => {
    let world: GameWorld;

    beforeEach(() => {
        world = createTestWorld();
    });

    afterEach(() => {
        cleanupTestWorld();
    });

    // ========================================================================
    // Enemy Combat System
    // ========================================================================
    describe('EnemyCombatSystem', () => {
        it('should fire projectile when enemy is in range and cooldown elapsed', () => {
            // Arrange - mock createEnemyProjectile
            const createEnemyProjectileSpy = vi.fn();
            vi.doMock('../ecs/entityFactory', async (importOriginal) => {
                const original = await importOriginal<typeof import('../ecs/entityFactory')>();
                return { ...original, createEnemyProjectile: createEnemyProjectileSpy };
            });

            // Since vi.doMock is async/lazy, we'll test the behavior by observing lastFired update
            const kmId = createTestKobayashiMaru(world, { x: 500, y: 500 });
            const system = createEnemyCombatSystem(() => kmId);

            const enemyId = createArmedEnemy(world, {
                x: 500, y: 400, // 100 units away, within range
                range: 200,
                fireRate: 2,
                damage: 15,
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10); // currentTime = 10, well past cooldown

            // Assert - lastFired should be updated to currentTime
            expect(EnemyWeapon.lastFired[enemyId]).toBe(10);
        });

        it('should not fire when enemy is out of range', () => {
            const kmId = createTestKobayashiMaru(world, { x: 500, y: 500 });
            const system = createEnemyCombatSystem(() => kmId);

            const enemyId = createArmedEnemy(world, {
                x: 0, y: 0, // far from KM
                range: 100,
                fireRate: 2,
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10);

            // Assert - lastFired should NOT be updated
            expect(EnemyWeapon.lastFired[enemyId]).toBe(0);
        });

        it('should not fire when cooldown has not elapsed', () => {
            const kmId = createTestKobayashiMaru(world, { x: 500, y: 500 });
            const system = createEnemyCombatSystem(() => kmId);

            const enemyId = createArmedEnemy(world, {
                x: 500, y: 400,
                range: 200,
                fireRate: 2, // cooldown = 0.5s
                lastFired: 9.8, // last fired at 9.8
            });

            // Act - currentTime = 10, only 0.2s since lastFired, cooldown is 0.5
            system.update(world, 0.016, 10);

            // Assert - lastFired should remain unchanged
            expect(EnemyWeapon.lastFired[enemyId]).toBe(9.8);
        });

        it('should skip dead enemies', () => {
            const kmId = createTestKobayashiMaru(world, { x: 500, y: 500 });
            const system = createEnemyCombatSystem(() => kmId);

            const enemyId = createArmedEnemy(world, {
                x: 500, y: 400,
                health: 0, // dead
                range: 200,
                fireRate: 2,
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10);

            // Assert - dead enemy should not fire
            expect(EnemyWeapon.lastFired[enemyId]).toBe(0);
        });

        it('should skip Federation entities', () => {
            const kmId = createTestKobayashiMaru(world, { x: 500, y: 500 });
            const system = createEnemyCombatSystem(() => kmId);

            const friendlyId = createArmedEnemy(world, {
                x: 500, y: 400,
                factionId: FactionId.FEDERATION, // Federation entity with weapon
                range: 200,
                fireRate: 2,
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10);

            // Assert
            expect(EnemyWeapon.lastFired[friendlyId]).toBe(0);
        });

        it('should skip enemies with zero fire rate', () => {
            const kmId = createTestKobayashiMaru(world, { x: 500, y: 500 });
            const system = createEnemyCombatSystem(() => kmId);

            const enemyId = createArmedEnemy(world, {
                x: 500, y: 400,
                range: 200,
                fireRate: 0, // no fire rate
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10);

            // Assert
            expect(EnemyWeapon.lastFired[enemyId]).toBe(0);
        });

        it('should target world center when no Kobayashi Maru is provided', () => {
            // System with no getKobayashiMaruId
            const system = createEnemyCombatSystem();

            // Place enemy near world center
            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            const enemyId = createArmedEnemy(world, {
                x: centerX, y: centerY - 50,
                range: 200,
                fireRate: 2,
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10);

            // Assert - should have fired (target is center, enemy is close)
            expect(EnemyWeapon.lastFired[enemyId]).toBe(10);
        });

        it('should target world center when KM id is -1', () => {
            const system = createEnemyCombatSystem(() => -1);

            const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
            const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
            const enemyId = createArmedEnemy(world, {
                x: centerX, y: centerY - 50,
                range: 200,
                fireRate: 2,
                lastFired: 0,
            });

            // Act
            system.update(world, 0.016, 10);

            // Assert
            expect(EnemyWeapon.lastFired[enemyId]).toBe(10);
        });
    });

    // ========================================================================
    // Enemy Projectile System
    // ========================================================================
    describe('EnemyProjectileSystem', () => {
        let spatialHash: SpatialHash;

        beforeEach(() => {
            spatialHash = new SpatialHash(64, 1920, 1080);
        });

        it('should decrease projectile lifetime each frame', () => {
            const system = createEnemyProjectileSystem(spatialHash);
            const projId = createEnemyProjectileEntity(world, { lifetime: 3.0 });

            // Act
            system.update(world, 0.5);

            // Assert
            expect(Projectile.lifetime[projId]).toBeCloseTo(2.5);
        });

        it('should remove projectile when lifetime expires', () => {
            const system = createEnemyProjectileSystem(spatialHash);
            const projId = createEnemyProjectileEntity(world, { lifetime: 0.1 });

            // Act
            system.update(world, 0.2);

            // Assert - projectile should be removed
            expect(hasComponent(world, projId, Projectile)).toBe(false);
        });

        it('should damage Federation entity on collision', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            // Create Federation target
            const targetId = createFederationTarget(world, {
                x: 100, y: 100,
                health: 100,
                colliderRadius: 20,
            });

            // Create enemy projectile at same position
            const projId = createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 30,
                colliderRadius: 5,
            });

            // Insert target into spatial hash
            spatialHash.insert(targetId, 100, 100);

            // Act
            system.update(world, 0.016);

            // Assert - target should have taken damage
            expect(Health.current[targetId]).toBeLessThan(100);
            // Projectile should be removed after hit
            expect(hasComponent(world, projId, Projectile)).toBe(false);
        });

        it('should not damage non-Federation entities', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            // Create a Klingon entity (enemy)
            const enemyTargetId = addEntity(world);
            addComponent(world, enemyTargetId, Position);
            Position.x[enemyTargetId] = 100;
            Position.y[enemyTargetId] = 100;
            addComponent(world, enemyTargetId, Health);
            Health.current[enemyTargetId] = 100;
            Health.max[enemyTargetId] = 100;
            addComponent(world, enemyTargetId, Faction);
            Faction.id[enemyTargetId] = FactionId.KLINGON;
            addComponent(world, enemyTargetId, Collider);
            Collider.radius[enemyTargetId] = 20;

            spatialHash.insert(enemyTargetId, 100, 100);

            const projId = createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 30,
                colliderRadius: 5,
            });

            // Act
            system.update(world, 0.016);

            // Assert - Klingon entity should NOT take damage
            expect(Health.current[enemyTargetId]).toBe(100);
            // Projectile lifetime should have decreased but projectile not removed by collision
            expect(Projectile.lifetime[projId]).toBeCloseTo(3 - 0.016, 2);
        });

        it('should skip non-enemy projectiles', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            // Create a friendly projectile (not ENEMY_PROJECTILE faction)
            const friendlyProjId = addEntity(world);
            addComponent(world, friendlyProjId, Position);
            Position.x[friendlyProjId] = 100;
            Position.y[friendlyProjId] = 100;
            addComponent(world, friendlyProjId, Velocity);
            addComponent(world, friendlyProjId, Projectile);
            Projectile.lifetime[friendlyProjId] = 3;
            Projectile.damage[friendlyProjId] = 20;
            addComponent(world, friendlyProjId, Collider);
            Collider.radius[friendlyProjId] = 5;
            addComponent(world, friendlyProjId, Faction);
            Faction.id[friendlyProjId] = FactionId.PROJECTILE; // federation projectile

            const targetId = createFederationTarget(world, {
                x: 100, y: 100,
                health: 100,
                colliderRadius: 20,
            });
            spatialHash.insert(targetId, 100, 100);

            // Act
            system.update(world, 0.016);

            // Assert - Federation entity NOT damaged, lifetime NOT decreased
            expect(Health.current[targetId]).toBe(100);
            expect(Projectile.lifetime[friendlyProjId]).toBe(3);
        });

        it('should track damage to Kobayashi Maru', () => {
            const kmId = createTestKobayashiMaru(world, { x: 100, y: 100 });
            const system = createEnemyProjectileSystem(spatialHash, () => kmId);

            // Insert KM into spatial hash
            spatialHash.insert(kmId, 100, 100);

            const projId = createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 25,
                colliderRadius: 5,
            });

            // Act
            system.update(world, 0.016);

            // Assert - KM took damage, damage tracked
            expect(system.getTotalDamageToKM()).toBeGreaterThan(0);
        });

        it('should reset damage tracking', () => {
            const kmId = createTestKobayashiMaru(world, { x: 100, y: 100 });
            const system = createEnemyProjectileSystem(spatialHash, () => kmId);

            spatialHash.insert(kmId, 100, 100);
            createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 25,
                colliderRadius: 5,
            });

            system.update(world, 0.016);
            expect(system.getTotalDamageToKM()).toBeGreaterThan(0);

            // Act
            system.resetDamageTracking();

            // Assert
            expect(system.getTotalDamageToKM()).toBe(0);
        });

        it('should skip targets with zero health', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            const deadTarget = createFederationTarget(world, {
                x: 100, y: 100,
                health: 0, // already dead
                colliderRadius: 20,
            });
            // Manually set health to 0 after creation (createFederationTarget sets max from health)
            Health.current[deadTarget] = 0;

            spatialHash.insert(deadTarget, 100, 100);

            const projId = createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 30,
                colliderRadius: 5,
            });

            // Act
            system.update(world, 0.016);

            // Assert - projectile should not have hit (target is dead)
            // Projectile still exists (only lifetime decremented)
            expect(Projectile.lifetime[projId]).toBeCloseTo(3 - 0.016, 2);
        });

        it('should not hit targets outside collision radius', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            const targetId = createFederationTarget(world, {
                x: 200, y: 200, // far from projectile
                health: 100,
                colliderRadius: 5, // small radius
            });
            spatialHash.insert(targetId, 200, 200);

            const projId = createEnemyProjectileEntity(world, {
                x: 100, y: 100, // far from target
                damage: 30,
                colliderRadius: 5,
            });

            // Act
            system.update(world, 0.016);

            // Assert - no damage dealt
            expect(Health.current[targetId]).toBe(100);
        });

        it('should only hit one target per projectile', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            // Create two targets at the same position
            const target1 = createFederationTarget(world, {
                x: 100, y: 100,
                health: 100,
                colliderRadius: 20,
            });
            const target2 = createFederationTarget(world, {
                x: 100, y: 100,
                health: 100,
                colliderRadius: 20,
            });
            spatialHash.insert(target1, 100, 100);
            spatialHash.insert(target2, 100, 100);

            createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 30,
                colliderRadius: 5,
            });

            // Act
            system.update(world, 0.016);

            // Assert - at most one target should be damaged
            const target1Damaged = Health.current[target1] < 100;
            const target2Damaged = Health.current[target2] < 100;
            // Only one should be hit (break after first)
            expect(target1Damaged || target2Damaged).toBe(true);
            // Not both should be damaged by the same projectile
            expect(target1Damaged && target2Damaged).toBe(false);
        });

        it('should apply damage through shields first', () => {
            const system = createEnemyProjectileSystem(spatialHash);

            const targetId = createFederationTarget(world, {
                x: 100, y: 100,
                health: 100,
                shield: 50,
                colliderRadius: 20,
            });
            spatialHash.insert(targetId, 100, 100);

            createEnemyProjectileEntity(world, {
                x: 100, y: 100,
                damage: 30,
                colliderRadius: 5,
            });

            // Act
            system.update(world, 0.016);

            // Assert - shields should absorb damage first
            expect(Shield.current[targetId]).toBe(20); // 50 - 30
            expect(Health.current[targetId]).toBe(100); // health untouched
        });
    });

    // ========================================================================
    // Status Effect System
    // ========================================================================
    describe('StatusEffectSystem', () => {
        describe('Burning', () => {
            it('should apply DOT damage per tick', () => {
                const eid = createStatusTarget(world, { health: 100 });
                applyBurning(world, eid, 10, 3); // 10 dmg per tick, 3s

                // Advance past one tick interval (1s)
                statusEffectSystem(world, 1.0);

                // Assert - one tick of damage applied
                expect(Health.current[eid]).toBe(90);
                expect(BurningStatus.ticksRemaining[eid]).toBe(2);
            });

            it('should not apply damage before tick interval', () => {
                const eid = createStatusTarget(world, { health: 100 });
                applyBurning(world, eid, 10, 3);

                // Advance less than one tick interval
                statusEffectSystem(world, 0.5);

                // Assert - no damage yet
                expect(Health.current[eid]).toBe(100);
            });

            it('should remove burning when ticks are exhausted', () => {
                const eid = createStatusTarget(world, { health: 100 });
                applyBurning(world, eid, 5, 1); // 5 dmg, 1s = 1 tick

                // Advance past one tick
                statusEffectSystem(world, 1.0);

                // Assert - burning removed
                expect(hasComponent(world, eid, BurningStatus)).toBe(false);
                expect(Health.current[eid]).toBe(95);
            });

            it('should not reduce health below zero', () => {
                const eid = createStatusTarget(world, { health: 5 });
                applyBurning(world, eid, 20, 3);

                statusEffectSystem(world, 1.0);

                expect(Health.current[eid]).toBe(0);
            });

            it('should refresh burning if applied again', () => {
                const eid = createStatusTarget(world, { health: 100 });
                applyBurning(world, eid, 5, 3); // first application
                applyBurning(world, eid, 10, 5); // refresh with stronger DOT

                expect(BurningStatus.damagePerTick[eid]).toBe(10);
                expect(BurningStatus.ticksRemaining[eid]).toBe(5);
            });
        });

        describe('Slowed', () => {
            it('should reduce velocity on application', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applySlowed(world, eid, 0.5, 3); // 50% slow for 3s

                expect(Velocity.x[eid]).toBeCloseTo(50);
            });

            it('should store original speed on first application', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applySlowed(world, eid, 0.5, 3);

                expect(SlowedStatus.originalSpeed[eid]).toBeCloseTo(100);
            });

            it('should restore speed when duration expires', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applySlowed(world, eid, 0.5, 1.0); // 50% slow for 1s

                // Advance past duration
                statusEffectSystem(world, 1.1);

                // Assert - slow removed
                expect(hasComponent(world, eid, SlowedStatus)).toBe(false);
                // Speed should be restored to original
                expect(Math.abs(Velocity.x[eid])).toBeCloseTo(100, 0);
            });

            it('should decrement duration each tick', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applySlowed(world, eid, 0.5, 3);

                statusEffectSystem(world, 0.5);

                expect(SlowedStatus.duration[eid]).toBeCloseTo(2.5);
            });

            it('should handle zero-velocity entity without error', () => {
                const eid = createStatusTarget(world, { vx: 0, vy: 0 });
                applySlowed(world, eid, 0.5, 1.0);

                // Duration expires
                statusEffectSystem(world, 1.1);

                // Assert - no crash, component removed
                expect(hasComponent(world, eid, SlowedStatus)).toBe(false);
            });
        });

        describe('Drained', () => {
            it('should apply speed reduction on first stack', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applyDrained(world, eid, 3);

                // 10% reduction per stack
                expect(Velocity.x[eid]).toBeCloseTo(90);
                expect(DrainedStatus.stacks[eid]).toBe(1);
            });

            it('should stack up to max (3 stacks)', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applyDrained(world, eid, 3);
                applyDrained(world, eid, 3);
                applyDrained(world, eid, 3);
                applyDrained(world, eid, 3); // beyond max

                // Stacks capped at 3
                expect(DrainedStatus.stacks[eid]).toBe(3);
            });

            it('should remove one stack when duration expires', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applyDrained(world, eid, 1.0);
                applyDrained(world, eid, 1.0);
                // Now stacks = 2, duration = 1.0

                // Expire one stack
                statusEffectSystem(world, 1.1);

                // Assert - stacks decremented
                expect(DrainedStatus.stacks[eid]).toBe(1);
                // Duration reset for remaining stack
                expect(DrainedStatus.duration[eid]).toBeCloseTo(3.0);
            });

            it('should remove component when all stacks expire', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applyDrained(world, eid, 1.0); // 1 stack

                // Expire
                statusEffectSystem(world, 1.1);

                expect(hasComponent(world, eid, DrainedStatus)).toBe(false);
            });

            it('should decrement duration over time', () => {
                const eid = createStatusTarget(world, { vx: 100, vy: 0 });
                applyDrained(world, eid, 5.0);

                statusEffectSystem(world, 1.0);

                expect(DrainedStatus.duration[eid]).toBeCloseTo(4.0);
            });
        });

        describe('Disabled', () => {
            it('should apply disabled status with duration', () => {
                const eid = createStatusTarget(world);
                applyDisabled(world, eid, 2.0, 1);

                expect(hasComponent(world, eid, DisabledStatus)).toBe(true);
                expect(DisabledStatus.duration[eid]).toBeCloseTo(2.0);
                expect(DisabledStatus.disabledSystems[eid]).toBe(1);
            });

            it('should decrement duration over time', () => {
                const eid = createStatusTarget(world);
                applyDisabled(world, eid, 3.0);

                statusEffectSystem(world, 1.0);

                expect(DisabledStatus.duration[eid]).toBeCloseTo(2.0);
            });

            it('should remove disabled when duration expires', () => {
                const eid = createStatusTarget(world);
                applyDisabled(world, eid, 1.0);

                statusEffectSystem(world, 1.1);

                expect(hasComponent(world, eid, DisabledStatus)).toBe(false);
            });

            it('should refresh disabled if applied again', () => {
                const eid = createStatusTarget(world);
                applyDisabled(world, eid, 2.0, 1);

                // Refresh with different duration and systems
                applyDisabled(world, eid, 5.0, 3);

                expect(DisabledStatus.duration[eid]).toBeCloseTo(5.0);
                expect(DisabledStatus.disabledSystems[eid]).toBe(3);
            });

            it('should default disabledSystems to 1 (weapons)', () => {
                const eid = createStatusTarget(world);
                applyDisabled(world, eid, 2.0);

                expect(DisabledStatus.disabledSystems[eid]).toBe(1);
            });
        });
    });

    // ========================================================================
    // Turret Rotation System
    // ========================================================================
    describe('TurretRotationSystem', () => {
        it('should rotate turret to face target to the right', () => {
            const system = createTurretRotationSystem();

            const turretId = addEntity(world);
            addComponent(world, turretId, Position);
            Position.x[turretId] = 100;
            Position.y[turretId] = 100;
            addComponent(world, turretId, Rotation);
            Rotation.angle[turretId] = 0;
            addComponent(world, turretId, Turret);
            addComponent(world, turretId, Target);

            const targetId = addEntity(world);
            addComponent(world, targetId, Position);
            Position.x[targetId] = 200;
            Position.y[targetId] = 100; // directly to the right

            Target.hasTarget[turretId] = 1;
            Target.entityId[turretId] = targetId;

            // Act
            system(world);

            // atan2(0, 100) = 0, + PI/2 = PI/2
            expect(Rotation.angle[turretId]).toBeCloseTo(Math.PI / 2);
        });

        it('should rotate turret to face target above', () => {
            const system = createTurretRotationSystem();

            const turretId = addEntity(world);
            addComponent(world, turretId, Position);
            Position.x[turretId] = 100;
            Position.y[turretId] = 100;
            addComponent(world, turretId, Rotation);
            addComponent(world, turretId, Turret);
            addComponent(world, turretId, Target);

            const targetId = addEntity(world);
            addComponent(world, targetId, Position);
            Position.x[targetId] = 100;
            Position.y[targetId] = 0; // directly above

            Target.hasTarget[turretId] = 1;
            Target.entityId[turretId] = targetId;

            // Act
            system(world);

            // atan2(-100, 0) = -PI/2, + PI/2 = 0
            expect(Rotation.angle[turretId]).toBeCloseTo(0);
        });

        it('should not rotate turret without target', () => {
            const system = createTurretRotationSystem();

            const turretId = addEntity(world);
            addComponent(world, turretId, Position);
            Position.x[turretId] = 100;
            Position.y[turretId] = 100;
            addComponent(world, turretId, Rotation);
            Rotation.angle[turretId] = 1.5;
            addComponent(world, turretId, Turret);
            addComponent(world, turretId, Target);
            Target.hasTarget[turretId] = 0;

            // Act
            system(world);

            // Assert - angle unchanged
            expect(Rotation.angle[turretId]).toBeCloseTo(1.5);
        });

        it('should handle diagonal target correctly', () => {
            const system = createTurretRotationSystem();

            const turretId = addEntity(world);
            addComponent(world, turretId, Position);
            Position.x[turretId] = 0;
            Position.y[turretId] = 0;
            addComponent(world, turretId, Rotation);
            addComponent(world, turretId, Turret);
            addComponent(world, turretId, Target);

            const targetId = addEntity(world);
            addComponent(world, targetId, Position);
            Position.x[targetId] = 100;
            Position.y[targetId] = 100;

            Target.hasTarget[turretId] = 1;
            Target.entityId[turretId] = targetId;

            // Act
            system(world);

            // atan2(100, 100) = PI/4, + PI/2 = 3*PI/4
            const expected = Math.atan2(100, 100) + Math.PI / 2;
            expect(Rotation.angle[turretId]).toBeCloseTo(expected);
        });
    });

    // ========================================================================
    // Enemy Rotation System
    // ========================================================================
    describe('EnemyRotationSystem', () => {
        it('should face movement direction when moving right', () => {
            const system = createEnemyRotationSystem();

            const eid = addEntity(world);
            addComponent(world, eid, Velocity);
            Velocity.x[eid] = 50;
            Velocity.y[eid] = 0;
            addComponent(world, eid, Rotation);
            addComponent(world, eid, AIBehavior);

            // Act
            system(world);

            // atan2(0, 50) = 0, + PI/2 = PI/2
            expect(Rotation.angle[eid]).toBeCloseTo(Math.PI / 2);
        });

        it('should face movement direction when moving down', () => {
            const system = createEnemyRotationSystem();

            const eid = addEntity(world);
            addComponent(world, eid, Velocity);
            Velocity.x[eid] = 0;
            Velocity.y[eid] = 50;
            addComponent(world, eid, Rotation);
            addComponent(world, eid, AIBehavior);

            // Act
            system(world);

            // atan2(50, 0) = PI/2, + PI/2 = PI
            expect(Rotation.angle[eid]).toBeCloseTo(Math.PI);
        });

        it('should not rotate when stationary', () => {
            const system = createEnemyRotationSystem();

            const eid = addEntity(world);
            addComponent(world, eid, Velocity);
            Velocity.x[eid] = 0;
            Velocity.y[eid] = 0;
            addComponent(world, eid, Rotation);
            Rotation.angle[eid] = 2.5;
            addComponent(world, eid, AIBehavior);

            // Act
            system(world);

            // Assert - angle unchanged
            expect(Rotation.angle[eid]).toBeCloseTo(2.5);
        });

        it('should not rotate when velocity is below threshold', () => {
            const system = createEnemyRotationSystem();

            const eid = addEntity(world);
            addComponent(world, eid, Velocity);
            Velocity.x[eid] = 0.05; // below 0.1 threshold
            Velocity.y[eid] = 0.05;
            addComponent(world, eid, Rotation);
            Rotation.angle[eid] = 1.0;
            addComponent(world, eid, AIBehavior);

            // Act
            system(world);

            // Assert - angle unchanged
            expect(Rotation.angle[eid]).toBeCloseTo(1.0);
        });

        it('should update rotation when direction changes', () => {
            const system = createEnemyRotationSystem();

            const eid = addEntity(world);
            addComponent(world, eid, Velocity);
            addComponent(world, eid, Rotation);
            addComponent(world, eid, AIBehavior);

            // Move right
            Velocity.x[eid] = 50;
            Velocity.y[eid] = 0;
            system(world);
            const rightAngle = Rotation.angle[eid];

            // Change to move left
            Velocity.x[eid] = -50;
            Velocity.y[eid] = 0;
            system(world);
            const leftAngle = Rotation.angle[eid];

            // Angles should differ
            expect(rightAngle).not.toBeCloseTo(leftAngle);
            // Moving left: atan2(0, -50) = PI, + PI/2 = 3PI/2
            expect(leftAngle).toBeCloseTo(Math.PI * 1.5);
        });

        it('should handle negative velocity correctly', () => {
            const system = createEnemyRotationSystem();

            const eid = addEntity(world);
            addComponent(world, eid, Velocity);
            Velocity.x[eid] = -30;
            Velocity.y[eid] = -30; // moving up-left
            addComponent(world, eid, Rotation);
            addComponent(world, eid, AIBehavior);

            // Act
            system(world);

            // atan2(-30, -30) = -3PI/4, + PI/2 = -PI/4
            const expected = Math.atan2(-30, -30) + Math.PI / 2;
            expect(Rotation.angle[eid]).toBeCloseTo(expected);
        });
    });
});
