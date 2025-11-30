# Task 10: Turret Targeting and Combat System

## Objective
Implement the automatic targeting and combat logic for turrets, enabling them to detect and damage enemies within range.

## Context
Task 09 added turret placement. This task makes turrets functional by adding targeting AI and damage dealing.

## Requirements

### 1. Create Targeting System (`src/systems/targetingSystem.ts`)
- Query all turret entities each frame
- For each turret:
  1. Use spatial hash to find enemies in range
  2. Select target using priority rules:
     - Closest enemy
     - Or: Lowest health enemy
     - Or: Highest threat enemy
  3. Store target entity ID in turret component
- Handle target loss (enemy dies or leaves range)

### 2. Add Target Component (`src/ecs/components.ts`)
- `Target.entityId: Types.ui32` - current target entity ID
- `Target.hasTarget: Types.ui8` - 0/1 flag

### 3. Create Combat System (`src/systems/combatSystem.ts`)
- Process turrets with valid targets
- Check fire rate cooldown
- If ready to fire:
  1. Create projectile or instant hit based on weapon type
  2. Apply damage to target
  3. Reset fire cooldown
- Handle different weapon types:
  - Beam: Instant hit, draw line for 1 frame
  - Projectile: Spawn entity that travels to target

### 4. Create Damage System (`src/systems/damageSystem.ts`)
- Apply damage from projectile hits
- Reduce target Health/Shield components
- Handle shield damage priority (damage shields first)
- Destroy entities when health <= 0
- Return destroyed entities to pool

### 5. Visual Feedback
- Draw beam lines (PixiJS Graphics)
- Spawn projectile sprites
- Flash target when hit
- Particle effect on enemy death (optional)

## Acceptance Criteria
- [ ] Turrets detect enemies in range
- [ ] Turrets fire at appropriate rate
- [ ] Damage reduces enemy health
- [ ] Enemies die when health reaches 0
- [ ] Beam weapons show visual line
- [ ] Dead enemies return to entity pool
- [ ] No TypeScript compilation errors

## Files to Create/Modify
- `src/systems/targetingSystem.ts` (new)
- `src/systems/combatSystem.ts` (new)
- `src/systems/damageSystem.ts` (new)
- `src/systems/index.ts` (modify to export)
- `src/ecs/components.ts` (modify - add Target)
- `src/core/Game.ts` (modify)

## Technical Notes
- Use spatial hash query with turret range as radius
- Fire rate of 2 = 2 shots per second = 500ms cooldown
- Beam weapons: draw Graphics line from turret to target
- Shield absorbs damage first, then hull takes damage
- Consider damage types for future rock-paper-scissors mechanic
