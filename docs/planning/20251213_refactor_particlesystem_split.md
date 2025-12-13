# Refactoring: Split ParticleSystem

## Overview
Split 583-line `ParticleSystem` into focused components.

**Effort:** ~3 hours | **Impact:** High

---

## Current Problems

[ParticleSystem.ts](file:///Users/chayut/repos/kobayashi-maru/src/rendering/ParticleSystem.ts) handles:
- Object pooling
- Spawn patterns (circular, cone, burst, etc.)
- Physics (velocity, gravity, bounce)
- Rendering (multiple sprite types)
- Trail effects

---

## Proposed Structure

```
src/rendering/particles/
├── index.ts              # Barrel export
├── ParticleSystem.ts     # Orchestration (~100 lines)
├── ParticlePool.ts       # Object pooling
├── ParticleEmitter.ts    # Spawn patterns + velocity
├── ParticlePhysics.ts    # Update, bounce, gravity
└── ParticleRenderer.ts   # Draw by sprite type
```

---

## Key Extractions

| New File | Methods to Extract |
|----------|-------------------|
| `ParticlePool` | `getParticle`, `returnToPool`, pool management |
| `ParticleEmitter` | `spawn`, `calculateEmitterVelocity` |
| `ParticlePhysics` | `update` (physics portion), bounce logic |
| `ParticleRenderer` | `drawParticle`, `renderTrail`, color interpolation |

---

## Steps

1. [ ] Create `src/rendering/particles/` directory
2. [ ] Create `ParticlePool.ts` with pooling
3. [ ] Create `ParticleEmitter.ts` with spawn patterns
4. [ ] Create `ParticlePhysics.ts` with physics
5. [ ] Create `ParticleRenderer.ts` with drawing
6. [ ] Update `ParticleSystem.ts` to orchestrate
7. [ ] Create `index.ts` exports
8. [ ] Update imports in consuming files
9. [ ] Verify: lint and tests pass
