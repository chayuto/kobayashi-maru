import { EventBus } from './EventBus';
import { GameEventType } from '../types';

export const HapticPattern = {
    LIGHT: [10],
    MEDIUM: [30],
    HEAVY: [50],
    SUCCESS: [10, 30, 10],
    FAILURE: [50, 50, 50],
    EXPLOSION: [40, 20, 10]
} as const;

export type HapticPatternType = typeof HapticPattern[keyof typeof HapticPattern];

export class HapticManager {
    private eventBus: EventBus;
    private enabled: boolean = true;

    constructor() {
        this.eventBus = EventBus.getInstance();
        this.setupEventListeners();

        // Check if vibration is supported
        if (typeof navigator.vibrate !== 'function') {
            console.log('HapticManager: Vibration API not supported');
            this.enabled = false;
        }
    }

    private setupEventListeners(): void {
        this.eventBus.on(GameEventType.ENEMY_KILLED, () => this.trigger(HapticPattern.LIGHT));
        this.eventBus.on(GameEventType.PLAYER_DAMAGED, () => this.trigger(HapticPattern.HEAVY));
        this.eventBus.on(GameEventType.GAME_OVER, () => this.trigger(HapticPattern.FAILURE));
        this.eventBus.on(GameEventType.WAVE_COMPLETED, () => this.trigger(HapticPattern.SUCCESS));

        // We can add more events here, e.g., UI clicks if we emit them
    }

    public trigger(pattern: readonly number[] | number[]): void {
        if (!this.enabled) return;

        try {
            navigator.vibrate(pattern);
        } catch (e) {
            console.warn('HapticManager: Failed to vibrate', e);
        }
    }

    public setEnabled(enabled: boolean): void {
        this.enabled = enabled;
    }

    public isEnabled(): boolean {
        return this.enabled;
    }
}
