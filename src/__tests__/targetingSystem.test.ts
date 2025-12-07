/**
 * Tests for Targeting System
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld, createTurret, createKlingonShip } from '../ecs';
import { PoolManager } from '../ecs/PoolManager';
import { Position, Target, Health } from '../ecs/components';
import { TurretType, GAME_CONFIG } from '../types/constants';
import { SpatialHash } from '../collision/spatialHash';
import { createTargetingSystem } from '../systems/targetingSystem';
import type { GameWorld } from '../ecs/world';

describe('Targeting System', () => {
  let world: GameWorld;
  let spatialHash: SpatialHash;
  let targetingSystem: ReturnType<typeof createTargetingSystem>;

  beforeEach(() => {
    world = createGameWorld();
    PoolManager.getInstance().init(world);
    spatialHash = new SpatialHash(
      GAME_CONFIG.COLLISION_CELL_SIZE,
      GAME_CONFIG.WORLD_WIDTH,
      GAME_CONFIG.WORLD_HEIGHT
    );
    targetingSystem = createTargetingSystem(spatialHash);
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  describe('Target acquisition', () => {
    it('should acquire target when enemy is in range', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create enemy within range (phaser range is 200)
      const enemyId = createKlingonShip(world, 550, 500);

      // Update spatial hash with entity positions
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(enemyId, Position.x[enemyId], Position.y[enemyId]);

      // Run targeting system
      targetingSystem(world);

      // Check that turret has target
      expect(Target.hasTarget[turretId]).toBe(1);
      expect(Target.entityId[turretId]).toBe(enemyId);
    });

    it('should not acquire target when enemy is out of range', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create enemy outside range (phaser range is 200)
      const enemyId = createKlingonShip(world, 1000, 500);

      // Update spatial hash with entity positions
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(enemyId, Position.x[enemyId], Position.y[enemyId]);

      // Run targeting system
      targetingSystem(world);

      // Check that turret has no target
      expect(Target.hasTarget[turretId]).toBe(0);
    });

    it('should select closest enemy when multiple enemies in range', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create two enemies, one closer than the other
      const farEnemyId = createKlingonShip(world, 600, 500);    // 100 units away
      const closeEnemyId = createKlingonShip(world, 550, 500);  // 50 units away

      // Update spatial hash with entity positions
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(farEnemyId, Position.x[farEnemyId], Position.y[farEnemyId]);
      spatialHash.insert(closeEnemyId, Position.x[closeEnemyId], Position.y[closeEnemyId]);

      // Run targeting system
      targetingSystem(world);

      // Check that turret targets the closer enemy
      expect(Target.hasTarget[turretId]).toBe(1);
      expect(Target.entityId[turretId]).toBe(closeEnemyId);
    });

    it('should not target Federation units', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create another Federation turret nearby (should not be targeted)
      const otherTurretId = createTurret(world, 550, 500, TurretType.PHASER_ARRAY);

      // Update spatial hash with entity positions
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(otherTurretId, Position.x[otherTurretId], Position.y[otherTurretId]);

      // Run targeting system
      targetingSystem(world);

      // Check that turret has no target
      expect(Target.hasTarget[turretId]).toBe(0);
    });
  });

  describe('Target retention', () => {
    it('should keep current target if still valid', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create enemy within range
      const enemyId = createKlingonShip(world, 550, 500);

      // Update spatial hash
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(enemyId, Position.x[enemyId], Position.y[enemyId]);

      // Run targeting system
      targetingSystem(world);

      // Verify target acquired
      expect(Target.hasTarget[turretId]).toBe(1);
      expect(Target.entityId[turretId]).toBe(enemyId);

      // Run targeting system again - target should be retained
      targetingSystem(world);

      expect(Target.hasTarget[turretId]).toBe(1);
      expect(Target.entityId[turretId]).toBe(enemyId);
    });

    it('should lose target when enemy dies', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create enemy within range
      const enemyId = createKlingonShip(world, 550, 500);

      // Update spatial hash
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(enemyId, Position.x[enemyId], Position.y[enemyId]);

      // Run targeting system
      targetingSystem(world);

      // Verify target acquired
      expect(Target.hasTarget[turretId]).toBe(1);

      // Kill the enemy
      Health.current[enemyId] = 0;

      // Run targeting system again
      targetingSystem(world);

      // Target should be lost
      expect(Target.hasTarget[turretId]).toBe(0);
    });

    it('should lose target when enemy leaves range', () => {
      // Create turret at center
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // Create enemy within range
      const enemyId = createKlingonShip(world, 550, 500);

      // Update spatial hash
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(enemyId, Position.x[enemyId], Position.y[enemyId]);

      // Run targeting system
      targetingSystem(world);

      // Verify target acquired
      expect(Target.hasTarget[turretId]).toBe(1);

      // Move enemy out of range
      Position.x[enemyId] = 1000;

      // Update spatial hash
      spatialHash.clear();
      spatialHash.insert(turretId, Position.x[turretId], Position.y[turretId]);
      spatialHash.insert(enemyId, Position.x[enemyId], Position.y[enemyId]);

      // Run targeting system again
      targetingSystem(world);

      // Target should be lost
      expect(Target.hasTarget[turretId]).toBe(0);
    });
  });
});
