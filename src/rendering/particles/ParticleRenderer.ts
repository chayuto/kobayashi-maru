/**
 * Particle Renderer for Kobayashi Maru
 *
 * Handles drawing particles by sprite type and color gradient interpolation.
 *
 * @module rendering/particles/ParticleRenderer
 */

import type { Particle, ColorGradient } from './types';

/**
 * ParticleRenderer handles visual rendering of particles.
 */
export class ParticleRenderer {
    /**
     * Draw a particle based on its sprite type.
     */
    drawParticle(particle: Particle): void {
        particle.sprite.clear();
        particle.sprite.beginFill(particle.color);

        const size = particle.size;

        switch (particle.spriteType) {
            case 'circle':
                particle.sprite.drawCircle(0, 0, size);
                break;

            case 'square':
                particle.sprite.drawRect(-size, -size, size * 2, size * 2);
                break;

            case 'star':
                this.drawStar(particle, size);
                break;

            case 'spark':
                particle.sprite.moveTo(0, -size * 1.5);
                particle.sprite.lineTo(size * 0.3, 0);
                particle.sprite.lineTo(0, size * 1.5);
                particle.sprite.lineTo(-size * 0.3, 0);
                particle.sprite.closePath();
                break;

            case 'smoke':
                particle.sprite.drawCircle(0, 0, size);
                break;

            case 'fire':
                this.drawFire(particle, size);
                break;

            case 'energy':
                this.drawHexagon(particle, size);
                break;
        }

        particle.sprite.endFill();
    }

    private drawStar(particle: Particle, size: number): void {
        const outerRadius = size;
        const innerRadius = size * 0.5;
        const points = 5;

        particle.sprite.moveTo(0, -outerRadius);
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (Math.PI * i) / points - Math.PI / 2;
            particle.sprite.lineTo(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            );
        }
        particle.sprite.closePath();
    }

    private drawFire(particle: Particle, size: number): void {
        const firePoints = 8;
        const seed = (particle.x * 12.9898 + particle.y * 78.233) % 1;
        particle.sprite.moveTo(0, -size);
        for (let i = 0; i <= firePoints; i++) {
            const angle = (Math.PI * 2 * i) / firePoints - Math.PI / 2;
            const localSeed = (seed + i * 0.123) % 1;
            const radius = size * (0.7 + localSeed * 0.3);
            particle.sprite.lineTo(
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            );
        }
        particle.sprite.closePath();
    }

    private drawHexagon(particle: Particle, size: number): void {
        const hexPoints = 6;
        particle.sprite.moveTo(size * Math.cos(-Math.PI / 2), size * Math.sin(-Math.PI / 2));
        for (let i = 1; i <= hexPoints; i++) {
            const angle = (Math.PI * 2 * i) / hexPoints - Math.PI / 2;
            particle.sprite.lineTo(
                size * Math.cos(angle),
                size * Math.sin(angle)
            );
        }
        particle.sprite.closePath();
    }

    /**
     * Render trail for a particle.
     */
    renderTrail(particle: Particle): void {
        if (!particle.trail || particle.trail.positions.length < 2) {
            return;
        }

        const trail = particle.trail;
        trail.graphics.clear();

        for (let i = 1; i < trail.positions.length; i++) {
            const prev = trail.positions[i - 1];
            const curr = trail.positions[i];
            const segmentAlpha = (i / trail.positions.length) * particle.alpha * (1 - trail.config.fadeRate);

            trail.graphics.lineStyle(trail.config.width, particle.color, segmentAlpha);
            trail.graphics.moveTo(prev.x, prev.y);
            trail.graphics.lineTo(curr.x, curr.y);
        }
    }

    /**
     * Interpolate color along a gradient based on particle life.
     */
    interpolateColorGradient(gradient: ColorGradient, normalizedLife: number): { color: number; alpha: number } {
        const time = 1 - normalizedLife;

        if (gradient.stops.length === 0) {
            return { color: 0xFFFFFF, alpha: 1 };
        }

        if (gradient.stops.length === 1) {
            return { color: gradient.stops[0].color, alpha: gradient.stops[0].alpha };
        }

        let startStop = gradient.stops[0];
        let endStop = gradient.stops[gradient.stops.length - 1];

        for (let i = 0; i < gradient.stops.length - 1; i++) {
            if (time >= gradient.stops[i].time && time <= gradient.stops[i + 1].time) {
                startStop = gradient.stops[i];
                endStop = gradient.stops[i + 1];
                break;
            }
        }

        const range = endStop.time - startStop.time;
        const t = range > 0 ? (time - startStop.time) / range : 0;

        const startR = (startStop.color >> 16) & 0xFF;
        const startG = (startStop.color >> 8) & 0xFF;
        const startB = startStop.color & 0xFF;

        const endR = (endStop.color >> 16) & 0xFF;
        const endG = (endStop.color >> 8) & 0xFF;
        const endB = endStop.color & 0xFF;

        const r = Math.round(startR + (endR - startR) * t);
        const g = Math.round(startG + (endG - startG) * t);
        const b = Math.round(startB + (endB - startB) * t);

        const color = (r << 16) | (g << 8) | b;
        const alpha = startStop.alpha + (endStop.alpha - startStop.alpha) * t;

        return { color, alpha };
    }
}
