/**
 * Message Log Component for Kobayashi Maru
 * Displays game event messages with a fade-out effect as they age
 */
import { Container, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';

export type MessageCategory = 'info' | 'warning' | 'damage' | 'kill' | 'wave';

interface LogMessage {
    text: string;
    timestamp: number;
    category: MessageCategory;
    textElement: Text;
}

/**
 * MessageLog - Displays scrolling game messages with fade effect
 */
export class MessageLog {
    public container: Container;
    private messages: LogMessage[] = [];
    private readonly MAX_MESSAGES = 8;
    private readonly FADE_DURATION = 10000; // 10 seconds in ms
    private readonly LINE_HEIGHT = 22;
    private readonly MESSAGE_SPACING = 4;
    private textPool: Text[] = [];

    constructor() {
        this.container = new Container();
        this.initializeTextPool();
    }

    /**
     * Create a pool of reusable Text objects for performance
     */
    private initializeTextPool(): void {
        const style = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.TEXT,
            align: 'left'
        });

        for (let i = 0; i < this.MAX_MESSAGES; i++) {
            const text = new Text({ text: '', style });
            text.anchor.set(0, 0);
            text.visible = false;
            this.textPool.push(text);
            this.container.addChild(text);
        }
    }

    /**
     * Add a new message to the log
     * @param text - The message text to display
     * @param category - Optional category for styling (future use)
     */
    addMessage(text: string, category: MessageCategory = 'info'): void {
        const timestamp = Date.now();

        // Remove oldest message if at capacity
        if (this.messages.length >= this.MAX_MESSAGES) {
            const removed = this.messages.shift();
            if (removed) {
                removed.textElement.visible = false;
            }
        }

        // Get a text element from the pool
        const textElement = this.textPool.find(t => !t.visible);
        if (!textElement) {
            console.warn('MessageLog: No available text elements in pool');
            return;
        }

        textElement.text = text;
        textElement.visible = true;
        textElement.alpha = 1.0;

        // Add message to queue
        this.messages.push({
            text,
            timestamp,
            category,
            textElement
        });

        // Update positions
        this.updatePositions();
    }

    /**
     * Update message positions (newer at bottom)
     */
    private updatePositions(): void {
        this.messages.forEach((msg, index) => {
            const y = index * (this.LINE_HEIGHT + this.MESSAGE_SPACING);
            msg.textElement.position.set(0, y);
        });
    }

    /**
     * Update fade effect based on message age
     */
    update(): void {
        const currentTime = Date.now();
        const messagesToRemove: LogMessage[] = [];

        this.messages.forEach(msg => {
            const age = currentTime - msg.timestamp;
            const fadeProgress = age / this.FADE_DURATION;

            if (fadeProgress >= 1.0) {
                // Message has expired
                msg.textElement.visible = false;
                messagesToRemove.push(msg);
            } else {
                // Apply fade: alpha decreases from 1.0 to 0.0
                msg.textElement.alpha = Math.max(0, 1.0 - fadeProgress);
            }
        });

        // Remove expired messages
        messagesToRemove.forEach(msg => {
            const index = this.messages.indexOf(msg);
            if (index !== -1) {
                this.messages.splice(index, 1);
            }
        });

        // Update positions if messages were removed
        if (messagesToRemove.length > 0) {
            this.updatePositions();
        }
    }

    /**
     * Set the position of the message log container
     * @param x - X coordinate
     * @param y - Y coordinate
     */
    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    /**
     * Show the message log
     */
    show(): void {
        this.container.visible = true;
    }

    /**
     * Hide the message log
     */
    hide(): void {
        this.container.visible = false;
    }

    /**
     * Check if the message log is visible
     */
    isVisible(): boolean {
        return this.container.visible;
    }

    /**
     * Clear all messages
     */
    clear(): void {
        this.messages.forEach(msg => {
            msg.textElement.visible = false;
        });
        this.messages = [];
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.clear();
        this.container.destroy({ children: true });
    }
}
