/**
 * Shield Renderer for Kobayashi Maru
 * Renders shield visual effects with glow
 */
import { Application, Graphics, Container } from 'pixi.js';
import { defineQuery, IWorld } from 'bitecs';
import { Position, Shield, Health } from '../ecs/components';

// Query for entities with shields
const shieldQuery = defineQuery([Position, Shield, Health]);

/**
 * Shield rendering configuration constants
 */
const SHIELD_CONFIG = {
  BASE_RADIUS: 50,              // Base shield bubble radius in pixels
  OUTER_RING_OFFSET: 8,         // Offset for outer glow ring
  MIDDLE_RING_OFFSET: 4,        // Offset for middle ring
  OUTER_RING_WIDTH: 8,          // Stroke width for outer ring
  MIDDLE_RING_WIDTH: 4,         // Stroke width for middle ring
  INNER_RING_WIDTH: 2,          // Stroke width for inner ring
  // Animation parameters
  BASE_PULSE_SPEED: 2.0,        // Base pulse animation speed
  DAMAGE_PULSE_MULTIPLIER: 3.0, // Additional pulse speed when damaged
  BASE_ALPHA: 0.2,              // Minimum alpha value
  DAMAGE_ALPHA_INCREASE: 0.3,   // Additional alpha when damaged
  PULSE_AMOUNT: 0.15,           // Pulse magnitude for healthy shields
  // Visual parameters
  OUTER_RING_ALPHA: 0.3,        // Alpha for outer glow ring
  MIDDLE_RING_ALPHA: 0.5,       // Alpha for middle ring
  BUBBLE_ALPHA: 0.15,           // Alpha for main shield bubble
  FLASH_ALPHA: 0.8              // Alpha for impact flash effect
} as const;

/**
 * ShieldRenderer renders shield visual effects
 */
export class ShieldRenderer {
  private app: Application;
  private graphics: Graphics;
  private container: Container;
  private glowContainer: Container | null = null;
  private initialized: boolean = false;
  private shieldAlphaMap: Map<number, number> = new Map(); // Track shield flash/fade animation
  private animationTime: number = 0;

  constructor(app: Application) {
    this.app = app;
    this.graphics = new Graphics();
    this.container = new Container();
  }

  /**
   * Initialize the shield renderer
   * @param glowContainer Optional glow container for rendering shields with glow effects
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
    console.log('ShieldRenderer initialized');
  }

  /**
   * Update shield renderer with delta time for animations
   * @param world The ECS world
   * @param deltaTime Time since last frame in seconds
   */
  update(world: IWorld, deltaTime: number): void {
    if (!this.initialized) {
      return;
    }

    // Update animation time
    this.animationTime += deltaTime;

    // Clear previous frame's graphics
    this.graphics.clear();

    const entities = shieldQuery(world);

    for (const eid of entities) {
      const shieldCurrent = Shield.current[eid];
      const shieldMax = Shield.max[eid];

      // Only render shields if they have capacity
      if (shieldMax <= 0) {
        continue;
      }

      const x = Position.x[eid];
      const y = Position.y[eid];

      // Calculate shield percentage
      const shieldPercent = shieldCurrent / shieldMax;

      // Skip rendering if shield is depleted
      if (shieldPercent <= 0) {
        this.shieldAlphaMap.delete(eid);
        continue;
      }

      // Get or initialize alpha for this entity
      let alpha = this.shieldAlphaMap.get(eid) || 0;

      // Animate alpha based on shield strength
      // Full shields pulse gently, damaged shields are more visible
      const pulseSpeed = SHIELD_CONFIG.BASE_PULSE_SPEED + (1.0 - shieldPercent) * SHIELD_CONFIG.DAMAGE_PULSE_MULTIPLIER;
      const baseAlpha = SHIELD_CONFIG.BASE_ALPHA + (1.0 - shieldPercent) * SHIELD_CONFIG.DAMAGE_ALPHA_INCREASE;
      const pulseAmount = SHIELD_CONFIG.PULSE_AMOUNT * shieldPercent;
      
      alpha = baseAlpha + Math.sin(this.animationTime * pulseSpeed) * pulseAmount;
      this.shieldAlphaMap.set(eid, alpha);

      // Shield color based on strength
      let shieldColor: number;
      if (shieldPercent > 0.66) {
        shieldColor = 0x3399FF; // Blue for healthy shields
      } else if (shieldPercent > 0.33) {
        shieldColor = 0xFFCC00; // Yellow/amber for medium shields
      } else {
        shieldColor = 0xFF3333; // Red for critical shields
      }

      // Draw shield bubble/ring
      const radius = SHIELD_CONFIG.BASE_RADIUS;

      // Outer glow ring (wider, more transparent)
      this.graphics.circle(x, y, radius + SHIELD_CONFIG.OUTER_RING_OFFSET);
      this.graphics.stroke({ 
        width: SHIELD_CONFIG.OUTER_RING_WIDTH, 
        color: shieldColor, 
        alpha: alpha * SHIELD_CONFIG.OUTER_RING_ALPHA 
      });

      // Middle ring
      this.graphics.circle(x, y, radius + SHIELD_CONFIG.MIDDLE_RING_OFFSET);
      this.graphics.stroke({ 
        width: SHIELD_CONFIG.MIDDLE_RING_WIDTH, 
        color: shieldColor, 
        alpha: alpha * SHIELD_CONFIG.MIDDLE_RING_ALPHA 
      });

      // Inner shield bubble (main visual)
      this.graphics.circle(x, y, radius);
      this.graphics.fill({ color: shieldColor, alpha: alpha * SHIELD_CONFIG.BUBBLE_ALPHA });
      this.graphics.stroke({ width: SHIELD_CONFIG.INNER_RING_WIDTH, color: shieldColor, alpha: alpha });
    }

    // Clean up alpha map for entities that no longer exist
    const entitySet = new Set(entities);
    for (const eid of this.shieldAlphaMap.keys()) {
      if (!entitySet.has(eid)) {
        this.shieldAlphaMap.delete(eid);
      }
    }
  }

  /**
   * Trigger a shield impact flash effect
   * @param entityId Entity that was hit
   */
  flashShield(entityId: number): void {
    // Set alpha to maximum for flash effect
    this.shieldAlphaMap.set(entityId, SHIELD_CONFIG.FLASH_ALPHA);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.graphics.destroy();
    this.container.destroy({ children: true });
    this.shieldAlphaMap.clear();
    this.initialized = false;
  }
}
