// @vitest-environment jsdom
import { describe, test, expect, beforeEach } from 'vitest';
import { Grid } from '../pathfinding/grid';
import { CostField } from '../pathfinding/costField';
import { IntegrationField } from '../pathfinding/integrationField';
import { FlowField } from '../pathfinding/flowField';
import { GAME_CONFIG } from '../types/constants';

describe('Pathfinding System', () => {
    let grid: Grid;
    let costField: CostField;
    let integrationField: IntegrationField;
    let flowField: FlowField;

    beforeEach(() => {
        grid = new Grid();
        costField = new CostField(grid);
        integrationField = new IntegrationField(grid);
        flowField = new FlowField(grid);
    });

    describe('Grid', () => {
        test('should calculate correct dimensions', () => {
            const expectedCols = Math.ceil(GAME_CONFIG.WORLD_WIDTH / Grid.CELL_SIZE);
            const expectedRows = Math.ceil(GAME_CONFIG.WORLD_HEIGHT / Grid.CELL_SIZE);
            expect(grid.cols).toBe(expectedCols);
            expect(grid.rows).toBe(expectedRows);
        });

        test('should convert world coordinates to cell index', () => {
            const index = grid.getCellIndex(0, 0);
            expect(index).toBe(0);

            const index2 = grid.getCellIndex(Grid.CELL_SIZE + 1, 0);
            expect(index2).toBe(1);
        });

        test('should get cell center coordinates', () => {
            const center = grid.getCellCenter(0);
            expect(center.x).toBe(Grid.CELL_SIZE / 2);
            expect(center.y).toBe(Grid.CELL_SIZE / 2);
        });

        test('should get valid neighbors', () => {
            // Top-left corner (0,0) should have East and South neighbors
            const neighbors = grid.getNeighbors(0);
            expect(neighbors).toContain(1); // East
            expect(neighbors).toContain(grid.cols); // South
            expect(neighbors.length).toBe(2);
        });
    });

    describe('CostField', () => {
        test('should initialize with default cost of 1', () => {
            expect(costField.getCost(0)).toBe(1);
        });

        test('should set and get costs', () => {
            costField.setCost(10, 255);
            expect(costField.getCost(10)).toBe(255);
        });
    });

    describe('IntegrationField', () => {
        test('should calculate distances from goal', () => {
            // Set goal at (0,0)
            integrationField.calculate(0, 0, costField);

            // Goal cell should be 0
            expect(integrationField.getValue(0)).toBe(0);

            // Adjacent cell should be 1 (default cost)
            expect(integrationField.getValue(1)).toBe(1);
            expect(integrationField.getValue(grid.cols)).toBe(1);
        });

        test('should respect obstacles', () => {
            // Block cell 1 (East of 0)
            costField.setCost(1, 255);

            // Goal at (0,0)
            integrationField.calculate(0, 0, costField);

            // Cell 1 should be unreachable (or high cost if we just check neighbors)
            // Since it's a neighbor of 0, but cost is 255, it won't be added to open list if we skip 255
            // Our implementation skips 255, so it should remain MAX_COST
            expect(integrationField.getValue(1)).toBe(IntegrationField.MAX_COST);

            // Cell 2 (East of 1) should be reachable via other path (e.g. South then East then North)
            // Distance would be 0 -> South(1) -> SouthEast(2) -> East(3) -> North(4) ... 
            // Actually simpler: 0 -> South -> SouthEast -> ...
            // Let's just check that it's not 2 (direct path blocked)
            // Path: (0,0) -> (0,1) -> (1,1) -> (2,1) -> (2,0) = 4 steps
            // Indices: 0 -> cols -> cols+1 -> cols+2 -> 2
            // Wait, 4-way movement.
            // 0 -> cols (South) -> cols+1 (East) -> cols+2 (East) -> 2 (North)
            // Cost: 1 + 1 + 1 + 1 = 4

            // Let's pick a simpler case. 
            // 0 (Goal) | 1 (Wall) | 2
            // ---------+----------+---
            // cols     | cols+1   | cols+2

            // Path to 2: 0 -> cols -> cols+1 -> cols+2 -> 2
            // Distances:
            // 0: 0
            // cols: 1
            // cols+1: 2
            // cols+2: 3
            // 2: 4

            expect(integrationField.getValue(2)).toBe(4);
        });
    });

    describe('FlowField', () => {
        test('should generate flow vectors pointing to goal', () => {
            // Goal at (0,0)
            integrationField.calculate(0, 0, costField);
            flowField.generate(integrationField);

            // Cell 1 (East of 0) should point West (-1, 0)
            const dir = flowField.getDirection(Grid.CELL_SIZE + 1, 0); // World pos for cell 1
            expect(dir.x).toBeCloseTo(-1);
            expect(dir.y).toBeCloseTo(0);
        });

        test('should have zero vector at goal', () => {
            integrationField.calculate(0, 0, costField);
            flowField.generate(integrationField);

            const dir = flowField.getDirection(0, 0);
            expect(dir.x).toBe(0);
            expect(dir.y).toBe(0);
        });
    });
});
