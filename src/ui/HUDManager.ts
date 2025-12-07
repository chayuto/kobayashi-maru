/**
 * HUD Manager for Kobayashi Maru
 * Manages all in-game HUD elements including wave info, resources, score, and Kobayashi Maru status
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { HUDData } from './types';
import { HealthBar } from './HealthBar';
import { GAME_CONFIG } from '../types/constants';
import { TurretMenu } from './TurretMenu';
import { TurretUpgradePanel } from './TurretUpgradePanel';
import { MobileControlsOverlay } from './MobileControlsOverlay';
import { MessageLog } from './MessageLog';
import { AudioManager } from '../audio';
import { ResponsiveUIManager } from './ResponsiveUIManager';
import { UI_CONFIG } from '../config';

// Forward declaration for Game type to avoid circular imports
interface GameInterface {
  toggleGodMode(): boolean;
  toggleSlowMode(): boolean;
  isGodModeEnabled(): boolean;
  isSlowModeEnabled(): boolean;
}

// Wave state color mapping - defined outside class to avoid object creation on each update
const WAVE_STATE_COLORS: Record<string, number> = {
  'idle': UI_STYLES.COLORS.SECONDARY,
  'spawning': UI_STYLES.COLORS.DANGER,
  'active': UI_STYLES.COLORS.PRIMARY,
  'complete': UI_STYLES.COLORS.HEALTH
};

// Toggle button dimensions (from centralized config)
const TOGGLE_BUTTON_WIDTH = UI_CONFIG.BUTTONS.TOGGLE_WIDTH;
const TOGGLE_BUTTON_HEIGHT = UI_CONFIG.BUTTONS.TOGGLE_HEIGHT;

/**
 * HUDManager class - manages all HUD display elements
 */
export class HUDManager {
  public container: Container;
  private visible: boolean = true;
  private app: Application | null = null;
  private game: GameInterface | null = null;
  private responsiveUIManager: ResponsiveUIManager | null = null;

  // UI Elements
  private waveText: Text | null = null;
  private waveStateText: Text | null = null;
  private enemyCountText: Text | null = null;
  private resourcesText: Text | null = null;
  private timeText: Text | null = null;
  private killsText: Text | null = null;
  private turretCountText: Text | null = null;
  private healthBar: HealthBar | null = null;
  private shieldBar: HealthBar | null = null;
  private statusLabel: Text | null = null;
  private turretMenu: TurretMenu | null = null;
  private turretUpgradePanel: TurretUpgradePanel | null = null;
  private mobileControls: MobileControlsOverlay | null = null;
  private messageLog: MessageLog | null = null;

  // Sound mute button
  private muteButton: Container | null = null;
  private muteIcon: Graphics | null = null;
  private muteLabel: Text | null = null;

  // God mode button
  private godModeButton: Container | null = null;
  private godModeLabel: Text | null = null;

  // Slow mode button
  private slowModeButton: Container | null = null;
  private slowModeLabel: Text | null = null;

  // Extended stats
  private statsPanel: Graphics | null = null;
  private dpsText: Text | null = null;
  private accuracyText: Text | null = null;
  private damageText: Text | null = null;

  // Background panels
  private topLeftPanel: Graphics | null = null;
  private topRightPanel: Graphics | null = null;
  private bottomLeftPanel: Graphics | null = null;
  private bottomCenterPanel: Graphics | null = null;
  private bottomRightPanel: Graphics | null = null;

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
    // Position below the top right panel (resources)
    // Top right panel height is 60, padding is 16. 
    // Let's give it some extra space.
    const menuX = GAME_CONFIG.WORLD_WIDTH - 180 - UI_STYLES.PADDING;
    const menuY = UI_STYLES.PADDING + 60 + UI_STYLES.PADDING;
    this.turretMenu.setPosition(menuX, menuY);
    this.container.addChild(this.turretMenu.container);

    // Create Turret Upgrade Panel (hidden by default)
    this.turretUpgradePanel = new TurretUpgradePanel();
    // Position it to the left of the turret menu
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
    // Use game world dimensions instead of window dimensions for HUD positioning
    const width = GAME_CONFIG.WORLD_WIDTH;
    const height = GAME_CONFIG.WORLD_HEIGHT;

    // Scale container based on device type if needed, or just scale elements
    // For now, let's just reposition panels based on new width/height

    // Update Top Left Panel
    if (this.topLeftPanel) {
      this.topLeftPanel.position.set(padding, padding);
      this.topLeftPanel.scale.set(scale);
    }

    // Update Top Right Panel
    if (this.topRightPanel) {
      // 180 is original width
      this.topRightPanel.scale.set(scale);
      this.topRightPanel.position.set(width - (180 * scale) - padding, padding);
    }

    // Update Bottom Left Panel
    if (this.bottomLeftPanel) {
      this.bottomLeftPanel.scale.set(scale);
      this.bottomLeftPanel.position.set(padding, height - (80 * scale) - padding);
    }

    // Update Bottom Right Panel
    if (this.bottomRightPanel) {
      this.bottomRightPanel.scale.set(scale);
      this.bottomRightPanel.position.set(width - (140 * scale) - padding, height - (60 * scale) - padding);
    }

    // Update Bottom Center Panel
    if (this.bottomCenterPanel) {
      const panelWidth = UI_STYLES.BAR_WIDTH + 40;
      this.bottomCenterPanel.scale.set(scale);
      this.bottomCenterPanel.position.set((width - (panelWidth * scale)) / 2, height - (90 * scale) - padding);
    }

    // Update Mute Button
    if (this.muteButton) {
      this.muteButton.scale.set(scale);
      this.muteButton.position.set(padding, padding + (100 * scale) + padding);
    }

    // Update Stats Panel
    if (this.statsPanel) {
      this.statsPanel.scale.set(scale);
      this.statsPanel.position.set(padding, padding + (100 * scale) + padding + (40 * scale) + padding);
    }

    // Update Turret Menu
    if (this.turretMenu) {
      // Turret menu handles its own scaling/positioning internally usually, but we need to position its container
      // It was positioned at: width - 180 - padding, padding + 60 + padding
      this.turretMenu.container.scale.set(scale);
      this.turretMenu.container.position.set(
        width - (180 * scale) - padding,
        padding + (60 * scale) + padding
      );
    }

    // Update Turret Upgrade Panel
    if (this.turretUpgradePanel) {
      this.turretUpgradePanel.container.scale.set(scale);
      const menuX = width - (180 * scale) - padding;
      const menuY = padding + (60 * scale) + padding;
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
      this.godModeButton.scale.set(scale);
      // Position below stats panel
      this.godModeButton.position.set(padding, padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding);
    }

    // Update Slow Mode Button
    if (this.slowModeButton) {
      this.slowModeButton.scale.set(scale);
      // Position below god mode button
      this.slowModeButton.position.set(padding, padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding + (TOGGLE_BUTTON_HEIGHT * scale) + padding);
    }
  }

  /**
   * Create top-left panel: Wave info
   */
  private createTopLeftPanel(): void {
    const padding = UI_STYLES.PADDING;

    // Panel background
    this.topLeftPanel = new Graphics();
    this.topLeftPanel.roundRect(0, 0, 200, 100, 8);
    this.topLeftPanel.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.topLeftPanel.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
    this.topLeftPanel.position.set(padding, padding);
    this.container.addChild(this.topLeftPanel);

    // Wave number text
    const waveStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.waveText = new Text({ text: 'WAVE 1', style: waveStyle });
    this.waveText.position.set(10, 10);
    this.topLeftPanel.addChild(this.waveText);

    // Wave state text
    const stateStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.SECONDARY
    });
    this.waveStateText = new Text({ text: 'IDLE', style: stateStyle });
    this.waveStateText.position.set(10, 40);
    this.topLeftPanel.addChild(this.waveStateText);

    // Enemy count text
    const enemyStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.TEXT
    });
    this.enemyCountText = new Text({ text: 'Enemies: 0', style: enemyStyle });
    this.enemyCountText.position.set(10, 70);
    this.topLeftPanel.addChild(this.enemyCountText);
  }

  /**
   * Create top-right panel: Resources display
   */
  private createTopRightPanel(): void {
    const padding = UI_STYLES.PADDING;
    const panelWidth = 180;
    const x = GAME_CONFIG.WORLD_WIDTH - panelWidth - padding;

    // Panel background
    this.topRightPanel = new Graphics();
    this.topRightPanel.roundRect(0, 0, panelWidth, 60, 8);
    this.topRightPanel.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.topRightPanel.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
    this.topRightPanel.position.set(x, padding);
    this.container.addChild(this.topRightPanel);

    // Resource label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.PRIMARY
    });
    const resourceLabel = new Text({ text: 'MATTER', style: labelStyle });
    resourceLabel.position.set(10, 8);
    this.topRightPanel.addChild(resourceLabel);

    // Resources amount
    const resourceStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.resourcesText = new Text({ text: '500', style: resourceStyle });
    this.resourcesText.position.set(10, 28);
    this.topRightPanel.addChild(this.resourcesText);
  }

  /**
   * Create bottom-left panel: Score info
   */
  private createBottomLeftPanel(): void {
    const padding = UI_STYLES.PADDING;
    const y = GAME_CONFIG.WORLD_HEIGHT - 80 - padding;

    // Panel background
    this.bottomLeftPanel = new Graphics();
    this.bottomLeftPanel.roundRect(0, 0, 180, 80, 8);
    this.bottomLeftPanel.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.bottomLeftPanel.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
    this.bottomLeftPanel.position.set(padding, y);
    this.container.addChild(this.bottomLeftPanel);

    // Time survived
    const timeStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.TEXT
    });
    this.timeText = new Text({ text: 'TIME: 00:00', style: timeStyle });
    this.timeText.position.set(10, 15);
    this.bottomLeftPanel.addChild(this.timeText);

    // Enemies defeated
    const killsStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.TEXT
    });
    this.killsText = new Text({ text: 'KILLS: 0', style: killsStyle });
    this.killsText.position.set(10, 45);
    this.bottomLeftPanel.addChild(this.killsText);
  }

  /**
   * Create bottom-center panel: Kobayashi Maru status
   */
  private createBottomCenterPanel(): void {
    const panelWidth = UI_STYLES.BAR_WIDTH + 40;
    const panelHeight = 90;
    const x = (GAME_CONFIG.WORLD_WIDTH - panelWidth) / 2;
    const y = GAME_CONFIG.WORLD_HEIGHT - panelHeight - UI_STYLES.PADDING;

    // Panel background
    this.bottomCenterPanel = new Graphics();
    this.bottomCenterPanel.roundRect(0, 0, panelWidth, panelHeight, 8);
    this.bottomCenterPanel.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.bottomCenterPanel.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
    this.bottomCenterPanel.position.set(x, y);
    this.container.addChild(this.bottomCenterPanel);

    // Status label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.statusLabel = new Text({ text: 'KOBAYASHI MARU STATUS', style: labelStyle });
    this.statusLabel.position.set(20, 8);
    this.bottomCenterPanel.addChild(this.statusLabel);

    // Shield bar
    this.shieldBar = new HealthBar(
      UI_STYLES.BAR_WIDTH,
      UI_STYLES.BAR_HEIGHT,
      UI_STYLES.COLORS.SHIELD,
      'SHLD'
    );
    this.shieldBar.setPosition(20, 30);
    this.bottomCenterPanel.addChild(this.shieldBar.container);

    // Health bar
    this.healthBar = new HealthBar(
      UI_STYLES.BAR_WIDTH,
      UI_STYLES.BAR_HEIGHT,
      UI_STYLES.COLORS.HEALTH,
      'HULL'
    );
    this.healthBar.setPosition(20, 58);
    this.bottomCenterPanel.addChild(this.healthBar.container);
  }

  /**
   * Create bottom-right panel: Turret count
   */
  private createBottomRightPanel(): void {
    const padding = UI_STYLES.PADDING;
    const panelWidth = 140;
    const x = GAME_CONFIG.WORLD_WIDTH - panelWidth - padding;
    const y = GAME_CONFIG.WORLD_HEIGHT - 60 - padding;

    // Panel background
    this.bottomRightPanel = new Graphics();
    this.bottomRightPanel.roundRect(0, 0, panelWidth, 60, 8);
    this.bottomRightPanel.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.bottomRightPanel.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
    this.bottomRightPanel.position.set(x, y);
    this.container.addChild(this.bottomRightPanel);

    // Turret label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.PRIMARY
    });
    const turretLabel = new Text({ text: 'TURRETS', style: labelStyle });
    turretLabel.position.set(10, 8);
    this.bottomRightPanel.addChild(turretLabel);

    // Turret count
    const countStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.turretCountText = new Text({ text: '0', style: countStyle });
    this.turretCountText.position.set(10, 28);
    this.bottomRightPanel.addChild(this.turretCountText);
  }

  /**
   * Create sound mute button in the top-left corner below the wave panel
   */
  private createMuteButton(): void {
    const padding = UI_STYLES.PADDING;
    const buttonSize = 40;
    const x = padding;
    const y = padding + 100 + padding; // Below wave panel

    // Create button container
    this.muteButton = new Container();
    this.muteButton.position.set(x, y);
    this.muteButton.eventMode = 'static';
    this.muteButton.cursor = 'pointer';

    // Button background
    const bg = new Graphics();
    bg.roundRect(0, 0, buttonSize + 60, buttonSize, 8);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    bg.stroke({ color: UI_STYLES.COLORS.SECONDARY, width: 2 });
    this.muteButton.addChild(bg);

    // Speaker icon (drawn programmatically)
    this.muteIcon = new Graphics();
    this.updateMuteIcon();
    this.muteIcon.position.set(8, 8);
    this.muteButton.addChild(this.muteIcon);

    // Label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.SECONDARY
    });
    this.muteLabel = new Text({ text: 'MUTED', style: labelStyle });
    this.muteLabel.position.set(buttonSize + 2, 12);
    this.muteButton.addChild(this.muteLabel);

    // Click handler
    this.muteButton.on('pointerdown', () => {
      const audioManager = AudioManager.getInstance();
      audioManager.toggleMute();
      this.updateMuteIcon();
    });

    // Hover effects
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

    // Draw speaker body
    this.muteIcon.rect(0, 8, 8, 10);
    this.muteIcon.fill({ color: isMuted ? 0x888888 : UI_STYLES.COLORS.PRIMARY });

    // Draw speaker cone
    this.muteIcon.moveTo(8, 8);
    this.muteIcon.lineTo(16, 2);
    this.muteIcon.lineTo(16, 24);
    this.muteIcon.lineTo(8, 18);
    this.muteIcon.closePath();
    this.muteIcon.fill({ color: isMuted ? 0x888888 : UI_STYLES.COLORS.PRIMARY });

    if (isMuted) {
      // Draw X over speaker
      this.muteIcon.moveTo(18, 6);
      this.muteIcon.lineTo(26, 20);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.DANGER, width: 3 });
      this.muteIcon.moveTo(26, 6);
      this.muteIcon.lineTo(18, 20);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.DANGER, width: 3 });
      this.muteLabel.text = 'MUTED';
      this.muteLabel.style.fill = 0x888888;
    } else {
      // Draw sound waves
      this.muteIcon.arc(16, 13, 6, -0.8, 0.8, false);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
      this.muteIcon.arc(16, 13, 10, -0.6, 0.6, false);
      this.muteIcon.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
      this.muteLabel.text = 'SOUND';
      this.muteLabel.style.fill = UI_STYLES.COLORS.SECONDARY;
    }
  }

  /**
   * Create stats panel with extended game statistics
   */
  private createStatsPanel(): void {
    const padding = UI_STYLES.PADDING;
    const panelWidth = 160;
    const panelHeight = 90;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding; // Below mute button

    // Panel background
    this.statsPanel = new Graphics();
    this.statsPanel.roundRect(0, 0, panelWidth, panelHeight, 8);
    this.statsPanel.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    this.statsPanel.stroke({ color: UI_STYLES.COLORS.PRIMARY, width: 2 });
    this.statsPanel.position.set(x, y);
    this.container.addChild(this.statsPanel);

    // Stats header
    const headerStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    const header = new Text({ text: 'COMBAT STATS', style: headerStyle });
    header.position.set(10, 8);
    this.statsPanel.addChild(header);

    // Stats text style
    const statStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.TEXT
    });

    // DPS text
    this.dpsText = new Text({ text: 'DPS: 0', style: statStyle });
    this.dpsText.position.set(10, 30);
    this.statsPanel.addChild(this.dpsText);

    // Accuracy text
    this.accuracyText = new Text({ text: 'ACC: 0%', style: statStyle });
    this.accuracyText.position.set(10, 50);
    this.statsPanel.addChild(this.accuracyText);

    // Total damage text
    this.damageText = new Text({ text: 'DMG: 0', style: statStyle });
    this.damageText.position.set(10, 70);
    this.statsPanel.addChild(this.damageText);
  }

  /**
   * Create god mode toggle button
   */
  private createGodModeButton(): void {
    const padding = UI_STYLES.PADDING;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding; // Below stats panel

    // Create button container
    this.godModeButton = new Container();
    this.godModeButton.position.set(x, y);
    this.godModeButton.eventMode = 'static';
    this.godModeButton.cursor = 'pointer';

    // Button background
    const bg = new Graphics();
    bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    bg.stroke({ color: 0x888888, width: 2 });
    this.godModeButton.addChild(bg);

    // Label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: 0x888888
    });
    this.godModeLabel = new Text({ text: 'GOD MODE', style: labelStyle });
    this.godModeLabel.position.set(10, 8);
    this.godModeButton.addChild(this.godModeLabel);

    // Click handler
    this.godModeButton.on('pointerdown', () => {
      if (this.game) {
        const enabled = this.game.toggleGodMode();
        this.updateGodModeButton(enabled);
      }
    });

    // Hover effects
    this.godModeButton.on('pointerover', () => {
      const isEnabled = this.game?.isGodModeEnabled() ?? false;
      bg.clear();
      bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
      bg.stroke({ color: isEnabled ? UI_STYLES.COLORS.HEALTH : UI_STYLES.COLORS.PRIMARY, width: 3 });
    });
    this.godModeButton.on('pointerout', () => {
      const isEnabled = this.game?.isGodModeEnabled() ?? false;
      bg.clear();
      bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
      bg.stroke({ color: isEnabled ? UI_STYLES.COLORS.HEALTH : 0x888888, width: 2 });
    });

    this.container.addChild(this.godModeButton);
  }

  /**
   * Update god mode button visual state
   */
  private updateGodModeButton(enabled: boolean): void {
    if (!this.godModeButton || !this.godModeLabel) return;

    // Update label color
    this.godModeLabel.style.fill = enabled ? UI_STYLES.COLORS.HEALTH : 0x888888;

    // Update background border color
    const bg = this.godModeButton.children[0] as Graphics;
    if (bg) {
      bg.clear();
      bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
      bg.stroke({ color: enabled ? UI_STYLES.COLORS.HEALTH : 0x888888, width: 2 });
    }
  }

  /**
   * Create slow mode toggle button
   */
  private createSlowModeButton(): void {
    const padding = UI_STYLES.PADDING;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding + TOGGLE_BUTTON_HEIGHT + padding; // Below god mode button

    // Create button container
    this.slowModeButton = new Container();
    this.slowModeButton.position.set(x, y);
    this.slowModeButton.eventMode = 'static';
    this.slowModeButton.cursor = 'pointer';

    // Button background
    const bg = new Graphics();
    bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
    bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
    bg.stroke({ color: 0x888888, width: 2 });
    this.slowModeButton.addChild(bg);

    // Label
    const labelStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: 0x888888
    });
    this.slowModeLabel = new Text({ text: 'SLOW MODE', style: labelStyle });
    this.slowModeLabel.position.set(8, 8);
    this.slowModeButton.addChild(this.slowModeLabel);

    // Click handler
    this.slowModeButton.on('pointerdown', () => {
      if (this.game) {
        const enabled = this.game.toggleSlowMode();
        this.updateSlowModeButton(enabled);
      }
    });

    // Hover effects
    this.slowModeButton.on('pointerover', () => {
      const isEnabled = this.game?.isSlowModeEnabled() ?? false;
      bg.clear();
      bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.9 });
      bg.stroke({ color: isEnabled ? UI_STYLES.COLORS.SECONDARY : UI_STYLES.COLORS.PRIMARY, width: 3 });
    });
    this.slowModeButton.on('pointerout', () => {
      const isEnabled = this.game?.isSlowModeEnabled() ?? false;
      bg.clear();
      bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
      bg.stroke({ color: isEnabled ? UI_STYLES.COLORS.SECONDARY : 0x888888, width: 2 });
    });

    this.container.addChild(this.slowModeButton);
  }

  /**
   * Update slow mode button visual state
   */
  private updateSlowModeButton(enabled: boolean): void {
    if (!this.slowModeButton || !this.slowModeLabel) return;

    // Update label color
    this.slowModeLabel.style.fill = enabled ? UI_STYLES.COLORS.SECONDARY : 0x888888;

    // Update background border color
    const bg = this.slowModeButton.children[0] as Graphics;
    if (bg) {
      bg.clear();
      bg.roundRect(0, 0, TOGGLE_BUTTON_WIDTH, TOGGLE_BUTTON_HEIGHT, 6);
      bg.fill({ color: UI_STYLES.COLORS.BACKGROUND, alpha: 0.7 });
      bg.stroke({ color: enabled ? UI_STYLES.COLORS.SECONDARY : 0x888888, width: 2 });
    }
  }

  /**
   * Update all HUD elements with new data
   * @param data - HUD data to display
   */
  update(data: HUDData): void {
    if (!this.visible) return;

    // Update wave info
    if (this.waveText) {
      this.waveText.text = `WAVE ${data.waveNumber}`;
    }
    if (this.waveStateText) {
      this.waveStateText.text = data.waveState.toUpperCase();
      // Color-code wave state
      this.waveStateText.style.fill = WAVE_STATE_COLORS[data.waveState] || UI_STYLES.COLORS.SECONDARY;
    }
    if (this.enemyCountText) {
      this.enemyCountText.text = `Enemies: ${data.activeEnemies}`;
    }

    // Update resources
    if (this.resourcesText) {
      this.resourcesText.text = data.resources.toString();
    }

    // Update score info
    if (this.timeText) {
      this.timeText.text = `TIME: ${this.formatTime(data.timeSurvived)}`;
    }
    if (this.killsText) {
      this.killsText.text = `KILLS: ${data.enemiesDefeated}`;
    }

    // Update Kobayashi Maru status bars
    if (this.shieldBar) {
      this.shieldBar.update(data.kobayashiMaruShield, data.kobayashiMaruMaxShield);
    }
    if (this.healthBar) {
      this.healthBar.update(data.kobayashiMaruHealth, data.kobayashiMaruMaxHealth);
      // Change color to danger if health is low
      const healthPercent = data.kobayashiMaruMaxHealth > 0
        ? data.kobayashiMaruHealth / data.kobayashiMaruMaxHealth
        : 0;
      if (healthPercent < 0.25) {
        this.healthBar.setColor(UI_STYLES.COLORS.DANGER);
      } else {
        this.healthBar.setColor(UI_STYLES.COLORS.HEALTH);
      }
    }

    // Update turret count
    if (this.turretCountText) {
      this.turretCountText.text = data.turretCount.toString();
      if (this.turretMenu) {
        this.turretMenu.update(data.resources);
      }
    }

    // Update extended stats
    if (this.dpsText && data.dps !== undefined) {
      this.dpsText.text = `DPS: ${data.dps.toFixed(1)}`;
    }
    if (this.accuracyText && data.accuracy !== undefined) {
      this.accuracyText.text = `ACC: ${(data.accuracy * 100).toFixed(0)}%`;
    }
    if (this.damageText && data.totalDamageDealt !== undefined) {
      this.damageText.text = `DMG: ${this.formatNumber(data.totalDamageDealt)}`;
    }

    // Update message log fade effect
    if (this.messageLog) {
      this.messageLog.update();
    }
  }

  /**
   * Format large numbers with K/M suffixes
   */
  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toFixed(0);
  }

  /**
   * Format time in seconds to MM:SS format
   * @param seconds - Time in seconds
   * @returns Formatted time string
   */
  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    if (this.healthBar) {
      this.healthBar.destroy();
    }
    if (this.shieldBar) {
      this.shieldBar.destroy();
    }
    if (this.mobileControls) {
      this.mobileControls.destroy();
    }
    if (this.messageLog) {
      this.messageLog.destroy();
    }
    if (this.turretUpgradePanel) {
      this.turretUpgradePanel.destroy();
    }

    // Remove event listener
    if (this.boundResizeHandler) {
      window.removeEventListener('resize', this.boundResizeHandler);
      this.boundResizeHandler = null;
    }

    this.container.destroy({ children: true });
    if (this.responsiveUIManager) {
      this.responsiveUIManager.destroy();
    }
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
