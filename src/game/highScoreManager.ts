/**
 * High Score Manager for Kobayashi Maru
 * Manages high score persistence using localStorage
 */

import type { ScoreData } from './scoreManager';
import { WAVE_CONFIG } from '../config';

/**
 * High score entry with timestamp
 */
export interface HighScoreEntry extends ScoreData {
  timestamp: number;  // Unix timestamp when score was achieved
}

/**
 * localStorage key for high scores
 */
const STORAGE_KEY = 'kobayashi-maru-highscores';

/**
 * Maximum number of high scores to store (from centralized config)
 */
const MAX_HIGH_SCORES = WAVE_CONFIG.SCORING.MAX_HIGH_SCORES;


/**
 * HighScoreManager class - manages high score persistence
 */
export class HighScoreManager {
  private highScores: HighScoreEntry[] = [];

  constructor() {
    this.loadHighScores();
  }

  /**
   * Saves a score if it qualifies for the leaderboard
   * @param score - The score data to save
   * @returns true if score was added to leaderboard, false otherwise
   */
  saveScore(score: ScoreData): boolean {
    const entry: HighScoreEntry = {
      ...score,
      timestamp: Date.now()
    };

    // Check if score qualifies for leaderboard
    if (!this.qualifiesForLeaderboard(score.timeSurvived)) {
      return false;
    }

    // Add score and sort by time survived (descending)
    this.highScores.push(entry);
    this.highScores.sort((a, b) => b.timeSurvived - a.timeSurvived);

    // Keep only top scores
    if (this.highScores.length > MAX_HIGH_SCORES) {
      this.highScores = this.highScores.slice(0, MAX_HIGH_SCORES);
    }

    // Persist to localStorage
    this.persistHighScores();

    return true;
  }

  /**
   * Gets the high scores leaderboard
   * @returns Array of high score entries sorted by time survived
   */
  getHighScores(): HighScoreEntry[] {
    return [...this.highScores];
  }

  /**
   * Checks if a score qualifies for the leaderboard
   * @param timeSurvived - The time survived to check
   * @returns true if score would make the leaderboard
   */
  qualifiesForLeaderboard(timeSurvived: number): boolean {
    if (this.highScores.length < MAX_HIGH_SCORES) {
      return true;
    }

    const lowestScore = this.highScores[this.highScores.length - 1];
    return timeSurvived > lowestScore.timeSurvived;
  }

  /**
   * Gets the highest score entry
   * @returns The highest score entry or null if no scores
   */
  getHighestScore(): HighScoreEntry | null {
    return this.highScores.length > 0 ? this.highScores[0] : null;
  }

  /**
   * Gets the rank a score would achieve
   * @param timeSurvived - The time survived to check
   * @returns The rank (1-based) or -1 if wouldn't make leaderboard
   */
  getRank(timeSurvived: number): number {
    for (let i = 0; i < this.highScores.length; i++) {
      if (timeSurvived > this.highScores[i].timeSurvived) {
        return i + 1;
      }
    }

    if (this.highScores.length < MAX_HIGH_SCORES) {
      return this.highScores.length + 1;
    }

    return -1;
  }

  /**
   * Clears all high scores
   */
  clearHighScores(): void {
    this.highScores = [];
    this.persistHighScores();
  }

  /**
   * Loads high scores from localStorage
   */
  private loadHighScores(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          // Validate and filter entries with expected structure
          this.highScores = parsed.filter((entry): entry is HighScoreEntry =>
            typeof entry === 'object' &&
            entry !== null &&
            typeof entry.timeSurvived === 'number' &&
            typeof entry.waveReached === 'number' &&
            typeof entry.enemiesDefeated === 'number' &&
            typeof entry.civiliansSaved === 'number' &&
            typeof entry.timestamp === 'number'
          );
        }
      }
    } catch (error) {
      console.error('Failed to load high scores:', error);
      this.highScores = [];
    }
  }

  /**
   * Persists high scores to localStorage
   */
  private persistHighScores(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.highScores));
    } catch (error) {
      console.error('Failed to save high scores:', error);
    }
  }
}
