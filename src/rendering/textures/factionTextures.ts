/**
 * Faction ship texture generation
 * Contains texture creators for all faction ships
 */
import { Graphics, RenderTexture, Application } from 'pixi.js';
import { SHAPE_SIZE, KOBAYASHI_MARU_SIZE } from './types';
import { renderToTexture } from './utils';

/**
 * Generate a circle texture (Federation)
 */
export function createFederationTexture(app: Application, color: number): RenderTexture {
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
 * Premium detailed Federation flagship with glowing effects
 */
export function createKobayashiMaruTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = KOBAYASHI_MARU_SIZE;
    const centerX = size / 2;
    const centerY = size / 2;

    // === OUTER SHIELD GLOW (draw first, behind everything) ===
    // Triple-layer shield effect for depth
    graphics.ellipse(centerX, centerY, 39, 33);
    graphics.stroke({ color: 0x00FFFF, width: 4, alpha: 0.15 });
    graphics.ellipse(centerX, centerY, 37, 31);
    graphics.stroke({ color: 0x44FFFF, width: 2, alpha: 0.25 });
    graphics.ellipse(centerX, centerY, 35, 29);
    graphics.stroke({ color: 0x88FFFF, width: 1, alpha: 0.35 });

    // === WARP NACELLES (pylons and pods) - Draw before hull for layering ===
    const saucerY = centerY - 12;
    const hullY = centerY + 8;
    const pylonStartY = hullY;
    const pylonEndY = saucerY - 8;
    const nacelleX = 32;

    // Left nacelle body with glow halo
    const leftNacelleX = centerX - nacelleX;
    graphics.roundRect(leftNacelleX - 5, pylonEndY - 19, 10, 28, 4);
    graphics.fill({ color: 0x006666, alpha: 0.5 }); // Glow halo
    graphics.roundRect(leftNacelleX - 4, pylonEndY - 18, 8, 26, 3);
    graphics.fill({ color: 0x008877 }); // Darker, richer teal body

    // Left nacelle bussard collector (VIBRANT red-orange glow)
    graphics.circle(leftNacelleX, pylonEndY - 16, 7);
    graphics.fill({ color: 0xFF2200, alpha: 0.4 }); // Outer glow
    graphics.circle(leftNacelleX, pylonEndY - 16, 5);
    graphics.fill({ color: 0xFF4400, alpha: 0.9 });
    graphics.circle(leftNacelleX, pylonEndY - 16, 3);
    graphics.fill({ color: 0xFFAA66, alpha: 1.0 }); // Hot core

    // Left nacelle warp glow (BRILLIANT blue plasma)
    graphics.rect(leftNacelleX - 3, pylonEndY - 10, 6, 18);
    graphics.fill({ color: 0x0066FF, alpha: 0.5 }); // Outer glow
    graphics.rect(leftNacelleX - 2, pylonEndY - 10, 4, 16);
    graphics.fill({ color: 0x00AAFF, alpha: 0.9 });
    graphics.rect(leftNacelleX - 1, pylonEndY - 8, 2, 12);
    graphics.fill({ color: 0x88EEFF, alpha: 1.0 }); // Hot plasma core

    // Right nacelle body with glow halo
    const rightNacelleX = centerX + nacelleX;
    graphics.roundRect(rightNacelleX - 5, pylonEndY - 19, 10, 28, 4);
    graphics.fill({ color: 0x006666, alpha: 0.5 }); // Glow halo
    graphics.roundRect(rightNacelleX - 4, pylonEndY - 18, 8, 26, 3);
    graphics.fill({ color: 0x008877 });

    // Right nacelle bussard collector (VIBRANT red-orange glow)
    graphics.circle(rightNacelleX, pylonEndY - 16, 7);
    graphics.fill({ color: 0xFF2200, alpha: 0.4 }); // Outer glow
    graphics.circle(rightNacelleX, pylonEndY - 16, 5);
    graphics.fill({ color: 0xFF4400, alpha: 0.9 });
    graphics.circle(rightNacelleX, pylonEndY - 16, 3);
    graphics.fill({ color: 0xFFAA66, alpha: 1.0 }); // Hot core

    // Right nacelle warp glow (BRILLIANT blue plasma)
    graphics.rect(rightNacelleX - 3, pylonEndY - 10, 6, 18);
    graphics.fill({ color: 0x0066FF, alpha: 0.5 }); // Outer glow
    graphics.rect(rightNacelleX - 2, pylonEndY - 10, 4, 16);
    graphics.fill({ color: 0x00AAFF, alpha: 0.9 });
    graphics.rect(rightNacelleX - 1, pylonEndY - 8, 2, 12);
    graphics.fill({ color: 0x88EEFF, alpha: 1.0 }); // Hot plasma core

    // Pylons with gradient effect
    graphics.moveTo(centerX - 4, pylonStartY);
    graphics.lineTo(centerX - nacelleX + 4, pylonEndY);
    graphics.stroke({ color: 0x00AA88, width: 4 });
    graphics.moveTo(centerX - 4, pylonStartY);
    graphics.lineTo(centerX - nacelleX + 4, pylonEndY);
    graphics.stroke({ color: 0x00DDBB, width: 2 });

    graphics.moveTo(centerX + 4, pylonStartY);
    graphics.lineTo(centerX + nacelleX - 4, pylonEndY);
    graphics.stroke({ color: 0x00AA88, width: 4 });
    graphics.moveTo(centerX + 4, pylonStartY);
    graphics.lineTo(centerX + nacelleX - 4, pylonEndY);
    graphics.stroke({ color: 0x00DDBB, width: 2 });

    // === SAUCER SECTION ===
    const saucerRadiusX = 28;
    const saucerRadiusY = 22;

    // Saucer outer glow
    graphics.ellipse(centerX, saucerY, saucerRadiusX + 2, saucerRadiusY + 2);
    graphics.fill({ color: 0x00DDCC, alpha: 0.2 });

    // Main saucer hull
    graphics.ellipse(centerX, saucerY, saucerRadiusX, saucerRadiusY);
    graphics.fill({ color: 0x00BBAA }); // Richer teal

    // Saucer rim highlight (metallic sheen)
    graphics.ellipse(centerX, saucerY, saucerRadiusX - 1, saucerRadiusY - 1);
    graphics.stroke({ color: 0x00FFDD, width: 1.5, alpha: 0.7 });
    graphics.ellipse(centerX, saucerY - 2, saucerRadiusX - 4, saucerRadiusY - 4);
    graphics.stroke({ color: 0x44FFEE, width: 1, alpha: 0.5 });

    // Bridge dome (center top) with glow
    graphics.circle(centerX, saucerY - 4, 8);
    graphics.fill({ color: 0x88FFFF, alpha: 0.3 }); // Glow
    graphics.circle(centerX, saucerY - 4, 6);
    graphics.fill({ color: 0xFFFFFF, alpha: 0.95 });
    graphics.circle(centerX, saucerY - 4, 4);
    graphics.fill({ color: 0xAAFFFF, alpha: 0.9 });

    // Bridge windows ring (BRIGHT running lights)
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI * 2) / 12;
        const wx = centerX + Math.cos(angle) * 12;
        const wy = saucerY - 4 + Math.sin(angle) * 10;
        // Glow halo
        graphics.circle(wx, wy, 2.5);
        graphics.fill({ color: 0xFFEE66, alpha: 0.4 });
        // Light core
        graphics.circle(wx, wy, 1.5);
        graphics.fill({ color: 0xFFFFAA, alpha: 1.0 });
    }

    // Saucer edge running lights (evenly spaced)
    for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI * 2) / 16;
        const lx = centerX + Math.cos(angle) * (saucerRadiusX - 3);
        const ly = saucerY + Math.sin(angle) * (saucerRadiusY - 3);
        graphics.circle(lx, ly, 1);
        graphics.fill({ color: 0xFFFFFF, alpha: 0.8 });
    }

    // === ENGINEERING HULL ===
    const neckWidth = 7;

    // Neck connecting saucer to engineering
    graphics.rect(centerX - neckWidth / 2, saucerY + saucerRadiusY - 4, neckWidth, 14);
    graphics.fill({ color: 0x009988 });

    // Engineering hull (main body)
    graphics.ellipse(centerX, hullY + 8, 11, 15);
    graphics.fill({ color: 0x00BBAA });

    // Deflector dish (BRILLIANT glowing blue)
    graphics.ellipse(centerX, hullY + 20, 8, 5);
    graphics.fill({ color: 0x0066FF, alpha: 0.5 }); // Outer glow
    graphics.ellipse(centerX, hullY + 20, 6, 4);
    graphics.fill({ color: 0x0099FF, alpha: 0.9 });
    graphics.ellipse(centerX, hullY + 20, 4, 2.5);
    graphics.fill({ color: 0x66DDFF, alpha: 1.0 }); // Core

    // Engineering hull detail lines
    graphics.moveTo(centerX - 9, hullY + 2);
    graphics.lineTo(centerX + 9, hullY + 2);
    graphics.moveTo(centerX - 7, hullY + 10);
    graphics.lineTo(centerX + 7, hullY + 10);
    graphics.stroke({ color: 0x00FFCC, width: 1, alpha: 0.4 });

    return renderToTexture(app, graphics, size, size);
}

/**
 * Generate Klingon Bird of Prey texture
 */
export function createKlingonTexture(app: Application, color: number): RenderTexture {
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
export function createRomulanTexture(app: Application, color: number): RenderTexture {
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
export function createBorgTexture(app: Application, color: number): RenderTexture {
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
export function createTholianTexture(app: Application, color: number): RenderTexture {
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
export function createSpecies8472Texture(app: Application, color: number): RenderTexture {
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
export function createProjectileTexture(app: Application, color: number): RenderTexture {
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
