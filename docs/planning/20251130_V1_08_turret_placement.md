# Task 08: Turret Placement System

## Objective
Implement the logic for placing turrets on the game map using the mouse.

## Context
Players need to place defenses. This involves selecting a turret type, previewing the placement ("ghost"), and confirming the placement on click.

## Requirements

### 1. Placement Manager (`src/game/PlacementManager.ts`)
- **State:** `currentTurretType`, `isPlacing`.
- **Methods:**
  - `startPlacement(type)`: Set state to placing.
  - `cancelPlacement()`: Clear state.
  - `update()`: Update ghost position to match mouse.
  - `handleClick()`: If valid, spawn turret entity at location.

### 2. Validation
- Check if the location is valid (e.g., within bounds, not overlapping other turrets).
- Use a simple distance check against other entities for now.

### 3. Visual Feedback
- Show a semi-transparent "ghost" sprite at the mouse cursor when placing.
- Tint red if invalid, green/normal if valid.

## Acceptance Criteria
- [ ] Player can enter placement mode.
- [ ] Ghost sprite follows the mouse.
- [ ] Clicking places a real turret entity.
- [ ] Placement is validated (basic bounds check).
- [ ] Right-click or Escape cancels placement.

## Files to Create/Modify
- `src/game/PlacementManager.ts`
- `src/core/Game.ts` (integrate input handling)
