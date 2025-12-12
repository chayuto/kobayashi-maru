/**
 * FlowFieldAnalyzer
 *
 * Integrates the existing flow field system with AI placement decisions.
 * Generates flow fields from spawn edges to Kobayashi Maru and identifies
 * high-traffic cells for optimal turret placement.
 *
 * @module ai/spatial/FlowFieldAnalyzer
 */

import { Grid } from '../../pathfinding/grid';
import { CostField } from '../../pathfinding/costField';
import { IntegrationField } from '../../pathfinding/integrationField';
import { FlowField } from '../../pathfinding/flowField';
import { GAME_CONFIG } from '../../types/constants';

export interface FlowAnalysis {
    /** Cells with highest traffic (flow convergence) */
    highTrafficCells: number[];
    /** Flow direction at each cell */
    flowVectors: Map<number, { x: number; y: number }>;
    /** Traffic density score per cell (0-1) */
    trafficDensity: Float32Array;
}

export class FlowFieldAnalyzer {
    private grid: Grid;
    private costField: CostField;
    private integrationField: IntegrationField;
    private flowField: FlowField;
    private trafficDensity: Float32Array;

    constructor() {
        this.grid = new Grid();
        this.costField = new CostField(this.grid);
        this.integrationField = new IntegrationField(this.grid);
        this.flowField = new FlowField(this.grid);
        this.trafficDensity = new Float32Array(this.grid.getSize());
    }

    /**
     * Generate flow field toward Kobayashi Maru (center)
     */
    generateToCenter(): void {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        this.costField.reset(); // All cells cost 1
        this.integrationField.calculate(centerX, centerY, this.costField);
        this.flowField.generate(this.integrationField);
    }

    /**
     * Calculate traffic density by simulating flow from all edges
     * Higher values = more enemy paths converge here
     */
    calculateTrafficDensity(): void {
        this.trafficDensity.fill(0);

        // Simulate flow from edge cells
        const edgeCells = this.getEdgeCells();

        for (const startCell of edgeCells) {
            this.traceFlowPath(startCell);
        }

        // Normalize to 0-1
        let max = 0;
        for (let i = 0; i < this.trafficDensity.length; i++) {
            if (this.trafficDensity[i] > max) {
                max = this.trafficDensity[i];
            }
        }

        if (max > 0) {
            for (let i = 0; i < this.trafficDensity.length; i++) {
                this.trafficDensity[i] /= max;
            }
        }
    }

    /**
     * Trace a flow path from start cell, incrementing traffic along the way
     */
    private traceFlowPath(startCell: number): void {
        let currentCell = startCell;
        const visited = new Set<number>();
        const maxSteps = 200; // Prevent infinite loops

        for (let step = 0; step < maxSteps; step++) {
            if (visited.has(currentCell)) break;
            visited.add(currentCell);

            // Increment traffic at this cell
            this.trafficDensity[currentCell] += 1;

            // Get flow direction
            const pos = this.grid.getCellCenter(currentCell);
            const dir = this.flowField.getDirection(pos.x, pos.y);

            // Zero vector means we reached the goal
            if (dir.x === 0 && dir.y === 0) break;

            // Move to next cell
            const nextX = pos.x + dir.x * Grid.CELL_SIZE;
            const nextY = pos.y + dir.y * Grid.CELL_SIZE;
            currentCell = this.grid.getCellIndex(nextX, nextY);
        }
    }

    /**
     * Get all cells along screen edges (spawn zones)
     */
    private getEdgeCells(): number[] {
        const cells: number[] = [];

        // Top and bottom edges
        for (let col = 0; col < this.grid.cols; col++) {
            cells.push(col); // Top row
            cells.push((this.grid.rows - 1) * this.grid.cols + col); // Bottom row
        }

        // Left and right edges (excluding corners already added)
        for (let row = 1; row < this.grid.rows - 1; row++) {
            cells.push(row * this.grid.cols); // Left column
            cells.push(row * this.grid.cols + this.grid.cols - 1); // Right column
        }

        return cells;
    }

    /**
     * Get high-traffic cells sorted by density
     * @param count Number of cells to return
     * @param minDensity Minimum density threshold (0-1)
     */
    getHighTrafficCells(count: number = 20, minDensity: number = 0.5): number[] {
        const cells: { index: number; density: number }[] = [];

        for (let i = 0; i < this.trafficDensity.length; i++) {
            if (this.trafficDensity[i] >= minDensity) {
                cells.push({ index: i, density: this.trafficDensity[i] });
            }
        }

        cells.sort((a, b) => b.density - a.density);
        return cells.slice(0, count).map((c) => c.index);
    }

    /**
     * Get traffic density at a world position
     */
    getTrafficAt(x: number, y: number): number {
        const cellIndex = this.grid.getCellIndex(x, y);
        if (cellIndex >= 0 && cellIndex < this.trafficDensity.length) {
            return this.trafficDensity[cellIndex];
        }
        return 0;
    }

    /**
     * Get flow direction at a world position
     */
    getFlowAt(x: number, y: number): { x: number; y: number } {
        return this.flowField.getDirection(x, y);
    }

    /**
     * Get world position of a cell center
     */
    getCellWorldPosition(cellIndex: number): { x: number; y: number } {
        return this.grid.getCellCenter(cellIndex);
    }

    /**
     * Full analysis - call once at game start or when map changes
     */
    analyze(): FlowAnalysis {
        this.generateToCenter();
        this.calculateTrafficDensity();

        const highTrafficCells = this.getHighTrafficCells(30, 0.4);
        const flowVectors = new Map<number, { x: number; y: number }>();

        for (const cellIndex of highTrafficCells) {
            const pos = this.grid.getCellCenter(cellIndex);
            flowVectors.set(cellIndex, this.flowField.getDirection(pos.x, pos.y));
        }

        return {
            highTrafficCells,
            flowVectors,
            trafficDensity: this.trafficDensity,
        };
    }
}
