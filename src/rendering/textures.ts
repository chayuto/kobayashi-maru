/**
 * Texture generation utilities for geometric faction shapes
 */
import { Graphics, Texture, RenderTexture, Application } from 'pixi.js';
import { FACTION_COLORS } from '../types';
import { TextureCache } from './TextureCache';

// Size of each shape texture
const SHAPE_SIZE = 16;

/**
 * Generate a circle texture (Federation)
 */
function createCircleTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  graphics.circle(SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2 - 1);
  graphics.fill({ color });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Generate a triangle texture (Klingon)
 */
function createTriangleTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  graphics.poly([
    SHAPE_SIZE / 2, 1,
    SHAPE_SIZE - 1, SHAPE_SIZE - 1,
    1, SHAPE_SIZE - 1
  ]);
  graphics.fill({ color });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Generate a square texture (Borg)
 */
function createSquareTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  graphics.rect(1, 1, SHAPE_SIZE - 2, SHAPE_SIZE - 2);
  graphics.fill({ color });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Generate a diamond/rhombus texture (Tholian)
 */
function createDiamondTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  graphics.poly([
    SHAPE_SIZE / 2, 1,
    SHAPE_SIZE - 1, SHAPE_SIZE / 2,
    SHAPE_SIZE / 2, SHAPE_SIZE - 1,
    1, SHAPE_SIZE / 2
  ]);
  graphics.fill({ color });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Generate a crescent texture (Romulan)
 */
function createCrescentTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  // Outer arc
  graphics.arc(SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2 - 1, Math.PI * 0.3, Math.PI * 1.7);
  graphics.stroke({ color, width: 3 });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Generate a Y-shape texture (Species 8472)
 */
function createYShapeTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const centerX = SHAPE_SIZE / 2;
  const centerY = SHAPE_SIZE / 2;

  // Draw Y shape with lines
  graphics.moveTo(centerX, centerY);
  graphics.lineTo(centerX, SHAPE_SIZE - 1);
  graphics.moveTo(centerX, centerY);
  graphics.lineTo(2, 2);
  graphics.moveTo(centerX, centerY);
  graphics.lineTo(SHAPE_SIZE - 2, 2);
  graphics.stroke({ color, width: 2 });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Generate a projectile texture (Glowing circle)
 */
function createProjectileTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  // Core
  graphics.circle(SHAPE_SIZE / 2, SHAPE_SIZE / 2, SHAPE_SIZE / 2 - 2);
  graphics.fill({ color });
  // Glow (simulated with stroke for now, or just a larger circle with lower alpha if possible, but texture is small)
  // For simple texture, just a solid circle is fine, maybe lighter center
  graphics.circle(SHAPE_SIZE / 2, SHAPE_SIZE / 2, 2);
  graphics.fill({ color: 0xFFFFFF });

  const texture = RenderTexture.create({ width: SHAPE_SIZE, height: SHAPE_SIZE });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();

  return texture;
}

/**
 * Texture atlas for all faction shapes
 */
export interface FactionTextures {
  federation: Texture;
  klingon: Texture;
  romulan: Texture;
  borg: Texture;
  tholian: Texture;
  species8472: Texture;
  projectile: Texture;
}

// Texture cache keys for each faction
const TEXTURE_KEYS = {
  federation: 'faction_federation',
  klingon: 'faction_klingon',
  romulan: 'faction_romulan',
  borg: 'faction_borg',
  tholian: 'faction_tholian',
  species8472: 'faction_species8472',
  projectile: 'faction_projectile'
} as const;

/**
 * Create all faction textures with caching support
 * Returns cached textures if available, otherwise creates and caches them
 */
export function createFactionTextures(app: Application): FactionTextures {
  const cache = TextureCache.getInstance();

  // Check if all textures are already cached using defined keys
  const allCached = Object.values(TEXTURE_KEYS).every(key => cache.has(key));
  
  if (allCached) {
    return {
      federation: cache.get(TEXTURE_KEYS.federation)!,
      klingon: cache.get(TEXTURE_KEYS.klingon)!,
      romulan: cache.get(TEXTURE_KEYS.romulan)!,
      borg: cache.get(TEXTURE_KEYS.borg)!,
      tholian: cache.get(TEXTURE_KEYS.tholian)!,
      species8472: cache.get(TEXTURE_KEYS.species8472)!,
      projectile: cache.get(TEXTURE_KEYS.projectile)!
    };
  }

  // Create and cache textures
  const federation = createCircleTexture(app, FACTION_COLORS.FEDERATION);
  const klingon = createTriangleTexture(app, FACTION_COLORS.KLINGON);
  const romulan = createCrescentTexture(app, FACTION_COLORS.ROMULAN);
  const borg = createSquareTexture(app, FACTION_COLORS.BORG);
  const tholian = createDiamondTexture(app, FACTION_COLORS.THOLIAN);
  const species8472 = createYShapeTexture(app, FACTION_COLORS.SPECIES_8472);
  const projectile = createProjectileTexture(app, FACTION_COLORS.PROJECTILE);

  cache.set(TEXTURE_KEYS.federation, federation);
  cache.set(TEXTURE_KEYS.klingon, klingon);
  cache.set(TEXTURE_KEYS.romulan, romulan);
  cache.set(TEXTURE_KEYS.borg, borg);
  cache.set(TEXTURE_KEYS.tholian, tholian);
  cache.set(TEXTURE_KEYS.species8472, species8472);
  cache.set(TEXTURE_KEYS.projectile, projectile);

  return {
    federation,
    klingon,
    romulan,
    borg,
    tholian,
    species8472,
    projectile
  };
}
