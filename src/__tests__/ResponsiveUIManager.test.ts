/**
 * Tests for ResponsiveUIManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ResponsiveUIManager, DeviceType } from '../ui/ResponsiveUIManager';
import { Application, Container } from 'pixi.js';

// Mock PixiJS
vi.mock('pixi.js', async () => {
    const actual = await vi.importActual('pixi.js');
    return {
        ...actual,
        Graphics: class {
            clear = vi.fn();
            rect = vi.fn();
            fill = vi.fn();
            roundRect = vi.fn();
            stroke = vi.fn();
            arc = vi.fn();
            moveTo = vi.fn();
            lineTo = vi.fn();
            position = { set: vi.fn() };
        },
        Text: class {
            anchor = { set: vi.fn() };
            position = { set: vi.fn() };
        },
        Container: class {
            children = [];
            addChild = vi.fn((child) => {
                // @ts-expect-error - Mocking children array for testing
                this.children.push(child);
            });
            destroy = vi.fn();
            visible = true;
            zIndex = 0;
        }
    };
});

describe('ResponsiveUIManager', () => {
    let responsiveUIManager: ResponsiveUIManager;
    let mockApp: Application;
    let mockStage: Container;

    beforeEach(() => {
        mockStage = new Container();
        mockApp = {
            stage: mockStage,
            renderer: {
                resize: vi.fn()
            }
        } as unknown as Application;

        responsiveUIManager = new ResponsiveUIManager(mockApp);
    });

    afterEach(() => {
        responsiveUIManager.destroy();
        vi.clearAllMocks();
    });

    it('should initialize with default desktop settings', () => {
        // Default window size in jsdom is usually 1024x768
        expect(responsiveUIManager.getDeviceType()).toBe(DeviceType.DESKTOP);
        expect(responsiveUIManager.getScaleFactor()).toBe(1.0);
    });

    it('should detect MOBILE device type', () => {
        // Mock window size
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

        // Trigger resize
        window.dispatchEvent(new Event('resize'));

        expect(responsiveUIManager.getDeviceType()).toBe(DeviceType.MOBILE);
        expect(responsiveUIManager.getScaleFactor()).toBe(0.8);
    });

    it('should detect TABLET device type', () => {
        // Mock window size
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

        // Trigger resize
        window.dispatchEvent(new Event('resize'));

        expect(responsiveUIManager.getDeviceType()).toBe(DeviceType.TABLET);
        expect(responsiveUIManager.getScaleFactor()).toBe(0.8);
    });

    it('should show orientation overlay on mobile portrait', () => {
        // Mock mobile portrait
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 375 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 667 });

        // Trigger resize
        window.dispatchEvent(new Event('resize'));

        // Access private overlay property via any cast or check visible children
        // The overlay container is added to stage
        const overlayContainer = mockStage.children[0] as Container;
        expect(overlayContainer.visible).toBe(true);
    });

    it('should hide orientation overlay on mobile landscape', () => {
        // Mock mobile landscape
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 667 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 375 });

        // Trigger resize
        window.dispatchEvent(new Event('resize'));

        const overlayContainer = mockStage.children[0] as Container;
        expect(overlayContainer.visible).toBe(false);
    });
});
