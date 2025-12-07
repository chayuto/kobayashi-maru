/**
 * Combo Panel Component for Kobayashi Maru HUD
 * 
 * Displays current combo count and multiplier with visual feedback.
 * 
 * @module ui/panels/ComboPanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { EventBus } from '../../core/EventBus';
import { GameEventType, ComboUpdatedPayload } from '../../types/events';

/**
 * ComboPanel displays the current combo count and multiplier.
 */
export class ComboPanel {
    private container: Container;
    private background: Graphics;
    private comboText: Text;
    private multiplierText: Text;
    private initialized: boolean = false;
    private eventBus: EventBus;
    private boundHandleComboUpdated: (payload: ComboUpdatedPayload) => void;

    private static readonly WIDTH = 120;
    private static readonly HEIGHT = 60;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();
        this.eventBus = EventBus.getInstance();

        const comboStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_LARGE,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold'
        });
        this.comboText = new Text({ text: '', style: comboStyle });

        const multiplierStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
            fill: UI_STYLES.COLORS.SECONDARY
        });
        this.multiplierText = new Text({ text: '', style: multiplierStyle });

        this.boundHandleComboUpdated = this.handleComboUpdated.bind(this);
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background (hidden when no combo)
        this.drawBackground(false);
        this.container.addChild(this.background);

        // Combo count
        this.comboText.anchor.set(0.5, 0.5);
        this.comboText.position.set(ComboPanel.WIDTH / 2, 20);
        this.container.addChild(this.comboText);

        // Multiplier
        this.multiplierText.anchor.set(0.5, 0.5);
        this.multiplierText.position.set(ComboPanel.WIDTH / 2, 45);
        this.container.addChild(this.multiplierText);

        // Start hidden
        this.container.visible = false;

        // Subscribe to combo events
        this.eventBus.on(GameEventType.COMBO_UPDATED, this.boundHandleComboUpdated);

        parent.addChild(this.container);
        this.initialized = true;
    }

    private drawBackground(active: boolean): void {
        this.background.clear();
        this.background.roundRect(0, 0, ComboPanel.WIDTH, ComboPanel.HEIGHT, 8);
        this.background.fill({
            color: active ? 0x442200 : UI_STYLES.COLORS.BACKGROUND,
            alpha: 0.8
        });
        this.background.stroke({
            color: active ? UI_STYLES.COLORS.PRIMARY : UI_STYLES.COLORS.SECONDARY,
            width: active ? 3 : 2
        });
    }

    private handleComboUpdated(payload: ComboUpdatedPayload): void {
        if (payload.isActive && payload.comboCount > 1) {
            this.container.visible = true;
            this.comboText.text = `${payload.comboCount} HITS`;
            this.multiplierText.text = `×${payload.multiplier}`;
            this.drawBackground(true);

            // Color based on multiplier
            if (payload.multiplier >= 10) {
                this.comboText.style.fill = 0xFF6600; // Orange for max
            } else if (payload.multiplier >= 5) {
                this.comboText.style.fill = UI_STYLES.COLORS.HEALTH;
            } else {
                this.comboText.style.fill = UI_STYLES.COLORS.PRIMARY;
            }
        } else {
            this.container.visible = false;
        }
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: ComboPanel.WIDTH, height: ComboPanel.HEIGHT };
    }

    destroy(): void {
        this.eventBus.off(GameEventType.COMBO_UPDATED, this.boundHandleComboUpdated);
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
