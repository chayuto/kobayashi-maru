/**
 * Tests for boss wave configuration
 */
import { describe, it, expect } from 'vitest';
import { getBossWaveConfig, BOSS_WAVES } from '../game/waveConfig';
import { FactionId, AbilityType } from '../types/constants';

describe('Boss Wave Configuration', () => {
  describe('Boss Wave Lookup', () => {
    it('should return boss wave config for wave 5', () => {
      const bossWave = getBossWaveConfig(5);
      
      expect(bossWave).not.toBeNull();
      expect(bossWave?.waveNumber).toBe(5);
      expect(bossWave?.bossType).toBe(FactionId.BORG);
      expect(bossWave?.bossCount).toBe(1);
    });

    it('should return boss wave config for wave 10', () => {
      const bossWave = getBossWaveConfig(10);
      
      expect(bossWave).not.toBeNull();
      expect(bossWave?.waveNumber).toBe(10);
      expect(bossWave?.bossType).toBe(FactionId.SPECIES_8472);
    });

    it('should return boss wave config for wave 15', () => {
      const bossWave = getBossWaveConfig(15);
      
      expect(bossWave).not.toBeNull();
      expect(bossWave?.waveNumber).toBe(15);
      expect(bossWave?.bossType).toBe(FactionId.ROMULAN);
      expect(bossWave?.bossCount).toBe(2); // Wave 15 has 2 bosses
    });

    it('should return boss wave config for wave 20', () => {
      const bossWave = getBossWaveConfig(20);
      
      expect(bossWave).not.toBeNull();
      expect(bossWave?.waveNumber).toBe(20);
      expect(bossWave?.bossType).toBe(FactionId.BORG);
    });

    it('should return null for non-boss waves', () => {
      expect(getBossWaveConfig(1)).toBeNull();
      expect(getBossWaveConfig(3)).toBeNull();
      expect(getBossWaveConfig(7)).toBeNull();
      expect(getBossWaveConfig(100)).toBeNull();
    });
  });

  describe('Boss Wave Abilities', () => {
    it('should have shield regen and summon abilities for wave 5 Borg boss', () => {
      const bossWave = getBossWaveConfig(5);
      
      expect(bossWave?.bossAbilities).toContain(AbilityType.SHIELD_REGEN);
      expect(bossWave?.bossAbilities).toContain(AbilityType.SUMMON);
    });

    it('should have teleport and cloak abilities for wave 10 Species 8472 boss', () => {
      const bossWave = getBossWaveConfig(10);
      
      expect(bossWave?.bossAbilities).toContain(AbilityType.TELEPORT);
      expect(bossWave?.bossAbilities).toContain(AbilityType.CLOAK);
    });

    it('should have cloak and ramming speed abilities for wave 15 Romulan bosses', () => {
      const bossWave = getBossWaveConfig(15);
      
      expect(bossWave?.bossAbilities).toContain(AbilityType.CLOAK);
      expect(bossWave?.bossAbilities).toContain(AbilityType.RAMMING_SPEED);
    });

    it('should have shield regen and split abilities for wave 20 Borg bosses', () => {
      const bossWave = getBossWaveConfig(20);
      
      expect(bossWave?.bossAbilities).toContain(AbilityType.SHIELD_REGEN);
      expect(bossWave?.bossAbilities).toContain(AbilityType.SPLIT);
    });
  });

  describe('Boss Wave Support Enemies', () => {
    it('should have support enemies for wave 5', () => {
      const bossWave = getBossWaveConfig(5);
      
      expect(bossWave?.supportEnemies).toBeDefined();
      expect(bossWave?.supportEnemies.length).toBeGreaterThan(0);
      expect(bossWave?.supportEnemies[0].faction).toBe(FactionId.BORG);
      expect(bossWave?.supportEnemies[0].count).toBe(10);
    });

    it('should have mixed support enemies for wave 15', () => {
      const bossWave = getBossWaveConfig(15);
      
      expect(bossWave?.supportEnemies).toBeDefined();
      expect(bossWave?.supportEnemies.length).toBe(2); // Romulan and Klingon
      
      const romulanSupport = bossWave?.supportEnemies.find(s => s.faction === FactionId.ROMULAN);
      const klingonSupport = bossWave?.supportEnemies.find(s => s.faction === FactionId.KLINGON);
      
      expect(romulanSupport).toBeDefined();
      expect(klingonSupport).toBeDefined();
    });
  });

  describe('Boss Wave Rewards', () => {
    it('should have increasing reward multipliers', () => {
      const wave5 = getBossWaveConfig(5);
      const wave10 = getBossWaveConfig(10);
      const wave15 = getBossWaveConfig(15);
      const wave20 = getBossWaveConfig(20);
      
      expect(wave5?.rewardMultiplier).toBe(2.0);
      expect(wave10?.rewardMultiplier).toBe(3.0);
      expect(wave15?.rewardMultiplier).toBe(4.0);
      expect(wave20?.rewardMultiplier).toBe(5.0);
    });
  });

  describe('Boss Wave Array', () => {
    it('should have 4 predefined boss waves', () => {
      expect(BOSS_WAVES).toBeDefined();
      expect(BOSS_WAVES.length).toBe(4);
    });

    it('should have boss waves at intervals of 5', () => {
      const waveNumbers = BOSS_WAVES.map(bw => bw.waveNumber);
      
      expect(waveNumbers).toContain(5);
      expect(waveNumbers).toContain(10);
      expect(waveNumbers).toContain(15);
      expect(waveNumbers).toContain(20);
    });

    it('should have diverse boss types', () => {
      const bossTypes = BOSS_WAVES.map(bw => bw.bossType);
      
      expect(bossTypes).toContain(FactionId.BORG);
      expect(bossTypes).toContain(FactionId.SPECIES_8472);
      expect(bossTypes).toContain(FactionId.ROMULAN);
    });
  });
});
