# Task 03: Enemy Behavior AI Improvements

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** MEDIUM  
**Estimated Effort:** 2 days

## Objective
Improve enemy AI behavior to create more engaging gameplay, including evasion, flanking, and faction-specific behaviors.

## Context
Current enemy behavior is simplistic:
- Enemies spawn at edges and move in straight lines toward the center (Kobayashi Maru)
- No pathfinding (flow field system exists but isn't integrated)
- No reaction to turrets or damage
- All factions behave identically

Existing infrastructure:
- `Velocity` component for movement direction/speed
- `movementSystem.ts` applies velocity to position
- `pathfinding/` folder with `flowField.ts`, `grid.ts`, `integrationField.ts`, `costField.ts`
- `waveManager.ts` spawns enemies with velocity toward center

## Requirements

### 1. Create AI Component (`src/ecs/components.ts`)
Add new component for AI state:
```typescript
export const AIBehavior = defineComponent({
  behaviorType: Types.ui8,    // Behavior pattern (0=direct, 1=strafe, 2=flank)
  stateTimer: Types.f32,      // Timer for state changes
  targetX: Types.f32,         // Intermediate target X
  targetY: Types.f32,         // Intermediate target Y
  aggression: Types.f32       // How aggressively to pursue (0-1)
});
```

### 2. Behavior Types Enum (`src/types/constants.ts`)
```typescript
export const AIBehaviorType = {
  DIRECT: 0,      // Bee-line to target (Klingon default)
  STRAFE: 1,      // Side-to-side movement while approaching (Romulan)
  FLANK: 2,       // Circle around to attack from side (Tholian)
  SWARM: 3,       // Move as group toward nearest threat (Borg)
  HUNTER: 4       // Aggressive pursuit, targets turrets (Species 8472)
} as const;
```

### 3. Create AI System (`src/systems/aiSystem.ts`)
- **Query:** Entities with `Position`, `Velocity`, `AIBehavior`, `Faction`
- **Update Logic:**
  - Direct: Move straight to Kobayashi Maru
  - Strafe: Sinusoidal movement pattern while advancing
  - Flank: Arc toward target from side angle
  - Swarm: Average position of nearby allies, move as group
  - Hunter: Prioritize nearest turret, then Kobayashi Maru

### 4. Faction-Specific Defaults
Update `entityFactory.ts` to assign behaviors:
| Faction | Default Behavior | Aggression |
|---------|------------------|------------|
| Klingon | DIRECT | 1.0 (very aggressive) |
| Romulan | STRAFE | 0.6 (cautious) |
| Borg | SWARM | 0.8 (relentless) |
| Tholian | FLANK | 0.5 (tactical) |
| Species 8472 | HUNTER | 1.0 (deadly) |

### 5. Evasion Behavior
When under fire (health decreased):
- Temporary velocity perpendicular to attacker direction
- Short evasion duration (0.5-1s)
- Probability based on aggression (lower aggression = more evasion)

### 6. Target Acquisition for Hunters
Species 8472 should:
- Query spatial hash for nearby turrets
- Prioritize turrets over Kobayashi Maru
- Switch targets dynamically

### 7. Integrate with Game Loop
Update `Game.ts`:
- Create AI system after movement system
- Run AI system before movement system in update loop

## Acceptance Criteria
- [ ] Each faction has distinct movement patterns
- [ ] Klingons charge directly at target
- [ ] Romulans strafe side-to-side while approaching
- [ ] Borg move in coordinated groups
- [ ] Tholians flank from the sides
- [ ] Species 8472 prioritize destroying turrets
- [ ] Enemies occasionally evade when taking damage
- [ ] AI behavior is configurable via component values
- [ ] Performance remains smooth with 100+ enemies
- [ ] Unit tests cover all behavior types
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/systems/aiSystem.ts`
- `src/__tests__/aiSystem.test.ts`

## Files to Modify
- `src/ecs/components.ts` - Add AIBehavior component
- `src/ecs/entityFactory.ts` - Assign AI behaviors
- `src/types/constants.ts` - Add AIBehaviorType enum
- `src/systems/index.ts` - Export AI system
- `src/core/Game.ts` - Integrate AI system

## Testing Requirements
- Unit tests for each behavior type calculation
- Test state transitions (evasion trigger)
- Test faction default assignments
- Performance test with many enemies
- Test target acquisition for Hunter behavior

## Technical Notes
- Keep AI calculations lightweight (no pathfinding per frame)
- Use delta time for smooth behavior
- Consider caching nearest turret for Hunter behavior
- Strafe pattern: `offsetX = sin(gameTime * frequency) * amplitude`
- Flank pattern: Calculate perpendicular approach vector

## Behavior Examples

### Direct Movement
```typescript
const dx = targetX - posX;
const dy = targetY - posY;
const dist = Math.sqrt(dx*dx + dy*dy);
velocity.x = (dx / dist) * speed;
velocity.y = (dy / dist) * speed;
```

### Strafe Movement
```typescript
const baseDir = normalize(target - position);
const perpDir = { x: -baseDir.y, y: baseDir.x };
const strafeOffset = Math.sin(gameTime * 3) * 0.3; // 3 Hz, 30% perpendicular
velocity = baseDir * speed + perpDir * speed * strafeOffset;
```

### Flank Movement
```typescript
const toTarget = normalize(target - position);
const flankAngle = Math.PI / 4; // 45 degrees
const flankDir = rotateVector(toTarget, flankAngle);
velocity = flankDir * speed;
```
