/**
 * FlowFieldRenderer
 *
 * Renders flow field arrows and traffic density heat map.
 *
 * @module ai/visualization/FlowFieldRenderer
 */

import { Container, Graphics } from 'pixi.js';
import { GAME_CONFIG } from '../../types/constants';
import type { FlowFieldAnalyzer } from '../spatial/FlowFieldAnalyzer';

// Visualization config
const ARROW_SPACING = 40; // Pixels between arrows
const ARROW_LENGTH = 15; // Arrow length in pixels
const ARROW_COLOR = 0x00ffff; // Cyan
const ARROW_ALPHA = 0.6;

// Heat map colors (low to high traffic)
const HEAT_COLORS = [
    0x0000ff, // Blue (low)
    0x00ff00, // Green
    0xffff00, // Yellow
    0xff8800, // Orange
    0xff0000, // Red (high)
];

export class FlowFieldRenderer {
    private container: Container;
    private arrowGraphics: Graphics;
    private heatMapGraphics: Graphics;
    private flowAnalyzer: FlowFieldAnalyzer;

    constructor(flowAnalyzer: FlowFieldAnalyzer) {
        this.flowAnalyzer = flowAnalyzer;

        this.container = new Container();
        this.heatMapGraphics = new Graphics();
        this.arrowGraphics = new Graphics();

        this.container.addChild(this.heatMapGraphics);
        this.container.addChild(this.arrowGraphics);
    }

    getContainer(): Container {
        return this.container;
    }

    update(showArrows: boolean, showHeatMap: boolean): void {
        this.arrowGraphics.clear();
        this.heatMapGraphics.clear();

        if (showHeatMap) {
            this.renderHeatMap();
        }

        if (showArrows) {
            this.renderArrows();
        }
    }

    private renderHeatMap(): void {
        const cellSize = ARROW_SPACING;
        const cols = Math.ceil(GAME_CONFIG.WORLD_WIDTH / cellSize);
        const rows = Math.ceil(GAME_CONFIG.WORLD_HEIGHT / cellSize);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * cellSize + cellSize / 2;
                const y = row * cellSize + cellSize / 2;

                const traffic = this.flowAnalyzer.getTrafficAt(x, y);

                if (traffic > 0.1) {
                    const color = this.getHeatColor(traffic);
                    this.heatMapGraphics.rect(
                        col * cellSize,
                        row * cellSize,
                        cellSize,
                        cellSize
                    );
                    this.heatMapGraphics.fill({ color, alpha: traffic * 0.4 });
                }
            }
        }
    }

    private renderArrows(): void {
        const cols = Math.ceil(GAME_CONFIG.WORLD_WIDTH / ARROW_SPACING);
        const rows = Math.ceil(GAME_CONFIG.WORLD_HEIGHT / ARROW_SPACING);

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const x = col * ARROW_SPACING + ARROW_SPACING / 2;
                const y = row * ARROW_SPACING + ARROW_SPACING / 2;

                const flow = this.flowAnalyzer.getFlowAt(x, y);

                // Skip zero vectors (goal reached)
                if (flow.x === 0 && flow.y === 0) continue;

                this.drawArrow(x, y, flow.x, flow.y);
            }
        }
    }

    private drawArrow(x: number, y: number, dirX: number, dirY: number): void {
        const endX = x + dirX * ARROW_LENGTH;
        const endY = y + dirY * ARROW_LENGTH;

        // Arrow line
        this.arrowGraphics.moveTo(x, y);
        this.arrowGraphics.lineTo(endX, endY);
        this.arrowGraphics.stroke({ color: ARROW_COLOR, alpha: ARROW_ALPHA, width: 1 });

        // Arrow head
        const headLength = 5;
        const angle = Math.atan2(dirY, dirX);
        const headAngle = Math.PI / 6;

        this.arrowGraphics.moveTo(endX, endY);
        this.arrowGraphics.lineTo(
            endX - headLength * Math.cos(angle - headAngle),
            endY - headLength * Math.sin(angle - headAngle)
        );
        this.arrowGraphics.stroke({ color: ARROW_COLOR, alpha: ARROW_ALPHA, width: 1 });

        this.arrowGraphics.moveTo(endX, endY);
        this.arrowGraphics.lineTo(
            endX - headLength * Math.cos(angle + headAngle),
            endY - headLength * Math.sin(angle + headAngle)
        );
        this.arrowGraphics.stroke({ color: ARROW_COLOR, alpha: ARROW_ALPHA, width: 1 });
    }

    private getHeatColor(value: number): number {
        // Map 0-1 to color index
        const index = Math.min(
            Math.floor(value * HEAT_COLORS.length),
            HEAT_COLORS.length - 1
        );
        return HEAT_COLORS[index];
    }
}
