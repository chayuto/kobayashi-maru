/**
 * AI Thought Feed Component for Kobayashi Maru HUD
 *
 * Displays scrolling log of AI decisions with personality-flavored commentary.
 * Shows what the AI is doing and why.
 *
 * @module ui/panels/AIThoughtFeed
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from '../styles';
import type { AIMessage } from '../../ai/humanization/AIMessageGenerator';

interface DisplayMessage {
    textElement: Text;
    timestamp: number;
    fadeStartTime: number;
}

export class AIThoughtFeed {
    private container: Container;
    private background: Graphics;
    private titleText: Text;
    private messageContainer: Container;
    private messages: DisplayMessage[] = [];
    private textPool: Text[] = [];
    private initialized: boolean = false;

    private static readonly WIDTH = 280;
    private static readonly HEIGHT = 100;
    private static readonly MAX_MESSAGES = 4;
    private static readonly MESSAGE_HEIGHT = 18;
    private static readonly FADE_DURATION = 8000; // 8 seconds

    constructor() {
        this.container = new Container();
        this.background = new Graphics();
        this.messageContainer = new Container();

        const titleStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: UI_STYLES.FONT_SIZE_SMALL,
            fill: UI_STYLES.COLORS.PRIMARY,
            fontWeight: 'bold',
        });

        this.titleText = new Text({ text: '📢 COMMANDER LOG', style: titleStyle });
    }

    init(parent: Container): void {
        if (this.initialized) return;

        // Background
        this.background.roundRect(0, 0, AIThoughtFeed.WIDTH, AIThoughtFeed.HEIGHT, 6);
        this.background.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.8 });
        this.background.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 1, alpha: 0.5 });
        this.container.addChild(this.background);

        // Title
        this.titleText.position.set(8, 6);
        this.container.addChild(this.titleText);

        // Message container
        this.messageContainer.position.set(8, 26);
        this.container.addChild(this.messageContainer);

        // Initialize text pool
        this.initializeTextPool();

        // Add to parent container
        parent.addChild(this.container);
        this.initialized = true;
    }

    private initializeTextPool(): void {
        const style = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: 12,
            fill: UI_STYLES.COLORS.TEXT,
        });

        for (let i = 0; i < AIThoughtFeed.MAX_MESSAGES + 2; i++) {
            const text = new Text({ text: '', style });
            text.visible = false;
            this.messageContainer.addChild(text);
            this.textPool.push(text);
        }
    }

    /**
     * Add a new message to the feed
     */
    addMessage(message: AIMessage): void {
        if (!this.initialized) return;

        const now = Date.now();

        // Remove oldest if at capacity
        if (this.messages.length >= AIThoughtFeed.MAX_MESSAGES) {
            const removed = this.messages.shift();
            if (removed) {
                removed.textElement.visible = false;
            }
        }

        // Get available text element
        const textElement = this.textPool.find(t => !t.visible);
        if (!textElement) return;

        // Format text with icon
        const timeStr = this.formatTime(message.timestamp);
        textElement.text = `[${timeStr}] ${message.icon} ${message.text}`;
        textElement.visible = true;
        textElement.alpha = 1.0;

        // Add to messages
        this.messages.push({
            textElement,
            timestamp: message.timestamp,
            fadeStartTime: now + 3000, // Start fading after 3 seconds
        });

        // Update positions
        this.updatePositions();
    }

    /**
     * Update positions of all messages (newest at bottom)
     */
    private updatePositions(): void {
        this.messages.forEach((msg, index) => {
            msg.textElement.position.set(0, index * AIThoughtFeed.MESSAGE_HEIGHT);
        });
    }

    /**
     * Update fade effects
     */
    update(): void {
        if (!this.initialized) return;

        const now = Date.now();
        const toRemove: DisplayMessage[] = [];

        this.messages.forEach(msg => {
            if (now > msg.fadeStartTime) {
                const fadeProgress = (now - msg.fadeStartTime) / AIThoughtFeed.FADE_DURATION;

                if (fadeProgress >= 1.0) {
                    msg.textElement.visible = false;
                    toRemove.push(msg);
                } else {
                    msg.textElement.alpha = Math.max(0, 1.0 - fadeProgress);
                }
            }
        });

        // Remove expired messages
        toRemove.forEach(msg => {
            const index = this.messages.indexOf(msg);
            if (index !== -1) {
                this.messages.splice(index, 1);
            }
        });

        if (toRemove.length > 0) {
            this.updatePositions();
        }
    }

    /**
     * Format timestamp to HH:MM
     */
    private formatTime(timestamp: number): string {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    getContainer(): Container {
        return this.container;
    }

    setPosition(x: number, y: number): void {
        this.container.position.set(x, y);
    }

    setScale(scale: number): void {
        this.container.scale.set(scale);
    }

    static getDimensions(): { width: number; height: number } {
        return { width: AIThoughtFeed.WIDTH, height: AIThoughtFeed.HEIGHT };
    }

    show(): void {
        this.container.visible = true;
    }

    hide(): void {
        this.container.visible = false;
    }

    clear(): void {
        this.messages.forEach(msg => {
            msg.textElement.visible = false;
        });
        this.messages = [];
    }

    destroy(): void {
        this.clear();
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
