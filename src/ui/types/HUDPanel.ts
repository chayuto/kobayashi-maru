/**
 * HUD Panel Interface for Kobayashi Maru
 *
 * Defines the standard interface that all HUD panels must implement.
 * This ensures consistent initialization, positioning, and lifecycle management.
 *
 * @module ui/types/HUDPanel
 */

import { Container } from 'pixi.js';

/**
 * Standard interface for all HUD panel components.
 *
 * All panels follow the same lifecycle:
 * 1. Constructor - create internal elements
 * 2. init(parent) - add to parent container
 * 3. setPosition/setScale - layout updates
 * 4. update(data) - refresh with new data
 * 5. destroy() - cleanup resources
 *
 * @example
 * ```typescript
 * class MyPanel implements HUDPanel {
 *   init(parent: Container): void {
 *     // Build hierarchy, then add to parent
 *     parent.addChild(this.container);
 *   }
 * }
 * ```
 */
export interface HUDPanel {
    /**
     * Initialize the panel and add it to a parent container.
     * @param parent - Parent container to add this panel to
     */
    init(parent: Container): void;

    /**
     * Set panel position.
     * @param x - X position in pixels
     * @param y - Y position in pixels
     */
    setPosition(x: number, y: number): void;

    /**
     * Set panel scale for responsive layout.
     * @param scale - Scale factor (1.0 = 100%)
     */
    setScale(scale: number): void;

    /**
     * Clean up resources when panel is destroyed.
     */
    destroy(): void;

    /**
     * Show the panel (optional).
     */
    show?(): void;

    /**
     * Hide the panel (optional).
     */
    hide?(): void;
}

/**
 * Extended panel interface for panels that support visibility toggling.
 */
export interface HUDPanelWithVisibility extends HUDPanel {
    show(): void;
    hide(): void;
}
