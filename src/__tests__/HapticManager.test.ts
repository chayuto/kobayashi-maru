/**
 * Tests for HapticManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { HapticManager, HapticPattern } from '../core/HapticManager';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types';

describe('HapticManager', () => {
    let hapticManager: HapticManager;
    let eventBus: EventBus;
    let vibrateMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Reset EventBus instance
        // @ts-expect-error - accessing private property for testing
        EventBus.instance = null;
        eventBus = EventBus.getInstance();

        // Mock navigator.vibrate
        vibrateMock = vi.fn();
        Object.defineProperty(navigator, 'vibrate', {
            value: vibrateMock,
            writable: true
        });

        hapticManager = new HapticManager();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should initialize with vibration support', () => {
        expect(hapticManager.isEnabled()).toBe(true);
    });

    it('should trigger vibration on ENEMY_KILLED', () => {
        eventBus.emit(GameEventType.ENEMY_KILLED, { entityId: 1, factionId: 1, x: 0, y: 0 });
        expect(vibrateMock).toHaveBeenCalledWith(HapticPattern.LIGHT);
    });

    it('should trigger vibration on PLAYER_DAMAGED', () => {
        eventBus.emit(GameEventType.PLAYER_DAMAGED, { currentHealth: 50 });
        expect(vibrateMock).toHaveBeenCalledWith(HapticPattern.HEAVY);
    });

    it('should trigger vibration on GAME_OVER', () => {
        eventBus.emit(GameEventType.GAME_OVER, { score: 100 });
        expect(vibrateMock).toHaveBeenCalledWith(HapticPattern.FAILURE);
    });

    it('should trigger vibration on WAVE_COMPLETED', () => {
        eventBus.emit(GameEventType.WAVE_COMPLETED, { waveNumber: 1 });
        expect(vibrateMock).toHaveBeenCalledWith(HapticPattern.SUCCESS);
    });

    it('should not vibrate when disabled', () => {
        hapticManager.setEnabled(false);
        hapticManager.trigger(HapticPattern.LIGHT);
        expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('should handle missing vibration API gracefully', () => {
        // Remove vibrate from navigator
        Object.defineProperty(navigator, 'vibrate', {
            value: undefined,
            writable: true
        });

        // Re-initialize manager
        const manager = new HapticManager();
        expect(manager.isEnabled()).toBe(false);

        // Should not throw
        expect(() => manager.trigger([100])).not.toThrow();
    });
});
