import { Grid } from './grid';
import { CostField } from './costField';
import { BinaryHeap } from '../utils/BinaryHeap';

/**
 * Node for the priority queue used in Dijkstra's algorithm
 */
interface PathNode {
    index: number;
    cost: number;
}

export class IntegrationField {
    private values: Uint32Array;
    private grid: Grid;
    public static readonly MAX_COST = 65535; // Use a safe max value for Uint32

    constructor(grid: Grid) {
        this.grid = grid;
        this.values = new Uint32Array(grid.getSize());
        this.reset();
    }

    public reset(): void {
        this.values.fill(IntegrationField.MAX_COST);
    }

    /**
     * Calculates the integration field using Dijkstra's algorithm
     * Uses a binary heap for O(log n) priority queue operations
     * @param goalX World X coordinate of the goal
     * @param goalY World Y coordinate of the goal
     * @param costField The cost field to use for traversal costs
     */
    public calculate(goalX: number, goalY: number, costField: CostField): void {
        this.reset();

        const goalIndex = this.grid.getCellIndex(goalX, goalY);

        // Use binary heap for efficient priority queue operations - O(log n) vs O(n log n) for sort
        const openList = new BinaryHeap<PathNode>((a, b) => a.cost - b.cost);
        openList.push({ index: goalIndex, cost: 0 });
        this.values[goalIndex] = 0;

        while (!openList.isEmpty()) {
            const current = openList.pop()!;
            const currentIndex = current.index;
            const currentCost = this.values[currentIndex];

            // Skip if we've already found a better path
            if (current.cost > currentCost) continue;

            const neighbors = this.grid.getNeighbors(currentIndex);

            for (const neighborIndex of neighbors) {
                const traversalCost = costField.getCost(neighborIndex);

                // If impassable, skip
                if (traversalCost === 255) continue;

                const newCost = currentCost + traversalCost;

                if (newCost < this.values[neighborIndex]) {
                    this.values[neighborIndex] = newCost;
                    openList.push({ index: neighborIndex, cost: newCost });
                }
            }
        }
    }

    public getValue(cellIndex: number): number {
        if (cellIndex >= 0 && cellIndex < this.values.length) {
            return this.values[cellIndex];
        }
        return IntegrationField.MAX_COST;
    }
}
