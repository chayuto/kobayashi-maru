# Performance Guidelines
**Date:** 2024-05-22
**Status:** Active

## Overview

Kobayashi Maru targets 60 FPS with 5,000+ entities. Performance is a primary concern.

## ECS Performance

### 1. Queries
- **Cache Queries**: `defineQuery` should be called once (module level), not inside the loop.
- **Iterating**: Iterating over query results is fast, but minimize work inside the loop.

### 2. Components
- **TypedArrays**: bitECS uses TypedArrays. Access is fast.
- **Data Layout**: Keep related data together to improve cache locality (handled by bitECS).

### 3. Systems
- **Early Exit**: If a system doesn't need to run every frame, add a check (e.g., run every 10 frames or use a timer).
- **Delta Time**: Use `dt` for frame-rate independent movement.

## Rendering Performance (PixiJS)

### 1. Batching
- Use `ParticleContainer` for high-count sprites (bullets, enemies) if they don't change texture often.
- PixiJS 8 handles batching well, but be mindful of draw calls.

### 2. Object Creation
- **Pooling**: NEVER create `PIXI.Sprite` or `PIXI.Graphics` inside the game loop. Use `PoolManager` or pre-allocate.
- **GC Pressure**: Frequent allocation/deallocation causes Garbage Collection pauses. Reuse objects.

### 3. Culling
- Don't render what's off-screen. (Though Pixi handles some, manual culling for logic is good).

## General JavaScript/TypeScript

- **Loops**: `for` loops are generally faster than `forEach`.
- **Math**: Avoid `Math.sqrt` if you can compare squared distances.
- **Closures**: Avoid creating closures inside hot loops.

## Profiling
- Use the **PerformanceMonitor** (in-game debug overlay).
- Use Chrome DevTools "Performance" tab to find bottlenecks.
