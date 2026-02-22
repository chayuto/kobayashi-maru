/**
 * Tests for prestige.config
 */
import { describe, it, expect } from 'vitest';
import { PRESTIGE_CONFIG } from '../config/prestige.config';

describe('PRESTIGE_CONFIG', () => {
  describe('STORAGE_KEY', () => {
    it('should be a non-empty string', () => {
      expect(typeof PRESTIGE_CONFIG.STORAGE_KEY).toBe('string');
      expect(PRESTIGE_CONFIG.STORAGE_KEY.length).toBeGreaterThan(0);
    });
  });

  describe('REWARD formula', () => {
    it('should have positive base reward', () => {
      expect(PRESTIGE_CONFIG.REWARD.BASE).toBeGreaterThan(0);
    });

    it('should have positive per-wave value', () => {
      expect(PRESTIGE_CONFIG.REWARD.PER_WAVE).toBeGreaterThan(0);
    });

    it('should have positive per-kill value', () => {
      expect(PRESTIGE_CONFIG.REWARD.PER_KILL).toBeGreaterThan(0);
    });

    it('should have positive per-second value', () => {
      expect(PRESTIGE_CONFIG.REWARD.PER_SECOND).toBeGreaterThan(0);
    });
  });

  describe('UPGRADES', () => {
    it('should have at least one upgrade', () => {
      expect(PRESTIGE_CONFIG.UPGRADES.length).toBeGreaterThan(0);
    });

    for (const upgrade of PRESTIGE_CONFIG.UPGRADES) {
      describe(`upgrade: ${upgrade.id}`, () => {
        it('should have a non-empty name', () => {
          expect(upgrade.name.length).toBeGreaterThan(0);
        });

        it('should have a non-empty description', () => {
          expect(upgrade.description.length).toBeGreaterThan(0);
        });

        it('should have maxLevel >= 1', () => {
          expect(upgrade.maxLevel).toBeGreaterThanOrEqual(1);
        });

        it('should have costs array matching maxLevel', () => {
          expect(upgrade.costs.length).toBe(upgrade.maxLevel);
        });

        it('should have bonusPerLevel array matching maxLevel', () => {
          expect(upgrade.bonusPerLevel.length).toBe(upgrade.maxLevel);
        });

        it('should have increasing costs', () => {
          for (let i = 1; i < upgrade.costs.length; i++) {
            expect(upgrade.costs[i]).toBeGreaterThan(upgrade.costs[i - 1]);
          }
        });

        it('should have all positive costs', () => {
          for (const cost of upgrade.costs) {
            expect(cost).toBeGreaterThan(0);
          }
        });

        it('should have all positive bonuses', () => {
          for (const bonus of upgrade.bonusPerLevel) {
            expect(bonus).toBeGreaterThan(0);
          }
        });

        it('should have non-decreasing bonuses', () => {
          for (let i = 1; i < upgrade.bonusPerLevel.length; i++) {
            expect(upgrade.bonusPerLevel[i]).toBeGreaterThanOrEqual(upgrade.bonusPerLevel[i - 1]);
          }
        });
      });
    }

    it('should have unique upgrade IDs', () => {
      const ids = PRESTIGE_CONFIG.UPGRADES.map(u => u.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });
});
