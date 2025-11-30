/**
 * Spatial Hash Grid for efficient O(N) collision detection
 * Divides the world into grid cells and buckets entities by position
 */

export class SpatialHash {
  private cellSize: number;
  private cols: number;
  private rows: number;
  private cells: Map<number, Set<number>>;

  /**
   * Initialize spatial hash grid
   * @param cellSize Size of each cell (should be 2x largest entity radius)
   * @param width World width in pixels
   * @param height World height in pixels
   */
  constructor(cellSize: number, width: number, height: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize);
    this.rows = Math.ceil(height / cellSize);
    this.cells = new Map();
  }

  /**
   * Get the cell key for a given position
   */
  private getCellKey(x: number, y: number): number {
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);
    // Clamp to valid range
    const clampedCol = Math.max(0, Math.min(col, this.cols - 1));
    const clampedRow = Math.max(0, Math.min(row, this.rows - 1));
    return clampedRow * this.cols + clampedCol;
  }

  /**
   * Remove all entities from the grid
   */
  clear(): void {
    this.cells.clear();
  }

  /**
   * Add entity to the appropriate cell
   * @param eid Entity ID
   * @param x X position
   * @param y Y position
   */
  insert(eid: number, x: number, y: number): void {
    const key = this.getCellKey(x, y);
    let cell = this.cells.get(key);
    if (!cell) {
      cell = new Set();
      this.cells.set(key, cell);
    }
    cell.add(eid);
  }

  /**
   * Get all entities within a circular radius from a point.
   * 
   * Note: This is a broad-phase query that returns all entities in cells that could 
   * contain entities within the radius. The result may include false positives 
   * (entities in overlapping cells but outside the actual radius).
   * Callers should perform fine-grained distance checks if exact collision is needed.
   * 
   * @param x Center X position
   * @param y Center Y position
   * @param radius Search radius
   * @returns Array of entity IDs that may be within the radius (broad-phase candidates)
   */
  query(x: number, y: number, radius: number): number[] {
    const result: number[] = [];

    // Calculate cells that could contain entities within radius
    const minCol = Math.max(0, Math.floor((x - radius) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius) / this.cellSize));

    // Set to track entities we've already added (in case they span multiple cells)
    const seen = new Set<number>();

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const key = row * this.cols + col;
        const cell = this.cells.get(key);
        if (cell) {
          for (const eid of cell) {
            if (!seen.has(eid)) {
              seen.add(eid);
              result.push(eid);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Get all entities within a rectangular area
   * @param x Top-left X position
   * @param y Top-left Y position
   * @param width Rectangle width
   * @param height Rectangle height
   * @returns Array of entity IDs within the rectangle
   */
  queryRect(x: number, y: number, width: number, height: number): number[] {
    const result: number[] = [];

    // Calculate cells that overlap with the rectangle
    const minCol = Math.max(0, Math.floor(x / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + width) / this.cellSize));
    const minRow = Math.max(0, Math.floor(y / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + height) / this.cellSize));

    // Set to track entities we've already added
    const seen = new Set<number>();

    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        const key = row * this.cols + col;
        const cell = this.cells.get(key);
        if (cell) {
          for (const eid of cell) {
            if (!seen.has(eid)) {
              seen.add(eid);
              result.push(eid);
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Get the number of cells currently in use
   */
  getCellCount(): number {
    return this.cells.size;
  }

  /**
   * Get grid dimensions info
   */
  getGridInfo(): { cols: number; rows: number; cellSize: number } {
    return {
      cols: this.cols,
      rows: this.rows,
      cellSize: this.cellSize
    };
  }
}
