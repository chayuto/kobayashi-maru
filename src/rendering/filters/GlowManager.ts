/**
 * GlowManager for Kobayashi Maru
 * Manages dynamic lighting and glow effects using PixiJS filters
 */
import { Container, BlurFilter, ColorMatrixFilter } from 'pixi.js';

/**
 * Configuration for glow effects
 */
export interface GlowConfig {
  strength: number;    // 0-10, bloom intensity (maps to blur strength)
  blur: number;        // 0-20, blur amount
  quality: number;     // 1-10, filter quality
  threshold: number;   // 0-1, brightness threshold (not used in basic implementation)
}

/**
 * Glow layer types for different visual elements
 */
export enum GlowLayer {
  WEAPONS = 'weapons',        // Energy weapons (beams, phasers)
  PROJECTILES = 'projectiles', // Torpedoes and projectiles
  EXPLOSIONS = 'explosions',   // Particle effects
  SHIELDS = 'shields',         // Shield visuals
  UI = 'ui'                    // UI elements that need glow
}

/**
 * Preset glow configurations for different effects
 */
export const GLOW_PRESETS: Record<string, GlowConfig> = {
  subtle: {
    strength: 2,
    blur: 4,
    quality: 3,
    threshold: 0.5
  },
  medium: {
    strength: 5,
    blur: 8,
    quality: 5,
    threshold: 0.5
  },
  intense: {
    strength: 8,
    blur: 12,
    quality: 7,
    threshold: 0.5
  },
  weapons: {
    strength: 6,
    blur: 10,
    quality: 5,
    threshold: 0.6
  },
  shields: {
    strength: 4,
    blur: 8,
    quality: 4,
    threshold: 0.5
  },
  explosions: {
    strength: 9,
    blur: 15,
    quality: 6,
    threshold: 0.4
  }
};

/**
 * Constants for glow calculations
 */
const MAX_STRENGTH_VALUE = 10;

/**
 * GlowManager handles glow/bloom effects for various game elements
 */
export class GlowManager {
  private glowLayers: Map<GlowLayer, Container> = new Map();
  private filters: Map<GlowLayer, BlurFilter[]> = new Map();
  private colorMatrixFilters: Map<GlowLayer, ColorMatrixFilter> = new Map();
  private enabled: boolean = true;
  private initialized: boolean = false;

  constructor() {
    // Initialize empty maps
  }

  /**
   * Calculate brightness multiplier from strength value
   */
  private calculateBrightnessMultiplier(strength: number): number {
    return 1 + (strength / MAX_STRENGTH_VALUE);
  }

  /**
   * Initialize the glow manager and create layers
   */
  init(): void {
    if (this.initialized) {
      return;
    }

    // Create containers for each glow layer
    for (const layerType of Object.values(GlowLayer)) {
      const container = new Container();
      this.glowLayers.set(layerType as GlowLayer, container);
    }

    this.initialized = true;
    console.log('GlowManager initialized');
  }

  /**
   * Get a glow layer container
   */
  getLayer(layer: GlowLayer): Container | null {
    return this.glowLayers.get(layer) || null;
  }

  /**
   * Apply glow effect to a specific layer
   */
  applyGlow(layer: GlowLayer, config: GlowConfig): void {
    const container = this.glowLayers.get(layer);
    if (!container) {
      console.warn(`GlowManager: Layer ${layer} not found`);
      return;
    }

    // Create blur filter for glow effect
    const blurFilter = new BlurFilter({
      strength: config.blur,
      quality: config.quality
    });

    // Create color matrix filter for brightness adjustment
    const colorMatrixFilter = new ColorMatrixFilter();
    // Increase brightness based on strength
    const brightnessMultiplier = this.calculateBrightnessMultiplier(config.strength);
    colorMatrixFilter.brightness(brightnessMultiplier, false);

    // Store filters
    this.filters.set(layer, [blurFilter]);
    this.colorMatrixFilters.set(layer, colorMatrixFilter);

    // Apply filters to container
    if (this.enabled) {
      container.filters = [blurFilter, colorMatrixFilter];
    }
  }

  /**
   * Apply preset glow configuration to a layer
   */
  applyPreset(layer: GlowLayer, presetName: keyof typeof GLOW_PRESETS): void {
    const config = GLOW_PRESETS[presetName];
    if (!config) {
      console.warn(`GlowManager: Preset ${presetName} not found`);
      return;
    }
    this.applyGlow(layer, config);
  }

  /**
   * Update glow configuration for a layer
   */
  updateGlow(layer: GlowLayer, config: Partial<GlowConfig>): void {
    const blurFilters = this.filters.get(layer);
    const colorMatrixFilter = this.colorMatrixFilters.get(layer);

    if (!blurFilters || !colorMatrixFilter) {
      console.warn(`GlowManager: No filters found for layer ${layer}`);
      return;
    }

    const blurFilter = blurFilters[0];

    if (config.blur !== undefined) {
      blurFilter.strength = config.blur;
    }

    if (config.quality !== undefined) {
      blurFilter.quality = config.quality;
    }

    if (config.strength !== undefined) {
      const brightnessMultiplier = this.calculateBrightnessMultiplier(config.strength);
      colorMatrixFilter.brightness(brightnessMultiplier, false);
    }
  }

  /**
   * Remove glow effect from a layer
   */
  removeGlow(layer: GlowLayer): void {
    const container = this.glowLayers.get(layer);
    if (!container) {
      return;
    }

    container.filters = null;
    this.filters.delete(layer);
    this.colorMatrixFilters.delete(layer);
  }

  /**
   * Enable or disable all glow effects
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;

    for (const [layer, container] of this.glowLayers) {
      if (enabled) {
        const blurFilters = this.filters.get(layer);
        const colorMatrixFilter = this.colorMatrixFilters.get(layer);
        if (blurFilters && colorMatrixFilter) {
          container.filters = [...blurFilters, colorMatrixFilter];
        }
      } else {
        container.filters = null;
      }
    }
  }

  /**
   * Check if glow effects are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Toggle glow effects on/off
   */
  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Destroy all containers
    for (const container of this.glowLayers.values()) {
      container.destroy({ children: false }); // Don't destroy children, they might be used elsewhere
    }

    // Clear maps
    this.glowLayers.clear();
    this.filters.clear();
    this.colorMatrixFilters.clear();

    this.initialized = false;
  }
}
