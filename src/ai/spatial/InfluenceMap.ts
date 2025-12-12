/**
 * InfluenceMap
 *
 * A 2D grid representing influence values across the game world.
 * Values propagate from sources with configurable decay.
 *
 * Used for:
 * - Threat density mapping
 * - Turret coverage mapping
 * - Strategic value assessment
 *
 * @module ai/spatial/InfluenceMap
 */

import { GAME_CONFIG } from '../../types/constants';

export interface InfluenceSource {
    x: number;
    y: number;
    strength: number; // Base influence value
    radius: number; // Maximum influence radius
    decay: 'linear' | 'quadratic' | 'exponential';
}

export class InfluenceMap {
    private values: Float32Array;
    private readonly cellSize: number;
    private readonly cols: number;
    private readonly rows: number;
    private readonly width: number;
    private readonly height: number;

    constructor(cellSize: number = 32) {
        this.cellSize = cellSize;
        this.width = GAME_CONFIG.WORLD_WIDTH;
        this.height = GAME_CONFIG.WORLD_HEIGHT;
        this.cols = Math.ceil(this.width / cellSize);
        this.rows = Math.ceil(this.height / cellSize);
        this.values = new Float32Array(this.cols * this.rows);
    }

    /**
     * Clear all influence values
     */
    clear(): void {
        this.values.fill(0);
    }

    /**
     * Add influence from a single source
     */
    addSource(source: InfluenceSource): void {
        const centerCol = Math.floor(source.x / this.cellSize);
        const centerRow = Math.floor(source.y / this.cellSize);
        const radiusCells = Math.ceil(source.radius / this.cellSize);

        // Iterate over cells within radius
        for (let dr = -radiusCells; dr <= radiusCells; dr++) {
            for (let dc = -radiusCells; dc <= radiusCells; dc++) {
                const col = centerCol + dc;
                const row = centerRow + dr;

                // Bounds check
                if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
                    continue;
                }

                // Calculate distance
                const cellX = (col + 0.5) * this.cellSize;
                const cellY = (row + 0.5) * this.cellSize;
                const distance = Math.sqrt((cellX - source.x) ** 2 + (cellY - source.y) ** 2);

                if (distance > source.radius) continue;

                // Calculate influence with decay
                const influence = this.calculateInfluence(
                    source.strength,
                    distance,
                    source.radius,
                    source.decay
                );

                // Add to cell
                const index = row * this.cols + col;
                this.values[index] += influence;
            }
        }
    }

    /**
     * Calculate influence value based on decay type
     */
    private calculateInfluence(
        strength: number,
        distance: number,
        radius: number,
        decay: 'linear' | 'quadratic' | 'exponential'
    ): number {
        const normalizedDist = distance / radius;

        switch (decay) {
            case 'linear':
                return strength * (1 - normalizedDist);
            case 'quadratic':
                return strength * (1 - normalizedDist * normalizedDist);
            case 'exponential':
                return strength * Math.exp(-3 * normalizedDist);
            default:
                return strength * (1 - normalizedDist);
        }
    }

    /**
     * Get influence value at world position
     */
    getValue(x: number, y: number): number {
        const col = Math.floor(x / this.cellSize);
        const row = Math.floor(y / this.cellSize);

        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return 0;
        }

        return this.values[row * this.cols + col];
    }

    /**
     * Get interpolated value (smoother)
     */
    getValueInterpolated(x: number, y: number): number {
        const col = x / this.cellSize - 0.5;
        const row = y / this.cellSize - 0.5;

        const col0 = Math.floor(col);
        const row0 = Math.floor(row);
        const col1 = col0 + 1;
        const row1 = row0 + 1;

        const tx = col - col0;
        const ty = row - row0;

        const v00 = this.getValueAt(col0, row0);
        const v10 = this.getValueAt(col1, row0);
        const v01 = this.getValueAt(col0, row1);
        const v11 = this.getValueAt(col1, row1);

        // Bilinear interpolation
        const v0 = v00 * (1 - tx) + v10 * tx;
        const v1 = v01 * (1 - tx) + v11 * tx;

        return v0 * (1 - ty) + v1 * ty;
    }

    private getValueAt(col: number, row: number): number {
        if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
            return 0;
        }
        return this.values[row * this.cols + col];
    }

    /**
     * Find cell with maximum influence
     */
    findMaximum(): { x: number; y: number; value: number } {
        let maxIndex = 0;
        let maxValue = this.values[0];

        for (let i = 1; i < this.values.length; i++) {
            if (this.values[i] > maxValue) {
                maxValue = this.values[i];
                maxIndex = i;
            }
        }

        const col = maxIndex % this.cols;
        const row = Math.floor(maxIndex / this.cols);

        return {
            x: (col + 0.5) * this.cellSize,
            y: (row + 0.5) * this.cellSize,
            value: maxValue,
        };
    }

    /**
     * Find cell with minimum influence
     */
    findMinimum(): { x: number; y: number; value: number } {
        let minIndex = 0;
        let minValue = this.values[0];

        for (let i = 1; i < this.values.length; i++) {
            if (this.values[i] < minValue) {
                minValue = this.values[i];
                minIndex = i;
            }
        }

        const col = minIndex % this.cols;
        const row = Math.floor(minIndex / this.cols);

        return {
            x: (col + 0.5) * this.cellSize,
            y: (row + 0.5) * this.cellSize,
            value: minValue,
        };
    }

    /**
     * Find local maxima (peaks)
     */
    findPeaks(threshold: number = 0): { x: number; y: number; value: number }[] {
        const peaks: { x: number; y: number; value: number }[] = [];

        for (let row = 1; row < this.rows - 1; row++) {
            for (let col = 1; col < this.cols - 1; col++) {
                const index = row * this.cols + col;
                const value = this.values[index];

                if (value <= threshold) continue;

                // Check if local maximum (higher than all 8 neighbors)
                let isMax = true;
                outer: for (let dr = -1; dr <= 1; dr++) {
                    for (let dc = -1; dc <= 1; dc++) {
                        if (dr === 0 && dc === 0) continue;
                        const neighborIndex = (row + dr) * this.cols + (col + dc);
                        if (this.values[neighborIndex] >= value) {
                            isMax = false;
                            break outer;
                        }
                    }
                }

                if (isMax) {
                    peaks.push({
                        x: (col + 0.5) * this.cellSize,
                        y: (row + 0.5) * this.cellSize,
                        value,
                    });
                }
            }
        }

        // Sort by value descending
        peaks.sort((a, b) => b.value - a.value);
        return peaks;
    }

    /**
     * Get raw values array (for visualization)
     */
    getValues(): Float32Array {
        return this.values;
    }

    /**
     * Get grid dimensions
     */
    getDimensions(): { cols: number; rows: number; cellSize: number } {
        return { cols: this.cols, rows: this.rows, cellSize: this.cellSize };
    }
}
