/**
 * Base UI Component Class for Kobayashi Maru
 * 
 * Provides common functionality for all UI components including:
 * - Lifecycle management (init, destroy)
 * - Visibility control (show, hide)
 * - Positioning helpers
 * - Event subscription with automatic cleanup
 * - Common UI element creation helpers
 * 
 * @module ui/base/UIComponent
 */
import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { EventBus } from '../../core/EventBus';
import { UI_STYLES } from '../styles';
import type { GameEventType } from '../../types/events';

/**
 * Event subscription record for cleanup tracking.
 */
interface EventSubscription {
    /** Event type that was subscribed to */
    event: GameEventType;
    /** Handler function to remove on destroy */
    handler: (payload: unknown) => void;
}

/**
 * Base class for all UI components.
 * Provides common functionality for lifecycle, positioning, and events.
 * 
 * @example
 * ```typescript
 * export class MyPanel extends UIComponent {
 *     private label!: Text;
 *     
 *     protected build(): void {
 *         this.label = this.createText('Hello World');
 *         this.container.addChild(this.label);
 *     }
 *     
 *     public update(data: { message: string }): void {
 *         this.label.text = data.message;
 *     }
 * }
 * ```
 */
export abstract class UIComponent {
    /** Root container for this component */
    public readonly container: Container;
    
    /** Whether the component is currently visible */
    protected _visible: boolean = true;
    
    /** Whether the component has been initialized */
    protected _initialized: boolean = false;
    
    /** Event subscriptions for cleanup */
    protected eventSubscriptions: EventSubscription[] = [];

    constructor() {
        this.container = new Container();
    }

    // =========================================
    // ABSTRACT METHODS (must implement)
    // =========================================
    
    /**
     * Build the component's visual elements.
     * Called once during initialization.
     * Subclasses must implement this to create their UI elements.
     */
    protected abstract build(): void;
    
    /**
     * Update the component with new data.
     * Called when data changes.
     * @param data - Data to update the component with
     */
    public abstract update(data: unknown): void;

    // =========================================
    // LIFECYCLE METHODS
    // =========================================
    
    /**
     * Initialize the component and add to parent.
     * Calls build() and sets up initial state.
     * @param parent - Parent container to add this component to
     */
    public init(parent: Container): void {
        if (this._initialized) return;
        
        this.build();
        parent.addChild(this.container);
        this._initialized = true;
    }
    
    /**
     * Destroy the component and clean up resources.
     * Removes event subscriptions and destroys the container.
     */
    public destroy(): void {
        // Unsubscribe from all events
        const eventBus = EventBus.getInstance();
        for (const { event, handler } of this.eventSubscriptions) {
            eventBus.off(event, handler as never);
        }
        this.eventSubscriptions = [];
        
        // Destroy container and children
        this.container.destroy({ children: true });
        this._initialized = false;
    }

    // =========================================
    // VISIBILITY
    // =========================================
    
    /**
     * Show the component.
     */
    public show(): void {
        this._visible = true;
        this.container.visible = true;
    }
    
    /**
     * Hide the component.
     */
    public hide(): void {
        this._visible = false;
        this.container.visible = false;
    }
    
    /**
     * Check if the component is visible.
     */
    public get visible(): boolean {
        return this._visible;
    }
    
    /**
     * Check if the component has been initialized.
     */
    public get initialized(): boolean {
        return this._initialized;
    }

    // =========================================
    // POSITIONING
    // =========================================
    
    /**
     * Set the position of the component.
     * @param x - X position in pixels
     * @param y - Y position in pixels
     */
    public setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }
    
    /**
     * Set the scale of the component.
     * @param scale - Scale factor (1.0 = 100%)
     */
    public setScale(scale: number): void {
        this.container.scale.set(scale);
    }
    
    /**
     * Adjust position based on anchor point.
     * @param anchor - Anchor position for alignment
     */
    public setAnchor(anchor: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center'): void {
        const bounds = this.container.getBounds();
        const { width, height } = bounds;
        
        switch (anchor) {
            case 'top-left':
                // Default, no adjustment needed
                break;
            case 'top-right':
                this.container.x -= width;
                break;
            case 'bottom-left':
                this.container.y -= height;
                break;
            case 'bottom-right':
                this.container.x -= width;
                this.container.y -= height;
                break;
            case 'center':
                this.container.x -= width / 2;
                this.container.y -= height / 2;
                break;
        }
    }

    // =========================================
    // EVENT HELPERS
    // =========================================
    
    /**
     * Subscribe to an event with automatic cleanup tracking.
     * The subscription will be automatically removed when destroy() is called.
     * @param event - Event type to subscribe to
     * @param handler - Handler function to call when event is emitted
     */
    protected subscribe<T extends GameEventType>(
        event: T,
        handler: (payload: unknown) => void
    ): void {
        EventBus.getInstance().on(event, handler as never);
        this.eventSubscriptions.push({ event, handler });
    }

    // =========================================
    // COMMON UI ELEMENTS
    // =========================================
    
    /**
     * Create a text element with standard styling.
     * Uses UI_STYLES for consistent appearance with existing components.
     * @param text - Text content
     * @param options - Optional styling overrides
     * @returns Text element
     */
    protected createText(
        text: string,
        options: { fontSize?: number; color?: number; fontFamily?: string; fontWeight?: 'normal' | 'bold' } = {}
    ): Text {
        const style = new TextStyle({
            fontSize: options.fontSize ?? UI_STYLES.FONT_SIZE_MEDIUM,
            fill: options.color ?? UI_STYLES.COLORS.TEXT,
            fontFamily: options.fontFamily ?? UI_STYLES.FONT_FAMILY,
            fontWeight: options.fontWeight,
        });
        return new Text({ text, style });
    }
    
    /**
     * Create a panel background with rounded corners.
     * Uses UI_STYLES for consistent appearance.
     * @param width - Background width in pixels
     * @param height - Background height in pixels
     * @param options - Optional styling overrides
     * @returns Graphics element
     */
    protected createBackground(
        width: number,
        height: number,
        options: { color?: number; alpha?: number; cornerRadius?: number; borderColor?: number; borderWidth?: number } = {}
    ): Graphics {
        const bg = new Graphics();
        bg.roundRect(0, 0, width, height, options.cornerRadius ?? 8);
        bg.fill({ 
            color: options.color ?? UI_STYLES.COLORS.BACKGROUND, 
            alpha: options.alpha ?? 0.7 
        });
        
        if (options.borderColor !== undefined || options.borderWidth !== undefined) {
            bg.stroke({ 
                color: options.borderColor ?? UI_STYLES.COLORS.PRIMARY, 
                width: options.borderWidth ?? 2 
            });
        }
        
        return bg;
    }
}
