/**
 * Input & Gesture Configuration
 *
 * Thresholds for touch gestures and input detection.
 *
 * @module config/input
 */

export const INPUT_CONFIG = {
    /** Gesture detection thresholds */
    GESTURES: {
        /** Minimum distance for swipe detection (pixels) */
        SWIPE_THRESHOLD: 50,
        /** Maximum duration for swipe gesture (milliseconds) */
        SWIPE_TIMEOUT: 300,
        /** Minimum distance for pan detection (pixels) */
        PAN_THRESHOLD: 10,
        /** Minimum distance for pinch detection (pixels) */
        PINCH_THRESHOLD: 10,
    },
} as const;

export type InputConfig = typeof INPUT_CONFIG;
