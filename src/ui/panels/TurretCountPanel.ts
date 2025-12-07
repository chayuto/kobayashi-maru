/**
 * Turret Count Panel Component for Kobayashi Maru HUD
 * 
 * Displays the current number of turrets.
 * 
 * @module ui/panels/TurretCountPanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';

/** Data required to update the turret count panel */
export interface TurretCountPanelData {
    /** Number of active turrets */
    turretCount: number;
}

/**
 * TurretCountPanel displays turret count in the HUD.
 */
export class TurretCountPanel {
    private container: Container;
    private background: Graphics;
    private countText: Text;
    private initialized: boolean = false;

    private static readonly WIDTH = 140;
    private static readonly HEIGHT = 60;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        const countStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_LARGE,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold'
        });
        this.countText = new Text({ text: '0', style: countStyle });
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.background.roundRect(0, 0, TurretCountPanel.WIDTH, TurretCountPanel.HEIGHT, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
        this.container.addChild(this.background);

        // Label
        const labelStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.PRIMARY
        });
        const label = new Text({ text: 'TURRETS', style: labelStyle });
        label.position.set(10, 8);
        this.container.addChild(label);

        // Count text
        this.countText.position.set(10, 28);
        this.container.addChild(this.countText);

        parent.addChild(this.container);
        this.initialized = true;
    }

    update(data: TurretCountPanelData): void {
        if (!this.initialized) return;
        this.countText.text = data.turretCount.toString();
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: TurretCountPanel.WIDTH, height: TurretCountPanel.HEIGHT };
    }

    destroy(): void {
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
