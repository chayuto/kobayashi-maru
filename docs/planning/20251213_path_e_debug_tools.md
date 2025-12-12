# Path E: "See AI Brain" Feature Implementation Plan

**Date:** 2025-12-13  
**Priority:** High (User Feature)  
**Estimated Effort:** 6-8 hours  
**AI Agent Implementation Guide**

---

## Goal

Add a **"SEE AI BRAIN"** toggle button to the HUD that reveals AI decision-making visualizations and debug information directly in the game. This is a **user-facing feature** (not hidden dev tools) that helps players understand how the AI commander thinks.

---

## User Review Required

> [!IMPORTANT]
> This implementation exposes AI internal state to players as a feature. This includes:
> - Threat heat maps
> - Coverage overlays
> - AI decision reasoning
> - Performance metrics

---

## Proposed Changes

### Component 1: AI Brain Toggle Button

#### [NEW] src/ui/components/AIBrainToggle.ts

Create a styled toggle button for the HUD:

```typescript
/**
 * AI Brain Toggle Button
 * 
 * A toggle button labeled "SEE AI BRAIN" that activates
 * AI visualization overlays in the game.
 */
export class AIBrainToggle {
    private container: Container;
    private background: Graphics;
    private labelText: Text;
    private enabled: boolean = false;
    private onToggle: (enabled: boolean) => void;
    
    // Styling
    private static readonly WIDTH = 140;
    private static readonly HEIGHT = 36;
    
    constructor(onToggle: (enabled: boolean) => void);
    toggle(): boolean;
    isEnabled(): boolean;
    getContainer(): Container;
    setPosition(x: number, y: number): void;
    destroy(): void;
}
```

**Button Design:**
- Label: "👁 SEE AI BRAIN" (with eye emoji)
- Active state: Glowing cyan border, brighter background
- Inactive state: Subdued gray styling
- Positioned near the AI toggle button in the HUD

---

### Component 2: AI Brain Overlay Renderer

#### [NEW] src/ai/visualization/AIBrainRenderer.ts

Main visualization renderer:

```typescript
/**
 * AI Brain Renderer
 * 
 * Renders AI decision-making visualizations on the game canvas.
 * Controlled by the "SEE AI BRAIN" toggle.
 */
export class AIBrainRenderer {
    private container: Container;
    private enabled: boolean = false;
    
    // Visualization layers
    private threatLayer: Graphics;
    private coverageLayer: Graphics;
    private flowLayer: Graphics;
    private decisionLayer: Container;
    
    constructor(app: Application);
    
    // Control
    setEnabled(enabled: boolean): void;
    isEnabled(): boolean;
    
    // Render methods (called each frame when enabled)
    render(aiStatus: AIStatusExtended, world: GameWorld): void;
    
    // Sub-renderers
    private renderThreatHeatMap(threatAnalyzer: ThreatAnalyzer): void;
    private renderCoverageMap(coverageAnalyzer: CoverageAnalyzer): void;
    private renderFlowField(world: GameWorld): void;
    private renderDecisionInfo(aiStatus: AIStatusExtended): void;
    
    clear(): void;
    destroy(): void;
}
```

**Visualization Modes (All Active When Enabled):**

| Layer | Description | Visual Style |
|-------|-------------|--------------|
| Threat Heat Map | Enemy concentration areas | Red gradient overlay (semi-transparent) |
| Coverage Map | Turret coverage zones | Blue/cyan gradient overlay |
| Flow Field | Enemy movement vectors | Small arrows showing path direction |
| Decision Info | Current AI reasoning | Floating text near planned action |

---

### Component 3: Expanded AI Info Panel

#### [MODIFY] src/ui/panels/AIPanel.ts

Extend the existing AI Panel to show more detailed information when "SEE AI BRAIN" is active:

```typescript
// Add method to toggle expanded mode
setExpandedMode(expanded: boolean): void;

// When expanded, show additional info:
// - Current action being considered
// - Score breakdown (threat score, coverage score)
// - Influence map statistics
// - Decision timing
```

**New Fields in Expanded Mode:**
- Planned action: "PLACING Laser @ (320, 240)"
- Action score: "Score: 847 (Threat: +500, Coverage: +347)"
- Decision cycle: "Last update: 0.3s ago"
- Entity stats: "Enemies: 12 | Turrets: 5 | Projectiles: 23"

---

### Component 4: HUD Integration

#### [MODIFY] src/ui/HUDManager.ts

Add the AI Brain toggle button and renderer integration:

```typescript
// New fields
private aiBrainToggle: AIBrainToggle | null = null;
private aiBrainRenderer: AIBrainRenderer | null = null;

// In init() - add button creation
createAIBrainToggle(): void;

// New callback method
private onAIBrainToggle(enabled: boolean): void {
    if (this.aiBrainRenderer) {
        this.aiBrainRenderer.setEnabled(enabled);
    }
    if (this.aiPanel) {
        this.aiPanel.setExpandedMode(enabled);
    }
}

// In update() - render brain visualizations when enabled
updateAIBrain(aiStatus: AIStatusExtended, world: GameWorld): void;
```

**Button Placement:**
- Position below the existing AI toggle button
- Same visual style family as other toggle buttons

---

### Component 5: Game Loop Integration

#### [MODIFY] src/game/Game.ts

Pass required data to the renderer:

```typescript
// In game loop update
if (this.hudManager) {
    // Existing AI status update
    this.hudManager.updateAI(this.aiAutoPlayManager.getExtendedStatus());
    
    // NEW: Update AI brain visualization
    this.hudManager.updateAIBrain(
        this.aiAutoPlayManager.getExtendedStatus(),
        this.world
    );
}
```

---

## File Structure

```
src/
├── ai/visualization/               # NEW: Visualization directory
│   ├── AIBrainRenderer.ts          # Main visualization renderer
│   └── index.ts                    # Barrel export
├── ui/
│   ├── components/
│   │   └── AIBrainToggle.ts        # NEW: Toggle button component
│   ├── panels/
│   │   └── AIPanel.ts              # MODIFY: Add expanded mode
│   └── HUDManager.ts               # MODIFY: Integration
└── game/
    └── Game.ts                     # MODIFY: Loop integration
```

---

## Implementation Stages

### Stage 1: Toggle Button (1-2 hours)

1. Create `AIBrainToggle.ts` component
   - Styled button with "👁 SEE AI BRAIN" label
   - Toggle state management
   - Active/inactive visual states

2. Add to `HUDManager.ts`
   - Create `createAIBrainToggle()` method
   - Position below AI toggle button
   - Wire up toggle callback

### Stage 2: Brain Renderer (2-3 hours)

1. Create `AIBrainRenderer.ts`
   - Container setup with layered graphics
   - Threat heat map visualization
   - Coverage map visualization
   - Decision info floating text

2. Create `src/ai/visualization/index.ts` for exports

### Stage 3: Panel Expansion (1 hour)

1. Modify `AIPanel.ts`
   - Add `setExpandedMode()` method
   - Create expanded info display (action, scores, stats)
   - Increase panel height when expanded

### Stage 4: Integration & Polish (1-2 hours)

1. Wire up `HUDManager.updateAIBrain()`
2. Add to game loop in `Game.ts`
3. Handle resize events
4. Test all visualization modes
5. Adjust opacity/colors for visibility

---

## Verification Plan

### Automated Tests

```bash
# Run all tests
npm run test

# Run linter
npm run lint

# Build project
npm run build
```

### Manual Verification

1. **Toggle button test:**
   - Start the game with `npm run dev`
   - Locate the "👁 SEE AI BRAIN" button (should be near AI toggle)
   - Click to enable - button should glow/highlight
   - Click again to disable - button returns to normal state

2. **Heat map visualization test:**
   - Enable "SEE AI BRAIN"
   - Enable AI auto-play
   - Wait for enemies to spawn
   - Verify red overlay appears where enemies cluster
   - Verify blue overlay shows turret coverage areas

3. **Expanded panel test:**
   - With "SEE AI BRAIN" enabled
   - Verify AI Panel shows additional info:
     - Current planned action
     - Score breakdown
     - Entity counts

4. **Performance test:**
   - Play through several waves with visualization on
   - Verify game maintains smooth framerate (>30 FPS)
   - Disable visualization and confirm no lag difference

---

## Console Debug Commands (Bonus/Optional)

If time permits, add browser console commands for additional debugging:

```javascript
// Expose on window object for developer use
window.aiBrain = {
    showThreatMap(): void,
    showCoverageMap(): void,
    getDecisionLog(): string[],
};
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Performance hit from rendering | Medium | Medium | Use efficient Graphics updates, throttle to 10fps |
| Visual clutter | Medium | Low | Use semi-transparent overlays, clear layer separation |
| Information overload | Low | Low | Limit to key metrics, clean layout |

---

## Success Metrics

- [ ] "SEE AI BRAIN" button appears in HUD
- [ ] Toggle enables/disables visualizations
- [ ] Threat heat map renders correctly
- [ ] Coverage map renders correctly  
- [ ] AI Panel shows expanded info when enabled
- [ ] No significant performance impact
- [ ] All tests pass
- [ ] Lint passes
- [ ] Build succeeds

---

*Document Version: 2.0 - Rewritten for AI Brain Feature*
