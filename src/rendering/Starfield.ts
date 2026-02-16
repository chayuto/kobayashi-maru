import { Application, Container, Graphics, TilingSprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../types';
import { RENDERING_CONFIG } from '../config';

// Star color palettes and nebula colors from centralized config
const STAR_COLORS = RENDERING_CONFIG.STARFIELD.STAR_COLORS;
const NEBULA_COLORS = RENDERING_CONFIG.STARFIELD.NEBULA.COLORS;

export class Starfield {
    private app: Application;
    private container: Container;
    private layers: { sprite: TilingSprite; speed: number }[] = [];
    public frozen: boolean = false;

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

        // Create star layers from config
        const layers = RENDERING_CONFIG.STARFIELD.STAR_LAYERS;
        const palettes = [STAR_COLORS.BACKGROUND, STAR_COLORS.MIDGROUND, STAR_COLORS.FOREGROUND];
        for (let i = 0; i < layers.length; i++) {
            const layer = layers[i];
            this.createStarLayer(
                Math.floor(layer.COUNT_MULTIPLIER * starCountMultiplier),
                layer.SPEED,
                layer.SCALE,
                palettes[i],
            );
        }
    }

    private createNebulaLayer(): void {
        const graphics = new Graphics();
        const width = RENDERING_CONFIG.STARFIELD.TILE_SIZE;
        const height = RENDERING_CONFIG.STARFIELD.TILE_SIZE;

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
        this.layers.push({ sprite: tilingSprite, speed: RENDERING_CONFIG.STARFIELD.NEBULA.SPEED });
    }

    private createStarLayer(starCount: number, speed: number, baseScale: number, colorPalette: readonly number[]): void {
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

    private generateStarTexture(baseScale: number, starCount: number, colorPalette: readonly number[]): Texture {
        const graphics = new Graphics();
        const width = RENDERING_CONFIG.STARFIELD.TILE_SIZE;
        const height = RENDERING_CONFIG.STARFIELD.TILE_SIZE;

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
        if (this.frozen) return;
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

