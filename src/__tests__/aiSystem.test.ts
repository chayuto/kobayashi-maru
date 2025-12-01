/**
 * Tests for AI System
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, GameWorld } from '../ecs/world';
import { addEntity, addComponent } from 'bitecs';
import { Position, Velocity, AIBehavior, Faction, Turret } from '../ecs/components';
import { createAISystem } from '../systems/aiSystem';
import { AIBehaviorType, GAME_CONFIG } from '../types/constants';

describe('AI System', () => {
    let world: GameWorld;
    let aiSystem: ReturnType<typeof createAISystem>;

    beforeEach(() => {
        world = createGameWorld();
        aiSystem = createAISystem();
    });

    it('should update velocity for Direct behavior', () => {
        const eid = addEntity(world);
        addComponent(world, Position, eid);
        addComponent(world, Velocity, eid);
        addComponent(world, AIBehavior, eid);
        addComponent(world, Faction, eid);

        Position.x[eid] = 0;
        Position.y[eid] = 0;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        AIBehavior.behaviorType[eid] = AIBehaviorType.DIRECT;
        AIBehavior.aggression[eid] = 1.0;

        // Target is center (1920/2, 1080/2) = (960, 540)
        // From (0,0) to (960, 540) is roughly diagonal

        aiSystem(world, 0.016, 0);

        expect(Velocity.x[eid]).toBeGreaterThan(0);
        expect(Velocity.y[eid]).toBeGreaterThan(0);
    });

    it('should update velocity for Strafe behavior', () => {
        const eid = addEntity(world);
        addComponent(world, Position, eid);
        addComponent(world, Velocity, eid);
        addComponent(world, AIBehavior, eid);
        addComponent(world, Faction, eid);

        Position.x[eid] = 0;
        Position.y[eid] = 540; // Same Y as center
        Velocity.x[eid] = 100;
        Velocity.y[eid] = 0;
        AIBehavior.behaviorType[eid] = AIBehaviorType.STRAFE;
        AIBehavior.aggression[eid] = 0.6;

        // At time 0, strafe might be 0, so check at a later time
        aiSystem(world, 0.016, 0.5);

        // Should have some Y velocity (strafe)
        expect(Velocity.y[eid]).not.toBe(0);
    });

    it('should target nearest turret for Hunter behavior', () => {
        // Create turret
        const turretId = addEntity(world);
        addComponent(world, Position, turretId);
        addComponent(world, Turret, turretId);
        Position.x[turretId] = 100;
        Position.y[turretId] = 100;

        // Create hunter
        const hunterId = addEntity(world);
        addComponent(world, Position, hunterId);
        addComponent(world, Velocity, hunterId);
        addComponent(world, AIBehavior, hunterId);
        addComponent(world, Faction, hunterId);

        Position.x[hunterId] = 0;
        Position.y[hunterId] = 0;
        AIBehavior.behaviorType[hunterId] = AIBehaviorType.HUNTER;
        AIBehavior.aggression[hunterId] = 1.0;

        aiSystem(world, 0.016, 0);

        // Should move towards turret (100, 100)
        expect(Velocity.x[hunterId]).toBeGreaterThan(0);
        expect(Velocity.y[hunterId]).toBeGreaterThan(0);

        // Direction check
        const angle = Math.atan2(Velocity.y[hunterId], Velocity.x[hunterId]);
        const expectedAngle = Math.atan2(100, 100);
        expect(angle).toBeCloseTo(expectedAngle, 1);
    });

    it('should approach target slowly for Orbit behavior when far away', () => {
        const eid = addEntity(world);
        addComponent(world, Position, eid);
        addComponent(world, Velocity, eid);
        addComponent(world, AIBehavior, eid);
        addComponent(world, Faction, eid);

        // Position far from center (outside orbit radius)
        Position.x[eid] = 100;
        Position.y[eid] = 100;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        AIBehavior.behaviorType[eid] = AIBehaviorType.ORBIT;
        AIBehavior.aggression[eid] = 0.5;

        aiSystem(world, 0.016, 0);

        // Should move toward center (960, 540) slowly
        expect(Velocity.x[eid]).toBeGreaterThan(0);
        expect(Velocity.y[eid]).toBeGreaterThan(0);

        // Speed should be slow (approach speed from config)
        const speed = Math.sqrt(Velocity.x[eid] * Velocity.x[eid] + Velocity.y[eid] * Velocity.y[eid]);
        expect(speed).toBeCloseTo(GAME_CONFIG.ORBIT_APPROACH_SPEED, 1);
    });

    it('should orbit around target for Orbit behavior when at orbit distance', () => {
        const eid = addEntity(world);
        addComponent(world, Position, eid);
        addComponent(world, Velocity, eid);
        addComponent(world, AIBehavior, eid);
        addComponent(world, Faction, eid);

        // Position at orbit distance from center
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
        Position.x[eid] = centerX + GAME_CONFIG.ORBIT_RADIUS; // At orbit radius
        Position.y[eid] = centerY;
        Velocity.x[eid] = 0;
        Velocity.y[eid] = 0;
        AIBehavior.behaviorType[eid] = AIBehaviorType.ORBIT;
        AIBehavior.aggression[eid] = 0.5;

        aiSystem(world, 0.016, 0);

        // Should have tangential velocity (perpendicular to radius)
        // At position directly east of center, tangential is north/south
        // So Y velocity should be non-zero, X velocity should be small
        expect(Math.abs(Velocity.y[eid])).toBeGreaterThan(Math.abs(Velocity.x[eid]) * 0.5);
    });
});
