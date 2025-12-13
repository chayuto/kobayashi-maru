/**
 * Left Button Panel Component for Kobayashi Maru HUD
 *
 * Manages the vertical stack of buttons on the left side of the HUD.
 * Centralizes button management, layout, and lifecycle.
 *
 * @module ui/components/LeftButtonPanel
 */

import { Container } from 'pixi.js';
import { ToggleButton } from './ToggleButton';
import { IconButton } from './IconButton';
import { HUDLayoutManager } from '../HUDLayoutManager';

/**
 * LeftButtonPanel manages the vertical stack of buttons on the left side of the HUD.
 *
 * This component centralizes:
 * - Button creation and registration
 * - Layout/positioning during resize
 * - Lifecycle management (destroy)
 *
 * @example
 * ```typescript
 * const leftPanel = new LeftButtonPanel();
 * leftPanel.init(container);
 * leftPanel.setMuteButton(muteButton);
 * leftPanel.addToggleButton(godModeButton, 0);
 * leftPanel.updateLayout(scale, layoutManager);
 * ```
 */
export class LeftButtonPanel {
    private container: Container;
    private muteButton: IconButton | null = null;
    private toggleButtons: Map<number, ToggleButton> = new Map();
    private initialized: boolean = false;

    constructor() {
        this.container = new Container();
    }

    /**
     * Initialize the panel and add it to a parent container.
     * @param parent - Parent container
     */
    init(parent: Container): void {
        if (this.initialized) return;
        parent.addChild(this.container);
        this.initialized = true;
    }

    /**
     * Set the mute button (IconButton at top of stack).
     */
    setMuteButton(button: IconButton): void {
        this.muteButton = button;
        // IconButton manages its own container, so no addChild here
    }

    /**
     * Add a toggle button at the specified index.
     * @param button - Toggle button to add
     * @param index - Position index (0 = first toggle, 1 = second, etc.)
     */
    addToggleButton(button: ToggleButton, index: number): void {
        this.toggleButtons.set(index, button);
    }

    /**
     * Get a toggle button by index.
     */
    getToggleButton(index: number): ToggleButton | undefined {
        return this.toggleButtons.get(index);
    }

    /**
     * Update layout for all managed buttons.
     * @param scale - Current UI scale factor
     * @param layoutManager - Layout manager for position calculations
     */
    updateLayout(scale: number, layoutManager: HUDLayoutManager): void {
        // Update mute button
        if (this.muteButton) {
            this.muteButton.setScale(scale);
            const pos = layoutManager.getMuteButtonPosition(scale);
            this.muteButton.setPosition(pos.x, pos.y);
        }

        // Update toggle buttons
        this.toggleButtons.forEach((button, index) => {
            button.setScale(scale);
            const pos = layoutManager.getToggleButtonPosition(index, scale);
            button.setPosition(pos.x, pos.y);
        });
    }

    /**
     * Get the number of toggle buttons.
     */
    getToggleButtonCount(): number {
        return this.toggleButtons.size;
    }

    /**
     * Get container for this panel.
     */
    getContainer(): Container {
        return this.container;
    }

    /**
     * Clean up all resources.
     */
    destroy(): void {
        if (this.muteButton) {
            this.muteButton.destroy();
            this.muteButton = null;
        }

        this.toggleButtons.forEach(button => button.destroy());
        this.toggleButtons.clear();

        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
