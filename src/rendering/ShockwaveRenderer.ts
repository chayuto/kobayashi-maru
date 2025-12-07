import { Graphics, Container } from 'pixi.js';

/**
 * Shockwave visual effect configuration
 */
export interface Shockwave {
    id: string;
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    width: number;
    color: number;
    alpha: number;
    duration: number;
    elapsed: number;
    distortionIntensity?: number; // Optional distortion effect
}

/**
 * Renders expanding shockwave rings for explosions
 */
export class ShockwaveRenderer {
    private shockwaves: Shockwave[] = [];
    private graphics: Graphics;
    private container: Container;
    private initialized: boolean = false;

    constructor() {
        this.graphics = new Graphics();
        this.container = new Container();
        this.container.addChild(this.graphics);
    }

    /**
     * Initialize the renderer
     * @param glowContainer - Optional container for glow effects
     */
    init(glowContainer?: Container): void {
        if (this.initialized) return;

        if (glowContainer) {
            glowContainer.addChild(this.container);
        }

        this.initialized = true;
    }

    /**
     * Create a shockwave effect
     * @param x - X position of explosion center
     * @param y - Y position of explosion center
     * @param maxRadius - Maximum radius the shockwave will expand to
     * @param color - Color of the shockwave ring
     * @param duration - Duration of the effect in seconds
     * @param distortion - Optional distortion intensity
     * @returns The ID of the created shockwave
     */
    create(
        x: number,
        y: number,
        maxRadius: number,
        color: number,
        duration: number,
        distortion?: number
    ): string {
        const id = `shockwave-${Date.now()}-${Math.random()}`;

        this.shockwaves.push({
            id,
            x,
            y,
            radius: 0,
            maxRadius,
            width: 8,
            color,
            alpha: 1.0,
            duration,
            elapsed: 0,
            distortionIntensity: distortion
        });

        return id;
    }

    /**
     * Update and render shockwaves
     * @param deltaTime - Time elapsed since last frame in seconds
     */
    render(deltaTime: number): void {
        this.graphics.clear();

        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const wave = this.shockwaves[i];
            wave.elapsed += deltaTime;

            // Remove expired shockwaves
            if (wave.elapsed >= wave.duration) {
                this.shockwaves.splice(i, 1);
                continue;
            }

            // Calculate progress (0 to 1)
            const progress = wave.elapsed / wave.duration;
            wave.radius = wave.maxRadius * progress;
            wave.alpha = 1 - progress;

            // Render main ring
            this.graphics.circle(wave.x, wave.y, wave.radius);
            this.graphics.stroke({
                color: wave.color,
                width: wave.width * (1 - progress * 0.5), // Width decreases as it expands
                alpha: wave.alpha
            });

            // Inner glow effect (only in first 30% of animation)
            if (progress < 0.3) {
                const glowAlpha = (1 - progress / 0.3) * wave.alpha;
                this.graphics.circle(wave.x, wave.y, wave.radius * 0.8);
                this.graphics.stroke({
                    color: 0xFFFFFF,
                    width: wave.width * 2,
                    alpha: glowAlpha * 0.5
                });
            }
        }
    }

    /**
     * Get the container for adding to stage
     */
    getContainer(): Container {
        return this.container;
    }

    /**
     * Get the graphics object (legacy support)
     */
    getGraphics(): Graphics {
        return this.graphics;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.shockwaves = [];
        this.graphics.destroy();
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
