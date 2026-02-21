/**
 * Status Panel Component for Kobayashi Maru HUD
 * 
 * Displays Kobayashi Maru health and shield status bars.
 * Appears in the bottom-center of the screen.
 * 
 * @module ui/panels/StatusPanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { HealthBar } from '../HealthBar';
import { EventBus } from '../../core/EventBus';
import { GameEventType, AlertLevel, AlertLevelChangedPayload } from '../../types/events';
import { UI_CONFIG } from '../../config/ui.config';

/**
 * Data required to update the status panel.
 */
export interface StatusPanelData {
    /** Current ship health (0 to maxHealth) */
    health: number;
    /** Maximum ship health */
    maxHealth: number;
    /** Current shield value (0 to maxShield) */
    shield: number;
    /** Maximum shield value */
    maxShield: number;
}

/**
 * StatusPanel displays Kobayashi Maru health and shields.
 * 
 * @example
 * ```typescript
 * const statusPanel = new StatusPanel();
 * statusPanel.init(container);
 * statusPanel.update({ health: 75, maxHealth: 100, shield: 50, maxShield: 100 });
 * ```
 */
export class StatusPanel {
    private container: Container;
    private background: Graphics;
    private titleText: Text;
    private healthBar: HealthBar | null = null;
    private shieldBar: HealthBar | null = null;
    private healthText: Text;
    private shieldText: Text;
    private initialized: boolean = false;
    private alertLevel: AlertLevel = AlertLevel.NORMAL;
    private eventBus: EventBus;
    private boundHandleAlert: (payload: AlertLevelChangedPayload) => void;

    private static readonly WIDTH = UI_CONFIG.PANELS.STATUS.WIDTH;
    private static readonly HEIGHT = UI_CONFIG.PANELS.STATUS.HEIGHT;
    private static readonly BAR_WIDTH = 200;
    private static readonly BAR_HEIGHT = 20;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        const titleStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold'
        });
        this.titleText = new Text({ text: 'KOBAYASHI MARU', style: titleStyle });

        const labelStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT
        });
        this.healthText = new Text({ text: 'HULL: 100%', style: labelStyle });
        this.shieldText = new Text({ text: 'SHIELDS: 100%', style: labelStyle });
        this.eventBus = EventBus.getInstance();
        this.boundHandleAlert = this.handleAlertChanged.bind(this);
    }

    /**
     * Initialize the panel.
     */
    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.background.roundRect(0, 0, StatusPanel.WIDTH, StatusPanel.HEIGHT, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: UI_CONFIG.PANEL_STYLE.BORDER_WIDTH });

        // Title
        this.titleText.position.set(StatusPanel.WIDTH / 2 - this.titleText.width / 2, 8);

        // Health bar
        this.healthBar = new HealthBar(StatusPanel.BAR_WIDTH, StatusPanel.BAR_HEIGHT, UI_STYLES.COLORS.HEALTH);
        this.healthBar.setPosition(40, 38);

        // Shield bar
        this.shieldBar = new HealthBar(StatusPanel.BAR_WIDTH, StatusPanel.BAR_HEIGHT, UI_STYLES.COLORS.SHIELD);
        this.shieldBar.setPosition(40, 72);

        // Labels
        this.healthText.position.set(40, 60);
        this.shieldText.position.set(40, 94);

        // Build hierarchy
        this.container.addChild(this.background);
        this.container.addChild(this.titleText);
        this.container.addChild(this.healthBar.container);
        this.container.addChild(this.shieldBar.container);
        this.container.addChild(this.healthText);
        this.container.addChild(this.shieldText);

        // Subscribe to alert level changes
        this.eventBus.on(GameEventType.ALERT_LEVEL_CHANGED, this.boundHandleAlert);

        parent.addChild(this.container);
        this.initialized = true;
    }

    private handleAlertChanged(payload: AlertLevelChangedPayload): void {
        this.alertLevel = payload.level;
        this.redrawBorder();
    }

    private getAlertBorderColor(): number {
        const config = UI_CONFIG.ALERT_STATUS;
        switch (this.alertLevel) {
            case AlertLevel.CRITICAL: return config.CRITICAL_COLOR;
            case AlertLevel.CAUTION: return config.CAUTION_COLOR;
            default: return config.NORMAL_COLOR;
        }
    }

    private redrawBorder(): void {
        this.background.clear();
        this.background.roundRect(0, 0, StatusPanel.WIDTH, StatusPanel.HEIGHT, UI_CONFIG.PANEL_STYLE.CORNER_RADIUS);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
        this.background.stroke({
            color: this.getAlertBorderColor(),
            width: this.alertLevel === AlertLevel.CRITICAL ? UI_CONFIG.PANEL_STYLE.HOVER_BORDER_WIDTH : UI_CONFIG.PANEL_STYLE.BORDER_WIDTH
        });
    }

    /**
     * Set panel position.
     */
    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    /**
     * Set panel scale.
     */
    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    /**
     * Update with new status data.
     */
    update(data: StatusPanelData): void {
        if (!this.initialized) return;

        const healthPercent = data.maxHealth > 0 ? data.health / data.maxHealth : 0;
        const shieldPercent = data.maxShield > 0 ? data.shield / data.maxShield : 0;

        this.healthBar?.update(data.health, data.maxHealth);
        this.shieldBar?.update(data.shield, data.maxShield);

        this.healthText.text = `HULL: ${Math.round(healthPercent * 100)}%`;
        this.shieldText.text = `SHIELDS: ${Math.round(shieldPercent * 100)}%`;

        // Pulse border alpha in critical state
        if (this.alertLevel === AlertLevel.CRITICAL) {
            const t = performance.now() / 1000;
            const pulse = 0.6 + 0.4 * Math.sin(t * UI_CONFIG.ALERT_STATUS.CRITICAL_PULSE_SPEED);
            this.background.alpha = pulse;
        } else {
            this.background.alpha = 1;
        }
    }

    getDimensions(): { width: number; height: number } {
        return { width: StatusPanel.WIDTH, height: StatusPanel.HEIGHT };
    }

    show(): void { this.container.visible = true; }
    hide(): void { this.container.visible = false; }

    destroy(): void {
        this.eventBus.off(GameEventType.ALERT_LEVEL_CHANGED, this.boundHandleAlert);
        this.healthBar?.destroy();
        this.shieldBar?.destroy();
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
