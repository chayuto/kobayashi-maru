/**
 * HUD Panel Manager for Kobayashi Maru
 *
 * Manages the positional panels in the HUD (wave, resource, status, score, turret count).
 * Extracted from HUDManager to improve separation of concerns.
 *
 * @module ui/managers/HUDPanelManager
 */

import { Container } from 'pixi.js';
import { HUDLayoutManager } from '../HUDLayoutManager';
import { WavePanel, ResourcePanel, StatusPanel, ScorePanel, TurretCountPanel, CombatStatsPanel } from '../panels';
import type { HUDData } from '../types';

/**
 * HUDPanelManager handles all the informational panels in the HUD.
 *
 * This includes:
 * - Wave Panel (top-left)
 * - Resource Panel (top-right)
 * - Score Panel (bottom-left)
 * - Status Panel (bottom-center)
 * - Turret Count Panel (bottom-right)
 * - Combat Stats Panel (left side)
 */
export class HUDPanelManager {
    private container: Container;
    private layoutManager: HUDLayoutManager | null = null;
    private initialized: boolean = false;

    // Panels
    private wavePanel: WavePanel | null = null;
    private resourcePanel: ResourcePanel | null = null;
    private statusPanel: StatusPanel | null = null;
    private scorePanel: ScorePanel | null = null;
    private turretCountPanel: TurretCountPanel | null = null;
    private combatStatsPanel: CombatStatsPanel | null = null;

    constructor() {
        this.container = new Container();
    }

    /**
     * Initialize and create all panels.
     * @param parent - Parent container to add panels to
     * @param layoutManager - Layout manager for positioning
     */
    init(parent: Container, layoutManager: HUDLayoutManager): void {
        if (this.initialized) return;
        this.layoutManager = layoutManager;

        // Wave Panel (top-left)
        this.wavePanel = new WavePanel();
        this.wavePanel.init(this.container);

        // Resource Panel (top-right)
        this.resourcePanel = new ResourcePanel();
        this.resourcePanel.init(this.container);

        // Score Panel (bottom-left)
        this.scorePanel = new ScorePanel();
        this.scorePanel.init(this.container);

        // Turret Count Panel (bottom-right)
        this.turretCountPanel = new TurretCountPanel();
        this.turretCountPanel.init(this.container);

        // Status Panel (bottom-center)
        this.statusPanel = new StatusPanel();
        this.statusPanel.init(this.container);

        // Combat Stats Panel (left side)
        this.combatStatsPanel = new CombatStatsPanel();
        this.combatStatsPanel.init(this.container);

        parent.addChild(this.container);
        this.initialized = true;

        // Apply initial layout
        this.updateLayout(1.0);
    }

    /**
     * Update panel positions based on scale.
     */
    updateLayout(scale: number): void {
        if (!this.layoutManager) return;

        const layout = this.layoutManager;

        if (this.wavePanel) {
            this.wavePanel.setScale(scale);
            const pos = layout.getWavePanelPosition(scale);
            this.wavePanel.setPosition(pos.x, pos.y);
        }

        if (this.resourcePanel) {
            this.resourcePanel.setScale(scale);
            const pos = layout.getResourcePanelPosition(scale, 150);
            this.resourcePanel.setPosition(pos.x, pos.y);
        }

        if (this.scorePanel) {
            this.scorePanel.setScale(scale);
            const pos = layout.getScorePanelPosition(scale, 80);
            this.scorePanel.setPosition(pos.x, pos.y);
        }

        if (this.turretCountPanel) {
            this.turretCountPanel.setScale(scale);
            const pos = layout.getTurretCountPanelPosition(scale, 140, 60);
            this.turretCountPanel.setPosition(pos.x, pos.y);
        }

        if (this.statusPanel) {
            this.statusPanel.setScale(scale);
            const pos = layout.getStatusPanelPosition(scale, 280, 120);
            this.statusPanel.setPosition(pos.x, pos.y);
        }

        if (this.combatStatsPanel) {
            this.combatStatsPanel.setScale(scale);
            const pos = layout.getCombatStatsPosition(scale);
            this.combatStatsPanel.setPosition(pos.x, pos.y);
        }
    }

    /**
     * Update panels with new data.
     */
    update(data: HUDData): void {
        if (this.wavePanel) {
            this.wavePanel.update({
                waveNumber: data.waveNumber,
                waveState: data.waveState,
                enemyCount: data.activeEnemies
            });
        }

        if (this.resourcePanel) {
            this.resourcePanel.update({ resources: data.resources });
        }

        if (this.scorePanel) {
            this.scorePanel.update({
                timeSurvived: data.timeSurvived,
                enemiesDefeated: data.enemiesDefeated
            });
        }

        if (this.statusPanel) {
            this.statusPanel.update({
                health: data.kobayashiMaruHealth,
                maxHealth: data.kobayashiMaruMaxHealth,
                shield: data.kobayashiMaruShield,
                maxShield: data.kobayashiMaruMaxShield
            });
        }

        if (this.turretCountPanel) {
            this.turretCountPanel.update({ turretCount: data.turretCount });
        }

        if (this.combatStatsPanel) {
            this.combatStatsPanel.update({
                dps: data.dps,
                accuracy: data.accuracy,
                totalDamageDealt: data.totalDamageDealt
            });
        }
    }

    /**
     * Clean up all resources.
     */
    destroy(): void {
        this.wavePanel?.destroy();
        this.resourcePanel?.destroy();
        this.statusPanel?.destroy();
        this.scorePanel?.destroy();
        this.turretCountPanel?.destroy();
        this.combatStatsPanel?.destroy();
        this.container.destroy({ children: true });
        this.initialized = false;
    }
}
