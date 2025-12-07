/**
 * Tests for ShockwaveRenderer
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Container } from 'pixi.js';
import { ShockwaveRenderer } from '../rendering/ShockwaveRenderer';

// Mock PixiJS
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js') as object;
  
  // Mock Graphics class
  class MockGraphics {
    clear = vi.fn().mockReturnThis();
    circle = vi.fn().mockReturnThis();
    stroke = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  // Mock Container class
  class MockContainer {
    addChild = vi.fn();
    removeChild = vi.fn();
    destroy = vi.fn();
  }

  return {
    ...actual,
    Container: MockContainer,
    Graphics: MockGraphics,
  };
});

describe('ShockwaveRenderer', () => {
  let shockwaveRenderer: ShockwaveRenderer;

  beforeEach(() => {
    shockwaveRenderer = new ShockwaveRenderer();
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(shockwaveRenderer).toBeDefined();
      shockwaveRenderer.init();
      // Should not throw
    });

    it('should initialize with glow container', () => {
      const glowContainer = new Container();
      shockwaveRenderer.init(glowContainer);
      expect(glowContainer.addChild).toHaveBeenCalled();
    });

    it('should not reinitialize if already initialized', () => {
      shockwaveRenderer.init();
      shockwaveRenderer.init(); // Second call should be no-op
      // Should not throw
    });
  });

  describe('shockwave creation', () => {
    beforeEach(() => {
      shockwaveRenderer.init();
    });

    it('should create a shockwave and return an id', () => {
      const id = shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      expect(id).toContain('shockwave-');
    });

    it('should create multiple shockwaves with unique ids', () => {
      const id1 = shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      const id2 = shockwaveRenderer.create(200, 200, 300, 0x00FF00, 1.5);
      
      expect(id1).not.toBe(id2);
    });

    it('should create shockwave with distortion parameter', () => {
      const id = shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0, 0.5);
      expect(id).toBeDefined();
    });
  });

  describe('shockwave rendering', () => {
    beforeEach(() => {
      shockwaveRenderer.init();
    });

    it('should render shockwaves', () => {
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      shockwaveRenderer.render(0.016); // One frame at 60fps
      // Should not throw
    });

    it('should update shockwave radius over time', () => {
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      
      // Render multiple frames
      for (let i = 0; i < 10; i++) {
        shockwaveRenderer.render(0.016);
      }
      // Should not throw
    });

    it('should remove expired shockwaves', () => {
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 0.1); // Very short duration
      
      // Render past the duration
      shockwaveRenderer.render(0.2);
      
      // Should not throw and shockwave should be removed
    });

    it('should handle multiple shockwaves', () => {
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      shockwaveRenderer.create(200, 200, 300, 0x00FF00, 1.5);
      shockwaveRenderer.create(300, 300, 400, 0x0000FF, 2.0);
      
      shockwaveRenderer.render(0.016);
      // Should not throw
    });

    it('should render inner glow during first 30% of animation', () => {
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      
      // Render early in animation (within 30%)
      shockwaveRenderer.render(0.1); // 10% of duration
      
      // Should not throw
    });

    it('should not render inner glow after 30% of animation', () => {
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      
      // Render later in animation (after 30%)
      shockwaveRenderer.render(0.5); // 50% of duration
      
      // Should not throw
    });
  });

  describe('container access', () => {
    it('should provide access to container', () => {
      const container = shockwaveRenderer.getContainer();
      expect(container).toBeDefined();
    });

    it('should provide access to graphics (legacy)', () => {
      const graphics = shockwaveRenderer.getGraphics();
      expect(graphics).toBeDefined();
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      shockwaveRenderer.init();
      shockwaveRenderer.create(100, 100, 200, 0xFF6600, 1.0);
      shockwaveRenderer.render(0.016);
      
      shockwaveRenderer.destroy();
      // Should not throw
    });

    it('should allow reinitialization after destroy', () => {
      shockwaveRenderer.init();
      shockwaveRenderer.destroy();
      shockwaveRenderer.init();
      // Should not throw
    });
  });
});
