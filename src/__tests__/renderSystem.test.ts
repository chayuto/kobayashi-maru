/**
 * Tests for Render System
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { PoolManager } from '../ecs/PoolManager';
import { createEnemy, createTurret } from '../ecs/entityFactory';
import { Position, SpriteRef, Rotation, CompositeSpriteRef } from '../ecs/components';
import { createRenderSystem } from '../systems/renderSystem';
import type { SpriteManager } from '../rendering/spriteManager';
import { FactionId, TurretType, SpriteType } from '../types/constants';

// Mock SpriteManager
function createMockSpriteManager(): SpriteManager {
  let nextIndex = 1;
  const activeSprites = new Map<number, { x: number; y: number }>();

  return {
    createSprite: vi.fn((_factionId: number, initX: number, initY: number) => {
      const index = nextIndex++;
      activeSprites.set(index, { x: initX, y: initY });
      return index;
    }),
    updateSprite: vi.fn((index: number, x: number, y: number) => {
      if (activeSprites.has(index)) {
        activeSprites.set(index, { x, y });
      }
    }),
    updateSpriteRotation: vi.fn(),
    removeSprite: vi.fn((index: number) => {
      activeSprites.delete(index);
    }),
    getActiveCount: () => activeSprites.size,
    getPoolCount: () => 0,
    isInitialized: () => true,
    init: vi.fn(),
    destroy: vi.fn()
  } as unknown as SpriteManager;
}

describe('Render System', () => {
  let world: ReturnType<typeof createGameWorld>;
  let mockSpriteManager: SpriteManager;
  let renderSystem: ReturnType<typeof createRenderSystem>;

  beforeEach(() => {
    world = createGameWorld();
    PoolManager.getInstance().init(world);
    mockSpriteManager = createMockSpriteManager();
    renderSystem = createRenderSystem(mockSpriteManager);
  });

  afterEach(() => {
    PoolManager.getInstance().destroy();
  });

  it('should create sprites for new entities', () => {
    // Create an entity
    const eid = createEnemy(world, FactionId.FEDERATION, 100, 200);

    // Run the render system
    renderSystem(world);

    // Sprite should be created
    expect(mockSpriteManager.createSprite).toHaveBeenCalledWith(0, 100, 200); // 0 = FEDERATION
    expect(SpriteRef.index[eid]).toBeGreaterThan(0);
  });

  it('should update sprite positions for existing entities', () => {
    // Create an entity
    const eid = createEnemy(world, FactionId.FEDERATION, 100, 200);

    // Run render system to create sprite
    renderSystem(world);

    const spriteIndex = SpriteRef.index[eid];

    // Update position
    Position.x[eid] = 150;
    Position.y[eid] = 250;

    // Run render system again
    renderSystem(world);

    // Sprite position should be updated
    expect(mockSpriteManager.updateSprite).toHaveBeenCalledWith(spriteIndex, 150, 250);
  });

  it('should update sprite rotation for existing entities', () => {
    // Create an entity
    const eid = createEnemy(world, FactionId.FEDERATION, 100, 200);

    // Run render system to create sprite (initial rotation 0)
    renderSystem(world);
    const spriteIndex = SpriteRef.index[eid];

    // Update rotation
    Rotation.angle[eid] = Math.PI;

    // Run render system again
    renderSystem(world);

    // Sprite rotation should be updated
    // Use manual check for float precision (f32 vs f64)
    const updateRotationMock = mockSpriteManager.updateSpriteRotation as ReturnType<typeof vi.fn>;
    const calls = updateRotationMock.mock.calls;
    const lastCall = calls[calls.length - 1];

    expect(lastCall[0]).toBe(spriteIndex);
    expect(lastCall[1]).toBeCloseTo(Math.PI);
  });

  it('should handle multiple entities', () => {
    // Create multiple entities
    createEnemy(world, FactionId.FEDERATION, 100, 100);
    createEnemy(world, FactionId.KLINGON, 200, 200);
    createEnemy(world, FactionId.FEDERATION, 300, 300);

    // Run render system
    renderSystem(world);

    // All sprites should be created
    expect(mockSpriteManager.createSprite).toHaveBeenCalledTimes(3);
  });

  it('should create sprites with correct faction', () => {
    // Create a Klingon ship (faction 1)
    createEnemy(world, FactionId.KLINGON, 100, 200);

    // Run render system
    renderSystem(world);

    // Sprite should be created with Klingon faction ID
    expect(mockSpriteManager.createSprite).toHaveBeenCalledWith(1, 100, 200); // 1 = KLINGON
  });

  it('should create composite sprites for turrets', () => {
    // Create turret (Phaser)
    const eid = createTurret(world, 100, 200, TurretType.PHASER_ARRAY);

    // Clear previous calls (createEnemy tests might have called it if run in sequence?)
    // In beforeEach we create new renderSystem and mockSpriteManager, so it's clean.

    // Run render system
    renderSystem(world);

    // Should have created 2 sprites (Base and Barrel) - check specific calls
    // Note: order depends on logic. Base first?
    // We called Base first in renderSystemLogic

    // Types may be numbers. TurretType.PHASER is mapped to SpriteType.TURRET_BASE_PHASER etc.
    // Check logic:
    // baseType = SpriteType.TURRET_BASE_PHASER
    // barrelType = SpriteType.TURRET_BARREL_PHASER

    // We need to import SpriteType in this file. (Added in imports chunk)

    // Use flexible expect since we don't know exact call index if parallel
    // But this test creates 1 entity. So it should be calls 0 and 1.

    expect(mockSpriteManager.createSprite).toHaveBeenCalledTimes(2);
    expect(mockSpriteManager.createSprite).toHaveBeenCalledWith(SpriteType.TURRET_BASE_PHASER, 100, 200);
    expect(mockSpriteManager.createSprite).toHaveBeenCalledWith(SpriteType.TURRET_BARREL_PHASER, 100, 200);

    const baseIndex = CompositeSpriteRef.baseIndex[eid];
    const barrelIndex = CompositeSpriteRef.barrelIndex[eid];
    expect(baseIndex).toBeGreaterThan(0);
    expect(barrelIndex).toBeGreaterThan(0);

    // Update Rotation
    Rotation.angle[eid] = Math.PI;

    // Run render system
    (mockSpriteManager.updateSpriteRotation as ReturnType<typeof vi.fn>).mockClear();
    renderSystem(world);

    // Should update barrel rotation ONLY
    const updateRotCalls = (mockSpriteManager.updateSpriteRotation as ReturnType<typeof vi.fn>).mock.calls;
    // We expect call for barrelIndex
    const barrelCall = updateRotCalls.find((call: unknown[]) => call[0] === barrelIndex);
    expect(barrelCall).toBeDefined();
    if (barrelCall) {
      expect(barrelCall[1]).toBeCloseTo(Math.PI);
    }

    // Base rotation should NOT be updated (or updated to 0 if implemented that way, but currently we only call updateSpriteRotation for barrel)
    const baseCall = updateRotCalls.find((call: unknown[]) => call[0] === baseIndex);
    expect(baseCall).toBeUndefined();
  });
});
