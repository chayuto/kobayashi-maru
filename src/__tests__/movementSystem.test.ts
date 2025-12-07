
/**
 * Tests for Movement System
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { PoolManager } from '../ecs/PoolManager';
import { createEnemy } from '../ecs/entityFactory';
import { Position, Velocity, Projectile } from '../ecs/components';
import { addComponent } from 'bitecs';
import { createMovementSystem } from '../systems/movementSystem';
import { GAME_CONFIG, FactionId } from '../types/constants';

describe('Movement System', () => {
  let world: ReturnType<typeof createGameWorld>;
  let movementSystem: ReturnType<typeof createMovementSystem>;

  beforeEach(() => {
    world = createGameWorld();
    PoolManager.getInstance().init(world);
    movementSystem = createMovementSystem();
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  it('should update position based on velocity and delta time', () => {
    // Create an entity at position (100, 100) with velocity (50, 100)
    const eid = createEnemy(world, FactionId.FEDERATION, 100, 100);
    Velocity.x[eid] = 50;  // 50 pixels per second
    Velocity.y[eid] = 100; // 100 pixels per second

    // Run movement system with delta time of 0.5 seconds
    movementSystem(world, 0.5);

    // Position should be updated: x += 50 * 0.5 = 25, y += 100 * 0.5 = 50
    expect(Position.x[eid]).toBeCloseTo(125, 5);
    expect(Position.y[eid]).toBeCloseTo(150, 5);
  });

  it('should be frame-rate independent (same result for different delta times)', () => {
    // Create two entities at the same position with same velocity
    // Entity 1 will move in 2 steps
    const eid1 = createEnemy(world, FactionId.FEDERATION, 100, 100);
    Velocity.x[eid1] = 100;
    Velocity.y[eid1] = 100;

    // Entity 2 will move in 1 step
    const eid2 = createEnemy(world, FactionId.FEDERATION, 100, 100);
    Velocity.x[eid2] = 100;
    Velocity.y[eid2] = 100;

    // Step 1 for Entity 1: 0.25 seconds
    // Since movementSystem iterates all entities, both will move 0.25s
    // But we can simulate this by running:
    // Run 1 (0.25s) -> Check eid1 (should be at 125)
    // Run 2 (0.25s) -> Check eid1 (should be at 150)

    // For the "single step" comparison, we can calculate expected values manually
    // or run a separate test case, but we can verify consistency here.

    // Move 0.25s
    movementSystem(world, 0.25);

    // Expected position: 100 + 100 * 0.25 = 125
    expect(Position.x[eid1]).toBeCloseTo(125, 5);
    expect(Position.y[eid1]).toBeCloseTo(125, 5);

    // Move another 0.25s
    movementSystem(world, 0.25);

    // Expected position: 125 + 100 * 0.25 = 150
    expect(Position.x[eid1]).toBeCloseTo(150, 5);
    expect(Position.y[eid1]).toBeCloseTo(150, 5);

    // Capture result of 2 steps
    const eid1_result_x = Position.x[eid1];

    // Now creates a NEW entity for single-step test to ensure cleanliness?
    // We can just reuse world since we are creating new entities

    const eid3 = createEnemy(world, FactionId.FEDERATION, 100, 100);
    Velocity.x[eid3] = 100;
    Velocity.y[eid3] = 100;

    // Check initial pos
    expect(Position.x[eid3]).toBe(100);

    // Move 0.5s in one go (Note: this moves eid1/eid2 as well, but we ignore them)
    movementSystem(world, 0.5);

    // Expected position: 100 + 100 * 0.5 = 150
    expect(Position.x[eid3]).toBeCloseTo(150, 5);
    expect(Position.y[eid3]).toBeCloseTo(150, 5);

    // Result should match eid1's result (which was captured before the 3rd step)
    expect(Position.x[eid3]).toBeCloseTo(eid1_result_x, 5);
  });

  it('should wrap entity position when going off right edge', () => {
    // Create entity near right edge
    const eid = createEnemy(world, FactionId.FEDERATION, GAME_CONFIG.WORLD_WIDTH - 10, 500);
    Velocity.x[eid] = 100; // Moving right
    Velocity.y[eid] = 0;

    // Move for 1 second - should wrap to left side
    movementSystem(world, 1);

    // Position should wrap: (1920 - 10 + 100) % 1920 = 90
    expect(Position.x[eid]).toBeCloseTo(90, 5);
    expect(Position.y[eid]).toBeCloseTo(500, 5);
  });

  it('should wrap entity position when going off left edge', () => {
    // Create entity near left edge
    const eid = createEnemy(world, FactionId.FEDERATION, 10, 500);
    Velocity.x[eid] = -100; // Moving left
    Velocity.y[eid] = 0;

    // Move for 1 second - should wrap to right side
    movementSystem(world, 1);

    // Position should wrap: 10 - 100 = -90, wraps to 1920 - 90 = 1830
    expect(Position.x[eid]).toBeCloseTo(1830, 5);
    expect(Position.y[eid]).toBeCloseTo(500, 5);
  });

  it('should wrap entity position when going off bottom edge', () => {
    // Create entity near bottom edge
    const eid = createEnemy(world, FactionId.FEDERATION, 500, GAME_CONFIG.WORLD_HEIGHT - 10);
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 100; // Moving down

    // Move for 1 second - should wrap to top side
    movementSystem(world, 1);

    // Position should wrap: (1080 - 10 + 100) % 1080 = 90
    expect(Position.x[eid]).toBeCloseTo(500, 5);
    expect(Position.y[eid]).toBeCloseTo(90, 5);
  });

  it('should wrap entity position when going off top edge', () => {
    // Create entity near top edge
    const eid = createEnemy(world, FactionId.FEDERATION, 500, 10);
    Velocity.x[eid] = 0;
    Velocity.y[eid] = -100; // Moving up

    // Move for 1 second - should wrap to bottom side
    movementSystem(world, 1);

    // Position should wrap: 10 - 100 = -90, wraps to 1080 - 90 = 990
    expect(Position.x[eid]).toBeCloseTo(500, 5);
    expect(Position.y[eid]).toBeCloseTo(990, 5);
  });

  it('should handle multiple entities simultaneously', () => {
    // Create multiple entities with different velocities
    const eid1 = createEnemy(world, FactionId.FEDERATION, 100, 100);
    const eid2 = createEnemy(world, FactionId.KLINGON, 200, 200);
    const eid3 = createEnemy(world, FactionId.FEDERATION, 300, 300);

    Velocity.x[eid1] = 10;
    Velocity.y[eid1] = 20;
    Velocity.x[eid2] = -30;
    Velocity.y[eid2] = 40;
    Velocity.x[eid3] = 50;
    Velocity.y[eid3] = -60;

    // Run movement system with 1 second delta
    movementSystem(world, 1);

    // Check all positions updated correctly
    expect(Position.x[eid1]).toBeCloseTo(110, 5);
    expect(Position.y[eid1]).toBeCloseTo(120, 5);
    expect(Position.x[eid2]).toBeCloseTo(170, 5);
    expect(Position.y[eid2]).toBeCloseTo(240, 5);
    expect(Position.x[eid3]).toBeCloseTo(350, 5);
    expect(Position.y[eid3]).toBeCloseTo(240, 5);
  });

  it('should handle zero velocity (stationary entities)', () => {
    const eid = createEnemy(world, FactionId.FEDERATION, 500, 500);
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;

    movementSystem(world, 1);

    // Position should remain unchanged
    expect(Position.x[eid]).toBeCloseTo(500, 5);
    expect(Position.y[eid]).toBeCloseTo(500, 5);
  });

  it('should handle very small delta times', () => {
    const eid = createEnemy(world, FactionId.FEDERATION, 100, 100);
    Velocity.x[eid] = 1000;
    Velocity.y[eid] = 1000;

    // Very small delta (simulating high frame rate)
    movementSystem(world, 0.001);

    expect(Position.x[eid]).toBeCloseTo(101, 5);
    expect(Position.y[eid]).toBeCloseTo(101, 5);
  });

  it('should NOT wrap projectile position when going off edge', () => {
    // Create projectile entity near right edge
    const eid = createEnemy(world, FactionId.FEDERATION, GAME_CONFIG.WORLD_WIDTH - 10, 500);
    addComponent(world, Projectile, eid); // Make it a projectile
    Velocity.x[eid] = 100; // Moving right
    Velocity.y[eid] = 0;

    // Move for 1 second - would wrap to 90 if it wasn't a projectile
    movementSystem(world, 1);

    // Position should NOT wrap: 1920 - 10 + 100 = 2010
    expect(Position.x[eid]).toBeCloseTo(2010, 5);
    expect(Position.y[eid]).toBeCloseTo(500, 5);
  });
});
