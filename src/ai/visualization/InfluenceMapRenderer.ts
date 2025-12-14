/**
 * InfluenceMapRenderer
 *
 * Renders threat and coverage influence maps as overlays.
 *
 * @module ai/visualization/InfluenceMapRenderer
 */

import { Container, Graphics } from 'pixi.js';
import type { ThreatInfluenceMap } from '../spatial/ThreatInfluenceMap';
import type { CoverageInfluenceMap } from '../spatial/CoverageInfluenceMap';

const THREAT_COLOR = 0xff0000; // Red for danger
const COVERAGE_COLOR = 0x00ff00; // Green for protection

export class InfluenceMapRenderer {
    private container: Container;
    private threatGraphics: Graphics;
    private coverageGraphics: Graphics;
    private threatMap: ThreatInfluenceMap;
    private coverageMap: CoverageInfluenceMap;

    constructor(threatMap: ThreatInfluenceMap, coverageMap: CoverageInfluenceMap) {
        this.threatMap = threatMap;
        this.coverageMap = coverageMap;

        this.container = new Container();
        this.threatGraphics = new Graphics();
        this.coverageGraphics = new Graphics();

        this.container.addChild(this.coverageGraphics);
        this.container.addChild(this.threatGraphics);
    }

    getContainer(): Container {
        return this.container;
    }

    update(showThreat: boolean, showCoverage: boolean): void {
        this.threatGraphics.clear();
        this.coverageGraphics.clear();

        if (showCoverage) {
            this.renderInfluenceMap(
                this.coverageGraphics,
                this.coverageMap.getMap(),
                COVERAGE_COLOR
            );
        }

        if (showThreat) {
            this.renderInfluenceMap(
                this.threatGraphics,
                this.threatMap.getMap(),
                THREAT_COLOR
            );
        }
    }

    private renderInfluenceMap(
        graphics: Graphics,
        map: { getValues(): Float32Array; getDimensions(): { cols: number; rows: number; cellSize: number } },
        color: number
    ): void {
        const dims = map.getDimensions();
        const values = map.getValues();

        // Find max value for normalization
        let maxValue = 0;
        for (let i = 0; i < values.length; i++) {
            if (values[i] > maxValue) maxValue = values[i];
        }

        if (maxValue === 0) return;

        for (let row = 0; row < dims.rows; row++) {
            for (let col = 0; col < dims.cols; col++) {
                const index = row * dims.cols + col;
                const value = values[index];

                // Normalize to 0-1
                const normalizedValue = value / maxValue;

                if (normalizedValue > 0.1) {
                    graphics.rect(
                        col * dims.cellSize,
                        row * dims.cellSize,
                        dims.cellSize,
                        dims.cellSize
                    );
                    graphics.fill({ color, alpha: normalizedValue * 0.3 });
                }
            }
        }
    }
}
