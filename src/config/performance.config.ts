/**
 * Performance Monitoring Configuration
 * 
 * Settings for FPS tracking, memory monitoring, and debug thresholds.
 * 
 * @module config/performance
 */

/**
 * Performance monitoring configuration values.
 * 
 * @example
 * ```typescript
 * import { PERFORMANCE_CONFIG } from '../config';
 * 
 * const windowSize = PERFORMANCE_CONFIG.MONITORING.AVERAGE_WINDOW_SIZE;
 * const threshold = PERFORMANCE_CONFIG.DEBUG.BUDGET_THRESHOLD;
 * ```
 */
export const PERFORMANCE_CONFIG = {
    /**
     * Performance monitoring settings.
     */
    MONITORING: {
        /** Number of frames to average for FPS calculation */
        AVERAGE_WINDOW_SIZE: 60,
        /** Interval between memory updates (milliseconds) */
        MEMORY_UPDATE_INTERVAL_MS: 1000,
    },

    /**
     * Debug system thresholds.
     */
    DEBUG: {
        /** Frame time budget threshold for warnings (milliseconds) */
        BUDGET_THRESHOLD_MS: 2.0,
    },

    /**
     * Quality presets for auto-adjustment.
     */
    QUALITY: {
        /** Low quality particle count multiplier */
        LOW_PARTICLE_MULTIPLIER: 0.25,
        /** Medium quality particle count multiplier */
        MEDIUM_PARTICLE_MULTIPLIER: 0.5,
        /** High quality particle count multiplier */
        HIGH_PARTICLE_MULTIPLIER: 1.0,
    },
} as const;

export type PerformanceConfig = typeof PERFORMANCE_CONFIG;
