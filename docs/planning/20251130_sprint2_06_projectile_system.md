# Task 06: Projectile System for Torpedo Launcher

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

## Objective
Implement a projectile system where torpedo launchers fire visible projectiles instead of instant-hit beams.

## Context
Current weapon behavior:
- All turret types use instant-hit damage (`combatSystem.ts`)
- Beam visuals are drawn for phasers/disruptors (`BeamRenderer.ts`)
- Torpedo launcher is marked with `TurretType.TORPEDO_LAUNCHER` but uses instant hit
- Comment in combat system: `// TODO: spawn projectile entity`

Projectiles add:
- Visual variety (moving projectile vs beam)
- Dodge opportunity for enemies (if AI implemented)
- Travel time delay for balance
- More satisfying impact visuals

## Requirements

### 1. Create Projectile Component (`src/ecs/components.ts`)
```typescript
export const Projectile = defineComponent({
  damage: Types.f32,        // Damage on impact
  speed: Types.f32,         // Pixels per second
  lifetime: Types.f32,      // Max seconds before despawn
  targetEntityId: Types.ui32, // Target entity (for homing, optional)
  projectileType: Types.ui8 // Type (torpedo, etc.)
});
```

### 2. Projectile Types Enum (`src/types/constants.ts`)
```typescript
export const ProjectileType = {
  PHOTON_TORPEDO: 0,
  QUANTUM_TORPEDO: 1,  // Future: higher damage, faster
  DISRUPTOR_BOLT: 2    // Future: for enemy projectiles
} as const;

export const PROJECTILE_CONFIG: Record<number, {
  speed: number;
  lifetime: number;
  size: number;
  color: number;
}> = {
  [ProjectileType.PHOTON_TORPEDO]: {
    speed: 400,    // Pixels per second
    lifetime: 5,   // 5 seconds max
    size: 8,       // Visual size
    color: 0xFF6600 // Orange-red
  }
};
```

### 3. Create Projectile Factory (`src/ecs/entityFactory.ts`)
```typescript
export function createProjectile(
  world: GameWorld,
  x: number, 
  y: number,
  targetX: number,
  targetY: number,
  damage: number,
  projectileType: number
): number;
```

### 4. Create Projectile System (`src/systems/projectileSystem.ts`)
- **Queries:**
  - Movement: `[Position, Velocity, Projectile]`
  - Collision: Check against enemies

- **Update Logic:**
  1. Decrement lifetime, despawn if expired
  2. Move toward target (velocity already set)
  3. Check collision with enemies (use spatial hash)
  4. On collision: apply damage, despawn projectile

- **Methods:**
  - `createProjectileSystem(spatialHash: SpatialHash)`
  - Returns system update function

### 5. Update Combat System
When torpedo turret fires:
```typescript
if (turretType === TurretType.TORPEDO_LAUNCHER) {
  // Spawn projectile instead of instant damage
  const eid = createProjectile(world, turretX, turretY, targetX, targetY, damage, ProjectileType.PHOTON_TORPEDO);
  // Track for visual rendering
  projectilesFired.push(eid);
} else {
  // Beam weapons - instant damage
  applyDamage(world, targetEid, damage);
}
```

### 6. Projectile Visuals
Add to sprite manager or create dedicated renderer:
- Draw projectiles as glowing circles/ovals
- Color based on projectile type
- Optional: trail effect

### 7. Entity Factory Updates
Add to `createTurret` when `TurretType.TORPEDO_LAUNCHER`:
- No beam rendering (handled by projectile)
- Higher damage per hit, slower rate

### 8. Collision Detection
Use spatial hash for efficient projectile-enemy collision:
```typescript
const nearby = spatialHash.query(projectileX, projectileY, projectileRadius);
for (const eid of nearby) {
  if (isEnemy(world, eid) && checkCollision(projectileEid, eid)) {
    applyDamage(world, eid, damage);
    despawn(world, projectileEid);
    break;
  }
}
```

## Acceptance Criteria
- [ ] Torpedo launcher fires visible projectiles
- [ ] Projectiles travel toward target position
- [ ] Projectiles deal damage on impact
- [ ] Projectiles despawn after lifetime expires
- [ ] Projectiles despawn on collision
- [ ] Projectile visuals are rendered
- [ ] Performance handles many projectiles (100+)
- [ ] Projectile speed is configurable
- [ ] Unit tests cover projectile lifecycle
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/systems/projectileSystem.ts`
- `src/__tests__/projectileSystem.test.ts`

## Files to Modify
- `src/ecs/components.ts` - Add Projectile component
- `src/ecs/entityFactory.ts` - Add createProjectile
- `src/types/constants.ts` - Add ProjectileType, PROJECTILE_CONFIG
- `src/systems/combatSystem.ts` - Spawn projectiles for torpedoes
- `src/systems/index.ts` - Export projectile system
- `src/rendering/spriteManager.ts` - Add projectile sprites
- `src/core/Game.ts` - Integrate projectile system

## Testing Requirements
- Unit test: Projectile spawns with correct components
- Unit test: Projectile moves toward target
- Unit test: Projectile despawns on collision
- Unit test: Projectile despawns on lifetime expiry
- Unit test: Damage is applied on impact
- Performance test: Many active projectiles

## Technical Notes
- Use entity pooling for projectiles (frequent spawn/despawn)
- Projectile velocity is calculated from direction to target
- Consider leading target position for moving enemies
- Projectiles use same collision layers as combat
- Keep collision checks efficient (spatial hash)
- Despawn via `removeEntity` in bitECS

## Projectile Velocity Calculation
```typescript
function calculateProjectileVelocity(
  startX: number, startY: number,
  targetX: number, targetY: number,
  speed: number
): { vx: number; vy: number } {
  const dx = targetX - startX;
  const dy = targetY - startY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  if (dist === 0) return { vx: 0, vy: speed };
  
  return {
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed
  };
}
```

## Visual Rendering
```typescript
// In sprite creation
if (projectileType === ProjectileType.PHOTON_TORPEDO) {
  const graphics = new Graphics();
  graphics.circle(0, 0, config.size);
  graphics.fill({ color: config.color });
  // Add glow effect
  graphics.circle(0, 0, config.size * 1.5);
  graphics.fill({ color: config.color, alpha: 0.3 });
  return graphics;
}
```
