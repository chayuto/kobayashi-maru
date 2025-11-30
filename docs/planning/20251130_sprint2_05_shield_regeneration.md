# Task 05: Shield Regeneration System

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** HIGH  
**Estimated Effort:** 0.5-1 day

## Objective
Implement shield regeneration for entities with shields, adding tactical depth to combat.

## Context
Current shield implementation:
- `Shield` component exists with `current` and `max` values
- Combat system damages shields before health (`combatSystem.ts`)
- Kobayashi Maru has 200/200 shields, turrets have varying shields
- No regeneration - shields stay depleted

Shield regeneration adds:
- Recovery between attacks
- Strategic consideration (burst damage vs sustained)
- Visual feedback opportunity

## Requirements

### 1. Add Regeneration Properties (`src/ecs/components.ts`)
Extend or add component for regeneration:
```typescript
export const ShieldRegen = defineComponent({
  rate: Types.f32,          // Shield points per second
  delay: Types.f32,         // Seconds after last damage before regen starts
  lastDamageTime: Types.f32 // Game time when last damaged
});
```

### 2. Create Shield System (`src/systems/shieldSystem.ts`)
- **Query:** Entities with `Shield` and `ShieldRegen`
- **Update Logic:**
  ```typescript
  if (currentTime - lastDamageTime >= delay) {
    if (shield.current < shield.max) {
      shield.current = Math.min(shield.max, shield.current + rate * deltaTime);
    }
  }
  ```

### 3. Default Regeneration Rates
| Entity Type | Regen Rate | Delay |
|-------------|------------|-------|
| Kobayashi Maru | 10/s | 3.0s |
| Phaser Turret | 2/s | 2.0s |
| Torpedo Turret | 3/s | 2.0s |
| Disruptor Turret | 2.5/s | 2.0s |
| Klingon Ship | 1/s | 5.0s |
| Romulan Ship | 3/s | 3.0s |
| Borg Ship | 5/s | 2.0s |
| Tholian Ship | 2/s | 4.0s |
| Species 8472 | 0/s | - (no shields) |

### 4. Update Entity Factory
Add `ShieldRegen` component to entities in `entityFactory.ts`:
```typescript
addComponent(world, ShieldRegen, eid);
ShieldRegen.rate[eid] = REGEN_RATE;
ShieldRegen.delay[eid] = REGEN_DELAY;
ShieldRegen.lastDamageTime[eid] = 0;
```

### 5. Update Combat System
Track damage time in `combatSystem.ts`:
```typescript
// When applying damage to shields
if (hasComponent(world, ShieldRegen, targetEid)) {
  ShieldRegen.lastDamageTime[targetEid] = currentTime;
}
```

### 6. Integrate with Game Loop
Add shield system to `Game.ts`:
- Create after damage system
- Run after combat system in update loop
- Pass current game time

## Acceptance Criteria
- [ ] Shields regenerate after delay period
- [ ] Regeneration stops when taking damage
- [ ] Regeneration rate is configurable per entity
- [ ] Shields don't exceed max value
- [ ] Kobayashi Maru shields regenerate correctly
- [ ] Turret shields regenerate correctly
- [ ] Enemy shields regenerate (adding challenge)
- [ ] Different factions have different regen rates
- [ ] Performance impact is minimal
- [ ] Unit tests cover regeneration logic
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/systems/shieldSystem.ts`
- `src/__tests__/shieldSystem.test.ts`

## Files to Modify
- `src/ecs/components.ts` - Add ShieldRegen component
- `src/ecs/entityFactory.ts` - Add ShieldRegen to entities
- `src/systems/combatSystem.ts` - Track damage time
- `src/systems/index.ts` - Export shield system
- `src/core/Game.ts` - Integrate shield system

## Testing Requirements
- Unit test: Shield regenerates after delay
- Unit test: Damage resets delay timer
- Unit test: Shield doesn't exceed max
- Unit test: Zero rate means no regeneration
- Unit test: System handles entities without ShieldRegen
- Performance test: Many entities with shields

## Technical Notes
- Use game time (seconds) not frame count
- Keep regeneration calculation simple (linear rate)
- Consider visual indicator for shields regenerating
- Reference existing combat system damage application
- ShieldRegen is optional - entities without it don't regenerate

## Example Implementation

### Shield System
```typescript
export function createShieldSystem() {
  const shieldQuery = defineQuery([Shield, ShieldRegen]);
  
  return defineSystem((world: IWorld, deltaTime: number, currentTime: number) => {
    const entities = shieldQuery(world);
    
    for (const eid of entities) {
      const current = Shield.current[eid];
      const max = Shield.max[eid];
      
      // Skip if at max
      if (current >= max) continue;
      
      const lastDamage = ShieldRegen.lastDamageTime[eid];
      const delay = ShieldRegen.delay[eid];
      
      // Check if delay has passed
      if (currentTime - lastDamage >= delay) {
        const rate = ShieldRegen.rate[eid];
        Shield.current[eid] = Math.min(max, current + rate * deltaTime);
      }
    }
    
    return world;
  });
}
```

### Combat System Update
```typescript
// In applyDamage function, after damaging shields:
if (hasComponent(world, ShieldRegen, entityId)) {
  ShieldRegen.lastDamageTime[entityId] = currentTime;
}
```
