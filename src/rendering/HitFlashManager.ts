/**
 * Hit Flash Manager for Kobayashi Maru
 *
 * Manages brief white tint flashes on enemy sprites when they take damage.
 * Subscribes to DAMAGE_DEALT events and drives per-entity flash timers.
 *
 * @module rendering/HitFlashManager
 */
import { EventBus } from '../core/EventBus';
import { GameEventType, DamageDealtPayload } from '../types/events';
import { SpriteRef } from '../ecs/components';
import { RENDERING_CONFIG } from '../config';
import type { SpriteManager } from './spriteManager';

interface FlashEntry {
    spriteIndex: number;
    remaining: number;
}

export class HitFlashManager {
    private spriteManager: SpriteManager;
    private eventBus: EventBus;
    private activeFlashes: Map<number, FlashEntry> = new Map();
    private boundHandleDamage: (payload: DamageDealtPayload) => void;
    private flashDuration: number;
    private flashColor: number;

    constructor(spriteManager: SpriteManager) {
        this.spriteManager = spriteManager;
        this.eventBus = EventBus.getInstance();
        this.flashDuration = RENDERING_CONFIG.HIT_FLASH.DURATION;
        this.flashColor = RENDERING_CONFIG.HIT_FLASH.COLOR;
        this.boundHandleDamage = this.handleDamage.bind(this);
    }

    init(): void {
        this.eventBus.on(GameEventType.DAMAGE_DEALT, this.boundHandleDamage);
    }

    private handleDamage(payload: DamageDealtPayload): void {
        const spriteIndex = SpriteRef.index[payload.entityId];
        if (spriteIndex === 0) return; // No sprite assigned

        // Set tint to flash color
        this.spriteManager.setTint(spriteIndex, this.flashColor);

        // Track the flash timer
        this.activeFlashes.set(payload.entityId, {
            spriteIndex,
            remaining: this.flashDuration,
        });
    }

    update(deltaTime: number): void {
        for (const [entityId, flash] of this.activeFlashes) {
            flash.remaining -= deltaTime;
            if (flash.remaining <= 0) {
                // Reset tint back to white (no tint)
                this.spriteManager.setTint(flash.spriteIndex, 0xFFFFFF);
                this.activeFlashes.delete(entityId);
            }
        }
    }

    destroy(): void {
        this.eventBus.off(GameEventType.DAMAGE_DEALT, this.boundHandleDamage);
        this.activeFlashes.clear();
    }
}
