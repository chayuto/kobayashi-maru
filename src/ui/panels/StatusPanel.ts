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

    private static readonly WIDTH = 280;
    private static readonly HEIGHT = 120;
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
    }

    /**
     * Initialize the panel.
     */
    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.background.roundRect(0, 0, StatusPanel.WIDTH, StatusPanel.HEIGHT, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });

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

        parent.addChild(this.container);
        this.initialized = true;
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
    }

    getDimensions(): { width: number; height: number } {
        return { width: StatusPanel.WIDTH, height: StatusPanel.HEIGHT };
    }

    show(): void { this.container.visible = true; }
    hide(): void { this.container.visible = false; }

    destroy(): void {
        this.healthBar?.destroy();
        this.shieldBar?.destroy();
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
