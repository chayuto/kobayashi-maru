import { Grid } from './grid';

export class CostField {
    private costs: Uint8Array;

    constructor(grid: Grid) {
        this.costs = new Uint8Array(grid.getSize());
        this.reset();
    }

    /**
     * Resets all cells to the default cost (1)
     */
    public reset(): void {
        this.costs.fill(1);
    }

    /**
     * Sets the cost of a specific cell
     * @param cellIndex Index of the cell
     * @param cost Cost value (1-255, where 255 is impassable)
     */
    public setCost(cellIndex: number, cost: number): void {
        if (cellIndex >= 0 && cellIndex < this.costs.length) {
            this.costs[cellIndex] = cost;
        }
    }

    /**
     * Gets the cost of a specific cell
     */
    public getCost(cellIndex: number): number {
        if (cellIndex >= 0 && cellIndex < this.costs.length) {
            return this.costs[cellIndex];
        }
        return 255; // Return max cost for out of bounds
    }

    /**
     * Gets the underlying cost array
     */
    public getCosts(): Uint8Array {
        return this.costs;
    }
}
