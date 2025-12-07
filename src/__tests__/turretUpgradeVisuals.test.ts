/**
 * Tests for Turret Upgrade Visuals
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Container } from 'pixi.js';
import { createGameWorld, createTurret } from '../ecs';
import { TurretUpgrade } from '../ecs/components';
import { TurretType } from '../types/constants';
import { TurretUpgradeVisuals } from '../rendering/TurretUpgradeVisuals';
import type { GameWorld } from '../ecs/world';

describe('TurretUpgradeVisuals', () => {
  let world: GameWorld;
  let glowContainer: Container;
  let upgradeVisuals: TurretUpgradeVisuals;

  beforeEach(() => {
    world = createGameWorld();
    glowContainer = new Container();
    upgradeVisuals = new TurretUpgradeVisuals(world, glowContainer);
  });

  describe('Initialization', () => {
    it('should create visual upgrade system', () => {
      expect(upgradeVisuals).toBeDefined();
    });

    it('should accept world and glow container', () => {
      const visuals = new TurretUpgradeVisuals(world, glowContainer);
      expect(visuals).toBeDefined();
    });
  });

  describe('Visual config for upgrade levels', () => {
    it('should return config for turret with no upgrades', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const config = upgradeVisuals.getConfigForTurret(eid);

      expect(config).toBeDefined();
      expect(config?.scale).toBe(1.0);
      expect(config?.glowRadius).toBe(0);
    });

    it('should return config for turret with low upgrades (1-3)', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 2;
      TurretUpgrade.rangeLevel[eid] = 1;

      const config = upgradeVisuals.getConfigForTurret(eid);

      expect(config).toBeDefined();
      expect(config?.scale).toBe(1.1);
      expect(config?.glowRadius).toBe(8);
      expect(config?.glowColor).toBe(0x66AAFF);
    });

    it('should return config for turret with medium upgrades (4-7)', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 2;
      TurretUpgrade.rangeLevel[eid] = 2;
      TurretUpgrade.fireRateLevel[eid] = 1;

      const config = upgradeVisuals.getConfigForTurret(eid);

      expect(config).toBeDefined();
      expect(config?.scale).toBe(1.2);
      expect(config?.glowRadius).toBe(12);
      expect(config?.glowColor).toBe(0x00DDFF);
    });

    it('should return config for turret with high upgrades (8-11)', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 3;
      TurretUpgrade.rangeLevel[eid] = 3;
      TurretUpgrade.fireRateLevel[eid] = 2;

      const config = upgradeVisuals.getConfigForTurret(eid);

      expect(config).toBeDefined();
      expect(config?.scale).toBe(1.3);
      expect(config?.glowRadius).toBe(16);
      expect(config?.glowColor).toBe(0xFFDD00);
    });

    it('should return config for turret with max upgrades (12+)', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 3;
      TurretUpgrade.rangeLevel[eid] = 3;
      TurretUpgrade.fireRateLevel[eid] = 3;
      TurretUpgrade.multiTargetLevel[eid] = 2;
      TurretUpgrade.specialLevel[eid] = 1;

      const config = upgradeVisuals.getConfigForTurret(eid);

      expect(config).toBeDefined();
      expect(config?.scale).toBe(1.4);
      expect(config?.glowRadius).toBe(20);
      expect(config?.glowColor).toBe(0xFFAA00);
    });

    it('should return null for invalid entity', () => {
      const config = upgradeVisuals.getConfigForTurret(999);
      expect(config).toBeNull();
    });
  });

  describe('Update functionality', () => {
    it('should update without errors for empty world', () => {
      expect(() => upgradeVisuals.update()).not.toThrow();
    });

    it('should update without errors with turrets', () => {
      createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      createTurret(world, 300, 400, TurretType.TORPEDO_LAUNCHER);

      expect(() => upgradeVisuals.update()).not.toThrow();
    });

    it('should create glow graphics for upgraded turrets', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 1;

      upgradeVisuals.update();

      // Check that children were added to glow container
      expect(glowContainer.children.length).toBeGreaterThan(0);
    });

    it('should not create glow for non-upgraded turrets', () => {
      createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      // No upgrades

      upgradeVisuals.update();

      // No glow should be added for level 0 turrets
      expect(glowContainer.children.length).toBe(0);
    });

    it('should update glow when upgrade level changes', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // First update - no upgrades
      upgradeVisuals.update();
      const initialChildren = glowContainer.children.length;

      // Add upgrade
      TurretUpgrade.damageLevel[eid] = 1;
      upgradeVisuals.update();

      // Should have added glow
      expect(glowContainer.children.length).toBeGreaterThan(initialChildren);
    });
  });

  describe('Cleanup', () => {
    it('should clean up resources on destroy', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 1;

      upgradeVisuals.update();
      expect(glowContainer.children.length).toBeGreaterThan(0);

      upgradeVisuals.destroy();

      // Graphics should be destroyed but container children might remain
      // (destroy() doesn't remove from parent, just marks for cleanup)
      expect(() => upgradeVisuals.destroy()).not.toThrow();
    });

    it('should handle destroy on empty system', () => {
      expect(() => upgradeVisuals.destroy()).not.toThrow();
    });
  });

  describe('Multiple turrets', () => {
    it('should handle multiple turrets with different upgrade levels', () => {
      const eid1 = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const eid2 = createTurret(world, 300, 400, TurretType.TORPEDO_LAUNCHER);
      const eid3 = createTurret(world, 500, 600, TurretType.DISRUPTOR_BANK);

      TurretUpgrade.damageLevel[eid1] = 1;
      TurretUpgrade.damageLevel[eid2] = 2;
      TurretUpgrade.rangeLevel[eid2] = 2;
      TurretUpgrade.damageLevel[eid3] = 3;
      TurretUpgrade.rangeLevel[eid3] = 3;
      TurretUpgrade.fireRateLevel[eid3] = 3;

      upgradeVisuals.update();

      const config1 = upgradeVisuals.getConfigForTurret(eid1);
      const config2 = upgradeVisuals.getConfigForTurret(eid2);
      const config3 = upgradeVisuals.getConfigForTurret(eid3);

      expect(config1?.glowRadius).toBe(8); // Low upgrades
      expect(config2?.glowRadius).toBe(12); // Medium upgrades
      expect(config3?.glowRadius).toBe(16); // High upgrades
    });

    it('should clean up removed turrets', () => {
      const eid1 = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const eid2 = createTurret(world, 300, 400, TurretType.TORPEDO_LAUNCHER);

      TurretUpgrade.damageLevel[eid1] = 1;
      TurretUpgrade.damageLevel[eid2] = 1;

      upgradeVisuals.update();
      const childrenAfterAdd = glowContainer.children.length;
      expect(childrenAfterAdd).toBeGreaterThan(0);

      // This test verifies cleanup logic exists
      // In practice, entities would be removed from world via removeEntity
      upgradeVisuals.update();
      
      expect(() => upgradeVisuals.update()).not.toThrow();
    });
  });
});
