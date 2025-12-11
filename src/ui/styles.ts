/**
 * UI Styling Constants for Kobayashi Maru HUD System
 * LCARS-inspired color scheme and layout values - Enhanced for premium look
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

