/**
 * Centralized Configuration for Kobayashi Maru
 * 
 * All magic numbers and hard-coded values should be defined in this module.
 * Import configuration from here instead of using inline constants.
 * 
 * ## Organization
 * - `COMBAT_CONFIG` - Combat system settings (beams, projectiles, DPS)
 * - `RENDERING_CONFIG` - Visual settings (particles, sprites, effects)
 * - `UI_CONFIG` - User interface dimensions and colors
 * - `WAVE_CONFIG` - Wave spawning and timing
 * - `PERFORMANCE_CONFIG` - Performance monitoring settings
 * 
 * @example
 * ```typescript
 * import { COMBAT_CONFIG, UI_CONFIG } from '../config';
 * 
 * const beamSegments = COMBAT_CONFIG.BEAM.SEGMENT_COUNT;
 * const buttonWidth = UI_CONFIG.BUTTONS.TOGGLE_WIDTH;
 * ```
 * 
 * @module config
 */

export * from './combat.config';
export * from './rendering.config';
export * from './ui.config';
export * from './wave.config';
export * from './performance.config';
