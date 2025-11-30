# Change Note: Visual Effects

**Date:** 2025-11-30
**Task:** Visual Effects and Polish

## Summary
Implemented visual effects to enhance game feel, including particles, health bars, and screen shake.

## Changes
- **New Components:**
    - `ParticleSystem`: Handles particle rendering and lifecycle.
    - `HealthBarRenderer`: Displays health bars above damaged entities.
    - `ScreenShake`: Manages camera shake effects.
    - `effectPresets`: Configuration for explosions, shield hits, etc.
- **System Updates:**
    - `DamageSystem`: Triggers explosions on entity death.
    - `CombatSystem`: Triggers muzzle flashes and shield hit effects.
    - `Game`: Initializes rendering systems and handles screen shake on player damage.

## Verification
- Unit tests added for `ParticleSystem`.
- Manual verification of effects in game loop.
