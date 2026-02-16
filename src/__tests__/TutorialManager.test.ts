/**
 * Tests for TutorialManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const STORAGE_KEY = 'km_tutorial_complete';

// Create a proper localStorage mock
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    get length() {
      return Object.keys(store).length;
    },
  };
};

const localStorageMock = createLocalStorageMock();
vi.stubGlobal('localStorage', localStorageMock);

// Capture event handlers
type HandlerMap = Record<string, ((payload: unknown) => void)[]>;
let eventHandlers: HandlerMap = {};
let emittedEvents: Array<{ event: string; payload: unknown }> = [];

vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      on: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (!eventHandlers[event]) {
          eventHandlers[event] = [];
        }
        eventHandlers[event].push(handler);
      }),
      off: vi.fn((event: string, handler: (payload: unknown) => void) => {
        if (eventHandlers[event]) {
          eventHandlers[event] = eventHandlers[event].filter(
            (h) => h !== handler
          );
        }
      }),
      emit: vi.fn((event: string, payload: unknown) => {
        emittedEvents.push({ event, payload });
        // Also call registered handlers for the event
        if (eventHandlers[event]) {
          for (const handler of eventHandlers[event]) {
            handler(payload);
          }
        }
      }),
    }),
  },
}));

import { TutorialManager } from '../game/TutorialManager';
import { GameEventType } from '../types/events';

describe('TutorialManager', () => {
  let manager: TutorialManager;

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
    eventHandlers = {};
    emittedEvents = [];
    manager = new TutorialManager();
    manager.init();
  });

  afterEach(() => {
    manager.destroy();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('shouldShowTutorial', () => {
    it('should show tutorial for first-time players', () => {
      // Arrange - localStorage has no tutorial key (fresh player)

      // Act & Assert
      expect(manager.shouldShowTutorial()).toBe(true);
    });

    it('should skip tutorial when localStorage flag is set', () => {
      // Arrange
      localStorageMock.setItem(STORAGE_KEY, 'true');

      // Act
      const freshManager = new TutorialManager();

      // Assert
      expect(freshManager.shouldShowTutorial()).toBe(false);

      freshManager.destroy();
    });
  });

  describe('start', () => {
    it('should activate the tutorial', () => {
      // Arrange & Act
      manager.start();

      // Assert
      expect(manager.isActive()).toBe(true);
    });

    it('should not activate if already completed', () => {
      // Arrange
      localStorageMock.setItem(STORAGE_KEY, 'true');
      const completedManager = new TutorialManager();
      completedManager.init();

      // Act
      completedManager.start();

      // Assert
      expect(completedManager.isActive()).toBe(false);

      completedManager.destroy();
    });
  });

  describe('wave event progression', () => {
    it('should trigger first step on wave 1 after delay', () => {
      // Arrange
      manager.start();

      // Act - simulate wave 1 started
      const waveHandler = eventHandlers[GameEventType.WAVE_STARTED]?.[0];
      expect(waveHandler).toBeDefined();
      waveHandler!({ waveNumber: 1 });

      // The first step has a delay, so it should not have emitted yet
      const tutorialStepEvents = emittedEvents.filter(
        (e) => e.event === GameEventType.TUTORIAL_STEP
      );
      expect(tutorialStepEvents.length).toBe(0);

      // Advance past the initial delay (1.0 second)
      manager.update(1.1);

      // Now the step should have been emitted
      const afterDelayEvents = emittedEvents.filter(
        (e) => e.event === GameEventType.TUTORIAL_STEP
      );
      expect(afterDelayEvents.length).toBe(1);
    });

    it('should progress through steps on wave events', () => {
      // Arrange
      manager.start();
      const waveHandler = eventHandlers[GameEventType.WAVE_STARTED]?.[0];
      expect(waveHandler).toBeDefined();

      // Act - Wave 1: triggers step 0
      waveHandler!({ waveNumber: 1 });
      manager.update(1.1); // Past initial delay
      expect(manager.getCurrentStep()?.id).toBe(0);

      // Advance past step 0 duration (8 seconds)
      manager.update(8.1);

      // Step 0 expired, should trigger step 1 after brief delay (same wave)
      manager.update(0.6);
      expect(manager.getCurrentStep()?.id).toBe(1);

      // Advance past step 1 duration (6 seconds)
      manager.update(6.1);

      // Step 1 expired, step 2 is wave 2, so wait for wave event
      expect(manager.getCurrentStep()).toBeNull();

      // Wave 2 triggers step 2
      waveHandler!({ waveNumber: 2 });
      expect(manager.getCurrentStep()?.id).toBe(2);
    });

    it('should complete after last step on wave 3', () => {
      // Arrange
      manager.start();
      const waveHandler = eventHandlers[GameEventType.WAVE_STARTED]?.[0];
      expect(waveHandler).toBeDefined();

      // Fast-forward through all steps
      // Wave 1 -> step 0
      waveHandler!({ waveNumber: 1 });
      manager.update(1.1); // initial delay
      manager.update(8.1); // step 0 duration
      manager.update(0.6); // inter-step delay
      manager.update(6.1); // step 1 duration

      // Wave 2 -> step 2
      waveHandler!({ waveNumber: 2 });
      manager.update(6.1); // step 2 duration

      // Wave 3 -> step 3
      waveHandler!({ waveNumber: 3 });
      manager.update(6.1); // step 3 duration

      // Should be completed
      expect(manager.isActive()).toBe(false);

      // Should have emitted TUTORIAL_COMPLETE
      const completeEvents = emittedEvents.filter(
        (e) => e.event === GameEventType.TUTORIAL_COMPLETE
      );
      expect(completeEvents.length).toBe(1);
      expect(
        (completeEvents[0].payload as { skipped: boolean }).skipped
      ).toBe(false);
    });
  });

  describe('step timing', () => {
    it('should respect step duration before advancing', () => {
      // Arrange
      manager.start();
      const waveHandler = eventHandlers[GameEventType.WAVE_STARTED]?.[0];
      waveHandler!({ waveNumber: 1 });
      manager.update(1.1); // past initial delay

      // Assert step is showing
      expect(manager.getCurrentStep()?.id).toBe(0);

      // Act - update with partial time (less than 8 second duration)
      manager.update(4.0);

      // Assert - still on step 0
      expect(manager.getCurrentStep()?.id).toBe(0);

      // Act - update past remaining duration
      manager.update(4.5);

      // Assert - step 0 expired, but next step is pending (delay)
      expect(manager.getCurrentStep()).toBeNull();
    });
  });

  describe('complete', () => {
    it('should persist completion to localStorage', () => {
      // Arrange
      manager.start();

      // Act
      manager.complete();

      // Assert
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        'true'
      );
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('skip', () => {
    it('should mark as complete and persist', () => {
      // Arrange
      manager.start();

      // Act
      manager.skip();

      // Assert
      expect(manager.isActive()).toBe(false);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        'true'
      );

      // Should have emitted TUTORIAL_COMPLETE with skipped=true
      const completeEvents = emittedEvents.filter(
        (e) => e.event === GameEventType.TUTORIAL_COMPLETE
      );
      expect(completeEvents.length).toBe(1);
      expect(
        (completeEvents[0].payload as { skipped: boolean }).skipped
      ).toBe(true);
    });

    it('should not show tutorial after skip on new instance', () => {
      // Arrange
      manager.start();
      manager.skip();

      // Act
      const newManager = new TutorialManager();

      // Assert
      expect(newManager.shouldShowTutorial()).toBe(false);

      newManager.destroy();
    });
  });

  describe('reset', () => {
    it('should clear completion state and remove localStorage key', () => {
      // Arrange
      manager.start();
      manager.complete();

      // Act
      manager.reset();

      // Assert
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(STORAGE_KEY);
      expect(manager.shouldShowTutorial()).toBe(true);
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('event subscription', () => {
    it('should subscribe to WAVE_STARTED on init', () => {
      // Assert
      expect(eventHandlers[GameEventType.WAVE_STARTED]).toBeDefined();
      expect(eventHandlers[GameEventType.WAVE_STARTED].length).toBeGreaterThan(
        0
      );
    });

    it('should unsubscribe from WAVE_STARTED on destroy', () => {
      // Arrange
      const initialHandlerCount =
        eventHandlers[GameEventType.WAVE_STARTED]?.length ?? 0;

      // Act
      manager.destroy();

      // Assert - handler should have been removed
      const currentCount =
        eventHandlers[GameEventType.WAVE_STARTED]?.length ?? 0;
      expect(currentCount).toBeLessThan(initialHandlerCount);
    });
  });

  describe('inactive state', () => {
    it('should not respond to wave events when not active', () => {
      // Arrange - manager is initialized but not started

      // Act
      const waveHandler = eventHandlers[GameEventType.WAVE_STARTED]?.[0];
      waveHandler!({ waveNumber: 1 });
      manager.update(2.0);

      // Assert - no tutorial step events emitted
      const tutorialStepEvents = emittedEvents.filter(
        (e) => e.event === GameEventType.TUTORIAL_STEP
      );
      expect(tutorialStepEvents.length).toBe(0);
    });

    it('should return null for getCurrentStep when not active', () => {
      expect(manager.getCurrentStep()).toBeNull();
    });
  });

  describe('localStorage error handling', () => {
    it('should handle localStorage getItem failure gracefully', () => {
      // Arrange
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      // Act & Assert - should not throw
      expect(() => new TutorialManager()).not.toThrow();
    });

    it('should handle localStorage setItem failure gracefully', () => {
      // Arrange
      manager.start();
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new Error('Storage full');
      });

      // Act & Assert - should not throw
      expect(() => manager.complete()).not.toThrow();
    });
  });
});
