import { Application, Container, Graphics, TilingSprite, Texture } from 'pixi.js';
import { GAME_CONFIG } from '../types';

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

    public init(): void {
        // Create 3 layers of stars
        this.createLayer(50, 0.05, 0.5);   // Background: few stars, slow, small
        this.createLayer(100, 0.1, 0.8);   // Midground: more stars, medium speed, medium size
        this.createLayer(150, 0.2, 1.0);   // Foreground: many stars, fast, large
    }

    private createLayer(starCount: number, speed: number, baseScale: number): void {
        const texture = this.generateStarTexture(baseScale, starCount);
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

    private generateStarTexture(baseScale: number, starCount: number): Texture {
        const graphics = new Graphics();
        const width = 1024;
        const height = 1024;

        // Draw random stars on a 1024x1024 texture
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = (Math.random() * 1.5 + 0.5) * baseScale;
            const alpha = Math.random() * 0.5 + 0.5;

            graphics.circle(x, y, radius);
            graphics.fill({ color: 0xFFFFFF, alpha });
        }

        return this.app.renderer.generateTexture(graphics);
    }

    public update(deltaTime: number, speedX: number = 0, speedY: number = 100): void {
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
