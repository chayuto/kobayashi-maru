/**
 * Tests for Render System
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createGameWorld } from '../ecs/world';
import { PoolManager } from '../ecs/PoolManager';
import { createFederationShip, createKlingonShip } from '../ecs/entityFactory';
import { Position, SpriteRef } from '../ecs/components';
import { createRenderSystem } from '../systems/renderSystem';
import type { SpriteManager } from '../rendering/spriteManager';

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
    const eid = createFederationShip(world, 100, 200);

    // Run the render system
    renderSystem(world);

    // Sprite should be created
    expect(mockSpriteManager.createSprite).toHaveBeenCalledWith(0, 100, 200); // 0 = FEDERATION
    expect(SpriteRef.index[eid]).toBeGreaterThan(0);
  });

  it('should update sprite positions for existing entities', () => {
    // Create an entity
    const eid = createFederationShip(world, 100, 200);

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

  it('should handle multiple entities', () => {
    // Create multiple entities
    createFederationShip(world, 100, 100);
    createKlingonShip(world, 200, 200);
    createFederationShip(world, 300, 300);

    // Run render system
    renderSystem(world);

    // All sprites should be created
    expect(mockSpriteManager.createSprite).toHaveBeenCalledTimes(3);
  });

  it('should create sprites with correct faction', () => {
    // Create a Klingon ship (faction 1)
    createKlingonShip(world, 100, 200);

    // Run render system
    renderSystem(world);

    // Sprite should be created with Klingon faction ID
    expect(mockSpriteManager.createSprite).toHaveBeenCalledWith(1, 100, 200); // 1 = KLINGON
  });
});
