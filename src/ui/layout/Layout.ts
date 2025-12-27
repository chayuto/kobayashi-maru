/**
 * Layout Utilities for Kobayashi Maru UI
 * 
 * Provides flexible layout functions for arranging UI components.
 * 
 * @module ui/layout/Layout
 */
import type { Container } from 'pixi.js';

/**
 * Alignment options for layout.
 */
export type Alignment = 'start' | 'center' | 'end';

/**
 * Direction for layout flow.
 */
export type Direction = 'horizontal' | 'vertical';

/**
 * Options for layoutChildren function.
 */
export interface LayoutOptions {
    /** Direction of layout flow */
    direction: Direction;
    /** Gap between children in pixels */
    gap: number;
    /** Alignment of children */
    align: Alignment;
    /** Padding from container edges */
    padding: number;
}

/**
 * Options for gridLayout function.
 */
export interface GridLayoutOptions {
    /** Number of columns */
    columns: number;
    /** Width of each cell in pixels */
    cellWidth: number;
    /** Height of each cell in pixels */
    cellHeight: number;
    /** Gap between cells in pixels */
    gap?: number;
    /** Padding from container edges */
    padding?: number;
}

/**
 * Arrange children in a linear layout (horizontal or vertical).
 * 
 * @example
 * ```typescript
 * // Vertical layout with 8px gap
 * layoutChildren(container, { direction: 'vertical', gap: 8 });
 * 
 * // Horizontal layout centered
 * layoutChildren(container, { 
 *   direction: 'horizontal', 
 *   gap: 16, 
 *   align: 'center' 
 * });
 * ```
 * 
 * @param container - Container with children to layout
 * @param options - Layout options
 */
export function layoutChildren(
    container: Container,
    options: Partial<LayoutOptions> = {}
): void {
    const opts: LayoutOptions = {
        direction: 'vertical',
        gap: 8,
        align: 'start',
        padding: 0,
        ...options,
    };

    let offset = opts.padding;
    const isHorizontal = opts.direction === 'horizontal';

    for (const child of container.children) {
        if (!child.visible) continue;

        if (isHorizontal) {
            child.x = offset;
            offset += child.width + opts.gap;
        } else {
            child.y = offset;
            offset += child.height + opts.gap;
        }
    }
}

/**
 * Arrange children in a grid layout.
 * 
 * @example
 * ```typescript
 * // 3 column grid with 64x64 cells
 * gridLayout(container, {
 *   columns: 3,
 *   cellWidth: 64,
 *   cellHeight: 64,
 *   gap: 8
 * });
 * ```
 * 
 * @param container - Container with children to layout
 * @param options - Grid layout options
 */
export function gridLayout(
    container: Container,
    options: GridLayoutOptions
): void {
    const gap = options.gap ?? 8;
    const padding = options.padding ?? 0;
    
    let col = 0;
    let row = 0;

    for (const child of container.children) {
        if (!child.visible) continue;

        child.x = padding + col * (options.cellWidth + gap);
        child.y = padding + row * (options.cellHeight + gap);

        col++;
        if (col >= options.columns) {
            col = 0;
            row++;
        }
    }
}

/**
 * Center a child within a container.
 * 
 * @param child - Child container to center
 * @param containerWidth - Width of parent container
 * @param containerHeight - Height of parent container
 */
export function centerChild(
    child: Container,
    containerWidth: number,
    containerHeight: number
): void {
    const bounds = child.getBounds();
    child.x = (containerWidth - bounds.width) / 2;
    child.y = (containerHeight - bounds.height) / 2;
}

/**
 * Align a child to an edge of a container.
 * 
 * @param child - Child container to align
 * @param containerWidth - Width of parent container
 * @param containerHeight - Height of parent container
 * @param anchor - Anchor position
 * @param padding - Padding from edge
 */
export function alignChild(
    child: Container,
    containerWidth: number,
    containerHeight: number,
    anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center',
    padding: number = 0
): void {
    const bounds = child.getBounds();
    
    switch (anchor) {
        case 'top-left':
            child.x = padding;
            child.y = padding;
            break;
        case 'top-right':
            child.x = containerWidth - bounds.width - padding;
            child.y = padding;
            break;
        case 'bottom-left':
            child.x = padding;
            child.y = containerHeight - bounds.height - padding;
            break;
        case 'bottom-right':
            child.x = containerWidth - bounds.width - padding;
            child.y = containerHeight - bounds.height - padding;
            break;
        case 'center':
            child.x = (containerWidth - bounds.width) / 2;
            child.y = (containerHeight - bounds.height) / 2;
            break;
    }
}
