/**
 * Entity Reset Functions for Kobayashi Maru
 * 
 * Standardized component reset for entity reuse from pools.
 * Ensures no stale state leaks between entity lifecycles.
 * 
 * @example
 * ```typescript
 * // Reset entity when returning to pool
 * resetEnemy(entityId);
 * 
 * // Reset projectile components
 * resetProjectile(entityId);
 * ```
 * 
 * @module ecs/entityReset
 */
import {
    Position,
    Velocity,
    Rotation,
    Faction,
    SpriteRef,
    CompositeSpriteRef,
    Health,
    Shield,
    Collider,
    AIBehavior,
    EnemyWeapon,
    Projectile,
    Target,
    Turret,
    TurretUpgrade,
    WeaponProperties,
    EnemyVariant,
    SpecialAbility,
    BurningStatus,
    SlowedStatus,
    DrainedStatus,
    DisabledStatus,
} from './components';

// =============================================================================
// STATUS EFFECT RESET
// =============================================================================

/**
 * Reset all status effect components for an entity.
 * Call this when an entity is destroyed or returned to pool.
 * 
 * @param eid - Entity ID to reset
 */
export function resetStatusEffects(eid: number): void {
    // Burning status
    BurningStatus.damagePerTick[eid] = 0;
    BurningStatus.ticksRemaining[eid] = 0;
    BurningStatus.tickInterval[eid] = 0;
    BurningStatus.lastTickTime[eid] = 0;

    // Slowed status
    SlowedStatus.slowPercent[eid] = 0;
    SlowedStatus.duration[eid] = 0;
    SlowedStatus.originalSpeed[eid] = 0;

    // Drained status
    DrainedStatus.stacks[eid] = 0;
    DrainedStatus.duration[eid] = 0;

    // Disabled status
    DisabledStatus.duration[eid] = 0;
    DisabledStatus.disabledSystems[eid] = 0;
}

// =============================================================================
// TRANSFORM RESET
// =============================================================================

/**
 * Reset transform components (position, velocity, rotation).
 * 
 * @param eid - Entity ID to reset
 */
export function resetTransform(eid: number): void {
    Position.x[eid] = 0;
    Position.y[eid] = 0;
    Velocity.x[eid] = 0;
    Velocity.y[eid] = 0;
    Rotation.angle[eid] = 0;
}

// =============================================================================
// IDENTITY RESET
// =============================================================================

/**
 * Reset identity components (faction, sprite reference).
 * 
 * @param eid - Entity ID to reset
 */
export function resetIdentity(eid: number): void {
    Faction.id[eid] = 0;
    SpriteRef.index[eid] = 0;
}

/**
 * Reset composite sprite reference (for turrets with base + barrel).
 * 
 * @param eid - Entity ID to reset
 */
export function resetCompositeSpriteRef(eid: number): void {
    CompositeSpriteRef.baseIndex[eid] = 0;
    CompositeSpriteRef.barrelIndex[eid] = 0;
}

// =============================================================================
// COMBAT RESET
// =============================================================================

/**
 * Reset combat components (health, shield).
 * 
 * @param eid - Entity ID to reset
 */
export function resetCombat(eid: number): void {
    Health.current[eid] = 0;
    Health.max[eid] = 0;
    Shield.current[eid] = 0;
    Shield.max[eid] = 0;
}

/**
 * Reset collider component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetCollider(eid: number): void {
    Collider.radius[eid] = 0;
    Collider.layer[eid] = 0;
    Collider.mask[eid] = 0;
}

// =============================================================================
// BEHAVIOR RESET
// =============================================================================

/**
 * Reset AI behavior component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetAIBehavior(eid: number): void {
    AIBehavior.behaviorType[eid] = 0;
    AIBehavior.stateTimer[eid] = 0;
    AIBehavior.targetX[eid] = 0;
    AIBehavior.targetY[eid] = 0;
    AIBehavior.aggression[eid] = 0;
}

/**
 * Reset target component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetTarget(eid: number): void {
    Target.entityId[eid] = 0;
    Target.hasTarget[eid] = 0;
    Target.entityId2[eid] = 0;
    Target.hasTarget2[eid] = 0;
    Target.entityId3[eid] = 0;
    Target.hasTarget3[eid] = 0;
}

// =============================================================================
// WEAPON RESET
// =============================================================================

/**
 * Reset enemy weapon component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetEnemyWeapon(eid: number): void {
    EnemyWeapon.range[eid] = 0;
    EnemyWeapon.fireRate[eid] = 0;
    EnemyWeapon.damage[eid] = 0;
    EnemyWeapon.lastFired[eid] = 0;
    EnemyWeapon.projectileType[eid] = 0;
}

/**
 * Reset projectile component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetProjectileComponent(eid: number): void {
    Projectile.damage[eid] = 0;
    Projectile.speed[eid] = 0;
    Projectile.lifetime[eid] = 0;
    Projectile.targetEntityId[eid] = 0;
    Projectile.projectileType[eid] = 0;
}

/**
 * Reset turret component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetTurretComponent(eid: number): void {
    Turret.range[eid] = 0;
    Turret.fireRate[eid] = 0;
    Turret.damage[eid] = 0;
    Turret.lastFired[eid] = 0;
    Turret.turretType[eid] = 0;
}

/**
 * Reset weapon properties component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetWeaponProperties(eid: number): void {
    WeaponProperties.shieldDamageMultiplier[eid] = 0;
    WeaponProperties.hullDamageMultiplier[eid] = 0;
    WeaponProperties.critChance[eid] = 0;
    WeaponProperties.critMultiplier[eid] = 0;
    WeaponProperties.aoeRadius[eid] = 0;
    WeaponProperties.statusEffectType[eid] = 0;
    WeaponProperties.statusEffectChance[eid] = 0;
}

// =============================================================================
// UPGRADE RESET
// =============================================================================

/**
 * Reset turret upgrade component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetTurretUpgrade(eid: number): void {
    TurretUpgrade.damageLevel[eid] = 0;
    TurretUpgrade.rangeLevel[eid] = 0;
    TurretUpgrade.fireRateLevel[eid] = 0;
    TurretUpgrade.multiTargetLevel[eid] = 0;
    TurretUpgrade.specialLevel[eid] = 0;
}

// =============================================================================
// ENEMY VARIANT RESET
// =============================================================================

/**
 * Reset enemy variant component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetEnemyVariant(eid: number): void {
    EnemyVariant.rank[eid] = 0;
    EnemyVariant.sizeScale[eid] = 0;
    EnemyVariant.statMultiplier[eid] = 0;
}

/**
 * Reset special ability component.
 * 
 * @param eid - Entity ID to reset
 */
export function resetSpecialAbility(eid: number): void {
    SpecialAbility.abilityType[eid] = 0;
    SpecialAbility.cooldown[eid] = 0;
    SpecialAbility.lastUsed[eid] = 0;
    SpecialAbility.duration[eid] = 0;
    SpecialAbility.active[eid] = 0;
}

// =============================================================================
// ENTITY-TYPE RESET FUNCTIONS
// =============================================================================

/**
 * Reset all components for an enemy entity.
 * Use when returning an enemy to the pool.
 * 
 * @param eid - Entity ID to reset
 */
export function resetEnemy(eid: number): void {
    resetTransform(eid);
    resetIdentity(eid);
    resetCombat(eid);
    resetCollider(eid);
    resetAIBehavior(eid);
    resetEnemyWeapon(eid);
    resetTarget(eid);
    resetEnemyVariant(eid);
    resetSpecialAbility(eid);
    resetStatusEffects(eid);
}

/**
 * Reset all components for a projectile entity.
 * Use when returning a projectile to the pool.
 * 
 * @param eid - Entity ID to reset
 */
export function resetProjectile(eid: number): void {
    resetTransform(eid);
    resetIdentity(eid);
    resetCollider(eid);
    resetProjectileComponent(eid);
}

/**
 * Reset all components for a turret entity.
 * Use when selling/removing a turret.
 * 
 * @param eid - Entity ID to reset
 */
export function resetTurret(eid: number): void {
    resetTransform(eid);
    Faction.id[eid] = 0;
    resetCompositeSpriteRef(eid);
    resetCombat(eid);
    resetTurretComponent(eid);
    resetTarget(eid);
    resetTurretUpgrade(eid);
    resetWeaponProperties(eid);
}
