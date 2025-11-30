/**
 * BinaryHeap - A priority queue implementation using a binary heap
 * Provides O(log n) push and pop operations for efficient pathfinding
 */
export class BinaryHeap<T> {
  private data: T[] = [];
  private compare: (a: T, b: T) => number;

  /**
   * Creates a new BinaryHeap
   * @param compare - Comparison function that returns negative if a < b, positive if a > b, 0 if equal
   */
  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  /**
   * Adds an item to the heap - O(log n)
   * @param item - Item to add
   */
  push(item: T): void {
    this.data.push(item);
    this.bubbleUp(this.data.length - 1);
  }

  /**
   * Removes and returns the smallest item - O(log n)
   * @returns The smallest item or undefined if heap is empty
   */
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const result = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.bubbleDown(0);
    }
    return result;
  }

  /**
   * Returns the smallest item without removing it - O(1)
   * @returns The smallest item or undefined if heap is empty
   */
  peek(): T | undefined {
    return this.data[0];
  }

  /**
   * Returns the number of items in the heap
   * @returns Size of the heap
   */
  size(): number {
    return this.data.length;
  }

  /**
   * Removes all items from the heap
   */
  clear(): void {
    this.data.length = 0;
  }

  /**
   * Checks if the heap is empty
   * @returns True if heap is empty
   */
  isEmpty(): boolean {
    return this.data.length === 0;
  }

  /**
   * Moves an item up the heap to maintain heap property
   */
  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.compare(this.data[index], this.data[parent]) >= 0) break;
      [this.data[index], this.data[parent]] = [this.data[parent], this.data[index]];
      index = parent;
    }
  }

  /**
   * Moves an item down the heap to maintain heap property
   */
  private bubbleDown(index: number): void {
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let smallest = index;

      if (left < this.data.length && 
          this.compare(this.data[left], this.data[smallest]) < 0) {
        smallest = left;
      }
      if (right < this.data.length && 
          this.compare(this.data[right], this.data[smallest]) < 0) {
        smallest = right;
      }

      if (smallest === index) break;
      [this.data[index], this.data[smallest]] = [this.data[smallest], this.data[index]];
      index = smallest;
    }
  }
}
