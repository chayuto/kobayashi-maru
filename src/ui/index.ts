/**
 * UI module barrel export for Kobayashi Maru
 * Contains UI components and overlays
 */
export { HUDManager } from './HUDManager';
export { TurretMenu } from './TurretMenu';
export { TurretUpgradePanel } from './TurretUpgradePanel';
export { HealthBar } from './HealthBar';
export { UI_STYLES } from './styles';
export { GameOverScreen, calculateScore } from './GameOverScreen';
export { PauseOverlay } from './PauseOverlay';
export { ResponsiveUIManager } from './ResponsiveUIManager';
export { MobileControlsOverlay } from './MobileControlsOverlay';
export { MessageLog } from './MessageLog';
export type { HUDData } from './types';

// Base UI component class
export { UIComponent } from './base';

// Panel components (modular building blocks for HUD)
export { WavePanel, ResourcePanel, StatusPanel } from './panels';
export type { WavePanelData, ResourcePanelData, StatusPanelData } from './panels';

// Reusable UI components
export { Button, ToggleButton, IconButton } from './components';
export type { ButtonOptions, ToggleButtonConfig, IconButtonConfig } from './components';

// Layout utilities
export { layoutChildren, gridLayout, centerChild, alignChild } from './layout';
export type { LayoutOptions, GridLayoutOptions, Alignment, Direction } from './layout';

// Animation utilities
export { UIAnimator } from './animation';
export type { AnimationOptions } from './animation';
