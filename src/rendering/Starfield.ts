import { Application, Container, Graphics, TilingSprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../types';
import { RENDERING_CONFIG } from '../config';

// Star color palettes for depth
const STAR_COLORS = {
    BACKGROUND: [0x8888CC, 0x9999DD, 0xAAAAEE, 0x7777BB], // Distant blue/purple stars
    MIDGROUND: [0xFFFFFF, 0xFFEEDD, 0xDDEEFF, 0xEEFFFF],  // White variations
    FOREGROUND: [0xFFFFFF, 0xFFFFAA, 0xAAFFFF, 0xFFAAFF]  // Bright whites with color hints
};

// Nebula colors for cosmic depth
const NEBULA_COLORS = [0x442266, 0x224466, 0x443355, 0x335544, 0x553344];

export class Starfield {
    private app: Application;
    private container: Container;
    private layers: { sprite: TilingSprite; speed: number }[] = [];

    constructor(app: Application) {
        this.app = app;
        this.container = new Container();
        this.container.zIndex = -1; // Ensure it's behind everything
        this.app.stage.addChild(this.container);

        // Sortable children must be enabled on the stage for zIndex to work if added directly,
        // but here we are adding a container. We should ensure the game world is on top.
        // For now, we'll rely on the order of addition or explicit zIndex if enabled.
        this.app.stage.sortableChildren = true;
    }

    public init(starCountMultiplier: number = 1.0): void {
        // Create nebula layer first (behind stars)
        this.createNebulaLayer();

        // Create 3 layers of stars with different colors, scaled by multiplier
        this.createStarLayer(Math.floor(50 * starCountMultiplier), 0.05, 0.5, STAR_COLORS.BACKGROUND);
        this.createStarLayer(Math.floor(100 * starCountMultiplier), 0.1, 0.8, STAR_COLORS.MIDGROUND);
        this.createStarLayer(Math.floor(150 * starCountMultiplier), 0.2, 1.0, STAR_COLORS.FOREGROUND);
    }

    private createNebulaLayer(): void {
        const graphics = new Graphics();
        const width = 1024;
        const height = 1024;

        // Draw soft nebula patches
        for (let i = 0; i < 8; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radiusX = 80 + Math.random() * 120;
            const radiusY = 60 + Math.random() * 100;
            const color = NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)];

            // Soft outer glow
            graphics.ellipse(x, y, radiusX, radiusY);
            graphics.fill({ color, alpha: 0.08 });
            graphics.ellipse(x, y, radiusX * 0.7, radiusY * 0.7);
            graphics.fill({ color, alpha: 0.06 });
            graphics.ellipse(x, y, radiusX * 0.4, radiusY * 0.4);
            graphics.fill({ color, alpha: 0.04 });
        }

        const texture = this.app.renderer.generateTexture(graphics);
        const tilingSprite = new TilingSprite({
            texture,
            width: GAME_CONFIG.WORLD_WIDTH,
            height: GAME_CONFIG.WORLD_HEIGHT,
        });

        tilingSprite.tilePosition.x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
        tilingSprite.tilePosition.y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;

        this.container.addChild(tilingSprite);
        this.layers.push({ sprite: tilingSprite, speed: 0.02 }); // Very slow parallax
    }

    private createStarLayer(starCount: number, speed: number, baseScale: number, colorPalette: number[]): void {
        const texture = this.generateStarTexture(baseScale, starCount, colorPalette);
        const tilingSprite = new TilingSprite({
            texture,
            width: GAME_CONFIG.WORLD_WIDTH,
            height: GAME_CONFIG.WORLD_HEIGHT,
        });

        // Randomize initial position
        tilingSprite.tilePosition.x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
        tilingSprite.tilePosition.y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;

        this.container.addChild(tilingSprite);
        this.layers.push({ sprite: tilingSprite, speed });
    }

    private generateStarTexture(baseScale: number, starCount: number, colorPalette: number[]): Texture {
        const graphics = new Graphics();
        const width = 1024;
        const height = 1024;

        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = (Math.random() * 1.5 + 0.5) * baseScale;
            const alpha = Math.random() * 0.5 + 0.5;
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];

            // Add occasional brighter "highlight" stars with glow halo
            if (Math.random() < 0.08 && baseScale >= 0.8) {
                // Glow halo
                graphics.circle(x, y, radius * 3);
                graphics.fill({ color, alpha: alpha * 0.15 });
                graphics.circle(x, y, radius * 2);
                graphics.fill({ color, alpha: alpha * 0.3 });
            }

            // Star core
            graphics.circle(x, y, radius);
            graphics.fill({ color, alpha });
        }

        return this.app.renderer.generateTexture(graphics);
    }

    public update(deltaTime: number, speedX: number = RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_X, speedY: number = RENDERING_CONFIG.STARFIELD.DEFAULT_SCROLL_SPEED_Y): void {
        // Scroll textures based on speed and layer depth
        for (const layer of this.layers) {
            layer.sprite.tilePosition.x -= speedX * layer.speed * deltaTime;
            layer.sprite.tilePosition.y += speedY * layer.speed * deltaTime;
        }
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}

