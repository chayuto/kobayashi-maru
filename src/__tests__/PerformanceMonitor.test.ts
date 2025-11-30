/**
 * Tests for PerformanceMonitor
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PerformanceMonitor, FRAME_BUDGET } from '../core/PerformanceMonitor';

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;

  beforeEach(() => {
    monitor = new PerformanceMonitor();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should initialize with default metrics', () => {
      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBe(0);
      expect(metrics.frameTime).toBe(0);
      expect(metrics.renderTime).toBe(0);
      expect(metrics.entityCount).toBe(0);
      expect(metrics.systemTimes.size).toBe(0);
    });

    it('should track entity count', () => {
      monitor.setEntityCount(100);
      expect(monitor.getMetrics().entityCount).toBe(100);
      
      monitor.setEntityCount(500);
      expect(monitor.getMetrics().entityCount).toBe(500);
    });

    it('should track draw calls', () => {
      monitor.setDrawCalls(50);
      expect(monitor.getMetrics().drawCalls).toBe(50);
    });
  });

  describe('system timing', () => {
    it('should measure system time', async () => {
      monitor.startMeasure('movement');
      // Small delay to simulate work
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endMeasure('movement');

      const metrics = monitor.getMetrics();
      expect(metrics.systemTimes.has('movement')).toBe(true);
      expect(metrics.systemTimes.get('movement')).toBeGreaterThan(0);
    });

    it('should handle multiple systems', async () => {
      monitor.startMeasure('collision');
      await new Promise(resolve => setTimeout(resolve, 2));
      monitor.endMeasure('collision');

      monitor.startMeasure('ai');
      await new Promise(resolve => setTimeout(resolve, 3));
      monitor.endMeasure('ai');

      const metrics = monitor.getMetrics();
      expect(metrics.systemTimes.has('collision')).toBe(true);
      expect(metrics.systemTimes.has('ai')).toBe(true);
    });

    it('should handle endMeasure without startMeasure', () => {
      // Should not throw
      expect(() => monitor.endMeasure('nonexistent')).not.toThrow();
    });

    it('should get system timing breakdown', async () => {
      monitor.startMeasure('movement');
      await new Promise(resolve => setTimeout(resolve, 1));
      monitor.endMeasure('movement');

      const breakdown = monitor.getSystemTimingBreakdown();
      expect(breakdown.length).toBeGreaterThan(0);
      const movementEntry = breakdown.find(e => e.name === 'movement');
      expect(movementEntry).toBeDefined();
      expect(movementEntry!.budget).toBe(FRAME_BUDGET.MOVEMENT);
    });
  });

  describe('frame timing', () => {
    it('should measure frame time', async () => {
      monitor.startFrame();
      await new Promise(resolve => setTimeout(resolve, 5));
      monitor.endFrame();

      const metrics = monitor.getMetrics();
      expect(metrics.frameTime).toBeGreaterThan(0);
      expect(metrics.fps).toBeGreaterThan(0);
    });

    it('should track render time', async () => {
      monitor.startRender();
      await new Promise(resolve => setTimeout(resolve, 2));
      monitor.endRender();

      const metrics = monitor.getMetrics();
      expect(metrics.renderTime).toBeGreaterThan(0);
    });
  });

  describe('averages', () => {
    it('should calculate rolling averages', async () => {
      // Add multiple frame samples
      for (let i = 0; i < 5; i++) {
        monitor.startFrame();
        await new Promise(resolve => setTimeout(resolve, 2));
        monitor.endFrame();
      }

      const averages = monitor.getAverages();
      expect(averages.fps).toBeGreaterThan(0);
      expect(averages.frameTime).toBeGreaterThan(0);
    });

    it('should calculate system time averages', async () => {
      for (let i = 0; i < 3; i++) {
        monitor.startMeasure('test');
        await new Promise(resolve => setTimeout(resolve, 1));
        monitor.endMeasure('test');
      }

      const averages = monitor.getAverages();
      expect(averages.systemTimes.has('test')).toBe(true);
      expect(averages.systemTimes.get('test')).toBeGreaterThan(0);
    });

    it('should handle empty averages', () => {
      const averages = monitor.getAverages();
      expect(averages.fps).toBe(0);
      expect(averages.frameTime).toBe(0);
    });
  });

  describe('budget warnings', () => {
    it('should warn when system exceeds budget', async () => {
      // Create a timing that exceeds the budget
      const largeDuration = FRAME_BUDGET.MOVEMENT + 10;
      
      const startTime = performance.now();
      monitor.startMeasure('movement');
      // Simulate waiting for the budget + extra time
      while (performance.now() - startTime < largeDuration) {
        // Busy wait
      }
      monitor.endMeasure('movement');

      // Warning should have been logged
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all metrics', async () => {
      monitor.setEntityCount(100);
      monitor.startFrame();
      await new Promise(resolve => setTimeout(resolve, 1));
      monitor.endFrame();
      monitor.startMeasure('test');
      await new Promise(resolve => setTimeout(resolve, 1));
      monitor.endMeasure('test');

      monitor.reset();

      const metrics = monitor.getMetrics();
      expect(metrics.fps).toBe(0);
      expect(metrics.frameTime).toBe(0);
      expect(metrics.entityCount).toBe(0);
      expect(metrics.systemTimes.size).toBe(0);
    });
  });

  describe('logReport', () => {
    it('should log performance report without error', async () => {
      vi.spyOn(console, 'group').mockImplementation(() => {});
      vi.spyOn(console, 'groupEnd').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});

      monitor.setEntityCount(50);
      monitor.startFrame();
      await new Promise(resolve => setTimeout(resolve, 1));
      monitor.endFrame();

      expect(() => monitor.logReport()).not.toThrow();
    });
  });

  describe('FRAME_BUDGET constants', () => {
    it('should have sensible default values', () => {
      expect(FRAME_BUDGET.TOTAL).toBe(16.67);
      expect(FRAME_BUDGET.MOVEMENT).toBe(2.0);
      expect(FRAME_BUDGET.COLLISION).toBe(2.0);
      expect(FRAME_BUDGET.AI).toBe(2.0);
      expect(FRAME_BUDGET.RENDERING).toBe(5.0);
    });
  });
});
