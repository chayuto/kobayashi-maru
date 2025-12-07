/**
 * Render Manager for Kobayashi Maru
 * 
 * Consolidates all rendering logic into a single manager.
 * Handles render order, visual effects, and screen effects.
 * 
 * @module core/managers/RenderManager
 */

import { getServices } from '../services';
import type { GameWorld } from '../../ecs/world';
import type { BeamVisual } from '../../systems/combatSystem';
import type { ParticleConfig } from '../../rendering/ParticleSystem';
import { EFFECTS } from '../../rendering/effectPresets';

/**
 * Render layer order (lower = rendered first / behind)
 */
export enum RenderLayer {
    BACKGROUND = 0,    // Starfield
    ENTITIES = 100,    // Ships, turrets, enemies
    EFFECTS = 200,     // Beams, particles
    OVERLAYS = 300,    // Health bars, shields
    UI = 400,          // HUD elements
}

/**
 * Render statistics for debugging
 */
export interface RenderStats {
    spriteCount: number;
    particleCount: number;
    beamCount: number;
    drawCalls: number;
}

/**
 * Manages all rendering subsystems.
 */
export class RenderManager {
    private world: GameWorld;
    private renderSystem: ((world: GameWorld) => void) | null = null;

    // Cached service references (populated on init)
    private initialized: boolean = false;

    constructor(world: GameWorld) {
        this.world = world;
    }

    /**
     * Set the ECS render system.
     * Called after systems are created.
     */
    setRenderSystem(renderSystem: (world: GameWorld) => void): void {
        this.renderSystem = renderSystem;
    }

    /**
     * Initialize the render manager.
     * Ensures all rendering services are ready.
     */
    init(): void {
        if (this.initialized) return;

        // Force initialization of rendering services
        const services = getServices();
        services.get('spriteManager');
        services.get('glowManager');
        services.get('starfield');

        this.initialized = true;
    }

    // ==========================================================================
    // UPDATE PHASE (called during gameplay update)
    // ==========================================================================

    /**
     * Update time-based visual effects.
     * Called during the render phase of the game loop.
     * 
     * @param deltaTime - Time since last frame in seconds
     */
    updateEffects(deltaTime: number): void {
        const services = getServices();

        // Update particle system
        services.get('particleSystem').update(deltaTime);

        // Update shockwave animations
        services.get('shockwaveRenderer').render(deltaTime);

        // Update explosion manager
        services.get('explosionManager').update(deltaTime);

        // Update beam charge effects
        services.get('beamRenderer').updateCharges(deltaTime);
    }

    /**
     * Update background elements.
     * 
     * @param deltaTime - Time since last frame
     * @param scrollX - Horizontal scroll speed
     * @param scrollY - Vertical scroll speed
     */
    updateBackground(deltaTime: number, scrollX: number = 0, scrollY: number = 50): void {
        getServices().get('starfield').update(deltaTime, scrollX, scrollY);
    }

    // ==========================================================================
    // RENDER PHASE
    // ==========================================================================

    /**
     * Render all game visuals.
     * Called after update phase.
     * 
     * @param activeBeams - Active beam visuals from combat system
     */
    render(activeBeams: BeamVisual[] = []): void {
        const services = getServices();

        // 1. Render entities (sprites)
        if (this.renderSystem) {
            this.renderSystem(this.world);
        }

        // 2. Render beam weapons
        services.get('beamRenderer').render(activeBeams);

        // 3. Render health bars
        services.get('healthBarRenderer').update(this.world);

        // 4. Render shields
        services.get('shieldRenderer').update(this.world, 0);

        // 5. Render turret upgrade visuals
        services.get('turretUpgradeVisuals').update();
    }

    /**
     * Apply post-render effects.
     * 
     * @param deltaTime - Time since last frame
     */
    applyPostEffects(deltaTime: number): void {
        const services = getServices();
        const app = services.get('app');
        const screenShake = services.get('screenShake');

        // Apply screen shake
        const { offsetX, offsetY } = screenShake.update(deltaTime);
        app.stage.position.set(offsetX, offsetY);
    }

    // ==========================================================================
    // SCREEN EFFECTS
    // ==========================================================================

    /**
     * Trigger screen shake effect.
     * 
     * @param intensity - Shake intensity (pixels)
     * @param duration - Shake duration (seconds)
     */
    shake(intensity: number = 5, duration: number = 0.3): void {
        getServices().get('screenShake').shake(intensity, duration);
    }

    /**
     * Create explosion effect at position.
     * 
     * @param x - World X coordinate
     * @param y - World Y coordinate
     * @param size - Explosion size multiplier
     */
    createExplosion(x: number, y: number, size: number = 1): void {
        const config = size > 1.5 ? EFFECTS.EXPLOSION_LARGE : EFFECTS.EXPLOSION_SMALL;
        // x and y will be overwritten by ExplosionManager
        getServices().get('explosionManager').createSimpleExplosion(x, y, { ...config, x: 0, y: 0 });
    }

    /**
     * Create particle burst at position.
     * 
     * @param x - World X coordinate
     * @param y - World Y coordinate
     * @param config - Particle configuration
     */
    createParticleBurst(x: number, y: number, config: ParticleConfig): void {
        const ps = getServices().get('particleSystem');
        ps.spawn({
            ...config,
            x,
            y
        });
    }

    // ==========================================================================
    // UTILITY
    // ==========================================================================

    /**
     * Get render statistics for debugging.
     */
    getStats(): RenderStats {
        const services = getServices();
        const spriteManager = services.get('spriteManager');
        const particleSystem = services.get('particleSystem');

        return {
            spriteCount: spriteManager.getActiveCount(),
            particleCount: particleSystem.particles.length,
            beamCount: 0, // Would need to track this
            drawCalls: 0, // Would need PixiJS stats
        };
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.renderSystem = null;
        this.initialized = false;
    }
}
