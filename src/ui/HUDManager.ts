/**
 * HUD Manager for Kobayashi Maru
 * Manages all in-game HUD elements including wave info, resources, score, and Kobayashi Maru status
 */
import { Application, Container, Graphics, Text, TextStyle } from 'pixi.js';
import { UI_STYLES } from './styles';
import { HUDData } from './types';
import { HealthBar } from './HealthBar';
import { GAME_CONFIG } from '../types/constants';

// Wave state color mapping - defined outside class to avoid object creation on each update
const WAVE_STATE_COLORS: Record<string, number> = {
  'idle': UI_STYLES.COLORS.SECONDARY,
  'spawning': UI_STYLES.COLORS.DANGER,
  'active': UI_STYLES.COLORS.PRIMARY,
  'complete': UI_STYLES.COLORS.HEALTH
};

/**
 * HUDManager class - manages all HUD display elements
 */
export class HUDManager {
  public container: Container;
  private visible: boolean = true;
  private app: Application | null = null;

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

  // Background panels
  private topLeftPanel: Graphics | null = null;
  private topRightPanel: Graphics | null = null;
  private bottomLeftPanel: Graphics | null = null;
  private bottomCenterPanel: Graphics | null = null;
  private bottomRightPanel: Graphics | null = null;

  constructor() {
    this.container = new Container();
  }

  /**
   * Initialize the HUD with PixiJS Application
   * @param app - PixiJS Application instance
   */
  init(app: Application): void {
    this.app = app;
    
    // Add HUD container to stage (on top of everything)
    this.app.stage.addChild(this.container);
    
    // Create all HUD elements
    this.createTopLeftPanel();
    this.createTopRightPanel();
    this.createBottomLeftPanel();
    this.createBottomCenterPanel();
    this.createBottomRightPanel();
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
    this.waveText.position.set(padding + 10, padding + 10);
    this.container.addChild(this.waveText);

    // Wave state text
    const stateStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.SECONDARY
    });
    this.waveStateText = new Text({ text: 'IDLE', style: stateStyle });
    this.waveStateText.position.set(padding + 10, padding + 40);
    this.container.addChild(this.waveStateText);

    // Enemy count text
    const enemyStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_SMALL,
      fill: UI_STYLES.COLORS.TEXT
    });
    this.enemyCountText = new Text({ text: 'Enemies: 0', style: enemyStyle });
    this.enemyCountText.position.set(padding + 10, padding + 70);
    this.container.addChild(this.enemyCountText);
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
      fill: UI_STYLES.COLORS.SECONDARY
    });
    const resourceLabel = new Text({ text: 'MATTER', style: labelStyle });
    resourceLabel.position.set(x + 10, padding + 8);
    this.container.addChild(resourceLabel);

    // Resources amount
    const resourceStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.resourcesText = new Text({ text: '500', style: resourceStyle });
    this.resourcesText.position.set(x + 10, padding + 28);
    this.container.addChild(this.resourcesText);
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
    this.timeText.position.set(padding + 10, y + 15);
    this.container.addChild(this.timeText);

    // Enemies defeated
    const killsStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_MEDIUM,
      fill: UI_STYLES.COLORS.TEXT
    });
    this.killsText = new Text({ text: 'KILLS: 0', style: killsStyle });
    this.killsText.position.set(padding + 10, y + 45);
    this.container.addChild(this.killsText);
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
      fill: UI_STYLES.COLORS.SECONDARY,
      fontWeight: 'bold'
    });
    this.statusLabel = new Text({ text: 'KOBAYASHI MARU STATUS', style: labelStyle });
    this.statusLabel.position.set(x + 20, y + 8);
    this.container.addChild(this.statusLabel);

    // Shield bar
    this.shieldBar = new HealthBar(
      UI_STYLES.BAR_WIDTH,
      UI_STYLES.BAR_HEIGHT,
      UI_STYLES.COLORS.SHIELD,
      'SHLD'
    );
    this.shieldBar.setPosition(x + 20, y + 30);
    this.container.addChild(this.shieldBar.container);

    // Health bar
    this.healthBar = new HealthBar(
      UI_STYLES.BAR_WIDTH,
      UI_STYLES.BAR_HEIGHT,
      UI_STYLES.COLORS.HEALTH,
      'HULL'
    );
    this.healthBar.setPosition(x + 20, y + 58);
    this.container.addChild(this.healthBar.container);
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
      fill: UI_STYLES.COLORS.SECONDARY
    });
    const turretLabel = new Text({ text: 'TURRETS', style: labelStyle });
    turretLabel.position.set(x + 10, y + 8);
    this.container.addChild(turretLabel);

    // Turret count
    const countStyle = new TextStyle({
      fontFamily: UI_STYLES.FONT_FAMILY,
      fontSize: UI_STYLES.FONT_SIZE_LARGE,
      fill: UI_STYLES.COLORS.PRIMARY,
      fontWeight: 'bold'
    });
    this.turretCountText = new Text({ text: '0', style: countStyle });
    this.turretCountText.position.set(x + 10, y + 28);
    this.container.addChild(this.turretCountText);
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
    }
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
    this.container.destroy({ children: true });
  }
}
