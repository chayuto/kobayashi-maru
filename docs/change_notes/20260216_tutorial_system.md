# Tutorial System Implementation

**Date:** 2026-02-16
**Type:** New Feature
**Scope:** Game, UI, Events, Config

## Summary

Implemented a progressive disclosure tutorial system that guides first-time players through the first 3 waves. The tutorial shows contextual tips about turret placement, upgrades, and faction strategy. Completion is persisted to localStorage so returning players are not shown the tutorial again.

## Changes

### New Files

- **`src/game/TutorialManager.ts`** - Manages tutorial state and progression. Subscribes to WAVE_STARTED events to trigger appropriate tutorial steps. Auto-advances through steps based on timing. Persists completion state to localStorage.

- **`src/ui/overlays/TutorialOverlay.ts`** - PixiJS overlay that displays tutorial messages. Uses the same FADE_IN -> HOLD -> FADE_OUT animation state machine as WaveAnnouncement and AlertStatusOverlay. LCARS-styled panel with skip button.

- **`src/__tests__/TutorialManager.test.ts`** - 18 tests covering: first-time player detection, localStorage persistence, wave event progression, step timing, skip/complete behavior, event subscription lifecycle, inactive state handling, and localStorage error handling.

### Modified Files

- **`src/types/events.ts`** - Added `TUTORIAL_STEP` and `TUTORIAL_COMPLETE` event types with payloads (`TutorialStepPayload`, `TutorialCompletePayload`, `TutorialStep`, `TutorialStepPosition`).

- **`src/config/ui.config.ts`** - Added `TUTORIAL` section with panel dimensions, animation timing, position coordinates, z-index, and localStorage key.

- **`src/core/services/ServiceContainer.ts`** - Added `tutorialManager` and `tutorialOverlay` to `ServiceRegistry`. Added type imports.

- **`src/core/bootstrap/GameBootstrap.ts`** - Registered `tutorialManager` and `tutorialOverlay` service factories.

- **`src/core/Game.ts`** - Added `initTutorial()` method called from `startGame()`. Tutorial manager update added to gameplay loop. Tutorial overlay update added to UI loop.

## Tutorial Steps

| Step | Wave | Duration | Position | Message |
|------|------|----------|----------|---------|
| 0 | 1 | 8s | center | Welcome, Commander. Select a turret... |
| 1 | 1 | 6s | top | Turrets fire automatically... |
| 2 | 2 | 6s | top | Click on a placed turret to upgrade... |
| 3 | 3 | 6s | top | Different weapons are effective... |

## Architecture

- TutorialManager subscribes to WAVE_STARTED events to trigger steps
- TutorialManager emits TUTORIAL_STEP events when steps should display
- TutorialOverlay subscribes to TUTORIAL_STEP and TUTORIAL_COMPLETE events
- Skip button on overlay calls TutorialManager.skip() via callback
- All communication is through EventBus (no direct references)

## Validation

- `pnpm run lint` - passed
- `pnpm run test` - 2516 tests passed (113 files), including 18 new tutorial tests
- `pnpm run build` - passed (TypeScript check + Vite production build)
