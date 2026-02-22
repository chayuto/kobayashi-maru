/**
 * Tests for PrestigeManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { PrestigeManager } from '../game/PrestigeManager';
import { PRESTIGE_CONFIG } from '../config/prestige.config';
import type { PrestigeScoreData } from '../game/PrestigeManager';

describe('PrestigeManager', () => {
  let manager: PrestigeManager;

  beforeEach(() => {
    localStorage.clear();
    manager = new PrestigeManager();
  });

  describe('initial state', () => {
    it('should start with zero commendations', () => {
      expect(manager.getCommendations()).toBe(0);
    });

    it('should start with empty prestige data', () => {
      const data = manager.getPrestigeData();
      expect(data.commendations).toBe(0);
      expect(data.totalEarned).toBe(0);
      expect(data.totalRuns).toBe(0);
      expect(data.upgradeLevels).toEqual({});
    });

    it('should start with all upgrades at level 0', () => {
      for (const upgrade of PRESTIGE_CONFIG.UPGRADES) {
        expect(manager.getUpgradeLevel(upgrade.id)).toBe(0);
      }
    });

    it('should start with all bonuses at 0', () => {
      for (const upgrade of PRESTIGE_CONFIG.UPGRADES) {
        expect(manager.getBonus(upgrade.id)).toBe(0);
      }
    });
  });

  describe('calculateReward', () => {
    it('should calculate base reward for minimal run', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 0,
        enemiesDefeated: 0,
        timeSurvived: 0,
      };
      expect(manager.calculateReward(scoreData)).toBe(PRESTIGE_CONFIG.REWARD.BASE);
    });

    it('should include wave bonus', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 0,
        timeSurvived: 0,
      };
      const expected = PRESTIGE_CONFIG.REWARD.BASE + 5 * PRESTIGE_CONFIG.REWARD.PER_WAVE;
      expect(manager.calculateReward(scoreData)).toBe(expected);
    });

    it('should include kill bonus', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 0,
        enemiesDefeated: 20,
        timeSurvived: 0,
      };
      const expected = PRESTIGE_CONFIG.REWARD.BASE + 20 * PRESTIGE_CONFIG.REWARD.PER_KILL;
      expect(manager.calculateReward(scoreData)).toBe(expected);
    });

    it('should include time bonus', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 0,
        enemiesDefeated: 0,
        timeSurvived: 100,
      };
      const expected = PRESTIGE_CONFIG.REWARD.BASE + 100 * PRESTIGE_CONFIG.REWARD.PER_SECOND;
      expect(manager.calculateReward(scoreData)).toBe(expected);
    });

    it('should combine all bonuses', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 20,
        timeSurvived: 100,
      };
      const expected = Math.floor(
        PRESTIGE_CONFIG.REWARD.BASE
        + 5 * PRESTIGE_CONFIG.REWARD.PER_WAVE
        + 20 * PRESTIGE_CONFIG.REWARD.PER_KILL
        + 100 * PRESTIGE_CONFIG.REWARD.PER_SECOND
      );
      expect(manager.calculateReward(scoreData)).toBe(expected);
    });

    it('should floor the result', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 0,
        enemiesDefeated: 1,
        timeSurvived: 1,
      };
      // 10 + 0.5 + 0.1 = 10.6 → floor → 10
      expect(manager.calculateReward(scoreData)).toBe(10);
    });
  });

  describe('awardCommendations', () => {
    it('should return earned commendations', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 10,
        timeSurvived: 60,
      };
      const earned = manager.awardCommendations(scoreData);
      expect(earned).toBeGreaterThan(0);
      expect(earned).toBe(manager.calculateReward(scoreData));
    });

    it('should accumulate commendations', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 10,
        timeSurvived: 60,
      };
      const earned1 = manager.awardCommendations(scoreData);
      const earned2 = manager.awardCommendations(scoreData);
      expect(manager.getCommendations()).toBe(earned1 + earned2);
    });

    it('should track total earned', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 10,
        timeSurvived: 60,
      };
      manager.awardCommendations(scoreData);
      manager.awardCommendations(scoreData);
      const data = manager.getPrestigeData();
      expect(data.totalEarned).toBe(data.commendations);
    });

    it('should increment total runs', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 1,
        enemiesDefeated: 0,
        timeSurvived: 10,
      };
      manager.awardCommendations(scoreData);
      manager.awardCommendations(scoreData);
      manager.awardCommendations(scoreData);
      expect(manager.getPrestigeData().totalRuns).toBe(3);
    });
  });

  describe('purchaseUpgrade', () => {
    it('should fail with insufficient commendations', () => {
      expect(manager.purchaseUpgrade('resource_boost')).toBe(false);
      expect(manager.getUpgradeLevel('resource_boost')).toBe(0);
    });

    it('should succeed with sufficient commendations', () => {
      // Give enough commendations for first level of resource_boost (cost: 50)
      giveCommendations(manager, 50);
      expect(manager.purchaseUpgrade('resource_boost')).toBe(true);
      expect(manager.getUpgradeLevel('resource_boost')).toBe(1);
    });

    it('should deduct cost from commendations', () => {
      giveCommendations(manager, 100);
      manager.purchaseUpgrade('resource_boost'); // Cost: 50
      expect(manager.getCommendations()).toBe(50);
    });

    it('should not exceed max level', () => {
      const upgrade = PRESTIGE_CONFIG.UPGRADES.find(u => u.id === 'starting_turret')!;
      giveCommendations(manager, 1000);
      manager.purchaseUpgrade('starting_turret');
      expect(manager.getUpgradeLevel('starting_turret')).toBe(1);

      // Should fail at max level
      expect(manager.purchaseUpgrade('starting_turret')).toBe(false);
      expect(manager.getUpgradeLevel('starting_turret')).toBe(upgrade.maxLevel);
    });

    it('should use correct cost per level', () => {
      // resource_boost costs: [50, 100, 200, 400, 800]
      giveCommendations(manager, 200);

      manager.purchaseUpgrade('resource_boost'); // Costs 50, left 150
      expect(manager.getCommendations()).toBe(150);

      manager.purchaseUpgrade('resource_boost'); // Costs 100, left 50
      expect(manager.getCommendations()).toBe(50);

      // Not enough for level 3 (costs 200)
      expect(manager.purchaseUpgrade('resource_boost')).toBe(false);
    });

    it('should reject invalid upgrade ID', () => {
      giveCommendations(manager, 1000);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(manager.purchaseUpgrade('nonexistent' as any)).toBe(false);
    });
  });

  describe('getBonus', () => {
    it('should return 0 for unpurchased upgrade', () => {
      expect(manager.getBonus('resource_boost')).toBe(0);
    });

    it('should return correct bonus after purchase', () => {
      giveCommendations(manager, 50);
      manager.purchaseUpgrade('resource_boost');
      // bonusPerLevel for resource_boost: [0.1, 0.2, 0.3, 0.4, 0.5]
      expect(manager.getBonus('resource_boost')).toBe(0.1);
    });

    it('should return higher bonus at higher levels', () => {
      giveCommendations(manager, 150); // 50 + 100
      manager.purchaseUpgrade('resource_boost');
      manager.purchaseUpgrade('resource_boost');
      expect(manager.getBonus('resource_boost')).toBe(0.2);
    });

    it('should return 0 for invalid upgrade ID', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(manager.getBonus('nonexistent' as any)).toBe(0);
    });
  });

  describe('persistence', () => {
    it('should persist data to localStorage', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 10,
        timeSurvived: 60,
      };
      manager.awardCommendations(scoreData);

      const raw = localStorage.getItem(PRESTIGE_CONFIG.STORAGE_KEY);
      expect(raw).not.toBeNull();
      const parsed = JSON.parse(raw!);
      expect(parsed.commendations).toBeGreaterThan(0);
    });

    it('should load persisted data on construction', () => {
      const scoreData: PrestigeScoreData = {
        waveNumber: 5,
        enemiesDefeated: 10,
        timeSurvived: 60,
      };
      const earned = manager.awardCommendations(scoreData);

      // Create a new manager — should load saved data
      const manager2 = new PrestigeManager();
      expect(manager2.getCommendations()).toBe(earned);
      expect(manager2.getPrestigeData().totalRuns).toBe(1);
    });

    it('should persist upgrade levels', () => {
      giveCommendations(manager, 50);
      manager.purchaseUpgrade('resource_boost');

      const manager2 = new PrestigeManager();
      expect(manager2.getUpgradeLevel('resource_boost')).toBe(1);
      expect(manager2.getBonus('resource_boost')).toBe(0.1);
    });
  });

  describe('corruption handling', () => {
    it('should handle missing localStorage data', () => {
      localStorage.removeItem(PRESTIGE_CONFIG.STORAGE_KEY);
      const freshManager = new PrestigeManager();
      expect(freshManager.getCommendations()).toBe(0);
    });

    it('should handle corrupt JSON data', () => {
      localStorage.setItem(PRESTIGE_CONFIG.STORAGE_KEY, 'not valid json');
      const freshManager = new PrestigeManager();
      expect(freshManager.getCommendations()).toBe(0);
    });

    it('should handle invalid data structure', () => {
      localStorage.setItem(PRESTIGE_CONFIG.STORAGE_KEY, JSON.stringify({ bad: 'data' }));
      const freshManager = new PrestigeManager();
      expect(freshManager.getCommendations()).toBe(0);
    });

    it('should handle partial data', () => {
      localStorage.setItem(PRESTIGE_CONFIG.STORAGE_KEY, JSON.stringify({
        commendations: 100,
        // Missing other fields
      }));
      const freshManager = new PrestigeManager();
      expect(freshManager.getCommendations()).toBe(0); // Invalid → defaults
    });
  });

  describe('reset', () => {
    it('should clear all data', () => {
      giveCommendations(manager, 200);
      manager.purchaseUpgrade('resource_boost');

      manager.reset();

      expect(manager.getCommendations()).toBe(0);
      expect(manager.getPrestigeData().totalEarned).toBe(0);
      expect(manager.getPrestigeData().totalRuns).toBe(0);
      expect(manager.getUpgradeLevel('resource_boost')).toBe(0);
    });

    it('should persist reset state', () => {
      giveCommendations(manager, 200);
      manager.purchaseUpgrade('resource_boost');
      manager.reset();

      const manager2 = new PrestigeManager();
      expect(manager2.getCommendations()).toBe(0);
      expect(manager2.getUpgradeLevel('resource_boost')).toBe(0);
    });
  });

  describe('getPrestigeData', () => {
    it('should return a copy (not reference)', () => {
      const data1 = manager.getPrestigeData();
      const data2 = manager.getPrestigeData();
      expect(data1).not.toBe(data2);
      expect(data1.upgradeLevels).not.toBe(data2.upgradeLevels);
    });
  });
});

/**
 * Helper: give commendations by awarding a fake run.
 */
function giveCommendations(manager: PrestigeManager, amount: number): void {
  // Reverse-engineer scoreData from reward formula:
  // reward = floor(BASE + wave * PER_WAVE + kills * PER_KILL + time * PER_SECOND)
  // Simplest: use waves only. PER_WAVE = 10, so waves = (amount - BASE) / PER_WAVE
  const waves = Math.ceil((amount - PRESTIGE_CONFIG.REWARD.BASE) / PRESTIGE_CONFIG.REWARD.PER_WAVE);
  manager.awardCommendations({
    waveNumber: Math.max(0, waves),
    enemiesDefeated: 0,
    timeSurvived: 0,
  });

  // If we overshot, purchase nothing and just verify we have enough
  // Actually let's just do it properly: directly set via multiple awards if needed
  while (manager.getCommendations() < amount) {
    manager.awardCommendations({
      waveNumber: 10,
      enemiesDefeated: 0,
      timeSurvived: 0,
    });
  }
}
