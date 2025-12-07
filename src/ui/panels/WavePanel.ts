/**
 * Wave Panel Component for Kobayashi Maru HUD
 * 
 * Displays wave information: wave number, state, and enemy count.
 * This panel appears in the top-left corner of the screen.
 * 
 * @module ui/panels/WavePanel
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';

/**
 * Data required to update the wave panel.
 */
export interface WavePanelData {
    /** Current wave number (1-indexed) */
    waveNumber: number;
    /** Wave state: idle, spawning, active, or complete */
    waveState: string;
    /** Number of active enemies */
    enemyCount: number;
}

/** Wave state to color mapping */
const WAVE_STATE_COLORS: Record<string, number> = {
    'idle': UI_STYLES.COLORS.SECONDARY,
    'spawning': UI_STYLES.COLORS.DANGER,
    'active': UI_STYLES.COLORS.PRIMARY,
    'complete': UI_STYLES.COLORS.HEALTH
};

/**
 * WavePanel displays wave information in the HUD.
 * 
 * @example
 * ```typescript
 * const wavePanel = new WavePanel();
 * wavePanel.init(container);
 * wavePanel.setPosition(16, 16);
 * 
 * // Update each frame
 * wavePanel.update({
 *   waveNumber: 5,
 *   waveState: 'active',
 *   enemyCount: 12
 * });
 * ```
 */
export class WavePanel {
    /** Main container for this panel */
    private container: Container;
    /** Panel background graphics */
    private background: Graphics;
    /** Wave number text element */
    private waveText: Text;
    /** Wave state text element */
    private stateText: Text;
    /** Enemy count text element */
    private enemyCountText: Text;
    /** Whether panel is initialized */
    private initialized: boolean = false;

    /** Panel dimensions */
    private static readonly WIDTH = 200;
    private static readonly HEIGHT = 100;

    constructor() {
        this.container = new Container();
        this.background = new Graphics();

        // Create text elements with placeholder text
        const waveStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_LARGE,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold'
        });
        this.waveText = new Text({ text: 'WAVE 1', style: waveStyle });

        const stateStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
            fill: UI_STYLES.COLORS.SECONDARY
        });
        this.stateText = new Text({ text: 'IDLE', style: stateStyle });

        const enemyStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT
        });
        this.enemyCountText = new Text({ text: 'Enemies: 0', style: enemyStyle });
    }

    /**
     * Initialize the panel and add it to a parent container.
     * 
     * @param parent - Parent container to add this panel to
     */
    init(parent: Container): void {
        if (this.initialized) return;

        // Create background
        this.background.roundRect(0, 0, WavePanel.WIDTH, WavePanel.HEIGHT, 8);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });

        // Position text elements
        this.waveText.position.set(10, 10);
        this.stateText.position.set(10, 40);
        this.enemyCountText.position.set(10, 70);

        // Build hierarchy
        this.container.addChild(this.background);
        this.container.addChild(this.waveText);
        this.container.addChild(this.stateText);
        this.container.addChild(this.enemyCountText);

        parent.addChild(this.container);
        this.initialized = true;
    }

    /**
     * Set panel position.
     * 
     * @param x - X position in pixels
     * @param y - Y position in pixels
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
     * Update panel with new data.
     * 
     * @param data - Wave data to display
     */
    update(data: WavePanelData): void {
        if (!this.initialized) return;

        this.waveText.text = `WAVE ${data.waveNumber}`;
        this.stateText.text = data.waveState.toUpperCase();
        this.stateText.style.fill = WAVE_STATE_COLORS[data.waveState] ?? UI_STYLES.COLORS.SECONDARY;
        this.enemyCountText.text = `Enemies: ${data.enemyCount}`;
    }

    /**
     * Get panel dimensions for layout calculations.
     */
    getDimensions(): { width: number; height: number } {
        return { width: WavePanel.WIDTH, height: WavePanel.HEIGHT };
    }

    /**
     * Show the panel.
     */
    show(): void {
        this.container.visible = true;
    }

    /**
     * Hide the panel.
     */
    hide(): void {
        this.container.visible = false;
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
