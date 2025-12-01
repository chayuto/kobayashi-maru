import { EventBus } from './EventBus';
import { GameEventType, GestureType, GestureEvent } from '../types';

export class GestureManager {
    private eventBus: EventBus;

    // Gesture state
    private startX: number = 0;
    private startY: number = 0;
    private lastX: number = 0;
    private lastY: number = 0;
    private initialDistance: number = 0;
    private isPanning: boolean = false;
    private isPinching: boolean = false;
    private startTime: number = 0;

    // Configuration
    private readonly SWIPE_THRESHOLD = 50;
    private readonly SWIPE_TIMEOUT = 300;
    private readonly PAN_THRESHOLD = 10;
    private readonly PINCH_THRESHOLD = 10;

    constructor() {
        this.eventBus = EventBus.getInstance();
    }

    handleTouchStart(e: TouchEvent): void {
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.startX = touch.clientX;
            this.startY = touch.clientY;
            this.lastX = touch.clientX;
            this.lastY = touch.clientY;
            this.startTime = Date.now();
            this.isPanning = false;
            this.isPinching = false;
        } else if (e.touches.length === 2) {
            this.isPinching = true;
            this.isPanning = false;
            this.initialDistance = this.getDistance(e.touches[0], e.touches[1]);
        }
    }

    handleTouchMove(e: TouchEvent): void {
        if (e.touches.length === 1 && !this.isPinching) {
            const touch = e.touches[0];
            const deltaX = touch.clientX - this.lastX;
            const deltaY = touch.clientY - this.lastY;

            // Check if panning started
            if (!this.isPanning) {
                const totalDeltaX = Math.abs(touch.clientX - this.startX);
                const totalDeltaY = Math.abs(touch.clientY - this.startY);
                if (totalDeltaX > this.PAN_THRESHOLD || totalDeltaY > this.PAN_THRESHOLD) {
                    this.isPanning = true;
                }
            }

            if (this.isPanning) {
                this.eventBus.emit(GameEventType.GESTURE, {
                    type: GestureType.PAN,
                    deltaX,
                    deltaY,
                    centerX: touch.clientX,
                    centerY: touch.clientY
                } as GestureEvent);
            }

            this.lastX = touch.clientX;
            this.lastY = touch.clientY;

        } else if (e.touches.length === 2) {
            const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
            const scale = currentDistance / this.initialDistance;

            // Center point of pinch
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            if (Math.abs(1 - scale) > this.PINCH_THRESHOLD / 100) {
                this.eventBus.emit(GameEventType.GESTURE, {
                    type: GestureType.PINCH,
                    scale,
                    centerX,
                    centerY
                } as GestureEvent);
            }

            // Update initial distance for relative scaling in next frame if needed, 
            // but usually pinch is relative to start. 
            // If we want continuous delta scale, we'd update initialDistance here.
            // Let's keep it relative to start for now, or maybe delta?
            // Standard is usually delta scale.
            // Let's emit absolute scale from start for now, easier to handle "zoom to factor".
        }
    }

    handleTouchEnd(e: TouchEvent): void {
        if (this.isPinching && e.touches.length < 2) {
            this.isPinching = false;
        }

        if (!this.isPanning && !this.isPinching && e.changedTouches.length > 0) {
            // Check for swipe
            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - this.startX;
            const deltaY = touch.clientY - this.startY;
            const duration = Date.now() - this.startTime;

            if (duration < this.SWIPE_TIMEOUT) {
                if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
                    // Horizontal swipe
                    this.eventBus.emit(GameEventType.GESTURE, {
                        type: GestureType.SWIPE,
                        direction: deltaX > 0 ? 'right' : 'left'
                    } as GestureEvent);
                } else if (Math.abs(deltaY) > this.SWIPE_THRESHOLD && Math.abs(deltaY) > Math.abs(deltaX)) {
                    // Vertical swipe
                    this.eventBus.emit(GameEventType.GESTURE, {
                        type: GestureType.SWIPE,
                        direction: deltaY > 0 ? 'down' : 'up'
                    } as GestureEvent);
                } else {
                    // Tap
                    this.eventBus.emit(GameEventType.GESTURE, {
                        type: GestureType.TAP,
                        centerX: touch.clientX,
                        centerY: touch.clientY
                    } as GestureEvent);
                }
            }
        }

        // Reset state if all fingers lifted
        if (e.touches.length === 0) {
            this.isPanning = false;
            this.isPinching = false;
        }
    }

    private getDistance(touch1: Touch, touch2: Touch): number {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
