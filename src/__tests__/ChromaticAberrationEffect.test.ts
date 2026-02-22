/**
 * Tests for ChromaticAberrationEffect
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RENDERING_CONFIG } from '../config/rendering.config';

const CONFIG = RENDERING_CONFIG.CHROMATIC_ABERRATION;

// Mock PixiJS
vi.mock('pixi.js', async () => {
  class MockGlProgram {
    constructor(_opts?: Record<string, unknown>) { void _opts; }
  }

  class MockFilter {
    enabled = true;
    resources: Record<string, { uniforms: Record<string, number> }>;
    constructor(opts?: Record<string, unknown>) {
      // Build resources from options
      const res = (opts?.resources ?? {}) as Record<string, Record<string, { value: number }>>;
      this.resources = {};
      for (const key of Object.keys(res)) {
        const uniforms: Record<string, number> = {};
        for (const uKey of Object.keys(res[key])) {
          uniforms[uKey] = (res[key][uKey] as { value: number }).value;
        }
        this.resources[key] = { uniforms };
      }
    }
    destroy = vi.fn();
  }

  class MockContainer {
    visible = true;
    filters: unknown[] | null = null;
    children: unknown[] = [];
    addChild = vi.fn((child: unknown) => this.children.push(child));
    destroy = vi.fn();
  }

  return {
    Application: class MockApplication {
      stage = new MockContainer();
    },
    Filter: MockFilter,
    GlProgram: MockGlProgram,
    Container: MockContainer,
  };
});

import { Application } from 'pixi.js';
import { ChromaticAberrationEffect } from '../rendering/ChromaticAberrationEffect';

describe('ChromaticAberrationEffect', () => {
  let effect: ChromaticAberrationEffect;
  let app: Application;

  beforeEach(() => {
    vi.clearAllMocks();
    effect = new ChromaticAberrationEffect();
    app = new Application();
  });

  describe('initialization', () => {
    it('should initialize without error', () => {
      expect(() => effect.init(app)).not.toThrow();
    });

    it('should add filter to stage', () => {
      effect.init(app);
      expect(app.stage.filters).toBeTruthy();
      expect((app.stage.filters as unknown[]).length).toBeGreaterThan(0);
    });

    it('should start disabled', () => {
      effect.init(app);
      expect(effect.isEnabled()).toBe(false);
    });
  });

  describe('threshold behavior', () => {
    it('should stay disabled when hull is above threshold', () => {
      effect.init(app);
      effect.setHullPercent(0.8);
      effect.update(0.016);
      expect(effect.isEnabled()).toBe(false);
    });

    it('should enable when hull drops below threshold', () => {
      effect.init(app);
      effect.setHullPercent(CONFIG.ENABLE_THRESHOLD - 0.01);
      effect.update(0.016);
      expect(effect.isEnabled()).toBe(true);
    });

    it('should disable again when hull rises above threshold', () => {
      effect.init(app);
      effect.setHullPercent(0.3);
      effect.update(0.016);
      expect(effect.isEnabled()).toBe(true);

      effect.setHullPercent(0.8);
      effect.update(0.016);
      expect(effect.isEnabled()).toBe(false);
    });
  });

  describe('intensity scaling', () => {
    it('should have higher offset at lower hull', () => {
      effect.init(app);

      effect.setHullPercent(0.4);
      effect.update(0.016);
      const offsetAt40 = effect['filter']!.resources.chromaticUniforms.uniforms.uOffset;

      effect.setHullPercent(0.1);
      effect.update(0.016);
      const offsetAt10 = effect['filter']!.resources.chromaticUniforms.uniforms.uOffset;

      expect(offsetAt10).toBeGreaterThan(offsetAt40);
    });

    it('should reach max offset at 0% hull', () => {
      effect.init(app);
      effect.setHullPercent(0);
      effect.update(0.016);
      const offset = effect['filter']!.resources.chromaticUniforms.uniforms.uOffset;
      // At 0% hull, intensity is 1, offset should be close to MAX_OFFSET
      // (may vary slightly due to pulsing at critical)
      expect(offset).toBeGreaterThan(0);
      expect(offset).toBeLessThanOrEqual(CONFIG.MAX_OFFSET * 1.1); // Allow slight overshoot from pulsing
    });
  });

  describe('pulsing at critical', () => {
    it('should pulse when hull is below critical threshold', () => {
      effect.init(app);
      effect.setHullPercent(CONFIG.CRITICAL_THRESHOLD - 0.05);

      // Take two readings at different times
      effect.update(0.1);
      const offset1 = effect['filter']!.resources.chromaticUniforms.uniforms.uOffset;

      effect.update(0.5);
      const offset2 = effect['filter']!.resources.chromaticUniforms.uniforms.uOffset;

      // Offsets should differ due to pulsing
      expect(offset1).not.toBe(offset2);
    });
  });

  describe('hull percent getter', () => {
    it('should return default hull percent', () => {
      expect(effect.getHullPercent()).toBe(1);
    });

    it('should return set hull percent', () => {
      effect.setHullPercent(0.5);
      expect(effect.getHullPercent()).toBe(0.5);
    });
  });

  describe('destroy', () => {
    it('should clean up without error', () => {
      effect.init(app);
      expect(() => effect.destroy()).not.toThrow();
    });

    it('should report disabled after destroy', () => {
      effect.init(app);
      effect.destroy();
      expect(effect.isEnabled()).toBe(false);
    });
  });
});
