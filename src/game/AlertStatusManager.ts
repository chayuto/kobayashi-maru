/**
 * Alert Status Manager for Kobayashi Maru
 *
 * Derives alert level from hull percentage and boss wave state.
 * Emits ALERT_LEVEL_CHANGED events only when the level transitions.
 *
 * @module game/AlertStatusManager
 */
import { EventBus } from '../core/EventBus';
import { GameEventType, AlertLevel } from '../types/events';
import { UI_CONFIG } from '../config/ui.config';

export class AlertStatusManager {
    private currentLevel: AlertLevel = AlertLevel.NORMAL;
    private eventBus: EventBus;

    constructor() {
        this.eventBus = EventBus.getInstance();
    }

    /**
     * Evaluate current conditions and emit event if alert level changes.
     * @param hullPercent - Current hull as fraction (0-1)
     * @param isBossWaveActive - Whether a boss wave is currently active
     */
    evaluate(hullPercent: number, isBossWaveActive: boolean): void {
        const config = UI_CONFIG.ALERT_STATUS;
        let newLevel: AlertLevel;

        if (hullPercent <= config.CRITICAL_HULL_PERCENT) {
            newLevel = AlertLevel.CRITICAL;
        } else if (hullPercent <= config.CAUTION_HULL_PERCENT || isBossWaveActive) {
            newLevel = AlertLevel.CAUTION;
        } else {
            newLevel = AlertLevel.NORMAL;
        }

        if (newLevel !== this.currentLevel) {
            const previousLevel = this.currentLevel;
            this.currentLevel = newLevel;
            this.eventBus.emit(GameEventType.ALERT_LEVEL_CHANGED, {
                level: newLevel,
                previousLevel,
            });
        }
    }

    /**
     * Get current alert level.
     */
    getLevel(): AlertLevel {
        return this.currentLevel;
    }

    /**
     * Reset to normal (for game restart).
     */
    reset(): void {
        this.currentLevel = AlertLevel.NORMAL;
    }
}
