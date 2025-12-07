# Task: Complete HUD Panel Decomposition

**Priority:** 🔴 Critical  
**Estimated Effort:** Medium (2-3 hours)  
**Dependencies:** None  
**File Focus:** `src/ui/HUDManager.ts`, `src/ui/panels/`

---

## Background

The HUD panel components (`WavePanel`, `ResourcePanel`, `StatusPanel`) have been created in `src/ui/panels/` but are not yet integrated into `HUDManager.ts`. The `HUDManager` still contains inline logic for creating these panels (953 lines total).

## Current State

- `src/ui/panels/WavePanel.ts` - Wave number, state, enemy count display ✅ Created
- `src/ui/panels/ResourcePanel.ts` - Player resources display ✅ Created  
- `src/ui/panels/StatusPanel.ts` - Health and shield bars ✅ Created
- `HUDManager.ts` - Still creates panels inline ❌ Not integrated

## Objective

Replace inline panel creation in `HUDManager.ts` with instantiation of the panel components.

---

## Implementation Steps

### Step 1: Import Panel Components

Add imports to `HUDManager.ts`:

```typescript
import { WavePanel, ResourcePanel, StatusPanel } from './panels';
```

### Step 2: Add Panel Instance Fields

Add private fields to HUDManager class:

```typescript
private wavePanel: WavePanel | null = null;
private resourcePanel: ResourcePanel | null = null;
private statusPanel: StatusPanel | null = null;
```

### Step 3: Replace createTopLeftPanel()

Replace the inline wave panel creation with:

```typescript
private createTopLeftPanel(): void {
  this.wavePanel = new WavePanel();
  this.wavePanel.init(this.app!);
  this.container.addChild(this.wavePanel.container);
}
```

### Step 4: Replace createTopRightPanel()

Replace the inline resources panel creation with ResourcePanel instantiation.

### Step 5: Replace createBottomCenterPanel()

Replace the inline status panel creation with StatusPanel instantiation.

### Step 6: Update update() Method

Delegate updates to panel components:

```typescript
if (this.wavePanel) {
  this.wavePanel.update({ wave, waveState, enemyCount });
}
if (this.resourcePanel) {
  this.resourcePanel.update({ resources });
}
if (this.statusPanel) {
  this.statusPanel.update({ health, maxHealth, shield, maxShield });
}
```

### Step 7: Update destroy() Method

Add panel cleanup:

```typescript
this.wavePanel?.destroy();
this.resourcePanel?.destroy();
this.statusPanel?.destroy();
```

### Step 8: Update handleResize()

Delegate resize to panels:

```typescript
this.wavePanel?.handleResize(screenWidth, screenHeight);
this.resourcePanel?.handleResize(screenWidth, screenHeight);
this.statusPanel?.handleResize(screenWidth, screenHeight);
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/ui/HUDManager.ts` | Import panels, replace inline creation, delegate updates |

## Files to Verify

| File | Action |
|------|--------|
| `src/ui/panels/WavePanel.ts` | Ensure `handleResize` method exists |
| `src/ui/panels/ResourcePanel.ts` | Ensure `handleResize` method exists |
| `src/ui/panels/StatusPanel.ts` | Ensure `handleResize` method exists |

---

## Success Criteria

1. ✅ All tests pass: `npm test`
2. ✅ TypeScript compiles: `npx tsc --noEmit`
3. ✅ ESLint passes: `npm run lint`
4. ✅ `HUDManager.ts` line count reduced by ~150-200 lines
5. ✅ Game runs correctly: `npm run dev` and visually verify HUD

---

## Verification Commands

```bash
# Run all tests
npm test

# Type check
npx tsc --noEmit

# Lint check
npm run lint

# Start dev server for visual verification
npm run dev
```

---

## Risk Assessment

- **Low risk** - Panel components already exist and are tested
- **Rollback:** Git revert if issues arise
