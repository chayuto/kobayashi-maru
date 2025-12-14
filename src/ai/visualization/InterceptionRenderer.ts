/**
 * InterceptionRenderer
 *
 * Renders interception points (optimal turret placement candidates).
 *
 * @module ai/visualization/InterceptionRenderer
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';

const POINT_COLOR = 0xffff00; // Yellow
const POINT_RADIUS = 8;
const LABEL_STYLE = new TextStyle({
    fontSize: 10,
    fill: 0xffffff,
    fontFamily: 'monospace',
});

export interface InterceptionPoint {
    x: number;
    y: number;
    score: number;
    dwellTime: number;
}

export class InterceptionRenderer {
    private container: Container;
    private graphics: Graphics;
    private labels: Text[] = [];

    constructor() {
        this.container = new Container();
        this.graphics = new Graphics();
        this.container.addChild(this.graphics);
    }

    getContainer(): Container {
        return this.container;
    }

    update(points: InterceptionPoint[]): void {
        this.graphics.clear();

        // Remove old labels
        for (const label of this.labels) {
            this.container.removeChild(label);
            label.destroy();
        }
        this.labels = [];

        // Draw interception points
        for (let i = 0; i < points.length; i++) {
            const point = points[i];

            // Draw circle
            this.graphics.circle(point.x, point.y, POINT_RADIUS);
            this.graphics.stroke({ color: POINT_COLOR, width: 2 });

            // Draw rank number
            const label = new Text({
                text: `${i + 1}`,
                style: LABEL_STYLE,
            });
            label.anchor.set(0.5);
            label.position.set(point.x, point.y);
            this.container.addChild(label);
            this.labels.push(label);

            // Draw score tooltip on hover (simplified: always show for top 3)
            if (i < 3) {
                const tooltip = new Text({
                    text: `Score: ${point.score.toFixed(1)}\nDwell: ${point.dwellTime.toFixed(1)}s`,
                    style: new TextStyle({ fontSize: 8, fill: 0xaaaaaa }),
                });
                tooltip.position.set(point.x + 12, point.y - 10);
                this.container.addChild(tooltip);
                this.labels.push(tooltip);
            }
        }
    }
}
