/**
 * Tests for Turret Component and Factory
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createTurret, getEntityCount } from '../ecs';
import { Position, Velocity, Faction, Health, Shield, Turret, Target } from '../ecs/components';
import { TurretType, TURRET_CONFIG, FactionId } from '../types/constants';
import type { GameWorld } from '../ecs/world';

describe('Turret Component and Factory', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld();
  });

  describe('Turret creation', () => {
    it('should create a phaser array turret with correct stats', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const config = TURRET_CONFIG[TurretType.PHASER_ARRAY];
      
      expect(eid).toBeDefined();
      expect(Position.x[eid]).toBe(100);
      expect(Position.y[eid]).toBe(200);
      expect(Velocity.x[eid]).toBe(0);
      expect(Velocity.y[eid]).toBe(0);
      expect(Faction.id[eid]).toBe(FactionId.FEDERATION);
      expect(Health.current[eid]).toBe(config.health);
      expect(Health.max[eid]).toBe(config.health);
      expect(Shield.current[eid]).toBe(config.shield);
      expect(Shield.max[eid]).toBe(config.shield);
      expect(Turret.range[eid]).toBe(config.range);
      expect(Turret.fireRate[eid]).toBe(config.fireRate);
      expect(Turret.damage[eid]).toBe(config.damage);
      expect(Turret.lastFired[eid]).toBe(0);
      expect(Turret.turretType[eid]).toBe(TurretType.PHASER_ARRAY);
      expect(Target.entityId[eid]).toBe(0);
      expect(Target.hasTarget[eid]).toBe(0);
    });

    it('should create a torpedo launcher with correct stats', () => {
      const eid = createTurret(world, 300, 400, TurretType.TORPEDO_LAUNCHER);
      const config = TURRET_CONFIG[TurretType.TORPEDO_LAUNCHER];
      
      expect(Position.x[eid]).toBe(300);
      expect(Position.y[eid]).toBe(400);
      expect(Turret.range[eid]).toBe(config.range);
      expect(Turret.fireRate[eid]).toBe(config.fireRate);
      expect(Turret.damage[eid]).toBe(config.damage);
      expect(Turret.turretType[eid]).toBe(TurretType.TORPEDO_LAUNCHER);
    });

    it('should create a disruptor bank with correct stats', () => {
      const eid = createTurret(world, 500, 600, TurretType.DISRUPTOR_BANK);
      const config = TURRET_CONFIG[TurretType.DISRUPTOR_BANK];
      
      expect(Position.x[eid]).toBe(500);
      expect(Position.y[eid]).toBe(600);
      expect(Turret.range[eid]).toBe(config.range);
      expect(Turret.fireRate[eid]).toBe(config.fireRate);
      expect(Turret.damage[eid]).toBe(config.damage);
      expect(Turret.turretType[eid]).toBe(TurretType.DISRUPTOR_BANK);
    });

    it('should increment entity count when creating turrets', () => {
      expect(getEntityCount()).toBe(0);
      createTurret(world, 100, 100, TurretType.PHASER_ARRAY);
      expect(getEntityCount()).toBe(1);
      createTurret(world, 200, 200, TurretType.TORPEDO_LAUNCHER);
      expect(getEntityCount()).toBe(2);
    });

    it('should default to phaser array for invalid turret type', () => {
      const eid = createTurret(world, 100, 100, 999); // Invalid type
      const config = TURRET_CONFIG[TurretType.PHASER_ARRAY];
      
      expect(Turret.range[eid]).toBe(config.range);
      expect(Turret.fireRate[eid]).toBe(config.fireRate);
    });
  });

  describe('Turret config', () => {
    it('should have correct phaser array config', () => {
      const config = TURRET_CONFIG[TurretType.PHASER_ARRAY];
      expect(config.range).toBe(200);
      expect(config.fireRate).toBe(4);
      expect(config.damage).toBe(10);
      expect(config.cost).toBe(100);
      expect(config.name).toBe('Phaser Array');
    });

    it('should have correct torpedo launcher config', () => {
      const config = TURRET_CONFIG[TurretType.TORPEDO_LAUNCHER];
      expect(config.range).toBe(350);
      expect(config.fireRate).toBe(0.5);
      expect(config.damage).toBe(50);
      expect(config.cost).toBe(200);
      expect(config.name).toBe('Torpedo Launcher');
    });

    it('should have correct disruptor bank config', () => {
      const config = TURRET_CONFIG[TurretType.DISRUPTOR_BANK];
      expect(config.range).toBe(250);
      expect(config.fireRate).toBe(2);
      expect(config.damage).toBe(15);
      expect(config.cost).toBe(150);
      expect(config.name).toBe('Disruptor Bank');
    });
  });
});
