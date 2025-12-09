# Advanced Particle System Testing Guide

This guide helps you visually verify the new particle system effects in Kobayashi Maru.

## How to Test

1. Build and run the game:
   ```bash
   npm run dev
   ```

2. Open your browser to http://localhost:3000

3. During gameplay, observe the following effects:

## New Effect Presets to Observe

### 1. FIRE_EXPLOSION
- **When:** Enemy ships are destroyed
- **Expected:** White flash → yellow → orange → red fade
- **Features:** Fire sprite, color gradient, circular pattern

### 2. IMPACT_SPARKS
- **When:** Projectiles hit targets
- **Expected:** White sparks with orange trails spreading in cone pattern
- **Features:** Spark sprite, trails, cone emitter pattern

### 3. PLASMA_TRAIL
- **When:** Plasma weapon projectiles travel
- **Expected:** Green energy particles following projectile
- **Features:** Energy sprite, burst pattern, gradient fade

### 4. SMOKE_PLUME
- **When:** Damaged ships or explosions
- **Expected:** Dark smoke rising upward, expanding in size
- **Features:** Smoke sprite, negative gravity (rises), scale animation, drag

### 5. ENERGY_BURST
- **When:** Shield impacts
- **Expected:** Cyan energy ring expanding outward
- **Features:** Energy sprite, ring pattern, cyan gradient

### 6. STAR_BURST
- **When:** Special explosions or critical hits
- **Expected:** Rotating yellow stars spreading outward
- **Features:** Star sprite, rotation animation, yellow→orange gradient

### 7. SPIRAL_VORTEX
- **When:** Energy weapons or special effects
- **Expected:** Purple particles in spiral pattern
- **Features:** Square sprite, spiral emitter, rotation

### 8. FOUNTAIN_SPRAY
- **When:** Special effects or power-ups
- **Expected:** Cyan particles arcing upward then falling
- **Features:** Circular sprite, fountain pattern, gravity, drag

### 9. DEBRIS_SHOWER
- **When:** Ship destruction with heavy damage
- **Expected:** Gray rotating squares falling downward
- **Features:** Square sprite, rotation, gravity, fade

### 10. ELECTRIC_DISCHARGE
- **When:** Energy weapon impacts
- **Expected:** White-cyan electric sparks in ring pattern with trails
- **Features:** Spark sprite, ring pattern, trails

### 11. WARP_FLASH
- **When:** Special warp effects or transitions
- **Expected:** White stars expanding rapidly in ring, scaling up
- **Features:** Star sprite, ring pattern, scale animation

## Features to Verify

### Sprite Types
Each effect should show different particle shapes:
- Circle (default, round particles)
- Square (rectangular particles)
- Star (5-pointed star shape)
- Spark (elongated diamond for electricity/impacts)
- Smoke (soft round clouds)
- Fire (irregular flickering shape)
- Energy (hexagonal shape)

### Color Gradients
Particles should smoothly transition through colors over their lifetime:
- Fire: White → Yellow → Orange → Red
- Energy: Cyan → Blue → Dark Blue
- Smoke: Dark Gray → Medium Gray → Light Gray

### Trail Effects
Some particles leave trails behind them:
- Impact sparks have white trails
- Electric discharge has cyan trails
- Trails should fade from bright at the head to transparent at the tail

### Emitter Patterns
Observe different emission patterns:
- **Circular**: Random spread in all directions (most explosions)
- **Cone**: Limited angle spread (impact sparks, muzzle flash)
- **Ring**: Equal spread around circle (energy burst, electric discharge)
- **Spiral**: Particles spiral outward (vortex effects)
- **Burst**: All particles same direction (plasma trail)
- **Fountain**: Arc upward (fountain spray)

### Physics
Watch for realistic physics:
- **Gravity**: Fountain spray arcs up then falls, debris falls down, smoke rises up
- **Drag**: Particles slow down over time (smoke, fountain spray)

### Animation
Check for smooth animations:
- **Rotation**: Stars and debris should rotate as they move
- **Scale**: Smoke expands in size, warp flash grows larger

## Performance Testing

### Particle Budget Test
1. Create many explosions quickly
2. System should cap at 2000 particles maximum
3. Frame rate should stay at 60 FPS or above
4. No memory leaks over extended play

### Spawn Rate Multiplier
The particle system respects the spawn rate multiplier for performance scaling:
- Low-end devices get fewer particles
- High-end devices get full particle count

## Integration with Game Systems

### Damage System
- `EXPLOSION_LARGE`: Large enemy destruction
- `EXPLOSION_SMALL`: Small enemy destruction

### Combat System
- `SHIELD_HIT`: Shield impacts
- `MUZZLE_FLASH`: Turret firing

### Enemy Collision System
- `EXPLOSION_LARGE`: Enemy collision with Kobayashi Maru

## Manual Test Checklist

- [ ] All sprite types render correctly (not all circles)
- [ ] Color gradients transition smoothly
- [ ] Trails render with proper fade
- [ ] All emitter patterns work correctly
- [ ] Gravity effects visible (falling/rising particles)
- [ ] Drag effects visible (slowing particles)
- [ ] Rotation animations smooth
- [ ] Scale animations work
- [ ] Particle budget enforced (2000 max)
- [ ] No memory leaks after extended play
- [ ] 60 FPS maintained with many particles
- [ ] Backward compatibility (old effects still work)

## Debug Console Commands

You can spawn effects directly from the browser console:

```javascript
// Access the particle system
const game = window.game; // Game instance should be exposed
const particleSystem = game.particleSystem;

// Test fire explosion at center
particleSystem.spawn({
    ...EFFECTS.FIRE_EXPLOSION,
    x: 960,
    y: 540
});

// Test impact sparks
particleSystem.spawn({
    ...EFFECTS.IMPACT_SPARKS,
    x: 500,
    y: 500
});
```

## Known Limitations

1. **Graphics-based rendering**: Particles are drawn with Graphics API, not texture-based
2. **Performance**: With 2000 particles and color gradients, expect ~60 FPS on modern hardware
3. **Fire sprite**: Uses deterministic pseudo-random for consistent shape (based on position)

## Troubleshooting

**All particles look like circles:**
- This was fixed - ensure you have the latest version
- Check that `spriteType` is being preserved through particle lifecycle

**Colors don't change:**
- Verify `colorGradient` is defined in the effect preset
- Check that gradient interpolation is working in update loop

**No trails visible:**
- Ensure `trail.enabled` is true
- Check that trail graphics are being added to container
- Verify trail positions are being updated

**Physics not working:**
- Check `gravity` and `drag` values in config
- Verify physics is being applied in update loop

## Success Criteria

✅ All 7 sprite types visible and distinct
✅ Color gradients transition smoothly
✅ Trails visible and fading properly
✅ All 6 emitter patterns working
✅ Gravity and drag effects visible
✅ Rotation and scale animations smooth
✅ 2000 particle budget enforced
✅ 60 FPS maintained
✅ No visual regressions from old system
