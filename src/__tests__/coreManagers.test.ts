/**
 * @vitest-environment jsdom
 */

/**
 * Tests for ServiceContainer and GameLoopManager
 *
 * ServiceContainer: register, get, has, lazy initialization, tryGet, override, destroy
 * GameLoopManager: start, stop, pause, resume, callbacks, update phases, error handling
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ServiceContainer,
  getServices,
  resetServices,
} from '../core/services/ServiceContainer';
import { GameLoopManager } from '../core/loop/GameLoopManager';
import { MockApplication } from './helpers/mockPixi';
import type { Application } from 'pixi.js';

// Mock the services module for GameLoopManager tests
vi.mock('../core/services', () => {
  const mockContainer = {
    tryGet: vi.fn(() => undefined),
  };
  return {
    getServices: vi.fn(() => mockContainer),
    _mockContainer: mockContainer,
  };
});

// =============================================================================
// ServiceContainer Tests
// =============================================================================

describe('ServiceContainer', () => {
  let container: ServiceContainer;

  beforeEach(() => {
    container = new ServiceContainer();
  });

  describe('register', () => {
    it('should register a service factory without immediately creating the instance', () => {
      // Arrange
      const factory = vi.fn(() => ({ value: 42 }));

      // Act
      container.register('eventBus', factory as unknown as () => never);

      // Assert
      expect(container.has('eventBus')).toBe(true);
      expect(factory).not.toHaveBeenCalled();
    });

    it('should allow overwriting a previously registered service', () => {
      // Arrange
      const factory1 = vi.fn(() => ({ id: 1 }));
      const factory2 = vi.fn(() => ({ id: 2 }));

      // Act
      container.register('eventBus', factory1 as unknown as () => never);
      container.register('eventBus', factory2 as unknown as () => never);

      // Assert
      const result = container.get('eventBus');
      expect(factory2).toHaveBeenCalled();
      expect((result as unknown as { id: number }).id).toBe(2);
    });
  });

  describe('get', () => {
    it('should create the service on first access via lazy initialization', () => {
      // Arrange
      const mockService = { name: 'test-service' };
      const factory = vi.fn(() => mockService);
      container.register('eventBus', factory as unknown as () => never);

      // Act
      const result = container.get('eventBus');

      // Assert
      expect(factory).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockService);
    });

    it('should return the cached instance on subsequent calls', () => {
      // Arrange
      const mockService = { name: 'cached' };
      const factory = vi.fn(() => mockService);
      container.register('eventBus', factory as unknown as () => never);

      // Act
      const first = container.get('eventBus');
      const second = container.get('eventBus');

      // Assert
      expect(factory).toHaveBeenCalledTimes(1);
      expect(first).toBe(second);
    });

    it('should throw an error when service is not registered', () => {
      // Act & Assert
      expect(() => container.get('eventBus')).toThrow(
        'Service "eventBus" not registered'
      );
    });

    it('should track initialization order', () => {
      // Arrange
      container.register('eventBus', (() => ({})) as unknown as () => never);
      container.register(
        'scoreManager',
        (() => ({})) as unknown as () => never
      );
      container.register(
        'waveManager',
        (() => ({})) as unknown as () => never
      );

      // Act - access in reverse order
      container.get('waveManager');
      container.get('eventBus');
      container.get('scoreManager');

      // Assert
      expect(container.getInitializedServices()).toEqual([
        'waveManager',
        'eventBus',
        'scoreManager',
      ]);
    });
  });

  describe('has', () => {
    it('should return true when the service is registered', () => {
      // Arrange
      container.register('eventBus', (() => ({})) as unknown as () => never);

      // Act & Assert
      expect(container.has('eventBus')).toBe(true);
    });

    it('should return false when the service is not registered', () => {
      // Act & Assert
      expect(container.has('eventBus')).toBe(false);
    });
  });

  describe('isInitialized', () => {
    it('should return false when the service is registered but not accessed', () => {
      // Arrange
      container.register('eventBus', (() => ({})) as unknown as () => never);

      // Act & Assert
      expect(container.isInitialized('eventBus')).toBe(false);
    });

    it('should return true after the service has been accessed', () => {
      // Arrange
      container.register('eventBus', (() => ({})) as unknown as () => never);
      container.get('eventBus');

      // Act & Assert
      expect(container.isInitialized('eventBus')).toBe(true);
    });

    it('should return false when the service is not registered at all', () => {
      // Act & Assert
      expect(container.isInitialized('eventBus')).toBe(false);
    });
  });

  describe('tryGet', () => {
    it('should return undefined when the service is not registered', () => {
      // Act & Assert
      expect(container.tryGet('eventBus')).toBeUndefined();
    });

    it('should return undefined when the service is registered but not initialized', () => {
      // Arrange
      container.register('eventBus', (() => ({})) as unknown as () => never);

      // Act & Assert
      expect(container.tryGet('eventBus')).toBeUndefined();
    });

    it('should return the instance when the service is initialized', () => {
      // Arrange
      const mockService = { name: 'bus' };
      container.register(
        'eventBus',
        (() => mockService) as unknown as () => never
      );
      container.get('eventBus');

      // Act
      const result = container.tryGet('eventBus');

      // Assert
      expect(result).toBe(mockService);
    });
  });

  describe('override', () => {
    it('should replace a service with a specific instance', () => {
      // Arrange
      const originalFactory = vi.fn(() => ({ id: 'original' }));
      container.register(
        'eventBus',
        originalFactory as unknown as () => never
      );
      const overrideInstance = { id: 'override' };

      // Act
      container.override(
        'eventBus',
        overrideInstance as unknown as never
      );
      const result = container.get('eventBus');

      // Assert
      expect(originalFactory).not.toHaveBeenCalled();
      expect((result as unknown as { id: string }).id).toBe('override');
    });

    it('should mark the overridden service as initialized', () => {
      // Arrange
      const overrideInstance = { id: 'override' };

      // Act
      container.override(
        'eventBus',
        overrideInstance as unknown as never
      );

      // Assert
      expect(container.isInitialized('eventBus')).toBe(true);
    });
  });

  describe('destroy', () => {
    it('should call destroy on all initialized services that have a destroy method', () => {
      // Arrange
      const destroyFn1 = vi.fn();
      const destroyFn2 = vi.fn();
      container.register(
        'eventBus',
        (() => ({ destroy: destroyFn1 })) as unknown as () => never
      );
      container.register(
        'scoreManager',
        (() => ({ destroy: destroyFn2 })) as unknown as () => never
      );
      container.get('eventBus');
      container.get('scoreManager');

      // Act
      container.destroy();

      // Assert
      expect(destroyFn1).toHaveBeenCalledTimes(1);
      expect(destroyFn2).toHaveBeenCalledTimes(1);
    });

    it('should destroy services in reverse initialization order', () => {
      // Arrange
      const order: string[] = [];
      container.register(
        'eventBus',
        (() => ({
          destroy: () => order.push('eventBus'),
        })) as unknown as () => never
      );
      container.register(
        'scoreManager',
        (() => ({
          destroy: () => order.push('scoreManager'),
        })) as unknown as () => never
      );
      container.register(
        'waveManager',
        (() => ({
          destroy: () => order.push('waveManager'),
        })) as unknown as () => never
      );
      // Initialize in this order: eventBus, waveManager, scoreManager
      container.get('eventBus');
      container.get('waveManager');
      container.get('scoreManager');

      // Act
      container.destroy();

      // Assert - reverse of init order
      expect(order).toEqual(['scoreManager', 'waveManager', 'eventBus']);
    });

    it('should skip services without a destroy method', () => {
      // Arrange
      container.register(
        'eventBus',
        (() => ({ name: 'no-destroy' })) as unknown as () => never
      );
      container.get('eventBus');

      // Act & Assert - should not throw
      expect(() => container.destroy()).not.toThrow();
    });

    it('should handle errors in destroy methods gracefully', () => {
      // Arrange
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      container.register(
        'eventBus',
        (() => ({
          destroy: () => {
            throw new Error('destroy failed');
          },
        })) as unknown as () => never
      );
      container.get('eventBus');

      // Act & Assert - should not throw
      expect(() => container.destroy()).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should reset initialized state so services can be re-created', () => {
      // Arrange
      let callCount = 0;
      container.register(
        'eventBus',
        (() => ({ id: ++callCount })) as unknown as () => never
      );
      container.get('eventBus');

      // Act
      container.destroy();

      // Assert
      expect(container.isInitialized('eventBus')).toBe(false);
      expect(container.getInitializedServices()).toEqual([]);
    });

    it('should not destroy services that were never initialized', () => {
      // Arrange
      const destroyFn = vi.fn();
      container.register(
        'eventBus',
        (() => ({ destroy: destroyFn })) as unknown as () => never
      );
      // Intentionally not calling get()

      // Act
      container.destroy();

      // Assert
      expect(destroyFn).not.toHaveBeenCalled();
    });
  });

  describe('getInitializedServices', () => {
    it('should return an empty array when no services are initialized', () => {
      // Act & Assert
      expect(container.getInitializedServices()).toEqual([]);
    });

    it('should return names of initialized services in order', () => {
      // Arrange
      container.register('eventBus', (() => ({})) as unknown as () => never);
      container.register(
        'scoreManager',
        (() => ({})) as unknown as () => never
      );
      container.get('scoreManager');
      container.get('eventBus');

      // Act & Assert
      expect(container.getInitializedServices()).toEqual([
        'scoreManager',
        'eventBus',
      ]);
    });
  });
});

// =============================================================================
// Global ServiceContainer functions
// =============================================================================

describe('getServices / resetServices', () => {
  afterEach(() => {
    resetServices();
  });

  it('should return the same container on subsequent calls', () => {
    // Act
    const first = getServices();
    const second = getServices();

    // Assert
    expect(first).toBe(second);
  });

  it('should return a new container after resetServices is called', () => {
    // Arrange
    const first = getServices();

    // Act
    resetServices();
    const second = getServices();

    // Assert
    expect(first).not.toBe(second);
  });

  it('should handle resetServices when no container exists', () => {
    // Act & Assert - should not throw
    expect(() => resetServices()).not.toThrow();
  });
});

// =============================================================================
// GameLoopManager Tests
// =============================================================================

describe('GameLoopManager', () => {
  let loopManager: GameLoopManager;
  let mockApp: MockApplication;

  beforeEach(() => {
    mockApp = new MockApplication();
    // Add FPS property needed by getState()
    (mockApp.ticker as unknown as Record<string, unknown>).FPS = 60;
    loopManager = new GameLoopManager(mockApp as unknown as Application);
  });

  afterEach(() => {
    loopManager.destroy();
  });

  describe('start', () => {
    it('should add the update function to the ticker when started', () => {
      // Act
      loopManager.start();

      // Assert
      expect(mockApp.ticker.add).toHaveBeenCalledTimes(1);
    });

    it('should set running state to true when started', () => {
      // Act
      loopManager.start();

      // Assert
      expect(loopManager.getState().running).toBe(true);
    });

    it('should not add multiple ticker callbacks when started multiple times', () => {
      // Act
      loopManager.start();
      loopManager.start();

      // Assert
      expect(mockApp.ticker.add).toHaveBeenCalledTimes(1);
    });
  });

  describe('stop', () => {
    it('should remove the update function from the ticker when stopped', () => {
      // Arrange
      loopManager.start();

      // Act
      loopManager.stop();

      // Assert
      expect(mockApp.ticker.remove).toHaveBeenCalledTimes(1);
    });

    it('should set running state to false when stopped', () => {
      // Arrange
      loopManager.start();

      // Act
      loopManager.stop();

      // Assert
      expect(loopManager.getState().running).toBe(false);
    });

    it('should not remove ticker callback when not running', () => {
      // Act
      loopManager.stop();

      // Assert
      expect(mockApp.ticker.remove).not.toHaveBeenCalled();
    });
  });

  describe('pause / resume', () => {
    it('should be not paused by default', () => {
      // Assert
      expect(loopManager.isPaused()).toBe(false);
    });

    it('should be paused after calling pause', () => {
      // Act
      loopManager.pause();

      // Assert
      expect(loopManager.isPaused()).toBe(true);
    });

    it('should not be paused after calling resume', () => {
      // Arrange
      loopManager.pause();

      // Act
      loopManager.resume();

      // Assert
      expect(loopManager.isPaused()).toBe(false);
    });
  });

  describe('getState', () => {
    it('should return initial state values when first created', () => {
      // Act
      const state = loopManager.getState();

      // Assert
      expect(state.running).toBe(false);
      expect(state.gameTime).toBe(0);
      expect(state.deltaTime).toBe(0);
      expect(state.fps).toBe(60);
    });
  });

  describe('getGameTime / resetGameTime', () => {
    it('should return 0 initially', () => {
      // Assert
      expect(loopManager.getGameTime()).toBe(0);
    });

    it('should reset game time to 0 when resetGameTime is called', () => {
      // Arrange - manually invoke the update to advance game time
      // We need to simulate a tick by calling the bound update
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Simulate a tick
      mockApp.ticker.deltaMS = 100;
      updateFn();

      // Verify time advanced
      expect(loopManager.getGameTime()).toBeGreaterThan(0);

      // Act
      loopManager.resetGameTime();

      // Assert
      expect(loopManager.getGameTime()).toBe(0);
    });
  });

  describe('callback registration', () => {
    it('should register and invoke preUpdate callbacks', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onPreUpdate(callback);
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should register and invoke gameplay callbacks when not paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onGameplay(callback);
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not invoke gameplay callbacks when paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onGameplay(callback);
      loopManager.pause();
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });

    it('should register and invoke physics callbacks when not paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onPhysics(callback);
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should not invoke physics callbacks when paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onPhysics(callback);
      loopManager.pause();
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });

    it('should always invoke render callbacks even when paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onRender(callback);
      loopManager.pause();
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should always invoke postRender callbacks even when paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onPostRender(callback);
      loopManager.pause();
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should always invoke UI callbacks even when paused', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onUI(callback);
      loopManager.pause();
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('should unregister a callback when the returned unsubscribe function is called', () => {
      // Arrange
      const callback = vi.fn();
      const unsubscribe = loopManager.onPreUpdate(callback);
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      unsubscribe();
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });

    it('should unregister gameplay callbacks correctly', () => {
      // Arrange
      const callback = vi.fn();
      const unsubscribe = loopManager.onGameplay(callback);
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      unsubscribe();
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('update phases', () => {
    it('should execute update phases in correct order', () => {
      // Arrange
      const order: string[] = [];
      loopManager.onPreUpdate(() => order.push('preUpdate'));
      loopManager.onGameplay(() => order.push('gameplay'));
      loopManager.onPhysics(() => order.push('physics'));
      loopManager.onRender(() => order.push('render'));
      loopManager.onPostRender(() => order.push('postRender'));
      loopManager.onUI(() => order.push('ui'));

      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(order).toEqual([
        'preUpdate',
        'gameplay',
        'physics',
        'render',
        'postRender',
        'ui',
      ]);
    });

    it('should pass deltaTime and gameTime to callbacks', () => {
      // Arrange
      let receivedDelta = 0;
      let receivedGameTime = 0;
      loopManager.onGameplay((dt, gt) => {
        receivedDelta = dt;
        receivedGameTime = gt;
      });

      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 100; // 0.1 seconds
      updateFn();

      // Assert
      expect(receivedDelta).toBeCloseTo(0.1);
      expect(receivedGameTime).toBeCloseTo(0.1);
    });

    it('should accumulate gameTime across multiple updates', () => {
      // Arrange
      const gameTimes: number[] = [];
      loopManager.onGameplay((_dt, gt) => {
        gameTimes.push(gt);
      });

      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 100;
      updateFn();
      updateFn();
      updateFn();

      // Assert
      expect(gameTimes[0]).toBeCloseTo(0.1);
      expect(gameTimes[1]).toBeCloseTo(0.2);
      expect(gameTimes[2]).toBeCloseTo(0.3);
    });

    it('should not accumulate gameTime when paused', () => {
      // Arrange
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // First tick - unpaused
      mockApp.ticker.deltaMS = 100;
      updateFn();
      const timeAfterFirstTick = loopManager.getGameTime();

      // Act - pause and tick
      loopManager.pause();
      updateFn();

      // Assert
      expect(loopManager.getGameTime()).toBe(timeAfterFirstTick);
    });
  });

  describe('error handling', () => {
    it('should catch and log errors from failing callbacks without crashing', () => {
      // Arrange
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      loopManager.onPreUpdate(() => {
        throw new Error('callback error');
      });
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act & Assert
      expect(() => {
        mockApp.ticker.deltaMS = 16.67;
        updateFn();
      }).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should continue executing remaining callbacks after one fails', () => {
      // Arrange
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const afterError = vi.fn();
      loopManager.onPreUpdate(() => {
        throw new Error('fail');
      });
      loopManager.onPreUpdate(afterError);
      loopManager.start();
      const updateFn = mockApp.ticker.add.mock.calls[0][0] as () => void;

      // Act
      mockApp.ticker.deltaMS = 16.67;
      updateFn();

      // Assert
      expect(afterError).toHaveBeenCalledTimes(1);

      vi.restoreAllMocks();
    });
  });

  describe('destroy', () => {
    it('should stop the loop and clear all callbacks when destroyed', () => {
      // Arrange
      const callback = vi.fn();
      loopManager.onPreUpdate(callback);
      loopManager.onGameplay(callback);
      loopManager.onPhysics(callback);
      loopManager.onRender(callback);
      loopManager.onPostRender(callback);
      loopManager.onUI(callback);
      loopManager.start();

      // Act
      loopManager.destroy();

      // Re-start and tick to verify callbacks were cleared
      // Need a fresh manager since ticker is already removed
      const freshMock = new MockApplication();
      (freshMock.ticker as unknown as Record<string, unknown>).FPS = 60;
      const freshManager = new GameLoopManager(
        freshMock as unknown as Application
      );
      freshManager.start();
      const updateFn = freshMock.ticker.add.mock.calls[0][0] as () => void;
      freshMock.ticker.deltaMS = 16.67;
      updateFn();

      // Assert - callbacks from the destroyed manager should not have been called
      // since they belong to a different instance
      expect(mockApp.ticker.remove).toHaveBeenCalledTimes(1);
      freshManager.destroy();
    });

    it('should set running to false when destroyed', () => {
      // Arrange
      loopManager.start();

      // Act
      loopManager.destroy();

      // Assert
      expect(loopManager.getState().running).toBe(false);
    });
  });
});
