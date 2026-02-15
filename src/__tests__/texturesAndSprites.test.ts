/**
 * Tests for Textures & Sprites
 * Covers TextureCache, factionTextures, turretTextures, createFactionTextures, and SpriteManager
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('pixi.js', async () => {
  const {
    setupPixiMock,
    MockApplication: BaseMockApplication,
    MockGraphics: BaseMockGraphics,
  } = await import('./helpers/mockPixi');
  const baseMock = setupPixiMock();

  // Extend MockGraphics with additional drawing methods used by texture creators
  class ExtendedMockGraphics extends BaseMockGraphics {
    ellipse = vi.fn().mockReturnThis();
    bezierCurveTo = vi.fn().mockReturnThis();
  }

  // Extend the mock Application to include renderer.render
  class ExtendedMockApplication extends BaseMockApplication {
    constructor() {
      super();
      (this.renderer as Record<string, unknown>).render = vi.fn();
    }
  }

  return {
    ...baseMock,
    Application: ExtendedMockApplication,
    Graphics: ExtendedMockGraphics,
    RenderTexture: {
      create: vi.fn(() => ({
        width: 32,
        height: 32,
        destroy: vi.fn(),
      })),
    },
  };
});

import { TextureCache } from '../rendering/TextureCache';
import {
  createFederationTexture,
  createKobayashiMaruTexture,
  createKlingonTexture,
  createRomulanTexture,
  createBorgTexture,
  createTholianTexture,
  createSpecies8472Texture,
  createProjectileTexture,
} from '../rendering/textures/factionTextures';
import {
  createTurretBasePhaserTexture,
  createTurretBarrelPhaserTexture,
  createTurretBaseTorpedoTexture,
  createTurretBarrelTorpedoTexture,
  createTurretBaseDisruptorTexture,
  createTurretBarrelDisruptorTexture,
  createTurretBaseTetryonTexture,
  createTurretBarrelTetryonTexture,
  createTurretBasePlasmaTexture,
  createTurretBarrelPlasmaTexture,
  createTurretBasePolaronTexture,
  createTurretBarrelPolaronTexture,
} from '../rendering/textures/turretTextures';
import { createFactionTextures } from '../rendering/textures/createFactionTextures';
import { TEXTURE_KEYS } from '../rendering/textures/types';
import { renderToTexture } from '../rendering/textures/utils';
import { SpriteManager } from '../rendering/spriteManager';
import { SpriteType } from '../types/config/factions';
import { Application, Graphics } from 'pixi.js';

function createMockApp(): Application {
  return new Application() as unknown as Application;
}

// ============================================================================
// TextureCache
// ============================================================================
describe('TextureCache', () => {
  beforeEach(() => {
    TextureCache.resetInstance();
  });

  describe('singleton', () => {
    it('should return the same instance when getInstance is called multiple times', () => {
      const a = TextureCache.getInstance();
      const b = TextureCache.getInstance();
      expect(a).toBe(b);
    });

    it('should return a fresh instance after resetInstance', () => {
      const cache = TextureCache.getInstance();
      cache.set('key', {} as never);
      expect(cache.size()).toBe(1);

      TextureCache.resetInstance();
      const fresh = TextureCache.getInstance();
      expect(fresh.size()).toBe(0);
    });
  });

  describe('get / set / has', () => {
    it('should return undefined when key does not exist', () => {
      const cache = TextureCache.getInstance();
      expect(cache.get('missing')).toBeUndefined();
    });

    it('should store and retrieve a texture by key', () => {
      const cache = TextureCache.getInstance();
      const texture = { id: 'tex1' } as never;
      cache.set('my_key', texture);
      expect(cache.get('my_key')).toBe(texture);
    });

    it('should return true for has when key exists', () => {
      const cache = TextureCache.getInstance();
      cache.set('exists', {} as never);
      expect(cache.has('exists')).toBe(true);
    });

    it('should return false for has when key does not exist', () => {
      const cache = TextureCache.getInstance();
      expect(cache.has('nope')).toBe(false);
    });

    it('should overwrite an existing key with a new texture', () => {
      const cache = TextureCache.getInstance();
      const tex1 = { v: 1 } as never;
      const tex2 = { v: 2 } as never;
      cache.set('k', tex1);
      cache.set('k', tex2);
      expect(cache.get('k')).toBe(tex2);
      expect(cache.size()).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all cached textures', () => {
      const cache = TextureCache.getInstance();
      cache.set('a', {} as never);
      cache.set('b', {} as never);
      expect(cache.size()).toBe(2);

      cache.clear();
      expect(cache.size()).toBe(0);
      expect(cache.has('a')).toBe(false);
    });
  });

  describe('size', () => {
    it('should return 0 for an empty cache', () => {
      expect(TextureCache.getInstance().size()).toBe(0);
    });

    it('should return the correct count after inserts', () => {
      const cache = TextureCache.getInstance();
      cache.set('x', {} as never);
      cache.set('y', {} as never);
      cache.set('z', {} as never);
      expect(cache.size()).toBe(3);
    });
  });
});

// ============================================================================
// renderToTexture utility
// ============================================================================
describe('renderToTexture', () => {
  it('should create a RenderTexture and render graphics into it', () => {
    const app = createMockApp();
    const graphics = new Graphics();

    const result = renderToTexture(app, graphics, 32, 32);

    expect(result).toBeDefined();
    expect(app.renderer.generateTexture).not.toHaveBeenCalled(); // uses RenderTexture.create path
    expect(graphics.destroy).toHaveBeenCalled();
  });
});

// ============================================================================
// Faction Texture Creators
// ============================================================================
describe('Faction Texture Creators', () => {
  let app: Application;

  beforeEach(() => {
    app = createMockApp();
  });

  it('should create a federation texture when createFederationTexture is called', () => {
    const tex = createFederationTexture(app, 0x00FFCC);
    expect(tex).toBeDefined();
  });

  it('should create a kobayashi maru texture when createKobayashiMaruTexture is called', () => {
    const tex = createKobayashiMaruTexture(app);
    expect(tex).toBeDefined();
  });

  it('should create a klingon texture when createKlingonTexture is called', () => {
    const tex = createKlingonTexture(app, 0xFF3344);
    expect(tex).toBeDefined();
  });

  it('should create a romulan texture when createRomulanTexture is called', () => {
    const tex = createRomulanTexture(app, 0x88FF00);
    expect(tex).toBeDefined();
  });

  it('should create a borg texture when createBorgTexture is called', () => {
    const tex = createBorgTexture(app, 0x00FF88);
    expect(tex).toBeDefined();
  });

  it('should create a tholian texture when createTholianTexture is called', () => {
    const tex = createTholianTexture(app, 0xFF8822);
    expect(tex).toBeDefined();
  });

  it('should create a species 8472 texture when createSpecies8472Texture is called', () => {
    const tex = createSpecies8472Texture(app, 0xDD66FF);
    expect(tex).toBeDefined();
  });

  it('should create a projectile texture when createProjectileTexture is called', () => {
    const tex = createProjectileTexture(app, 0xFF6600);
    expect(tex).toBeDefined();
  });
});

// ============================================================================
// Turret Texture Creators
// ============================================================================
describe('Turret Texture Creators', () => {
  let app: Application;

  beforeEach(() => {
    app = createMockApp();
  });

  it('should create phaser turret base texture', () => {
    expect(createTurretBasePhaserTexture(app)).toBeDefined();
  });

  it('should create phaser turret barrel texture', () => {
    expect(createTurretBarrelPhaserTexture(app, 0x00FFCC)).toBeDefined();
  });

  it('should create torpedo turret base texture', () => {
    expect(createTurretBaseTorpedoTexture(app)).toBeDefined();
  });

  it('should create torpedo turret barrel texture', () => {
    expect(createTurretBarrelTorpedoTexture(app)).toBeDefined();
  });

  it('should create disruptor turret base texture', () => {
    expect(createTurretBaseDisruptorTexture(app)).toBeDefined();
  });

  it('should create disruptor turret barrel texture', () => {
    expect(createTurretBarrelDisruptorTexture(app)).toBeDefined();
  });

  it('should create tetryon turret base texture', () => {
    expect(createTurretBaseTetryonTexture(app)).toBeDefined();
  });

  it('should create tetryon turret barrel texture', () => {
    expect(createTurretBarrelTetryonTexture(app)).toBeDefined();
  });

  it('should create plasma turret base texture', () => {
    expect(createTurretBasePlasmaTexture(app)).toBeDefined();
  });

  it('should create plasma turret barrel texture', () => {
    expect(createTurretBarrelPlasmaTexture(app)).toBeDefined();
  });

  it('should create polaron turret base texture', () => {
    expect(createTurretBasePolaronTexture(app)).toBeDefined();
  });

  it('should create polaron turret barrel texture', () => {
    expect(createTurretBarrelPolaronTexture(app)).toBeDefined();
  });
});

// ============================================================================
// createFactionTextures (factory + caching)
// ============================================================================
describe('createFactionTextures', () => {
  let app: Application;

  beforeEach(() => {
    TextureCache.resetInstance();
    app = createMockApp();
  });

  it('should return an object containing all expected texture keys when called', () => {
    const textures = createFactionTextures(app);

    expect(textures.federation).toBeDefined();
    expect(textures.kobayashiMaru).toBeDefined();
    expect(textures.klingon).toBeDefined();
    expect(textures.romulan).toBeDefined();
    expect(textures.borg).toBeDefined();
    expect(textures.tholian).toBeDefined();
    expect(textures.species8472).toBeDefined();
    expect(textures.projectile).toBeDefined();
    expect(textures.turretBasePhaser).toBeDefined();
    expect(textures.turretBarrelPhaser).toBeDefined();
    expect(textures.turretBaseTorpedo).toBeDefined();
    expect(textures.turretBarrelTorpedo).toBeDefined();
    expect(textures.turretBaseDisruptor).toBeDefined();
    expect(textures.turretBarrelDisruptor).toBeDefined();
    expect(textures.turretBaseTetryon).toBeDefined();
    expect(textures.turretBarrelTetryon).toBeDefined();
    expect(textures.turretBasePlasma).toBeDefined();
    expect(textures.turretBarrelPlasma).toBeDefined();
    expect(textures.turretBasePolaron).toBeDefined();
    expect(textures.turretBarrelPolaron).toBeDefined();
  });

  it('should populate the TextureCache after first call', () => {
    const cache = TextureCache.getInstance();
    expect(cache.size()).toBe(0);

    createFactionTextures(app);

    expect(cache.has(TEXTURE_KEYS.federation)).toBe(true);
    expect(cache.has(TEXTURE_KEYS.turretBasePhaser)).toBe(true);
    expect(cache.has(TEXTURE_KEYS.turretBarrelPolaron)).toBe(true);
    expect(cache.size()).toBeGreaterThan(0);
  });

  it('should return cached textures on subsequent calls without recreating', () => {
    const first = createFactionTextures(app);
    const second = createFactionTextures(app);

    // The cached branch returns the exact texture objects stored earlier
    expect(second.federation).toBe(first.federation);
    expect(second.turretBasePhaser).toBe(first.turretBasePhaser);
  });
});

// ============================================================================
// SpriteManager
// ============================================================================
describe('SpriteManager', () => {
  let app: Application;
  let manager: SpriteManager;

  beforeEach(() => {
    TextureCache.resetInstance();
    app = createMockApp();
    manager = new SpriteManager(app);
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('initialization', () => {
    it('should not be initialized before init is called', () => {
      expect(manager.isInitialized()).toBe(false);
    });

    it('should be initialized after init is called', () => {
      manager.init();
      expect(manager.isInitialized()).toBe(true);
    });

    it('should not reinitialize when init is called twice', () => {
      manager.init();
      const countBefore = manager.getActiveCount();
      manager.init();
      expect(manager.getActiveCount()).toBe(countBefore);
      expect(manager.isInitialized()).toBe(true);
    });
  });

  describe('createSprite', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should return 0 when manager is not initialized', () => {
      const uninitManager = new SpriteManager(app);
      const result = uninitManager.createSprite(SpriteType.FEDERATION, 10, 20);
      expect(result).toBe(0);
      uninitManager.destroy();
    });

    it('should return a non-zero index when creating a federation sprite', () => {
      const idx = manager.createSprite(SpriteType.FEDERATION, 100, 200);
      expect(idx).toBeGreaterThan(0);
    });

    it('should increment active count when a sprite is created', () => {
      expect(manager.getActiveCount()).toBe(0);
      manager.createSprite(SpriteType.KLINGON, 0, 0);
      expect(manager.getActiveCount()).toBe(1);
      manager.createSprite(SpriteType.BORG, 50, 50);
      expect(manager.getActiveCount()).toBe(2);
    });

    it('should return unique indices for each sprite created', () => {
      const idx1 = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      const idx2 = manager.createSprite(SpriteType.KLINGON, 0, 0);
      const idx3 = manager.createSprite(SpriteType.ROMULAN, 0, 0);
      expect(idx1).not.toBe(idx2);
      expect(idx2).not.toBe(idx3);
      expect(idx1).not.toBe(idx3);
    });

    it('should handle turret sprite types correctly', () => {
      const idx = manager.createSprite(SpriteType.TURRET_BASE_PHASER, 0, 0);
      expect(idx).toBeGreaterThan(0);
    });

    it('should return 0 for an unknown sprite type with no container', () => {
      const idx = manager.createSprite(9999, 0, 0);
      expect(idx).toBe(0);
    });
  });

  describe('updateSprite', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should not throw when updating a valid sprite position', () => {
      const idx = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      expect(() => manager.updateSprite(idx, 50, 60)).not.toThrow();
    });

    it('should silently do nothing when updating a non-existent sprite', () => {
      expect(() => manager.updateSprite(99999, 10, 20)).not.toThrow();
    });
  });

  describe('updateSpriteRotation', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should not throw when updating rotation of a valid sprite', () => {
      const idx = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      expect(() => manager.updateSpriteRotation(idx, Math.PI / 4)).not.toThrow();
    });

    it('should silently do nothing when updating rotation of non-existent sprite', () => {
      expect(() => manager.updateSpriteRotation(99999, 1.5)).not.toThrow();
    });
  });

  describe('setScale', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should not throw when setting scale of a valid sprite', () => {
      const idx = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      expect(() => manager.setScale(idx, 2.0)).not.toThrow();
    });

    it('should silently do nothing when setting scale of non-existent sprite', () => {
      expect(() => manager.setScale(99999, 0.5)).not.toThrow();
    });
  });

  describe('removeSprite', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should decrease active count when a sprite is removed', () => {
      const idx = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      expect(manager.getActiveCount()).toBe(1);

      manager.removeSprite(idx);
      expect(manager.getActiveCount()).toBe(0);
    });

    it('should increase pool count when a sprite is returned to the pool', () => {
      const idx = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      const poolBefore = manager.getPoolCount();

      manager.removeSprite(idx);
      expect(manager.getPoolCount()).toBe(poolBefore + 1);
    });

    it('should silently do nothing when removing a non-existent sprite', () => {
      expect(() => manager.removeSprite(99999)).not.toThrow();
    });

    it('should reuse pooled particles when creating new sprites of the same type', () => {
      const idx1 = manager.createSprite(SpriteType.FEDERATION, 10, 20);
      manager.removeSprite(idx1);
      expect(manager.getPoolCount()).toBe(1);

      const idx2 = manager.createSprite(SpriteType.FEDERATION, 30, 40);
      expect(idx2).toBeGreaterThan(0);
      // Pool should be drained since we reused the particle
      expect(manager.getPoolCount()).toBe(0);
    });
  });

  describe('destroy', () => {
    it('should reset initialized state when destroyed', () => {
      manager.init();
      expect(manager.isInitialized()).toBe(true);

      manager.destroy();
      expect(manager.isInitialized()).toBe(false);
    });

    it('should clear all active particles when destroyed', () => {
      manager.init();
      manager.createSprite(SpriteType.FEDERATION, 0, 0);
      manager.createSprite(SpriteType.KLINGON, 0, 0);
      expect(manager.getActiveCount()).toBe(2);

      manager.destroy();
      expect(manager.getActiveCount()).toBe(0);
    });

    it('should clear all pools when destroyed', () => {
      manager.init();
      const idx = manager.createSprite(SpriteType.FEDERATION, 0, 0);
      manager.removeSprite(idx);
      expect(manager.getPoolCount()).toBeGreaterThan(0);

      manager.destroy();
      expect(manager.getPoolCount()).toBe(0);
    });
  });

  describe('getTextureForType (default fallback)', () => {
    beforeEach(() => {
      manager.init();
    });

    it('should create a sprite for a default/fallback sprite type', () => {
      // SpriteType 0 is FEDERATION, but we test that unknown types
      // handled by the container check (9999 returns 0 from createSprite).
      // For types in the container map, they always succeed:
      const idx = manager.createSprite(SpriteType.PROJECTILE, 0, 0);
      expect(idx).toBeGreaterThan(0);
    });
  });
});

// ============================================================================
// TEXTURE_KEYS constants
// ============================================================================
describe('TEXTURE_KEYS', () => {
  it('should define unique string keys for all factions', () => {
    const keys = Object.values(TEXTURE_KEYS);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });

  it('should include keys for all turret base and barrel variants', () => {
    expect(TEXTURE_KEYS.turretBasePhaser).toBe('turret_base_phaser');
    expect(TEXTURE_KEYS.turretBarrelPhaser).toBe('turret_barrel_phaser');
    expect(TEXTURE_KEYS.turretBasePolaron).toBe('turret_base_polaron');
    expect(TEXTURE_KEYS.turretBarrelPolaron).toBe('turret_barrel_polaron');
  });
});
