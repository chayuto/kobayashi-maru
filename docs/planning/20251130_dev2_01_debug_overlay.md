# Task 01: Debug Overlay System

## Objective
Implement a lightweight debug overlay to monitor game performance and entity counts.

## Context
As we scale to 5,000+ entities, we need real-time monitoring of FPS and entity counts to verify performance. This should be a standalone UI element that can be toggled.

## Requirements

### 1. Debug Manager (`src/core/DebugManager.ts`)
- **Properties:**
  - `fps`: number
  - `entityCount`: number
  - `container`: HTMLElement (div overlay)
- **Methods:**
  - `initialize()`: Create the DOM elements for the overlay (top-left corner).
  - `update(deltaTime)`: Update the FPS counter.
  - `updateEntityCount(count)`: Update the displayed entity count.
  - `toggle()`: Show/Hide the overlay.

### 2. Styling
- Use simple CSS (absolute positioning, white text, semi-transparent black background) to ensure it's visible on top of the canvas.
- **File:** `src/style.css` (add `.debug-overlay` class).

## Acceptance Criteria
- [ ] Debug overlay appears in the top-left corner.
- [ ] FPS counter updates in real-time.
- [ ] Entity count is displayed.
- [ ] Can be toggled on/off (e.g., via 'Backtick' key or a method call).
- [ ] Does not interfere with the canvas rendering.

## Files to Create/Modify
- `src/core/DebugManager.ts`
- `src/style.css`
