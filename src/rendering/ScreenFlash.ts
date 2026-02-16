/**
 * Screen Flash for Kobayashi Maru
 *
 * Full-screen color overlay that flashes and fades.
 * Used for hit feedback (red on KM damage) and boss kills (white flash).
 * Follows the ScreenShake pattern: external caller triggers, update() decays.
 *
 * @module rendering/ScreenFlash
 */
import { Application, Graphics } from 'pixi.js';
import { RENDERING_CONFIG } from '../config/rendering.config';
import { GAME_CONFIG } from '../types/constants';

/**
 * Renders a full-screen flash overlay that fades linearly.
 */
export class ScreenFlash {
    private overlay: Graphics;
    private currentAlpha: number = 0;
    private targetAlpha: number = 0;
    private duration: number = 0;
    private elapsed: number = 0;
    private color: number = 0xFFFFFF;
    private config = RENDERING_CONFIG.SCREEN_FLASH;

    constructor() {
        this.overlay = new Graphics();
    }

    /**
     * Initialize by adding the overlay to the app stage.
     */
    init(app: Application): void {
        this.overlay.rect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        this.overlay.fill({ color: 0xFFFFFF });
        this.overlay.alpha = 0;
        this.overlay.zIndex = 9999;
        app.stage.addChild(this.overlay);
    }

    /**
     * Trigger a flash.
     * @param color - Flash color
     * @param intensity - Peak alpha (clamped to MAX_INTENSITY)
     * @param duration - Fade duration in seconds
     */
    flash(color: number, intensity: number, duration: number): void {
        this.color = color;
        this.targetAlpha = Math.min(intensity, this.config.MAX_INTENSITY);
        this.currentAlpha = this.targetAlpha;
        this.duration = duration;
        this.elapsed = 0;

        // Redraw with new color
        this.overlay.clear();
        this.overlay.rect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        this.overlay.fill({ color });
        this.overlay.alpha = this.currentAlpha;
    }

    /**
     * Update the flash decay.
     */
    update(deltaTime: number): void {
        if (this.currentAlpha <= 0) return;

        this.elapsed += deltaTime;
        const progress = Math.min(this.elapsed / this.duration, 1);

        // Linear fade
        this.currentAlpha = this.targetAlpha * (1 - progress);
        this.overlay.alpha = this.currentAlpha;

        if (progress >= 1) {
            this.currentAlpha = 0;
            this.overlay.alpha = 0;
        }
    }

    /**
     * Check if flash is currently active.
     */
    isActive(): boolean {
        return this.currentAlpha > 0;
    }

    /**
     * Get current color (for testing).
     */
    getColor(): number {
        return this.color;
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.overlay.destroy();
    }
}
