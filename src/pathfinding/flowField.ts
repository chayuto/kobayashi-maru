import { Grid } from './grid';
import { IntegrationField } from './integrationField';

export class FlowField {
    private vectors: Float32Array; // Interleaved x, y
    private grid: Grid;

    constructor(grid: Grid) {
        this.grid = grid;
        // 2 values per cell (x, y)
        this.vectors = new Float32Array(grid.getSize() * 2);
    }

    /**
     * Generates the flow field based on the integration field
     */
    public generate(integrationField: IntegrationField): void {
        const size = this.grid.getSize();

        for (let i = 0; i < size; i++) {
            const neighbors = this.grid.getNeighbors(i);
            let bestNeighbor = i;
            let minCost = integrationField.getValue(i);

            // Find neighbor with lowest integration cost
            for (const neighborIndex of neighbors) {
                const cost = integrationField.getValue(neighborIndex);
                if (cost < minCost) {
                    minCost = cost;
                    bestNeighbor = neighborIndex;
                }
            }

            // If we found a better neighbor, point towards it
            if (bestNeighbor !== i) {
                const currentPos = this.grid.getCellCenter(i);
                const targetPos = this.grid.getCellCenter(bestNeighbor);

                let dx = targetPos.x - currentPos.x;
                let dy = targetPos.y - currentPos.y;

                // Normalize
                const length = Math.sqrt(dx * dx + dy * dy);
                if (length > 0) {
                    dx /= length;
                    dy /= length;
                }

                this.vectors[i * 2] = dx;
                this.vectors[i * 2 + 1] = dy;
            } else {
                // No better neighbor (local minimum or goal), zero vector
                this.vectors[i * 2] = 0;
                this.vectors[i * 2 + 1] = 0;
            }
        }
    }

    /**
     * Gets the flow direction at a specific world position
     */
    public getDirection(x: number, y: number): { x: number, y: number } {
        const cellIndex = this.grid.getCellIndex(x, y);

        if (cellIndex >= 0 && cellIndex < this.grid.getSize()) {
            return {
                x: this.vectors[cellIndex * 2],
                y: this.vectors[cellIndex * 2 + 1]
            };
        }

        return { x: 0, y: 0 };
    }
}
