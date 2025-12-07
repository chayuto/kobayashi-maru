/**
 * Resource Panel Component for Kobayashi Maru HUD
 * 
 * Displays player resources (matter) in the top-right corner.
 * 
 * @module ui/panels/ResourcePanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';

/**
 * Data required to update the resource panel.
 */
export interface ResourcePanelData {
    /** Current resource amount */
    resources: number;
}

/**
 * ResourcePanel displays player resources in the HUD.
 * 
 * @example
 * ```typescript
 * const resourcePanel = new ResourcePanel();
 * resourcePanel.init(container);
 * resourcePanel.update({ resources: 500 });
 * ```
 */
export class ResourcePanel {
    private container: Container;
    private background: Graphics;
    private labelText: Text;
    private amountText: Text;
    private initialized: boolean = false;

    private static readonly WIDTH = 150;
    private static readonly HEIGHT = 70;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        const labelStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT
        });
        this.labelText = new Text({ text: 'RESOURCES', style: labelStyle });

        const amountStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_LARGE,
            fill: UI_STYLES.COLORS.SECONDARY,
            fontWeight: 'bold'
        });
        this.amountText = new Text({ text: '0', style: amountStyle });
    }

    /**
     * Initialize the panel.
     */
    init(parent: Container): void {
        if (this.initialized) return;

        this.background.roundRect(0, 0, ResourcePanel.WIDTH, ResourcePanel.HEIGHT, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        this.background.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });

        this.labelText.position.set(10, 8);
        this.amountText.position.set(10, 28);

        this.container.addChild(this.background);
        this.container.addChild(this.labelText);
        this.container.addChild(this.amountText);

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
     * Update with new resource data.
     */
    update(data: ResourcePanelData): void {
        if (!this.initialized) return;
        this.amountText.text = this.formatNumber(data.resources);
    }

    /**
     * Format large numbers with K/M suffixes.
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    }

    getDimensions(): { width: number; height: number } {
        return { width: ResourcePanel.WIDTH, height: ResourcePanel.HEIGHT };
    }

    show(): void { this.container.visible = true; }
    hide(): void { this.container.visible = false; }
    destroy(): void { this.container.destroy({ children: true }); this.initialized = false; }
}
