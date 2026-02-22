/**
 * Damage Number Renderer for Kobayashi Maru
 *
 * Displays floating damage numbers at hit positions.
 * Blue for shield damage, red for health, orange for critical hits.
 * Numbers float upward, scale down, and fade out.
 *
 * Uses BitmapText for high-performance rendering with tint-based coloring.
 *
 * @module rendering/DamageNumberRenderer
 */
import { Container, BitmapText, BitmapFont } from 'pixi.js';
import { EventBus } from '../core/EventBus';
import { GameEventType, DamageDealtPayload } from '../types/events';
import { RENDERING_CONFIG } from '../config/rendering.config';

const DAMAGE_FONT_NAME = 'DamageNumber';

interface ActiveNumber {
    text: BitmapText;
    elapsed: number;
    startX: number;
    startY: number;
}

/**
 * Renders floating damage numbers using a pooled BitmapText approach.
 * Subscribes to DAMAGE_DEALT events via EventBus.
 */
export class DamageNumberRenderer {
    private container: Container;
    private pool: BitmapText[] = [];
    private active: ActiveNumber[] = [];
    private eventBus: EventBus;
    private boundHandler: (payload: DamageDealtPayload) => void;
    private config = RENDERING_CONFIG.DAMAGE_NUMBERS;

    constructor() {
        this.container = new Container();
        this.eventBus = EventBus.getInstance();
        this.boundHandler = this.handleDamageDealt.bind(this);
    }

    /**
     * Initialize with a parent container and pre-populate the pool.
     */
    init(parent: Container): void {
        parent.addChild(this.container);

        // Install a bitmap font for damage numbers (white fill, colorized via tint)
        BitmapFont.install({
            name: DAMAGE_FONT_NAME,
            style: {
                fontFamily: this.config.FONT_FAMILY,
                fontSize: this.config.FONT_SIZE,
                fill: 0xFFFFFF,
                fontWeight: 'bold',
                stroke: { color: this.config.STROKE_COLOR, width: this.config.STROKE_WIDTH },
            },
            chars: [['0', '9'], ' -'],
        });

        // Pre-populate pool
        for (let i = 0; i < this.config.POOL_SIZE; i++) {
            const text = this.createText();
            text.visible = false;
            this.container.addChild(text);
            this.pool.push(text);
        }

        // Subscribe to damage events
        this.eventBus.on(GameEventType.DAMAGE_DEALT, this.boundHandler);
    }

    private createText(): BitmapText {
        const text = new BitmapText({
            text: '',
            style: {
                fontFamily: DAMAGE_FONT_NAME,
                fontSize: this.config.FONT_SIZE,
            },
        });
        text.anchor.set(0.5, 0.5);
        return text;
    }

    private handleDamageDealt(payload: DamageDealtPayload): void {
        const text = this.acquire();
        if (!text) return;

        const damage = Math.round(payload.damage);
        text.text = damage.toString();

        // Color based on damage type (use tint for BitmapText)
        if (payload.isShield) {
            text.tint = this.config.SHIELD_COLOR;
        } else if (damage >= this.config.CRITICAL_THRESHOLD) {
            text.tint = this.config.CRITICAL_COLOR;
        } else {
            text.tint = this.config.HEALTH_COLOR;
        }

        text.position.set(payload.x, payload.y);
        text.scale.set(this.config.START_SCALE);
        text.alpha = 1;
        text.visible = true;

        this.active.push({
            text,
            elapsed: 0,
            startX: payload.x,
            startY: payload.y
        });
    }

    private acquire(): BitmapText | null {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        // Steal oldest active if pool empty
        if (this.active.length > 0) {
            const oldest = this.active.shift()!;
            oldest.text.visible = false;
            return oldest.text;
        }
        return null;
    }

    /**
     * Update all active damage numbers.
     */
    update(deltaTime: number): void {
        const duration = this.config.DURATION;
        const floatSpeed = this.config.FLOAT_SPEED;
        const startScale = this.config.START_SCALE;
        const endScale = this.config.END_SCALE;

        for (let i = this.active.length - 1; i >= 0; i--) {
            const entry = this.active[i];
            entry.elapsed += deltaTime;

            const t = Math.min(entry.elapsed / duration, 1);

            // Float upward
            entry.text.y = entry.startY - floatSpeed * entry.elapsed;

            // Scale down
            entry.text.scale.set(startScale + (endScale - startScale) * t);

            // Fade out
            entry.text.alpha = 1 - t;

            if (t >= 1) {
                entry.text.visible = false;
                this.pool.push(entry.text);
                this.active.splice(i, 1);
            }
        }
    }

    /**
     * Clear all active numbers (e.g., on game restart).
     */
    clear(): void {
        for (const entry of this.active) {
            entry.text.visible = false;
            this.pool.push(entry.text);
        }
        this.active.length = 0;
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        this.eventBus.off(GameEventType.DAMAGE_DEALT, this.boundHandler);
        this.active.length = 0;
        this.pool.length = 0;
        this.container.destroy({ children: true });
    }
}
