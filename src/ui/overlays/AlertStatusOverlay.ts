/**
 * Alert Status Overlay for Kobayashi Maru
 *
 * Displays "RED ALERT" / "YELLOW ALERT" banner when alert level changes.
 * Uses the same FADE_IN -> HOLD -> FADE_OUT state machine as WaveAnnouncement.
 *
 * @module ui/overlays/AlertStatusOverlay
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import { GameEventType, AlertLevel, AlertLevelChangedPayload } from '../../types/events';
import { GAME_CONFIG } from '../../types/constants';
import { UI_CONFIG } from '../../config/ui.config';

enum AnimationPhase {
    IDLE = 'IDLE',
    FADE_IN = 'FADE_IN',
    HOLD = 'HOLD',
    FADE_OUT = 'FADE_OUT'
}

export class AlertStatusOverlay {
    public container: Container;
    private background: Graphics;
    private alertText: Text;
    private phase: AnimationPhase = AnimationPhase.IDLE;
    private phaseStartTime: number = 0;
    private eventBus: EventBus;
    private boundHandler: (payload: AlertLevelChangedPayload) => void;
    private config = UI_CONFIG.ALERT_STATUS;

    constructor() {
        this.container = new Container();
        this.eventBus = EventBus.getInstance();

        // Background bar
        this.background = new Graphics();

        // Alert text
        const style = new TextStyle({
            fontFamily: 'Courier New, monospace',
            fontSize: 40,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
        });
        this.alertText = new Text({ text: '', style });
        this.alertText.anchor.set(0.5, 0.5);

        this.boundHandler = this.handleAlertChanged.bind(this);
    }

    init(parent: Container): void {
        const worldWidth = GAME_CONFIG.WORLD_WIDTH;
        const worldHeight = GAME_CONFIG.WORLD_HEIGHT;
        const barHeight = 80;
        const yCenter = worldHeight * 0.25;

        // Draw background bar
        this.background.rect(0, yCenter - barHeight / 2, worldWidth, barHeight);
        this.background.fill({ color: 0x000000, alpha: 0.6 });
        this.container.addChild(this.background);

        // Position text centered
        this.alertText.position.set(worldWidth / 2, yCenter);
        this.container.addChild(this.alertText);

        // Start hidden
        this.container.visible = false;
        this.container.alpha = 0;

        // Subscribe to alert events
        this.eventBus.on(GameEventType.ALERT_LEVEL_CHANGED, this.boundHandler);

        parent.addChild(this.container);
    }

    private handleAlertChanged(payload: AlertLevelChangedPayload): void {
        if (payload.level === AlertLevel.CRITICAL) {
            this.show('RED ALERT', this.config.CRITICAL_COLOR);
        } else if (payload.level === AlertLevel.CAUTION) {
            this.show('YELLOW ALERT', this.config.CAUTION_COLOR);
        }
        // NORMAL = no banner (auto-hides on fade out of previous)
    }

    private show(text: string, color: number): void {
        this.alertText.text = text;
        this.alertText.style.fill = color;

        // Redraw background with alert color tint
        const worldWidth = GAME_CONFIG.WORLD_WIDTH;
        const worldHeight = GAME_CONFIG.WORLD_HEIGHT;
        const barHeight = 80;
        const yCenter = worldHeight * 0.25;
        this.background.clear();
        this.background.rect(0, yCenter - barHeight / 2, worldWidth, barHeight);
        this.background.fill({ color: color, alpha: 0.15 });

        this.container.visible = true;
        this.container.alpha = 0;
        this.container.scale.set(1);
        this.phase = AnimationPhase.FADE_IN;
        this.phaseStartTime = performance.now();
    }

    update(): void {
        if (this.phase === AnimationPhase.IDLE) return;

        const elapsed = (performance.now() - this.phaseStartTime) / 1000;

        switch (this.phase) {
            case AnimationPhase.FADE_IN: {
                const t = Math.min(elapsed / this.config.FADE_IN_DURATION, 1);
                this.container.alpha = t;
                if (t >= 1) {
                    this.phase = AnimationPhase.HOLD;
                    this.phaseStartTime = performance.now();
                }
                break;
            }
            case AnimationPhase.HOLD: {
                if (elapsed >= this.config.HOLD_DURATION) {
                    this.phase = AnimationPhase.FADE_OUT;
                    this.phaseStartTime = performance.now();
                }
                break;
            }
            case AnimationPhase.FADE_OUT: {
                const t = Math.min(elapsed / this.config.FADE_OUT_DURATION, 1);
                this.container.alpha = 1 - t;
                if (t >= 1) {
                    this.container.visible = false;
                    this.phase = AnimationPhase.IDLE;
                }
                break;
            }
        }
    }

    getPhase(): string {
        return this.phase;
    }

    reset(): void {
        this.phase = AnimationPhase.IDLE;
        this.container.visible = false;
        this.container.alpha = 0;
    }

    destroy(): void {
        this.eventBus.off(GameEventType.ALERT_LEVEL_CHANGED, this.boundHandler);
        this.container.destroy({ children: true });
    }
}
