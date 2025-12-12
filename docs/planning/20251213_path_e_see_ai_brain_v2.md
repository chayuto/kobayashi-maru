# Path E: "See AI Brain" Feature Implementation Plan v2

**Date:** 2025-12-13  
**Priority:** High (User Feature)  
**Estimated Effort:** 6-8 hours

---

## Goal

Add a **"SEE AI BRAIN"** toggle button to the HUD that reveals AI decision-making visualizations directly in the game as a user-facing feature.

---

## Proposed Changes

### Component 1: AI Brain Toggle Button

#### [NEW] src/ui/components/AIBrainToggle.ts

Toggle button with "👁 SEE AI BRAIN" label, active/inactive visual states.

---

### Component 2: AI Brain Overlay Renderer

#### [NEW] src/ai/visualization/AIBrainRenderer.ts

Renders visualizations:
- **Threat Heat Map** - Red gradient for enemy clusters
- **Coverage Map** - Blue/cyan for turret coverage
- **Decision Info** - Current AI reasoning text

---

### Component 3: Expanded AI Panel

#### [MODIFY] src/ui/panels/AIPanel.ts

Add `setExpandedMode()` to show:
- Planned action details
- Score breakdown
- Entity stats

---

### Component 4: HUD Integration

#### [MODIFY] src/ui/HUDManager.ts

- Add `createAIBrainToggle()` method
- Wire toggle to renderer and panel expansion

---

### Component 5: Game Loop Integration

#### [MODIFY] src/game/Game.ts

Pass AI status and world data to renderer each frame.

---

## Implementation Stages

1. **Stage 1:** Toggle Button (1-2h)
2. **Stage 2:** Brain Renderer (2-3h)
3. **Stage 3:** Panel Expansion (1h)
4. **Stage 4:** Integration & Polish (1-2h)

---

## Verification

```bash
npm run test
npm run lint
npm run build
```

Manual: Toggle button works, visualizations render, panel expands, no performance issues.

---

*Document Version: 2.0*
