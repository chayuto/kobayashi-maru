/**
 * Icon Button Component for Kobayashi Maru HUD
 * 
 * A reusable button with an icon and optional label.
 * Used for Mute/Sound, and similar icon-based buttons.
 * Uses consistent hover highlight mechanism matching ToggleButton.
 * 
 * @module ui/components/IconButton
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { UI_CONFIG } from '../../config';

/** Configuration for creating an icon button */
export interface IconButtonConfig {
    /** Button label text (appears next to icon) */
    label: string;
    /** Icon color when active */
    activeColor: number;
    /** Icon color when inactive */
    inactiveColor: number;
    /** Callback when button is clicked */
    onClick: () => void;
    /** Function to get current active state */
    isActive: () => boolean;
    /** Function to draw the icon (receives Graphics reference and active state) */
    drawIcon: (graphics: Graphics, active: boolean, colors: typeof UI_STYLES.COLORS) => void;
}

/**
 * IconButton provides a reusable button with icon and visual feedback.
 * 
 * @example
 * ```typescript
 * const muteBtn = new IconButton({
 *   label: 'SOUND',
 *   activeColor: UI_STYLES.COLORS.PRIMARY,
 *   inactiveColor: 0x888888,
 *   onClick: () => audioManager.toggleMute(),
 *   isActive: () => !audioManager.isMuted(),
 *   drawIcon: (g, active, colors) => { ... }
 * });
 * muteBtn.init(container);
 * muteBtn.setPosition(16, 116);
 * ```
 */
export class IconButton {
    /** Main container for this button */
    public readonly container: Container;
    /** Button background */
    private background: Graphics;
    /** Button icon */
    private icon: Graphics;
    /** Button label */
    private label: Text;
    /** Configuration */
    private config: IconButtonConfig;
    /** Button dimensions - slightly wider than toggle button for icon + label */
    private static readonly WIDTH = 120;
    private static readonly HEIGHT = UI_CONFIG.BUTTONS.TOGGLE_HEIGHT;
    /** Icon area width */
    private static readonly ICON_WIDTH = 28;
    /** Padding from edges */
    private static readonly PADDING = 10;

    constructor(config: IconButtonConfig) {
        this.config = config;
        this.container = new Container();
        this.background = new Graphics();
        this.icon = new Graphics();

        // Create label with initial style
        const labelStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: config.inactiveColor
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

        // Draw initial background
        this.drawBackground(false);
        this.container.addChild(this.background);

        // Draw icon (positioned with left padding)
        this.updateIcon();
        this.icon.position.set(IconButton.PADDING, (IconButton.HEIGHT - 20) / 2);
        this.container.addChild(this.icon);

        // Position label (after icon area with gap, but not touching right border)
        this.label.position.set(
            IconButton.PADDING + IconButton.ICON_WIDTH + 4,
            (IconButton.HEIGHT - this.label.height) / 2
        );
        this.container.addChild(this.label);

        // Click handler
        this.container.on('pointerdown', () => {
            this.config.onClick();
            this.updateVisualState();
        });

        // Hover effects - consistent with ToggleButton
        this.container.on('pointerover', () => {
            this.drawBackground(true);
        });

        this.container.on('pointerout', () => {
            this.drawBackground(false);
        });

        parent.addChild(this.container);

        // Sync visual state with actual initial state
        this.updateVisualState();
    }

    /**
     * Draw button background with current state.
     * Properly clears and redraws to avoid overlay issues.
     */
    private drawBackground(hovered: boolean): void {
        const active = this.config.isActive();
        const borderColor = active ? this.config.activeColor : this.config.inactiveColor;
        const borderWidth = hovered ? 3 : 2;
        const alpha = hovered ? 0.9 : 0.7;

        // Clear and redraw - prevents frame overlay issues
        this.background.clear();
        this.background.roundRect(0, 0, IconButton.WIDTH, IconButton.HEIGHT, 6);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha });
        this.background.stroke({
            color: hovered ? (active ? this.config.activeColor : UI_STYLES.COLORS.PRIMARY) : borderColor,
            width: borderWidth
        });
    }

    /**
     * Update icon graphics based on current state.
     */
    private updateIcon(): void {
        const active = this.config.isActive();
        this.icon.clear();
        this.config.drawIcon(this.icon, active, UI_STYLES.COLORS);
    }

    /**
     * Update button visual state (icon, label, and background).
     */
    updateVisualState(): void {
        const active = this.config.isActive();

        // Update label color
        this.label.style.fill = active ? this.config.activeColor : this.config.inactiveColor;

        // Update label text based on active state
        this.label.text = this.config.label;

        // Redraw icon
        this.updateIcon();

        // Redraw background
        this.drawBackground(false);
    }

    /**
     * Set the label text dynamically.
     */
    setLabel(text: string): void {
        this.label.text = text;
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
     * Get button dimensions for layout calculations.
     */
    static getDimensions(): { width: number; height: number } {
        return { width: IconButton.WIDTH, height: IconButton.HEIGHT };
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.container.destroy({ children: true });
    }
}
