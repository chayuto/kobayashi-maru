/**
 * Tests for Combat System
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld, createTurret, createEnemy } from '../ecs';
import { PoolManager } from '../ecs/PoolManager';
import { Target, Health, Shield, Turret } from '../ecs/components';
import { TurretType, TURRET_CONFIG, FactionId } from '../types/constants';
import { createCombatSystem } from '../systems/combatSystem';
import type { GameWorld } from '../ecs/world';

describe('Combat System', () => {
  let world: GameWorld;
  let combatSystem: ReturnType<typeof createCombatSystem>;

  beforeEach(() => {
    world = createGameWorld();
    PoolManager.getInstance().init(world);
    combatSystem = createCombatSystem();
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  describe('Fire rate cooldown', () => {
    it('should fire when cooldown has passed', () => {
      // Create turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;

      // Set lastFired to 0 and current time to 1 (well past cooldown)
      Turret.lastFired[turretId] = 0;

      const initialHealth = Health.current[enemyId] + Shield.current[enemyId];

      // Run combat system with time = 1 second
      combatSystem.update(world, 0.016, 1);

      // Check that damage was applied
      const finalHealth = Health.current[enemyId] + Shield.current[enemyId];
      expect(finalHealth).toBeLessThan(initialHealth);
    });

    it('should not fire when on cooldown', () => {
      // Create turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;

      // Set lastFired very recently (0.1 seconds ago for a 4 shots/sec turret = 0.25s cooldown)
      Turret.lastFired[turretId] = 0.9;

      const initialHealth = Health.current[enemyId] + Shield.current[enemyId];

      // Run combat system with time = 1 second (only 0.1s since last fire)
      combatSystem.update(world, 0.016, 1);

      // Check that no damage was applied
      const finalHealth = Health.current[enemyId] + Shield.current[enemyId];
      expect(finalHealth).toBe(initialHealth);
    });

    it('should skip turrets with invalid fire rate', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;
      Turret.fireRate[turretId] = 0; // Invalid fire rate

      const initialHealth = Health.current[enemyId] + Shield.current[enemyId];
      combatSystem.update(world, 0.016, 1);

      // No damage should be applied with 0 fire rate
      const finalHealth = Health.current[enemyId] + Shield.current[enemyId];
      expect(finalHealth).toBe(initialHealth);
    });
  });

  describe('Damage application', () => {
    it('should damage shields first', () => {
      // Create turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      const initialShield = Shield.current[enemyId];
      const initialHealth = Health.current[enemyId];
      const damage = TURRET_CONFIG[TurretType.PHASER_ARRAY].damage;

      // Run combat system
      combatSystem.update(world, 0.016, 1);

      // Shield should be damaged first
      expect(Shield.current[enemyId]).toBe(initialShield - damage);
      expect(Health.current[enemyId]).toBe(initialHealth);
    });

    it('should damage health after shields are depleted', () => {
      // Create turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Deplete shields
      Shield.current[enemyId] = 0;

      const initialHealth = Health.current[enemyId];
      const damage = TURRET_CONFIG[TurretType.PHASER_ARRAY].damage;

      // Run combat system
      combatSystem.update(world, 0.016, 1);

      // Health should be damaged
      expect(Health.current[enemyId]).toBe(initialHealth - damage);
    });

    it('should apply remaining damage to health when shields partially absorb', () => {
      // Create turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Set shields to less than damage amount
      Shield.current[enemyId] = 5;  // Less than 10 damage

      const initialHealth = Health.current[enemyId];

      // Run combat system
      combatSystem.update(world, 0.016, 1);

      // Shields should be 0 and health should take remaining damage
      expect(Shield.current[enemyId]).toBe(0);
      expect(Health.current[enemyId]).toBe(initialHealth - 5);  // 10 damage - 5 shield = 5 health damage
    });
  });

  describe('Multi-target firing', () => {
    it('should fire at secondary target when set', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemy1 = createEnemy(world, FactionId.KLINGON, 550, 500);
      const enemy2 = createEnemy(world, FactionId.ROMULAN, 450, 500);

      // Set both primary and secondary targets
      Target.entityId[turretId] = enemy1;
      Target.hasTarget[turretId] = 1;
      Target.entityId2[turretId] = enemy2;
      Target.hasTarget2[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      const initial1 = Health.current[enemy1] + Shield.current[enemy1];
      const initial2 = Health.current[enemy2] + Shield.current[enemy2];

      combatSystem.update(world, 0.016, 1);

      // Both should take damage
      expect(Health.current[enemy1] + Shield.current[enemy1]).toBeLessThan(initial1);
      expect(Health.current[enemy2] + Shield.current[enemy2]).toBeLessThan(initial2);
    });

    it('should fire at tertiary target when set', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemy1 = createEnemy(world, FactionId.KLINGON, 550, 500);
      const enemy2 = createEnemy(world, FactionId.ROMULAN, 450, 500);
      const enemy3 = createEnemy(world, FactionId.BORG, 500, 450);

      // Set all three targets
      Target.entityId[turretId] = enemy1;
      Target.hasTarget[turretId] = 1;
      Target.entityId2[turretId] = enemy2;
      Target.hasTarget2[turretId] = 1;
      Target.entityId3[turretId] = enemy3;
      Target.hasTarget3[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      const initial3 = Health.current[enemy3] + Shield.current[enemy3];

      combatSystem.update(world, 0.016, 1);

      expect(Health.current[enemy3] + Shield.current[enemy3]).toBeLessThan(initial3);
    });

    it('should clear secondary target when target dies', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemy1 = createEnemy(world, FactionId.KLINGON, 550, 500);
      const enemy2 = createEnemy(world, FactionId.ROMULAN, 450, 500);

      Target.entityId[turretId] = enemy1;
      Target.hasTarget[turretId] = 1;
      Target.entityId2[turretId] = enemy2;
      Target.hasTarget2[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Set enemy2 to die on hit
      Health.current[enemy2] = 1;
      Shield.current[enemy2] = 0;

      combatSystem.update(world, 0.016, 1);

      expect(Target.hasTarget2[turretId]).toBe(0);
    });

    it('should clear tertiary target when target dies', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemy1 = createEnemy(world, FactionId.KLINGON, 550, 500);
      const enemy3 = createEnemy(world, FactionId.BORG, 500, 450);

      Target.entityId[turretId] = enemy1;
      Target.hasTarget[turretId] = 1;
      Target.entityId3[turretId] = enemy3;
      Target.hasTarget3[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      Health.current[enemy3] = 1;
      Shield.current[enemy3] = 0;

      combatSystem.update(world, 0.016, 1);

      expect(Target.hasTarget3[turretId]).toBe(0);
    });

    it('should skip invalid secondary target', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemy1 = createEnemy(world, FactionId.KLINGON, 550, 500);
      const enemy2 = createEnemy(world, FactionId.ROMULAN, 450, 500);

      Target.entityId[turretId] = enemy1;
      Target.hasTarget[turretId] = 1;
      Target.entityId2[turretId] = enemy2;
      Target.hasTarget2[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Kill enemy2 before combat runs
      Health.current[enemy2] = 0;

      combatSystem.update(world, 0.016, 1);

      // Secondary target should be cleared
      expect(Target.hasTarget2[turretId]).toBe(0);
    });
  });

  describe('Beam visuals', () => {
    it('should create beam visual for beam weapons', () => {
      // Create phaser turret (beam weapon) and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Run combat system
      combatSystem.update(world, 0.016, 1);

      // Check beam visuals
      const beams = combatSystem.getActiveBeams();
      expect(beams.length).toBe(1);
      expect(beams[0].startX).toBe(500);
      expect(beams[0].startY).toBe(500);
      expect(beams[0].endX).toBe(550);
      expect(beams[0].endY).toBe(500);
      expect(beams[0].turretType).toBe(TurretType.PHASER_ARRAY);
    });

    it('should clear beam visuals each frame', () => {
      // Create phaser turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Run combat system
      combatSystem.update(world, 0.016, 1);
      expect(combatSystem.getActiveBeams().length).toBe(1);

      // Run again but on cooldown
      combatSystem.update(world, 0.016, 1.1);
      expect(combatSystem.getActiveBeams().length).toBe(0);
    });

    it('should create multiple beam visuals for multi-target', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemy1 = createEnemy(world, FactionId.KLINGON, 550, 500);
      const enemy2 = createEnemy(world, FactionId.ROMULAN, 450, 500);

      Target.entityId[turretId] = enemy1;
      Target.hasTarget[turretId] = 1;
      Target.entityId2[turretId] = enemy2;
      Target.hasTarget2[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      combatSystem.update(world, 0.016, 1);

      expect(combatSystem.getActiveBeams().length).toBe(2);
    });
  });

  describe('Target validation', () => {
    it('should clear target when target health reaches 0', () => {
      // Create turret and enemy
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      // Manually set target
      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      // Set enemy to low health (will die from one hit)
      Health.current[enemyId] = 5;
      Shield.current[enemyId] = 0;

      // Run combat system
      combatSystem.update(world, 0.016, 1);

      // Target should be cleared because enemy health is now 0
      expect(Health.current[enemyId]).toBe(0);
      expect(Target.hasTarget[turretId]).toBe(0);
    });

    it('should skip turrets with no valid targets', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);

      // No targets set
      Target.hasTarget[turretId] = 0;
      Turret.lastFired[turretId] = 0;

      // Should not throw
      expect(() => combatSystem.update(world, 0.016, 1)).not.toThrow();
    });
  });

  describe('Combat statistics', () => {
    it('should track total damage dealt', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      combatSystem.update(world, 0.016, 1);

      const stats = combatSystem.getStats();
      expect(stats.totalDamageDealt).toBeGreaterThan(0);
      expect(stats.totalShotsFired).toBe(1);
      expect(stats.shotsHit).toBe(1);
    });

    it('should calculate DPS correctly', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      combatSystem.update(world, 0.016, 1);

      const stats = combatSystem.getStats();
      expect(stats.dps).toBeGreaterThan(0);
    });

    it('should calculate accuracy correctly', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      combatSystem.update(world, 0.016, 1);

      const stats = combatSystem.getStats();
      expect(stats.accuracy).toBe(1); // 100% accuracy for beam weapons
    });

    it('should reset stats correctly', () => {
      const turretId = createTurret(world, 500, 500, TurretType.PHASER_ARRAY);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      combatSystem.update(world, 0.016, 1);
      combatSystem.resetStats();

      const stats = combatSystem.getStats();
      expect(stats.totalDamageDealt).toBe(0);
      expect(stats.totalShotsFired).toBe(0);
      expect(stats.shotsHit).toBe(0);
    });

    it('should record projectile hits', () => {
      combatSystem.recordProjectileHit(25, 1);
      combatSystem.recordProjectileHit(30, 1.5);

      const stats = combatSystem.getStats();
      expect(stats.totalDamageDealt).toBe(55);
      expect(stats.shotsHit).toBe(2);
    });

    it('should return 0 accuracy when no shots fired', () => {
      const stats = combatSystem.getStats();
      expect(stats.accuracy).toBe(0);
    });
  });

  describe('Turret types', () => {
    it('should handle disruptor turret', () => {
      const turretId = createTurret(world, 500, 500, TurretType.DISRUPTOR_BANK);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      const initialHealth = Health.current[enemyId] + Shield.current[enemyId];
      combatSystem.update(world, 0.016, 1);

      expect(Health.current[enemyId] + Shield.current[enemyId]).toBeLessThan(initialHealth);
    });

    it('should handle tetryon beam turret', () => {
      const turretId = createTurret(world, 500, 500, TurretType.TETRYON_BEAM);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      const initialHealth = Health.current[enemyId] + Shield.current[enemyId];
      combatSystem.update(world, 0.016, 1);

      expect(Health.current[enemyId] + Shield.current[enemyId]).toBeLessThan(initialHealth);
    });

    it('should handle polaron beam turret', () => {
      const turretId = createTurret(world, 500, 500, TurretType.POLARON_BEAM);
      const enemyId = createEnemy(world, FactionId.KLINGON, 550, 500);

      Target.entityId[turretId] = enemyId;
      Target.hasTarget[turretId] = 1;
      Turret.lastFired[turretId] = 0;

      const initialHealth = Health.current[enemyId] + Shield.current[enemyId];
      combatSystem.update(world, 0.016, 1);

      expect(Health.current[enemyId] + Shield.current[enemyId]).toBeLessThan(initialHealth);
    });
  });
});

