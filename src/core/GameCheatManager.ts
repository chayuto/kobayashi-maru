/**
 * Game Cheat Manager for Kobayashi Maru
 * 
 * Manages debug/cheat modes like god mode and slow mode.
 * Extracted from Game.ts to reduce file size and improve modularity.
 * 
 * @module core/GameCheatManager
 */
import { GAME_CONFIG } from '../types/constants';

/**
 * GameCheatManager handles debug and cheat modes.
 */
export class GameCheatManager {
    private godModeEnabled: boolean = false;
    private slowModeEnabled: boolean = false;

    /**
     * Enable or disable god mode.
     * When enabled, the Kobayashi Maru takes no damage.
     */
    setGodMode(enabled: boolean): void {
        this.godModeEnabled = enabled;
    }

    /**
     * Toggle god mode on/off.
     * @returns The new god mode state
     */
    toggleGodMode(): boolean {
        this.godModeEnabled = !this.godModeEnabled;
        return this.godModeEnabled;
    }

    /**
     * Check if god mode is enabled.
     */
    isGodModeEnabled(): boolean {
        return this.godModeEnabled;
    }

    /**
     * Enable or disable slow mode.
     * When enabled, enemies move at half speed.
     */
    setSlowMode(enabled: boolean): void {
        this.slowModeEnabled = enabled;
    }

    /**
     * Toggle slow mode on/off.
     * @returns The new slow mode state
     */
    toggleSlowMode(): boolean {
        this.slowModeEnabled = !this.slowModeEnabled;
        return this.slowModeEnabled;
    }

    /**
     * Check if slow mode is enabled.
     */
    isSlowModeEnabled(): boolean {
        return this.slowModeEnabled;
    }

    /**
     * Get the speed multiplier based on slow mode state.
     * @returns 1.0 if normal, 0.5 if slow mode enabled
     */
    getSpeedMultiplier(): number {
        return this.slowModeEnabled ? GAME_CONFIG.SLOW_MODE_MULTIPLIER : 1.0;
    }

    /**
     * Reset all cheats to disabled.
     */
    reset(): void {
        this.godModeEnabled = false;
        this.slowModeEnabled = false;
    }
}
