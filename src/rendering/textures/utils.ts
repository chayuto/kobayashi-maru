/**
 * Utility functions for texture generation
 */
import { Graphics, RenderTexture, Application } from 'pixi.js';

/**
 * Helper to render graphics to texture
 */
export function renderToTexture(app: Application, graphics: Graphics, width: number, height: number): RenderTexture {
    const texture = RenderTexture.create({ width, height });
    app.renderer.render({ container: graphics, target: texture });
    graphics.destroy();
    return texture;
}
