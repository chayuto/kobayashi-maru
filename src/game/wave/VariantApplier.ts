/**
 * Variant Applier for Kobayashi Maru
 *
 * Handles application of Elite and Boss variants to enemies.
 * Extracted from WaveManager for cleaner separation of concerns.
 *
 * @module game/wave/VariantApplier
 */

import { addComponent, hasComponent } from 'bitecs';
import { SpriteManager } from '../../rendering/spriteManager';
import { EnemyRank, RANK_MULTIPLIERS, ABILITY_CONFIG } from '../../types/constants';
import { Health, Shield, EnemyVariant, SpecialAbility, SpriteRef, EnemyWeapon } from '../../ecs/components';
import type { GameWorld } from '../../ecs/world';
import type { BossWaveConfig } from '../waveConfig';
import { SpawnEffects } from './SpawnEffects';

/**
 * VariantApplier handles elevation of enemies to Elite or Boss status.
 */
export class VariantApplier {
    private world: GameWorld | null = null;
    private spriteManager: SpriteManager | null = null;
    private spawnEffects: SpawnEffects;

    constructor(spawnEffects: SpawnEffects) {
        this.spawnEffects = spawnEffects;
    }

    /**
     * Set dependencies.
     */
    setDependencies(world: GameWorld, spriteManager: SpriteManager): void {
        this.world = world;
        this.spriteManager = spriteManager;
    }

    /**
     * Determine and apply variant to an enemy (Elite or Boss).
     * @param eid - Entity ID
     * @param faction - Enemy faction
     * @param currentWave - Current wave number
     * @param bossWave - Boss wave config if this is a boss wave
     */
    applyVariant(eid: number, faction: number, currentWave: number, bossWave: BossWaveConfig | null): void {
        if (!this.world) return;

        // Check if this is a boss enemy
        if (bossWave && bossWave.bossType === faction) {
            this.applyBossVariant(eid, bossWave);
            return;
        }

        // Determine elite chance (10% base + 1% per wave)
        const eliteChance = 0.1 + (currentWave * 0.01);
        const isElite = Math.random() < eliteChance;

        if (isElite) {
            this.applyEliteVariant(eid);
        }
    }

    /**
     * Apply elite variant to an enemy.
     */
    private applyEliteVariant(eid: number): void {
        if (!this.world) return;

        // Add variant component
        addComponent(this.world, eid, EnemyVariant);
        EnemyVariant.rank[eid] = EnemyRank.ELITE;
        EnemyVariant.sizeScale[eid] = RANK_MULTIPLIERS[EnemyRank.ELITE].size;
        EnemyVariant.statMultiplier[eid] = RANK_MULTIPLIERS[EnemyRank.ELITE].health;

        // Apply multipliers to stats
        const healthMultiplier = RANK_MULTIPLIERS[EnemyRank.ELITE].health;
        Health.max[eid] = Math.floor(Health.max[eid] * healthMultiplier);
        Health.current[eid] = Math.floor(Health.current[eid] * healthMultiplier);
        Shield.max[eid] = Math.floor(Shield.max[eid] * healthMultiplier);
        Shield.current[eid] = Math.floor(Shield.current[eid] * healthMultiplier);

        if (hasComponent(this.world, eid, EnemyWeapon)) {
            EnemyWeapon.damage[eid] *= RANK_MULTIPLIERS[EnemyRank.ELITE].damage;
        }

        // Scale sprite
        const spriteIndex = SpriteRef.index[eid];
        if (this.spriteManager) {
            this.spriteManager.setScale(spriteIndex, RANK_MULTIPLIERS[EnemyRank.ELITE].size);
        }

        // Add elite glow effect
        this.spawnEffects.addEliteGlow(eid);
    }

    /**
     * Apply boss variant to an enemy with special abilities.
     */
    private applyBossVariant(eid: number, bossWave: BossWaveConfig): void {
        if (!this.world) return;

        // Add variant component
        addComponent(this.world, eid, EnemyVariant);
        EnemyVariant.rank[eid] = EnemyRank.BOSS;
        EnemyVariant.sizeScale[eid] = RANK_MULTIPLIERS[EnemyRank.BOSS].size;
        EnemyVariant.statMultiplier[eid] = RANK_MULTIPLIERS[EnemyRank.BOSS].health;

        // Apply multipliers to stats
        const healthMultiplier = RANK_MULTIPLIERS[EnemyRank.BOSS].health;
        Health.max[eid] = Math.floor(Health.max[eid] * healthMultiplier);
        Health.current[eid] = Math.floor(Health.current[eid] * healthMultiplier);
        Shield.max[eid] = Math.floor(Shield.max[eid] * healthMultiplier);
        Shield.current[eid] = Math.floor(Shield.current[eid] * healthMultiplier);

        if (hasComponent(this.world, eid, EnemyWeapon)) {
            EnemyWeapon.damage[eid] *= RANK_MULTIPLIERS[EnemyRank.BOSS].damage;
        }

        // Scale sprite
        const spriteIndex = SpriteRef.index[eid];
        if (this.spriteManager) {
            this.spriteManager.setScale(spriteIndex, RANK_MULTIPLIERS[EnemyRank.BOSS].size);
        }

        // Add special abilities
        if (bossWave.bossAbilities.length > 0) {
            const abilityType = bossWave.bossAbilities[0];
            addComponent(this.world, eid, SpecialAbility);
            SpecialAbility.abilityType[eid] = abilityType;
            SpecialAbility.cooldown[eid] = ABILITY_CONFIG[abilityType].cooldown;
            SpecialAbility.duration[eid] = ABILITY_CONFIG[abilityType].duration;
            SpecialAbility.lastUsed[eid] = 0;
            SpecialAbility.active[eid] = 0;
        }

        // Add boss glow effect
        this.spawnEffects.addBossGlow(eid);
    }
}
