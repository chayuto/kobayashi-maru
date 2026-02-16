/**
 * UI Configuration
 *
 * Settings for user interface elements, dimensions, and colors.
 * Centralized configuration for consistent UI appearance across the game.
 *
 * @module config/ui
 */

/**
 * UI styling constants for Kobayashi Maru HUD System.
 * LCARS-inspired color scheme and layout values — enhanced for premium look.
 *
 * Previously defined in `src/ui/styles.ts`, now centralized here as the
 * single source of truth for all UI styling values.
 *
 * @example
 * ```typescript
 * import { UI_STYLES } from '../config';
 *
 * const font = UI_STYLES.FONT_FAMILY;
 * const primary = UI_STYLES.COLORS.PRIMARY;
 * ```
 */
export const UI_STYLES = {
    FONT_FAMILY: 'monospace',
    FONT_SIZE_LARGE: 24,
    FONT_SIZE_MEDIUM: 18,
    FONT_SIZE_SMALL: 14,
    PADDING: 16,
    BAR_HEIGHT: 20,
    BAR_WIDTH: 300,
    COLORS: {
        PRIMARY: 0xFF9922,      // Warmer LCARS orange
        SECONDARY: 0x66DDFF,    // Brighter galaxy blue
        ACCENT: 0xFF66AA,       // Pink accent for highlights
        HEALTH: 0x00FFAA,       // Vibrant health green
        SHIELD: 0x44BBFF,       // Electric shield blue
        DANGER: 0xFF4455,       // Brighter warning red
        BACKGROUND: 0x0A0A1A,   // Deep space blue-black
        TEXT: 0xEEFFFF,         // Slight cyan tint
        GLOW: 0x00FFCC          // Glow effect color
    }
} as const;

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
     * Common padding and spacing values for layout positioning.
     * SPACING.PADDING is used for positioning panels relative to screen edges.
     * Use PADDING.* for internal element padding within components.
     */
    SPACING: {
        /** Standard screen-edge padding for panel positioning (16px) */
        PADDING: 16,
        /** Gap between adjacent panels */
        PANEL_GAP: 8,
        /** Gap between elements within a panel */
        ELEMENT_GAP: 4,
    },

    /**
     * Padding values for internal UI element spacing.
     * Use these for padding within components (e.g., button text padding).
     * For screen-edge positioning, use SPACING.PADDING.
     */
    PADDING: {
        /** Small internal padding (8px) */
        SMALL: 8,
        /** Normal internal padding (12px) */
        NORMAL: 12,
        /** Large internal padding (20px) */
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
     * Default panel styling values.
     * Most HUD panels use these; override per-panel where intentionally different.
     */
    PANEL_STYLE: {
        /** Default corner radius for panel backgrounds */
        CORNER_RADIUS: 8,
        /** Default background alpha */
        BG_ALPHA: 0.7,
        /** Default border/stroke width */
        BORDER_WIDTH: 2,
        /** Border width when hovered or in active/alert state */
        HOVER_BORDER_WIDTH: 3,
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
        /** Tiny text size (stats, fine-print) */
        SIZE_TINY: 9,
        /** Extra-small text size (descriptions, secondary info) */
        SIZE_XS: 10,
        /** Small text size */
        SIZE_SMALL: 12,
        /** Small-medium text size (names, labels) */
        SIZE_SM: 13,
        /** Medium-small text size (button labels, details) */
        SIZE_MS: 14,
        /** Medium text size */
        SIZE_MEDIUM: 16,
        /** Medium-large text size (panel headers) */
        SIZE_ML: 18,
        /** Large text size */
        SIZE_LARGE: 24,
        /** Extra large text size */
        SIZE_XLARGE: 32,
        /** Title text size (wave announcements, overlays) */
        SIZE_TITLE: 48,
        /** Hero text size (main menu title) */
        SIZE_HERO: 72,
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
     * These are the single source of truth — panel classes read from here.
     */
    PANELS: {
        /** Resource panel dimensions */
        RESOURCE: { WIDTH: 150, HEIGHT: 70 },
        /** Wave panel dimensions */
        WAVE: { WIDTH: 200, HEIGHT: 100 },
        /** Score panel dimensions */
        SCORE: { WIDTH: 180, HEIGHT: 80 },
        /** Combo panel dimensions */
        COMBO: { WIDTH: 120, HEIGHT: 60 },
        /** Status panel dimensions */
        STATUS: { WIDTH: 280, HEIGHT: 120 },
        /** Turret menu dimensions */
        TURRET_MENU: { WIDTH: 240, HEIGHT: 400 },
        /** Upgrade panel dimensions */
        UPGRADE: { WIDTH: 304, HEIGHT: 480 },
        /** Combat stats panel dimensions */
        COMBAT_STATS: { WIDTH: 160, HEIGHT: 90 },
        /** Turret count panel dimensions */
        TURRET_COUNT: { WIDTH: 140, HEIGHT: 60 },
        /** Achievement toast dimensions */
        ACHIEVEMENT_TOAST: { WIDTH: 280, HEIGHT: 70 },
        /** AI thought feed dimensions */
        AI_THOUGHT_FEED: { WIDTH: 280, HEIGHT: 100 },
        /** AI panel dimensions */
        AI_PANEL: { WIDTH: 260, HEIGHT: 160 },
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
    /**
     * Wave announcement banner settings.
     */
    WAVE_ANNOUNCEMENT: {
        /** Fade-in duration in seconds */
        FADE_IN_DURATION: 0.3,
        /** Hold duration in seconds */
        HOLD_DURATION: 2.0,
        /** Fade-out duration in seconds */
        FADE_OUT_DURATION: 0.5,
        /** Background bar alpha */
        BACKGROUND_ALPHA: 0.7,
        /** Background bar height */
        BACKGROUND_HEIGHT: 120,
        /** Title font size */
        TITLE_FONT_SIZE: 48,
        /** Subtitle font size */
        SUBTITLE_FONT_SIZE: 20,
        /** Vertical position as ratio of screen height */
        Y_POSITION_RATIO: 0.35,
    },

    /**
     * Combo celebration settings.
     */
    COMBO: {
        /** Scale factor for pulse animation */
        PULSE_SCALE: 1.15,
        /** Pulse animation duration in seconds */
        PULSE_DURATION: 0.25,
        /** Popup text duration in seconds */
        POPUP_DURATION: 1.0,
        /** Popup float speed in pixels per second */
        POPUP_FLOAT_SPEED: 60,
        /** Multiplier threshold for particle celebration */
        CELEBRATION_THRESHOLD: 5,
        /** Number of particles for celebration effect */
        CELEBRATION_PARTICLE_COUNT: 10,
    },

    /**
     * Alert status system settings.
     */
    ALERT_STATUS: {
        /** Hull percentage threshold for CRITICAL alert */
        CRITICAL_HULL_PERCENT: 0.20,
        /** Hull percentage threshold for CAUTION alert */
        CAUTION_HULL_PERCENT: 0.50,
        /** Border color for NORMAL state */
        NORMAL_COLOR: 0x00FFFF,
        /** Border color for CAUTION state */
        CAUTION_COLOR: 0xFF9922,
        /** Border color for CRITICAL state */
        CRITICAL_COLOR: 0xFF3333,
        /** Pulse speed for CRITICAL state (radians per second) */
        CRITICAL_PULSE_SPEED: 3.0,
        /** Alert banner fade-in duration */
        FADE_IN_DURATION: 0.3,
        /** Alert banner hold duration */
        HOLD_DURATION: 2.0,
        /** Alert banner fade-out duration */
        FADE_OUT_DURATION: 0.5,
    },

    /**
     * Message log display settings.
     */
    MESSAGE_LOG: {
        /** Maximum visible messages */
        MAX_MESSAGES: 8,
        /** Fade-out duration in milliseconds */
        FADE_DURATION: 10000,
        /** Line height in pixels */
        LINE_HEIGHT: 22,
        /** Spacing between messages in pixels */
        MESSAGE_SPACING: 4,
        /** Bottom offset from screen edge for positioning */
        BOTTOM_OFFSET: 200,
    },

    /**
     * Responsive UI breakpoints and scale factors.
     */
    RESPONSIVE: {
        /** Screen width threshold for mobile layout */
        MOBILE_BREAKPOINT: 768,
        /** Screen width threshold for tablet layout */
        TABLET_BREAKPOINT: 1024,
        /** Scale factor for mobile devices */
        MOBILE_SCALE: 0.8,
        /** Scale factor for tablet devices */
        TABLET_SCALE: 0.8,
        /** Scale factor for desktop */
        DESKTOP_SCALE: 1.0,
    },

    /**
     * Pause overlay layout settings.
     */
    PAUSE_OVERLAY: {
        /** Background dimming alpha */
        BACKGROUND_ALPHA: 0.8,
        /** Title Y position */
        TITLE_Y: 200,
        /** First button Y position */
        FIRST_BUTTON_Y: 400,
        /** Vertical spacing between buttons */
        BUTTON_SPACING: 100,
        /** Button width */
        BUTTON_WIDTH: 300,
        /** Button height */
        BUTTON_HEIGHT: 60,
        /** Button background alpha */
        BUTTON_ALPHA: 0.9,
        /** Z-index for overlay layer */
        Z_INDEX: 1000,
    },

    /**
     * HUD left column element heights (unscaled pixels).
     * Used by HUDLayoutManager for stacking calculations.
     */
    LEFT_COLUMN: {
        /** Mute button (IconButton) height */
        MUTE_BUTTON_HEIGHT: 40,
        /** Resource panel top-right height offset */
        RESOURCE_HEIGHT_OFFSET: 70,
    },

    /**
     * Tutorial overlay settings.
     */
    TUTORIAL: {
        /** Panel width in pixels */
        PANEL_WIDTH: 700,
        /** Panel padding in pixels */
        PANEL_PADDING: 24,
        /** Panel corner radius */
        PANEL_CORNER_RADIUS: 8,
        /** Panel background alpha */
        PANEL_BACKGROUND_ALPHA: 0.85,
        /** Panel border width */
        PANEL_BORDER_WIDTH: 2,
        /** Fade-in duration in seconds */
        FADE_IN_DURATION: 0.3,
        /** Fade-out duration in seconds */
        FADE_OUT_DURATION: 0.3,
        /** Y position for 'top' placement */
        POSITION_TOP_Y: 100,
        /** Y position for 'center' placement */
        POSITION_CENTER_Y: 540,
        /** Y position for 'bottom' placement */
        POSITION_BOTTOM_Y: 900,
        /** Container z-index (below pause overlay at 1000) */
        Z_INDEX: 998,
        /** localStorage key for tutorial completion */
        STORAGE_KEY: 'km_tutorial_complete',
        /** Delay in seconds before first step after start */
        INITIAL_DELAY: 1.0,
    },
} as const;

export type UIConfig = typeof UI_CONFIG;
