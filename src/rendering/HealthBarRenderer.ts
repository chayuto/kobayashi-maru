import { Application, Container, Graphics } from 'pixi.js';
import { World, query } from 'bitecs';
import { Health, Position } from '../ecs/components';

export class HealthBarRenderer {
    private container: Container;
    private bars: Map<number, Graphics> = new Map();
    private app: Application | null = null;

    constructor() {
        this.container = new Container();
    }

    init(app: Application): void {
        this.app = app;
        this.app.stage.addChild(this.container);
    }

    update(world: World): void {
        const entities = query(world, [Health, Position]);
        const activeEntities = new Set(entities);

        // Remove bars for entities that no longer exist or don't match query
        for (const [eid, bar] of this.bars) {
            if (!activeEntities.has(eid)) {
                this.container.removeChild(bar);
                bar.destroy();
                this.bars.delete(eid);
            }
        }

        for (const eid of entities) {
            const current = Health.current[eid];
            const max = Health.max[eid];

            // Only show health bar if damaged
            if (current < max) {
                const x = Position.x[eid];
                const y = Position.y[eid] - 20; // Above entity
                this.showHealthBar(eid, current, max, x, y);
            } else {
                this.hideHealthBar(eid);
            }
        }
    }

    showHealthBar(eid: number, current: number, max: number, x: number, y: number): void {
        let bar = this.bars.get(eid);
        if (!bar) {
            bar = new Graphics();
            this.container.addChild(bar);
            this.bars.set(eid, bar);
        }

        const width = 32;
        const height = 4;
        const percent = Math.max(0, Math.min(1, current / max));

        bar.clear();

        // Background (black)
        bar.beginFill(0x000000);
        bar.drawRect(-width / 2, -height / 2, width, height);
        bar.endFill();

        // Foreground color based on health
        let color = 0x00FF00; // Green
        if (percent < 0.25) {
            color = 0xFF0000; // Red
        } else if (percent < 0.5) {
            color = 0xFFFF00; // Yellow
        }

        // Foreground
        bar.beginFill(color);
        bar.drawRect(-width / 2, -height / 2, width * percent, height);
        bar.endFill();

        bar.x = x;
        bar.y = y;
    }

    hideHealthBar(eid: number): void {
        const bar = this.bars.get(eid);
        if (bar) {
            this.container.removeChild(bar);
            bar.destroy();
            this.bars.delete(eid);
        }
    }

    destroy(): void {
        if (this.app && this.container) {
            this.app.stage.removeChild(this.container);
        }
        this.container.destroy({ children: true });
        this.bars.clear();
    }
}
