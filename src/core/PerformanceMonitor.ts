/**
 * Performance Monitor for Kobayashi Maru
 * Tracks frame time, system timings, and performance metrics
 */

/**
 * Performance metrics collected by the monitor
 */
export interface PerformanceMetrics {
  fps: number;
  frameTime: number;       // Total frame time in ms
  renderTime: number;      // Time spent rendering
  systemTimes: Map<string, number>; // Time per system
  entityCount: number;
  drawCalls: number;
  memoryUsed: number;      // If available via performance API
}

/**
 * Frame budget configuration for performance warnings
 */
export const FRAME_BUDGET = {
  TOTAL: 16.67,           // 60 FPS
  MOVEMENT: 2.0,
  COLLISION: 2.0,
  AI: 2.0,
  COMBAT: 2.0,
  TARGETING: 1.0,
  PROJECTILE: 1.0,
  DAMAGE: 1.0,
  RENDERING: 5.0,
  OTHER: 3.67
} as const;

// Rolling average window size
const AVERAGE_WINDOW_SIZE = 60;

/**
 * PerformanceMonitor class
 * Tracks detailed performance metrics for each game system
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetrics;
  private systemTimings: Map<string, number[]>;
  private systemStartTimes: Map<string, number>;
  private frameStartTime: number = 0;
  private frameTimes: number[] = [];
  private renderStartTime: number = 0;
  private renderTimes: number[] = [];
  private budgetWarnings: Map<string, boolean> = new Map();

  constructor() {
    this.metrics = {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      systemTimes: new Map(),
      entityCount: 0,
      drawCalls: 0,
      memoryUsed: 0
    };
    this.systemTimings = new Map();
    this.systemStartTimes = new Map();
  }

  /**
   * Starts timing a system
   * @param systemName - Name of the system to measure
   */
  startMeasure(systemName: string): void {
    this.systemStartTimes.set(systemName, performance.now());
  }

  /**
   * Ends timing a system
   * @param systemName - Name of the system to stop measuring
   */
  endMeasure(systemName: string): void {
    const startTime = this.systemStartTimes.get(systemName);
    if (startTime === undefined) {
      return;
    }

    const elapsed = performance.now() - startTime;
    
    // Store in rolling window
    if (!this.systemTimings.has(systemName)) {
      this.systemTimings.set(systemName, []);
    }
    const timings = this.systemTimings.get(systemName)!;
    timings.push(elapsed);
    if (timings.length > AVERAGE_WINDOW_SIZE) {
      timings.shift();
    }

    // Update current metric
    this.metrics.systemTimes.set(systemName, elapsed);

    // Check budget (case-insensitive match)
    const budgetKey = systemName.toUpperCase() as keyof typeof FRAME_BUDGET;
    const budget = FRAME_BUDGET[budgetKey] ?? FRAME_BUDGET.OTHER;
    if (elapsed > budget && !this.budgetWarnings.get(systemName)) {
      this.budgetWarnings.set(systemName, true);
      console.warn(`Performance: ${systemName} exceeded budget (${elapsed.toFixed(2)}ms > ${budget}ms)`);
    } else if (elapsed <= budget) {
      this.budgetWarnings.set(systemName, false);
    }
  }

  /**
   * Starts frame timing
   */
  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * Ends frame timing
   */
  endFrame(): void {
    const elapsed = performance.now() - this.frameStartTime;
    this.frameTimes.push(elapsed);
    if (this.frameTimes.length > AVERAGE_WINDOW_SIZE) {
      this.frameTimes.shift();
    }
    this.metrics.frameTime = elapsed;
    this.metrics.fps = 1000 / elapsed;

    // Check total frame budget
    if (elapsed > FRAME_BUDGET.TOTAL && !this.budgetWarnings.get('TOTAL')) {
      this.budgetWarnings.set('TOTAL', true);
      console.warn(`Performance: Total frame time exceeded budget (${elapsed.toFixed(2)}ms > ${FRAME_BUDGET.TOTAL}ms)`);
    } else if (elapsed <= FRAME_BUDGET.TOTAL) {
      this.budgetWarnings.set('TOTAL', false);
    }
  }

  /**
   * Starts render timing
   */
  startRender(): void {
    this.renderStartTime = performance.now();
  }

  /**
   * Ends render timing
   */
  endRender(): void {
    const elapsed = performance.now() - this.renderStartTime;
    this.renderTimes.push(elapsed);
    if (this.renderTimes.length > AVERAGE_WINDOW_SIZE) {
      this.renderTimes.shift();
    }
    this.metrics.renderTime = elapsed;
  }

  /**
   * Updates entity count metric
   * @param count - Number of entities
   */
  setEntityCount(count: number): void {
    this.metrics.entityCount = count;
  }

  /**
   * Updates draw calls metric
   * @param count - Number of draw calls
   */
  setDrawCalls(count: number): void {
    this.metrics.drawCalls = count;
  }

  /**
   * Gets current performance metrics
   * @returns Current metrics snapshot
   */
  getMetrics(): PerformanceMetrics {
    // Update memory if available
    const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    if (perfMemory) {
      this.metrics.memoryUsed = perfMemory.usedJSHeapSize / (1024 * 1024); // Convert to MB
    }
    return { ...this.metrics, systemTimes: new Map(this.metrics.systemTimes) };
  }

  /**
   * Gets rolling average metrics
   * @returns Averaged metrics
   */
  getAverages(): PerformanceMetrics {
    const avgFrameTime = this.calculateAverage(this.frameTimes);
    const avgRenderTime = this.calculateAverage(this.renderTimes);

    const avgSystemTimes = new Map<string, number>();
    for (const [name, timings] of this.systemTimings) {
      avgSystemTimes.set(name, this.calculateAverage(timings));
    }

    // Update memory if available
    const perfMemory = (performance as unknown as { memory?: { usedJSHeapSize: number } }).memory;
    const memoryUsed = perfMemory ? perfMemory.usedJSHeapSize / (1024 * 1024) : 0;

    return {
      fps: avgFrameTime > 0 ? 1000 / avgFrameTime : 0,
      frameTime: avgFrameTime,
      renderTime: avgRenderTime,
      systemTimes: avgSystemTimes,
      entityCount: this.metrics.entityCount,
      drawCalls: this.metrics.drawCalls,
      memoryUsed
    };
  }

  /**
   * Logs a detailed performance report to the console
   */
  logReport(): void {
    const avg = this.getAverages();
    const current = this.getMetrics();

    console.group('Performance Report');
    console.log(`FPS: ${avg.fps.toFixed(1)} (current: ${current.fps.toFixed(1)})`);
    console.log(`Frame Time: ${avg.frameTime.toFixed(2)}ms (current: ${current.frameTime.toFixed(2)}ms)`);
    console.log(`Render Time: ${avg.renderTime.toFixed(2)}ms (current: ${current.renderTime.toFixed(2)}ms)`);
    console.log(`Entities: ${current.entityCount}`);
    console.log(`Memory: ${avg.memoryUsed.toFixed(1)}MB`);
    
    console.group('System Timings (avg):');
    for (const [name, time] of avg.systemTimes) {
      const budgetKey = name.toUpperCase() as keyof typeof FRAME_BUDGET;
      const budget = FRAME_BUDGET[budgetKey] ?? FRAME_BUDGET.OTHER;
      const status = time > budget ? '⚠️' : '✓';
      console.log(`  ${status} ${name}: ${time.toFixed(2)}ms (budget: ${budget}ms)`);
    }
    console.groupEnd();
    console.groupEnd();
  }

  /**
   * Gets per-system timing breakdown for UI display
   * @returns Array of system timings with names and values
   */
  getSystemTimingBreakdown(): Array<{ name: string; time: number; budget: number; overBudget: boolean }> {
    const result: Array<{ name: string; time: number; budget: number; overBudget: boolean }> = [];
    
    for (const [name, time] of this.metrics.systemTimes) {
      const budgetKey = name.toUpperCase() as keyof typeof FRAME_BUDGET;
      const budget = FRAME_BUDGET[budgetKey] ?? FRAME_BUDGET.OTHER;
      result.push({
        name,
        time,
        budget,
        overBudget: time > budget
      });
    }
    
    return result;
  }

  /**
   * Resets all collected metrics
   */
  reset(): void {
    this.frameTimes = [];
    this.renderTimes = [];
    this.systemTimings.clear();
    this.systemStartTimes.clear();
    this.budgetWarnings.clear();
    this.metrics = {
      fps: 0,
      frameTime: 0,
      renderTime: 0,
      systemTimes: new Map(),
      entityCount: 0,
      drawCalls: 0,
      memoryUsed: 0
    };
  }

  /**
   * Calculates average of an array of numbers
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }
}
