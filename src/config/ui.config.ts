/**
 * UI Configuration
 * 
 * Settings for user interface elements, dimensions, and colors.
 * Centralized configuration for consistent UI appearance across the game.
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
 * const panelWidth = UI_CONFIG.PANELS.RESOURCE.WIDTH;
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
     * Padding values for UI elements.
     */
    PADDING: {
        /** Small padding (8px) */
        SMALL: 8,
        /** Normal padding (12px) */
        NORMAL: 12,
        /** Large padding (20px) */
        LARGE: 20,
    },

    /**
     * Margin values for UI elements.
     */
    MARGIN: {
        /** Small margin (4px) */
        SMALL: 4,
        /** Normal margin (8px) */
        NORMAL: 8,
        /** Large margin (16px) */
        LARGE: 16,
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
        /** Standard button corner radius */
        CORNER_RADIUS: 6,
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
        /** Panel border color */
        BORDER: 0x0066CC,
        /** Standard text color */
        TEXT: 0xE0E0E0,
        /** Label text color (dimmer than main text) */
        LABEL: 0x99CCFF,
        /** Value text color (highlighted) */
        VALUE: 0xFFCC00,
        /** Health bar color */
        HEALTH: 0x00FF00,
        /** Shield bar color */
        SHIELD: 0x3399FF,
        /** Danger/warning color */
        DANGER: 0xFF3333,
        /** Warning color (orange) */
        WARNING: 0xFF6600,
        /** Success color */
        SUCCESS: 0x00FF00,
        /** Disabled element color */
        DISABLED: 0x888888,
        
        /** Faction colors */
        FEDERATION: 0x0066FF,
        KLINGON: 0xFF0000,
        ROMULAN: 0x00FF00,
        BORG: 0x00FF00,
    },

    /**
     * Panel dimensions for layout calculations.
     */
    PANELS: {
        /** Resource panel dimensions */
        RESOURCE: { WIDTH: 150, HEIGHT: 70 },
        /** Wave panel dimensions */
        WAVE: { WIDTH: 200, HEIGHT: 100 },
        /** Score panel dimensions */
        SCORE: { WIDTH: 180, HEIGHT: 80 },
        /** Combo panel dimensions */
        COMBO: { WIDTH: 100, HEIGHT: 70 },
        /** Status panel dimensions */
        STATUS: { WIDTH: 280, HEIGHT: 120 },
        /** Turret menu dimensions */
        TURRET_MENU: { WIDTH: 180, HEIGHT: 400 },
        /** Upgrade panel dimensions */
        UPGRADE: { WIDTH: 304, HEIGHT: 400 },
        /** Combat stats panel dimensions */
        COMBAT_STATS: { WIDTH: 120, HEIGHT: 90 },
        /** Turret count panel dimensions */
        TURRET_COUNT: { WIDTH: 140, HEIGHT: 60 },
    },

    /**
     * Animation timing settings.
     */
    ANIMATION: {
        /** Fade animation duration in seconds */
        FADE_DURATION: 0.3,
        /** Slide animation duration in seconds */
        SLIDE_DURATION: 0.25,
        /** Pulse animation speed multiplier */
        PULSE_SPEED: 2.0,
    },

    /**
     * Z-index ordering for layered UI elements.
     */
    Z_INDEX: {
        /** Background layer */
        BACKGROUND: 0,
        /** Main game layer */
        GAME: 100,
        /** HUD layer */
        HUD: 200,
        /** Overlay layer (pause, etc.) */
        OVERLAY: 300,
        /** Modal dialog layer */
        MODAL: 400,
        /** Toast notification layer */
        TOAST: 500,
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
