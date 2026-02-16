/**
 * Hull Damage Overlay for Kobayashi Maru
 *
 * Red vignette border overlay that intensifies as the Kobayashi Maru's
 * hull decreases. Adds a pulsing effect at critical hull levels.
 * Follows the ScreenFlash pattern: init(app), update(deltaTime), destroy().
 *
 * @module rendering/HullDamageOverlay
 */
import { Application, Graphics } from 'pixi.js';
import { RENDERING_CONFIG } from '../config/rendering.config';
import { GAME_CONFIG } from '../types/constants';

const CONFIG = RENDERING_CONFIG.HULL_DAMAGE_OVERLAY;

/**
 * Renders a red vignette overlay around the screen edges
 * that intensifies as hull health decreases.
 */
export class HullDamageOverlay {
    private graphics: Graphics;
    private initialized: boolean = false;
    private hullPercent: number = 1;
    private animationTime: number = 0;

    constructor() {
        this.graphics = new Graphics();
    }

    /**
     * Initialize by adding the overlay graphics to the app stage.
     */
    init(app: Application): void {
        this.graphics.alpha = 0;
        this.graphics.zIndex = 9998;
        app.stage.addChild(this.graphics);
        this.initialized = true;
    }

    /**
     * Update the overlay effect each frame.
     * @param deltaTime - Time since last frame in seconds
     */
    update(deltaTime: number): void {
        if (!this.initialized) return;

        // If hull is above the enable threshold, hide overlay
        if (this.hullPercent > CONFIG.ENABLE_THRESHOLD) {
            this.graphics.alpha = 0;
            return;
        }

        // Calculate intensity based on how far below threshold
        // At threshold: intensity = 0, at 0 hull: intensity = MAX_INTENSITY
        let intensity = (1 - this.hullPercent / CONFIG.ENABLE_THRESHOLD) * CONFIG.MAX_INTENSITY;

        // At critical hull, add pulsing effect
        if (this.hullPercent <= CONFIG.CRITICAL_THRESHOLD) {
            this.animationTime += deltaTime;
            intensity *= 0.7 + 0.3 * Math.sin(this.animationTime * CONFIG.PULSE_SPEED);
        }

        // Draw vignette border rectangles
        const width = GAME_CONFIG.WORLD_WIDTH;
        const height = GAME_CONFIG.WORLD_HEIGHT;
        const borderWidth = CONFIG.BORDER_WIDTH;
        const color = CONFIG.TINT_COLOR;

        this.graphics.clear();

        // Top bar
        this.graphics.rect(0, 0, width, borderWidth);
        this.graphics.fill({ color, alpha: intensity });

        // Bottom bar
        this.graphics.rect(0, height - borderWidth, width, borderWidth);
        this.graphics.fill({ color, alpha: intensity });

        // Left bar
        this.graphics.rect(0, 0, borderWidth, height);
        this.graphics.fill({ color, alpha: intensity });

        // Right bar
        this.graphics.rect(width - borderWidth, 0, borderWidth, height);
        this.graphics.fill({ color, alpha: intensity });

        this.graphics.alpha = 1;
    }

    /**
     * Set the current hull percent.
     * @param percent - Hull fraction from 0.0 (destroyed) to 1.0 (full)
     */
    setHullPercent(percent: number): void {
        this.hullPercent = percent;
    }

    /**
     * Get the current hull percent (for testing).
     */
    getHullPercent(): number {
        return this.hullPercent;
    }

    /**
     * Check if the overlay is currently visible (for testing).
     */
    isVisible(): boolean {
        return this.graphics.alpha > 0;
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.graphics.destroy();
        this.initialized = false;
    }
}
