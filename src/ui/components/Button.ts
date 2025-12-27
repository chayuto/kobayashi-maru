/**
 * Button Component for Kobayashi Maru HUD
 * 
 * A reusable button component with hover effects and disabled state.
 * Provides consistent interaction patterns across the UI.
 * 
 * @module ui/components/Button
 */
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import { UI_CONFIG } from '../../config';

/**
 * Configuration options for creating a button.
 */
export interface ButtonOptions {
    /** Button label text */
    text: string;
    /** Button width in pixels */
    width?: number;
    /** Button height in pixels */
    height?: number;
    /** Callback when button is clicked */
    onClick: () => void;
    /** Whether the button is disabled */
    disabled?: boolean;
    /** Button color (defaults to PRIMARY) */
    color?: number;
}

/**
 * Button provides a reusable clickable button with visual feedback.
 * 
 * @example
 * ```typescript
 * const buyButton = new Button({
 *   text: 'BUY',
 *   width: 100,
 *   height: 40,
 *   onClick: () => purchaseUpgrade(),
 *   disabled: !canAfford
 * });
 * buyButton.container.position.set(10, 10);
 * parent.addChild(buyButton.container);
 * ```
 */
export class Button {
    /** Main container for this button */
    public readonly container: Container;
    /** Button background */
    private background: Graphics;
    /** Button label */
    private label: Text;
    /** Button dimensions */
    private width: number;
    private height: number;
    /** Button color */
    private color: number;
    /** Click handler */
    private onClick: () => void;
    /** Disabled state */
    private _disabled: boolean = false;

    /** Default button dimensions */
    private static readonly DEFAULT_WIDTH = 100;
    private static readonly DEFAULT_HEIGHT = UI_CONFIG.BUTTONS.TOGGLE_HEIGHT;
    private static readonly CORNER_RADIUS = 6;

    constructor(options: ButtonOptions) {
        this.width = options.width ?? Button.DEFAULT_WIDTH;
        this.height = options.height ?? Button.DEFAULT_HEIGHT;
        this.color = options.color ?? UI_STYLES.COLORS.PRIMARY;
        this.onClick = options.onClick;
        this._disabled = options.disabled ?? false;

        this.container = new Container();
        this.container.eventMode = 'static';
        this.container.cursor = this._disabled ? 'not-allowed' : 'pointer';

        // Create background
        this.background = new Graphics();
        this.drawBackground(false);
        this.container.addChild(this.background);

        // Create label
        const labelStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT,
        });
        this.label = new Text({ text: options.text, style: labelStyle });
        this.label.anchor.set(0.5);
        this.label.position.set(this.width / 2, this.height / 2);
        this.container.addChild(this.label);

        // Set up event handlers
        this.container.on('pointerdown', this.handleClick.bind(this));
        this.container.on('pointerover', () => this.drawBackground(true));
        this.container.on('pointerout', () => this.drawBackground(false));

        // Apply disabled state
        this.updateDisabledState();
    }

    /**
     * Handle click event.
     */
    private handleClick(): void {
        if (!this._disabled) {
            this.onClick();
        }
    }

    /**
     * Draw button background with current state.
     * @param hovered - Whether the button is being hovered
     */
    private drawBackground(hovered: boolean): void {
        const borderColor = this._disabled ? UI_CONFIG.COLORS.DISABLED : this.color;
        const borderWidth = hovered && !this._disabled ? 3 : 2;
        const alpha = hovered && !this._disabled ? 0.9 : 0.7;

        this.background.clear();
        this.background.roundRect(0, 0, this.width, this.height, Button.CORNER_RADIUS);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha });
        this.background.stroke({
            color: hovered && !this._disabled ? UI_STYLES.COLORS.PRIMARY : borderColor,
            width: borderWidth
        });
    }

    /**
     * Update disabled visual state.
     */
    private updateDisabledState(): void {
        this.container.cursor = this._disabled ? 'not-allowed' : 'pointer';
        this.container.alpha = this._disabled ? 0.5 : 1;
        this.drawBackground(false);
    }

    /**
     * Set button text.
     * @param text - New button text
     */
    public setText(text: string): void {
        this.label.text = text;
    }

    /**
     * Set disabled state.
     * @param disabled - Whether the button should be disabled
     */
    public set disabled(value: boolean) {
        this._disabled = value;
        this.updateDisabledState();
    }

    /**
     * Get disabled state.
     */
    public get disabled(): boolean {
        return this._disabled;
    }

    /**
     * Set button position.
     * @param x - X position in pixels
     * @param y - Y position in pixels
     */
    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    /**
     * Set button scale.
     * @param scale - Scale factor
     */
    public setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    /**
     * Get button dimensions for layout calculations.
     */
    public getDimensions(): { width: number; height: number } {
        return { width: this.width, height: this.height };
    }

    /**
     * Clean up resources.
     */
    public destroy(): void {
        this.container.destroy({ children: true });
    }
}
