/**
 * Tests for MessageLog component
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { MessageLog } from '../ui/MessageLog';

// Mock PixiJS
vi.mock('pixi.js', async () => {
    const actual = await vi.importActual('pixi.js') as object;

    class MockText {
        text: string = '';
        style: unknown = {};
        anchor = { set: vi.fn() };
        position = { set: vi.fn(), x: 0, y: 0 };
        alpha = 1.0;
        visible = true;
        constructor(options?: { text?: string; style?: unknown }) {
            this.text = options?.text ?? '';
            this.style = options?.style ?? {};
        }
        destroy = vi.fn();
    }

    class MockContainer {
        visible = true;
        position = { set: vi.fn(), x: 0, y: 0 };
        scale = { set: vi.fn() };
        children: unknown[] = [];
        addChild = vi.fn((child) => {
            this.children.push(child);
            return child;
        });
        destroy = vi.fn();
    }

    return {
        ...actual,
        Container: MockContainer,
        Text: MockText,
        TextStyle: class MockTextStyle {
            constructor(_opts?: unknown) { }
        }
    };
});

describe('MessageLog', () => {
    let messageLog: MessageLog;

    beforeEach(() => {
        messageLog = new MessageLog();
        vi.useFakeTimers();
    });

    describe('initialization', () => {
        it('should create a container', () => {
            expect(messageLog.container).toBeDefined();
            expect(messageLog.container).toBeInstanceOf(Container);
        });

        it('should initialize with visible state', () => {
            expect(messageLog.isVisible()).toBe(true);
        });
    });

    describe('addMessage', () => {
        it('should add a message to the log', () => {
            messageLog.addMessage('Test message');
            expect(messageLog.container.children.length).toBeGreaterThan(0);
        });

        it('should handle different message categories', () => {
            expect(() => messageLog.addMessage('Info', 'info')).not.toThrow();
            expect(() => messageLog.addMessage('Warning', 'warning')).not.toThrow();
            expect(() => messageLog.addMessage('Kill', 'kill')).not.toThrow();
        });

        it('should respect max message limit', () => {
            // Add more than MAX_MESSAGES (8)
            for (let i = 0; i < 10; i++) {
                messageLog.addMessage(`Message ${i}`);
            }
            // Should only have visible texts up to MAX_MESSAGES
            const visibleTexts = messageLog.container.children.filter((child: any) => child.visible);
            expect(visibleTexts.length).toBeLessThanOrEqual(8);
        });
    });

    describe('update', () => {
        it('should update message fade effect', () => {
            messageLog.addMessage('Test message');

            // Advance time by 5 seconds (half of fade duration)
            vi.advanceTimersByTime(5000);
            messageLog.update();

            // Message should still be visible but faded
            const visibleTexts = messageLog.container.children.filter((child: any) => child.visible);
            expect(visibleTexts.length).toBeGreaterThan(0);
        });

        it('should remove expired messages', () => {
            messageLog.addMessage('Test message');

            // Advance time by 11 seconds (past fade duration of 10s)
            vi.advanceTimersByTime(11000);
            messageLog.update();

            // Message should be removed (not visible)
            const visibleTexts = messageLog.container.children.filter((child: any) => child.visible);
            expect(visibleTexts.length).toBe(0);
        });
    });

    describe('positioning', () => {
        it('should set position correctly', () => {
            messageLog.setPosition(100, 200);
            expect(messageLog.container.position.set).toHaveBeenCalledWith(100, 200);
        });
    });

    describe('visibility', () => {
        it('should show the message log', () => {
            messageLog.hide();
            messageLog.show();
            expect(messageLog.isVisible()).toBe(true);
            expect(messageLog.container.visible).toBe(true);
        });

        it('should hide the message log', () => {
            messageLog.hide();
            expect(messageLog.isVisible()).toBe(false);
            expect(messageLog.container.visible).toBe(false);
        });
    });

    describe('clear', () => {
        it('should clear all messages', () => {
            messageLog.addMessage('Message 1');
            messageLog.addMessage('Message 2');
            messageLog.clear();

            const visibleTexts = messageLog.container.children.filter((child: any) => child.visible);
            expect(visibleTexts.length).toBe(0);
        });
    });

    describe('destroy', () => {
        it('should clean up resources', () => {
            messageLog.addMessage('Test');
            messageLog.destroy();
            expect(messageLog.container.destroy).toHaveBeenCalledWith({ children: true });
        });
    });
});
