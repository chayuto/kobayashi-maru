/**
 * Tests for GestureManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { GestureManager } from '../core/GestureManager';
import { EventBus } from '../core/EventBus';
import { GameEventType, GestureType } from '../types';

describe('GestureManager', () => {
    let gestureManager: GestureManager;
    let eventBus: EventBus;

    beforeEach(() => {
        // Reset EventBus instance
        // @ts-expect-error - accessing private property for testing
        EventBus.instance = null;
        eventBus = EventBus.getInstance();
        vi.spyOn(eventBus, 'emit');
        gestureManager = new GestureManager();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    // Helper to create mock TouchEvent
    const createTouchEvent = (type: string, touches: { clientX: number; clientY: number }[], changedTouches: { clientX: number; clientY: number }[] = []) => {
        return {
            type,
            touches: touches.map((t, i) => ({ ...t, identifier: i })),
            changedTouches: changedTouches.map((t, i) => ({ ...t, identifier: i })),
            preventDefault: vi.fn(),
            stopPropagation: vi.fn(),
        } as unknown as TouchEvent;
    };

    it('should detect TAP gesture', () => {
        // Touch start
        const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        gestureManager.handleTouchStart(startEvent);

        // Touch end (short duration, small movement)
        const endEvent = createTouchEvent('touchend', [], [{ clientX: 100, clientY: 100 }]);

        // Advance time slightly (less than SWIPE_TIMEOUT)
        vi.useFakeTimers();
        vi.advanceTimersByTime(100);

        gestureManager.handleTouchEnd(endEvent);

        expect(eventBus.emit).toHaveBeenCalledWith(GameEventType.GESTURE, expect.objectContaining({
            type: GestureType.TAP,
            centerX: 100,
            centerY: 100
        }));

        vi.useRealTimers();
    });

    it('should detect PAN gesture', () => {
        // Touch start
        const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        gestureManager.handleTouchStart(startEvent);

        // Move enough to trigger pan
        const moveEvent = createTouchEvent('touchmove', [{ clientX: 120, clientY: 100 }]);
        gestureManager.handleTouchMove(moveEvent);

        expect(eventBus.emit).toHaveBeenCalledWith(GameEventType.GESTURE, expect.objectContaining({
            type: GestureType.PAN,
            deltaX: 20,
            deltaY: 0
        }));
    });

    it('should detect PINCH gesture', () => {
        // Touch start with 2 fingers
        const startEvent = createTouchEvent('touchstart', [
            { clientX: 100, clientY: 100 },
            { clientX: 200, clientY: 100 }
        ]);
        gestureManager.handleTouchStart(startEvent);

        // Move fingers apart (zoom in)
        const moveEvent = createTouchEvent('touchmove', [
            { clientX: 50, clientY: 100 },
            { clientX: 250, clientY: 100 }
        ]);
        gestureManager.handleTouchMove(moveEvent);

        // Initial distance: 100
        // New distance: 200
        // Scale: 2.0
        expect(eventBus.emit).toHaveBeenCalledWith(GameEventType.GESTURE, expect.objectContaining({
            type: GestureType.PINCH,
            scale: 2.0
        }));
    });

    it('should detect SWIPE gesture', () => {
        // Touch start
        const startEvent = createTouchEvent('touchstart', [{ clientX: 100, clientY: 100 }]);
        gestureManager.handleTouchStart(startEvent);

        // Touch end with large movement and short duration
        const endEvent = createTouchEvent('touchend', [], [{ clientX: 300, clientY: 100 }]);

        vi.useFakeTimers();
        vi.advanceTimersByTime(100); // Fast enough for swipe

        gestureManager.handleTouchEnd(endEvent);

        expect(eventBus.emit).toHaveBeenCalledWith(GameEventType.GESTURE, expect.objectContaining({
            type: GestureType.SWIPE,
            direction: 'right'
        }));

        vi.useRealTimers();
    });
});
