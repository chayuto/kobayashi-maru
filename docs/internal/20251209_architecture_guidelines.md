# Architecture Guidelines
**Date:** 2024-05-22
**Status:** Active

## Overview

Kobayashi Maru is built using a **Data-Oriented Design** approach with **Entity Component System (ECS)** architecture. This ensures high performance for a large number of entities (5,000+) and separation of concerns.

## Core Libraries

- **bitECS**: High-performance ECS library using TypedArrays.
- **PixiJS**: WebGL/WebGPU rendering engine.
- **Vite**: Build tool and dev server.

## Directory Structure

```
src/
├── core/           # Game loop, bootstrap, and high-level managers (Game.ts)
├── ecs/            # ECS definitions: Components, Worlds, Entity Factory
├── systems/        # Logic: Movement, Combat, Rendering, etc.
├── rendering/      # Visuals: Sprites, Particles, Effects (PixiJS specific)
├── ui/             # User Interface (DOM/Canvas overlay)
├── game/           # Game Logic Managers: Waves, Scores, Resources
├── audio/          # Audio System
├── config/         # Game configurations (constants, balance settings)
└── utils/          # Helper functions and data structures
```

## Architectural Principles

### 1. ECS Pattern (The "Heart")
- **Entities**: Just integers (IDs).
- **Components**: Pure data (TypedArrays). No methods.
- **Systems**: Pure logic. Iterate over entities with specific components.

**Rule:** Do not store game logic in components. Do not store state in systems (unless it's transient frame data).

### 2. The Core Loop
The `GameLoopManager` in `core/loop/` orchestrates the frame:
1. **Pre-Update**: Background updates.
2. **Gameplay**: Game managers (Wave, Score).
3. **Physics/ECS**: Run all ECS systems.
4. **Render**: Update visuals based on ECS state.
5. **Post-Render**: Screen effects.
6. **UI**: Update HUD.

### 3. Separation of Concerns
- **Logic vs. View**: ECS systems handle logic. `RenderingSystem` syncs ECS state to PixiJS sprites.
- **Managers vs. Systems**: "Managers" (e.g., `WaveManager`) handle high-level game flow/meta-game. "Systems" handle entity-level behavior.

## Extending the Architecture

### Adding a New Feature
1. **Define Data**: Create new components in `src/ecs/components.ts`.
2. **Define Logic**: Create a new system in `src/systems/`.
3. **Register System**: Add the system to `registerSystems` in `src/core/Game.ts`.
4. **Visuals (Optional)**: If visible, update `RenderSystem` or create a specialized renderer in `src/rendering/`.

### State Management
- **Game State**: Global state (score, wave, resources) lives in `src/game/`.
- **Entity State**: Lives in ECS components.

## Common Pitfalls
- **Avoid Object allocation in loop**: Reuse objects or use pools (`PoolManager`).
- **Don't mix Logic and UI**: UI should observe state, not drive it directly.
