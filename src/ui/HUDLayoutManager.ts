/**
 * HUD Layout Manager for Kobayashi Maru
 *
 * Centralizes position calculations for HUD elements to eliminate
 * duplicated and error-prone positioning logic.
 *
 * @module ui/HUDLayoutManager
 */

import { GAME_CONFIG } from '../types/constants';
import { UI_STYLES } from './styles';
import { ToggleButton } from './components';

/**
 * Element heights for left column layout (unscaled pixels).
 * These match the actual component sizes.
 */
const LEFT_COLUMN_HEIGHTS = {
    /** Wave panel height */
    WAVE_PANEL: 100,
    /** Mute button (IconButton) height */
    MUTE_BUTTON: 40,
    /** Combat stats panel height */
    COMBAT_STATS: 90,
} as const;

/**
 * Position result from layout calculation.
 */
export interface LayoutPosition {
    x: number;
    y: number;
}

/**
 * Dimensions for layout calculations.
 */
export interface LayoutDimensions {
    width: number;
    height: number;
}

/**
 * HUDLayoutManager provides centralized position calculations for all HUD elements.
 *
 * Instead of duplicating position math in HUDManager.handleResize(), components
 * query this manager for their positions based on scale and layout rules.
 *
 * @example
 * ```typescript
 * const layoutManager = new HUDLayoutManager();
 * const pos = layoutManager.getLeftColumnTogglePosition(0, 1.0);
 * godModeButton.setPosition(pos.x, pos.y);
 * ```
 */
export class HUDLayoutManager {
    private readonly padding: number;
    private readonly worldWidth: number;
    private readonly worldHeight: number;
    private readonly toggleBtnHeight: number;

    constructor() {
        this.padding = UI_STYLES.PADDING;
        this.worldWidth = GAME_CONFIG.WORLD_WIDTH;
        this.worldHeight = GAME_CONFIG.WORLD_HEIGHT;
        this.toggleBtnHeight = ToggleButton.getDimensions().height;
    }

    /**
     * Get scaled padding value.
     */
    getScaledPadding(scale: number): number {
        return this.padding * scale;
    }

    /**
     * Calculate the base Y position for left column elements below the wave panel.
     * This is after: padding + wave panel + padding
     */
    private getLeftColumnBaseY(scale: number): number {
        const padding = this.getScaledPadding(scale);
        return padding + LEFT_COLUMN_HEIGHTS.WAVE_PANEL * scale + padding;
    }

    /**
     * Get position for the mute button (first element after wave panel).
     */
    getMuteButtonPosition(scale: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: padding,
            y: this.getLeftColumnBaseY(scale),
        };
    }

    /**
     * Get position for the combat stats panel (below mute button).
     */
    getCombatStatsPosition(scale: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        const mutePos = this.getMuteButtonPosition(scale);
        return {
            x: padding,
            y: mutePos.y + LEFT_COLUMN_HEIGHTS.MUTE_BUTTON * scale + padding,
        };
    }

    /**
     * Get position for a toggle button in the left column.
     * @param index - Button index (0 = God Mode, 1 = Slow Mode, 2 = AI, 3 = AI Brain)
     */
    getToggleButtonPosition(index: number, scale: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        const combatStatsPos = this.getCombatStatsPosition(scale);

        // Start after combat stats panel
        const baseY = combatStatsPos.y + LEFT_COLUMN_HEIGHTS.COMBAT_STATS * scale + padding;

        return {
            x: padding,
            y: baseY + (this.toggleBtnHeight * scale + padding) * index,
        };
    }

    /**
     * Get position for AI Panel (below all toggle buttons).
     */
    getAIPanelPosition(scale: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        // AI Panel is after 4 toggle buttons
        const lastTogglePos = this.getToggleButtonPosition(3, scale);
        return {
            x: padding,
            y: lastTogglePos.y + this.toggleBtnHeight * scale + padding + padding,
        };
    }

    /**
     * Get position for AI Thought Feed (below AI Panel).
     * @param aiPanelHeight - Actual height of AI Panel (normal or expanded)
     */
    getAIThoughtFeedPosition(scale: number, aiPanelHeight: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        const aiPanelPos = this.getAIPanelPosition(scale);
        return {
            x: padding,
            y: aiPanelPos.y + aiPanelHeight * scale + padding,
        };
    }

    /**
     * Get position for wave panel (top-left).
     */
    getWavePanelPosition(scale: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return { x: padding, y: padding };
    }

    /**
     * Get position for resource panel (top-right).
     */
    getResourcePanelPosition(scale: number, panelWidth: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: this.worldWidth - panelWidth * scale - padding,
            y: padding,
        };
    }

    /**
     * Get position for score panel (bottom-left).
     */
    getScorePanelPosition(scale: number, panelHeight: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: padding,
            y: this.worldHeight - panelHeight * scale - padding,
        };
    }

    /**
     * Get position for status panel (bottom-center).
     */
    getStatusPanelPosition(scale: number, panelWidth: number, panelHeight: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: (this.worldWidth - panelWidth * scale) / 2,
            y: this.worldHeight - panelHeight * scale - padding,
        };
    }

    /**
     * Get position for turret count panel (bottom-right).
     */
    getTurretCountPanelPosition(scale: number, panelWidth: number, panelHeight: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: this.worldWidth - panelWidth * scale - padding,
            y: this.worldHeight - panelHeight * scale - padding,
        };
    }

    /**
     * Get position for turret menu (right side).
     */
    getTurretMenuPosition(scale: number, menuWidth: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: this.worldWidth - menuWidth * scale - padding,
            y: padding + 70 * scale + padding,
        };
    }

    /**
     * Get position for turret upgrade panel (left of turret menu).
     */
    getTurretUpgradePanelPosition(scale: number, menuWidth: number, upgradePanelWidth: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        const menuPos = this.getTurretMenuPosition(scale, menuWidth);
        return {
            x: menuPos.x - upgradePanelWidth * scale - padding,
            y: menuPos.y,
        };
    }

    /**
     * Get position for message log (bottom-left area).
     */
    getMessageLogPosition(scale: number, logHeight: number): LayoutPosition {
        const padding = this.getScaledPadding(scale);
        return {
            x: padding,
            y: this.worldHeight - logHeight * scale - padding,
        };
    }
}
