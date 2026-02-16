/**
 * Tests for HitFlashManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RENDERING_CONFIG } from '../config/rendering.config';

// Mock SpriteRef component
const mockSpriteRefIndex: Record<number, number> = {};
vi.mock('../ecs/components', () => ({
  SpriteRef: {
    index: new Proxy({}, {
      get: (_target, prop) => mockSpriteRefIndex[Number(prop)] ?? 0,
    }),
  },
}));

// Capture event handler
let damageHandler: ((payload: unknown) => void) | null = null;
vi.mock('../core/EventBus', () => ({
  EventBus: {
    getInstance: () => ({
      on: vi.fn((_event: string, handler: (payload: unknown) => void) => {
        damageHandler = handler;
      }),
      off: vi.fn(),
    }),
  },
}));

import { HitFlashManager } from '../rendering/HitFlashManager';

describe('HitFlashManager', () => {
  let manager: HitFlashManager;
  const mockSetTint = vi.fn();
  const mockSpriteManager = {
    setTint: mockSetTint,
  } as never;

  beforeEach(() => {
    vi.clearAllMocks();
    damageHandler = null;
    Object.keys(mockSpriteRefIndex).forEach(k => delete mockSpriteRefIndex[Number(k)]);

    manager = new HitFlashManager(mockSpriteManager);
    manager.init();
  });

  it('should subscribe to DAMAGE_DEALT on init', () => {
    expect(damageHandler).not.toBeNull();
  });

  it('should set tint to flash color on damage', () => {
    // Arrange
    mockSpriteRefIndex[42] = 7;

    // Act
    damageHandler!({ entityId: 42, damage: 10, isShield: false, x: 0, y: 0 });

    // Assert
    expect(mockSetTint).toHaveBeenCalledWith(7, RENDERING_CONFIG.HIT_FLASH.COLOR);
  });

  it('should reset tint after flash duration', () => {
    // Arrange
    mockSpriteRefIndex[42] = 7;
    damageHandler!({ entityId: 42, damage: 10, isShield: false, x: 0, y: 0 });
    mockSetTint.mockClear();

    // Act - advance past duration
    manager.update(RENDERING_CONFIG.HIT_FLASH.DURATION + 0.01);

    // Assert - tint reset to white
    expect(mockSetTint).toHaveBeenCalledWith(7, 0xFFFFFF);
  });

  it('should not reset tint before flash duration', () => {
    // Arrange
    mockSpriteRefIndex[42] = 7;
    damageHandler!({ entityId: 42, damage: 10, isShield: false, x: 0, y: 0 });
    mockSetTint.mockClear();

    // Act - partial time
    manager.update(RENDERING_CONFIG.HIT_FLASH.DURATION * 0.5);

    // Assert - no reset yet
    expect(mockSetTint).not.toHaveBeenCalled();
  });

  it('should ignore entities with no sprite (index 0)', () => {
    // Arrange - no sprite for entity 99
    mockSpriteRefIndex[99] = 0;

    // Act
    damageHandler!({ entityId: 99, damage: 10, isShield: false, x: 0, y: 0 });

    // Assert
    expect(mockSetTint).not.toHaveBeenCalled();
  });

  it('should handle multiple simultaneous flashes', () => {
    // Arrange
    mockSpriteRefIndex[1] = 10;
    mockSpriteRefIndex[2] = 20;

    // Act
    damageHandler!({ entityId: 1, damage: 10, isShield: false, x: 0, y: 0 });
    damageHandler!({ entityId: 2, damage: 15, isShield: false, x: 0, y: 0 });

    // Assert - both tinted
    expect(mockSetTint).toHaveBeenCalledWith(10, RENDERING_CONFIG.HIT_FLASH.COLOR);
    expect(mockSetTint).toHaveBeenCalledWith(20, RENDERING_CONFIG.HIT_FLASH.COLOR);

    // Both reset after duration
    mockSetTint.mockClear();
    manager.update(RENDERING_CONFIG.HIT_FLASH.DURATION + 0.01);
    expect(mockSetTint).toHaveBeenCalledWith(10, 0xFFFFFF);
    expect(mockSetTint).toHaveBeenCalledWith(20, 0xFFFFFF);
  });
});
