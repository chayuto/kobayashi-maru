/**
 * Base Renderer Abstract Class
 * 
 * Provides a common interface for rendering components in Kobayashi Maru.
 * Renderers handle visual effects like shields, beams, shockwaves, etc.
 * 
 * Lifecycle:
 * 1. constructor() - Create graphics/container instances
 * 2. init() - Add to stage and prepare for rendering
 * 3. update/render() - Called each frame (signature varies by renderer)
 * 4. destroy() - Clean up resources
 */
import { Application, Graphics, Container } from 'pixi.js';

/**
 * Abstract base class for visual effect renderers.
 * 
 * Subclasses must implement:
 * - init(): Initialize and add to stage
 * - destroy(): Clean up all resources
 * 
 * The update/render method signature is intentionally not enforced here
 * because different renderers have different data requirements:
 * - ShieldRenderer.update(world, deltaTime) - queries ECS world
 * - BeamRenderer.render(beams) - receives beam data
 * - ShockwaveRenderer.render(deltaTime) - self-contained
 */
export abstract class BaseRenderer {
    protected app: Application | null = null;
    protected graphics: Graphics;
    protected container: Container;
    protected glowContainer: Container | null = null;
    protected initialized: boolean = false;

    constructor() {
        this.graphics = new Graphics();
        this.container = new Container();
        this.container.addChild(this.graphics);
    }

    /**
     * Check if renderer is initialized and ready to render
     */
    get isInitialized(): boolean {
        return this.initialized;
    }

    /**
     * Initialize the renderer and add to stage.
     * @param glowContainer Optional container for glow effects
     */
    abstract init(glowContainer?: Container): void;

    /**
     * Clean up all resources.
     * Must set initialized to false.
     */
    abstract destroy(): void;

    /**
     * Helper to attach container to glow container or fallback to app stage
     */
    protected attachToStage(app: Application, glowContainer?: Container): void {
        this.app = app;
        this.glowContainer = glowContainer || null;

        if (this.glowContainer) {
            this.glowContainer.addChild(this.container);
        } else if (this.app) {
            this.app.stage.addChild(this.container);
        }

        this.initialized = true;
    }

    /**
     * Helper to clean up graphics and container
     */
    protected cleanupResources(): void {
        this.graphics.destroy();
        this.container.destroy({ children: true });
        this.initialized = false;
        this.app = null;
        this.glowContainer = null;
    }
}
