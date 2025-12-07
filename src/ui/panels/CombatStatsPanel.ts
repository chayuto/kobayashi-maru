/**
 * Combat Stats Panel Component for Kobayashi Maru HUD
 * 
 * Displays combat statistics: DPS, accuracy, and total damage dealt.
 * 
 * @module ui/panels/CombatStatsPanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';

/** Data required to update the combat stats panel */
export interface CombatStatsPanelData {
    /** Damage per second */
    dps?: number;
    /** Accuracy percentage (0-1) */
    accuracy?: number;
    /** Total damage dealt */
    totalDamageDealt?: number;
}

/**
 * CombatStatsPanel displays combat statistics in the HUD.
 */
export class CombatStatsPanel {
    private container: Container;
    private background: Graphics;
    private dpsText: Text;
    private accuracyText: Text;
    private damageText: Text;
    private initialized: boolean = false;

    private static readonly WIDTH = 160;
    private static readonly HEIGHT = 90;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        const statStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT
        });

        this.dpsText = new Text({ text: 'DPS: 0', style: statStyle });
        this.accuracyText = new Text({ text: 'ACC: 0%', style: statStyle });
        this.damageText = new Text({ text: 'DMG: 0', style: statStyle });
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.background.roundRect(0, 0, CombatStatsPanel.WIDTH, CombatStatsPanel.HEIGHT, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
        this.container.addChild(this.background);

        // Header
        const headerStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold'
        });
        const header = new Text({ text: 'COMBAT STATS', style: headerStyle });
        header.position.set(10, 8);
        this.container.addChild(header);

        // Stats text
        this.dpsText.position.set(10, 30);
        this.accuracyText.position.set(10, 50);
        this.damageText.position.set(10, 70);
        this.container.addChild(this.dpsText);
        this.container.addChild(this.accuracyText);
        this.container.addChild(this.damageText);

        parent.addChild(this.container);
        this.initialized = true;
    }

    update(data: CombatStatsPanelData): void {
        if (!this.initialized) return;

        if (data.dps !== undefined) {
            this.dpsText.text = `DPS: ${data.dps.toFixed(1)}`;
        }
        if (data.accuracy !== undefined) {
            this.accuracyText.text = `ACC: ${(data.accuracy * 100).toFixed(0)}%`;
        }
        if (data.totalDamageDealt !== undefined) {
            this.damageText.text = `DMG: ${this.formatNumber(data.totalDamageDealt)}`;
        }
    }

    private formatNumber(num: number): string {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return num.toFixed(0);
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: CombatStatsPanel.WIDTH, height: CombatStatsPanel.HEIGHT };
    }

    destroy(): void {
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
