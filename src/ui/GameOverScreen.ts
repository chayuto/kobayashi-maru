/**
 * Game Over Screen for Kobayashi Maru
 * Displays final score breakdown and provides restart functionality
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { GAME_CONFIG } from '../types/constants';
import type { ScoreData } from '../game/scoreManager';

/**
 * Score multipliers for final score calculation
 */
const SCORE_MULTIPLIERS = {
  TIME: 10,      // 10 points per second survived
  KILLS: 100,    // 100 points per enemy defeated
  WAVE: 500      // 500 points per wave reached
} as const;

/**
 * Calculates the total score from score data
 * @param data - Score data
 * @returns Total calculated score
 */
export function calculateScore(data: ScoreData): number {
  const timeScore = Math.floor(data.timeSurvived) * SCORE_MULTIPLIERS.TIME;
  const killScore = data.enemiesDefeated * SCORE_MULTIPLIERS.KILLS;
  const waveScore = data.waveReached * SCORE_MULTIPLIERS.WAVE;
  return timeScore + killScore + waveScore;
}

/**
 * Callback type for restart event
 */
export type RestartCallback = () => void;

/**
 * GameOverScreen class - manages the game over display
 */
export class GameOverScreen {
  public container: Container;
  private visible: boolean = false;
  private onRestart: RestartCallback | null = null;
  private app: Application | null = null;

  // UI Elements
  private overlay: Graphics | null = null;
  private titleText: Text | null = null;
  private timeText: Text | null = null;
  private wavesText: Text | null = null;
  private killsText: Text | null = null;
  private totalScoreText: Text | null = null;
  private highScoreText: Text | null = null;
  private previousHighText: Text | null = null;
  private restartPromptText: Text | null = null;

  // Event handler references for cleanup
  private boundKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private boundClickHandler: (() => void) | null = null;

  constructor() {
    this.container = new Container();
    this.container.visible = false;
    this.container.zIndex = 1000; // Ensure it's on top
  }

  /**
   * Initialize the game over screen
   * @param app - PixiJS Application instance
   */
  init(app: Application): void {
    this.app = app;
    
    // Add container to stage
    this.app.stage.addChild(this.container);
    
    // Create UI elements
    this.createOverlay();
    this.createTitle();
    this.createScorePanel();
    this.createRestartPrompt();
  }

  /**
   * Create semi-transparent dark overlay
   */
  private createOverlay(): void {
    this.overlay = new Graphics();
    this.overlay.rect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
    this.overlay.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.85 });
    this.container.addChild(this.overlay);
  }

  /**
   * Create the title text
   */
  private createTitle(): void {
    const titleStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: 48,
      fill: UI_STYLES.COLORS.DANGER,
      fontWeight: 'bold'
    });
    this.titleText = new Text({ text: 'SIMULATION ENDED', style: titleStyle });
    this.titleText.anchor.set(0.5, 0.5);
    this.titleText.position.set(GAME_CONFIG.WORLD_WIDTH / 2, 180);
    this.container.addChild(this.titleText);
  }

  /**
   * Create the score panel with breakdown
   */
  private createScorePanel(): void {
    const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
    const startY = 280;
    const lineHeight = 40;

    // Score breakdown style
    const scoreStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.TEXT
    });

    // Time survived
    this.timeText = new Text({ text: 'Time Survived:     0m 00s  x 10  =        0', style: scoreStyle });
    this.timeText.anchor.set(0.5, 0.5);
    this.timeText.position.set(centerX, startY);
    this.container.addChild(this.timeText);

    // Enemies defeated
    this.killsText = new Text({ text: 'Enemies Defeated:       0  x 100 =        0', style: scoreStyle });
    this.killsText.anchor.set(0.5, 0.5);
    this.killsText.position.set(centerX, startY + lineHeight);
    this.container.addChild(this.killsText);

    // Wave reached
    this.wavesText = new Text({ text: 'Wave Reached:           0  x 500 =        0', style: scoreStyle });
    this.wavesText.anchor.set(0.5, 0.5);
    this.wavesText.position.set(centerX, startY + lineHeight * 2);
    this.container.addChild(this.wavesText);

    // Separator line (represented as text dashes)
    const separatorStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.PRIMARY
    });
    const separator = new Text({ text: '─────────────────────────────────────────────', style: separatorStyle });
    separator.anchor.set(0.5, 0.5);
    separator.position.set(centerX, startY + lineHeight * 3);
    this.container.addChild(separator);

    // Total score
    const totalStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.totalScoreText = new Text({ text: 'TOTAL SCORE:                               0', style: totalStyle });
    this.totalScoreText.anchor.set(0.5, 0.5);
    this.totalScoreText.position.set(centerX, startY + lineHeight * 4);
    this.container.addChild(this.totalScoreText);

    // High score indicator
    const highScoreStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.SECONDARY,
      fontWeight: 'bold'
    });
    this.highScoreText = new Text({ text: '', style: highScoreStyle });
    this.highScoreText.anchor.set(0.5, 0.5);
    this.highScoreText.position.set(centerX, startY + lineHeight * 5.5);
    this.container.addChild(this.highScoreText);

    // Previous high score
    const prevHighStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.SECONDARY
    });
    this.previousHighText = new Text({ text: '', style: prevHighStyle });
    this.previousHighText.anchor.set(0.5, 0.5);
    this.previousHighText.position.set(centerX, startY + lineHeight * 6.5);
    this.container.addChild(this.previousHighText);
  }

  /**
   * Create restart prompt text
   */
  private createRestartPrompt(): void {
    const promptStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.PRIMARY
    });
    this.restartPromptText = new Text({ text: 'PRESS ENTER OR R TO RESTART', style: promptStyle });
    this.restartPromptText.anchor.set(0.5, 0.5);
    this.restartPromptText.position.set(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT - 150);
    this.container.addChild(this.restartPromptText);
  }

  /**
   * Format time in seconds to Mm SSs format
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }

  /**
   * Format a number with padding for alignment
   * @param num - Number to format
   * @param width - Minimum width
   * @returns Padded number string
   */
  private padNumber(num: number, width: number): string {
    return num.toString().padStart(width, ' ');
  }

  /**
   * Show the game over screen with score data
   * @param scoreData - Final score data
   * @param isHighScore - Whether this is a new high score
   * @param previousHighScore - Previous high score for comparison (optional)
   */
  show(scoreData: ScoreData, isHighScore: boolean, previousHighScore?: number): void {
    if (!this.app) return;

    this.visible = true;
    this.container.visible = true;

    // Calculate scores
    const timeScore = Math.floor(scoreData.timeSurvived) * SCORE_MULTIPLIERS.TIME;
    const killScore = scoreData.enemiesDefeated * SCORE_MULTIPLIERS.KILLS;
    const waveScore = scoreData.waveReached * SCORE_MULTIPLIERS.WAVE;
    const totalScore = timeScore + killScore + waveScore;

    // Update text elements
    if (this.timeText) {
      this.timeText.text = `Time Survived:    ${this.formatTime(scoreData.timeSurvived).padStart(8, ' ')}  x ${SCORE_MULTIPLIERS.TIME}  = ${this.padNumber(timeScore, 8)}`;
    }
    if (this.killsText) {
      this.killsText.text = `Enemies Defeated: ${this.padNumber(scoreData.enemiesDefeated, 8)}  x ${SCORE_MULTIPLIERS.KILLS} = ${this.padNumber(killScore, 8)}`;
    }
    if (this.wavesText) {
      this.wavesText.text = `Wave Reached:     ${this.padNumber(scoreData.waveReached, 8)}  x ${SCORE_MULTIPLIERS.WAVE} = ${this.padNumber(waveScore, 8)}`;
    }
    if (this.totalScoreText) {
      this.totalScoreText.text = `TOTAL SCORE:                        ${this.padNumber(totalScore, 8)}`;
    }
    if (this.highScoreText) {
      this.highScoreText.text = isHighScore ? '★ NEW HIGH SCORE! ★' : '';
    }
    if (this.previousHighText) {
      if (previousHighScore !== undefined && previousHighScore > 0) {
        this.previousHighText.text = `Previous Best: ${previousHighScore.toLocaleString()}`;
      } else {
        this.previousHighText.text = '';
      }
    }

    // Add event listeners
    this.setupEventListeners();
  }

  /**
   * Set up keyboard and click event listeners
   */
  private setupEventListeners(): void {
    // Keyboard handler
    this.boundKeyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key.toLowerCase() === 'r') {
        this.triggerRestart();
      }
    };
    document.addEventListener('keydown', this.boundKeyHandler);

    // Click handler on the container
    if (this.app?.canvas) {
      this.boundClickHandler = () => {
        if (this.visible) {
          this.triggerRestart();
        }
      };
      this.app.canvas.addEventListener('click', this.boundClickHandler);
    }
  }

  /**
   * Remove event listeners
   */
  private removeEventListeners(): void {
    if (this.boundKeyHandler) {
      document.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
    }
    if (this.boundClickHandler && this.app?.canvas) {
      this.app.canvas.removeEventListener('click', this.boundClickHandler);
      this.boundClickHandler = null;
    }
  }

  /**
   * Trigger the restart callback
   */
  private triggerRestart(): void {
    if (this.onRestart) {
      this.onRestart();
    }
  }

  /**
   * Hide the game over screen
   */
  hide(): void {
    this.visible = false;
    this.container.visible = false;
    this.removeEventListeners();
  }

  /**
   * Set the restart callback
   * @param callback - Function to call when restart is triggered
   */
  setOnRestart(callback: RestartCallback): void {
    this.onRestart = callback;
  }

  /**
   * Check if the screen is visible
   * @returns Whether the screen is visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    this.removeEventListeners();
    this.container.destroy({ children: true });
  }
}
