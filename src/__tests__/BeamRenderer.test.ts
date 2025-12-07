/**
 * Tests for BeamRenderer
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Application, Container } from 'pixi.js';
import { BeamRenderer } from '../rendering/BeamRenderer';
import { BeamVisual } from '../systems/combatSystem';
import { TurretType } from '../types/constants';

// Mock PixiJS
vi.mock('pixi.js', async () => {
  const actual = await vi.importActual('pixi.js') as object;
  
  // Mock Graphics class
  class MockGraphics {
    clear = vi.fn().mockReturnThis();
    moveTo = vi.fn().mockReturnThis();
    lineTo = vi.fn().mockReturnThis();
    circle = vi.fn().mockReturnThis();
    rect = vi.fn().mockReturnThis();
    stroke = vi.fn().mockReturnThis();
    fill = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  // Mock Container class
  class MockContainer {
    addChild = vi.fn();
    removeChild = vi.fn();
    destroy = vi.fn();
  }

  // Mock Application
  class MockApplication {
    stage = new MockContainer();
    canvas = document.createElement('canvas');
  }

  return {
    ...actual,
    Application: MockApplication,
    Container: MockContainer,
    Graphics: MockGraphics,
  };
});

describe('BeamRenderer', () => {
  let app: Application;
  let beamRenderer: BeamRenderer;

  beforeEach(() => {
    app = new Application();
    beamRenderer = new BeamRenderer(app);
  });

  describe('initialization', () => {
    it('should initialize successfully', () => {
      expect(beamRenderer).toBeDefined();
      beamRenderer.init();
      // Should not throw
    });

    it('should initialize with glow container', () => {
      const glowContainer = new Container();
      beamRenderer.init(glowContainer);
      // Should not throw
    });

    it('should not reinitialize if already initialized', () => {
      beamRenderer.init();
      beamRenderer.init(); // Second call should be no-op
      // Should not throw
    });
  });

  describe('beam rendering', () => {
    beforeEach(() => {
      beamRenderer.init();
    });

    it('should render beams with segments', () => {
      const beam: BeamVisual = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        turretType: TurretType.PHASER_ARRAY,
        intensity: 1.0,
        age: 0,
        segments: [
          { startX: 100, startY: 100, endX: 120, endY: 120, offset: 2 },
          { startX: 120, startY: 120, endX: 140, endY: 140, offset: 1 },
          { startX: 140, startY: 140, endX: 160, endY: 160, offset: -1 },
          { startX: 160, startY: 160, endX: 180, endY: 180, offset: 2 },
          { startX: 180, startY: 180, endX: 200, endY: 200, offset: 0 }
        ]
      };

      beamRenderer.render([beam]);
      // Should not throw
    });

    it('should render beams without segments (fallback)', () => {
      const beam: BeamVisual = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        turretType: TurretType.DISRUPTOR_BANK,
        intensity: 1.0,
        age: 0,
        segments: []
      };

      beamRenderer.render([beam]);
      // Should not throw
    });

    it('should handle multiple beams', () => {
      const beams: BeamVisual[] = [
        {
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 200,
          turretType: TurretType.PHASER_ARRAY,
          intensity: 1.0,
          age: 0,
          segments: [
            { startX: 100, startY: 100, endX: 200, endY: 200, offset: 0 }
          ]
        },
        {
          startX: 300,
          startY: 300,
          endX: 400,
          endY: 400,
          turretType: TurretType.DISRUPTOR_BANK,
          intensity: 0.8,
          age: 0.1,
          segments: [
            { startX: 300, startY: 300, endX: 400, endY: 400, offset: 0 }
          ]
        }
      ];

      beamRenderer.render(beams);
      // Should not throw
    });

    it('should handle different turret types with correct colors', () => {
      const turretTypes = [
        TurretType.PHASER_ARRAY,
        TurretType.DISRUPTOR_BANK,
        TurretType.TETRYON_BEAM,
        TurretType.PLASMA_CANNON,
        TurretType.POLARON_BEAM
      ];

      for (const turretType of turretTypes) {
        const beam: BeamVisual = {
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 200,
          turretType,
          intensity: 1.0,
          age: 0,
          segments: [
            { startX: 100, startY: 100, endX: 200, endY: 200, offset: 0 }
          ]
        };

        beamRenderer.render([beam]);
        // Should not throw
      }
    });

    it('should handle beams with varying intensity', () => {
      const intensities = [0.0, 0.25, 0.5, 0.75, 1.0];

      for (const intensity of intensities) {
        const beam: BeamVisual = {
          startX: 100,
          startY: 100,
          endX: 200,
          endY: 200,
          turretType: TurretType.PHASER_ARRAY,
          intensity,
          age: 0,
          segments: [
            { startX: 100, startY: 100, endX: 200, endY: 200, offset: 0 }
          ]
        };

        beamRenderer.render([beam]);
        // Should not throw
      }
    });
  });

  describe('charging effects', () => {
    beforeEach(() => {
      beamRenderer.init();
    });

    it('should start a charge effect', () => {
      beamRenderer.startCharge(1, 100, 100, 1.0, TurretType.PHASER_ARRAY);
      // Should not throw
    });

    it('should update charge effects over time', () => {
      beamRenderer.startCharge(1, 100, 100, 1.0, TurretType.PHASER_ARRAY);
      beamRenderer.updateCharges(0.5);
      // Should not throw
    });

    it('should remove completed charges', () => {
      beamRenderer.startCharge(1, 100, 100, 1.0, TurretType.PHASER_ARRAY);
      beamRenderer.updateCharges(1.5); // Complete the charge
      beamRenderer.render([]);
      // Should not throw
    });

    it('should handle multiple charge effects', () => {
      beamRenderer.startCharge(1, 100, 100, 1.0, TurretType.PHASER_ARRAY);
      beamRenderer.startCharge(2, 200, 200, 0.5, TurretType.DISRUPTOR_BANK);
      beamRenderer.startCharge(3, 300, 300, 1.5, TurretType.TETRYON_BEAM);
      
      beamRenderer.updateCharges(0.5);
      beamRenderer.render([]);
      // Should not throw
    });

    it('should render charges before beams', () => {
      beamRenderer.startCharge(1, 100, 100, 1.0, TurretType.PHASER_ARRAY);
      
      const beam: BeamVisual = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        turretType: TurretType.PHASER_ARRAY,
        intensity: 1.0,
        age: 0,
        segments: [
          { startX: 100, startY: 100, endX: 200, endY: 200, offset: 0 }
        ]
      };

      beamRenderer.updateCharges(0.5);
      beamRenderer.render([beam]);
      // Should not throw
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on destroy', () => {
      beamRenderer.init();
      
      const beam: BeamVisual = {
        startX: 100,
        startY: 100,
        endX: 200,
        endY: 200,
        turretType: TurretType.PHASER_ARRAY,
        intensity: 1.0,
        age: 0,
        segments: [
          { startX: 100, startY: 100, endX: 200, endY: 200, offset: 0 }
        ]
      };

      beamRenderer.render([beam]);
      beamRenderer.destroy();
      // Should not throw
    });
  });
});
