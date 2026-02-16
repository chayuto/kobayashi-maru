/**
 * Tests for TechnobabbleGenerator
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GameEventType, AlertLevel } from '../types/events';

// Capture emitted events and subscription registrations
const mockEmit = vi.fn();
const mockOn = vi.fn();
const mockOff = vi.fn();

vi.mock('../core/EventBus', () => ({
    EventBus: {
        getInstance: () => ({
            emit: mockEmit,
            on: mockOn,
            off: mockOff,
        }),
    },
}));

import { TechnobabbleGenerator } from '../game/TechnobabbleGenerator';

describe('TechnobabbleGenerator', () => {
    let generator: TechnobabbleGenerator;

    beforeEach(() => {
        vi.clearAllMocks();
        generator = new TechnobabbleGenerator();
    });

    // ==========================================================================
    // Template generation
    // ==========================================================================

    describe('generateTechnobabble', () => {
        it('should generate valid technobabble strings matching template pattern', () => {
            // Arrange & Act
            const message = generator.generateTechnobabble();

            // Assert - format: "[Operation] [modifier] [component] — [status]"
            expect(message).toBeTruthy();
            expect(typeof message).toBe('string');
            // Should contain an em-dash separator
            expect(message).toContain(' — ');

            // Should have at least two parts
            const parts = message.split(' — ');
            expect(parts.length).toBe(2);
            // Left part should have words (operation + modifier + component)
            expect(parts[0].split(' ').length).toBeGreaterThanOrEqual(3);
            // Right part should be a status word
            expect(parts[1].length).toBeGreaterThan(0);
        });

        it('should generate different messages on repeated calls', () => {
            // Arrange & Act - generate many messages
            const messages = new Set<string>();
            for (let i = 0; i < 50; i++) {
                messages.add(generator.generateTechnobabble());
            }

            // Assert - should have at least a few unique ones (probabilistic, but very safe)
            expect(messages.size).toBeGreaterThan(1);
        });
    });

    // ==========================================================================
    // Lifecycle
    // ==========================================================================

    describe('init', () => {
        it('should subscribe to EventBus events', () => {
            // Act
            generator.init();

            // Assert
            expect(mockOn).toHaveBeenCalledTimes(3);
            expect(mockOn).toHaveBeenCalledWith(
                GameEventType.WAVE_STARTED,
                expect.any(Function)
            );
            expect(mockOn).toHaveBeenCalledWith(
                GameEventType.WAVE_COMPLETED,
                expect.any(Function)
            );
            expect(mockOn).toHaveBeenCalledWith(
                GameEventType.ALERT_LEVEL_CHANGED,
                expect.any(Function)
            );
        });

        it('should set active to true', () => {
            // Act
            generator.init();

            // Assert
            expect(generator.isActive()).toBe(true);
        });
    });

    describe('destroy', () => {
        it('should unsubscribe from all events', () => {
            // Arrange
            generator.init();
            mockOff.mockClear();

            // Act
            generator.destroy();

            // Assert
            expect(mockOff).toHaveBeenCalledTimes(3);
            expect(mockOff).toHaveBeenCalledWith(
                GameEventType.WAVE_STARTED,
                expect.any(Function)
            );
            expect(mockOff).toHaveBeenCalledWith(
                GameEventType.WAVE_COMPLETED,
                expect.any(Function)
            );
            expect(mockOff).toHaveBeenCalledWith(
                GameEventType.ALERT_LEVEL_CHANGED,
                expect.any(Function)
            );
        });

        it('should set active to false', () => {
            // Arrange
            generator.init();

            // Act
            generator.destroy();

            // Assert
            expect(generator.isActive()).toBe(false);
        });
    });

    // ==========================================================================
    // Event-triggered messages
    // ==========================================================================

    describe('wave start messages', () => {
        it('should emit messages on WAVE_STARTED events', () => {
            // Arrange
            generator.init();
            // Find the wave started handler that was registered
            const waveStartCall = mockOn.mock.calls.find(
                (call) => call[0] === GameEventType.WAVE_STARTED
            );
            expect(waveStartCall).toBeDefined();
            const handler = waveStartCall![1];

            // Simulate enough cooldown time by updating
            generator.update(10);

            // Act
            handler({ waveNumber: 1 });

            // Assert
            expect(mockEmit).toHaveBeenCalledWith(
                GameEventType.TECHNOBABBLE_MESSAGE,
                expect.objectContaining({ message: expect.any(String) })
            );
        });
    });

    describe('wave complete messages', () => {
        it('should emit messages on WAVE_COMPLETED events', () => {
            // Arrange
            generator.init();
            const waveCompleteCall = mockOn.mock.calls.find(
                (call) => call[0] === GameEventType.WAVE_COMPLETED
            );
            expect(waveCompleteCall).toBeDefined();
            const handler = waveCompleteCall![1];

            generator.update(10);

            // Act
            handler({ waveNumber: 1 });

            // Assert
            expect(mockEmit).toHaveBeenCalledWith(
                GameEventType.TECHNOBABBLE_MESSAGE,
                expect.objectContaining({ message: expect.any(String) })
            );
        });
    });

    describe('alert level messages', () => {
        let alertHandler: (payload: { level: AlertLevel; previousLevel: AlertLevel }) => void;

        beforeEach(() => {
            generator.init();
            const alertCall = mockOn.mock.calls.find(
                (call) => call[0] === GameEventType.ALERT_LEVEL_CHANGED
            );
            expect(alertCall).toBeDefined();
            alertHandler = alertCall![1];
            // Ensure cooldown is satisfied
            generator.update(10);
        });

        it('should emit message on CRITICAL alert', () => {
            // Act
            alertHandler({ level: AlertLevel.CRITICAL, previousLevel: AlertLevel.NORMAL });

            // Assert
            expect(mockEmit).toHaveBeenCalledWith(
                GameEventType.TECHNOBABBLE_MESSAGE,
                expect.objectContaining({ message: expect.any(String) })
            );
        });

        it('should emit message on CAUTION alert', () => {
            // Act
            alertHandler({ level: AlertLevel.CAUTION, previousLevel: AlertLevel.NORMAL });

            // Assert
            expect(mockEmit).toHaveBeenCalledWith(
                GameEventType.TECHNOBABBLE_MESSAGE,
                expect.objectContaining({ message: expect.any(String) })
            );
        });

        it('should emit message on NORMAL alert (standing down)', () => {
            // Act
            alertHandler({ level: AlertLevel.NORMAL, previousLevel: AlertLevel.CRITICAL });

            // Assert
            expect(mockEmit).toHaveBeenCalledWith(
                GameEventType.TECHNOBABBLE_MESSAGE,
                expect.objectContaining({ message: expect.any(String) })
            );
        });
    });

    // ==========================================================================
    // Cooldown
    // ==========================================================================

    describe('cooldown', () => {
        it('should respect cooldown between messages', () => {
            // Arrange
            generator.init();
            const waveStartCall = mockOn.mock.calls.find(
                (call) => call[0] === GameEventType.WAVE_STARTED
            );
            const handler = waveStartCall![1];

            // Give enough time for first message
            generator.update(10);

            // Act - first message should go through
            handler({ waveNumber: 1 });
            expect(mockEmit).toHaveBeenCalledTimes(1);

            // Act - second immediate message should be suppressed (cooldown = 5s)
            handler({ waveNumber: 2 });
            expect(mockEmit).toHaveBeenCalledTimes(1); // Still 1

            // Act - advance past cooldown
            generator.update(6);
            handler({ waveNumber: 3 });
            expect(mockEmit).toHaveBeenCalledTimes(2); // Now 2
        });

        it('should suppress messages within 5 second cooldown', () => {
            // Arrange
            generator.init();
            const waveStartCall = mockOn.mock.calls.find(
                (call) => call[0] === GameEventType.WAVE_STARTED
            );
            const handler = waveStartCall![1];

            generator.update(10);

            // Act
            handler({ waveNumber: 1 });
            mockEmit.mockClear();

            // Advance only 3 seconds (within 5s cooldown)
            generator.update(3);
            handler({ waveNumber: 2 });

            // Assert
            expect(mockEmit).not.toHaveBeenCalled();
        });
    });

    // ==========================================================================
    // Periodic messages
    // ==========================================================================

    describe('periodic messages', () => {
        it('should generate periodic messages after timer elapses', () => {
            // Arrange
            generator.init();

            // Act - advance past maximum periodic interval (15s) + initial cooldown
            generator.update(20);

            // Assert - should have emitted at least one periodic message
            expect(mockEmit).toHaveBeenCalledWith(
                GameEventType.TECHNOBABBLE_MESSAGE,
                expect.objectContaining({ message: expect.any(String) })
            );
        });

        it('should generate periodic messages between 8-15 second intervals', () => {
            // Arrange
            generator.init();

            // We need the cooldown (5s) elapsed first, then the periodic timer
            // Min periodic: 8s, max: 15s
            // After 7s total, no periodic message yet (cooldown might block anyway)
            generator.update(7);
            const emitCountAt7 = mockEmit.mock.calls.filter(
                (call) => call[0] === GameEventType.TECHNOBABBLE_MESSAGE
            ).length;

            // After 16s more, periodic should have fired at least once
            generator.update(16);
            const emitCountAt23 = mockEmit.mock.calls.filter(
                (call) => call[0] === GameEventType.TECHNOBABBLE_MESSAGE
            ).length;

            // Assert
            expect(emitCountAt23).toBeGreaterThan(emitCountAt7);
        });
    });

    // ==========================================================================
    // Inactive state
    // ==========================================================================

    describe('inactive state', () => {
        it('should not generate messages when not initialized', () => {
            // Arrange - not calling init()

            // Act
            generator.update(20);

            // Assert
            expect(mockEmit).not.toHaveBeenCalled();
        });

        it('should not generate messages after destroy', () => {
            // Arrange
            generator.init();
            generator.destroy();
            mockEmit.mockClear();

            // Act
            generator.update(20);

            // Assert
            expect(mockEmit).not.toHaveBeenCalled();
        });
    });
});
