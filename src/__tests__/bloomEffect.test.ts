/**
 * Tests for Bloom/Glow Post-Processing
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock PixiJS before importing modules that use it
vi.mock('pixi.js', async () => {
  class MockBlurFilter {
    strength: number;
    quality: number;
    constructor(options?: { strength?: number; quality?: number }) {
      this.strength = options?.strength ?? 8;
      this.quality = options?.quality ?? 4;
    }
  }

  class MockColorMatrixFilter {
    brightness = vi.fn();
  }

  class MockContainer {
    filters: unknown[] | null = null;
    children: unknown[] = [];
    addChild = vi.fn();
    destroy = vi.fn();
  }

  return {
    Container: MockContainer,
    BlurFilter: MockBlurFilter,
    ColorMatrixFilter: MockColorMatrixFilter,
  };
});

import { GlowManager, GlowLayer, GLOW_PRESETS } from '../rendering/filters/GlowManager';
import { RENDERING_CONFIG } from '../config';

describe('Bloom Effect', () => {
  let glowManager: GlowManager;

  beforeEach(() => {
    glowManager = new GlowManager();
  });

  afterEach(() => {
    if (glowManager) {
      glowManager.destroy();
    }
  });

  describe('GlowManager init', () => {
    it('should create all glow layers when initialized', () => {
      // Arrange & Act
      glowManager.init();

      // Assert
      expect(glowManager.getLayer(GlowLayer.WEAPONS)).not.toBeNull();
      expect(glowManager.getLayer(GlowLayer.PROJECTILES)).not.toBeNull();
      expect(glowManager.getLayer(GlowLayer.EXPLOSIONS)).not.toBeNull();
      expect(glowManager.getLayer(GlowLayer.SHIELDS)).not.toBeNull();
      expect(glowManager.getLayer(GlowLayer.UI)).not.toBeNull();
    });

    it('should create distinct containers for each layer', () => {
      // Arrange & Act
      glowManager.init();

      // Assert
      const weapons = glowManager.getLayer(GlowLayer.WEAPONS);
      const explosions = glowManager.getLayer(GlowLayer.EXPLOSIONS);
      const shields = glowManager.getLayer(GlowLayer.SHIELDS);
      expect(weapons).not.toBe(explosions);
      expect(weapons).not.toBe(shields);
      expect(explosions).not.toBe(shields);
    });
  });

  describe('applyGlow', () => {
    it('should set filters on container when glow is applied', () => {
      // Arrange
      glowManager.init();
      const config = { strength: 5, blur: 10, quality: 5, threshold: 0.5 };

      // Act
      glowManager.applyGlow(GlowLayer.WEAPONS, config);

      // Assert
      const layer = glowManager.getLayer(GlowLayer.WEAPONS);
      expect(layer).not.toBeNull();
      expect(layer!.filters).not.toBeNull();
      expect(layer!.filters!.length).toBe(2); // BlurFilter + ColorMatrixFilter
    });

    it('should not set filters when glow manager is disabled', () => {
      // Arrange
      glowManager.init();
      glowManager.setEnabled(false);
      const config = { strength: 5, blur: 10, quality: 5, threshold: 0.5 };

      // Act
      glowManager.applyGlow(GlowLayer.WEAPONS, config);

      // Assert
      const layer = glowManager.getLayer(GlowLayer.WEAPONS);
      expect(layer).not.toBeNull();
      expect(layer!.filters).toBeNull();
    });
  });

  describe('setEnabled', () => {
    it('should remove filters from all layers when disabled', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });
      glowManager.applyGlow(GlowLayer.EXPLOSIONS, { strength: 9, blur: 15, quality: 6, threshold: 0.4 });

      // Act
      glowManager.setEnabled(false);

      // Assert
      const weapons = glowManager.getLayer(GlowLayer.WEAPONS);
      const explosions = glowManager.getLayer(GlowLayer.EXPLOSIONS);
      expect(weapons!.filters).toBeNull();
      expect(explosions!.filters).toBeNull();
      expect(glowManager.isEnabled()).toBe(false);
    });

    it('should restore filters on all layers when re-enabled', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });
      glowManager.applyGlow(GlowLayer.SHIELDS, { strength: 4, blur: 5, quality: 4, threshold: 0.5 });

      // Act
      glowManager.setEnabled(false);
      glowManager.setEnabled(true);

      // Assert
      const weapons = glowManager.getLayer(GlowLayer.WEAPONS);
      const shields = glowManager.getLayer(GlowLayer.SHIELDS);
      expect(weapons!.filters).not.toBeNull();
      expect(weapons!.filters!.length).toBe(2);
      expect(shields!.filters).not.toBeNull();
      expect(shields!.filters!.length).toBe(2);
      expect(glowManager.isEnabled()).toBe(true);
    });

    it('should not restore filters for layers without glow applied', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });
      // PROJECTILES has no glow applied

      // Act
      glowManager.setEnabled(false);
      glowManager.setEnabled(true);

      // Assert
      const projectiles = glowManager.getLayer(GlowLayer.PROJECTILES);
      expect(projectiles!.filters).toBeNull();
    });
  });

  describe('setIntensity', () => {
    it('should adjust blur filter strength proportionally when intensity is set', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });

      // Act
      glowManager.setIntensity(0.5);

      // Assert - blur strength should be scaled by 0.5 (10 * 0.5 = 5)
      const layer = glowManager.getLayer(GlowLayer.WEAPONS);
      expect(layer!.filters).not.toBeNull();
      // The blur filter is the first filter in the array
      const blurFilter = layer!.filters![0] as unknown as { strength: number };
      expect(blurFilter.strength).toBe(5);
    });

    it('should clamp intensity to 0 when negative value is provided', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });

      // Act
      glowManager.setIntensity(-0.5);

      // Assert - strength should be clamped to 0 (10 * 0 = 0)
      const layer = glowManager.getLayer(GlowLayer.WEAPONS);
      const blurFilter = layer!.filters![0] as unknown as { strength: number };
      expect(blurFilter.strength).toBe(0);
    });

    it('should clamp intensity to 1 when value exceeds 1', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });

      // Act
      glowManager.setIntensity(2.0);

      // Assert - strength should be clamped to 1 (10 * 1 = 10)
      const layer = glowManager.getLayer(GlowLayer.WEAPONS);
      const blurFilter = layer!.filters![0] as unknown as { strength: number };
      expect(blurFilter.strength).toBe(10);
    });

    it('should adjust all layers when intensity is set', () => {
      // Arrange
      glowManager.init();
      glowManager.applyGlow(GlowLayer.WEAPONS, { strength: 5, blur: 10, quality: 5, threshold: 0.5 });
      glowManager.applyGlow(GlowLayer.EXPLOSIONS, { strength: 9, blur: 20, quality: 6, threshold: 0.4 });

      // Act
      glowManager.setIntensity(0.5);

      // Assert
      const weaponsLayer = glowManager.getLayer(GlowLayer.WEAPONS);
      const explosionsLayer = glowManager.getLayer(GlowLayer.EXPLOSIONS);
      const weaponsBlur = weaponsLayer!.filters![0] as unknown as { strength: number };
      const explosionsBlur = explosionsLayer!.filters![0] as unknown as { strength: number };
      expect(weaponsBlur.strength).toBe(5); // 10 * 0.5
      expect(explosionsBlur.strength).toBe(10); // 20 * 0.5
    });
  });

  describe('BLOOM config', () => {
    it('should have BLOOM section in RENDERING_CONFIG', () => {
      // Assert
      expect(RENDERING_CONFIG.BLOOM).toBeDefined();
    });

    it('should have ENABLED property in BLOOM config', () => {
      // Assert
      expect(RENDERING_CONFIG.BLOOM.ENABLED).toBeDefined();
      expect(typeof RENDERING_CONFIG.BLOOM.ENABLED).toBe('boolean');
    });

    it('should have INTENSITY property in BLOOM config', () => {
      // Assert
      expect(RENDERING_CONFIG.BLOOM.INTENSITY).toBeDefined();
      expect(typeof RENDERING_CONFIG.BLOOM.INTENSITY).toBe('number');
    });

    it('should have INTENSITY between 0 and 1', () => {
      // Assert
      expect(RENDERING_CONFIG.BLOOM.INTENSITY).toBeGreaterThanOrEqual(0);
      expect(RENDERING_CONFIG.BLOOM.INTENSITY).toBeLessThanOrEqual(1);
    });

    it('should be enabled by default', () => {
      // Assert
      expect(RENDERING_CONFIG.BLOOM.ENABLED).toBe(true);
    });
  });

  describe('GLOW_PRESETS tuning', () => {
    it('should have weapons preset with blur of 6', () => {
      expect(GLOW_PRESETS.weapons.blur).toBe(6);
    });

    it('should have weapons preset with quality of 4', () => {
      expect(GLOW_PRESETS.weapons.quality).toBe(4);
    });

    it('should have explosions preset with blur of 15', () => {
      expect(GLOW_PRESETS.explosions.blur).toBe(15);
    });

    it('should have shields preset with blur of 5', () => {
      expect(GLOW_PRESETS.shields.blur).toBe(5);
    });
  });
});
