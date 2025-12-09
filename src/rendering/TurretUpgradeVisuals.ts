/**
 * Turret Upgrade Visual Indicators
 * Provides visual feedback for turret upgrade levels through tint, scale, and glow effects
 */
import { Container, Graphics } from 'pixi.js';
import { defineQuery, hasComponent } from 'bitecs';
import { Position, Turret, TurretUpgrade, CompositeSpriteRef } from '../ecs/components';
import type { GameWorld } from '../ecs/world';

// Query for turrets with upgrade component
const turretQuery = defineQuery([Position, Turret, TurretUpgrade, CompositeSpriteRef]);

/**
 * Visual upgrade level indicator configuration
 */
interface UpgradeVisualConfig {
  scale: number;      // Scale multiplier
  tint: number;       // Color tint (hex)
  glowRadius: number; // Glow effect radius (0 = no glow)
  glowColor: number;  // Glow color
  glowAlpha: number;  // Glow transparency
}

/**
 * Get visual config based on total upgrade level
 */
function getVisualConfigForLevel(totalUpgradeLevel: number): UpgradeVisualConfig {
  if (totalUpgradeLevel === 0) {
    // No upgrades - default appearance
    return {
      scale: 1.0,
      tint: 0xFFFFFF,
      glowRadius: 0,
      glowColor: 0xFFFFFF,
      glowAlpha: 0
    };
  } else if (totalUpgradeLevel <= 3) {
    // Low upgrades - slight scale increase, blue tint
    return {
      scale: 1.1,
      tint: 0xDDEEFF,
      glowRadius: 8,
      glowColor: 0x66AAFF,
      glowAlpha: 0.3
    };
  } else if (totalUpgradeLevel <= 7) {
    // Medium upgrades - moderate scale increase, cyan tint
    return {
      scale: 1.2,
      tint: 0xCCFFFF,
      glowRadius: 12,
      glowColor: 0x00DDFF,
      glowAlpha: 0.5
    };
  } else if (totalUpgradeLevel <= 11) {
    // High upgrades - significant scale increase, yellow tint
    return {
      scale: 1.3,
      tint: 0xFFFFDD,
      glowRadius: 16,
      glowColor: 0xFFDD00,
      glowAlpha: 0.6
    };
  } else {
    // Max upgrades - maximum scale, golden tint, strong glow
    return {
      scale: 1.4,
      tint: 0xFFEEAA,
      glowRadius: 20,
      glowColor: 0xFFAA00,
      glowAlpha: 0.8
    };
  }
}

/**
 * Manages visual indicators for turret upgrades
 */
export class TurretUpgradeVisuals {
  private world: GameWorld;
  private glowContainer: Container;
  private glowGraphics: Map<number, Graphics> = new Map();
  private lastUpgradeLevels: Map<number, number> = new Map();

  constructor(world: GameWorld, glowContainer: Container) {
    this.world = world;
    this.glowContainer = glowContainer;
  }

  /**
   * Update visual indicators for all turrets
   * Should be called each frame in the rendering system
   */
  update(): void {
    const turrets = turretQuery(this.world);

    for (let i = 0; i < turrets.length; i++) {
      const eid = turrets[i];

      // Calculate total upgrade level
      const totalLevel = 
        TurretUpgrade.damageLevel[eid] +
        TurretUpgrade.rangeLevel[eid] +
        TurretUpgrade.fireRateLevel[eid] +
        TurretUpgrade.multiTargetLevel[eid] +
        TurretUpgrade.specialLevel[eid];

      // Check if upgrade level changed
      const lastLevel = this.lastUpgradeLevels.get(eid) || 0;
      if (totalLevel !== lastLevel) {
        this.updateTurretVisuals(eid, totalLevel);
        this.lastUpgradeLevels.set(eid, totalLevel);
      }
    }

    // Clean up glow graphics for removed turrets
    this.cleanupRemovedTurrets(turrets);
  }

  /**
   * Update visual appearance of a specific turret
   */
  private updateTurretVisuals(eid: number, totalLevel: number): void {
    const config = getVisualConfigForLevel(totalLevel);
    const x = Position.x[eid];
    const y = Position.y[eid];

    // Update or create glow graphic
    if (config.glowRadius > 0) {
      let glow = this.glowGraphics.get(eid);
      
      if (!glow) {
        glow = new Graphics();
        this.glowContainer.addChild(glow);
        this.glowGraphics.set(eid, glow);
      }

      // Redraw glow
      glow.clear();
      glow.circle(0, 0, config.glowRadius);
      glow.fill({ color: config.glowColor, alpha: config.glowAlpha });
      glow.position.set(x, y);
    } else {
      // Remove glow if level is 0
      const glow = this.glowGraphics.get(eid);
      if (glow) {
        glow.destroy();
        this.glowGraphics.delete(eid);
      }
    }

    // Note: Scale and tint would be applied to sprites in spriteManager
    // Since we're using ParticleContainer, we can't modify tint/scale per particle
    // These visual configs are here for future enhancement if needed
  }

  /**
   * Clean up glow graphics for turrets that no longer exist
   */
  private cleanupRemovedTurrets(currentTurrets: number[] | Uint32Array): void {
    const currentIds = new Set(Array.from(currentTurrets));
    
    for (const [eid, glow] of this.glowGraphics) {
      if (!currentIds.has(eid)) {
        glow.destroy();
        this.glowGraphics.delete(eid);
        this.lastUpgradeLevels.delete(eid);
      }
    }
  }

  /**
   * Get the visual config for a turret's current upgrade level
   * Useful for testing and debugging
   */
  getConfigForTurret(eid: number): UpgradeVisualConfig | null {
    if (!hasComponent(this.world, TurretUpgrade, eid)) {
      return null;
    }

    const totalLevel = 
      TurretUpgrade.damageLevel[eid] +
      TurretUpgrade.rangeLevel[eid] +
      TurretUpgrade.fireRateLevel[eid] +
      TurretUpgrade.multiTargetLevel[eid] +
      TurretUpgrade.specialLevel[eid];

    return getVisualConfigForLevel(totalLevel);
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    for (const glow of this.glowGraphics.values()) {
      glow.destroy();
    }
    this.glowGraphics.clear();
    this.lastUpgradeLevels.clear();
  }
}
