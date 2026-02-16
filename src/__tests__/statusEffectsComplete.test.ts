/**
 * Tests for Complete Status Effects System
 * Verifies all 4 status effect types work end-to-end:
 * combatSystem application, entityFactory WeaponProperties, and event emission.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addEntity, addComponent, hasComponent } from 'bitecs';
import { createGameWorld, createTurret } from '../ecs';
import {
    WeaponProperties,
    Health,
    Shield,
    Velocity,
    AIBehavior,
    BurningStatus,
    SlowedStatus,
    DrainedStatus,
    DisabledStatus
} from '../ecs/components';
import { TurretType } from '../types/constants';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';
import type { StatusEffectAppliedPayload, StatusEffectRemovedPayload } from '../types/events';
import type { GameWorld } from '../ecs/world';
import {
    applyBurning,
    applySlowed,
    applyDrained,
    applyDisabled,
    statusEffectSystem
} from '../systems/statusEffectSystem';

describe('Status Effects Complete System', () => {
    let world: GameWorld;
    let eventBus: EventBus;

    beforeEach(() => {
        EventBus.resetInstance();
        world = createGameWorld();
        eventBus = EventBus.getInstance();
    });

    afterEach(() => {
        EventBus.resetInstance();
    });

    /**
     * Helper to create a minimal enemy entity with components needed for status effects
     */
    function createTestEnemy(): number {
        const eid = addEntity(world);
        addComponent(world, eid, Health);
        Health.current[eid] = 100;
        Health.max[eid] = 100;
        addComponent(world, eid, Shield);
        Shield.current[eid] = 50;
        Shield.max[eid] = 50;
        addComponent(world, eid, Velocity);
        Velocity.x[eid] = 10;
        Velocity.y[eid] = 0;
        addComponent(world, eid, AIBehavior);
        AIBehavior.behaviorType[eid] = 0;
        return eid;
    }

    describe('Entity Factory - WeaponProperties', () => {
        it('should assign Phaser Array WeaponProperties with disable (type 4) and 5% chance', () => {
            // Arrange & Act
            const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);

            // Assert
            expect(hasComponent(world, eid, WeaponProperties)).toBe(true);
            expect(WeaponProperties.statusEffectType[eid]).toBe(4);
            expect(WeaponProperties.statusEffectChance[eid]).toBeCloseTo(0.05);
            expect(WeaponProperties.shieldDamageMultiplier[eid]).toBe(1.0);
            expect(WeaponProperties.hullDamageMultiplier[eid]).toBe(1.0);
        });

        it('should assign Disruptor Bank WeaponProperties with slow (type 2) and 15% chance', () => {
            // Arrange & Act
            const eid = createTurret(world, 100, 200, TurretType.DISRUPTOR_BANK);

            // Assert
            expect(hasComponent(world, eid, WeaponProperties)).toBe(true);
            expect(WeaponProperties.statusEffectType[eid]).toBe(2);
            expect(WeaponProperties.statusEffectChance[eid]).toBeCloseTo(0.15);
            expect(WeaponProperties.shieldDamageMultiplier[eid]).toBe(1.0);
            expect(WeaponProperties.hullDamageMultiplier[eid]).toBe(1.0);
        });

        it('should retain Plasma Cannon burn (type 1) with 100% chance', () => {
            // Arrange & Act
            const eid = createTurret(world, 100, 200, TurretType.PLASMA_CANNON);

            // Assert
            expect(hasComponent(world, eid, WeaponProperties)).toBe(true);
            expect(WeaponProperties.statusEffectType[eid]).toBe(1);
            expect(WeaponProperties.statusEffectChance[eid]).toBeCloseTo(1.0);
        });

        it('should retain Polaron Beam drain (type 3) with 100% chance', () => {
            // Arrange & Act
            const eid = createTurret(world, 100, 200, TurretType.POLARON_BEAM);

            // Assert
            expect(hasComponent(world, eid, WeaponProperties)).toBe(true);
            expect(WeaponProperties.statusEffectType[eid]).toBe(3);
            expect(WeaponProperties.statusEffectChance[eid]).toBeCloseTo(1.0);
        });

        it('should assign Tetryon Beam no status effect (type 0)', () => {
            // Arrange & Act
            const eid = createTurret(world, 100, 200, TurretType.TETRYON_BEAM);

            // Assert
            expect(hasComponent(world, eid, WeaponProperties)).toBe(true);
            expect(WeaponProperties.statusEffectType[eid]).toBe(0);
        });
    });

    describe('Status Effect Application Functions', () => {
        it('should apply burning status to an entity', () => {
            // Arrange
            const eid = createTestEnemy();

            // Act
            applyBurning(world, eid, 4.0, 5.0);

            // Assert
            expect(hasComponent(world, eid, BurningStatus)).toBe(true);
            expect(BurningStatus.damagePerTick[eid]).toBe(4.0);
            expect(BurningStatus.ticksRemaining[eid]).toBe(5);
        });

        it('should apply slowed status to an entity', () => {
            // Arrange
            const eid = createTestEnemy();
            const originalVx = Velocity.x[eid];

            // Act
            applySlowed(world, eid, 0.3, 3.0);

            // Assert
            expect(hasComponent(world, eid, SlowedStatus)).toBe(true);
            expect(SlowedStatus.slowPercent[eid]).toBeCloseTo(0.3);
            expect(SlowedStatus.duration[eid]).toBe(3.0);
            expect(Velocity.x[eid]).toBeCloseTo(originalVx * 0.7);
        });

        it('should apply drained status to an entity', () => {
            // Arrange
            const eid = createTestEnemy();

            // Act
            applyDrained(world, eid, 3.0);

            // Assert
            expect(hasComponent(world, eid, DrainedStatus)).toBe(true);
            expect(DrainedStatus.stacks[eid]).toBe(1);
            expect(DrainedStatus.duration[eid]).toBe(3.0);
        });

        it('should apply disabled status to an entity', () => {
            // Arrange
            const eid = createTestEnemy();

            // Act
            applyDisabled(world, eid, 2.0, 1);

            // Assert
            expect(hasComponent(world, eid, DisabledStatus)).toBe(true);
            expect(DisabledStatus.duration[eid]).toBe(2.0);
            expect(DisabledStatus.disabledSystems[eid]).toBe(1);
        });
    });

    describe('STATUS_EFFECT_APPLIED event emission', () => {
        it('should emit STATUS_EFFECT_APPLIED when burning is applied', () => {
            // Arrange
            const eid = createTestEnemy();
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_APPLIED, handler);

            // Act
            applyBurning(world, eid, 4.0, 5.0);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectAppliedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(1);
            expect(payload.duration).toBe(5.0);
        });

        it('should emit STATUS_EFFECT_APPLIED when slowed is applied', () => {
            // Arrange
            const eid = createTestEnemy();
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_APPLIED, handler);

            // Act
            applySlowed(world, eid, 0.3, 3.0);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectAppliedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(2);
            expect(payload.duration).toBe(3.0);
        });

        it('should emit STATUS_EFFECT_APPLIED when drained is applied', () => {
            // Arrange
            const eid = createTestEnemy();
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_APPLIED, handler);

            // Act
            applyDrained(world, eid, 3.0);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectAppliedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(3);
            expect(payload.duration).toBe(3.0);
        });

        it('should emit STATUS_EFFECT_APPLIED when disabled is applied', () => {
            // Arrange
            const eid = createTestEnemy();
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_APPLIED, handler);

            // Act
            applyDisabled(world, eid, 2.0, 1);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectAppliedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(4);
            expect(payload.duration).toBe(2.0);
        });
    });

    describe('STATUS_EFFECT_REMOVED event emission', () => {
        it('should emit STATUS_EFFECT_REMOVED when burning expires', () => {
            // Arrange
            const eid = createTestEnemy();
            applyBurning(world, eid, 4.0, 1.0); // 1 second = 1 tick
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_REMOVED, handler);

            // Act - advance time past the tick interval to trigger expiration
            statusEffectSystem(world, 1.0); // Triggers tick and decrements to 0

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectRemovedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(1);
        });

        it('should emit STATUS_EFFECT_REMOVED when slowed expires', () => {
            // Arrange
            const eid = createTestEnemy();
            applySlowed(world, eid, 0.3, 1.0); // 1 second duration
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_REMOVED, handler);

            // Act - advance past duration
            statusEffectSystem(world, 1.5);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectRemovedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(2);
        });

        it('should emit STATUS_EFFECT_REMOVED when drained fully expires', () => {
            // Arrange
            const eid = createTestEnemy();
            applyDrained(world, eid, 1.0); // 1 stack, 1 second duration
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_REMOVED, handler);

            // Act - advance past duration to remove the single stack
            statusEffectSystem(world, 1.5);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectRemovedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(3);
        });

        it('should emit STATUS_EFFECT_REMOVED when disabled expires', () => {
            // Arrange
            const eid = createTestEnemy();
            applyDisabled(world, eid, 1.0, 1); // 1 second duration
            const handler = vi.fn();
            eventBus.on(GameEventType.STATUS_EFFECT_REMOVED, handler);

            // Act - advance past duration
            statusEffectSystem(world, 1.5);

            // Assert
            expect(handler).toHaveBeenCalledOnce();
            const payload = handler.mock.calls[0][0] as StatusEffectRemovedPayload;
            expect(payload.entityId).toBe(eid);
            expect(payload.effectType).toBe(4);
        });
    });

    describe('Status effect processing', () => {
        it('should deal burning damage over time', () => {
            // Arrange
            const eid = createTestEnemy();
            const initialHealth = Health.current[eid];
            applyBurning(world, eid, 10.0, 2.0); // 10 dmg/tick, 2 ticks

            // Act - process one tick
            statusEffectSystem(world, 1.0);

            // Assert
            expect(Health.current[eid]).toBe(initialHealth - 10);
        });

        it('should reduce velocity when slowed', () => {
            // Arrange
            const eid = createTestEnemy();
            Velocity.x[eid] = 100;
            Velocity.y[eid] = 0;

            // Act
            applySlowed(world, eid, 0.5, 3.0); // 50% slow

            // Assert
            expect(Velocity.x[eid]).toBeCloseTo(50);
        });

        it('should stack drained effect up to max stacks', () => {
            // Arrange
            const eid = createTestEnemy();

            // Act - apply drain 4 times (max is 3)
            applyDrained(world, eid, 3.0);
            applyDrained(world, eid, 3.0);
            applyDrained(world, eid, 3.0);
            applyDrained(world, eid, 3.0);

            // Assert
            expect(DrainedStatus.stacks[eid]).toBe(3); // Capped at max 3
        });

        it('should set disabled systems bitmask', () => {
            // Arrange
            const eid = createTestEnemy();

            // Act
            applyDisabled(world, eid, 2.0, 3); // weapons + engines

            // Assert
            expect(DisabledStatus.disabledSystems[eid]).toBe(3);
        });
    });
});
