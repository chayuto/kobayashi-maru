/**
 * Gameplay Manager for Kobayashi Maru
 * 
 * Manages all game logic: waves, scoring, resources, and game flow.
 * Separates game rules from rendering and inputs.
 * 
 * @module core/managers/GameplayManager
 */

import { getServices } from '../services';
import { createKobayashiMaru, getEntityCount } from '../../ecs';
import { Health, Shield } from '../../ecs/components';
import { GameStateType } from '../../game/gameState';
import { calculateScore } from '../../ui';
import { GAME_CONFIG, GameEventType, EnemyKilledPayload, WaveStartedPayload, WaveCompletedPayload } from '../../types';
import type { GameWorld } from '../../ecs/world';
import type { ScoreData } from '../../game/scoreManager';
import type { WaveState } from '../../game/waveManager';

/**
 * Gameplay state snapshot for UI
 */
export interface GameplaySnapshot {
    // Game state
    state: GameStateType;
    gameTime: number;

    // Wave info
    waveNumber: number;
    waveState: WaveState;
    activeEnemies: number;

    // Resources
    resources: number;

    // Score
    timeSurvived: number;
    enemiesDefeated: number;
    killCount: number;

    // Kobayashi Maru status
    kmHealth: number;
    kmMaxHealth: number;
    kmShield: number;
    kmMaxShield: number;

    // Cheats
    godModeEnabled: boolean;
    slowModeEnabled: boolean;
}

/**
 * Gameplay event callbacks
 */
export interface GameplayCallbacks {
    onGameOver?: (score: ScoreData, isHighScore: boolean) => void;
    onWaveStart?: (waveNumber: number, enemyCount: number) => void;
    onWaveComplete?: (waveNumber: number) => void;
    onEnemyKilled?: (reward: number) => void;
    onKobayashiMaruDamaged?: (damage: number) => void;
}

/**
 * Manages all gameplay logic.
 */
export class GameplayManager {
    private world: GameWorld;
    private kobayashiMaruId: number = -1;
    private previousKMHealth: number = 0;
    private killCount: number = 0;
    private gameTime: number = 0;

    // Cheat modes
    private godModeEnabled: boolean = false;
    private slowModeEnabled: boolean = true;

    // Event callbacks
    private callbacks: GameplayCallbacks = {};

    // Bound event handlers
    private boundHandleEnemyKilled: (payload: EnemyKilledPayload) => void;
    private boundHandleWaveStarted: (payload: WaveStartedPayload) => void;
    private boundHandleWaveCompleted: (payload: WaveCompletedPayload) => void;

    constructor(world: GameWorld) {
        this.world = world;

        // Bind event handlers
        this.boundHandleEnemyKilled = this.handleEnemyKilled.bind(this);
        this.boundHandleWaveStarted = this.handleWaveStarted.bind(this);
        this.boundHandleWaveCompleted = this.handleWaveCompleted.bind(this);
    }

    /**
     * Set gameplay event callbacks.
     */
    setCallbacks(callbacks: GameplayCallbacks): void {
        this.callbacks = { ...this.callbacks, ...callbacks };
    }

    /**
     * Initialize gameplay and start wave 1.
     */
    init(): void {
        const services = getServices();
        const eventBus = services.get('eventBus');

        // Subscribe to events
        eventBus.on(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
        eventBus.on(GameEventType.WAVE_STARTED, this.boundHandleWaveStarted);
        eventBus.on(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);

        // Spawn Kobayashi Maru
        this.spawnKobayashiMaru();

        // Initialize wave manager
        const waveManager = services.get('waveManager');
        waveManager.init(this.world);
        waveManager.setRenderingDependencies(
            services.get('particleSystem'),
            services.get('spriteManager')
        );

        // Start playing
        services.get('gameState').setState(GameStateType.PLAYING);
        waveManager.startWave(1);

        console.log(`Total entity count: ${getEntityCount()}`);
    }

    /**
     * Spawn Kobayashi Maru at center.
     */
    private spawnKobayashiMaru(): void {
        const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
        const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;

        this.kobayashiMaruId = createKobayashiMaru(this.world, centerX, centerY);
        this.previousKMHealth = Health.max[this.kobayashiMaruId];

        console.log('Kobayashi Maru spawned at center');
    }

    // ==========================================================================
    // UPDATE
    // ==========================================================================

    /**
     * Update gameplay logic.
     * Called each frame when not paused.
     * 
     * @param deltaTime - Time since last frame
     */
    update(deltaTime: number): void {
        const services = getServices();

        // Update game time
        this.gameTime += deltaTime;

        // Update managers
        services.get('scoreManager').update(deltaTime);
        services.get('waveManager').update(deltaTime);

        // Check for game over
        this.checkGameOver();

        // Check for Kobayashi Maru damage (for screen shake)
        this.checkKobayashiMaruDamage();
    }

    /**
     * Check if Kobayashi Maru was damaged.
     */
    private checkKobayashiMaruDamage(): void {
        if (this.kobayashiMaruId === -1) return;

        const currentHealth = Health.current[this.kobayashiMaruId];

        if (currentHealth < this.previousKMHealth) {
            const damage = this.previousKMHealth - currentHealth;
            this.callbacks.onKobayashiMaruDamaged?.(damage);
            this.previousKMHealth = currentHealth;
        } else if (currentHealth > this.previousKMHealth) {
            // Health increased (healing)
            this.previousKMHealth = currentHealth;
        }
    }

    // ==========================================================================
    // GAME FLOW
    // ==========================================================================

    /**
     * Check for game over condition.
     */
    private checkGameOver(): void {
        if (this.godModeEnabled) return;
        if (this.kobayashiMaruId === -1) return;

        const health = Health.current[this.kobayashiMaruId];
        if (health === undefined || health <= 0) {
            this.triggerGameOver();
        }
    }

    /**
     * Trigger game over state.
     */
    private triggerGameOver(): void {
        const services = getServices();
        const gameState = services.get('gameState');
        const waveManager = services.get('waveManager');
        const scoreManager = services.get('scoreManager');
        const highScoreManager = services.get('highScoreManager');

        // Set game state
        gameState.setState(GameStateType.GAME_OVER);
        waveManager.setAutoStartNextWave(false);

        // Get previous high score
        const previousHighScore = highScoreManager.getHighestScore();
        const previousBestScore = previousHighScore ? calculateScore(previousHighScore) : 0;

        // Save score
        const finalScore = scoreManager.getScoreData();
        const isHighScore = highScoreManager.saveScore(finalScore);

        console.log('Game Over!');
        console.log(`Previous Best: ${previousBestScore}`);
        console.log(`Time Survived: ${finalScore.timeSurvived.toFixed(2)}s`);
        console.log(`Wave Reached: ${finalScore.waveReached}`);
        console.log(`Enemies Defeated: ${finalScore.enemiesDefeated}`);

        // Notify callback
        this.callbacks.onGameOver?.(finalScore, isHighScore);
    }

    /**
     * Restart the game.
     */
    restart(): void {
        const services = getServices();

        // Clear all entities
        this.clearAllEntities();

        // Reset managers
        services.get('scoreManager').reset();
        services.get('resourceManager').reset();
        services.get('waveManager').reset();

        // Reset local state
        this.killCount = 0;
        this.gameTime = 0;

        // Reset game state
        services.get('gameState').reset();

        // Re-enable auto wave progression
        services.get('waveManager').setAutoStartNextWave(true);

        // Re-initialize gameplay
        this.spawnKobayashiMaru();
        services.get('waveManager').startWave(1);
        services.get('gameState').setState(GameStateType.PLAYING);

        console.log('Game restarted');
    }

    /**
     * Clear all entities from the world.
     */
    private clearAllEntities(): void {
        // Note: Actual clearing handled by ECS reset in Game.ts or separate manager if implemented
        // For now we just reset our reference
        this.kobayashiMaruId = -1;
    }

    /**
     * Pause the game.
     */
    pause(): void {
        const services = getServices();
        const gameState = services.get('gameState');

        if (!gameState.isPlaying()) return;

        gameState.setState(GameStateType.PAUSED);
        console.log('Game paused');
    }

    /**
     * Resume the game.
     */
    resume(): void {
        const services = getServices();
        const gameState = services.get('gameState');

        if (!gameState.isPaused()) return;

        gameState.setState(GameStateType.PLAYING);
        console.log('Game resumed');
    }

    // ==========================================================================
    // EVENT HANDLERS
    // ==========================================================================

    /**
     * Handle enemy killed event.
     */
    private handleEnemyKilled(payload: EnemyKilledPayload): void {
        const services = getServices();

        // Remove from wave tracking
        services.get('waveManager').removeEnemy(payload.entityId);

        // Award resources
        const reward = GAME_CONFIG.RESOURCE_REWARD;
        services.get('resourceManager').addResources(reward);

        // Track kill
        this.killCount++;

        // Notify callback
        this.callbacks.onEnemyKilled?.(reward);
    }

    /**
     * Handle wave started event.
     */
    private handleWaveStarted(payload: WaveStartedPayload): void {
        this.callbacks.onWaveStart?.(payload.waveNumber, payload.totalEnemies ?? 0);
    }

    /**
     * Handle wave completed event.
     */
    private handleWaveCompleted(payload: WaveCompletedPayload): void {
        this.callbacks.onWaveComplete?.(payload.waveNumber);
    }

    // ==========================================================================
    // CHEAT MODES
    // ==========================================================================

    /**
     * Toggle god mode.
     */
    toggleGodMode(): boolean {
        this.godModeEnabled = !this.godModeEnabled;
        console.log(`God mode ${this.godModeEnabled ? 'enabled' : 'disabled'}`);
        return this.godModeEnabled;
    }

    /**
     * Toggle slow mode.
     */
    toggleSlowMode(): boolean {
        this.slowModeEnabled = !this.slowModeEnabled;
        console.log(`Slow mode ${this.slowModeEnabled ? 'enabled' : 'disabled'}`);
        return this.slowModeEnabled;
    }

    /**
     * Get speed multiplier for slow mode.
     */
    getSpeedMultiplier(): number {
        return this.slowModeEnabled ? GAME_CONFIG.SLOW_MODE_MULTIPLIER : 1.0;
    }

    isGodModeEnabled(): boolean {
        return this.godModeEnabled;
    }

    isSlowModeEnabled(): boolean {
        return this.slowModeEnabled;
    }

    // ==========================================================================
    // GETTERS
    // ==========================================================================

    /**
     * Get Kobayashi Maru entity ID.
     */
    getKobayashiMaruId(): number {
        return this.kobayashiMaruId;
    }

    /**
     * Get current game time.
     */
    getGameTime(): number {
        return this.gameTime;
    }

    /**
     * Get kill count.
     */
    getKillCount(): number {
        return this.killCount;
    }

    /**
     * Get gameplay snapshot for UI.
     */
    getSnapshot(): GameplaySnapshot {
        const services = getServices();
        const gameState = services.get('gameState');
        const waveManager = services.get('waveManager');
        const resourceManager = services.get('resourceManager');
        const scoreManager = services.get('scoreManager');

        // Get Kobayashi Maru status
        let kmHealth = 0, kmMaxHealth = 0, kmShield = 0, kmMaxShield = 0;
        if (this.kobayashiMaruId !== -1) {
            kmHealth = Health.current[this.kobayashiMaruId] ?? 0;
            kmMaxHealth = Health.max[this.kobayashiMaruId] ?? 0;
            kmShield = Shield.current[this.kobayashiMaruId] ?? 0;
            kmMaxShield = Shield.max[this.kobayashiMaruId] ?? 0;
        }

        return {
            state: gameState.getState(),
            gameTime: this.gameTime,
            waveNumber: waveManager.getCurrentWave(),
            waveState: waveManager.getState(),
            activeEnemies: waveManager.getActiveEnemyCount(),
            resources: resourceManager.getResources(),
            timeSurvived: scoreManager.getTimeSurvived(),
            enemiesDefeated: scoreManager.getEnemiesDefeated(),
            killCount: this.killCount,
            kmHealth,
            kmMaxHealth,
            kmShield,
            kmMaxShield,
            godModeEnabled: this.godModeEnabled,
            slowModeEnabled: this.slowModeEnabled,
        };
    }

    // ==========================================================================
    // CLEANUP
    // ==========================================================================

    /**
     * Clean up resources.
     */
    destroy(): void {
        const services = getServices();
        const eventBus = services.get('eventBus');

        // Unsubscribe from events
        eventBus.off(GameEventType.ENEMY_KILLED, this.boundHandleEnemyKilled);
        eventBus.off(GameEventType.WAVE_STARTED, this.boundHandleWaveStarted);
        eventBus.off(GameEventType.WAVE_COMPLETED, this.boundHandleWaveCompleted);

        this.kobayashiMaruId = -1;
        this.callbacks = {};
    }
}
