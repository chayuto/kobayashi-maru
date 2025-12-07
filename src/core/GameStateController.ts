/**
 * Game State Controller for Kobayashi Maru
 * Manages game state transitions: pause, resume, restart, game over.
 * Extracted from Game.ts for better modularity.
 */
import { defineQuery, removeEntity } from 'bitecs';
import { Position, Faction, SpriteRef, Health } from '../ecs/components';
import { GameWorld, decrementEntityCount } from '../ecs';
import { GameState, GameStateType, ScoreManager, HighScoreManager, ResourceManager, WaveManager } from '../game';
import { calculateScore } from '../ui';
import { GAME_CONFIG } from '../types';
import type { GameOverScreen, PauseOverlay } from '../ui';
import type { CombatSystem } from '../systems';

// Query for all entities (for cleanup during restart)
const allEntitiesQuery = defineQuery([Position, Faction, SpriteRef]);

/**
 * Interface for Game methods/properties that GameStateController needs access to.
 * This avoids circular dependency issues.
 */
export interface GameStateContext {
    world: GameWorld;
    gameState: GameState;
    scoreManager: ScoreManager;
    highScoreManager: HighScoreManager;
    resourceManager: ResourceManager;
    waveManager: WaveManager;
    combatSystem: CombatSystem | null;
    gameOverScreen: GameOverScreen | null;
    pauseOverlay: PauseOverlay | null;
    renderSystem: ((world: GameWorld) => void) | null;
    /** Called after restart to reinitialize gameplay */
    initializeGameplay: () => void;
    /** Reset input handler state */
    resetInputSelection: () => void;
}

/**
 * Controls game state transitions and manages pause, restart, and game over flows.
 */
export class GameStateController {
    private context: GameStateContext;
    private gameTime: number = 0;
    private godModeEnabled: boolean = false;
    private slowModeEnabled: boolean = true; // Default to slow mode (0.5x speed)
    private kobayashiMaruId: number = -1;
    private killCount: number = 0;

    constructor(context: GameStateContext) {
        this.context = context;
    }

    /**
     * Get current game time.
     */
    getGameTime(): number {
        return this.gameTime;
    }

    /**
     * Update game time (called from game loop).
     */
    updateGameTime(deltaTime: number): void {
        this.gameTime += deltaTime;
    }

    /**
     * Reset game time to zero.
     */
    resetGameTime(): void {
        this.gameTime = 0;
    }

    /**
     * Get the Kobayashi Maru entity ID.
     */
    getKobayashiMaruId(): number {
        return this.kobayashiMaruId;
    }

    /**
     * Set the Kobayashi Maru entity ID.
     */
    setKobayashiMaruId(id: number): void {
        this.kobayashiMaruId = id;
    }

    /**
     * Get the kill count.
     */
    getKillCount(): number {
        return this.killCount;
    }

    /**
     * Increment kill count.
     */
    incrementKillCount(): void {
        this.killCount++;
    }

    /**
     * Reset kill count.
     */
    resetKillCount(): void {
        this.killCount = 0;
    }

    /**
     * Pause the game.
     */
    pause(): void {
        const { gameState, pauseOverlay } = this.context;

        if (!gameState.isPlaying()) {
            return;
        }

        gameState.setState(GameStateType.PAUSED);

        // Show pause overlay
        if (pauseOverlay) {
            pauseOverlay.show();
        }

        console.log('Game paused');
    }

    /**
     * Resume the game.
     */
    resume(): void {
        const { gameState, pauseOverlay } = this.context;

        if (!gameState.isPaused()) {
            return;
        }

        gameState.setState(GameStateType.PLAYING);

        // Hide pause overlay
        if (pauseOverlay) {
            pauseOverlay.hide();
        }

        console.log('Game resumed');
    }

    /**
     * Check if the game is paused.
     */
    isPaused(): boolean {
        return this.context.gameState.isPaused();
    }

    /**
     * Checks if the Kobayashi Maru has been destroyed and triggers game over.
     */
    checkGameOver(): void {
        // Skip game over check if god mode is enabled
        if (this.godModeEnabled) {
            return;
        }

        if (this.kobayashiMaruId === -1) {
            return;
        }

        const health = Health.current[this.kobayashiMaruId];
        if (health === undefined || health <= 0) {
            this.triggerGameOver();
        }
    }

    /**
     * Triggers the game over state.
     */
    triggerGameOver(): void {
        const { gameState, waveManager, highScoreManager, scoreManager, gameOverScreen } = this.context;

        // Set game state to game over
        gameState.setState(GameStateType.GAME_OVER);

        // Stop wave spawning
        waveManager.setAutoStartNextWave(false);

        // Get previous high score before saving
        const previousHighScore = highScoreManager.getHighestScore();
        const previousBestScore = previousHighScore ? calculateScore(previousHighScore) : 0;

        // Save final score
        const finalScore = scoreManager.getScoreData();
        const saved = highScoreManager.saveScore(finalScore);

        console.log('Game Over!');
        console.log(`Time Survived: ${finalScore.timeSurvived.toFixed(2)}s`);
        console.log(`Wave Reached: ${finalScore.waveReached}`);
        console.log(`Enemies Defeated: ${finalScore.enemiesDefeated}`);
        if (saved) {
            console.log('New high score!');
        }

        // Show game over screen
        if (gameOverScreen) {
            gameOverScreen.show(finalScore, saved, previousBestScore);
        }
    }

    /**
     * Restart the game after game over.
     */
    restart(): void {
        const {
            gameOverScreen, scoreManager, resourceManager, waveManager,
            combatSystem, gameState
        } = this.context;

        // Hide game over screen
        if (gameOverScreen) {
            gameOverScreen.hide();
        }

        // Clear all existing entities
        this.clearAllEntities();

        // Reset all managers
        scoreManager.reset();
        resourceManager.reset();
        this.killCount = 0;
        waveManager.reset();
        this.gameTime = 0;

        // Reset combat stats
        if (combatSystem) {
            combatSystem.resetStats();
        }

        // Reset game state to MENU then PLAYING (to follow valid state transitions)
        gameState.reset();

        // Re-enable auto wave progression
        waveManager.setAutoStartNextWave(true);

        // Reset input selection
        this.context.resetInputSelection();

        // Re-initialize gameplay (spawn new Kobayashi Maru and start wave 1)
        this.context.initializeGameplay();

        console.log('Game restarted');
    }

    /**
     * Clear all entities from the world for restart.
     */
    private clearAllEntities(): void {
        const { world, renderSystem } = this.context;
        const entities = allEntitiesQuery(world);

        for (const eid of entities) {
            removeEntity(world, eid);
            decrementEntityCount();
        }

        // Reset Kobayashi Maru tracking
        this.kobayashiMaruId = -1;

        // Run render system once to clean up sprites for removed entities
        if (renderSystem) {
            renderSystem(world);
        }
    }

    // ==========================================================================
    // GOD MODE AND SLOW MODE
    // ==========================================================================

    /**
     * Enable or disable god mode.
     * @param enabled - Whether god mode should be enabled
     */
    setGodMode(enabled: boolean): void {
        this.godModeEnabled = enabled;
        console.log(`God mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Toggle god mode on/off.
     * @returns The new god mode state
     */
    toggleGodMode(): boolean {
        this.godModeEnabled = !this.godModeEnabled;
        console.log(`God mode ${this.godModeEnabled ? 'enabled' : 'disabled'}`);
        return this.godModeEnabled;
    }

    /**
     * Check if god mode is enabled.
     * @returns Whether god mode is enabled
     */
    isGodModeEnabled(): boolean {
        return this.godModeEnabled;
    }

    /**
     * Enable or disable slow mode (half speed for all enemies).
     * @param enabled - Whether slow mode should be enabled
     */
    setSlowMode(enabled: boolean): void {
        this.slowModeEnabled = enabled;
        console.log(`Slow mode ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Toggle slow mode on/off.
     * @returns The new slow mode state
     */
    toggleSlowMode(): boolean {
        this.slowModeEnabled = !this.slowModeEnabled;
        console.log(`Slow mode ${this.slowModeEnabled ? 'enabled' : 'disabled'}`);
        return this.slowModeEnabled;
    }

    /**
     * Check if slow mode is enabled.
     * @returns Whether slow mode is enabled
     */
    isSlowModeEnabled(): boolean {
        return this.slowModeEnabled;
    }

    /**
     * Get the slow mode speed multiplier.
     * @returns The speed multiplier (1.0 if slow mode disabled, 0.5 if enabled)
     */
    getSpeedMultiplier(): number {
        return this.slowModeEnabled ? GAME_CONFIG.SLOW_MODE_MULTIPLIER : 1.0;
    }
}
