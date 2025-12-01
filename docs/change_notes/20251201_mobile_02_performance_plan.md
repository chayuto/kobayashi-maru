# Mobile Browser Support - Phase 2: Performance

## Goal Description
The goal of this phase is to ensure Kobayashi Maru runs smoothly on mobile devices and provides necessary controls that are missing due to lack of keyboard. This includes adding virtual buttons for essential actions, detecting device performance capabilities, and scaling visual quality accordingly.

## User Review Required
> [!IMPORTANT]
> This phase introduces performance scaling which may reduce visual fidelity on lower-end devices. Please review the proposed quality tiers.

## Proposed Changes

### Mobile Controls
#### [NEW] [MobileControlsOverlay.ts](file:///Users/chayut/repos/kobayashi-maru/src/ui/MobileControlsOverlay.ts)
- Add virtual buttons for "Pause" (ESC) and "Restart" (R).
- Add a toggle for "Debug" (Backtick) - maybe hidden or gesture-based? Let's stick to a visible button for now or a settings menu.
- Position buttons unobtrusively.

#### [MODIFY] [HUDManager.ts](file:///Users/chayut/repos/kobayashi-maru/src/ui/HUDManager.ts)
- Integrate `MobileControlsOverlay`.
- Ensure it respects `ResponsiveUIManager`.

### Performance System
#### [MODIFY] [PerformanceMonitor.ts](file:///Users/chayut/repos/kobayashi-maru/src/core/PerformanceMonitor.ts)
- Add device capability detection (tiering).
- Track FPS trends to suggest quality adjustments.

#### [NEW] [QualityManager.ts](file:///Users/chayut/repos/kobayashi-maru/src/core/QualityManager.ts)
- Define quality tiers: HIGH, MEDIUM, LOW.
- Manage settings for:
    - Particle count
    - Starfield density
    - Bloom/Post-processing (if any)
    - Max entity count (soft limit)

### Rendering Optimization
#### [MODIFY] [Game.ts](file:///Users/chayut/repos/kobayashi-maru/src/core/Game.ts)
- Integrate `QualityManager`.
- Adjust game loop based on quality settings (e.g., limit particle updates).

#### [MODIFY] [ParticleSystem.ts](file:///Users/chayut/repos/kobayashi-maru/src/rendering/ParticleSystem.ts)
- Respect quality settings for max particles.

#### [MODIFY] [Starfield.ts](file:///Users/chayut/repos/kobayashi-maru/src/rendering/Starfield.ts)
- Reduce star count on lower quality tiers.

## Verification Plan

### Automated Tests
- Unit tests for `QualityManager` and `PerformanceMonitor` extensions.

### Manual Verification
- **Controls**: Verify virtual buttons trigger correct actions (Pause, Restart).
- **Performance**:
    - Force different quality tiers and verify visual changes (fewer stars/particles).
    - Test on mobile device (or throttled Chrome DevTools) to see if FPS improves with lower settings.
