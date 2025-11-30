/**
 * Tests for System Manager
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createWorld, IWorld } from 'bitecs';
import { SystemManager } from '../systems/SystemManager';

describe('SystemManager', () => {
  let systemManager: SystemManager;
  let world: IWorld;

  beforeEach(() => {
    systemManager = new SystemManager();
    world = createWorld();
  });

  describe('registration', () => {
    it('should register a system with a name and priority', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      systemManager.register('testSystem', mockSystem, 10);
      
      const names = systemManager.getSystemNames();
      expect(names).toContain('testSystem');
    });

    it('should warn when registering a system with duplicate name', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockSystem1 = vi.fn((w: IWorld) => w);
      const mockSystem2 = vi.fn((w: IWorld) => w);
      
      systemManager.register('duplicateSystem', mockSystem1, 10);
      systemManager.register('duplicateSystem', mockSystem2, 20);
      
      expect(consoleSpy).toHaveBeenCalledWith('System "duplicateSystem" is already registered. Overwriting.');
      consoleSpy.mockRestore();
    });

    it('should unregister a system by name', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      systemManager.register('testSystem', mockSystem, 10);
      
      const result = systemManager.unregister('testSystem');
      expect(result).toBe(true);
      
      const names = systemManager.getSystemNames();
      expect(names).not.toContain('testSystem');
    });

    it('should return false when unregistering non-existent system', () => {
      const result = systemManager.unregister('nonExistent');
      expect(result).toBe(false);
    });
  });

  describe('priority ordering', () => {
    it('should run systems in priority order (lower first)', () => {
      const executionOrder: string[] = [];
      
      const systemA = vi.fn((w: IWorld) => { executionOrder.push('A'); return w; });
      const systemB = vi.fn((w: IWorld) => { executionOrder.push('B'); return w; });
      const systemC = vi.fn((w: IWorld) => { executionOrder.push('C'); return w; });
      
      // Register in random order
      systemManager.register('systemB', systemB, 20);
      systemManager.register('systemA', systemA, 10);
      systemManager.register('systemC', systemC, 30);
      
      systemManager.run(world, 0.016);
      
      expect(executionOrder).toEqual(['A', 'B', 'C']);
    });

    it('should update priority and re-sort', () => {
      const executionOrder: string[] = [];
      
      const systemA = vi.fn((w: IWorld) => { executionOrder.push('A'); return w; });
      const systemB = vi.fn((w: IWorld) => { executionOrder.push('B'); return w; });
      
      systemManager.register('systemA', systemA, 10);
      systemManager.register('systemB', systemB, 20);
      
      // Run once to verify initial order
      systemManager.run(world, 0.016);
      expect(executionOrder).toEqual(['A', 'B']);
      
      // Change priority
      executionOrder.length = 0;
      systemManager.setPriority('systemB', 5);
      
      systemManager.run(world, 0.016);
      expect(executionOrder).toEqual(['B', 'A']);
    });
  });

  describe('enable/disable', () => {
    it('should not run disabled systems', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      systemManager.register('testSystem', mockSystem, 10);
      
      systemManager.setEnabled('testSystem', false);
      systemManager.run(world, 0.016);
      
      expect(mockSystem).not.toHaveBeenCalled();
    });

    it('should run re-enabled systems', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      systemManager.register('testSystem', mockSystem, 10);
      
      systemManager.setEnabled('testSystem', false);
      systemManager.setEnabled('testSystem', true);
      systemManager.run(world, 0.016);
      
      expect(mockSystem).toHaveBeenCalled();
    });

    it('should correctly report enabled status', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      systemManager.register('testSystem', mockSystem, 10);
      
      expect(systemManager.isEnabled('testSystem')).toBe(true);
      
      systemManager.setEnabled('testSystem', false);
      expect(systemManager.isEnabled('testSystem')).toBe(false);
    });

    it('should return false for non-existent system enabled check', () => {
      expect(systemManager.isEnabled('nonExistent')).toBe(false);
    });
  });

  describe('system execution', () => {
    it('should pass world, delta, and gameTime to systems with requiresGameTime', () => {
      const mockSystem = vi.fn((w: IWorld, d: number, gt: number) => {
        expect(d).toBe(0.016);
        expect(gt).toBe(5.5);
        return w;
      });
      
      systemManager.register('testSystem', mockSystem, 10, { requiresGameTime: true });
      systemManager.run(world, 0.016, 5.5);
      
      expect(mockSystem).toHaveBeenCalled();
    });

    it('should pass world and delta to systems with requiresDelta (default)', () => {
      const mockSystem = vi.fn((w: IWorld, d: number) => {
        expect(d).toBe(0.016);
        return w;
      });
      
      systemManager.register('testSystem', mockSystem, 10);
      systemManager.run(world, 0.016);
      
      expect(mockSystem).toHaveBeenCalled();
    });

    it('should pass only world to systems without delta requirement', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      
      systemManager.register('testSystem', mockSystem, 10, { requiresDelta: false });
      systemManager.run(world, 0.016);
      
      expect(mockSystem).toHaveBeenCalledWith(world);
    });

    it('should handle systems with update method pattern', () => {
      const mockUpdate = vi.fn((w: IWorld) => w);
      const systemWithUpdate = { update: mockUpdate };
      
      systemManager.register('testSystem', systemWithUpdate, 10, { requiresDelta: false });
      systemManager.run(world, 0.016);
      
      expect(mockUpdate).toHaveBeenCalledWith(world);
    });

    it('should pass delta to systems with update method and requiresDelta', () => {
      const mockUpdate = vi.fn().mockImplementation((w: IWorld) => w);
      const systemWithUpdate = { update: mockUpdate };
      
      systemManager.register('testSystem', systemWithUpdate, 10, { requiresDelta: true });
      systemManager.run(world, 0.016);
      
      expect(mockUpdate).toHaveBeenCalledWith(world, 0.016);
    });

    it('should pass delta and gameTime to systems with update method and requiresGameTime', () => {
      const mockUpdate = vi.fn().mockImplementation((w: IWorld) => w);
      const systemWithUpdate = { update: mockUpdate };
      
      systemManager.register('testSystem', systemWithUpdate, 10, { requiresGameTime: true });
      systemManager.run(world, 0.016, 5.5);
      
      expect(mockUpdate).toHaveBeenCalledWith(world, 0.016, 5.5);
    });

    it('should handle systems that return void instead of world', () => {
      const mockSystem = vi.fn(() => { /* returns void */ });
      
      systemManager.register('testSystem', mockSystem, 10, { requiresDelta: false });
      
      // Should not throw
      expect(() => systemManager.run(world, 0.016)).not.toThrow();
    });

    it('should propagate world through system chain', () => {
      // Verify that world is passed from one system to the next
      let passedWorld: IWorld | undefined;
      
      const systemA = vi.fn((w: IWorld) => {
        passedWorld = w;
        return w;
      });
      const systemB = vi.fn((w: IWorld) => {
        expect(w).toBe(passedWorld);
        return w;
      });
      
      systemManager.register('systemA', systemA, 10, { requiresDelta: false });
      systemManager.register('systemB', systemB, 20, { requiresDelta: false });
      
      systemManager.run(world, 0.016);
      
      expect(systemA).toHaveBeenCalled();
      expect(systemB).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should catch and log errors from failing systems', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const failingSystem = vi.fn(() => {
        throw new Error('System error');
      });
      
      systemManager.register('failingSystem', failingSystem, 10, { requiresDelta: false });
      
      // Should not throw, but log error
      expect(() => systemManager.run(world, 0.016)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });

    it('should continue running other systems after one fails', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const failingSystem = vi.fn(() => {
        throw new Error('System error');
      });
      const workingSystem = vi.fn((w: IWorld) => w);
      
      systemManager.register('failingSystem', failingSystem, 10, { requiresDelta: false });
      systemManager.register('workingSystem', workingSystem, 20, { requiresDelta: false });
      
      systemManager.run(world, 0.016);
      
      expect(failingSystem).toHaveBeenCalled();
      expect(workingSystem).toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should remove all registered systems', () => {
      const systemA = vi.fn((w: IWorld) => w);
      const systemB = vi.fn((w: IWorld) => w);
      
      systemManager.register('systemA', systemA, 10, { requiresDelta: false });
      systemManager.register('systemB', systemB, 20, { requiresDelta: false });
      
      systemManager.clear();
      
      const names = systemManager.getSystemNames();
      expect(names).toHaveLength(0);
    });

    it('should not run any systems after clear', () => {
      const mockSystem = vi.fn((w: IWorld) => w);
      systemManager.register('testSystem', mockSystem, 10, { requiresDelta: false });
      
      systemManager.clear();
      systemManager.run(world, 0.016);
      
      expect(mockSystem).not.toHaveBeenCalled();
    });
  });

  describe('getSystemNames', () => {
    it('should return system names in priority order', () => {
      const systemA = vi.fn((w: IWorld) => w);
      const systemB = vi.fn((w: IWorld) => w);
      const systemC = vi.fn((w: IWorld) => w);
      
      systemManager.register('collision', systemA, 10);
      systemManager.register('damage', systemC, 30);
      systemManager.register('movement', systemB, 20);
      
      const names = systemManager.getSystemNames();
      expect(names).toEqual(['collision', 'movement', 'damage']);
    });
  });
});
