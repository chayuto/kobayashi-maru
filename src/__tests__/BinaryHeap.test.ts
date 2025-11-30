/**
 * Tests for BinaryHeap utility
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { BinaryHeap } from '../utils/BinaryHeap';

describe('BinaryHeap', () => {
  let heap: BinaryHeap<number>;

  beforeEach(() => {
    // Min-heap by default
    heap = new BinaryHeap<number>((a, b) => a - b);
  });

  describe('basic operations', () => {
    it('should create an empty heap', () => {
      expect(heap.size()).toBe(0);
      expect(heap.isEmpty()).toBe(true);
      expect(heap.peek()).toBeUndefined();
      expect(heap.pop()).toBeUndefined();
    });

    it('should push items and maintain size', () => {
      heap.push(5);
      expect(heap.size()).toBe(1);
      expect(heap.isEmpty()).toBe(false);

      heap.push(3);
      expect(heap.size()).toBe(2);

      heap.push(7);
      expect(heap.size()).toBe(3);
    });

    it('should peek without removing', () => {
      heap.push(5);
      heap.push(3);
      heap.push(7);

      expect(heap.peek()).toBe(3);
      expect(heap.size()).toBe(3);
      expect(heap.peek()).toBe(3);
    });

    it('should pop items in sorted order', () => {
      heap.push(5);
      heap.push(3);
      heap.push(7);
      heap.push(1);
      heap.push(9);

      expect(heap.pop()).toBe(1);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(7);
      expect(heap.pop()).toBe(9);
      expect(heap.pop()).toBeUndefined();
    });

    it('should clear the heap', () => {
      heap.push(1);
      heap.push(2);
      heap.push(3);
      
      heap.clear();
      
      expect(heap.size()).toBe(0);
      expect(heap.isEmpty()).toBe(true);
    });
  });

  describe('heap ordering', () => {
    it('should maintain min-heap property', () => {
      const values = [10, 5, 15, 3, 8, 12, 20, 1, 7];
      values.forEach(v => heap.push(v));

      const sorted = values.slice().sort((a, b) => a - b);
      for (const expected of sorted) {
        expect(heap.pop()).toBe(expected);
      }
    });

    it('should work as max-heap with reversed comparator', () => {
      const maxHeap = new BinaryHeap<number>((a, b) => b - a);
      
      maxHeap.push(10);
      maxHeap.push(5);
      maxHeap.push(15);
      maxHeap.push(3);
      maxHeap.push(8);

      expect(maxHeap.pop()).toBe(15);
      expect(maxHeap.pop()).toBe(10);
      expect(maxHeap.pop()).toBe(8);
      expect(maxHeap.pop()).toBe(5);
      expect(maxHeap.pop()).toBe(3);
    });

    it('should handle duplicate values', () => {
      heap.push(5);
      heap.push(5);
      heap.push(3);
      heap.push(3);
      heap.push(7);

      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(5);
      expect(heap.pop()).toBe(7);
    });
  });

  describe('complex objects', () => {
    interface PriorityItem {
      priority: number;
      value: string;
    }

    it('should work with objects using custom comparator', () => {
      const objectHeap = new BinaryHeap<PriorityItem>((a, b) => a.priority - b.priority);

      objectHeap.push({ priority: 5, value: 'low' });
      objectHeap.push({ priority: 1, value: 'highest' });
      objectHeap.push({ priority: 3, value: 'medium' });

      expect(objectHeap.pop()?.value).toBe('highest');
      expect(objectHeap.pop()?.value).toBe('medium');
      expect(objectHeap.pop()?.value).toBe('low');
    });
  });

  describe('edge cases', () => {
    it('should handle single element', () => {
      heap.push(42);
      expect(heap.peek()).toBe(42);
      expect(heap.pop()).toBe(42);
      expect(heap.isEmpty()).toBe(true);
    });

    it('should handle two elements', () => {
      heap.push(2);
      heap.push(1);
      expect(heap.pop()).toBe(1);
      expect(heap.pop()).toBe(2);
    });

    it('should handle elements added in sorted order', () => {
      heap.push(1);
      heap.push(2);
      heap.push(3);
      heap.push(4);
      heap.push(5);

      expect(heap.pop()).toBe(1);
      expect(heap.pop()).toBe(2);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(4);
      expect(heap.pop()).toBe(5);
    });

    it('should handle elements added in reverse sorted order', () => {
      heap.push(5);
      heap.push(4);
      heap.push(3);
      heap.push(2);
      heap.push(1);

      expect(heap.pop()).toBe(1);
      expect(heap.pop()).toBe(2);
      expect(heap.pop()).toBe(3);
      expect(heap.pop()).toBe(4);
      expect(heap.pop()).toBe(5);
    });
  });

  describe('performance characteristics', () => {
    it('should handle large number of elements', () => {
      const count = 1000;
      const values: number[] = [];
      
      // Add random values
      for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * 10000);
        values.push(value);
        heap.push(value);
      }

      // Sort expected values
      values.sort((a, b) => a - b);

      // Verify heap pops in sorted order
      for (let i = 0; i < count; i++) {
        expect(heap.pop()).toBe(values[i]);
      }
    });
  });
});
