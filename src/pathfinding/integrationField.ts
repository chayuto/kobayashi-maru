import { Grid } from './grid';
import { CostField } from './costField';

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
     * @param goalX World X coordinate of the goal
     * @param goalY World Y coordinate of the goal
     * @param costField The cost field to use for traversal costs
     */
    public calculate(goalX: number, goalY: number, costField: CostField): void {
        this.reset();

        const goalIndex = this.grid.getCellIndex(goalX, goalY);

        // Open list for Dijkstra's (simplified priority queue)
        // For performance in JS, a simple array or a proper MinHeap can be used.
        // Given the grid size (approx 2000 cells), a simple array queue might be acceptable,
        // but a proper queue is better. For now, we'll use a standard array and sort,
        // or just a simple queue if we assume uniform edge weights (BFS) but we have variable costs.
        // Let's implement a basic array-based open list for simplicity first.

        const openList: number[] = [goalIndex];
        this.values[goalIndex] = 0;

        while (openList.length > 0) {
            // Sort to simulate priority queue (inefficient for large sets, but simple)
            // Optimization: Use a proper binary heap if performance becomes an issue
            openList.sort((a, b) => this.values[a] - this.values[b]);

            const currentIndex = openList.shift()!;
            const currentCost = this.values[currentIndex];

            const neighbors = this.grid.getNeighbors(currentIndex);

            for (const neighborIndex of neighbors) {
                const traversalCost = costField.getCost(neighborIndex);

                // If impassable, skip
                if (traversalCost === 255) continue;

                const newCost = currentCost + traversalCost;

                if (newCost < this.values[neighborIndex]) {
                    if (this.values[neighborIndex] === IntegrationField.MAX_COST) {
                        openList.push(neighborIndex);
                    }
                    this.values[neighborIndex] = newCost;
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
