/**
 * Tests for Score Manager System
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../game/scoreManager';
import { FactionId } from '../types/constants';

describe('ScoreManager', () => {
  let scoreManager: ScoreManager;

  beforeEach(() => {
    scoreManager = new ScoreManager();
  });

  describe('initial state', () => {
    it('should start with zero time survived', () => {
      expect(scoreManager.getTimeSurvived()).toBe(0);
    });

    it('should start with zero wave reached', () => {
      expect(scoreManager.getWaveReached()).toBe(0);
    });

    it('should start with zero enemies defeated', () => {
      expect(scoreManager.getEnemiesDefeated()).toBe(0);
    });

    it('should start with zero civilians saved', () => {
      expect(scoreManager.getCiviliansSaved()).toBe(0);
    });

    it('should return correct initial score data', () => {
      const scoreData = scoreManager.getScoreData();
      expect(scoreData.timeSurvived).toBe(0);
      expect(scoreData.waveReached).toBe(0);
      expect(scoreData.enemiesDefeated).toBe(0);
      expect(scoreData.civiliansSaved).toBe(0);
    });
  });

  describe('update', () => {
    it('should increment time survived', () => {
      scoreManager.update(1.5);
      expect(scoreManager.getTimeSurvived()).toBe(1.5);
    });

    it('should accumulate time survived', () => {
      scoreManager.update(1);
      scoreManager.update(2);
      scoreManager.update(0.5);
      expect(scoreManager.getTimeSurvived()).toBe(3.5);
    });

    it('should handle small delta times', () => {
      scoreManager.update(0.016);
      scoreManager.update(0.016);
      expect(scoreManager.getTimeSurvived()).toBeCloseTo(0.032, 4);
    });
  });

  describe('addKill', () => {
    it('should increment enemies defeated', () => {
      scoreManager.addKill(FactionId.KLINGON);
      expect(scoreManager.getEnemiesDefeated()).toBe(1);
    });

    it('should track kills by faction', () => {
      scoreManager.addKill(FactionId.KLINGON);
      scoreManager.addKill(FactionId.KLINGON);
      scoreManager.addKill(FactionId.ROMULAN);

      expect(scoreManager.getKillsByFaction(FactionId.KLINGON)).toBe(2);
      expect(scoreManager.getKillsByFaction(FactionId.ROMULAN)).toBe(1);
      expect(scoreManager.getKillsByFaction(FactionId.BORG)).toBe(0);
    });

    it('should track total kills across all factions', () => {
      scoreManager.addKill(FactionId.KLINGON);
      scoreManager.addKill(FactionId.ROMULAN);
      scoreManager.addKill(FactionId.BORG);
      scoreManager.addKill(FactionId.THOLIAN);
      scoreManager.addKill(FactionId.SPECIES_8472);

      expect(scoreManager.getEnemiesDefeated()).toBe(5);
    });
  });

  describe('setWaveReached', () => {
    it('should update wave reached', () => {
      scoreManager.setWaveReached(5);
      expect(scoreManager.getWaveReached()).toBe(5);
    });

    it('should only update if new wave is higher', () => {
      scoreManager.setWaveReached(5);
      scoreManager.setWaveReached(3);
      expect(scoreManager.getWaveReached()).toBe(5);
    });

    it('should update to higher wave', () => {
      scoreManager.setWaveReached(5);
      scoreManager.setWaveReached(7);
      expect(scoreManager.getWaveReached()).toBe(7);
    });
  });

  describe('addCiviliansSaved', () => {
    it('should add to civilians saved', () => {
      scoreManager.addCiviliansSaved(10);
      expect(scoreManager.getCiviliansSaved()).toBe(10);
    });

    it('should accumulate civilians saved', () => {
      scoreManager.addCiviliansSaved(5);
      scoreManager.addCiviliansSaved(3);
      expect(scoreManager.getCiviliansSaved()).toBe(8);
    });
  });

  describe('getScoreData', () => {
    it('should return all score metrics', () => {
      scoreManager.update(100);
      scoreManager.setWaveReached(10);
      scoreManager.addKill(FactionId.KLINGON);
      scoreManager.addKill(FactionId.ROMULAN);
      scoreManager.addCiviliansSaved(50);

      const scoreData = scoreManager.getScoreData();

      expect(scoreData.timeSurvived).toBe(100);
      expect(scoreData.waveReached).toBe(10);
      expect(scoreData.enemiesDefeated).toBe(2);
      expect(scoreData.civiliansSaved).toBe(50);
    });
  });

  describe('reset', () => {
    it('should reset all metrics to zero', () => {
      scoreManager.update(100);
      scoreManager.setWaveReached(10);
      scoreManager.addKill(FactionId.KLINGON);
      scoreManager.addCiviliansSaved(50);

      scoreManager.reset();

      expect(scoreManager.getTimeSurvived()).toBe(0);
      expect(scoreManager.getWaveReached()).toBe(0);
      expect(scoreManager.getEnemiesDefeated()).toBe(0);
      expect(scoreManager.getCiviliansSaved()).toBe(0);
      expect(scoreManager.getKillsByFaction(FactionId.KLINGON)).toBe(0);
    });

    it('should allow starting fresh after reset', () => {
      scoreManager.update(100);
      scoreManager.reset();
      scoreManager.update(50);
      expect(scoreManager.getTimeSurvived()).toBe(50);
    });
  });
});
