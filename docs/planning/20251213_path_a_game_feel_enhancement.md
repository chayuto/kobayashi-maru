# Path A: Game Feel Enhancement Plan

**Date:** 2025-12-13  
**Priority:** High  
**Estimated Effort:** 15-20 hours  
**Reference:** Game Improvement Research Proposals - Section 4.1 "Principles of Juice"

---

## Executive Summary

This path focuses on enhancing the player experience through improved visual and audio feedback ("juice"), making the game more satisfying to play. These changes provide immediate player-facing improvements without requiring significant architectural changes.

---

## Problem Statement

Current gaps in game feel:
1. **Limited visual feedback** on tower attacks and enemy hits
2. **No screen shake** for major events
3. **Basic damage numbers** without style
4. **Minimal audio cues** for game events
5. **Static UI** without dynamic feedback

---

## Proposed Changes

### Component 1: Visual Effects Enhancement

#### [MODIFY] src/systems/combatSystem.ts

Add hit impact effects:
- Muzzle flash on turret fire
- Impact particles on enemy hit
- Shield shimmer effect when shields absorb damage
- Death flash/explosion for enemy destruction

```typescript
// Example addition
interface HitEffectParams {
    position: { x: number; y: number };
    impactType: 'normal' | 'critical' | 'shielded';
    damageType: 'energy' | 'explosive' | 'kinetic';
}

function createHitEffect(params: HitEffectParams): void {
    // Create particle burst at hit location
    // Color based on damage type
    // Size based on impact type
}
```

#### [NEW] src/rendering/effects/ParticleManager.ts

Create centralized particle system:
- Object pooling for performance
- Multiple effect presets (explosion, spark, smoke)
- PixiJS ParticleContainer integration

---

### Component 2: Screen Effects

#### [NEW] src/rendering/effects/ScreenEffects.ts

Implement screen-level effects:
- **Screen shake** on boss appearance, base hit
- **Hit stop** (frame pause) on critical hits
- **Flash** on major events
- **Vignette** when health is critical

```typescript
interface ScreenEffect {
    shake(intensity: number, duration: number): void;
    hitStop(frames: number): void;
    flash(color: number, duration: number): void;
    setVignette(intensity: number): void;
}
```

---

### Component 3: Enhanced Damage Numbers

#### [MODIFY] src/ui/HUDManager.ts or [NEW] src/ui/DamageNumbers.ts

Improve damage number display:
- **Pooled text objects** for performance
- **Size scales** with damage amount
- **Color coding**: White (normal), Yellow (critical), Blue (shield)
- **Float-up animation** with easing
- **Aggregation** for clustered hits

---

### Component 4: Audio Feedback System

#### [NEW] src/audio/SFXManager.ts

Create structured sound effect management:
- Categorized sound pools (combat, UI, ambient)
- Positional audio (stereo panning)
- Sound variation (pitch randomization)
- Volume ducking for many simultaneous effects

> [!NOTE]
> This may require audio asset creation/sourcing. Plan assumes placeholder sounds initially.

---

### Component 5: UI Responsiveness

#### [MODIFY] src/ui/TurretMenu.ts

Add UI feedback:
- Button press effects
- Hover highlights
- Selection confirmation animation

#### [MODIFY] src/ui/HUDManager.ts

Add dynamic HUD effects:
- Resource flash on gain/spend
- Health bar pulse when low
- Wave indicator animation

---

## File Structure

```
src/
├── rendering/
│   └── effects/                    # NEW
│       ├── ParticleManager.ts      # Particle system
│       ├── ScreenEffects.ts        # Screen-level effects
│       └── EffectPresets.ts        # Effect configurations
├── audio/
│   └── SFXManager.ts               # NEW: Sound effects management
├── systems/
│   └── combatSystem.ts             # MODIFY: Add effect triggers
└── ui/
    ├── DamageNumbers.ts            # NEW: Enhanced damage display
    ├── HUDManager.ts               # MODIFY: Dynamic feedback
    └── TurretMenu.ts               # MODIFY: UI responsiveness
```

---

## Implementation Stages

### Stage 1: Screen Effects (4-5 hours)
1. Create `ScreenEffects.ts` with shake and flash
2. Integrate with base damage events
3. Integrate with boss spawn events

### Stage 2: Hit Effects (5-6 hours)
1. Create `ParticleManager.ts` with basic particles
2. Add muzzle flash to projectile creation
3. Add impact particles to damage application
4. Add death effects

### Stage 3: Damage Numbers (3-4 hours)
1. Create pooled damage number system
2. Add color coding and scaling
3. Add float animation

### Stage 4: Audio Integration (3-4 hours)
1. Create `SFXManager.ts` structure
2. Integrate with existing AudioManager
3. Add positional audio

---

## Verification Plan

### Automated Tests

```bash
# Run existing tests to ensure no regressions
npm run test

# Run linting
npm run lint

# Build check
npm run build
```

### Manual Verification

1. **Screen shake test:**
   - Start game, wait for wave with many enemies
   - Verify screen shakes when base is hit
   - Verify shake intensity feels appropriate

2. **Hit effect test:**
   - Observe turret firing
   - Verify muzzle flash appears
   - Verify impact particles on enemy hit

3. **Damage number test:**
   - Observe damage numbers floating up
   - Verify critical hits show larger/different color
   - Verify numbers don't cause performance issues with many enemies

4. **Performance test:**
   - Reach wave 15+ with many turrets
   - Monitor FPS in PerformanceMonitor
   - Ensure effects don't cause frame rate drops

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance degradation | Medium | High | Object pooling, particle limits |
| Over-juicy visuals | Low | Medium | Config flags to adjust intensity |
| Audio mixing issues | Low | Medium | Volume ducking, sound limits |

---

## Dependencies

- PixiJS v8 particle systems (already available)
- Existing AudioManager (needs review)
- None external

---

## Success Metrics

- [ ] Screen shake activates on base damage
- [ ] Hit particles visible on enemy damage
- [ ] Damage numbers display with animation
- [ ] No FPS drop below 30 at wave 20
- [ ] Positive player feedback (qualitative)

---

*Document Version: 1.0*
