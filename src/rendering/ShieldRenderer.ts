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
      const pulseSpeed = 2.0 + (1.0 - shieldPercent) * 3.0; // Faster pulse when damaged
      const baseAlpha = 0.2 + (1.0 - shieldPercent) * 0.3; // More visible when damaged
      const pulseAmount = 0.15 * shieldPercent; // Less pulse when damaged
      
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
      const radius = 50; // Base shield radius

      // Outer glow ring (wider, more transparent)
      this.graphics.circle(x, y, radius + 8);
      this.graphics.stroke({ width: 8, color: shieldColor, alpha: alpha * 0.3 });

      // Middle ring
      this.graphics.circle(x, y, radius + 4);
      this.graphics.stroke({ width: 4, color: shieldColor, alpha: alpha * 0.5 });

      // Inner shield bubble (main visual)
      this.graphics.circle(x, y, radius);
      this.graphics.fill({ color: shieldColor, alpha: alpha * 0.15 });
      this.graphics.stroke({ width: 2, color: shieldColor, alpha: alpha });
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
    this.shieldAlphaMap.set(entityId, 0.8);
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
