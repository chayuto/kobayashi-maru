import { GAME_CONFIG } from '../types/constants';

export class Grid {
    public static readonly CELL_SIZE = 32;
    public readonly width: number;
    public readonly height: number;
    public readonly cols: number;
    public readonly rows: number;

    constructor() {
        this.width = GAME_CONFIG.WORLD_WIDTH;
        this.height = GAME_CONFIG.WORLD_HEIGHT;
        this.cols = Math.ceil(this.width / Grid.CELL_SIZE);
        this.rows = Math.ceil(this.height / Grid.CELL_SIZE);
    }

    /**
     * Converts world coordinates to a grid cell index
     */
    public getCellIndex(x: number, y: number): number {
        const col = Math.floor(x / Grid.CELL_SIZE);
        const row = Math.floor(y / Grid.CELL_SIZE);

        // Clamp to grid bounds
        const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
        const clampedRow = Math.max(0, Math.min(row, this.rows - 1));

        return clampedRow * this.cols + clampedCol;
    }

    /**
     * Gets the world coordinates of the center of a cell
     */
    public getCellCenter(cellIndex: number): { x: number, y: number } {
        const col = cellIndex % this.cols;
        const row = Math.floor(cellIndex / this.cols);

        return {
            x: (col * Grid.CELL_SIZE) + (Grid.CELL_SIZE / 2),
            y: (row * Grid.CELL_SIZE) + (Grid.CELL_SIZE / 2)
        };
    }

    /**
     * Gets the indices of neighboring cells (4-directional)
     */
    public getNeighbors(cellIndex: number): number[] {
        const neighbors: number[] = [];
        const col = cellIndex % this.cols;
        const row = Math.floor(cellIndex / this.cols);

        // North
        if (row > 0) {
            neighbors.push(cellIndex - this.cols);
        }
        // South
        if (row < this.rows - 1) {
            neighbors.push(cellIndex + this.cols);
        }
        // East
        if (col < this.cols - 1) {
            neighbors.push(cellIndex + 1);
        }
        // West
        if (col > 0) {
            neighbors.push(cellIndex - 1);
        }

        return neighbors;
    }

    /**
     * Gets the total number of cells in the grid
     */
    public getSize(): number {
        return this.cols * this.rows;
    }
}
