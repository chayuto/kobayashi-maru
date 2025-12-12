/**
 * AI Brain Renderer
 *
 * Renders AI decision-making visualizations on the game canvas.
 * Controlled by the "SEE AI BRAIN" toggle in the HUD.
 * This is a user-facing feature that helps players understand AI decisions.
 *
 * @module ai/visualization/AIBrainRenderer
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { GAME_CONFIG } from '../../types/constants';
import { UI_STYLES } from '../../ui/styles';
import type { AIStatusExtended, ThreatVector, SectorData } from '../types';

/**
 * Configuration for the brain renderer
 */
const RENDER_CONFIG = {
    // Heat map settings
    GRID_SIZE: 40, // Size of each grid cell in pixels
    THREAT_ALPHA: 0.3,
    COVERAGE_ALPHA: 0.25,

    // Colors
    THREAT_COLOR: 0xff4444,
    COVERAGE_COLOR: 0x44aaff,
    DECISION_COLOR: 0xffff00,

    // Update throttling (render every N frames)
    UPDATE_INTERVAL: 6, // ~10fps at 60fps game
};

/**
 * Renders AI brain visualizations as overlays on the game
 */
export class AIBrainRenderer {
    private container: Container;
    private enabled: boolean = false;
    private frameCounter: number = 0;

    // Visualization layers
    private threatLayer: Graphics;
    private coverageLayer: Graphics;
    private decisionLayer: Container;
    private decisionText: Text;
    private decisionMarker: Graphics;

    // Cached data for rendering
    private sectors: SectorData[] = [];
    private threats: ThreatVector[] = [];

    constructor() {
        this.container = new Container();
        this.container.zIndex = 1; // Render above game but below HUD
        this.container.visible = false;

        // Create layers
        this.threatLayer = new Graphics();
        this.threatLayer.alpha = RENDER_CONFIG.THREAT_ALPHA;
        this.container.addChild(this.threatLayer);

        this.coverageLayer = new Graphics();
        this.coverageLayer.alpha = RENDER_CONFIG.COVERAGE_ALPHA;
        this.container.addChild(this.coverageLayer);

        this.decisionLayer = new Container();
        this.container.addChild(this.decisionLayer);

        // Decision marker (ring around planned position)
        this.decisionMarker = new Graphics();
        this.decisionLayer.addChild(this.decisionMarker);

        // Decision text
        const textStyle = new TextStyle({
            fontFamily: UI_STYLES.FONT_FAMILY,
            fontSize: 12,
            fill: RENDER_CONFIG.DECISION_COLOR,
            stroke: { color: 0x000000, width: 3 },
        });
        this.decisionText = new Text({ text: '', style: textStyle });
        this.decisionLayer.addChild(this.decisionText);
    }

    /**
     * Get the container to add to the game stage
     */
    getContainer(): Container {
        return this.container;
    }

    /**
     * Enable or disable visualization
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        this.container.visible = enabled;

        if (!enabled) {
            this.clear();
        }
    }

    /**
     * Check if visualization is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Update threat data for visualization
     */
    setThreats(threats: ThreatVector[]): void {
        this.threats = threats;
    }

    /**
     * Update sector data for visualization
     */
    setSectors(sectors: SectorData[]): void {
        this.sectors = sectors;
    }

    /**
     * Main render method - called each frame when enabled
     */
    render(aiStatus: AIStatusExtended): void {
        if (!this.enabled) return;

        // Throttle rendering for performance
        this.frameCounter++;
        if (this.frameCounter < RENDER_CONFIG.UPDATE_INTERVAL) return;
        this.frameCounter = 0;

        // Render all layers
        this.renderThreatHeatMap();
        this.renderCoverageMap();
        this.renderDecisionInfo(aiStatus);
    }

    /**
     * Render threat heat map based on threat data
     */
    private renderThreatHeatMap(): void {
        this.threatLayer.clear();

        if (this.threats.length === 0) return;

        const gridSize = RENDER_CONFIG.GRID_SIZE;
        const cols = Math.ceil(GAME_CONFIG.WORLD_WIDTH / gridSize);
        const rows = Math.ceil(GAME_CONFIG.WORLD_HEIGHT / gridSize);

        // Create a threat intensity grid
        const grid: number[][] = Array(rows).fill(null).map(() => Array(cols).fill(0));

        // Add threat influence to grid
        for (const threat of this.threats) {
            const col = Math.floor(threat.position.x / gridSize);
            const row = Math.floor(threat.position.y / gridSize);

            if (col >= 0 && col < cols && row >= 0 && row < rows) {
                // Add threat with falloff
                const radius = 3; // cells
                for (let dr = -radius; dr <= radius; dr++) {
                    for (let dc = -radius; dc <= radius; dc++) {
                        const r = row + dr;
                        const c = col + dc;
                        if (r >= 0 && r < rows && c >= 0 && c < cols) {
                            const dist = Math.sqrt(dr * dr + dc * dc);
                            const falloff = Math.max(0, 1 - dist / (radius + 1));
                            grid[r][c] += threat.threatLevel * falloff * 0.01;
                        }
                    }
                }
            }
        }

        // Render grid cells
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const intensity = Math.min(1, grid[row][col]);
                if (intensity > 0.1) {
                    const x = col * gridSize;
                    const y = row * gridSize;

                    this.threatLayer.rect(x, y, gridSize, gridSize);
                    this.threatLayer.fill({
                        color: RENDER_CONFIG.THREAT_COLOR,
                        alpha: intensity * 0.6,
                    });
                }
            }
        }
    }

    /**
     * Render coverage map based on sector data
     */
    private renderCoverageMap(): void {
        this.coverageLayer.clear();

        if (this.sectors.length === 0) return;

        // Find max DPS for normalization
        let maxDPS = 0;
        for (const sector of this.sectors) {
            if (sector.totalDPS > maxDPS) {
                maxDPS = sector.totalDPS;
            }
        }

        if (maxDPS === 0) return;

        // Render sectors
        for (const sector of this.sectors) {
            const intensity = sector.totalDPS / maxDPS;
            if (intensity > 0.05) {
                const x = sector.x - sector.width / 2;
                const y = sector.y - sector.height / 2;

                this.coverageLayer.rect(x, y, sector.width, sector.height);
                this.coverageLayer.fill({
                    color: RENDER_CONFIG.COVERAGE_COLOR,
                    alpha: intensity * 0.5,
                });
            }
        }
    }

    /**
     * Render decision info - current AI plan
     */
    private renderDecisionInfo(aiStatus: AIStatusExtended): void {
        this.decisionMarker.clear();

        const plannedPos = aiStatus.plannedPosition;
        const plannedAction = aiStatus.plannedAction;

        if (plannedPos && plannedAction) {
            // Draw pulsing ring at planned position
            const time = Date.now() / 500;
            const pulse = 0.7 + Math.sin(time) * 0.3;

            this.decisionMarker.circle(plannedPos.x, plannedPos.y, 30 * pulse);
            this.decisionMarker.stroke({
                color: RENDER_CONFIG.DECISION_COLOR,
                width: 3,
                alpha: pulse,
            });

            // Inner ring
            this.decisionMarker.circle(plannedPos.x, plannedPos.y, 15);
            this.decisionMarker.stroke({
                color: RENDER_CONFIG.DECISION_COLOR,
                width: 2,
                alpha: 0.8,
            });

            // Crosshair
            this.decisionMarker.moveTo(plannedPos.x - 10, plannedPos.y);
            this.decisionMarker.lineTo(plannedPos.x + 10, plannedPos.y);
            this.decisionMarker.stroke({ color: RENDER_CONFIG.DECISION_COLOR, width: 1 });
            this.decisionMarker.moveTo(plannedPos.x, plannedPos.y - 10);
            this.decisionMarker.lineTo(plannedPos.x, plannedPos.y + 10);
            this.decisionMarker.stroke({ color: RENDER_CONFIG.DECISION_COLOR, width: 1 });

            // Update decision text
            const actionType = plannedAction.type.replace('_', ' ');
            const score = Math.round(plannedAction.expectedValue);
            this.decisionText.text = `${actionType}\nScore: ${score}`;
            this.decisionText.position.set(plannedPos.x + 35, plannedPos.y - 20);
            this.decisionText.visible = true;
        } else {
            this.decisionText.visible = false;
        }
    }

    /**
     * Clear all visualizations
     */
    clear(): void {
        this.threatLayer.clear();
        this.coverageLayer.clear();
        this.decisionMarker.clear();
        this.decisionText.visible = false;
        this.frameCounter = 0;
    }

    /**
     * Clean up resources
     */
    destroy(): void {
        this.container.destroy({ children: true });
    }
}
