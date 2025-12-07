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
export { OrientationOverlay } from './OrientationOverlay';
export { MessageLog } from './MessageLog';
export type { HUDData } from './types';

// Panel components (modular building blocks for HUD)
export { WavePanel, ResourcePanel, StatusPanel } from './panels';
export type { WavePanelData, ResourcePanelData, StatusPanelData } from './panels';
