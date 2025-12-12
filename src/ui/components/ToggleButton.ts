/**
 * Toggle Button Component for Kobayashi Maru HUD
 * 
 * A reusable toggle button with hover effects and visual state updates.
 * Used for God Mode, Slow Mode, and similar toggles.
 * 
 * @module ui/components/ToggleButton
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { UI_CONFIG } from '../../config';

/** Configuration for creating a toggle button */
export interface ToggleButtonConfig {
    /** Button label text */
    label: string;
    /** Color when enabled */
    enabledColor: number;
    /** Callback when button is clicked, receives current enabled state */
    onClick: () => boolean | void;
    /** Function to check current enabled state */
    isEnabled: () => boolean;
}

/**
 * ToggleButton provides a reusable toggle button with visual feedback.
 * 
 * @example
 * ```typescript
 * const godModeBtn = new ToggleButton({
 *   label: 'GOD MODE',
 *   enabledColor: UI_STYLES.COLORS.HEALTH,
 *   onClick: () => game.toggleGodMode(),
 *   isEnabled: () => game.isGodModeEnabled()
 * });
 * godModeBtn.init(container);
 * godModeBtn.setPosition(16, 200);
 * ```
 */
export class ToggleButton {
    /** Main container for this button */
    public readonly container: Container;
    /** Button background */
    private background: Graphics;
    /** Button label */
    private label: Text;
    /** Configuration */
    private config: ToggleButtonConfig;
    /** Button dimensions from config - wide enough for emoji + text labels */
    private static readonly WIDTH = 130;
    private static readonly HEIGHT = UI_CONFIG.BUTTONS.TOGGLE_HEIGHT;
    /** Internal padding from edges */
    private static readonly PADDING = 10;

    constructor(config: ToggleButtonConfig) {
        this.config = config;
        this.container = new Container();
        this.background = new Graphics();

        // Create label
        const labelStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: 0x888888
        });
        this.label = new Text({ text: config.label, style: labelStyle });
    }

    /**
     * Initialize the button and add it to a parent container.
     * 
     * @param parent - Parent container to add this button to
     */
    init(parent: Container): void {
        // Setup container interactivity
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';

        // Draw initial background with actual enabled state
        const initialEnabled = this.config.isEnabled();
        this.drawBackground(initialEnabled);
        this.container.addChild(this.background);

        // Position label with internal padding (vertically centered)
        // Also set initial color based on enabled state
        this.label.style.fill = initialEnabled ? this.config.enabledColor : 0x888888;
        this.label.position.set(ToggleButton.PADDING, (ToggleButton.HEIGHT - this.label.height) / 2);
        this.container.addChild(this.label);

        // Click handler
        this.container.on('pointerdown', () => {
            const result = this.config.onClick();
            if (typeof result === 'boolean') {
                this.updateVisualState(result);
            }
        });

        // Hover effects
        this.container.on('pointerover', () => {
            const isEnabled = this.config.isEnabled();
            this.drawBackground(isEnabled, true);
        });

        this.container.on('pointerout', () => {
            const isEnabled = this.config.isEnabled();
            this.drawBackground(isEnabled, false);
        });

        parent.addChild(this.container);

        // Sync visual state with actual initial state
        this.sync();
    }

    /**
     * Draw button background with current state.
     */
    private drawBackground(enabled: boolean, hovered: boolean = false): void {
        const borderColor = enabled ? this.config.enabledColor : 0x888888;
        const borderWidth = hovered ? 3 : 2;
        const alpha = hovered ? 0.9 : 0.7;

        this.background.clear();
        this.background.roundRect(0, 0, ToggleButton.WIDTH, ToggleButton.HEIGHT, 6);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha });
        this.background.stroke({
            color: hovered ? (enabled ? this.config.enabledColor : UI_STYLES.COLORS.PRIMARY) : borderColor,
            width: borderWidth
        });
    }

    /**
     * Update button visual state.
     * 
     * @param enabled - Whether the toggle is currently enabled
     */
    updateVisualState(enabled: boolean): void {
        this.label.style.fill = enabled ? this.config.enabledColor : 0x888888;
        this.drawBackground(enabled, false);
    }

    /**
     * Set button position.
     * 
     * @param x - X position in pixels
     * @param y - Y position in pixels
     */
    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    /**
     * Set button scale.
     */
    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    /**
     * Sync visual state with current enabled state.
     */
    sync(): void {
        this.updateVisualState(this.config.isEnabled());
    }

    /**
     * Get button dimensions for layout calculations.
     */
    static getDimensions(): { width: number; height: number } {
        return { width: ToggleButton.WIDTH, height: ToggleButton.HEIGHT };
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.container.destroy({ children: true });
    }
}
