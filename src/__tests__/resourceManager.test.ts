/**
 * Tests for Resource Manager
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { ResourceManager, ResourceEvent } from '../game/resourceManager';
import { GAME_CONFIG } from '../types/constants';

describe('ResourceManager', () => {
  let resourceManager: ResourceManager;

  beforeEach(() => {
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

  describe('events', () => {
    it('should emit change event when adding resources', () => {
      let eventReceived = false;
      let eventData: ResourceEvent | undefined;

      resourceManager.setResources(500);
      resourceManager.on('change', (event) => {
        eventReceived = true;
        eventData = event;
      });

      resourceManager.addResources(100);
      expect(eventReceived).toBe(true);
      expect(eventData!.current).toBe(600);
      expect(eventData!.previous).toBe(500);
    });

    it('should emit change event when spending resources', () => {
      let eventReceived = false;
      resourceManager.setResources(500);
      resourceManager.on('change', () => {
        eventReceived = true;
      });

      resourceManager.spendResources(100);
      expect(eventReceived).toBe(true);
    });

    it('should emit insufficient event when trying to spend too much', () => {
      let eventReceived = false;
      resourceManager.setResources(100);
      resourceManager.on('insufficient', () => {
        eventReceived = true;
      });

      resourceManager.spendResources(500);
      expect(eventReceived).toBe(true);
    });

    it('should remove event listeners', () => {
      let count = 0;
      const listener = () => { count++; };

      resourceManager.on('change', listener);
      resourceManager.setResources(100);
      expect(count).toBe(1);

      resourceManager.off('change', listener);
      resourceManager.setResources(200);
      expect(count).toBe(1);
    });
  });

  describe('reset', () => {
    it('should reset to initial resources', () => {
      resourceManager.setResources(1000);
      resourceManager.reset();
      expect(resourceManager.getResources()).toBe(GAME_CONFIG.INITIAL_RESOURCES);
    });
  });
});
