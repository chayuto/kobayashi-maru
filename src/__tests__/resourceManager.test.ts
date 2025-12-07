/**
 * Tests for Resource Manager
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ResourceManager } from '../game/resourceManager';
import { GAME_CONFIG } from '../types/constants';
import { EventBus } from '../core/EventBus';
import { GameEventType } from '../types/events';

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
    // Reset EventBus to ensure clean state between tests
    EventBus.resetInstance();
    resourceManager = new ResourceManager();
  });

  describe('initialization', () => {
    it('should initialize with default resources', () => {
      expect(resourceManager.getResources()).toBe(GAME_CONFIG.INITIAL_RESOURCES);
    });

    it('should initialize with custom resources', () => {
      const customManager = new ResourceManager(1000);
      expect(customManager.getResources()).toBe(1000);
    });
  });

  describe('resource management', () => {
    it('should add resources', () => {
      const initial = resourceManager.getResources();
      resourceManager.addResources(100);
      expect(resourceManager.getResources()).toBe(initial + 100);
    });

    it('should not add negative resources', () => {
      const initial = resourceManager.getResources();
      resourceManager.addResources(-100);
      expect(resourceManager.getResources()).toBe(initial);
    });

    it('should spend resources when sufficient funds available', () => {
      resourceManager.setResources(500);
      const result = resourceManager.spendResources(200);
      expect(result).toBe(true);
      expect(resourceManager.getResources()).toBe(300);
    });

    it('should not spend resources when insufficient funds', () => {
      resourceManager.setResources(100);
      const result = resourceManager.spendResources(200);
      expect(result).toBe(false);
      expect(resourceManager.getResources()).toBe(100);
    });

    it('should allow spending exact amount', () => {
      resourceManager.setResources(100);
      const result = resourceManager.spendResources(100);
      expect(result).toBe(true);
      expect(resourceManager.getResources()).toBe(0);
    });

    it('should set resources to specific amount', () => {
      resourceManager.setResources(999);
      expect(resourceManager.getResources()).toBe(999);
    });

    it('should not allow negative resources', () => {
      resourceManager.setResources(-100);
      expect(resourceManager.getResources()).toBe(0);
    });
  });

  describe('canAfford', () => {
    it('should return true when can afford', () => {
      resourceManager.setResources(500);
      expect(resourceManager.canAfford(200)).toBe(true);
    });

    it('should return true for exact amount', () => {
      resourceManager.setResources(500);
      expect(resourceManager.canAfford(500)).toBe(true);
    });

    it('should return false when cannot afford', () => {
      resourceManager.setResources(100);
      expect(resourceManager.canAfford(500)).toBe(false);
    });
  });


  describe('reset', () => {
    it('should reset to initial resources', () => {
      resourceManager.setResources(1000);
      resourceManager.reset();
      expect(resourceManager.getResources()).toBe(GAME_CONFIG.INITIAL_RESOURCES);
    });
  });

  describe('EventBus integration', () => {
    it('should emit RESOURCE_UPDATED event when resources change', () => {
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();

      eventBus.on(GameEventType.RESOURCE_UPDATED, eventHandler);

      resourceManager.addResources(50);

      expect(eventHandler).toHaveBeenCalledWith({
        current: GAME_CONFIG.INITIAL_RESOURCES + 50,
        amount: 50
      });
    });

    it('should emit RESOURCE_UPDATED event when spending resources', () => {
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();

      eventBus.on(GameEventType.RESOURCE_UPDATED, eventHandler);

      resourceManager.spendResources(100);

      expect(eventHandler).toHaveBeenCalledWith({
        current: GAME_CONFIG.INITIAL_RESOURCES - 100,
        amount: -100
      });
    });

    it('should emit RESOURCE_UPDATED event when setting resources', () => {
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();

      eventBus.on(GameEventType.RESOURCE_UPDATED, eventHandler);

      resourceManager.setResources(1000);

      expect(eventHandler).toHaveBeenCalledWith({
        current: 1000,
        amount: 1000 - GAME_CONFIG.INITIAL_RESOURCES
      });
    });

    it('should emit RESOURCE_UPDATED event on reset', () => {
      const eventBus = EventBus.getInstance();
      const eventHandler = vi.fn();

      resourceManager.setResources(1000);

      eventBus.on(GameEventType.RESOURCE_UPDATED, eventHandler);
      resourceManager.reset();

      expect(eventHandler).toHaveBeenCalledWith({
        current: GAME_CONFIG.INITIAL_RESOURCES,
        amount: GAME_CONFIG.INITIAL_RESOURCES - 1000
      });
    });
  });
});
