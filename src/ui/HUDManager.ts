/**
 * HUD Manager for Kobayashi Maru
 * Manages all in-game HUD elements including wave info, resources, score, and Kobayashi Maru status
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { HUDData } from './types';

import { GAME_CONFIG } from '../types/constants';
import { TurretMenu } from './TurretMenu';
import { TurretUpgradePanel } from './TurretUpgradePanel';
import { MobileControlsOverlay } from './MobileControlsOverlay';
import { MessageLog } from './MessageLog';
import { AudioManager } from '../audio';
import { ResponsiveUIManager } from './ResponsiveUIManager';
import { WavePanel, ResourcePanel, StatusPanel, CombatStatsPanel, ScorePanel, TurretCountPanel } from './panels';
import { ToggleButton } from './components';

// Forward declaration for Game type to avoid circular imports
// Forward declaration for Game type to avoid circular imports
export interface GameInterface {
  toggleGodMode(): boolean;
  toggleSlowMode(): boolean;
  isGodModeEnabled(): boolean;
  isSlowModeEnabled(): boolean;
}

/**
 * HUDManager class - manages all HUD display elements
 */
export class HUDManager {
  public container: Container;
  private visible: boolean = true;
  private app: Application | null = null;
  private game: GameInterface | null = null;
  private responsiveUIManager: ResponsiveUIManager | null = null;

  // UI Panels
  private wavePanel: WavePanel | null = null;
  private resourcePanel: ResourcePanel | null = null;
  private statusPanel: StatusPanel | null = null;
  private scorePanel: ScorePanel | null = null;
  private turretCountPanel: TurretCountPanel | null = null;
  private combatStatsPanel: CombatStatsPanel | null = null;

  // UI Components
  private turretMenu: TurretMenu | null = null;
  private turretUpgradePanel: TurretUpgradePanel | null = null;
  private mobileControls: MobileControlsOverlay | null = null;
  private messageLog: MessageLog | null = null;

  // Sound mute button
  private muteButton: Container | null = null;
  private muteIcon: Graphics | null = null;
  private muteLabel: Text | null = null;

  // Toggle buttons
  private godModeButton: ToggleButton | null = null;
  private slowModeButton: ToggleButton | null = null;

  // Bound event handler for cleanup
  private boundResizeHandler: (() => void) | null = null;

  constructor() {
    this.container = new Container();
  }

  /**
   * Initialize the HUD with PixiJS Application
   * @param app - PixiJS Application instance
   * @param game - Optional Game instance for mode toggles
   */
  init(app: Application, game?: GameInterface): void {
    this.app = app;
    this.game = game ?? null;
    this.responsiveUIManager = new ResponsiveUIManager(app);

    // Add HUD container to stage (on top of everything)
    this.app.stage.addChild(this.container);

    // Create all HUD elements
    this.createTopLeftPanel();
    this.createTopRightPanel();
    this.createBottomLeftPanel();
    this.createBottomCenterPanel();
    this.createBottomRightPanel();
    this.createMuteButton();
    this.createStatsPanel();
    this.createGodModeButton();
    this.createSlowModeButton();

    // Create Turret Menu
    this.turretMenu = new TurretMenu();
    const menuX = GAME_CONFIG.WORLD_WIDTH - 180 - UI_STYLES.PADDING;
    const menuY = UI_STYLES.PADDING + 70 + UI_STYLES.PADDING;
    this.turretMenu.setPosition(menuX, menuY);
    this.container.addChild(this.turretMenu.container);

    // Create Turret Upgrade Panel (hidden by default)
    this.turretUpgradePanel = new TurretUpgradePanel();
    const upgradePanelX = menuX - 304 - UI_STYLES.PADDING;
    const upgradePanelY = menuY;
    this.turretUpgradePanel.setPosition(upgradePanelX, upgradePanelY);
    this.container.addChild(this.turretUpgradePanel.container);

    // Create Mobile Controls Overlay
    this.mobileControls = new MobileControlsOverlay();
    this.container.addChild(this.mobileControls.container);

    // Create Message Log
    this.messageLog = new MessageLog();
    this.messageLog.setPosition(UI_STYLES.PADDING, GAME_CONFIG.WORLD_HEIGHT - 200);
    this.container.addChild(this.messageLog.container);

    // Handle resize
    this.boundResizeHandler = this.handleResize.bind(this);
    window.addEventListener('resize', this.boundResizeHandler);
    this.handleResize();
  }

  /**
   * Handle window resize to update HUD layout
   */
  private handleResize(): void {
    if (!this.responsiveUIManager) return;

    const scale = this.responsiveUIManager.getScaleFactor();
    const padding = UI_STYLES.PADDING * scale;
    const width = GAME_CONFIG.WORLD_WIDTH;
    const height = GAME_CONFIG.WORLD_HEIGHT;
    const toggleBtnHeight = ToggleButton.getDimensions().height;

    // Update Wave Panel
    if (this.wavePanel) {
      this.wavePanel.setScale(scale);
      this.wavePanel.setPosition(padding, padding);
    }

    // Update Resource Panel
    if (this.resourcePanel) {
      const panelWidth = 150;
      this.resourcePanel.setScale(scale);
      this.resourcePanel.setPosition(width - (panelWidth * scale) - padding, padding);
    }

    // Update Score Panel (Bottom Left)
    if (this.scorePanel) {
      this.scorePanel.setScale(scale);
      this.scorePanel.setPosition(padding, height - (80 * scale) - padding);
    }

    // Update Turret Count Panel (Bottom Right)
    if (this.turretCountPanel) {
      this.turretCountPanel.setScale(scale);
      this.turretCountPanel.setPosition(width - (140 * scale) - padding, height - (60 * scale) - padding);
    }

    // Update Status Panel (Bottom Center)
    if (this.statusPanel) {
      const panelWidth = 280;
      this.statusPanel.setScale(scale);
      this.statusPanel.setPosition((width - (panelWidth * scale)) / 2, height - (120 * scale) - padding);
    }

    // Update Mute Button
    if (this.muteButton) {
      this.muteButton.scale.set(scale);
      this.muteButton.position.set(padding, padding + (100 * scale) + padding);
    }

    // Update Combat Stats Panel
    if (this.combatStatsPanel) {
      this.combatStatsPanel.setScale(scale);
      this.combatStatsPanel.setPosition(padding, padding + (100 * scale) + padding + (40 * scale) + padding);
    }

    // Update Turret Menu
    if (this.turretMenu) {
      this.turretMenu.container.scale.set(scale);
      this.turretMenu.container.position.set(
        width - (180 * scale) - padding,
        padding + (70 * scale) + padding
      );
    }

    // Update Turret Upgrade Panel
    if (this.turretUpgradePanel) {
      this.turretUpgradePanel.container.scale.set(scale);
      const menuX = width - (180 * scale) - padding;
      const menuY = padding + (70 * scale) + padding;
      this.turretUpgradePanel.container.position.set(
        menuX - (304 * scale) - padding,
        menuY
      );
    }

    // Update Mobile Controls
    if (this.mobileControls) {
      this.mobileControls.updateLayout(scale);
    }

    // Update Message Log
    if (this.messageLog) {
      this.messageLog.container.scale.set(scale);
      this.messageLog.container.position.set(padding, height - (200 * scale) - padding);
    }

    // Update God Mode Button
    if (this.godModeButton) {
      this.godModeButton.setScale(scale);
      this.godModeButton.setPosition(padding, padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding);
    }

    // Update Slow Mode Button
    if (this.slowModeButton) {
      this.slowModeButton.setScale(scale);
      this.slowModeButton.setPosition(padding, padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding + (toggleBtnHeight * scale) + padding);
    }
  }

  /**
   * Create top-left panel: Wave info using WavePanel component
   */
  private createTopLeftPanel(): void {
    const padding = UI_STYLES.PADDING;
    this.wavePanel = new WavePanel();
    this.wavePanel.init(this.container);
    this.wavePanel.setPosition(padding, padding);
  }

  /**
   * Create top-right panel: Resources display
   */
  private createTopRightPanel(): void {
    const padding = UI_STYLES.PADDING;
    const panelWidth = 150;
    const x = GAME_CONFIG.WORLD_WIDTH - panelWidth - padding;

    this.resourcePanel = new ResourcePanel();
    this.resourcePanel.init(this.container);
    this.resourcePanel.setPosition(x, padding);
  }

  /**
   * Create bottom-left panel: Score info using ScorePanel component
   */
  private createBottomLeftPanel(): void {
    const padding = UI_STYLES.PADDING;
    const y = GAME_CONFIG.WORLD_HEIGHT - 80 - padding;

    this.scorePanel = new ScorePanel();
    this.scorePanel.init(this.container);
    this.scorePanel.setPosition(padding, y);
  }

  /**
   * Create bottom-center panel: Kobayashi Maru status
   */
  private createBottomCenterPanel(): void {
    const panelWidth = 280;
    const panelHeight = 120;
    const x = (GAME_CONFIG.WORLD_WIDTH - panelWidth) / 2;
    const y = GAME_CONFIG.WORLD_HEIGHT - panelHeight - UI_STYLES.PADDING;

    this.statusPanel = new StatusPanel();
    this.statusPanel.init(this.container);
    this.statusPanel.setPosition(x, y);
  }

  /**
   * Create bottom-right panel: Turret count using TurretCountPanel component
   */
  private createBottomRightPanel(): void {
    const padding = UI_STYLES.PADDING;
    const panelWidth = 140;
    const x = GAME_CONFIG.WORLD_WIDTH - panelWidth - padding;
    const y = GAME_CONFIG.WORLD_HEIGHT - 60 - padding;

    this.turretCountPanel = new TurretCountPanel();
    this.turretCountPanel.init(this.container);
    this.turretCountPanel.setPosition(x, y);
  }

  /**
   * Create sound mute button in the top-left corner below the wave panel
   */
  private createMuteButton(): void {
    const padding = UI_STYLES.PADDING;
    const buttonSize = 40;
    const x = padding;
    const y = padding + 100 + padding;

    this.muteButton = new Container();
    this.muteButton.position.set(x, y);
    this.muteButton.eventMode = 'static';
    this.muteButton.cursor = 'pointer';

    const bg = new Graphics();
    bg.roundRect(0, 0, buttonSize + 60, buttonSize, 8);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
    this.muteButton.addChild(bg);

    this.muteIcon = new Graphics();
    this.updateMuteIcon();
    this.muteIcon.position.set(8, 8);
    this.muteButton.addChild(this.muteIcon);

    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.SECONDARY
    });
    this.muteLabel = new Text({ text: 'MUTED', style: labelStyle });
    this.muteLabel.position.set(buttonSize + 2, 12);
    this.muteButton.addChild(this.muteLabel);

    this.muteButton.on('pointerdown', () => {
      const audioManager = AudioManager.getInstance();
      audioManager.toggleMute();
      this.updateMuteIcon();
    });

    this.muteButton.on('pointerover', () => {
      bg.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 3 });
    });
    this.muteButton.on('pointerout', () => {
      bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
    });

    this.container.addChild(this.muteButton);
  }

  /**
   * Update the mute icon based on current state
   */
  private updateMuteIcon(): void {
    if (!this.muteIcon || !this.muteLabel) return;

    const audioManager = AudioManager.getInstance();
    const isMuted = audioManager.isMuted();

    this.muteIcon.clear();

    this.muteIcon.rect(0, 8, 8, 10);
    this.muteIcon.fill({ color: isMuted ? 0x888888 : UI_STYLES.COLORS.PRIMARY });

    this.muteIcon.moveTo(8, 8);
    this.muteIcon.lineTo(16, 2);
    this.muteIcon.lineTo(16, 24);
    this.muteIcon.lineTo(8, 18);
    this.muteIcon.closePath();
    this.muteIcon.fill({ color: isMuted ? 0x888888 : UI_STYLES.COLORS.PRIMARY });

    if (isMuted) {
      this.muteIcon.moveTo(18, 6);
      this.muteIcon.lineTo(26, 20);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.DANGER, width: 3 });
      this.muteIcon.moveTo(26, 6);
      this.muteIcon.lineTo(18, 20);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.DANGER, width: 3 });
      this.muteLabel.text = 'MUTED';
      this.muteLabel.style.fill = 0x888888;
    } else {
      this.muteIcon.arc(16, 13, 6, -0.8, 0.8, false);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
      this.muteIcon.arc(16, 13, 10, -0.6, 0.6, false);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
      this.muteLabel.text = 'SOUND';
      this.muteLabel.style.fill = UI_STYLES.COLORS.SECONDARY;
    }
  }

  /**
   * Create stats panel using CombatStatsPanel component
   */
  private createStatsPanel(): void {
    const padding = UI_STYLES.PADDING;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding;

    this.combatStatsPanel = new CombatStatsPanel();
    this.combatStatsPanel.init(this.container);
    this.combatStatsPanel.setPosition(x, y);
  }

  /**
   * Create god mode toggle button using ToggleButton component
   */
  private createGodModeButton(): void {
    if (!this.game) return;

    const padding = UI_STYLES.PADDING;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding;

    const game = this.game;
    this.godModeButton = new ToggleButton({
      label: 'GOD MODE',
      enabledColor: UI_STYLES.COLORS.HEALTH,
      onClick: () => game.toggleGodMode(),
      isEnabled: () => game.isGodModeEnabled()
    });
    this.godModeButton.init(this.container);
    this.godModeButton.setPosition(x, y);
  }

  /**
   * Create slow mode toggle button using ToggleButton component
   */
  private createSlowModeButton(): void {
    if (!this.game) return;

    const padding = UI_STYLES.PADDING;
    const toggleBtnHeight = ToggleButton.getDimensions().height;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding + toggleBtnHeight + padding;

    const game = this.game;
    this.slowModeButton = new ToggleButton({
      label: 'SLOW MODE',
      enabledColor: UI_STYLES.COLORS.SECONDARY,
      onClick: () => game.toggleSlowMode(),
      isEnabled: () => game.isSlowModeEnabled()
    });
    this.slowModeButton.init(this.container);
    this.slowModeButton.setPosition(x, y);
  }

  /**
   * Update all HUD elements with new data
   * @param data - HUD data to display
   */
  update(data: HUDData): void {
    if (!this.visible) return;

    // Update wave panel
    if (this.wavePanel) {
      this.wavePanel.update({
        waveNumber: data.waveNumber,
        waveState: data.waveState,
        enemyCount: data.activeEnemies
      });
    }

    // Update resources
    if (this.resourcePanel) {
      this.resourcePanel.update({ resources: data.resources });
    }

    // Update score panel
    if (this.scorePanel) {
      this.scorePanel.update({
        timeSurvived: data.timeSurvived,
        enemiesDefeated: data.enemiesDefeated
      });
    }

    // Update Kobayashi Maru status bars
    if (this.statusPanel) {
      this.statusPanel.update({
        health: data.kobayashiMaruHealth,
        maxHealth: data.kobayashiMaruMaxHealth,
        shield: data.kobayashiMaruShield,
        maxShield: data.kobayashiMaruMaxShield
      });
    }

    // Update turret count
    if (this.turretCountPanel) {
      this.turretCountPanel.update({ turretCount: data.turretCount });
    }
    if (this.turretMenu) {
      this.turretMenu.update(data.resources);
    }

    // Update combat stats
    if (this.combatStatsPanel) {
      this.combatStatsPanel.update({
        dps: data.dps,
        accuracy: data.accuracy,
        totalDamageDealt: data.totalDamageDealt
      });
    }

    // Update message log fade effect
    if (this.messageLog) {
      this.messageLog.update();
    }
  }

  /**
   * Show the HUD
   */
  show(): void {
    this.visible = true;
    this.container.visible = true;
  }

  /**
   * Hide the HUD
   */
  hide(): void {
    this.visible = false;
    this.container.visible = false;
  }

  /**
   * Check if HUD is currently visible
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Clean up all resources
   */
  destroy(): void {
    // Clean up panel components
    if (this.wavePanel) this.wavePanel.destroy();
    if (this.resourcePanel) this.resourcePanel.destroy();
    if (this.statusPanel) this.statusPanel.destroy();
    if (this.scorePanel) this.scorePanel.destroy();
    if (this.turretCountPanel) this.turretCountPanel.destroy();
    if (this.combatStatsPanel) this.combatStatsPanel.destroy();
    if (this.mobileControls) this.mobileControls.destroy();
    if (this.messageLog) this.messageLog.destroy();
    if (this.turretUpgradePanel) this.turretUpgradePanel.destroy();
    if (this.godModeButton) this.godModeButton.destroy();
    if (this.slowModeButton) this.slowModeButton.destroy();

    // Remove resize listener
    if (this.boundResizeHandler) {
      window.removeEventListener('resize', this.boundResizeHandler);
    }

    // Destroy container
    this.container.destroy({ children: true });
  }

  /**
   * Get the turret menu instance
   */
  getTurretMenu(): TurretMenu | null {
    return this.turretMenu;
  }

  /**
   * Get the turret upgrade panel instance
   */
  getTurretUpgradePanel(): TurretUpgradePanel | null {
    return this.turretUpgradePanel;
  }

  /**
   * Add a message to the message log
   * @param text - Message text to display
   * @param category - Optional message category
   */
  addLogMessage(text: string, category?: 'info' | 'warning' | 'damage' | 'kill' | 'wave'): void {
    if (this.messageLog) {
      this.messageLog.addMessage(text, category);
    }
  }
}
