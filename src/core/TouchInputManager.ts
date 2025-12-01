import { Application } from 'pixi.js';
import { EventBus } from './EventBus';
import { GestureManager } from './GestureManager';
import { GAME_CONFIG, GameEventType } from '../types';

export interface TouchEventPayload {
    x: number;
    y: number;
    originalEvent: TouchEvent;
}

export class TouchInputManager {
    private app: Application;
    private eventBus: EventBus;
    private gestureManager: GestureManager;
    private canvas: HTMLCanvasElement | null = null;

    constructor(app: Application) {
        this.app = app;
        this.eventBus = EventBus.getInstance();
        this.gestureManager = new GestureManager();
    }

    init(): void {
        this.canvas = this.app.canvas;
        if (!this.canvas) {
            console.warn('TouchInputManager: Canvas not found during initialization');
            return;
        }

        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));

        console.log('TouchInputManager initialized');
    }

    private handleTouchStart(e: TouchEvent): void {
        // Prevent default to stop scrolling/zooming
        // e.preventDefault(); // Commented out as it might block other interactions if not careful. 
        // We set touch-action: none in CSS which is better.

        if (e.touches.length > 0) {
            const { x, y } = this.getGameCoordinates(e.touches[0]);
            this.eventBus.emit(GameEventType.TOUCH_START, { x, y, originalEvent: e });
        }
        this.gestureManager.handleTouchStart(e);
    }

    private handleTouchMove(e: TouchEvent): void {
        // e.preventDefault();

        if (e.touches.length > 0) {
            const { x, y } = this.getGameCoordinates(e.touches[0]);
            this.eventBus.emit(GameEventType.TOUCH_MOVE, { x, y, originalEvent: e });
        }
        this.gestureManager.handleTouchMove(e);
    }

    private handleTouchEnd(e: TouchEvent): void {
        // For touchend, changedTouches contains the touch that just ended
        if (e.changedTouches.length > 0) {
            const { x, y } = this.getGameCoordinates(e.changedTouches[0]);
            this.eventBus.emit(GameEventType.TOUCH_END, { x, y, originalEvent: e });
        }
        this.gestureManager.handleTouchEnd(e);
    }

    private getGameCoordinates(touch: Touch): { x: number, y: number } {
        if (!this.canvas) return { x: 0, y: 0 };

        const rect = this.canvas.getBoundingClientRect();
        const displayWidth = rect.width || 1;
        const displayHeight = rect.height || 1;

        const scaleX = GAME_CONFIG.WORLD_WIDTH / displayWidth;
        const scaleY = GAME_CONFIG.WORLD_HEIGHT / displayHeight;

        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    destroy(): void {
        if (this.canvas) {
            this.canvas.removeEventListener('touchstart', this.handleTouchStart.bind(this));
            this.canvas.removeEventListener('touchmove', this.handleTouchMove.bind(this));
            this.canvas.removeEventListener('touchend', this.handleTouchEnd.bind(this));
        }
    }
}
