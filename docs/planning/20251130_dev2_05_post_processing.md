# Task 05: Post-Processing Effects

## Objective
Implement a post-processing pipeline to add visual polish (Bloom, CRT effect).

## Context
To make the game feel "premium" and "arcade-like", we want to add full-screen effects. PixiJS supports filters that can be applied to the stage.

## Requirements

### 1. Effects Manager (`src/rendering/EffectsManager.ts`)
- **Methods:**
  - `initialize(app: Application)`
  - `enableBloom(strength: number)`
  - `enableCRT(curvature: number)` (optional)
  - `disableAll()`

### 2. Implementation
- Use `pixi-filters` (check if installed, or implement simple custom shaders).
- **Bloom:** Adds a glow to bright objects (lasers, explosions).
- Apply filters to the `app.stage`.

## Acceptance Criteria
- [ ] Bloom effect makes bright colors glow.
- [ ] Effects can be toggled on/off.
- [ ] Performance impact is monitored (filters can be expensive).

## Files to Create/Modify
- `src/rendering/EffectsManager.ts`
