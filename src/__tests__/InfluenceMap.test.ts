/**
 * Tests for Influence Map System
 *
 * @module __tests__/InfluenceMap.test
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InfluenceMap } from '../ai/spatial/InfluenceMap';

describe('InfluenceMap', () => {
    let map: InfluenceMap;

    beforeEach(() => {
        map = new InfluenceMap(32);
    });

    describe('addSource', () => {
        it('should propagate influence with linear decay', () => {
            map.addSource({ x: 100, y: 100, strength: 10, radius: 100, decay: 'linear' });

            // At center, should have high strength (cell may not perfectly align)
            const centerValue = map.getValue(100, 100);
            expect(centerValue).toBeGreaterThan(7);

            // At 50% radius, should be ~50% strength
            const midValue = map.getValue(150, 100);
            expect(midValue).toBeGreaterThan(3);
            expect(midValue).toBeLessThan(7);

            // Beyond radius, should be 0
            const outsideValue = map.getValue(250, 100);
            expect(outsideValue).toBe(0);
        });

        it('should propagate influence with quadratic decay', () => {
            map.addSource({ x: 200, y: 200, strength: 10, radius: 100, decay: 'quadratic' });

            const centerValue = map.getValue(200, 200);
            expect(centerValue).toBeGreaterThan(9);

            // Quadratic decay falls off slower initially
            const midValue = map.getValue(250, 200);
            expect(midValue).toBeGreaterThan(5);
        });

        it('should propagate influence with exponential decay', () => {
            map.addSource({ x: 300, y: 300, strength: 10, radius: 100, decay: 'exponential' });

            const centerValue = map.getValue(300, 300);
            expect(centerValue).toBeGreaterThan(7);

            // Exponential falls off rapidly
            const farValue = map.getValue(350, 300);
            expect(farValue).toBeLessThan(5);
        });

        it('should accumulate influence from multiple sources', () => {
            map.addSource({ x: 200, y: 200, strength: 10, radius: 100, decay: 'linear' });
            map.addSource({ x: 200, y: 200, strength: 5, radius: 100, decay: 'linear' });

            const value = map.getValue(200, 200);
            expect(value).toBeGreaterThan(12);
        });
    });

    describe('findPeaks', () => {
        it('should find peaks correctly', () => {
            map.addSource({ x: 200, y: 200, strength: 20, radius: 100, decay: 'quadratic' });
            map.addSource({ x: 600, y: 600, strength: 15, radius: 100, decay: 'quadratic' });

            const peaks = map.findPeaks();
            expect(peaks.length).toBeGreaterThanOrEqual(2);
            expect(peaks[0].value).toBeGreaterThan(peaks[1].value);
        });

        it('should respect threshold', () => {
            map.addSource({ x: 200, y: 200, strength: 20, radius: 100, decay: 'quadratic' });
            map.addSource({ x: 600, y: 600, strength: 5, radius: 100, decay: 'quadratic' });

            const peaks = map.findPeaks(10);
            // Only the first source should be above threshold
            for (const peak of peaks) {
                expect(peak.value).toBeGreaterThan(10);
            }
        });
    });

    describe('findMaximum', () => {
        it('should find global maximum', () => {
            map.addSource({ x: 400, y: 400, strength: 50, radius: 100, decay: 'linear' });
            map.addSource({ x: 800, y: 800, strength: 30, radius: 100, decay: 'linear' });

            const max = map.findMaximum();
            expect(max.value).toBeGreaterThan(40);
            expect(max.x).toBeCloseTo(400, -1);
            expect(max.y).toBeCloseTo(400, -1);
        });
    });

    describe('findMinimum', () => {
        it('should find global minimum', () => {
            map.addSource({ x: 400, y: 400, strength: 50, radius: 100, decay: 'linear' });

            const min = map.findMinimum();
            expect(min.value).toBe(0);
            // Min should be far from the source
            const distFromSource = Math.sqrt((min.x - 400) ** 2 + (min.y - 400) ** 2);
            expect(distFromSource).toBeGreaterThan(100);
        });
    });

    describe('getValueInterpolated', () => {
        it('should interpolate values smoothly', () => {
            map.addSource({ x: 500, y: 500, strength: 100, radius: 200, decay: 'linear' });

            // Values should transition smoothly
            const v1 = map.getValueInterpolated(500, 500);
            const v2 = map.getValueInterpolated(520, 500);
            const v3 = map.getValueInterpolated(540, 500);

            expect(v1).toBeGreaterThan(v2);
            expect(v2).toBeGreaterThan(v3);
        });
    });

    describe('clear', () => {
        it('should reset all values to zero', () => {
            map.addSource({ x: 300, y: 300, strength: 50, radius: 100, decay: 'linear' });
            expect(map.getValue(300, 300)).toBeGreaterThan(0);

            map.clear();
            expect(map.getValue(300, 300)).toBe(0);
        });
    });

    describe('getDimensions', () => {
        it('should return correct grid dimensions', () => {
            const dims = map.getDimensions();
            expect(dims.cellSize).toBe(32);
            expect(dims.cols).toBeGreaterThan(0);
            expect(dims.rows).toBeGreaterThan(0);
        });
    });
});
