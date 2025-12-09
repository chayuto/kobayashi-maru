/**
 * Achievement Manager for Kobayashi Maru
 * 
 * Tracks player achievements and emits events when unlocked.
 * 
 * @module game/AchievementManager
 */
import { EventBus } from '../core/EventBus';
import { GameEventType, WaveCompletedPayload, ComboUpdatedPayload } from '../types/events';

/** Achievement definition */
export interface Achievement {
    id: string;
    name: string;
    description: string;
    unlocked: boolean;
    unlockedAt?: number;
}

/** Achievement type enum */
export const AchievementId = {
    FIRST_BLOOD: 'first_blood',
    DECIMATOR: 'decimator',
    SURVIVOR: 'survivor',
    WAVE_MASTER: 'wave_master',
    COMBO_KING: 'combo_king',
    TURRET_COMMANDER: 'turret_commander',
    WAVE_SURVIVOR_5: 'wave_survivor_5',
    KILLS_500: 'kills_500'
} as const;

/** Achievement definitions */
const ACHIEVEMENT_DEFS: Record<string, Omit<Achievement, 'unlocked' | 'unlockedAt'>> = {
    [AchievementId.FIRST_BLOOD]: {
        id: AchievementId.FIRST_BLOOD,
        name: 'First Blood',
        description: 'Destroy your first enemy'
    },
    [AchievementId.DECIMATOR]: {
        id: AchievementId.DECIMATOR,
        name: 'Decimator',
        description: 'Destroy 100 enemies in a single game'
    },
    [AchievementId.SURVIVOR]: {
        id: AchievementId.SURVIVOR,
        name: 'Survivor',
        description: 'Survive for 5 minutes'
    },
    [AchievementId.WAVE_MASTER]: {
        id: AchievementId.WAVE_MASTER,
        name: 'Wave Master',
        description: 'Complete wave 10'
    },
    [AchievementId.COMBO_KING]: {
        id: AchievementId.COMBO_KING,
        name: 'Combo King',
        description: 'Reach a 10x combo multiplier'
    },
    [AchievementId.TURRET_COMMANDER]: {
        id: AchievementId.TURRET_COMMANDER,
        name: 'Turret Commander',
        description: 'Build 10 turrets in a single game'
    },
    [AchievementId.WAVE_SURVIVOR_5]: {
        id: AchievementId.WAVE_SURVIVOR_5,
        name: 'Early Bird',
        description: 'Complete wave 5'
    },
    [AchievementId.KILLS_500]: {
        id: AchievementId.KILLS_500,
        name: 'Exterminator',
        description: 'Destroy 500 enemies in a single game'
    }
};

const STORAGE_KEY = 'kobayashi-maru-achievements';

/**
 * AchievementManager - tracks and unlocks achievements
 */
export class AchievementManager {
    private achievements: Map<string, Achievement> = new Map();
    private eventBus: EventBus;
    private boundHandlers: Map<GameEventType, (payload: unknown) => void> = new Map();

    // Game session tracking
    private sessionKills: number = 0;
    private sessionTime: number = 0;
    private turretsBuilt: number = 0;

    constructor() {
        this.eventBus = EventBus.getInstance();
        this.initAchievements();
        this.loadFromStorage();
        this.subscribeToEvents();
    }

    private initAchievements(): void {
        for (const [id, def] of Object.entries(ACHIEVEMENT_DEFS)) {
            this.achievements.set(id, { ...def, unlocked: false });
        }
    }

    private loadFromStorage(): void {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored) as Record<string, { unlocked: boolean; unlockedAt?: number }>;
                for (const [id, state] of Object.entries(data)) {
                    const achievement = this.achievements.get(id);
                    if (achievement) {
                        achievement.unlocked = state.unlocked;
                        achievement.unlockedAt = state.unlockedAt;
                    }
                }
            }
        } catch {
            // Ignore storage errors
        }
    }

    private saveToStorage(): void {
        try {
            const data: Record<string, { unlocked: boolean; unlockedAt?: number }> = {};
            for (const [id, achievement] of this.achievements.entries()) {
                if (achievement.unlocked) {
                    data[id] = { unlocked: true, unlockedAt: achievement.unlockedAt };
                }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch {
            // Ignore storage errors
        }
    }

    private subscribeToEvents(): void {
        const killHandler = () => this.handleEnemyKilled();
        const waveHandler = (payload: WaveCompletedPayload) => this.handleWaveCompleted(payload);
        const comboHandler = (payload: ComboUpdatedPayload) => this.handleComboUpdated(payload);

        this.eventBus.on(GameEventType.ENEMY_KILLED, killHandler);
        this.eventBus.on(GameEventType.WAVE_COMPLETED, waveHandler);
        this.eventBus.on(GameEventType.COMBO_UPDATED, comboHandler);

        this.boundHandlers.set(GameEventType.ENEMY_KILLED, killHandler as (p: unknown) => void);
        this.boundHandlers.set(GameEventType.WAVE_COMPLETED, waveHandler as (p: unknown) => void);
        this.boundHandlers.set(GameEventType.COMBO_UPDATED, comboHandler as (p: unknown) => void);
    }

    private handleEnemyKilled(): void {
        this.sessionKills++;

        if (this.sessionKills === 1) {
            this.unlock(AchievementId.FIRST_BLOOD);
        }
        if (this.sessionKills >= 100) {
            this.unlock(AchievementId.DECIMATOR);
        }
        if (this.sessionKills >= 500) {
            this.unlock(AchievementId.KILLS_500);
        }
    }

    private handleWaveCompleted(payload: WaveCompletedPayload): void {
        if (payload.waveNumber >= 5) {
            this.unlock(AchievementId.WAVE_SURVIVOR_5);
        }
        if (payload.waveNumber >= 10) {
            this.unlock(AchievementId.WAVE_MASTER);
        }
    }

    private handleComboUpdated(payload: ComboUpdatedPayload): void {
        if (payload.multiplier >= 10) {
            this.unlock(AchievementId.COMBO_KING);
        }
    }

    /**
     * Update time-based achievements
     */
    update(deltaTime: number): void {
        this.sessionTime += deltaTime;

        if (this.sessionTime >= 300) { // 5 minutes
            this.unlock(AchievementId.SURVIVOR);
        }
    }

    /**
     * Track turret building for achievements
     */
    onTurretBuilt(): void {
        this.turretsBuilt++;
        if (this.turretsBuilt >= 10) {
            this.unlock(AchievementId.TURRET_COMMANDER);
        }
    }

    private unlock(id: string): void {
        const achievement = this.achievements.get(id);
        if (achievement && !achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockedAt = Date.now();
            this.saveToStorage();

            this.eventBus.emit(GameEventType.ACHIEVEMENT_UNLOCKED, {
                achievementId: achievement.id,
                name: achievement.name,
                description: achievement.description
            });
        }
    }

    // Public API
    getAchievement(id: string): Achievement | undefined {
        const achievement = this.achievements.get(id);
        return achievement ? { ...achievement } : undefined;
    }

    getAllAchievements(): Achievement[] {
        return Array.from(this.achievements.values()).map(a => ({ ...a }));
    }

    getUnlockedAchievements(): Achievement[] {
        return this.getAllAchievements().filter(a => a.unlocked);
    }

    getUnlockedCount(): number {
        return this.getUnlockedAchievements().length;
    }

    getTotalCount(): number {
        return this.achievements.size;
    }

    /**
     * Reset session stats for new game (achievements persist)
     */
    resetSession(): void {
        this.sessionKills = 0;
        this.sessionTime = 0;
        this.turretsBuilt = 0;
    }

    /**
     * Clear all achievements (for debugging)
     */
    clearAll(): void {
        this.achievements.forEach(a => {
            a.unlocked = false;
            a.unlockedAt = undefined;
        });
        localStorage.removeItem(STORAGE_KEY);
    }

    unsubscribe(): void {
        for (const [eventType, handler] of this.boundHandlers.entries()) {
            this.eventBus.off(eventType, handler);
        }
        this.boundHandlers.clear();
    }
}
