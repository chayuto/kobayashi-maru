/**
 * Input Router for Kobayashi Maru
 * 
 * Centralizes all input handling with action-based mapping.
 * Supports keyboard, mouse, and touch inputs.
 * 
 * @module core/managers/InputRouter
 */

import { Application } from 'pixi.js';
import { defineQuery } from 'bitecs';
import { Position, Turret } from '../../ecs/components';
import { GAME_CONFIG } from '../../types';
import { getServices } from '../services';
import type { GameWorld } from '../../ecs/world';

// Query for turret entities
const turretQuery = defineQuery([Position, Turret]);

/**
 * Input action types
 */
export enum InputAction {
    // Game flow
    PAUSE = 'pause',
    RESUME = 'resume',
    RESTART = 'restart',
    QUIT = 'quit',

    // Turret actions
    SELECT_TURRET = 'select_turret',
    DESELECT_TURRET = 'deselect_turret',
    PLACE_TURRET = 'place_turret',
    CANCEL_PLACEMENT = 'cancel_placement',

    // Debug
    TOGGLE_DEBUG = 'toggle_debug',
    TOGGLE_GOD_MODE = 'toggle_god_mode',
    TOGGLE_SLOW_MODE = 'toggle_slow_mode',
}

/**
 * Input action payload
 */
export interface InputActionPayload {
    action: InputAction;
    data?: {
        turretId?: number;
        worldX?: number;
        worldY?: number;
        turretType?: string;
    };
}

/**
 * Input action callback
 */
export type InputActionCallback = (payload: InputActionPayload) => void;

/**
 * Key binding configuration
 */
export interface KeyBinding {
    key: string;
    action: InputAction;
    /** Only trigger when game is in this state */
    whenPlaying?: boolean;
    whenPaused?: boolean;
    whenGameOver?: boolean;
    /** Modifier keys */
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
}

/**
 * Default key bindings
 */
const DEFAULT_KEY_BINDINGS: KeyBinding[] = [
    // Pause/Resume
    { key: 'Escape', action: InputAction.PAUSE, whenPlaying: true },
    { key: 'Escape', action: InputAction.RESUME, whenPaused: true },
    { key: 'Escape', action: InputAction.CANCEL_PLACEMENT, whenPlaying: true },

    // Restart
    { key: 'r', action: InputAction.RESTART, whenPaused: true },
    { key: 'R', action: InputAction.RESTART, whenPaused: true },
    { key: 'r', action: InputAction.RESTART, whenGameOver: true },
    { key: 'R', action: InputAction.RESTART, whenGameOver: true },

    // Quit
    { key: 'q', action: InputAction.QUIT, whenPaused: true },
    { key: 'Q', action: InputAction.QUIT, whenPaused: true },

    // Debug (with modifier)
    { key: 'd', action: InputAction.TOGGLE_DEBUG, ctrl: true },
    { key: 'g', action: InputAction.TOGGLE_GOD_MODE, ctrl: true },
    { key: 's', action: InputAction.TOGGLE_SLOW_MODE, ctrl: true },
];

/**
 * Click detection radius for selecting turrets (in pixels)
 */
const TURRET_CLICK_RADIUS = 32;

/**
 * Centralizes all input handling.
 */
export class InputRouter {
    private app: Application;
    private world: GameWorld;
    private keyBindings: KeyBinding[] = [...DEFAULT_KEY_BINDINGS];
    private actionCallbacks: Map<InputAction, InputActionCallback[]> = new Map();
    private selectedTurretId: number = -1;

    // Bound event handlers
    private boundHandleKeyDown: (e: KeyboardEvent) => void;
    private boundHandleCanvasClick: (e: PointerEvent) => void;
    private boundHandleCanvasMove: (e: PointerEvent) => void;

    // State checkers (injected to avoid circular deps)
    private isPlaying: () => boolean = () => false;
    private isPaused: () => boolean = () => false;
    private isGameOver: () => boolean = () => false;
    private isPlacingTurret: () => boolean = () => false;

    constructor(app: Application, world: GameWorld) {
        this.app = app;
        this.world = world;

        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
        this.boundHandleCanvasClick = this.handleCanvasClick.bind(this);
        this.boundHandleCanvasMove = this.handleCanvasMove.bind(this);
    }

    /**
     * Set state checker functions.
     */
    setStateCheckers(checkers: {
        isPlaying: () => boolean;
        isPaused: () => boolean;
        isGameOver: () => boolean;
        isPlacingTurret: () => boolean;
    }): void {
        this.isPlaying = checkers.isPlaying;
        this.isPaused = checkers.isPaused;
        this.isGameOver = checkers.isGameOver;
        this.isPlacingTurret = checkers.isPlacingTurret;
    }

    /**
     * Initialize input listeners.
     */
    init(): void {
        window.addEventListener('keydown', this.boundHandleKeyDown);
        this.app.canvas.addEventListener('pointerdown', this.boundHandleCanvasClick);
        this.app.canvas.addEventListener('pointermove', this.boundHandleCanvasMove);

        // Initialize touch input for mobile support
        getServices().get('touchInputManager');
    }

    /**
     * Register a callback for an input action.
     * 
     * @param action - The action to listen for
     * @param callback - Function to call when action triggered
     * @returns Unsubscribe function
     */
    on(action: InputAction, callback: InputActionCallback): () => void {
        if (!this.actionCallbacks.has(action)) {
            this.actionCallbacks.set(action, []);
        }
        this.actionCallbacks.get(action)!.push(callback);

        return () => {
            const callbacks = this.actionCallbacks.get(action);
            if (callbacks) {
                const index = callbacks.indexOf(callback);
                if (index !== -1) {
                    callbacks.splice(index, 1);
                }
            }
        };
    }

    /**
     * Emit an input action.
     */
    private emit(action: InputAction, data?: InputActionPayload['data']): void {
        const callbacks = this.actionCallbacks.get(action);
        if (callbacks) {
            const payload: InputActionPayload = { action, data };
            for (const callback of callbacks) {
                try {
                    callback(payload);
                } catch (error) {
                    console.error(`Error in input callback for ${action}:`, error);
                }
            }
        }
    }

    // ==========================================================================
    // KEYBOARD HANDLING
    // ==========================================================================

    /**
     * Handle keyboard input.
     */
    private handleKeyDown(e: KeyboardEvent): void {
        // Find matching binding
        for (const binding of this.keyBindings) {
            if (!this.matchesBinding(e, binding)) continue;
            if (!this.matchesState(binding)) continue;

            // Prevent default for matched bindings
            e.preventDefault();

            this.emit(binding.action);
            return;
        }
    }

    /**
     * Check if event matches key binding.
     */
    private matchesBinding(e: KeyboardEvent, binding: KeyBinding): boolean {
        if (e.key !== binding.key) return false;
        if (binding.ctrl && !e.ctrlKey) return false;
        if (binding.shift && !e.shiftKey) return false;
        if (binding.alt && !e.altKey) return false;
        return true;
    }

    /**
     * Check if current game state matches binding requirements.
     */
    private matchesState(binding: KeyBinding): boolean {
        // If no state requirements, always match
        if (!binding.whenPlaying && !binding.whenPaused && !binding.whenGameOver) {
            return true;
        }

        if (binding.whenPlaying && this.isPlaying()) return true;
        if (binding.whenPaused && this.isPaused()) return true;
        if (binding.whenGameOver && this.isGameOver()) return true;

        return false;
    }

    /**
     * Add a custom key binding.
     */
    addKeyBinding(binding: KeyBinding): void {
        this.keyBindings.push(binding);
    }

    /**
     * Remove a key binding.
     */
    removeKeyBinding(key: string, action: InputAction): void {
        this.keyBindings = this.keyBindings.filter(
            b => !(b.key === key && b.action === action)
        );
    }

    // ==========================================================================
    // POINTER HANDLING
    // ==========================================================================

    /**
     * Handle canvas click.
     */
    private handleCanvasClick(event: PointerEvent): void {
        const { worldX, worldY } = this.getWorldCoordinates(event);

        // If placing turret, emit place action
        if (this.isPlacingTurret()) {
            this.emit(InputAction.PLACE_TURRET, { worldX, worldY });
            return;
        }

        // Check for turret click
        const clickedTurretId = this.findTurretAtPosition(worldX, worldY);

        if (clickedTurretId !== -1) {
            this.selectedTurretId = clickedTurretId;
            this.emit(InputAction.SELECT_TURRET, { turretId: clickedTurretId });
        } else if (this.selectedTurretId !== -1) {
            this.selectedTurretId = -1;
            this.emit(InputAction.DESELECT_TURRET);
        }
    }

    /**
     * Handle canvas mouse move (for placement preview).
     */
    private handleCanvasMove(event: PointerEvent): void {
        if (!this.isPlacingTurret()) return;

        const { worldX, worldY } = this.getWorldCoordinates(event);

        // Update placement preview position
        const placementManager = getServices().tryGet('placementManager');
        // Using explicit optional chaining and any cast if method might not exist in type
        // but assuming PlacementManager has updatePreviewPosition
        placementManager?.updateCursorPosition(worldX, worldY);
    }

    /**
     * Convert screen coordinates to world coordinates.
     */
    private getWorldCoordinates(event: PointerEvent): { worldX: number; worldY: number } {
        const rect = this.app.canvas.getBoundingClientRect();
        const scaleX = GAME_CONFIG.WORLD_WIDTH / rect.width;
        const scaleY = GAME_CONFIG.WORLD_HEIGHT / rect.height;

        return {
            worldX: (event.clientX - rect.left) * scaleX,
            worldY: (event.clientY - rect.top) * scaleY,
        };
    }

    /**
     * Find a turret at the given position.
     */
    private findTurretAtPosition(x: number, y: number): number {
        const turretEntities = turretQuery(this.world);

        for (const eid of turretEntities) {
            const turretX = Position.x[eid];
            const turretY = Position.y[eid];
            const dx = turretX - x;
            const dy = turretY - y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= TURRET_CLICK_RADIUS * TURRET_CLICK_RADIUS) {
                return eid;
            }
        }

        return -1;
    }

    // ==========================================================================
    // TURRET SELECTION
    // ==========================================================================

    /**
     * Get currently selected turret ID.
     */
    getSelectedTurretId(): number {
        return this.selectedTurretId;
    }

    /**
     * Programmatically deselect turret.
     */
    deselectTurret(): void {
        if (this.selectedTurretId !== -1) {
            this.selectedTurretId = -1;
            this.emit(InputAction.DESELECT_TURRET);
        }
    }

    // ==========================================================================
    // CLEANUP
    // ==========================================================================

    /**
     * Clean up event listeners.
     */
    destroy(): void {
        window.removeEventListener('keydown', this.boundHandleKeyDown);
        this.app.canvas.removeEventListener('pointerdown', this.boundHandleCanvasClick);
        this.app.canvas.removeEventListener('pointermove', this.boundHandleCanvasMove);

        this.actionCallbacks.clear();
        this.selectedTurretId = -1;
    }
}
