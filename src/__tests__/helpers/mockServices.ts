/**
 * Shared service mock infrastructure for tests
 * Provides factory functions for commonly mocked services
 */
import { vi } from 'vitest';
import type { SpriteManager } from '../../rendering/spriteManager';

/**
 * Create a mock AudioManager
 */
export function createMockAudioManager() {
  return {
    init: vi.fn(),
    play: vi.fn(),
    playSound: vi.fn(),
    stopAll: vi.fn(),
    setMasterVolume: vi.fn(),
    setMusicVolume: vi.fn(),
    setSfxVolume: vi.fn(),
    getMasterVolume: vi.fn(() => 1),
    getMusicVolume: vi.fn(() => 1),
    getSfxVolume: vi.fn(() => 1),
    isMuted: vi.fn(() => false),
    mute: vi.fn(),
    unmute: vi.fn(),
    toggleMute: vi.fn(),
    destroy: vi.fn(),
  };
}

/**
 * Create a mock EventBus (non-singleton, for isolation)
 */
export function createMockEventBus() {
  const handlers = new Map<string, Set<(...args: unknown[]) => void>>();
  return {
    on: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    }),
    off: vi.fn((event: string, handler: (...args: unknown[]) => void) => {
      handlers.get(event)?.delete(handler);
    }),
    emit: vi.fn((event: string, payload?: unknown) => {
      handlers.get(event)?.forEach(h => h(payload));
    }),
    clear: vi.fn(() => handlers.clear()),
    getHandlerCount: vi.fn((event: string) => handlers.get(event)?.size ?? 0),
    _handlers: handlers,
  };
}

/**
 * Create a mock SpriteManager with tracking
 */
export function createMockSpriteManager(): SpriteManager {
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
    destroy: vi.fn(),
  } as unknown as SpriteManager;
}

/**
 * Create a mock ServiceContainer
 */
export function createMockServiceContainer() {
  const services = new Map<string, unknown>();
  return {
    register: vi.fn((name: string, factory: () => unknown) => {
      services.set(name, factory);
    }),
    get: vi.fn((name: string) => {
      const factory = services.get(name);
      return typeof factory === 'function' ? factory() : factory;
    }),
    has: vi.fn((name: string) => services.has(name)),
    destroy: vi.fn(() => services.clear()),
  };
}
