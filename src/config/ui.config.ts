/**
 * UI Configuration
 * 
 * Settings for user interface elements, dimensions, and colors.
 * 
 * @module config/ui
 */

/**
 * UI configuration values.
 * 
 * @example
 * ```typescript
 * import { UI_CONFIG } from '../config';
 * 
 * const buttonWidth = UI_CONFIG.BUTTONS.TOGGLE_WIDTH;
 * const primaryColor = UI_CONFIG.COLORS.PRIMARY;
 * ```
 */
export const UI_CONFIG = {
    /**
     * Common padding and spacing values.
     */
    SPACING: {
        /** Standard padding in pixels */
        PADDING: 16,
        /** Gap between panels */
        PANEL_GAP: 8,
        /** Gap between elements within a panel */
        ELEMENT_GAP: 4,
    },

    /**
     * Button dimensions.
     */
    BUTTONS: {
        /** Toggle button width (god mode, slow mode) */
        TOGGLE_WIDTH: 100,
        /** Toggle button height */
        TOGGLE_HEIGHT: 32,
        /** Turret selection button size */
        TURRET_BUTTON_SIZE: 64,
    },

    /**
     * Health and shield bar dimensions.
     */
    BARS: {
        /** Standard bar width */
        WIDTH: 200,
        /** Standard bar height */
        HEIGHT: 20,
        /** Bar border width */
        BORDER_WIDTH: 2,
    },

    /**
     * Font settings for UI text.
     */
    FONTS: {
        /** Default font family */
        FAMILY: 'Courier New, monospace',
        /** Small text size */
        SIZE_SMALL: 12,
        /** Medium text size */
        SIZE_MEDIUM: 16,
        /** Large text size */
        SIZE_LARGE: 24,
        /** Extra large text size */
        SIZE_XLARGE: 32,
    },

    /**
     * UI color palette.
     */
    COLORS: {
        /** Primary accent color (LCARS cyan) */
        PRIMARY: 0x00FFFF,
        /** Secondary accent color (yellow) */
        SECONDARY: 0xFFCC00,
        /** Panel background color */
        BACKGROUND: 0x1A1A2E,
        /** Standard text color */
        TEXT: 0xE0E0E0,
        /** Health bar color */
        HEALTH: 0x00FF00,
        /** Shield bar color */
        SHIELD: 0x3399FF,
        /** Danger/warning color */
        DANGER: 0xFF3333,
        /** Disabled element color */
        DISABLED: 0x888888,
    },

    /**
     * Interaction settings.
     */
    INTERACTION: {
        /** Radius for turret click/tap detection in pixels */
        TURRET_CLICK_RADIUS: 32,
        /** Radius for enemy selection in pixels */
        ENEMY_SELECT_RADIUS: 24,
    },
} as const;

export type UIConfig = typeof UI_CONFIG;
