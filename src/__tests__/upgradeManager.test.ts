/**
 * Tests for Upgrade Manager
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameWorld, createTurret } from '../ecs';
import { Turret, TurretUpgrade } from '../ecs/components';
import { TurretType, UpgradePath, TURRET_CONFIG } from '../types/constants';
import { UpgradeManager } from '../game/UpgradeManager';
import { ResourceManager } from '../game/resourceManager';
import type { GameWorld } from '../ecs/world';

describe('UpgradeManager', () => {
  let world: GameWorld;
  let resourceManager: ResourceManager;
  let upgradeManager: UpgradeManager;

  beforeEach(() => {
    world = createGameWorld();
    resourceManager = new ResourceManager();
    upgradeManager = new UpgradeManager(world, resourceManager);
    resourceManager.reset(); // Start with 500 resources
  });

  describe('Turret info', () => {
    it('should get turret upgrade info', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);

      expect(info).toBeDefined();
      expect(info?.entityId).toBe(eid);
      expect(info?.turretType).toBe(TurretType.PHASER_ARRAY);
      expect(info?.baseCost).toBe(TURRET_CONFIG[TurretType.PHASER_ARRAY].cost);
      expect(info?.totalInvestment).toBe(TURRET_CONFIG[TurretType.PHASER_ARRAY].cost);
      expect(info?.upgrades.damage).toBe(0);
      expect(info?.upgrades.range).toBe(0);
      expect(info?.upgrades.fireRate).toBe(0);
      expect(info?.upgrades.multiTarget).toBe(0);
      expect(info?.upgrades.special).toBe(0);
    });

    it('should return null for invalid entity', () => {
      const info = upgradeManager.getTurretInfo(999);
      expect(info).toBeNull();
    });

    it('should calculate current stats correctly', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);
      const config = TURRET_CONFIG[TurretType.PHASER_ARRAY];

      expect(info?.currentStats.damage).toBe(config.damage);
      expect(info?.currentStats.range).toBe(config.range);
      expect(info?.currentStats.fireRate).toBe(config.fireRate);
      expect(info?.currentStats.maxTargets).toBe(1);
    });
  });

  describe('Upgrade availability', () => {
    it('should allow upgrade when affordable and not at max level', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      expect(upgradeManager.canUpgrade(eid, UpgradePath.DAMAGE)).toBe(true);
    });

    it('should not allow upgrade when insufficient resources', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      resourceManager.spendResources(500); // Spend all resources
      expect(upgradeManager.canUpgrade(eid, UpgradePath.DAMAGE)).toBe(false);
    });

    it('should not allow upgrade when at max level', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // Max out damage upgrades
      TurretUpgrade.damageLevel[eid] = 3;
      
      expect(upgradeManager.canUpgrade(eid, UpgradePath.DAMAGE)).toBe(false);
    });

    it('should get correct upgrade cost', () => {
      const cost = upgradeManager.getUpgradeCost(UpgradePath.DAMAGE, 0);
      expect(cost).toBe(50); // First damage upgrade costs 50
    });

    it('should return infinity for cost at max level', () => {
      const cost = upgradeManager.getUpgradeCost(UpgradePath.DAMAGE, 3);
      expect(cost).toBe(Infinity);
    });
  });

  describe('Applying upgrades', () => {
    it('should apply damage upgrade and update stats', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const initialDamage = Turret.damage[eid];
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      
      expect(result.success).toBe(true);
      expect(TurretUpgrade.damageLevel[eid]).toBe(1);
      expect(Turret.damage[eid]).toBeGreaterThan(initialDamage);
    });

    it('should apply range upgrade and update stats', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const initialRange = Turret.range[eid];
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.RANGE);
      
      expect(result.success).toBe(true);
      expect(TurretUpgrade.rangeLevel[eid]).toBe(1);
      expect(Turret.range[eid]).toBeGreaterThan(initialRange);
    });

    it('should apply fire rate upgrade and update stats', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const initialRate = Turret.fireRate[eid];
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.FIRE_RATE);
      
      expect(result.success).toBe(true);
      expect(TurretUpgrade.fireRateLevel[eid]).toBe(1);
      expect(Turret.fireRate[eid]).toBeGreaterThan(initialRate);
    });

    it('should apply multi-target upgrade', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.MULTI_TARGET);
      
      expect(result.success).toBe(true);
      expect(TurretUpgrade.multiTargetLevel[eid]).toBe(1);
      
      const info = upgradeManager.getTurretInfo(eid);
      expect(info?.currentStats.maxTargets).toBe(2);
    });

    it('should apply special upgrade', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.SPECIAL);
      
      expect(result.success).toBe(true);
      expect(TurretUpgrade.specialLevel[eid]).toBe(1);
    });

    it('should deduct resources when upgrading', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const initialResources = resourceManager.getResources();
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      
      expect(resourceManager.getResources()).toBe(initialResources - 50);
    });

    it('should fail upgrade when insufficient resources', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      resourceManager.spendResources(500);
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('Cannot upgrade');
    });

    it('should fail upgrade at max level', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      TurretUpgrade.damageLevel[eid] = 3;
      
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      
      expect(result.success).toBe(false);
    });

    it('should allow multiple sequential upgrades', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      
      expect(TurretUpgrade.damageLevel[eid]).toBe(2);
    });
  });

  describe('Selling turrets', () => {
    it('should get correct sell refund amount', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const baseCost = TURRET_CONFIG[TurretType.PHASER_ARRAY].cost;
      
      const refund = upgradeManager.getSellRefund(eid);
      
      expect(refund).toBe(Math.floor(baseCost * 0.75));
    });

    it('should get correct refund for upgraded turret', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const baseCost = TURRET_CONFIG[TurretType.PHASER_ARRAY].cost;
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE); // +50
      
      const refund = upgradeManager.getSellRefund(eid);
      const expectedRefund = Math.floor((baseCost + 50) * 0.75);
      
      expect(refund).toBe(expectedRefund);
    });

    it('should refund resources when selling turret', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const initialResources = resourceManager.getResources();
      
      const refund = upgradeManager.sellTurret(eid);
      
      expect(refund).toBeGreaterThan(0);
      expect(resourceManager.getResources()).toBe(initialResources + refund);
    });

    it('should return -1 when selling invalid entity', () => {
      const refund = upgradeManager.sellTurret(999);
      expect(refund).toBe(-1);
    });

    it('should return 0 refund for invalid entity', () => {
      const refund = upgradeManager.getSellRefund(999);
      expect(refund).toBe(0);
    });
  });

  describe('Total investment calculation', () => {
    it('should track total investment with multiple upgrades', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const baseCost = TURRET_CONFIG[TurretType.PHASER_ARRAY].cost;
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE); // +50
      upgradeManager.applyUpgrade(eid, UpgradePath.RANGE); // +40
      
      const info = upgradeManager.getTurretInfo(eid);
      expect(info?.totalInvestment).toBe(baseCost + 50 + 40);
    });

    it('should calculate refund based on total investment', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      upgradeManager.applyUpgrade(eid, UpgradePath.RANGE);
      
      const info = upgradeManager.getTurretInfo(eid);
      const refund = upgradeManager.getSellRefund(eid);
      
      expect(refund).toBe(Math.floor(info!.totalInvestment * 0.75));
    });
  });

  describe('Upgrade stat calculations', () => {
    it('should apply correct damage bonus percentages', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const baseDamage = TURRET_CONFIG[TurretType.PHASER_ARRAY].damage;
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE); // +25%
      expect(Turret.damage[eid]).toBeCloseTo(baseDamage * 1.25, 1);
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE); // +50% total
      expect(Turret.damage[eid]).toBeCloseTo(baseDamage * 1.5, 1);
      
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE); // +100% total
      expect(Turret.damage[eid]).toBeCloseTo(baseDamage * 2, 1);
    });

    it('should apply correct range bonus percentages', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const baseRange = TURRET_CONFIG[TurretType.PHASER_ARRAY].range;
      
      upgradeManager.applyUpgrade(eid, UpgradePath.RANGE); // +20%
      expect(Turret.range[eid]).toBeCloseTo(baseRange * 1.2, 1);
    });

    it('should apply correct fire rate bonus percentages', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const baseRate = TURRET_CONFIG[TurretType.PHASER_ARRAY].fireRate;
      
      upgradeManager.applyUpgrade(eid, UpgradePath.FIRE_RATE); // +30%
      expect(Turret.fireRate[eid]).toBeCloseTo(baseRate * 1.3, 1);
    });
  });
});
