/**
 * HUD Manager for Kobayashi Maru
 * Manages all in-game HUD elements including wave info, resources, score, and Kobayashi Maru status
 */
import { Application, Container, Graphics } from 'pixi.js';
import { UI_STYLES } from './styles';
import { HUDData } from './types';

import { GAME_CONFIG } from '../types/constants';
import { TurretMenu } from './TurretMenu';
import { TurretUpgradePanel } from './TurretUpgradePanel';
import { MobileControlsOverlay } from './MobileControlsOverlay';
import { MessageLog } from './MessageLog';
import { AudioManager } from '../audio';
import { ResponsiveUIManager } from './ResponsiveUIManager';
import { WavePanel, ResourcePanel, StatusPanel, CombatStatsPanel, ScorePanel, TurretCountPanel, AIPanel, AIThoughtFeed } from './panels';
import { ToggleButton, IconButton } from './components';
import { AIBrainRenderer } from '../ai/visualization';
import type { AIStatusExtended, ThreatVector, SectorData } from '../ai/types';
import type { AIMessage } from '../ai/humanization/AIMessageGenerator';

// Forward declaration for Game type to avoid circular imports
// Forward declaration for Game type to avoid circular imports
export interface HUDCallbacks {
  onToggleGodMode: () => void;
  onToggleSlowMode: () => void;
  onToggleAI?: () => void;
  onToggleAIBrain?: () => void;
}

/**
 * HUDManager class - manages all HUD display elements
 */
export class HUDManager {
  public container: Container;
  private visible: boolean = true;
  private app: Application | null = null;
  private callbacks: HUDCallbacks | null = null;
  private responsiveUIManager: ResponsiveUIManager | null = null;

  // Local state for cheat modes
  private godModeEnabled: boolean = false;
  private slowModeEnabled: boolean = false;

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

  // AI HUD engagement components
  private aiPanel: AIPanel | null = null;
  private aiThoughtFeed: AIThoughtFeed | null = null;

  // Sound mute button (using IconButton component)
  private muteButton: IconButton | null = null;

  // Toggle buttons
  private godModeButton: ToggleButton | null = null;
  private slowModeButton: ToggleButton | null = null;
  private aiButton: ToggleButton | null = null;
  private aiBrainButton: ToggleButton | null = null;

  // AI Brain visualization
  private aiBrainRenderer: AIBrainRenderer | null = null;
  private aiBrainEnabled: boolean = false;

  // AI state
  private aiEnabled: boolean = false;

  // Bound event handler for cleanup
  private boundResizeHandler: (() => void) | null = null;

  constructor() {
    this.container = new Container();
  }

  /**
   * Initialize the HUD with PixiJS Application
   * @param app - PixiJS Application instance
   * @param callbacks - Optional callbacks for HUD actions
   */
  init(app: Application, callbacks?: HUDCallbacks): void {
    this.app = app;
    this.callbacks = callbacks ?? null;
    this.responsiveUIManager = new ResponsiveUIManager();

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
    this.createAIButton();
    this.createAIBrainButton();
    this.createAIPanel();

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
      this.muteButton.setScale(scale);
      this.muteButton.setPosition(padding, padding + (100 * scale) + padding);
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

    // Update AI Button
    if (this.aiButton) {
      this.aiButton.setScale(scale);
      this.aiButton.setPosition(padding, padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding + (toggleBtnHeight * scale) * 2 + padding * 2);
    }

    // Update AI Brain Button (position below AI Button)
    if (this.aiBrainButton) {
      this.aiBrainButton.setScale(scale);
      this.aiBrainButton.setPosition(padding, padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding + (toggleBtnHeight * scale) * 3 + padding * 3);
    }

    // Update AI Panel (left side, below toggle buttons)
    if (this.aiPanel) {
      const toggleBtnHeight = ToggleButton.getDimensions().height;
      this.aiPanel.setScale(scale);
      // Position below the AI Brain toggle button (which is the 4th toggle button)
      const aiPanelY = padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding + (toggleBtnHeight * scale) * 4 + padding * 4 + padding;
      this.aiPanel.setPosition(padding, aiPanelY);
    }

    // Update AI Thought Feed (left side, below AI Panel)
    if (this.aiThoughtFeed) {
      const { height: aiPanelHeight } = AIPanel.getDimensions();
      const toggleBtnHeight = ToggleButton.getDimensions().height;
      this.aiThoughtFeed.setScale(scale);
      // Position below AI Panel (account for 4th toggle button)
      const aiPanelY = padding + (100 * scale) + padding + (40 * scale) + padding + (90 * scale) + padding + (toggleBtnHeight * scale) * 4 + padding * 4 + padding;
      const feedY = aiPanelY + (aiPanelHeight * scale) + padding;
      this.aiThoughtFeed.setPosition(padding, feedY);
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
   * Uses IconButton component for consistent hover highlight behavior
   */
  private createMuteButton(): void {
    const padding = UI_STYLES.PADDING;
    const x = padding;
    const y = padding + 100 + padding;

    // Icon drawing function that handles speaker + X or sound waves
    const drawSpeakerIcon = (g: Graphics, active: boolean, colors: typeof UI_STYLES.COLORS) => {
      const iconColor = active ? colors.PRIMARY : 0x888888;

      // Speaker body (rectangle part)
      g.rect(0, 6, 6, 8);
      g.fill({ color: iconColor });

      // Speaker cone (triangle part)
      g.moveTo(6, 6);
      g.lineTo(12, 1);
      g.lineTo(12, 19);
      g.lineTo(6, 14);
      g.closePath();
      g.fill({ color: iconColor });

      if (active) {
        // Sound waves when active (not muted)
        g.arc(12, 10, 4, -0.7, 0.7, false);
        g.stroke({ color: iconColor, width: 2 });
        g.arc(12, 10, 7, -0.5, 0.5, false);
        g.stroke({ color: iconColor, width: 2 });
      } else {
        // X mark when muted
        g.moveTo(14, 4);
        g.lineTo(20, 16);
        g.stroke({ color: colors.DANGER, width: 2 });
        g.moveTo(20, 4);
        g.lineTo(14, 16);
        g.stroke({ color: colors.DANGER, width: 2 });
      }
    };

    this.muteButton = new IconButton({
      label: 'SOUND',
      activeColor: UI_STYLES.COLORS.PRIMARY,
      inactiveColor: 0x888888,
      onClick: () => {
        const audioManager = AudioManager.getInstance();
        audioManager.toggleMute();
        // Update the label based on new state
        const isMuted = audioManager.isMuted();
        this.muteButton?.setLabel(isMuted ? 'MUTED' : 'SOUND');
        this.muteButton?.updateVisualState();
      },
      isActive: () => {
        const audioManager = AudioManager.getInstance();
        return !audioManager.isMuted();
      },
      drawIcon: drawSpeakerIcon
    });

    this.muteButton.init(this.container);
    this.muteButton.setPosition(x, y);

    // Set initial label based on current mute state
    const audioManager = AudioManager.getInstance();
    const isMuted = audioManager.isMuted();
    this.muteButton.setLabel(isMuted ? 'MUTED' : 'SOUND');
    this.muteButton.updateVisualState();
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
    const padding = UI_STYLES.PADDING;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding;

    this.godModeButton = new ToggleButton({
      label: 'GOD MODE',
      enabledColor: UI_STYLES.COLORS.HEALTH,
      onClick: () => this.callbacks?.onToggleGodMode(),
      isEnabled: () => this.godModeEnabled
    });
    this.godModeButton.init(this.container);
    this.godModeButton.setPosition(x, y);
  }

  /**
   * Create slow mode toggle button using ToggleButton component
   */
  private createSlowModeButton(): void {
    const padding = UI_STYLES.PADDING;
    const toggleBtnHeight = ToggleButton.getDimensions().height;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding + toggleBtnHeight + padding;

    this.slowModeButton = new ToggleButton({
      label: 'SLOW MODE',
      enabledColor: UI_STYLES.COLORS.SECONDARY,
      onClick: () => this.callbacks?.onToggleSlowMode(),
      isEnabled: () => this.slowModeEnabled
    });
    this.slowModeButton.init(this.container);
    this.slowModeButton.setPosition(x, y);
  }

  /**
   * Create AI auto-play toggle button using ToggleButton component
   */
  private createAIButton(): void {
    const padding = UI_STYLES.PADDING;
    const toggleBtnHeight = ToggleButton.getDimensions().height;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding + toggleBtnHeight * 2 + padding * 2;

    this.aiButton = new ToggleButton({
      label: '🤖 AI AUTO',
      enabledColor: 0x00FF88,
      onClick: () => this.callbacks?.onToggleAI?.(),
      isEnabled: () => this.aiEnabled
    });
    this.aiButton.init(this.container);
    this.aiButton.setPosition(x, y);
  }

  /**
   * Create AI Brain toggle button for visualization overlays
   */
  private createAIBrainButton(): void {
    const padding = UI_STYLES.PADDING;
    const toggleBtnHeight = ToggleButton.getDimensions().height;
    const x = padding;
    const y = padding + 100 + padding + 40 + padding + 90 + padding + toggleBtnHeight * 3 + padding * 3;

    this.aiBrainButton = new ToggleButton({
      label: '👁 SEE AI BRAIN',
      enabledColor: 0x00FFFF, // Cyan for visibility
      onClick: () => {
        this.aiBrainEnabled = !this.aiBrainEnabled;

        // Toggle renderer visibility
        if (this.aiBrainRenderer) {
          this.aiBrainRenderer.setEnabled(this.aiBrainEnabled);
        }

        // Toggle panel expanded mode
        if (this.aiPanel) {
          this.aiPanel.setExpandedMode(this.aiBrainEnabled);
        }

        // Notify callback
        this.callbacks?.onToggleAIBrain?.();

        return this.aiBrainEnabled;
      },
      isEnabled: () => this.aiBrainEnabled
    });
    this.aiBrainButton.init(this.container);
    this.aiBrainButton.setPosition(x, y);
  }

  /**
   * Create AI Panel and Thought Feed for engagement display
   */
  private createAIPanel(): void {
    const padding = UI_STYLES.PADDING;

    // AI Panel - shows commander status, mood, phase
    // Positioned on left side, below the toggle buttons (now 4th slot for AI Brain button)
    const toggleBtnHeight = ToggleButton.getDimensions().height;
    this.aiPanel = new AIPanel();
    this.aiPanel.init();
    const aiPanelDims = AIPanel.getDimensions();
    const aiPanelY = padding + 100 + padding + 40 + padding + 90 + padding + toggleBtnHeight * 4 + padding * 4 + padding;
    this.aiPanel.setPosition(padding, aiPanelY);
    this.aiPanel.hide(); // Hide until AI is enabled
    this.container.addChild(this.aiPanel.getContainer());

    // AI Thought Feed - scrolling message log
    // Positioned below AI Panel on left side
    this.aiThoughtFeed = new AIThoughtFeed();
    this.aiThoughtFeed.init();
    const feedY = aiPanelY + aiPanelDims.height + padding;
    this.aiThoughtFeed.setPosition(padding, feedY);
    this.aiThoughtFeed.hide(); // Hide until AI is enabled
    this.container.addChild(this.aiThoughtFeed.getContainer());

    // Initialize AI Brain Renderer
    this.aiBrainRenderer = new AIBrainRenderer();
  }

  /**
   * Update AI HUD with extended status
   * @param status - Extended AI status from AIAutoPlayManager
   */
  updateAI(status: AIStatusExtended): void {
    if (!this.aiPanel || !this.aiThoughtFeed) return;

    // Show/hide AI panels based on enabled state
    if (status.enabled) {
      this.aiPanel.show();
      this.aiThoughtFeed.show();
      this.aiPanel.update(status);
      this.aiThoughtFeed.update();
    } else {
      this.aiPanel.hide();
      this.aiThoughtFeed.hide();
    }
  }

  /**
   * Update AI Brain visualization with current data
   * @param status - Extended AI status
   * @param threats - Current threat vectors
   * @param sectors - Coverage sector data
   */
  updateAIBrain(status: AIStatusExtended, threats: ThreatVector[], sectors: SectorData[]): void {
    if (!this.aiBrainRenderer || !this.aiBrainEnabled) return;

    this.aiBrainRenderer.setThreats(threats);
    this.aiBrainRenderer.setSectors(sectors);
    this.aiBrainRenderer.render(status);
  }

  /**
   * Get the AI Brain renderer container for adding to game stage
   */
  getAIBrainRenderer(): AIBrainRenderer | null {
    return this.aiBrainRenderer;
  }

  /**
   * Check if AI Brain visualization is enabled
   */
  isAIBrainEnabled(): boolean {
    return this.aiBrainEnabled;
  }

  /**
   * Add an AI message to the thought feed
   * @param message - Message to display
   */
  addAIMessage(message: AIMessage): void {
    if (this.aiThoughtFeed) {
      this.aiThoughtFeed.addMessage(message);
    }
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

    // Update cheat mode states
    if (data.godModeEnabled !== undefined) {
      this.godModeEnabled = data.godModeEnabled;
    }
    if (data.slowModeEnabled !== undefined) {
      this.slowModeEnabled = data.slowModeEnabled;
    }

    // Update AI enabled state
    if (data.aiEnabled !== undefined) {
      this.aiEnabled = data.aiEnabled;
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
    if (this.aiButton) this.aiButton.destroy();
    if (this.aiBrainButton) this.aiBrainButton.destroy();
    if (this.aiPanel) this.aiPanel.destroy();
    if (this.aiThoughtFeed) this.aiThoughtFeed.destroy();
    if (this.aiBrainRenderer) this.aiBrainRenderer.destroy();

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
