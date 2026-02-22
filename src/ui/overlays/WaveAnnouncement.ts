/**
 * Wave Announcement Banner for Kobayashi Maru
 *
 * Full-screen centered banner showing "WAVE X" with animated phases:
 * FADE_IN (scale 0.8→1.0, alpha 0→1) → HOLD → FADE_OUT (alpha 1→0)
 *
 * Subscribes to WAVE_STARTED events via EventBus.
 *
 * @module ui/overlays/WaveAnnouncement
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import { GameEventType, WaveStartedPayload } from '../../types/events';
import { GAME_CONFIG } from '../../types/constants';
import { UI_CONFIG } from '../../config/ui.config';

enum AnimationPhase {
    IDLE = 'IDLE',
    FADE_IN = 'FADE_IN',
    HOLD = 'HOLD',
    FADE_OUT = 'FADE_OUT'
}

const WAVE_SUBTITLES: Record<number, string> = {
    1: 'First contact...',
    2: 'They return in force.',
    3: 'Hold the line!',
    4: 'The storm intensifies.',
    5: 'BOSS INCOMING!',
    10: 'BOSS INCOMING!',
    15: 'BOSS INCOMING!',
    20: 'BOSS INCOMING!',
};

/**
 * WaveAnnouncement displays a cinematic banner on wave start.
 */
export class WaveAnnouncement {
    public container: Container;
    private background: Graphics;
    private titleText: Text;
    private subtitleText: Text;
    private phase: AnimationPhase = AnimationPhase.IDLE;
    private elapsedTime: number = 0;
    private eventBus: EventBus;
    private boundHandler: (payload: WaveStartedPayload) => void;
    private config = UI_CONFIG.WAVE_ANNOUNCEMENT;

    constructor() {
        this.container = new Container();
        this.eventBus = EventBus.getInstance();

        // Background bar
        this.background = new Graphics();

        // Title text
        const titleStyle = new TextStyle({
            fontFamily: 'Courier New, monospace',
            fontSize: this.config.TITLE_FONT_SIZE,
            fill: UI_CONFIG.COLORS.PRIMARY,
            fontWeight: 'bold',
        });
        this.titleText = new Text({ text: '', style: titleStyle });
        this.titleText.anchor.set(0.5, 0.5);

        // Subtitle text
        const subtitleStyle = new TextStyle({
            fontFamily: 'Courier New, monospace',
            fontSize: this.config.SUBTITLE_FONT_SIZE,
            fill: UI_CONFIG.COLORS.SECONDARY,
        });
        this.subtitleText = new Text({ text: '', style: subtitleStyle });
        this.subtitleText.anchor.set(0.5, 0.5);

        this.boundHandler = this.handleWaveStarted.bind(this);
    }

    /**
     * Initialize the banner.
     */
    init(parent: Container): void {
        const worldWidth = GAME_CONFIG.WORLD_WIDTH;
        const worldHeight = GAME_CONFIG.WORLD_HEIGHT;
        const barHeight = this.config.BACKGROUND_HEIGHT;
        const yCenter = worldHeight * this.config.Y_POSITION_RATIO;

        // Draw background bar (full width)
        this.background.rect(0, yCenter - barHeight / 2, worldWidth, barHeight);
        this.background.fill({ color: 0x000000, alpha: this.config.BACKGROUND_ALPHA });
        this.container.addChild(this.background);

        // Position text centered
        this.titleText.position.set(worldWidth / 2, yCenter - 12);
        this.container.addChild(this.titleText);

        this.subtitleText.position.set(worldWidth / 2, yCenter + 28);
        this.container.addChild(this.subtitleText);

        // Start hidden
        this.container.visible = false;
        this.container.alpha = 0;

        // Subscribe to wave events
        this.eventBus.on(GameEventType.WAVE_STARTED, this.boundHandler);

        parent.addChild(this.container);
    }

    private handleWaveStarted(payload: WaveStartedPayload): void {
        this.show(payload.waveNumber);
    }

    /**
     * Show the announcement for a wave.
     */
    show(waveNumber: number): void {
        this.titleText.text = `WAVE ${waveNumber}`;

        // Get subtitle (boss waves every 5, or specific wave text)
        const subtitle = waveNumber % 5 === 0
            ? 'BOSS INCOMING!'
            : WAVE_SUBTITLES[waveNumber] || 'Defend the Kobayashi Maru!';
        this.subtitleText.text = subtitle;

        this.container.visible = true;
        this.container.alpha = 0;
        this.container.scale.set(0.8);
        this.phase = AnimationPhase.FADE_IN;
        this.elapsedTime = 0;
    }

    /**
     * Update animation each frame.
     * @param deltaTime - Time since last frame in seconds
     */
    update(deltaTime: number = 0): void {
        if (this.phase === AnimationPhase.IDLE) return;

        this.elapsedTime += deltaTime;

        switch (this.phase) {
            case AnimationPhase.FADE_IN: {
                const t = Math.min(this.elapsedTime / this.config.FADE_IN_DURATION, 1);
                this.container.alpha = t;
                this.container.scale.set(0.8 + 0.2 * t);
                if (t >= 1) {
                    this.phase = AnimationPhase.HOLD;
                    this.elapsedTime = 0;
                }
                break;
            }
            case AnimationPhase.HOLD: {
                if (this.elapsedTime >= this.config.HOLD_DURATION) {
                    this.phase = AnimationPhase.FADE_OUT;
                    this.elapsedTime = 0;
                }
                break;
            }
            case AnimationPhase.FADE_OUT: {
                const t = Math.min(this.elapsedTime / this.config.FADE_OUT_DURATION, 1);
                this.container.alpha = 1 - t;
                if (t >= 1) {
                    this.container.visible = false;
                    this.phase = AnimationPhase.IDLE;
                }
                break;
            }
        }
    }

    /**
     * Reset to idle state (for game restart).
     */
    reset(): void {
        this.phase = AnimationPhase.IDLE;
        this.container.visible = false;
        this.container.alpha = 0;
    }

    /**
     * Get current animation phase (for testing).
     */
    getPhase(): string {
        return this.phase;
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.eventBus.off(GameEventType.WAVE_STARTED, this.boundHandler);
        this.container.destroy({ children: true });
    }
}
