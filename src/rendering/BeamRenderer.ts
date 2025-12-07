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
  [TurretType.TORPEDO_LAUNCHER]: 0xFF0000, // Red for torpedoes (if beams are added)
  [TurretType.TETRYON_BEAM]: 0x00CCFF,    // Cyan for tetryons
  [TurretType.PLASMA_CANNON]: 0xFF00FF,   // Magenta for plasma
  [TurretType.POLARON_BEAM]: 0xFFFF00     // Yellow for polarons
} as const;

/**
 * Charge effect for beam weapons
 */
export interface ChargeEffect {
  turretId: number;
  x: number;
  y: number;
  progress: number;  // 0-1
  duration: number;
  color: number;
}

/**
 * BeamRenderer renders weapon beam effects
 */
export class BeamRenderer {
  private app: Application;
  private graphics: Graphics;
  private container: Container;
  private initialized: boolean = false;
  private glowContainer: Container | null = null;
  private charges: Map<number, ChargeEffect> = new Map();

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
      case TurretType.TETRYON_BEAM:
        return BEAM_COLORS[TurretType.TETRYON_BEAM];
      case TurretType.PLASMA_CANNON:
        return BEAM_COLORS[TurretType.PLASMA_CANNON];
      case TurretType.POLARON_BEAM:
        return BEAM_COLORS[TurretType.POLARON_BEAM];
      default:
        return BEAM_COLORS[TurretType.PHASER_ARRAY];
    }
  }

  /**
   * Start charging effect for a turret
   * @param turretId - Entity ID of the turret
   * @param x - X position of the turret
   * @param y - Y position of the turret
   * @param duration - Duration of the charge in seconds
   * @param turretType - Type of turret (for color)
   */
  startCharge(turretId: number, x: number, y: number, duration: number, turretType: number): void {
    const color = this.getBeamColor(turretType);
    this.charges.set(turretId, {
      turretId,
      x,
      y,
      progress: 0,
      duration,
      color
    });
  }

  /**
   * Update charging effects
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  updateCharges(deltaTime: number): void {
    for (const [turretId, charge] of this.charges.entries()) {
      charge.progress += deltaTime / charge.duration;
      
      // Remove completed charges
      if (charge.progress >= 1.0) {
        this.charges.delete(turretId);
      }
    }
  }

  /**
   * Render all active charging effects
   */
  private renderCharges(): void {
    for (const charge of this.charges.values()) {
      const radius = 15 * charge.progress;
      const alpha = (1 - charge.progress) * 0.6;
      
      // Draw expanding charge ring
      this.graphics.circle(charge.x, charge.y, radius);
      this.graphics.stroke({ width: 2, color: charge.color, alpha });
      
      // Draw pulsing core
      const coreAlpha = 0.3 + Math.sin(charge.progress * Math.PI * 4) * 0.2;
      this.graphics.circle(charge.x, charge.y, 8);
      this.graphics.fill({ color: charge.color, alpha: coreAlpha });
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

    // Render charging effects first (underneath beams)
    this.renderCharges();

    for (const beam of beams) {
      const color = this.getBeamColor(beam.turretType);
      const intensity = beam.intensity || 1.0;
      
      // Render beam segments with electricity effect
      if (beam.segments && beam.segments.length > 0) {
        this.renderSegmentedBeam(beam, color, intensity);
      } else {
        // Fallback to simple beam if no segments
        this.renderSimpleBeam(beam, color, intensity);
      }
      
      // Add impact effect at beam endpoint
      this.renderImpactEffect(beam.endX, beam.endY, color, intensity);
    }
  }

  /**
   * Render a segmented beam with electricity jitter
   */
  private renderSegmentedBeam(beam: BeamVisual, color: number, intensity: number): void {
    // Draw outer glow layer (widest, most transparent)
    for (const segment of beam.segments) {
      this.graphics.moveTo(segment.startX, segment.startY);
      this.graphics.lineTo(segment.endX, segment.endY);
      this.graphics.stroke({ width: 12, color, alpha: 0.15 * intensity });
    }
    
    // Draw middle glow layer
    for (const segment of beam.segments) {
      this.graphics.moveTo(segment.startX, segment.startY);
      this.graphics.lineTo(segment.endX, segment.endY);
      this.graphics.stroke({ width: 6, color, alpha: 0.4 * intensity });
    }
    
    // Draw main beam segments (brightest)
    for (const segment of beam.segments) {
      this.graphics.moveTo(segment.startX, segment.startY);
      this.graphics.lineTo(segment.endX, segment.endY);
      this.graphics.stroke({ width: 2, color, alpha: 0.9 * intensity });
    }
    
    // Draw core bright line (thinnest, brightest)
    for (const segment of beam.segments) {
      this.graphics.moveTo(segment.startX, segment.startY);
      this.graphics.lineTo(segment.endX, segment.endY);
      this.graphics.stroke({ width: 1, color: 0xFFFFFF, alpha: 0.6 * intensity });
    }
  }

  /**
   * Render a simple beam without segments (fallback)
   */
  private renderSimpleBeam(beam: BeamVisual, color: number, intensity: number): void {
    // Draw glow effect first (wider, more transparent line underneath)
    this.graphics.moveTo(beam.startX, beam.startY);
    this.graphics.lineTo(beam.endX, beam.endY);
    this.graphics.stroke({ width: 6, color, alpha: 0.3 * intensity });

    // Draw main beam line on top
    this.graphics.moveTo(beam.startX, beam.startY);
    this.graphics.lineTo(beam.endX, beam.endY);
    this.graphics.stroke({ width: 2, color, alpha: 0.9 * intensity });
  }

  /**
   * Render impact effect at beam endpoint
   */
  private renderImpactEffect(x: number, y: number, color: number, intensity: number): void {
    // Draw impact glow
    this.graphics.circle(x, y, 8);
    this.graphics.fill({ color, alpha: 0.3 * intensity });
    
    // Draw bright impact core
    this.graphics.circle(x, y, 4);
    this.graphics.fill({ color: 0xFFFFFF, alpha: 0.5 * intensity });
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
