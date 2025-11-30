# Library Usage: PixiJS (v8.1.0)

## Overview
PixiJS is the rendering engine for Kobayashi Maru. It provides a fast, WebGL/WebGPU-based 2D rendering pipeline. Version 8 introduces a new WebGPU backend, which we prefer for performance.

## Current Implementation

### 1. Initialization (`src/core/Game.ts`)
The `Application` is initialized with specific preferences for high performance:
```typescript
await this.app.init({
  width: GAME_CONFIG.WORLD_WIDTH,
  height: GAME_CONFIG.WORLD_HEIGHT,
  preference: 'webgpu', // Prefer WebGPU
  autoDensity: true,
  antialias: true
});
```

### 2. Sprite Management (`src/rendering/SpriteManager.ts`)
To handle 5,000+ entities at 60 FPS, we use `ParticleContainer` (or its v8 equivalent) instead of standard `Container` or `Sprite` objects.
- **Batch Rendering**: Entities are grouped by texture (Faction) into separate containers.
- **Object Pooling**: `SpriteManager` maintains a pool of `Particle` objects to avoid garbage collection spikes.
- **Texture Generation**: Textures are procedurally generated using `Graphics` and cached (`src/rendering/textures.ts`).

### 3. Integration with ECS
The `RenderSystem` (`src/systems/renderSystem.ts`) bridges ECS and PixiJS:
- Queries entities with `Position`, `SpriteRef`, etc.
- Updates the corresponding PixiJS particle position/rotation based on ECS component data.
- **Interpolation**: Currently direct mapping, but future improvements could add alpha-based interpolation for smoother movement.

## Best Practices for Extension
- **Avoid `new Sprite()`**: Always use `SpriteManager` to recycle objects.
- **Use Containers**: Group related visual elements (UI, Game World, Background) into Layers.
- **Texture Atlas**: For future assets, use a Texture Atlas (Sprite Sheet) to reduce draw calls further.
- **Culling**: Implement view frustum culling if the world grows larger than the viewport.

## Optimization Opportunities
- **Custom Shaders**: Use PixiJS filters/shaders for complex effects (shields, damage) instead of CPU-side logic.
- **WebGPU Compute**: Explore offloading particle logic to WebGPU compute shaders if using v8's advanced features.
