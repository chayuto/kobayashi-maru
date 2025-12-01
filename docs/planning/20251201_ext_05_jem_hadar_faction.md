# Jem'Hadar Faction (Dominion)

**Date:** December 1, 2025  
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** None  
**Phase:** 1 - Week 1

## Objective

Add Jem'Hadar enemy faction with KAMIKAZE behavior - when health drops below 15%, they enter "ramming speed" mode and charge the Kobayashi Maru.

## Faction Stats

- **Geometry:** Sharp triangle (scarab-like)
- **Color:** #9966CC (Purple)
- **Behavior:** KAMIKAZE
- **HP:** 60
- **Shield:** 0
- **Speed:** 80 (160 when frenzied)
- **Damage:** 8 normal, 50 on collision
- **Spawn Wave:** 8+

## Implementation

### File: `src/types/constants.ts` (modify)

```typescript
export const FACTION_CONFIGS = {
  // ... existing factions
  
  DOMINION: {
    id: 'dominion',
    name: "Jem'Hadar",
    color: 0x9966CC,
    shape: 'triangle',
    health: 60,
    shield: 0,
    speed: 80,
    damage: 8,
    behavior: 'KAMIKAZE',
    spawnWave: 8,
    
    // Special mechanics
    frenzyThreshold: 0.15,  // 15% health
    frenzySpeedMultiplier: 2.0,
    ramDamage: 50
  }
};
```

### File: `src/systems/aiSystem.ts` (modify)

Add KAMIKAZE behavior:

```typescript
export enum AIBehaviorType {
  DIRECT = 0,
  STRAFE = 1,
  FLANK = 2,
  SWARM = 3,
  HUNTER = 4,
  KAMIKAZE = 5  // NEW
}

// In AI system update
function updateKamikazeBehavior(eid: number, world: World): void {
  const healthPercent = Health.current[eid] / Health.max[eid];
  
  // Check frenzy threshold
  if (healthPercent <= 0.15) {
    // Enter frenzy mode
    if (!hasComponent(world, FrenziedStatus, eid)) {
      addComponent(world, FrenziedStatus, eid);
      
      // Double speed
      Velocity.x[eid] *= 2.0;
      Velocity.y[eid] *= 2.0;
      
      // Change target to Kobayashi Maru
      const kmEid = getKobayashiMaru(world);
      Target.entityId[eid] = kmEid;
    }
  }
  
  // Move toward target (direct path)
  moveTowardTarget(eid, world);
}
```

### File: `src/ecs/components.ts` (modify)

Add frenzied status component:

```typescript
export const FrenziedStatus = defineComponent({
  active: Types.ui8
});
```

### File: `src/systems/collisionSystem.ts` (modify)

Add ramming damage:

```typescript
// When Jem'Hadar collides with Kobayashi Maru
if (hasComponent(world, FrenziedStatus, enemyEid)) {
  const ramDamage = 50;
  Health.current[kmEid] -= ramDamage;
  
  // Destroy Jem'Hadar
  removeEntity(world, enemyEid);
}
```

### File: `src/game/EnemyFactory.ts` (modify)

Add Jem'Hadar creation logic.

## Testing

- [ ] Jem'Hadar spawn at wave 8+
- [ ] Purple triangle shape
- [ ] Normal behavior until 15% health
- [ ] Speed doubles when frenzied
- [ ] Targets Kobayashi Maru when frenzied
- [ ] Deals 50 damage on collision
- [ ] Self-destructs after ramming
- [ ] Visual indicator for frenzy (glow/trail)

## Success Criteria

- ✅ Jem'Hadar faction added
- ✅ KAMIKAZE AI behavior works
- ✅ Frenzy triggers at 15% health
- ✅ Ramming damage applied
- ✅ Balanced and fun mechanic
- ✅ Visual feedback for frenzy state

## Related Files

- `src/types/constants.ts`
- `src/systems/aiSystem.ts`
- `src/ecs/components.ts`
- `src/systems/collisionSystem.ts`
- `src/game/EnemyFactory.ts`
