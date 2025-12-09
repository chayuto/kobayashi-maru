/**
 * Texture generation utilities for geometric faction shapes
 */
import { Graphics, Texture, RenderTexture, Application } from 'pixi.js';
import { FACTION_COLORS } from '../types';
import { TextureCache } from './TextureCache';

// Size of each shape texture
const SHAPE_SIZE = 32;
// Kobayashi Maru is a larger, more detailed ship
const KOBAYASHI_MARU_SIZE = 80;

/**
 * Helper to render graphics to texture
 */
function renderToTexture(app: Application, graphics: Graphics, width: number, height: number): RenderTexture {
  const texture = RenderTexture.create({ width, height });
  app.renderer.render({ container: graphics, target: texture });
  graphics.destroy();
  return texture;
}

/**
 * Generate a circle texture (Federation)
 */
function createFederationTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = SHAPE_SIZE;

  // Saucer section
  graphics.circle(size / 2, size / 2, size / 2 - 2);
  graphics.fill({ color });

  // Bridge
  graphics.circle(size / 2, size / 2, size / 6);
  graphics.fill({ color: 0xFFFFFF, alpha: 0.8 });

  // Nacelles hint (simple lines for now as it's top down)
  graphics.rect(size / 2 - size / 3, size - 6, size / 6, 4);
  graphics.rect(size / 2 + size / 6, size - 6, size / 6, 4);
  graphics.fill({ color: 0x99CCFF });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Kobayashi Maru (Constitution-class refit style) texture
 * A detailed, impressive looking Federation flagship
 */
function createKobayashiMaruTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = KOBAYASHI_MARU_SIZE;
  const centerX = size / 2;
  const centerY = size / 2;

  // === SAUCER SECTION (top) ===
  const saucerY = centerY - 12;
  const saucerRadiusX = 28;
  const saucerRadiusY = 22;

  // Main saucer hull - elliptical for perspective
  graphics.ellipse(centerX, saucerY, saucerRadiusX, saucerRadiusY);
  graphics.fill({ color });

  // Saucer rim glow
  graphics.ellipse(centerX, saucerY, saucerRadiusX - 2, saucerRadiusY - 2);
  graphics.stroke({ color: 0x66DDBB, width: 2, alpha: 0.6 });

  // Bridge dome (center top)
  graphics.circle(centerX, saucerY - 4, 6);
  graphics.fill({ color: 0xFFFFFF, alpha: 0.9 });
  graphics.circle(centerX, saucerY - 4, 4);
  graphics.fill({ color: 0x99EEFF, alpha: 0.8 });

  // Bridge windows ring
  for (let i = 0; i < 8; i++) {
    const angle = (i * Math.PI * 2) / 8;
    const wx = centerX + Math.cos(angle) * 10;
    const wy = saucerY - 4 + Math.sin(angle) * 8;
    graphics.circle(wx, wy, 1.5);
  }
  graphics.fill({ color: 0xFFDD88, alpha: 0.9 });

  // === ENGINEERING HULL (neck and body) ===
  const neckWidth = 6;
  const hullY = centerY + 8;

  // Neck connecting saucer to engineering
  graphics.rect(centerX - neckWidth / 2, saucerY + saucerRadiusY - 4, neckWidth, 14);
  graphics.fill({ color: 0x228866 });

  // Engineering hull (main body)
  graphics.ellipse(centerX, hullY + 8, 10, 14);
  graphics.fill({ color });

  // Deflector dish (glowing blue)
  graphics.ellipse(centerX, hullY + 20, 6, 4);
  graphics.fill({ color: 0x0088FF, alpha: 0.9 });
  graphics.ellipse(centerX, hullY + 20, 4, 2.5);
  graphics.fill({ color: 0x66CCFF, alpha: 1.0 });

  // Engineering hull detail lines
  graphics.moveTo(centerX - 8, hullY + 2);
  graphics.lineTo(centerX + 8, hullY + 2);
  graphics.moveTo(centerX - 6, hullY + 10);
  graphics.lineTo(centerX + 6, hullY + 10);
  graphics.stroke({ color: 0x44AA88, width: 1, alpha: 0.5 });

  // === WARP NACELLES (pylons and pods) ===
  const pylonStartY = hullY;
  const pylonEndY = saucerY - 8;
  const nacelleX = 32;

  // Left pylon
  graphics.moveTo(centerX - 4, pylonStartY);
  graphics.lineTo(centerX - nacelleX + 4, pylonEndY);
  graphics.stroke({ color: 0x44AA77, width: 3 });

  // Right pylon  
  graphics.moveTo(centerX + 4, pylonStartY);
  graphics.lineTo(centerX + nacelleX - 4, pylonEndY);
  graphics.stroke({ color: 0x44AA77, width: 3 });

  // Left nacelle
  const leftNacelleX = centerX - nacelleX;
  graphics.roundRect(leftNacelleX - 4, pylonEndY - 18, 8, 26, 3);
  graphics.fill({ color: 0x336655 });

  // Left nacelle bussard collector (front glow)
  graphics.circle(leftNacelleX, pylonEndY - 16, 5);
  graphics.fill({ color: 0xFF4422, alpha: 0.9 });
  graphics.circle(leftNacelleX, pylonEndY - 16, 3);
  graphics.fill({ color: 0xFF8866, alpha: 1.0 });

  // Left nacelle warp glow (blue plasma)
  graphics.rect(leftNacelleX - 2, pylonEndY - 10, 4, 16);
  graphics.fill({ color: 0x0099FF, alpha: 0.8 });
  graphics.rect(leftNacelleX - 1, pylonEndY - 8, 2, 12);
  graphics.fill({ color: 0x66DDFF, alpha: 1.0 });

  // Right nacelle
  const rightNacelleX = centerX + nacelleX;
  graphics.roundRect(rightNacelleX - 4, pylonEndY - 18, 8, 26, 3);
  graphics.fill({ color: 0x336655 });

  // Right nacelle bussard collector (front glow)
  graphics.circle(rightNacelleX, pylonEndY - 16, 5);
  graphics.fill({ color: 0xFF4422, alpha: 0.9 });
  graphics.circle(rightNacelleX, pylonEndY - 16, 3);
  graphics.fill({ color: 0xFF8866, alpha: 1.0 });

  // Right nacelle warp glow (blue plasma)
  graphics.rect(rightNacelleX - 2, pylonEndY - 10, 4, 16);
  graphics.fill({ color: 0x0099FF, alpha: 0.8 });
  graphics.rect(rightNacelleX - 1, pylonEndY - 8, 2, 12);
  graphics.fill({ color: 0x66DDFF, alpha: 1.0 });

  // === SHIELD EFFECT (subtle outer glow) ===
  graphics.ellipse(centerX, centerY, 38, 32);
  graphics.stroke({ color: 0x44FFFF, width: 2, alpha: 0.3 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Klingon Bird of Prey texture
 */
function createKlingonTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = SHAPE_SIZE;

  // Main hull - swept-wing bird shape
  graphics.poly([
    size / 2, 2,           // Nose (forward point)
    size - 4, size / 2,    // Right wingtip
    size / 2 + 4, size / 2 + 6, // Right wing joint
    size / 2, size - 4,    // Tail
    size / 2 - 4, size / 2 + 6, // Left wing joint
    4, size / 2            // Left wingtip
  ]);
  graphics.fill({ color });

  // Wing struts
  graphics.moveTo(size / 2, size / 3);
  graphics.lineTo(size - 6, size / 2 - 2);
  graphics.moveTo(size / 2, size / 3);
  graphics.lineTo(6, size / 2 - 2);
  graphics.stroke({ color: 0xFFFFFF, alpha: 0.3, width: 1 });

  // Bridge (center cockpit)
  graphics.circle(size / 2, size / 3, 3);
  graphics.fill({ color: 0x882222 });

  // Dual engine glow
  graphics.circle(size / 2 - 4, size - 6, 2);
  graphics.circle(size / 2 + 4, size - 6, 2);
  graphics.fill({ color: 0xFF4444, alpha: 0.8 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Romulan Warbird texture
 */
function createRomulanTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = SHAPE_SIZE;

  // Main hull - crescent/bird shape with swept wings
  graphics.poly([
    size / 2, 4,             // Nose
    size - 3, size / 3,      // Right wing forward
    size - 5, size / 2 + 4,  // Right wing back
    size / 2, size / 2,        // Center notch
    5, size / 2 + 4,         // Left wing back
    3, size / 3              // Left wing forward
  ]);
  graphics.fill({ color });

  // Wing feather details
  graphics.moveTo(size / 2, size / 4);
  graphics.lineTo(size - 8, size / 3 + 2);
  graphics.moveTo(size / 2, size / 4);
  graphics.lineTo(8, size / 3 + 2);
  graphics.stroke({ color: 0xFFFFFF, alpha: 0.2, width: 1 });

  // Cloaking device glow (center)
  graphics.circle(size / 2, size / 3, 4);
  graphics.fill({ color: 0x66CC33, alpha: 0.6 });

  // Singularity core (engine)
  graphics.arc(size / 2, size / 2 + 2, 6, 0, Math.PI);
  graphics.stroke({ color: 0x99FF66, alpha: 0.8, width: 2 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Borg Cube texture
 */
function createBorgTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = SHAPE_SIZE;

  // Main cube body
  graphics.rect(4, 4, size - 8, size - 8);
  graphics.fill({ color });

  // Grid pattern (Borg aesthetic)
  for (let i = 0; i < 3; i++) {
    graphics.moveTo(8 + i * 6, 4);
    graphics.lineTo(8 + i * 6, size - 4);
    graphics.moveTo(4, 8 + i * 6);
    graphics.lineTo(size - 4, 8 + i * 6);
  }
  graphics.stroke({ color: 0x000000, alpha: 0.5, width: 1 });

  // Corner energy nodes
  graphics.circle(6, 6, 2);
  graphics.circle(size - 6, 6, 2);
  graphics.circle(6, size - 6, 2);
  graphics.circle(size - 6, size - 6, 2);
  graphics.fill({ color: 0x44FF44, alpha: 0.9 });

  // Central core
  graphics.circle(size / 2, size / 2, 4);
  graphics.fill({ color: 0x00FF00, alpha: 0.7 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Tholian Vessel texture
 */
function createTholianTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = SHAPE_SIZE;

  // Main body - elongated diamond/crystal shape
  graphics.poly([
    size / 2, 2,             // Top point
    size - 4, size / 2 - 4,  // Right upper
    size - 2, size / 2,      // Right mid
    size - 4, size / 2 + 4,  // Right lower
    size / 2, size - 2,      // Bottom point
    4, size / 2 + 4,         // Left lower
    2, size / 2,             // Left mid
    4, size / 2 - 4          // Left upper
  ]);
  graphics.fill({ color });

  // Crystal facets
  graphics.moveTo(size / 2, 2);
  graphics.lineTo(size / 2, size - 2);
  graphics.moveTo(4, size / 2 - 4);
  graphics.lineTo(size - 4, size / 2 + 4);
  graphics.moveTo(4, size / 2 + 4);
  graphics.lineTo(size - 4, size / 2 - 4);
  graphics.stroke({ color: 0xFFAA33, alpha: 0.5, width: 1 });

  // Core heat glow
  graphics.circle(size / 2, size / 2, 5);
  graphics.fill({ color: 0xFFDD00, alpha: 0.6 });

  // Web emitter tips
  graphics.circle(size / 2, 4, 2);
  graphics.circle(size / 2, size - 4, 2);
  graphics.fill({ color: 0xFF8800, alpha: 0.9 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Species 8472 Bioship texture
 */
function createSpecies8472Texture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = SHAPE_SIZE;

  // Organic Y-shaped hull
  // Main body (curved organic shape)
  graphics.moveTo(size / 2, 2);
  graphics.bezierCurveTo(size / 2 + 4, size / 3, size / 2 + 2, size / 2, size / 2, size / 2 + 2);
  graphics.bezierCurveTo(size / 2 - 2, size / 2, size / 2 - 4, size / 3, size / 2, 2);
  graphics.fill({ color });

  // Left tendril
  graphics.moveTo(size / 2, size / 2 + 2);
  graphics.bezierCurveTo(size / 4, size / 2 + 6, 4, size - 8, 2, size - 2);
  graphics.lineTo(6, size - 4);
  graphics.bezierCurveTo(8, size - 10, size / 4, size / 2 + 2, size / 2, size / 2 + 2);
  graphics.fill({ color });

  // Right tendril
  graphics.moveTo(size / 2, size / 2 + 2);
  graphics.bezierCurveTo(size * 3 / 4, size / 2 + 6, size - 4, size - 8, size - 2, size - 2);
  graphics.lineTo(size - 6, size - 4);
  graphics.bezierCurveTo(size - 8, size - 10, size * 3 / 4, size / 2 + 2, size / 2, size / 2 + 2);
  graphics.fill({ color });

  // Bio-luminescent nodes
  graphics.circle(size / 2, size / 4, 3);
  graphics.fill({ color: 0xFFAAFF, alpha: 0.9 });

  graphics.circle(6, size - 6, 2);
  graphics.circle(size - 6, size - 6, 2);
  graphics.fill({ color: 0xDD88FF, alpha: 0.8 });

  // Organic veins
  graphics.moveTo(size / 2, size / 4 + 3);
  graphics.lineTo(size / 2, size / 2);
  graphics.moveTo(size / 2, size / 2);
  graphics.lineTo(8, size - 8);
  graphics.moveTo(size / 2, size / 2);
  graphics.lineTo(size - 8, size - 8);
  graphics.stroke({ color: 0xAA66DD, alpha: 0.4, width: 1 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate projectile texture
 */
function createProjectileTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 16; // Projectiles stay small

  // Core
  graphics.circle(size / 2, size / 2, size / 2 - 2);
  graphics.fill({ color });

  // High contrast center
  graphics.circle(size / 2, size / 2, 3);
  graphics.fill({ color: 0xFFFFFF });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Phaser Turret Base (Hexagon)
 */
function createTurretBasePhaserTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Hexagon Base
  const radius = size / 2;
  graphics.moveTo(center + radius, center);
  for (let i = 1; i <= 6; i++) {
    const angle = (i * Math.PI) / 3;
    graphics.lineTo(center + radius * Math.cos(angle), center + radius * Math.sin(angle));
  }
  graphics.fill({ color: 0x3366AA }); // Darker Federation blue
  graphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Phaser Turret Barrel
 */
function createTurretBarrelPhaserTexture(app: Application, color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Cannon barrel
  // Draw relative to center being pivot point
  graphics.rect(center - 2, 0, 4, center + 4);
  graphics.fill({ color });

  // Turret cap
  graphics.circle(center, center, 6);
  graphics.fill({ color: 0xFFFFFF });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Torpedo Turret Base (Octagon)
 */
function createTurretBaseTorpedoTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Octagon Base
  const radius = size / 2;
  graphics.moveTo(center + radius, center);
  for (let i = 1; i <= 8; i++) {
    const angle = (i * Math.PI) / 4;
    graphics.lineTo(center + radius * Math.cos(angle), center + radius * Math.sin(angle));
  }
  graphics.fill({ color: 0x444444 }); // Industrial grey
  graphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Torpedo Turret Barrel
 */
function createTurretBarrelTorpedoTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Dual launchers
  graphics.rect(center - 6, 0, 4, center + 4); // Left barrel
  graphics.rect(center + 2, 0, 4, center + 4); // Right barrel
  graphics.fill({ color: 0xFF0000 }); // Red

  // Cap
  graphics.circle(center, center, 5);
  graphics.fill({ color: 0xAAAAAA });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Disruptor Turret Base (Pentagon)
 */
function createTurretBaseDisruptorTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Pentagon Base
  const radius = size / 2;
  const startAngle = -Math.PI / 2;

  graphics.moveTo(center + radius * Math.cos(startAngle), center + radius * Math.sin(startAngle));
  for (let i = 1; i <= 5; i++) {
    const angle = startAngle + (i * 2 * Math.PI) / 5;
    graphics.lineTo(center + radius * Math.cos(angle), center + radius * Math.sin(angle));
  }
  graphics.fill({ color: 0x228822 });
  graphics.stroke({ color: 0xFFFFFF, width: 1, alpha: 0.5 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Disruptor Turret Barrel
 */
function createTurretBarrelDisruptorTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Disruptor coil (triangular)
  graphics.poly([
    center, 2,
    center - 4, center + 4,
    center + 4, center + 4
  ]);
  graphics.fill({ color: 0x66FF66 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Tetryon Turret Base (Diamond/Rhombus - Shield-stripping theme)
 */
function createTurretBaseTetryonTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Diamond Base (rotated square)
  graphics.poly([
    center, 2,           // Top
    size - 2, center,    // Right
    center, size - 2,    // Bottom
    2, center            // Left
  ]);
  graphics.fill({ color: 0x00AAAA }); // Teal color
  graphics.stroke({ color: 0x66FFFF, width: 2, alpha: 0.7 });

  // Inner energy glow
  graphics.circle(center, center, 4);
  graphics.fill({ color: 0x88FFFF, alpha: 0.6 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Tetryon Turret Barrel
 */
function createTurretBarrelTetryonTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Twin tetryon emitters (V-shaped)
  graphics.moveTo(center - 3, center + 2);
  graphics.lineTo(center, 2);
  graphics.lineTo(center + 3, center + 2);
  graphics.stroke({ color: 0x00FFFF, width: 3 });

  // Energy core
  graphics.circle(center, center, 5);
  graphics.fill({ color: 0x44DDDD });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Plasma Turret Base (Star/Burst shape - Burning theme)
 */
function createTurretBasePlasmaTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // 6-pointed star base
  const outerRadius = size / 2 - 1;
  const innerRadius = size / 4;
  const points: number[] = [];

  for (let i = 0; i < 6; i++) {
    const outerAngle = (i * Math.PI) / 3 - Math.PI / 2;
    const innerAngle = outerAngle + Math.PI / 6;
    points.push(center + outerRadius * Math.cos(outerAngle));
    points.push(center + outerRadius * Math.sin(outerAngle));
    points.push(center + innerRadius * Math.cos(innerAngle));
    points.push(center + innerRadius * Math.sin(innerAngle));
  }

  graphics.poly(points);
  graphics.fill({ color: 0xCC4400 }); // Deep orange
  graphics.stroke({ color: 0xFF8800, width: 1, alpha: 0.8 });

  // Heat core
  graphics.circle(center, center, 5);
  graphics.fill({ color: 0xFF6600, alpha: 0.9 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Plasma Turret Barrel
 */
function createTurretBarrelPlasmaTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Plasma launcher nozzle (wide cone)
  graphics.poly([
    center - 5, center + 2,
    center, 0,
    center + 5, center + 2
  ]);
  graphics.fill({ color: 0xFF4400 });

  // Flame tip
  graphics.circle(center, 4, 3);
  graphics.fill({ color: 0xFFAA00, alpha: 0.9 });

  // Cannon base
  graphics.circle(center, center, 4);
  graphics.fill({ color: 0xAA3300 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Polaron Turret Base (Triangle - Power drain theme)
 */
function createTurretBasePollarronTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Equilateral triangle base (pointing up)
  const radius = size / 2 - 1;
  graphics.poly([
    center, 2,                                    // Top
    center + radius * 0.866, center + radius / 2, // Bottom right
    center - radius * 0.866, center + radius / 2  // Bottom left
  ]);
  graphics.fill({ color: 0x6633AA }); // Purple
  graphics.stroke({ color: 0xAA66FF, width: 2, alpha: 0.6 });

  // Power drain symbol (inner triangle)
  graphics.poly([
    center, 8,
    center + 6, center + 2,
    center - 6, center + 2
  ]);
  graphics.stroke({ color: 0xCC88FF, width: 1, alpha: 0.8 });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Polaron Turret Barrel
 */
function createTurretBarrelPolaronTexture(app: Application, _color: number): RenderTexture {
  const graphics = new Graphics();
  const size = 32;
  const center = size / 2;

  // Single focused beam emitter
  graphics.rect(center - 2, 0, 4, center);
  graphics.fill({ color: 0x8844CC });

  // Energy rings
  graphics.circle(center, center, 6);
  graphics.stroke({ color: 0xAA66FF, width: 2, alpha: 0.7 });
  graphics.circle(center, center, 4);
  graphics.fill({ color: 0xCC88FF });

  return renderToTexture(app, graphics, size, size);
}

/**
 * Texture atlas for all faction shapes
 */
export interface FactionTextures {
  federation: Texture;
  kobayashiMaru: Texture;
  klingon: Texture;
  romulan: Texture;
  borg: Texture;
  tholian: Texture;
  species8472: Texture;
  projectile: Texture;
  turretPhaser: Texture; // Legacy/Fallback
  turretTorpedo: Texture;
  turretDisruptor: Texture;
  turretTetryon: Texture;
  turretPlasma: Texture;
  turretPolaron: Texture;
  // New split textures
  turretBasePhaser: Texture;
  turretBarrelPhaser: Texture;
  turretBaseTorpedo: Texture;
  turretBarrelTorpedo: Texture;
  turretBaseDisruptor: Texture;
  turretBarrelDisruptor: Texture;
  turretBaseTetryon: Texture;
  turretBarrelTetryon: Texture;
  turretBasePlasma: Texture;
  turretBarrelPlasma: Texture;
  turretBasePolaron: Texture;
  turretBarrelPolaron: Texture;
}

// Texture cache keys for each faction
const TEXTURE_KEYS = {
  federation: 'faction_federation',
  kobayashiMaru: 'faction_kobayashi_maru',
  klingon: 'faction_klingon',
  romulan: 'faction_romulan',
  borg: 'faction_borg',
  tholian: 'faction_tholian',
  species8472: 'faction_species8472',
  projectile: 'faction_projectile',
  turretPhaser: 'turret_phaser',
  turretTorpedo: 'turret_torpedo',
  turretDisruptor: 'turret_disruptor',
  turretTetryon: 'turret_tetryon',
  turretPlasma: 'turret_plasma',
  turretPolaron: 'turret_polaron',
  turretBasePhaser: 'turret_base_phaser',
  turretBarrelPhaser: 'turret_barrel_phaser',
  turretBaseTorpedo: 'turret_base_torpedo',
  turretBarrelTorpedo: 'turret_barrel_torpedo',
  turretBaseDisruptor: 'turret_base_disruptor',
  turretBarrelDisruptor: 'turret_barrel_disruptor',
  turretBaseTetryon: 'turret_base_tetryon',
  turretBarrelTetryon: 'turret_barrel_tetryon',
  turretBasePlasma: 'turret_base_plasma',
  turretBarrelPlasma: 'turret_barrel_plasma',
  turretBasePolaron: 'turret_base_polaron',
  turretBarrelPolaron: 'turret_barrel_polaron'
} as const;

/**
 * Create all faction textures with caching support
 * Returns cached textures if available, otherwise creates and caches them
 */
export function createFactionTextures(app: Application): FactionTextures {
  const cache = TextureCache.getInstance();

  // Check if key textures are cached (simplified check)
  if (cache.has(TEXTURE_KEYS.federation) && cache.has(TEXTURE_KEYS.turretBasePhaser)) {
    return {
      federation: cache.get(TEXTURE_KEYS.federation)!,
      kobayashiMaru: cache.get(TEXTURE_KEYS.kobayashiMaru)!,
      klingon: cache.get(TEXTURE_KEYS.klingon)!,
      romulan: cache.get(TEXTURE_KEYS.romulan)!,
      borg: cache.get(TEXTURE_KEYS.borg)!,
      tholian: cache.get(TEXTURE_KEYS.tholian)!,
      species8472: cache.get(TEXTURE_KEYS.species8472)!,
      projectile: cache.get(TEXTURE_KEYS.projectile)!,
      turretPhaser: cache.get(TEXTURE_KEYS.turretPhaser)!,
      turretTorpedo: cache.get(TEXTURE_KEYS.turretTorpedo)!,
      turretDisruptor: cache.get(TEXTURE_KEYS.turretDisruptor)!,
      turretTetryon: cache.get(TEXTURE_KEYS.turretTetryon)!,
      turretPlasma: cache.get(TEXTURE_KEYS.turretPlasma)!,
      turretPolaron: cache.get(TEXTURE_KEYS.turretPolaron)!,
      turretBasePhaser: cache.get(TEXTURE_KEYS.turretBasePhaser)!,
      turretBarrelPhaser: cache.get(TEXTURE_KEYS.turretBarrelPhaser)!,
      turretBaseTorpedo: cache.get(TEXTURE_KEYS.turretBaseTorpedo)!,
      turretBarrelTorpedo: cache.get(TEXTURE_KEYS.turretBarrelTorpedo)!,
      turretBaseDisruptor: cache.get(TEXTURE_KEYS.turretBaseDisruptor)!,
      turretBarrelDisruptor: cache.get(TEXTURE_KEYS.turretBarrelDisruptor)!,
      turretBaseTetryon: cache.get(TEXTURE_KEYS.turretBaseTetryon)!,
      turretBarrelTetryon: cache.get(TEXTURE_KEYS.turretBarrelTetryon)!,
      turretBasePlasma: cache.get(TEXTURE_KEYS.turretBasePlasma)!,
      turretBarrelPlasma: cache.get(TEXTURE_KEYS.turretBarrelPlasma)!,
      turretBasePolaron: cache.get(TEXTURE_KEYS.turretBasePolaron)!,
      turretBarrelPolaron: cache.get(TEXTURE_KEYS.turretBarrelPolaron)!
    };
  }

  // Create and cache textures
  const federation = createFederationTexture(app, FACTION_COLORS.FEDERATION);
  const kobayashiMaru = createKobayashiMaruTexture(app, FACTION_COLORS.FEDERATION);
  const klingon = createKlingonTexture(app, FACTION_COLORS.KLINGON);
  const romulan = createRomulanTexture(app, FACTION_COLORS.ROMULAN);
  const borg = createBorgTexture(app, FACTION_COLORS.BORG);
  const tholian = createTholianTexture(app, FACTION_COLORS.THOLIAN);
  const species8472 = createSpecies8472Texture(app, FACTION_COLORS.SPECIES_8472);
  const projectile = createProjectileTexture(app, FACTION_COLORS.PROJECTILE);

  // Legacy/Composite fallbacks (just in case)
  const turretPhaser = createTurretBasePhaserTexture(app, FACTION_COLORS.FEDERATION);
  const turretTorpedo = createTurretBaseTorpedoTexture(app, FACTION_COLORS.FEDERATION);
  const turretDisruptor = createTurretBaseDisruptorTexture(app, FACTION_COLORS.FEDERATION);
  const turretTetryon = createTurretBaseTetryonTexture(app, FACTION_COLORS.FEDERATION);
  const turretPlasma = createTurretBasePlasmaTexture(app, FACTION_COLORS.FEDERATION);
  const turretPolaron = createTurretBasePollarronTexture(app, FACTION_COLORS.FEDERATION);

  // New split textures
  const turretBasePhaser = createTurretBasePhaserTexture(app, FACTION_COLORS.FEDERATION);
  const turretBarrelPhaser = createTurretBarrelPhaserTexture(app, FACTION_COLORS.FEDERATION);
  const turretBaseTorpedo = createTurretBaseTorpedoTexture(app, FACTION_COLORS.FEDERATION);
  const turretBarrelTorpedo = createTurretBarrelTorpedoTexture(app, FACTION_COLORS.FEDERATION);
  const turretBaseDisruptor = createTurretBaseDisruptorTexture(app, FACTION_COLORS.FEDERATION);
  const turretBarrelDisruptor = createTurretBarrelDisruptorTexture(app, FACTION_COLORS.FEDERATION);
  const turretBaseTetryon = createTurretBaseTetryonTexture(app, FACTION_COLORS.FEDERATION);
  const turretBarrelTetryon = createTurretBarrelTetryonTexture(app, FACTION_COLORS.FEDERATION);
  const turretBasePlasma = createTurretBasePlasmaTexture(app, FACTION_COLORS.FEDERATION);
  const turretBarrelPlasma = createTurretBarrelPlasmaTexture(app, FACTION_COLORS.FEDERATION);
  const turretBasePolaron = createTurretBasePollarronTexture(app, FACTION_COLORS.FEDERATION);
  const turretBarrelPolaron = createTurretBarrelPolaronTexture(app, FACTION_COLORS.FEDERATION);

  cache.set(TEXTURE_KEYS.federation, federation);
  cache.set(TEXTURE_KEYS.kobayashiMaru, kobayashiMaru);
  cache.set(TEXTURE_KEYS.klingon, klingon);
  cache.set(TEXTURE_KEYS.romulan, romulan);
  cache.set(TEXTURE_KEYS.borg, borg);
  cache.set(TEXTURE_KEYS.tholian, tholian);
  cache.set(TEXTURE_KEYS.species8472, species8472);
  cache.set(TEXTURE_KEYS.projectile, projectile);
  cache.set(TEXTURE_KEYS.turretPhaser, turretPhaser);
  cache.set(TEXTURE_KEYS.turretTorpedo, turretTorpedo);
  cache.set(TEXTURE_KEYS.turretDisruptor, turretDisruptor);
  cache.set(TEXTURE_KEYS.turretTetryon, turretTetryon);
  cache.set(TEXTURE_KEYS.turretPlasma, turretPlasma);
  cache.set(TEXTURE_KEYS.turretPolaron, turretPolaron);

  cache.set(TEXTURE_KEYS.turretBasePhaser, turretBasePhaser);
  cache.set(TEXTURE_KEYS.turretBarrelPhaser, turretBarrelPhaser);
  cache.set(TEXTURE_KEYS.turretBaseTorpedo, turretBaseTorpedo);
  cache.set(TEXTURE_KEYS.turretBarrelTorpedo, turretBarrelTorpedo);
  cache.set(TEXTURE_KEYS.turretBaseDisruptor, turretBaseDisruptor);
  cache.set(TEXTURE_KEYS.turretBarrelDisruptor, turretBarrelDisruptor);
  cache.set(TEXTURE_KEYS.turretBaseTetryon, turretBaseTetryon);
  cache.set(TEXTURE_KEYS.turretBarrelTetryon, turretBarrelTetryon);
  cache.set(TEXTURE_KEYS.turretBasePlasma, turretBasePlasma);
  cache.set(TEXTURE_KEYS.turretBarrelPlasma, turretBarrelPlasma);
  cache.set(TEXTURE_KEYS.turretBasePolaron, turretBasePolaron);
  cache.set(TEXTURE_KEYS.turretBarrelPolaron, turretBarrelPolaron);

  return {
    federation,
    kobayashiMaru,
    klingon,
    romulan,
    borg,
    tholian,
    species8472,
    projectile,
    turretPhaser,
    turretTorpedo,
    turretDisruptor,
    turretTetryon,
    turretPlasma,
    turretPolaron,
    turretBasePhaser,
    turretBarrelPhaser,
    turretBaseTorpedo,
    turretBarrelTorpedo,
    turretBaseDisruptor,
    turretBarrelDisruptor,
    turretBaseTetryon,
    turretBarrelTetryon,
    turretBasePlasma,
    turretBarrelPlasma,
    turretBasePolaron,
    turretBarrelPolaron
  };
}
