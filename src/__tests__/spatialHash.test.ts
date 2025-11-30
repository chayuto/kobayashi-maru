/**
 * Tests for Spatial Hash Grid
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { SpatialHash } from '../collision/spatialHash';

describe('SpatialHash', () => {
  let spatialHash: SpatialHash;
  const cellSize = 100;
  const width = 1000;
  const height = 1000;

  beforeEach(() => {
    spatialHash = new SpatialHash(cellSize, width, height);
  });

  describe('constructor', () => {
    it('should create a grid with correct dimensions', () => {
      const info = spatialHash.getGridInfo();
      expect(info.cellSize).toBe(cellSize);
      expect(info.cols).toBe(10); // 1000 / 100 = 10
      expect(info.rows).toBe(10);
    });

    it('should handle non-exact divisions', () => {
      const hash = new SpatialHash(64, 1920, 1080);
      const info = hash.getGridInfo();
      expect(info.cols).toBe(30); // Math.ceil(1920 / 64)
      expect(info.rows).toBe(17); // Math.ceil(1080 / 64)
    });
  });

  describe('insert', () => {
    it('should insert entity into correct cell', () => {
      spatialHash.insert(1, 50, 50); // Cell (0, 0)
      spatialHash.insert(2, 250, 50); // Cell (2, 0) - far enough to be in different cell

      // Query cell (0, 0) only
      const result1 = spatialHash.queryRect(0, 0, 50, 50);
      // Query cell (2, 0) only
      const result2 = spatialHash.queryRect(200, 0, 50, 50);

      expect(result1).toContain(1);
      expect(result1).not.toContain(2);
      expect(result2).toContain(2);
      expect(result2).not.toContain(1);
    });

    it('should handle multiple entities in same cell', () => {
      spatialHash.insert(1, 50, 50);
      spatialHash.insert(2, 60, 60);
      spatialHash.insert(3, 70, 70);

      const result = spatialHash.queryRect(0, 0, 100, 100);

      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result.length).toBe(3);
    });

    it('should handle entities at edge positions', () => {
      // At exact cell boundary
      spatialHash.insert(1, 100, 100); // Should be in cell (1, 1)
      
      const result = spatialHash.queryRect(100, 100, 100, 100);
      expect(result).toContain(1);
    });

    it('should clamp entities outside world bounds', () => {
      // Entity at negative position should be clamped to cell (0, 0)
      spatialHash.insert(1, -50, -50);
      
      const result = spatialHash.queryRect(0, 0, 100, 100);
      expect(result).toContain(1);
    });

    it('should clamp entities beyond world bounds', () => {
      // Entity beyond world should be clamped to last cell
      spatialHash.insert(1, 1500, 1500);
      
      const result = spatialHash.queryRect(900, 900, 100, 100);
      expect(result).toContain(1);
    });
  });

  describe('clear', () => {
    it('should remove all entities from the grid', () => {
      spatialHash.insert(1, 50, 50);
      spatialHash.insert(2, 150, 150);
      spatialHash.insert(3, 250, 250);

      expect(spatialHash.getCellCount()).toBeGreaterThan(0);

      spatialHash.clear();

      expect(spatialHash.getCellCount()).toBe(0);
      expect(spatialHash.queryRect(0, 0, 1000, 1000).length).toBe(0);
    });
  });

  describe('query (circular)', () => {
    it('should return entities within radius', () => {
      spatialHash.insert(1, 50, 50);
      spatialHash.insert(2, 150, 50);
      spatialHash.insert(3, 350, 50);

      // Query with radius that covers first two cells
      const result = spatialHash.query(100, 50, 100);

      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).not.toContain(3);
    });

    it('should return empty array when no entities in range', () => {
      spatialHash.insert(1, 50, 50);

      const result = spatialHash.query(900, 900, 50);

      expect(result.length).toBe(0);
    });

    it('should not duplicate entities in result', () => {
      spatialHash.insert(1, 50, 50);

      // Query that spans multiple cells but entity is only in one
      const result = spatialHash.query(50, 50, 150);

      const count = result.filter(id => id === 1).length;
      expect(count).toBe(1);
    });
  });

  describe('queryRect', () => {
    it('should return entities within rectangle', () => {
      spatialHash.insert(1, 50, 50);
      spatialHash.insert(2, 150, 150);
      spatialHash.insert(3, 500, 500);

      const result = spatialHash.queryRect(0, 0, 200, 200);

      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).not.toContain(3);
    });

    it('should return empty array for empty area', () => {
      spatialHash.insert(1, 50, 50);

      const result = spatialHash.queryRect(500, 500, 100, 100);

      expect(result.length).toBe(0);
    });

    it('should handle rectangle spanning multiple cells', () => {
      // Place entities in different cells
      spatialHash.insert(1, 50, 50);   // Cell (0, 0)
      spatialHash.insert(2, 150, 50);  // Cell (1, 0)
      spatialHash.insert(3, 50, 150);  // Cell (0, 1)
      spatialHash.insert(4, 150, 150); // Cell (1, 1)

      // Query spanning all four cells
      const result = spatialHash.queryRect(0, 0, 200, 200);

      expect(result.length).toBe(4);
      expect(result).toContain(1);
      expect(result).toContain(2);
      expect(result).toContain(3);
      expect(result).toContain(4);
    });

    it('should not return duplicate entities', () => {
      spatialHash.insert(1, 50, 50);

      const result = spatialHash.queryRect(0, 0, 200, 200);

      expect(result.length).toBe(1);
    });
  });

  describe('performance characteristics', () => {
    it('should handle large number of entities', () => {
      // Insert 1000 entities
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        spatialHash.insert(i, x, y);
      }

      // Query should still work efficiently
      const result = spatialHash.queryRect(400, 400, 200, 200);

      // Result should be a subset of all entities
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('should have bounded memory usage', () => {
      // Insert entities spread across all cells
      for (let i = 0; i < 100; i++) {
        spatialHash.insert(i, i * 10, i * 10);
      }

      // Cell count should be bounded by grid dimensions
      const info = spatialHash.getGridInfo();
      expect(spatialHash.getCellCount()).toBeLessThanOrEqual(info.cols * info.rows);
    });
  });
});
