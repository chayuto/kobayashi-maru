# Refactor HUDManager Decoupling

## Summary
Decoupled `HUDManager` from the core `Game` class to improve architectural separation and testability. The `HUDManager` no longer depends on `GameInterface` but instead receives state via `HUDData` and triggers actions via callbacks.

## Changes
- **Modified** `src/ui/types.ts`: Added `godModeEnabled` and `slowModeEnabled` to `HUDData` interface.
- **Modified** `src/ui/HUDManager.ts`:
    - Removed `GameInterface` dependency.
    - Added `HUDCallbacks` interface for cleaner action handling.
    - Updated initialization to accept optional callbacks.
    - Implemented local state tracking for cheat modes rooted in `HUDData`.
- **Modified** `src/core/managers/UIController.ts`:
    - Updated `init` to pass cheat mode callbacks to `HUDManager`.
    - Updated `updateHUD` to populate cheat mode state from `GameplaySnapshot`.
    - Removed `setGameRef` method and property.
- **Modified** `src/core/Game.ts`:
    - Implemented `onToggleGodMode` and `onToggleSlowMode` callbacks.
    - Removed call to `uiController.setGameRef`.
- **Modified** `src/ui/components/ToggleButton.ts`:
    - Updated `onClick` signature to allow `void` return type, enabling fire-and-forget callbacks that rely on external state updates.

## Verification
- **Automated Tests**:
    - Ran `npm test src/__tests__/HUDManager.test.ts` -> **Passed** (26 tests).
    - Verified new tests for cheat mode initialization and state updates.
    - Ran full test suite to ensure no regressions.
- **Impact Analysis**:
    - Low risk: The change is purely refactoring how the UI triggers actions and receives state.
    - High impact: Removes a circular interaction pattern and enables proper unit testing of UI logic without mocking the entire Game engine.
