/**
 * Game Bootstrap for Kobayashi Maru
 * 
 * Handles all game initialization in clear, testable phases.
 * Registers services with ServiceContainer for dependency injection.
 * 
 * @module core/bootstrap/GameBootstrap
 */

import { Application } from 'pixi.js';
import { createGameWorld, GameWorld } from '../../ecs';
import { getServices, resetServices } from '../services';
import { GAME_CONFIG, LCARS_COLORS } from '../../types';

// Import all service classes
import { SpriteManager } from '../../rendering/spriteManager';
import { BeamRenderer } from '../../rendering/BeamRenderer';
import { ParticleSystem } from '../../rendering/ParticleSystem';
import { HealthBarRenderer } from '../../rendering/HealthBarRenderer';
import { ShieldRenderer } from '../../rendering/ShieldRenderer';
import { ShockwaveRenderer } from '../../rendering/ShockwaveRenderer';
import { ExplosionManager } from '../../rendering/ExplosionManager';
import { GlowManager, GlowLayer } from '../../rendering/filters/GlowManager';
import { TurretUpgradeVisuals } from '../../rendering/TurretUpgradeVisuals';
import { PlacementRenderer } from '../../rendering/PlacementRenderer';
import { Starfield } from '../../rendering/Starfield';
import { ScreenShake } from '../../rendering/ScreenShake';

import { WaveManager } from '../../game/waveManager';
import { GameState } from '../../game/gameState';
import { ScoreManager } from '../../game/scoreManager';
import { HighScoreManager } from '../../game/highScoreManager';
import { ResourceManager } from '../../game/resourceManager';
import { PlacementManager } from '../../game/PlacementManager';
import { UpgradeManager } from '../../game/UpgradeManager';

import { HUDManager } from '../../ui/HUDManager';
import { GameOverScreen } from '../../ui/GameOverScreen';
import { PauseOverlay } from '../../ui/PauseOverlay';

import { AudioManager } from '../../audio/AudioManager';
import { SpatialHash } from '../../collision/spatialHash';
import { SystemManager } from '../../systems/SystemManager';

import { InputManager } from '../InputManager';
import { TouchInputManager } from '../TouchInputManager';
import { PerformanceMonitor } from '../PerformanceMonitor';
import { QualityManager } from '../QualityManager';
import { HapticManager } from '../HapticManager';
import { DebugManager } from '../DebugManager';
import { EventBus } from '../EventBus';

/**
 * Bootstrap configuration options
 */
export interface BootstrapConfig {
    /** Container element ID for the canvas */
    containerId: string;

    /** Optional progress callback for loading screens */
    onProgress?: (phase: string, progress: number) => void;

    /** Enable debug mode */
    debug?: boolean;
}

/**
 * Bootstrap result containing initialized app and world
 */
export interface BootstrapResult {
    app: Application;
    world: GameWorld;
}

/**
 * Handles game initialization in phases.
 */
export class GameBootstrap {
    private config: BootstrapConfig;
    private container: HTMLElement | null = null;

    constructor(config: BootstrapConfig) {
        this.config = config;
    }

    /**
     * Run full bootstrap sequence.
     * 
     * @returns Bootstrap result with app and world
     * @throws Error if container not found or initialization fails
     */
    async bootstrap(): Promise<BootstrapResult> {
        // Reset any existing services
        resetServices();

        this.reportProgress('Validating', 0);
        this.validateContainer();

        this.reportProgress('Creating PixiJS', 0.1);
        const app = await this.initializePixiJS();

        this.reportProgress('Creating ECS World', 0.2);
        const world = createGameWorld();

        this.reportProgress('Registering Core Services', 0.3);
        this.registerCoreServices(app, world);

        this.reportProgress('Registering Rendering Services', 0.4);
        this.registerRenderingServices();

        this.reportProgress('Registering Game Services', 0.6);
        this.registerGameServices();

        this.reportProgress('Registering UI Services', 0.7);
        this.registerUIServices();

        this.reportProgress('Registering Input Services', 0.8);
        this.registerInputServices();

        this.reportProgress('Initializing Audio', 0.9);
        this.setupAudioInitialization();

        this.reportProgress('Complete', 1.0);

        console.log('Kobayashi Maru initialized');
        console.log(`Renderer: ${app.renderer.name}`);

        return { app, world };
    }

    /**
     * Validate that the container element exists.
     */
    private validateContainer(): void {
        this.container = document.getElementById(this.config.containerId);
        if (!this.container) {
            throw new Error(`Container element with id "${this.config.containerId}" not found`);
        }
    }

    /**
     * Initialize PixiJS Application with WebGPU preference.
     */
    private async initializePixiJS(): Promise<Application> {
        const app = new Application();

        await app.init({
            width: GAME_CONFIG.WORLD_WIDTH,
            height: GAME_CONFIG.WORLD_HEIGHT,
            backgroundColor: LCARS_COLORS.BACKGROUND,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            preference: 'webgpu',
            antialias: true,
        });

        this.container!.appendChild(app.canvas);

        return app;
    }

    /**
     * Register core services (app, world, event bus).
     */
    private registerCoreServices(app: Application, world: GameWorld): void {
        const services = getServices();

        services.register('app', () => app);
        services.register('world', () => world);
        services.register('eventBus', () => EventBus.getInstance());

        // Performance services
        services.register('performanceMonitor', () => new PerformanceMonitor());
        services.register('qualityManager', () => {
            const pm = services.get('performanceMonitor');
            return new QualityManager(pm);
        });
        services.register('hapticManager', () => new HapticManager());
        services.register('debugManager', () => new DebugManager());

        // System manager
        services.register('systemManager', () => new SystemManager());

        // Spatial hash for collision
        services.register('spatialHash', () => new SpatialHash(
            GAME_CONFIG.COLLISION_CELL_SIZE,
            GAME_CONFIG.WORLD_WIDTH,
            GAME_CONFIG.WORLD_HEIGHT
        ));
    }

    /**
     * Register rendering services.
     */
    private registerRenderingServices(): void {
        const services = getServices();

        // Sprite manager
        services.register('spriteManager', () => {
            const mgr = new SpriteManager(services.get('app'));
            mgr.init();
            return mgr;
        });

        // Starfield
        services.register('starfield', () => {
            const sf = new Starfield(services.get('app'));
            const settings = services.get('qualityManager').getSettings();
            const multiplier = settings.starCount / 1000;
            sf.init(multiplier);
            return sf;
        });

        // Screen shake
        services.register('screenShake', () => new ScreenShake());

        // Glow manager (must be before renderers that use glow layers)
        services.register('glowManager', () => {
            const gm = new GlowManager();
            gm.init();
            this.setupGlowLayers(gm);
            return gm;
        });

        // Beam renderer
        services.register('beamRenderer', () => {
            const br = new BeamRenderer(services.get('app'));
            const weaponsLayer = services.get('glowManager').getLayer(GlowLayer.WEAPONS);
            if (weaponsLayer) {
                br.init(weaponsLayer);
            }
            return br;
        });

        // Particle system
        services.register('particleSystem', () => {
            const ps = new ParticleSystem();
            const settings = services.get('qualityManager').getSettings();
            const explosionsLayer = services.get('glowManager').getLayer(GlowLayer.EXPLOSIONS);
            if (explosionsLayer) {
                ps.init(
                    services.get('app'),
                    settings.maxParticles,
                    settings.particleSpawnRate,
                    explosionsLayer
                );
            }
            return ps;
        });

        // Health bar renderer
        services.register('healthBarRenderer', () => {
            const hbr = new HealthBarRenderer();
            hbr.init(services.get('app'));
            return hbr;
        });

        // Shield renderer
        services.register('shieldRenderer', () => {
            const sr = new ShieldRenderer(services.get('app'));
            const shieldsLayer = services.get('glowManager').getLayer(GlowLayer.SHIELDS);
            if (shieldsLayer) {
                sr.init(shieldsLayer);
            }
            return sr;
        });

        // Shockwave renderer
        services.register('shockwaveRenderer', () => {
            const swr = new ShockwaveRenderer();
            const explosionsLayer = services.get('glowManager').getLayer(GlowLayer.EXPLOSIONS);
            if (explosionsLayer) {
                swr.init(explosionsLayer);
            }
            return swr;
        });

        // Explosion manager (depends on particle system and shockwave renderer)
        services.register('explosionManager', () => {
            return new ExplosionManager(
                services.get('particleSystem'),
                services.get('shockwaveRenderer')
            );
        });

        // Turret upgrade visuals
        services.register('turretUpgradeVisuals', () => {
            const weaponsLayer = services.get('glowManager').getLayer(GlowLayer.WEAPONS);
            if (weaponsLayer) {
                return new TurretUpgradeVisuals(services.get('world'), weaponsLayer);
            }
            throw new Error('Weapons glow layer not available');
        });
    }

    /**
     * Setup glow layers on the stage.
     */
    private setupGlowLayers(glowManager: GlowManager): void {
        const app = getServices().get('app');

        const weaponsLayer = glowManager.getLayer(GlowLayer.WEAPONS);
        const projectilesLayer = glowManager.getLayer(GlowLayer.PROJECTILES);
        const explosionsLayer = glowManager.getLayer(GlowLayer.EXPLOSIONS);
        const shieldsLayer = glowManager.getLayer(GlowLayer.SHIELDS);

        if (weaponsLayer) app.stage.addChild(weaponsLayer);
        if (projectilesLayer) app.stage.addChild(projectilesLayer);
        if (shieldsLayer) app.stage.addChild(shieldsLayer);
        if (explosionsLayer) app.stage.addChild(explosionsLayer);

        glowManager.applyPreset(GlowLayer.WEAPONS, 'weapons');
        glowManager.applyPreset(GlowLayer.PROJECTILES, 'medium');
        glowManager.applyPreset(GlowLayer.EXPLOSIONS, 'explosions');
        glowManager.applyPreset(GlowLayer.SHIELDS, 'shields');
    }

    /**
     * Register game logic services.
     */
    private registerGameServices(): void {
        const services = getServices();

        services.register('gameState', () => new GameState());
        services.register('scoreManager', () => new ScoreManager());
        services.register('highScoreManager', () => new HighScoreManager());
        services.register('resourceManager', () => new ResourceManager());
        services.register('waveManager', () => new WaveManager());

        services.register('upgradeManager', () => {
            return new UpgradeManager(
                services.get('world'),
                services.get('resourceManager')
            );
        });

        services.register('placementManager', () => {
            return new PlacementManager(
                services.get('world'),
                services.get('resourceManager')
            );
        });

        services.register('placementRenderer', () => {
            return new PlacementRenderer(
                services.get('app'),
                services.get('placementManager'),
                services.get('world')
            );
        });
    }

    /**
     * Register UI services.
     */
    private registerUIServices(): void {
        const services = getServices();

        services.register('hudManager', () => new HUDManager());
        services.register('gameOverScreen', () => {
            const gos = new GameOverScreen();
            gos.init(services.get('app'));
            return gos;
        });
        services.register('pauseOverlay', () => {
            const po = new PauseOverlay();
            po.init(services.get('app'));
            return po;
        });
    }

    /**
     * Register input services.
     */
    private registerInputServices(): void {
        const services = getServices();

        services.register('inputManager', () => {
            const im = new InputManager();
            im.init(services.get('app').canvas);
            return im;
        });

        services.register('touchInputManager', () => {
            const tim = new TouchInputManager(services.get('app'));
            tim.init();
            return tim;
        });
    }

    /**
     * Setup audio initialization on first user interaction.
     */
    private setupAudioInitialization(): void {
        const services = getServices();

        services.register('audioManager', () => AudioManager.getInstance());

        const initAudio = () => {
            const audio = services.get('audioManager');
            audio.init();
            audio.resume();
            window.removeEventListener('click', initAudio);
            window.removeEventListener('keydown', initAudio);
            window.removeEventListener('touchstart', initAudio);
        };

        window.addEventListener('click', initAudio);
        window.addEventListener('keydown', initAudio);
        window.addEventListener('touchstart', initAudio);
    }

    /**
     * Report progress to callback if provided.
     */
    private reportProgress(phase: string, progress: number): void {
        this.config.onProgress?.(phase, progress);
    }
}

/**
 * Convenience function to bootstrap the game.
 * 
 * @param containerId - Container element ID
 * @returns Bootstrap result
 */
export async function bootstrapGame(containerId: string): Promise<BootstrapResult> {
    const bootstrap = new GameBootstrap({ containerId });
    return bootstrap.bootstrap();
}
