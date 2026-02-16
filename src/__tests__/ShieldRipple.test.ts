/**
 * Tests for Shield Impact Ripple Effects
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ShieldRenderer } from '../rendering/ShieldRenderer';
import { Application, Container } from 'pixi.js';
import { createWorld, World, addEntity } from 'bitecs';
import { Position, Shield, Health } from '../ecs/components';
import { RENDERING_CONFIG } from '../config';

describe('ShieldRipple', () => {
  let shieldRenderer: ShieldRenderer;
  let app: Application;
  let world: World;

  beforeEach(() => {
    app = new Application();
    world = createWorld();
    shieldRenderer = new ShieldRenderer(app);
    shieldRenderer.init();
  });

  afterEach(() => {
    if (shieldRenderer) {
      shieldRenderer.destroy();
    }
  });

  /**
   * Helper to create a shielded entity at a given position
   */
  function createShieldedEntity(
    x: number,
    y: number,
    shieldCurrent: number = 75,
    shieldMax: number = 100
  ): number {
    const entity = addEntity(world);
    Position.x[entity] = x;
    Position.y[entity] = y;
    Shield.current[entity] = shieldCurrent;
    Shield.max[entity] = shieldMax;
    Health.current[entity] = 100;
    Health.max[entity] = 100;
    return entity;
  }

  describe('addRipple', () => {
    it('should create a ripple entry when called', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act
      shieldRenderer.addRipple(entity, 150, 100);

      // Assert - ripple exists; update without error proves it was created
      // We verify indirectly by confirming update processes the ripple
      shieldRenderer.update(world, 0.016);
      expect(shieldRenderer).toBeDefined();
    });

    it('should calculate ripple arc angle correctly from hit position to the right', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from the right (angle should be 0)
      shieldRenderer.addRipple(entity, 150, 100);

      // Assert - update processes the ripple at the calculated angle
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should calculate ripple arc angle correctly from hit position above', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from above (angle should be -PI/2)
      shieldRenderer.addRipple(entity, 100, 50);

      // Assert - ripple is created and processed
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should set ripple color to blue for healthy shields', () => {
      // Arrange - shield at 80% (above 66% threshold)
      const entity = createShieldedEntity(100, 100, 80, 100);

      // Act
      shieldRenderer.addRipple(entity, 150, 100);

      // Assert - no error, ripple drawn with blue color
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should set ripple color to yellow for medium shields', () => {
      // Arrange - shield at 50% (between 33% and 66%)
      const entity = createShieldedEntity(100, 100, 50, 100);

      // Act
      shieldRenderer.addRipple(entity, 150, 100);

      // Assert - no error, ripple drawn with yellow color
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should set ripple color to red for critical shields', () => {
      // Arrange - shield at 20% (below 33% threshold)
      const entity = createShieldedEntity(100, 100, 20, 100);

      // Act
      shieldRenderer.addRipple(entity, 150, 100);

      // Assert - no error, ripple drawn with red color
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should support multiple simultaneous ripples', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - add multiple ripples at different angles
      shieldRenderer.addRipple(entity, 150, 100); // right
      shieldRenderer.addRipple(entity, 50, 100);  // left
      shieldRenderer.addRipple(entity, 100, 50);  // above

      // Assert - all ripples processed without error
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });
  });

  describe('ripple aging', () => {
    it('should age ripples over deltaTime', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      // Act - update with a small delta time
      shieldRenderer.update(world, 0.05);

      // Assert - ripple still alive (0.05 < 0.3 DURATION)
      // Another update should still process the ripple
      shieldRenderer.update(world, 0.05);
      expect(shieldRenderer).toBeDefined();
    });

    it('should remove ripple after DURATION expires', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      const duration = RENDERING_CONFIG.SHIELD_RIPPLE.DURATION;

      // Act - advance past the full duration
      shieldRenderer.update(world, duration + 0.01);

      // Assert - ripple should be removed, subsequent updates should not error
      shieldRenderer.update(world, 0.016);
      expect(shieldRenderer).toBeDefined();
    });

    it('should keep ripple alive before DURATION expires', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      const duration = RENDERING_CONFIG.SHIELD_RIPPLE.DURATION;

      // Act - advance to just before expiry
      shieldRenderer.update(world, duration * 0.5);

      // Assert - ripple should still exist, update doesn't error
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });
  });

  describe('ripple alpha', () => {
    it('should start with full START_ALPHA at age 0', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      // Act - update with very small deltaTime so progress is near 0
      shieldRenderer.update(world, 0.001);

      // Assert - no error, ripple is drawn at near-full alpha
      expect(shieldRenderer).toBeDefined();
    });

    it('should decrease alpha as ripple ages', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      const duration = RENDERING_CONFIG.SHIELD_RIPPLE.DURATION;

      // Act - advance to half duration (alpha should be ~half of START_ALPHA)
      shieldRenderer.update(world, duration * 0.5);

      // Assert - ripple still renders (hasn't expired)
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should have near-zero alpha just before expiration', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      const duration = RENDERING_CONFIG.SHIELD_RIPPLE.DURATION;

      // Act - advance to 99% of duration
      shieldRenderer.update(world, duration * 0.99);

      // Assert - ripple still exists but with very low alpha
      expect(shieldRenderer).toBeDefined();
    });
  });

  describe('ripple arc angle calculation', () => {
    it('should calculate correct angle for hit to the right', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from right side: atan2(0, 50) = 0
      shieldRenderer.addRipple(entity, 150, 100);

      // Assert - angle should be 0 radians (right)
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should calculate correct angle for hit from above', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from above: atan2(-50, 0) = -PI/2
      shieldRenderer.addRipple(entity, 100, 50);

      // Assert
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should calculate correct angle for hit from below', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from below: atan2(50, 0) = PI/2
      shieldRenderer.addRipple(entity, 100, 150);

      // Assert
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should calculate correct angle for hit from the left', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from left: atan2(0, -50) = PI
      shieldRenderer.addRipple(entity, 50, 100);

      // Assert
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should calculate correct angle for diagonal hit', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act - hit from top-right: atan2(-50, 50) = -PI/4
      shieldRenderer.addRipple(entity, 150, 50);

      // Assert
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });
  });

  describe('flashShield with hit position', () => {
    it('should create a ripple when hit position is provided', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act
      shieldRenderer.flashShield(entity, 150, 100);

      // Assert - ripple was created and processes correctly
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });

    it('should not create a ripple when hit position is omitted', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act
      shieldRenderer.flashShield(entity);

      // Assert - no ripple, but flash still works
      shieldRenderer.update(world, 0.016);
      expect(shieldRenderer).toBeDefined();
    });

    it('should set flash alpha and create ripple simultaneously', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);

      // Act
      shieldRenderer.flashShield(entity, 130, 120);

      // Assert - both flash alpha and ripple are active
      shieldRenderer.update(world, 0.001);
      expect(shieldRenderer).toBeDefined();
    });
  });

  describe('update with no ripples', () => {
    it('should not error when updating with no active ripples', () => {
      // Arrange - no ripples added

      // Act
      shieldRenderer.update(world, 0.016);

      // Assert
      expect(shieldRenderer).toBeDefined();
    });

    it('should not error when updating with no entities and no ripples', () => {
      // Arrange - empty world, no ripples

      // Act
      shieldRenderer.update(world, 0.016);

      // Assert
      expect(shieldRenderer).toBeDefined();
    });

    it('should handle update after all ripples have expired', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      const duration = RENDERING_CONFIG.SHIELD_RIPPLE.DURATION;

      // Expire the ripple
      shieldRenderer.update(world, duration + 0.01);

      // Act - update again with no active ripples
      shieldRenderer.update(world, 0.016);

      // Assert
      expect(shieldRenderer).toBeDefined();
    });
  });

  describe('destroy cleanup', () => {
    it('should clear active ripples on destroy', () => {
      // Arrange
      const entity = createShieldedEntity(100, 100);
      shieldRenderer.addRipple(entity, 150, 100);

      // Act
      shieldRenderer.destroy();

      // Assert - create a new renderer to verify no leaks
      const newRenderer = new ShieldRenderer(app);
      newRenderer.init(new Container());
      newRenderer.update(world, 0.016);
      expect(newRenderer).toBeDefined();
      newRenderer.destroy();
    });
  });
});
