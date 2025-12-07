/**
 * Beam Renderer for Kobayashi Maru
 * Renders beam weapon visual effects using PixiJS Graphics
 */
import { Application, Graphics, Container } from 'pixi.js';
import { BeamVisual } from '../systems/combatSystem';
import { TurretType } from '../types/constants';

// Colors for different beam types
const BEAM_COLORS = {
  [TurretType.PHASER_ARRAY]: 0xFF9900,    // Orange for phasers
  [TurretType.DISRUPTOR_BANK]: 0x00FF00,  // Green for disruptors
  [TurretType.TORPEDO_LAUNCHER]: 0xFF0000  // Red for torpedoes (if beams are added)
} as const;

/**
 * BeamRenderer renders weapon beam effects
 */
export class BeamRenderer {
  private app: Application;
  private graphics: Graphics;
  private container: Container;
  private initialized: boolean = false;
  private glowContainer: Container | null = null;

  constructor(app: Application) {
    this.app = app;
    this.graphics = new Graphics();
    this.container = new Container();
  }

  /**
   * Initialize the beam renderer
   * @param glowContainer Optional glow container for rendering beams with glow effects
   */
  init(glowContainer?: Container): void {
    if (this.initialized) {
      return;
    }

    this.glowContainer = glowContainer || null;
    this.container.addChild(this.graphics);
    
    // Add to glow container if provided, otherwise add to stage
    if (this.glowContainer) {
      this.glowContainer.addChild(this.container);
    } else {
      this.app.stage.addChild(this.container);
    }

    this.initialized = true;
  }

  /**
   * Get beam color for a turret type
   */
  private getBeamColor(turretType: number): number {
    switch (turretType) {
      case TurretType.PHASER_ARRAY:
        return BEAM_COLORS[TurretType.PHASER_ARRAY];
      case TurretType.DISRUPTOR_BANK:
        return BEAM_COLORS[TurretType.DISRUPTOR_BANK];
      default:
        return BEAM_COLORS[TurretType.PHASER_ARRAY];
    }
  }

  /**
   * Render beam visuals for the current frame
   * @param beams Array of beam visuals to render
   */
  render(beams: BeamVisual[]): void {
    if (!this.initialized) {
      return;
    }

    // Clear previous frame's graphics
    this.graphics.clear();

    for (const beam of beams) {
      const color = this.getBeamColor(beam.turretType);
      
      // Draw glow effect first (wider, more transparent line underneath)
      this.graphics.moveTo(beam.startX, beam.startY);
      this.graphics.lineTo(beam.endX, beam.endY);
      this.graphics.stroke({ width: 6, color, alpha: 0.3 });

      // Draw main beam line on top
      this.graphics.moveTo(beam.startX, beam.startY);
      this.graphics.lineTo(beam.endX, beam.endY);
      this.graphics.stroke({ width: 2, color, alpha: 0.9 });
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.graphics.destroy();
    this.container.destroy({ children: true });
    this.initialized = false;
  }
}
