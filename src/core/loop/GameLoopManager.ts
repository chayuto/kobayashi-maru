/**
 * Game Loop Manager for Kobayashi Maru
 * 
 * Manages the main game loop with clear update phases.
 * Separates gameplay, rendering, and UI updates.
 * 
 * @module core/loop/GameLoopManager
 */

import { Application } from 'pixi.js';
import { getServices } from '../services';

/**
 * Update phase callback type
 */
export type UpdateCallback = (deltaTime: number, gameTime: number) => void;

/**
 * Loop configuration
 */
export interface LoopConfig {
    /** Target FPS (0 = unlimited) */
    targetFPS?: number;

    /** Enable performance monitoring */
    enableProfiling?: boolean;
}

/**
 * Loop state for external queries
 */
export interface LoopState {
    /** Is the loop running */
    running: boolean;

    /** Total game time in seconds */
    gameTime: number;

    /** Current delta time */
    deltaTime: number;

    /** Current FPS */
    fps: number;
}

/**
 * Manages the main game loop with phased updates.
 */
export class GameLoopManager {
    private app: Application;
    private running: boolean = false;
    private gameTime: number = 0;
    private deltaTime: number = 0;
    private paused: boolean = false;

    // Update phase callbacks
    private preUpdateCallbacks: UpdateCallback[] = [];
    private gameplayCallbacks: UpdateCallback[] = [];
    private physicsCallbacks: UpdateCallback[] = [];
    private renderCallbacks: UpdateCallback[] = [];
    private postRenderCallbacks: UpdateCallback[] = [];
    private uiCallbacks: UpdateCallback[] = [];

    // Bound update function
    private boundUpdate: () => void;

    constructor(app: Application) {
        this.app = app;
        this.boundUpdate = this.update.bind(this);
    }

    /**
     * Start the game loop.
     */
    start(): void {
        if (this.running) return;

        this.running = true;
        this.app.ticker.add(this.boundUpdate);
        console.log('Game loop started');
    }

    /**
     * Stop the game loop.
     */
    stop(): void {
        if (!this.running) return;

        this.running = false;
        this.app.ticker.remove(this.boundUpdate);
        console.log('Game loop stopped');
    }

    /**
     * Pause gameplay updates (rendering continues).
     */
    pause(): void {
        this.paused = true;
    }

    /**
     * Resume gameplay updates.
     */
    resume(): void {
        this.paused = false;
    }

    /**
     * Check if paused.
     */
    isPaused(): boolean {
        return this.paused;
    }

    /**
     * Get current loop state.
     */
    getState(): LoopState {
        return {
            running: this.running,
            gameTime: this.gameTime,
            deltaTime: this.deltaTime,
            fps: this.app.ticker.FPS,
        };
    }

    /**
     * Get total game time.
     */
    getGameTime(): number {
        return this.gameTime;
    }

    /**
     * Reset game time (for restart).
     */
    resetGameTime(): void {
        this.gameTime = 0;
    }

    // ==========================================================================
    // CALLBACK REGISTRATION
    // ==========================================================================

    /**
     * Register a pre-update callback (runs first, always).
     * Use for: input polling, performance start
     */
    onPreUpdate(callback: UpdateCallback): () => void {
        this.preUpdateCallbacks.push(callback);
        return () => this.removeCallback(this.preUpdateCallbacks, callback);
    }

    /**
     * Register a gameplay callback (runs when not paused).
     * Use for: game logic, AI, scoring
     */
    onGameplay(callback: UpdateCallback): () => void {
        this.gameplayCallbacks.push(callback);
        return () => this.removeCallback(this.gameplayCallbacks, callback);
    }

    /**
     * Register a physics callback (runs when not paused).
     * Use for: ECS systems, collision, movement
     */
    onPhysics(callback: UpdateCallback): () => void {
        this.physicsCallbacks.push(callback);
        return () => this.removeCallback(this.physicsCallbacks, callback);
    }

    /**
     * Register a render callback (runs always).
     * Use for: sprite updates, visual effects
     */
    onRender(callback: UpdateCallback): () => void {
        this.renderCallbacks.push(callback);
        return () => this.removeCallback(this.renderCallbacks, callback);
    }

    /**
     * Register a post-render callback (runs always).
     * Use for: screen shake, camera effects
     */
    onPostRender(callback: UpdateCallback): () => void {
        this.postRenderCallbacks.push(callback);
        return () => this.removeCallback(this.postRenderCallbacks, callback);
    }

    /**
     * Register a UI callback (runs always).
     * Use for: HUD updates, debug overlay
     */
    onUI(callback: UpdateCallback): () => void {
        this.uiCallbacks.push(callback);
        return () => this.removeCallback(this.uiCallbacks, callback);
    }

    /**
     * Remove a callback from an array.
     */
    private removeCallback(array: UpdateCallback[], callback: UpdateCallback): void {
        const index = array.indexOf(callback);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    // ==========================================================================
    // MAIN UPDATE LOOP
    // ==========================================================================

    /**
     * Main update loop - called by PixiJS ticker.
     */
    private update(): void {
        const services = getServices();
        const perfMon = services.tryGet('performanceMonitor');

        // Start frame timing
        perfMon?.startFrame();

        // Calculate delta time in seconds
        this.deltaTime = this.app.ticker.deltaMS / 1000;

        // Phase 1: Pre-update (always runs)
        this.runCallbacks(this.preUpdateCallbacks);

        // Phase 2: Gameplay (only when not paused and not game over)
        const gameState = services.tryGet('gameState');
        const isGameOver = gameState?.isGameOver() ?? false;

        if (!this.paused && !isGameOver) {
            this.gameTime += this.deltaTime;

            perfMon?.startMeasure('gameplay');
            this.runCallbacks(this.gameplayCallbacks);
            perfMon?.endMeasure('gameplay');

            // Phase 3: Physics/Systems (only when not paused and not game over)
            perfMon?.startMeasure('systems');
            this.runCallbacks(this.physicsCallbacks);
            perfMon?.endMeasure('systems');
        }

        // Phase 4: Rendering (always runs)
        perfMon?.startRender();
        this.runCallbacks(this.renderCallbacks);
        perfMon?.endRender();

        // Phase 5: Post-render (always runs)
        this.runCallbacks(this.postRenderCallbacks);

        // Phase 6: UI (always runs)
        this.runCallbacks(this.uiCallbacks);

        // End frame timing
        perfMon?.endFrame();
    }

    /**
     * Run all callbacks in an array.
     */
    private runCallbacks(callbacks: UpdateCallback[]): void {
        for (const callback of callbacks) {
            try {
                callback(this.deltaTime, this.gameTime);
            } catch (error) {
                console.error('Error in update callback:', error);
            }
        }
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.stop();
        this.preUpdateCallbacks = [];
        this.gameplayCallbacks = [];
        this.physicsCallbacks = [];
        this.renderCallbacks = [];
        this.postRenderCallbacks = [];
        this.uiCallbacks = [];
    }
}
