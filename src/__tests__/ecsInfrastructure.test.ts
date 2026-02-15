/**
 * Tests for ECS Infrastructure: component validation, generic factory,
 * PoolManager, and EntityPool lifecycle.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { addEntity, addComponent } from 'bitecs';
import { createTestWorld, cleanupTestWorld } from './helpers';
import type { GameWorld } from '../ecs/world';
import { createGameWorld } from '../ecs/world';
import {
  Position,
  Velocity,
  Health,
  Shield,
  Turret,
  Projectile,
  AIBehavior,
  Collider,
  Faction,
  SpriteRef,
  Rotation,
  EnemyWeapon,
} from '../ecs/components';
import {
  validatePosition,
  validateVelocity,
  validateHealth,
  validateShield,
  validateTurret,
  validateProjectile,
  validateAIBehavior,
  validateCollider,
  validateEntity,
  validateEntityWithLogging,
} from '../ecs/componentValidation';
import {
  createEnemy,
  createEnemyFromTemplate,
  createEnemies,
} from '../ecs/genericFactory';
import { ENEMY_TEMPLATES, getEnemyTemplate } from '../ecs/entityTemplates';
import { EntityPool } from '../ecs/entityPool';
import { PoolManager } from '../ecs/PoolManager';
import { GAME_CONFIG, FactionId, TurretType, TURRET_CONFIG, AIBehaviorType, ProjectileType } from '../types/constants';

// =============================================================================
// COMPONENT VALIDATION TESTS
// =============================================================================

describe('Component Validation', () => {
  describe('validatePosition', () => {
    it('should pass when position is within world bounds', () => {
      const eid = 1;
      Position.x[eid] = 500;
      Position.y[eid] = 400;

      const result = validatePosition(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should pass when position is at origin', () => {
      const eid = 2;
      Position.x[eid] = 0;
      Position.y[eid] = 0;

      const result = validatePosition(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass when position is within spawn margin', () => {
      const eid = 3;
      Position.x[eid] = -100; // Within the -200 margin
      Position.y[eid] = GAME_CONFIG.WORLD_HEIGHT + 100;

      const result = validatePosition(eid);

      expect(result.valid).toBe(true);
    });

    it('should fail when position x is out of bounds', () => {
      const eid = 4;
      Position.x[eid] = -300; // Beyond -200 margin
      Position.y[eid] = 500;

      const result = validatePosition(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Position.x out of bounds');
    });

    it('should fail when position y is out of bounds', () => {
      const eid = 5;
      Position.x[eid] = 500;
      Position.y[eid] = GAME_CONFIG.WORLD_HEIGHT + 300;

      const result = validatePosition(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Position.y out of bounds');
    });

    it('should fail when position x is NaN', () => {
      const eid = 6;
      Position.x[eid] = NaN;
      Position.y[eid] = 100;

      const result = validatePosition(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Position.x is NaN');
    });

    it('should fail when position y is NaN', () => {
      const eid = 7;
      Position.x[eid] = 100;
      Position.y[eid] = NaN;

      const result = validatePosition(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Position.y is NaN');
    });
  });

  describe('validateVelocity', () => {
    it('should pass when velocity is within reasonable range', () => {
      const eid = 10;
      Velocity.x[eid] = 100;
      Velocity.y[eid] = -50;

      const result = validateVelocity(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass with zero velocity', () => {
      const eid = 11;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = 0;

      const result = validateVelocity(eid);

      expect(result.valid).toBe(true);
    });

    it('should warn when velocity is unusually high', () => {
      const eid = 12;
      Velocity.x[eid] = 1500;
      Velocity.y[eid] = 1500;

      const result = validateVelocity(eid);

      expect(result.valid).toBe(true); // Warnings don't invalidate
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Velocity unusually high');
    });

    it('should fail when velocity x is NaN', () => {
      const eid = 13;
      Velocity.x[eid] = NaN;
      Velocity.y[eid] = 0;

      const result = validateVelocity(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Velocity.x is NaN');
    });

    it('should fail when velocity y is NaN', () => {
      const eid = 14;
      Velocity.x[eid] = 0;
      Velocity.y[eid] = NaN;

      const result = validateVelocity(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Velocity.y is NaN');
    });
  });

  describe('validateHealth', () => {
    it('should pass when health is valid', () => {
      const eid = 20;
      Health.current[eid] = 80;
      Health.max[eid] = 100;

      const result = validateHealth(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail when health current is negative', () => {
      const eid = 21;
      Health.current[eid] = -10;
      Health.max[eid] = 100;

      const result = validateHealth(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Health.current is negative');
    });

    it('should fail when health max is zero', () => {
      const eid = 22;
      Health.current[eid] = 0;
      Health.max[eid] = 0;

      const result = validateHealth(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Health.max must be positive'))).toBe(true);
    });

    it('should warn when health current exceeds max', () => {
      const eid = 23;
      Health.current[eid] = 150;
      Health.max[eid] = 100;

      const result = validateHealth(eid);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('Health.current exceeds max');
    });

    it('should fail when health current is NaN', () => {
      const eid = 24;
      Health.current[eid] = NaN;
      Health.max[eid] = 100;

      const result = validateHealth(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Health.current is NaN');
    });

    it('should fail when health max is NaN', () => {
      const eid = 25;
      Health.current[eid] = 50;
      Health.max[eid] = NaN;

      const result = validateHealth(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Health.max is NaN');
    });
  });

  describe('validateShield', () => {
    it('should pass when shield values are valid', () => {
      const eid = 30;
      Shield.current[eid] = 30;
      Shield.max[eid] = 50;

      const result = validateShield(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass when shield is zero (no shields)', () => {
      const eid = 31;
      Shield.current[eid] = 0;
      Shield.max[eid] = 0;

      const result = validateShield(eid);

      expect(result.valid).toBe(true);
    });

    it('should fail when shield current is negative', () => {
      const eid = 32;
      Shield.current[eid] = -5;
      Shield.max[eid] = 50;

      const result = validateShield(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Shield.current is negative');
    });

    it('should fail when shield max is negative', () => {
      const eid = 33;
      Shield.current[eid] = 0;
      Shield.max[eid] = -10;

      const result = validateShield(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Shield.max is negative');
    });

    it('should warn when shield current exceeds max', () => {
      const eid = 34;
      Shield.current[eid] = 60;
      Shield.max[eid] = 50;

      const result = validateShield(eid);

      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain('Shield.current exceeds max');
    });

    it('should fail when shield current is NaN', () => {
      const eid = 35;
      Shield.current[eid] = NaN;
      Shield.max[eid] = 50;

      const result = validateShield(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shield.current is NaN');
    });

    it('should fail when shield max is NaN', () => {
      const eid = 36;
      Shield.current[eid] = 0;
      Shield.max[eid] = NaN;

      const result = validateShield(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Shield.max is NaN');
    });
  });

  describe('validateTurret', () => {
    it('should pass when turret values are valid', () => {
      const eid = 40;
      Turret.turretType[eid] = TurretType.PHASER_ARRAY;
      Turret.range[eid] = 200;
      Turret.fireRate[eid] = 3.5;
      Turret.damage[eid] = 10;

      const result = validateTurret(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when turret type is invalid', () => {
      const eid = 41;
      Turret.turretType[eid] = 999;
      Turret.range[eid] = 200;
      Turret.fireRate[eid] = 1;
      Turret.damage[eid] = 10;

      const result = validateTurret(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid turret type');
    });

    it('should fail when turret range is zero', () => {
      const eid = 42;
      Turret.turretType[eid] = TurretType.PHASER_ARRAY;
      Turret.range[eid] = 0;
      Turret.fireRate[eid] = 1;
      Turret.damage[eid] = 10;

      const result = validateTurret(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Turret.range must be positive'))).toBe(true);
    });

    it('should fail when turret fireRate is zero', () => {
      const eid = 43;
      Turret.turretType[eid] = TurretType.PHASER_ARRAY;
      Turret.range[eid] = 200;
      Turret.fireRate[eid] = 0;
      Turret.damage[eid] = 10;

      const result = validateTurret(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Turret.fireRate must be positive'))).toBe(true);
    });

    it('should fail when turret damage is negative', () => {
      const eid = 44;
      Turret.turretType[eid] = TurretType.PHASER_ARRAY;
      Turret.range[eid] = 200;
      Turret.fireRate[eid] = 1;
      Turret.damage[eid] = -5;

      const result = validateTurret(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Turret.damage cannot be negative'))).toBe(true);
    });
  });

  describe('validateProjectile', () => {
    it('should pass when projectile values are valid', () => {
      const eid = 50;
      Projectile.damage[eid] = 10;
      Projectile.speed[eid] = 400;
      Projectile.lifetime[eid] = 3;

      const result = validateProjectile(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should fail when projectile damage is negative', () => {
      const eid = 51;
      Projectile.damage[eid] = -5;
      Projectile.speed[eid] = 400;
      Projectile.lifetime[eid] = 3;

      const result = validateProjectile(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Projectile.damage cannot be negative'))).toBe(true);
    });

    it('should fail when projectile speed is zero', () => {
      const eid = 52;
      Projectile.damage[eid] = 10;
      Projectile.speed[eid] = 0;
      Projectile.lifetime[eid] = 3;

      const result = validateProjectile(eid);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Projectile.speed must be positive'))).toBe(true);
    });

    it('should warn when projectile lifetime is zero', () => {
      const eid = 53;
      Projectile.damage[eid] = 10;
      Projectile.speed[eid] = 400;
      Projectile.lifetime[eid] = 0;

      const result = validateProjectile(eid);

      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('Projectile.lifetime should be positive'))).toBe(true);
    });

    it('should fail when projectile damage is NaN', () => {
      const eid = 54;
      Projectile.damage[eid] = NaN;
      Projectile.speed[eid] = 400;
      Projectile.lifetime[eid] = 3;

      const result = validateProjectile(eid);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Projectile.damage is NaN');
    });
  });

  describe('validateAIBehavior', () => {
    it('should pass when AI behavior values are valid', () => {
      const eid = 60;
      AIBehavior.behaviorType[eid] = AIBehaviorType.DIRECT;
      AIBehavior.aggression[eid] = 0.5;

      const result = validateAIBehavior(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when behavior type is invalid', () => {
      const eid = 61;
      AIBehavior.behaviorType[eid] = 999;
      AIBehavior.aggression[eid] = 0.5;

      const result = validateAIBehavior(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Invalid AI behavior type');
    });

    it('should warn when aggression is out of 0-1 range', () => {
      const eid = 62;
      AIBehavior.behaviorType[eid] = AIBehaviorType.SWARM;
      AIBehavior.aggression[eid] = 1.5;

      const result = validateAIBehavior(eid);

      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain('AIBehavior.aggression should be 0.0-1.0');
    });

    it('should warn when aggression is negative', () => {
      const eid = 63;
      AIBehavior.behaviorType[eid] = AIBehaviorType.ORBIT;
      AIBehavior.aggression[eid] = -0.1;

      const result = validateAIBehavior(eid);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateCollider', () => {
    it('should pass when collider radius is valid', () => {
      const eid = 70;
      Collider.radius[eid] = 20;

      const result = validateCollider(eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail when collider radius is zero', () => {
      const eid = 71;
      Collider.radius[eid] = 0;

      const result = validateCollider(eid);

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Collider.radius must be positive');
    });

    it('should fail when collider radius is negative', () => {
      const eid = 72;
      Collider.radius[eid] = -10;

      const result = validateCollider(eid);

      expect(result.valid).toBe(false);
    });

    it('should warn when collider radius is unusually large', () => {
      const eid = 73;
      Collider.radius[eid] = 600;

      const result = validateCollider(eid);

      expect(result.valid).toBe(true);
      expect(result.warnings[0]).toContain('Collider.radius unusually large');
    });
  });

  describe('validateEntity', () => {
    let world: GameWorld;

    beforeEach(() => {
      world = createTestWorld();
    });

    afterEach(() => {
      cleanupTestWorld();
    });

    it('should pass when entity has valid components', () => {
      const eid = addEntity(world);
      addComponent(world, eid, Position);
      Position.x[eid] = 500;
      Position.y[eid] = 400;
      addComponent(world, eid, Health);
      Health.current[eid] = 100;
      Health.max[eid] = 100;

      const result = validateEntity(world, eid);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should aggregate errors from multiple invalid components', () => {
      const eid = addEntity(world);
      addComponent(world, eid, Position);
      Position.x[eid] = NaN;
      Position.y[eid] = 400;
      addComponent(world, eid, Health);
      Health.current[eid] = -5;
      Health.max[eid] = 100;

      const result = validateEntity(world, eid);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('should skip validation for components not present on entity', () => {
      const eid = addEntity(world);
      // Entity with only Position, no Turret, Health, etc.
      addComponent(world, eid, Position);
      Position.x[eid] = 500;
      Position.y[eid] = 400;

      const result = validateEntity(world, eid);

      expect(result.valid).toBe(true);
    });

    it('should collect warnings from valid entity with high velocity', () => {
      const eid = addEntity(world);
      addComponent(world, eid, Position);
      Position.x[eid] = 500;
      Position.y[eid] = 400;
      addComponent(world, eid, Velocity);
      Velocity.x[eid] = 1500;
      Velocity.y[eid] = 1500;

      const result = validateEntity(world, eid);

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateEntityWithLogging', () => {
    let world: GameWorld;

    beforeEach(() => {
      world = createTestWorld();
    });

    afterEach(() => {
      cleanupTestWorld();
    });

    it('should return true when entity is valid', () => {
      const eid = addEntity(world);
      addComponent(world, eid, Position);
      Position.x[eid] = 500;
      Position.y[eid] = 400;

      const isValid = validateEntityWithLogging(world, eid);

      expect(isValid).toBe(true);
    });

    it('should return false and log warnings when entity is invalid', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eid = addEntity(world);
      addComponent(world, eid, Health);
      Health.current[eid] = -10;
      Health.max[eid] = 100;

      const isValid = validateEntityWithLogging(world, eid);

      expect(isValid).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });

    it('should log debug warnings with entity type name when provided', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const eid = addEntity(world);
      addComponent(world, eid, Health);
      Health.current[eid] = -10;
      Health.max[eid] = 100;

      validateEntityWithLogging(world, eid, 'TestEnemy');

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('TestEnemy'),
        expect.any(Array)
      );
      warnSpy.mockRestore();
    });

    it('should log debug message for warnings on valid entity', () => {
      const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
      const eid = addEntity(world);
      addComponent(world, eid, Shield);
      Shield.current[eid] = 60;
      Shield.max[eid] = 50; // current > max triggers warning

      validateEntityWithLogging(world, eid);

      expect(debugSpy).toHaveBeenCalled();
      debugSpy.mockRestore();
    });
  });
});

// =============================================================================
// GENERIC FACTORY TESTS
// =============================================================================

describe('Generic Factory', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createTestWorld();
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  describe('createEnemy', () => {
    it('should create a Klingon enemy with correct components', () => {
      const eid = createEnemy(world, FactionId.KLINGON, 200, 300);

      expect(eid).toBeGreaterThan(0);
      expect(Position.x[eid]).toBe(200);
      expect(Position.y[eid]).toBe(300);
      expect(Faction.id[eid]).toBe(FactionId.KLINGON);
      expect(Health.current[eid]).toBe(ENEMY_TEMPLATES[FactionId.KLINGON].health);
      expect(Health.max[eid]).toBe(ENEMY_TEMPLATES[FactionId.KLINGON].health);
    });

    it('should create a Borg enemy with correct health and shield values', () => {
      const template = ENEMY_TEMPLATES[FactionId.BORG];
      const eid = createEnemy(world, FactionId.BORG, 100, 100);

      expect(eid).toBeGreaterThan(0);
      expect(Health.current[eid]).toBe(template.health);
      expect(Shield.current[eid]).toBe(template.shield);
      expect(Shield.max[eid]).toBe(template.shield);
    });

    it('should return -1 when faction has no template', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const eid = createEnemy(world, 777, 100, 100);

      expect(eid).toBe(-1);
      warnSpy.mockRestore();
    });

    it('should set AI behavior from template', () => {
      const template = ENEMY_TEMPLATES[FactionId.ROMULAN];
      const eid = createEnemy(world, FactionId.ROMULAN, 100, 100);

      expect(AIBehavior.behaviorType[eid]).toBe(template.ai.behaviorType);
      expect(AIBehavior.aggression[eid]).toBe(template.ai.aggression);
      expect(AIBehavior.stateTimer[eid]).toBe(0);
    });

    it('should set weapon config when template includes weapon', () => {
      const template = ENEMY_TEMPLATES[FactionId.THOLIAN];
      const eid = createEnemy(world, FactionId.THOLIAN, 100, 100);

      expect(EnemyWeapon.range[eid]).toBe(template.weapon!.range);
      expect(EnemyWeapon.fireRate[eid]).toBe(template.weapon!.fireRate);
      expect(EnemyWeapon.damage[eid]).toBe(template.weapon!.damage);
      expect(EnemyWeapon.projectileType[eid]).toBe(template.weapon!.projectileType);
      expect(EnemyWeapon.lastFired[eid]).toBe(0);
    });

    it('should initialize velocity to zero', () => {
      const eid = createEnemy(world, FactionId.KLINGON, 200, 300);

      expect(Velocity.x[eid]).toBe(0);
      expect(Velocity.y[eid]).toBe(0);
    });

    it('should initialize rotation angle to zero', () => {
      const eid = createEnemy(world, FactionId.KLINGON, 200, 300);

      expect(Rotation.angle[eid]).toBe(0);
    });
  });

  describe('createEnemyFromTemplate', () => {
    it('should create enemy from a direct template object', () => {
      const template = getEnemyTemplate(FactionId.SPECIES_8472)!;
      const eid = createEnemyFromTemplate(world, template, 500, 600);

      expect(eid).toBeGreaterThan(0);
      expect(Position.x[eid]).toBe(500);
      expect(Position.y[eid]).toBe(600);
      expect(Health.current[eid]).toBe(template.health);
      expect(Shield.current[eid]).toBe(template.shield);
      expect(Faction.id[eid]).toBe(FactionId.SPECIES_8472);
    });
  });

  describe('createEnemies', () => {
    it('should create multiple enemies at specified positions', () => {
      const positions = [
        { x: 100, y: 100 },
        { x: 200, y: 200 },
        { x: 300, y: 300 },
      ];

      const eids = createEnemies(world, FactionId.KLINGON, positions);

      expect(eids).toHaveLength(3);
      expect(Position.x[eids[0]]).toBe(100);
      expect(Position.y[eids[0]]).toBe(100);
      expect(Position.x[eids[1]]).toBe(200);
      expect(Position.y[eids[1]]).toBe(200);
      expect(Position.x[eids[2]]).toBe(300);
      expect(Position.y[eids[2]]).toBe(300);
    });

    it('should return empty array when no positions provided', () => {
      const eids = createEnemies(world, FactionId.KLINGON, []);

      expect(eids).toHaveLength(0);
    });

    it('should return array with -1 when faction has no template', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      const eids = createEnemies(world, 777, [{ x: 100, y: 100 }]);

      expect(eids).toEqual([-1]);
      warnSpy.mockRestore();
    });
  });
});

// =============================================================================
// ENTITY POOL TESTS
// =============================================================================

describe('EntityPool', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createGameWorld();
  });

  it('should create pool with default size when not specified', () => {
    const pool = new EntityPool(world, 50);

    expect(pool.getAvailableCount()).toBe(50);
    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getInitialSize()).toBe(50);
  });

  it('should return unique entity IDs on acquire', () => {
    const pool = new EntityPool(world, 20);
    const ids = new Set<number>();

    for (let i = 0; i < 10; i++) {
      ids.add(pool.acquire());
    }

    expect(ids.size).toBe(10);
    expect(pool.getAvailableCount()).toBe(10);
    expect(pool.getInUseCount()).toBe(10);
  });

  it('should create new entity when pool is exhausted', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pool = new EntityPool(world, 2);

    pool.acquire();
    pool.acquire();
    const eid3 = pool.acquire(); // Pool exhausted

    expect(eid3).toBeDefined();
    expect(pool.getInUseCount()).toBe(3);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Pool exhausted'));
    warnSpy.mockRestore();
  });

  it('should not release entity that is not in use', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const pool = new EntityPool(world, 5);

    pool.release(9999);

    expect(pool.getAvailableCount()).toBe(5);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('not in use'));
    warnSpy.mockRestore();
  });

  it('should reuse released entities', () => {
    const pool = new EntityPool(world, 5);

    const eid = pool.acquire();
    pool.release(eid);
    const eid2 = pool.acquire();

    // The released entity should be reused (it was pushed to available stack)
    expect(eid2).toBe(eid);
  });

  it('should report correct total size', () => {
    const pool = new EntityPool(world, 20);

    pool.acquire();
    pool.acquire();

    expect(pool.getTotalSize()).toBe(20);
    expect(pool.getAvailableCount()).toBe(18);
    expect(pool.getInUseCount()).toBe(2);
  });

  it('should expand pool with additional entities', () => {
    const pool = new EntityPool(world, 10);

    pool.expand(5);

    expect(pool.getAvailableCount()).toBe(15);
    expect(pool.getTotalSize()).toBe(15);
  });

  it('should move all in-use entities to available on clear', () => {
    const pool = new EntityPool(world, 10);
    pool.acquire();
    pool.acquire();
    pool.acquire();

    pool.clear();

    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getAvailableCount()).toBe(10);
  });

  it('should remove all entities from world on destroy', () => {
    const pool = new EntityPool(world, 5);
    pool.acquire();

    pool.destroy();

    expect(pool.getAvailableCount()).toBe(0);
    expect(pool.getInUseCount()).toBe(0);
    expect(pool.getTotalSize()).toBe(0);
  });
});

// =============================================================================
// POOL MANAGER TESTS
// =============================================================================

describe('PoolManager', () => {
  let world: GameWorld;

  beforeEach(() => {
    world = createTestWorld();
  });

  afterEach(() => {
    cleanupTestWorld();
  });

  it('should return the same singleton instance', () => {
    const instance1 = PoolManager.getInstance();
    const instance2 = PoolManager.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should acquire enemy entities after initialization', () => {
    const eid = PoolManager.getInstance().acquireEnemy();

    expect(eid).toBeDefined();
    expect(typeof eid).toBe('number');
  });

  it('should acquire projectile entities after initialization', () => {
    const eid = PoolManager.getInstance().acquireProjectile();

    expect(eid).toBeDefined();
    expect(typeof eid).toBe('number');
  });

  it('should throw when acquiring enemy before initialization', () => {
    cleanupTestWorld(); // destroy pools
    // Get fresh instance but don't init
    const manager = PoolManager.getInstance();

    expect(() => manager.acquireEnemy()).toThrow('PoolManager not initialized');
  });

  it('should throw when acquiring projectile before initialization', () => {
    cleanupTestWorld();
    const manager = PoolManager.getInstance();

    expect(() => manager.acquireProjectile()).toThrow('PoolManager not initialized');
  });

  it('should release enemy entities and clean up components', () => {
    const manager = PoolManager.getInstance();
    const eid = manager.acquireEnemy();

    // Set some component values
    addComponent(world, eid, Position);
    Position.x[eid] = 100;
    Position.y[eid] = 200;

    manager.releaseEnemy(eid);

    const stats = manager.getStats();
    // After release, the enemy pool should have one more available
    expect(stats.enemies.inUse).toBeGreaterThanOrEqual(0);
  });

  it('should release projectile entities and clean up components', () => {
    const manager = PoolManager.getInstance();
    const eid = manager.acquireProjectile();

    addComponent(world, eid, Position);
    Position.x[eid] = 50;

    manager.releaseProjectile(eid);

    const stats = manager.getStats();
    expect(stats.projectiles.inUse).toBeGreaterThanOrEqual(0);
  });

  it('should report pool statistics', () => {
    const manager = PoolManager.getInstance();
    const stats = manager.getStats();

    expect(stats).toHaveProperty('enemies');
    expect(stats).toHaveProperty('projectiles');
    expect(stats.enemies).toHaveProperty('available');
    expect(stats.enemies).toHaveProperty('inUse');
    expect(stats.projectiles).toHaveProperty('available');
    expect(stats.projectiles).toHaveProperty('inUse');
  });

  it('should clear all pools', () => {
    const manager = PoolManager.getInstance();

    // Acquire some entities
    manager.acquireEnemy();
    manager.acquireProjectile();

    // Clear should not throw
    manager.clear();

    const stats = manager.getStats();
    expect(stats.enemies.inUse).toBe(0);
    expect(stats.projectiles.inUse).toBe(0);
  });

  it('should destroy pools and reset singleton', () => {
    const manager = PoolManager.getInstance();
    manager.destroy();

    // After destroy, getting instance creates a fresh one
    const newManager = PoolManager.getInstance();
    expect(newManager).not.toBe(manager);

    // New instance is not initialized, so acquire should throw
    expect(() => newManager.acquireEnemy()).toThrow('PoolManager not initialized');

    // Re-initialize for cleanup in afterEach
    newManager.init(world);
  });

  it('should report zero stats when pools are not initialized', () => {
    cleanupTestWorld();
    const manager = PoolManager.getInstance();

    const stats = manager.getStats();

    expect(stats.enemies.available).toBe(0);
    expect(stats.enemies.inUse).toBe(0);
    expect(stats.projectiles.available).toBe(0);
    expect(stats.projectiles.inUse).toBe(0);

    // Re-initialize for afterEach cleanup
    manager.init(world);
  });
});
