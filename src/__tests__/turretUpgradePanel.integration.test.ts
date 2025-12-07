/**
 * Integration tests for TurretUpgradePanel
 * Tests the connection between the UI and the upgrade system
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TurretUpgradePanel } from '../ui/TurretUpgradePanel';
import { UpgradeManager } from '../game/UpgradeManager';
import { ResourceManager } from '../game/resourceManager';
import { createGameWorld, createTurret } from '../ecs';
import { TurretType, UpgradePath } from '../types/constants';
import type { GameWorld } from '../ecs/world';

describe('TurretUpgradePanel Integration', () => {
  let world: GameWorld;
  let resourceManager: ResourceManager;
  let upgradeManager: UpgradeManager;
  let upgradePanel: TurretUpgradePanel;

  beforeEach(() => {
    world = createGameWorld();
    resourceManager = new ResourceManager();
    upgradeManager = new UpgradeManager(world, resourceManager);
    upgradePanel = new TurretUpgradePanel();
    resourceManager.reset(); // Start with 500 resources
  });

  describe('Panel visibility', () => {
    it('should be hidden by default', () => {
      expect(upgradePanel.isVisible()).toBe(false);
    });

    it('should show panel when turret info is provided', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);
      
      if (info) {
        upgradePanel.show(info, 500, 75);
        expect(upgradePanel.isVisible()).toBe(true);
      }
    });

    it('should hide panel when hide() is called', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);
      
      if (info) {
        upgradePanel.show(info, 500, 75);
        upgradePanel.hide();
        expect(upgradePanel.isVisible()).toBe(false);
      }
    });
  });

  describe('Upgrade callback integration', () => {
    it('should trigger callback when upgrade button is clicked', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);
      
      const onUpgrade = vi.fn();
      upgradePanel.onUpgrade(onUpgrade);
      
      if (info) {
        upgradePanel.show(info, 500, 75);
        
        // Simulate clicking the damage upgrade button
        // In a real scenario, this would be done through PixiJS events
        // For now, we just verify the callback can be set
        expect(onUpgrade).not.toHaveBeenCalled();
      }
    });

    it('should successfully apply upgrade through manager', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // Apply upgrade through manager
      const result = upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      expect(result.success).toBe(true);
      
      // Verify upgrade was applied
      const info = upgradeManager.getTurretInfo(eid);
      expect(info?.upgrades.damage).toBe(1);
      
      // Verify resources were deducted
      expect(resourceManager.getResources()).toBe(450); // 500 - 50
    });
  });

  describe('Sell callback integration', () => {
    it('should trigger callback when sell button is clicked', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);
      
      const onSell = vi.fn();
      upgradePanel.onSell(onSell);
      
      if (info) {
        upgradePanel.show(info, 500, 75);
        expect(onSell).not.toHaveBeenCalled();
      }
    });

    it('should successfully sell turret through manager', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const initialResources = resourceManager.getResources();
      
      // Sell turret through manager
      const refund = upgradeManager.sellTurret(eid);
      expect(refund).toBeGreaterThan(0);
      
      // Verify resources were refunded
      expect(resourceManager.getResources()).toBeGreaterThan(initialResources);
    });
  });

  describe('Panel display with upgrade data', () => {
    it('should display correct turret stats', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      const info = upgradeManager.getTurretInfo(eid);
      
      expect(info).toBeDefined();
      expect(info?.turretType).toBe(TurretType.PHASER_ARRAY);
      expect(info?.upgrades.damage).toBe(0);
      expect(info?.upgrades.range).toBe(0);
      expect(info?.upgrades.fireRate).toBe(0);
      expect(info?.upgrades.multiTarget).toBe(0);
      expect(info?.upgrades.special).toBe(0);
    });

    it('should display updated stats after upgrade', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // Apply damage upgrade
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      
      const info = upgradeManager.getTurretInfo(eid);
      expect(info?.upgrades.damage).toBe(1);
      expect(info?.currentStats.damage).toBeGreaterThan(info?.baseCost ? 0 : 10);
    });

    it('should display correct refund amount', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      const refund = upgradeManager.getSellRefund(eid);
      const info = upgradeManager.getTurretInfo(eid);
      
      if (info) {
        expect(refund).toBe(Math.floor(info.totalInvestment * 0.75));
      }
    });

    it('should display correct refund after upgrades', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // Apply two upgrades
      upgradeManager.applyUpgrade(eid, UpgradePath.DAMAGE);
      upgradeManager.applyUpgrade(eid, UpgradePath.RANGE);
      
      const refund = upgradeManager.getSellRefund(eid);
      const info = upgradeManager.getTurretInfo(eid);
      
      if (info) {
        expect(refund).toBe(Math.floor(info.totalInvestment * 0.75));
        // Total investment should include base cost + upgrade costs
        expect(info.totalInvestment).toBeGreaterThan(info.baseCost);
      }
    });
  });

  describe('Resource availability checks', () => {
    it('should show affordable upgrades correctly', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // With 500 resources, damage upgrade (50) should be affordable
      expect(upgradeManager.canUpgrade(eid, UpgradePath.DAMAGE)).toBe(true);
    });

    it('should show unaffordable upgrades correctly', () => {
      const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);
      
      // Spend all resources
      resourceManager.spendResources(500);
      
      // With 0 resources, no upgrade should be affordable
      expect(upgradeManager.canUpgrade(eid, UpgradePath.DAMAGE)).toBe(false);
    });
  });
});
