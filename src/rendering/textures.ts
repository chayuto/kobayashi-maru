/**
 * Texture generation utilities for geometric faction shapes
 */
import { Graphics, Texture, RenderTexture, Application } from 'pixi.js';
import { FACTION_COLORS } from '../types';

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
 * Create all faction textures
 */
export function createFactionTextures(app: Application): FactionTextures {
  return {
    federation: createCircleTexture(app, FACTION_COLORS.FEDERATION),
    klingon: createTriangleTexture(app, FACTION_COLORS.KLINGON),
    romulan: createCrescentTexture(app, FACTION_COLORS.ROMULAN),
    borg: createSquareTexture(app, FACTION_COLORS.BORG),
    tholian: createDiamondTexture(app, FACTION_COLORS.THOLIAN),
    species8472: createYShapeTexture(app, FACTION_COLORS.SPECIES_8472),
    projectile: createProjectileTexture(app, FACTION_COLORS.PROJECTILE)
  };
}
