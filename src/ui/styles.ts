/**
 * UI Styling Constants for Kobayashi Maru HUD System
 * LCARS-inspired color scheme and layout values
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
    PRIMARY: 0xFF9900,    // LCARS Golden Orange
    SECONDARY: 0x99CCFF,  // LCARS Galaxy Blue
    HEALTH: 0x33CC99,     // Federation Teal
    SHIELD: 0x66AAFF,     // Shield Blue
    DANGER: 0xDD4444,     // Red for low health
    BACKGROUND: 0x000000,
    TEXT: 0xFFFFFF        // White text
  }
} as const;
