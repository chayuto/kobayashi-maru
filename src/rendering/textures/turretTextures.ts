/**
 * Turret texture generation
 * Contains texture creators for all turret base and barrel types
 */
import { Graphics, RenderTexture, Application } from 'pixi.js';
import { SHAPE_SIZE } from './types';
import { renderToTexture } from './utils';

/**
 * Generate Phaser Turret Base (Hexagon)
 */
export function createTurretBasePhaserTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBarrelPhaserTexture(app: Application, color: number): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBaseTorpedoTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBarrelTorpedoTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBaseDisruptorTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBarrelDisruptorTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBaseTetryonTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBarrelTetryonTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBasePlasmaTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBarrelPlasmaTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBasePolaronTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
export function createTurretBarrelPolaronTexture(app: Application): RenderTexture {
    const graphics = new Graphics();
    const size = SHAPE_SIZE;
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
