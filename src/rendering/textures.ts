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

/**
 * Create all faction textures with caching support
 * Returns cached textures if available, otherwise creates and caches them
 */
export function createFactionTextures(app: Application): FactionTextures {
  const cache = TextureCache.getInstance();

  // Check if all textures are already cached
  if (cache.has('faction_federation') &&
      cache.has('faction_klingon') &&
      cache.has('faction_romulan') &&
      cache.has('faction_borg') &&
      cache.has('faction_tholian') &&
      cache.has('faction_species8472') &&
      cache.has('faction_projectile')) {
    return {
      federation: cache.get('faction_federation')!,
      klingon: cache.get('faction_klingon')!,
      romulan: cache.get('faction_romulan')!,
      borg: cache.get('faction_borg')!,
      tholian: cache.get('faction_tholian')!,
      species8472: cache.get('faction_species8472')!,
      projectile: cache.get('faction_projectile')!
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

  cache.set('faction_federation', federation);
  cache.set('faction_klingon', klingon);
  cache.set('faction_romulan', romulan);
  cache.set('faction_borg', borg);
  cache.set('faction_tholian', tholian);
  cache.set('faction_species8472', species8472);
  cache.set('faction_projectile', projectile);

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
