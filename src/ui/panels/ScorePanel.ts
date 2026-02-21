/**
 * Score Panel Component for Kobayashi Maru HUD
 * 
 * Displays time survived and kills count.
 * 
 * @module ui/panels/ScorePanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { UI_CONFIG } from '../../config';
import { UIAnimator } from '../animation/UIAnimator';

/** Data required to update the score panel */
export interface ScorePanelData {
    /** Time survived in seconds */
    timeSurvived: number;
    /** Number of enemies defeated */
    enemiesDefeated: number;
}

/**
 * ScorePanel displays score information in the HUD.
 */
export class ScorePanel {
    private container: Container;
    private background: Graphics;
    private timeText: Text;
    private killsText: Text;
    private initialized: boolean = false;
    private previousKills: number = 0;

    private static readonly WIDTH = UI_CONFIG.PANELS.SCORE.WIDTH;
    private static readonly HEIGHT = UI_CONFIG.PANELS.SCORE.HEIGHT;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        const textStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
            fill: UI_STYLES.COLORS.TEXT
        });

        this.timeText = new Text({ text: 'TIME: 00:00', style: textStyle });
        this.killsText = new Text({ text: 'KILLS: 0', style: textStyle });
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.background.roundRect(0, 0, ScorePanel.WIDTH, ScorePanel.HEIGHT, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: UI_CONFIG.PANEL_STYLE.BG_ALPHA });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: UI_CONFIG.PANEL_STYLE.BORDER_WIDTH });
        this.container.addChild(this.background);

        // Text elements
        this.timeText.position.set(10, 15);
        this.killsText.position.set(10, 45);
        this.container.addChild(this.timeText);
        this.container.addChild(this.killsText);

        parent.addChild(this.container);
        this.initialized = true;
    }

    update(data: ScorePanelData): void {
        if (!this.initialized) return;

        this.timeText.text = `TIME: ${this.formatTime(data.timeSurvived)}`;
        this.killsText.text = `KILLS: ${data.enemiesDefeated}`;

        // Pulse kills text on new kill
        if (data.enemiesDefeated > this.previousKills && this.previousKills > 0) {
            UIAnimator.pulse(this.killsText, 1.12, { duration: 0.15 });
        }
        this.previousKills = data.enemiesDefeated;
    }

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: ScorePanel.WIDTH, height: ScorePanel.HEIGHT };
    }

    destroy(): void {
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
