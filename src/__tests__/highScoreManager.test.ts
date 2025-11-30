// @vitest-environment jsdom
/**
 * Tests for High Score Manager System
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HighScoreManager } from '../game/highScoreManager';
import type { ScoreData } from '../game/scoreManager';

const STORAGE_KEY = 'kobayashi-maru-highscores';

describe('HighScoreManager', () => {
  let highScoreManager: HighScoreManager;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    highScoreManager = new HighScoreManager();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('initial state', () => {
    it('should start with empty high scores', () => {
      const scores = highScoreManager.getHighScores();
      expect(scores).toEqual([]);
    });

    it('should return null for highest score when empty', () => {
      expect(highScoreManager.getHighestScore()).toBeNull();
    });
  });

  describe('saveScore', () => {
    it('should save a score to the leaderboard', () => {
      const score: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      };

      const result = highScoreManager.saveScore(score);

      expect(result).toBe(true);
      expect(highScoreManager.getHighScores().length).toBe(1);
    });

    it('should add timestamp to saved scores', () => {
      const score: ScoreData = {
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      };

      highScoreManager.saveScore(score);

      const savedScore = highScoreManager.getHighScores()[0];
      expect(savedScore.timestamp).toBeDefined();
      expect(typeof savedScore.timestamp).toBe('number');
    });

    it('should sort scores by time survived (descending)', () => {
      const scores: ScoreData[] = [
        { timeSurvived: 50, waveReached: 3, enemiesDefeated: 20, civiliansSaved: 5 },
        { timeSurvived: 150, waveReached: 8, enemiesDefeated: 80, civiliansSaved: 15 },
        { timeSurvived: 100, waveReached: 5, enemiesDefeated: 50, civiliansSaved: 10 }
      ];

      for (const score of scores) {
        highScoreManager.saveScore(score);
      }

      const savedScores = highScoreManager.getHighScores();
      expect(savedScores[0].timeSurvived).toBe(150);
      expect(savedScores[1].timeSurvived).toBe(100);
      expect(savedScores[2].timeSurvived).toBe(50);
    });

    it('should keep only top 10 scores', () => {
      // Add 12 scores
      for (let i = 1; i <= 12; i++) {
        highScoreManager.saveScore({
          timeSurvived: i * 10,
          waveReached: i,
          enemiesDefeated: i * 5,
          civiliansSaved: i
        });
      }

      const scores = highScoreManager.getHighScores();
      expect(scores.length).toBe(10);
      // Verify the lowest scores were removed
      expect(scores[scores.length - 1].timeSurvived).toBe(30);
    });

    it('should not save score if it does not qualify', () => {
      // Fill leaderboard with high scores
      for (let i = 1; i <= 10; i++) {
        highScoreManager.saveScore({
          timeSurvived: i * 100,
          waveReached: i,
          enemiesDefeated: i * 5,
          civiliansSaved: i
        });
      }

      // Try to save a lower score
      const result = highScoreManager.saveScore({
        timeSurvived: 50, // Lower than all existing scores
        waveReached: 1,
        enemiesDefeated: 5,
        civiliansSaved: 1
      });

      expect(result).toBe(false);
      expect(highScoreManager.getHighScores().length).toBe(10);
    });
  });

  describe('qualifiesForLeaderboard', () => {
    it('should return true when leaderboard is not full', () => {
      expect(highScoreManager.qualifiesForLeaderboard(10)).toBe(true);
    });

    it('should return true if score beats lowest score', () => {
      // Fill leaderboard
      for (let i = 1; i <= 10; i++) {
        highScoreManager.saveScore({
          timeSurvived: i * 10,
          waveReached: i,
          enemiesDefeated: i * 5,
          civiliansSaved: i
        });
      }

      // Lowest score is 10 seconds
      expect(highScoreManager.qualifiesForLeaderboard(15)).toBe(true);
    });

    it('should return false if score does not beat lowest score', () => {
      // Fill leaderboard
      for (let i = 1; i <= 10; i++) {
        highScoreManager.saveScore({
          timeSurvived: i * 10,
          waveReached: i,
          enemiesDefeated: i * 5,
          civiliansSaved: i
        });
      }

      // Lowest score is 10 seconds
      expect(highScoreManager.qualifiesForLeaderboard(5)).toBe(false);
    });
  });

  describe('getHighestScore', () => {
    it('should return the highest score', () => {
      const scores: ScoreData[] = [
        { timeSurvived: 50, waveReached: 3, enemiesDefeated: 20, civiliansSaved: 5 },
        { timeSurvived: 150, waveReached: 8, enemiesDefeated: 80, civiliansSaved: 15 },
        { timeSurvived: 100, waveReached: 5, enemiesDefeated: 50, civiliansSaved: 10 }
      ];

      for (const score of scores) {
        highScoreManager.saveScore(score);
      }

      const highest = highScoreManager.getHighestScore();
      expect(highest?.timeSurvived).toBe(150);
    });
  });

  describe('getRank', () => {
    it('should return rank 1 for leaderboard position', () => {
      expect(highScoreManager.getRank(100)).toBe(1);
    });

    it('should return correct rank for score', () => {
      highScoreManager.saveScore({
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      });

      highScoreManager.saveScore({
        timeSurvived: 200,
        waveReached: 10,
        enemiesDefeated: 100,
        civiliansSaved: 20
      });

      expect(highScoreManager.getRank(250)).toBe(1); // Would be #1
      expect(highScoreManager.getRank(150)).toBe(2); // Would be #2
      expect(highScoreManager.getRank(50)).toBe(3);  // Would be #3
    });

    it('should return -1 for score that would not make leaderboard', () => {
      // Fill leaderboard
      for (let i = 1; i <= 10; i++) {
        highScoreManager.saveScore({
          timeSurvived: i * 10,
          waveReached: i,
          enemiesDefeated: i * 5,
          civiliansSaved: i
        });
      }

      // Lowest score is 10, so 5 would not make it
      expect(highScoreManager.getRank(5)).toBe(-1);
    });
  });

  describe('persistence', () => {
    it('should persist scores to localStorage', () => {
      highScoreManager.saveScore({
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      });

      const stored = localStorage.getItem(STORAGE_KEY);
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1);
    });

    it('should load scores from localStorage on construction', () => {
      // Save some scores
      const scores = [
        { timeSurvived: 100, waveReached: 5, enemiesDefeated: 50, civiliansSaved: 10, timestamp: Date.now() }
      ];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));

      // Create new manager
      const newManager = new HighScoreManager();
      const loadedScores = newManager.getHighScores();

      expect(loadedScores.length).toBe(1);
      expect(loadedScores[0].timeSurvived).toBe(100);
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorage.setItem(STORAGE_KEY, 'invalid json data');

      // Should not throw
      expect(() => new HighScoreManager()).not.toThrow();
      
      const manager = new HighScoreManager();
      expect(manager.getHighScores()).toEqual([]);
    });
  });

  describe('clearHighScores', () => {
    it('should clear all high scores', () => {
      highScoreManager.saveScore({
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      });

      highScoreManager.clearHighScores();

      expect(highScoreManager.getHighScores()).toEqual([]);
    });

    it('should persist cleared state', () => {
      highScoreManager.saveScore({
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      });

      highScoreManager.clearHighScores();

      // Create new instance
      const newManager = new HighScoreManager();
      expect(newManager.getHighScores()).toEqual([]);
    });
  });

  describe('getHighScores immutability', () => {
    it('should return a copy of the scores array', () => {
      highScoreManager.saveScore({
        timeSurvived: 100,
        waveReached: 5,
        enemiesDefeated: 50,
        civiliansSaved: 10
      });

      const scores1 = highScoreManager.getHighScores();
      const scores2 = highScoreManager.getHighScores();

      expect(scores1).not.toBe(scores2);
      expect(scores1).toEqual(scores2);
    });
  });
});
