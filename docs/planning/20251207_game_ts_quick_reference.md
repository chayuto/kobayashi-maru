# Game.ts Refactoring: Quick Reference

**Date:** 2025-12-07  
**Total Tasks:** 9  
**Estimated Total Effort:** 18-20 hours

---

## Task Overview

| # | Task | File | Priority | Effort | Status |
|---|------|------|----------|--------|--------|
| 00 | Executive Summary | `20251207_game_ts_00_executive_summary.md` | - | - | ✅ |
| 01 | Service Container | `20251207_game_ts_01_service_container.md` | P0 | 2h | ⬜ |
| 02 | Bootstrap Extraction | `20251207_game_ts_02_bootstrap.md` | P0 | 3h | ⬜ |
| 03 | Game Loop Extraction | `20251207_game_ts_03_game_loop.md` | P0 | 2h | ⬜ |
| 04 | Render Manager | `20251207_game_ts_04_render_manager.md` | P1 | 3h | ⬜ |
| 05 | Gameplay Manager | `20251207_game_ts_05_gameplay_manager.md` | P1 | 3h | ⬜ |
| 06 | UI Controller | `20251207_game_ts_06_ui_controller.md` | P1 | 2h | ⬜ |
| 07 | Input Router | `20251207_game_ts_07_input_router.md` | P1 | 2h | ⬜ |
| 08 | Game Facade | `20251207_game_ts_08_game_facade.md` | P2 | 2h | ⬜ |
| 09 | Integration Testing | `20251207_game_ts_09_integration.md` | P2 | 2h | ⬜ |

---

## Dependency Graph

```
Task 01 (Service Container)
    │
    ├──► Task 02 (Bootstrap)
    │        │
    │        └──► Task 04 (Render Manager)
    │
    ├──► Task 03 (Game Loop)
    │
    ├──► Task 05 (Gameplay Manager)
    │        │
    │        └──► Task 06 (UI Controller)
    │
    └──► Task 07 (Input Router)
              │
              ▼
         Task 08 (Game Facade) ◄── All Tasks
              │
              ▼
         Task 09 (Integration Testing)
```

---

## New File Structure

After refactoring, the `src/core/` directory will look like:

```
src/core/
├── bootstrap/
│   ├── GameBootstrap.ts      # Task 02
│   └── index.ts
├── loop/
│   ├── GameLoopManager.ts    # Task 03
│   └── index.ts
├── managers/
│   ├── RenderManager.ts      # Task 04
│   ├── GameplayManager.ts    # Task 05
│   ├── UIController.ts       # Task 06
│   ├── InputRouter.ts        # Task 07
│   └── index.ts
├── services/
│   ├── ServiceContainer.ts   # Task 01
│   └── index.ts
├── Game.ts                   # Task 08 (rewritten)
├── index.ts                  # Updated exports
└── ... (existing files)
```

---

## Execution Commands

For each task, the AI agent should:

```bash
# 1. Create the new files as specified in the task

# 2. Verify TypeScript compiles
npm run typecheck

# 3. Run tests (if applicable)
npm run test

# 4. Start dev server to verify
npm run dev
```

---

## Key Interfaces

### ServiceRegistry (Task 01)
```typescript
interface ServiceRegistry {
  app: Application;
  world: GameWorld;
  eventBus: EventBus;
  spriteManager: SpriteManager;
  // ... 30+ services
}
```

### GameplaySnapshot (Task 05)
```typescript
interface GameplaySnapshot {
  state: GameStateType;
  gameTime: number;
  waveNumber: number;
  resources: number;
  kmHealth: number;
  // ... more fields
}
```

### InputAction (Task 07)
```typescript
enum InputAction {
  PAUSE, RESUME, RESTART, QUIT,
  SELECT_TURRET, DESELECT_TURRET,
  PLACE_TURRET, CANCEL_PLACEMENT,
  TOGGLE_DEBUG, TOGGLE_GOD_MODE, TOGGLE_SLOW_MODE
}
```

---

## Before/After Comparison

### Game.ts Size
- **Before:** 1,164 lines
- **After:** ~250 lines

### Class Properties
- **Before:** 50+ nullable properties
- **After:** 5 manager references

### init() Method
- **Before:** 200+ lines
- **After:** 30 lines (delegates to bootstrap)

### update() Method
- **Before:** 150+ lines
- **After:** 0 lines (handled by GameLoopManager)

---

## Rollback Strategy

If any task causes issues:

1. Each task creates NEW files (doesn't modify Game.ts until Task 08)
2. Task 08 should backup original Game.ts first
3. Can revert to original Game.ts if needed
4. Individual managers can be debugged in isolation

---

## AI Agent Tips

1. **Read the full task document** before starting
2. **Create files exactly as specified** - paths matter
3. **Run typecheck after each file** - catch errors early
4. **Don't modify Game.ts** until Task 08
5. **Test in browser** after Task 08 to verify functionality
6. **Use the test checklist** in Task 09 for verification

---

## Common Issues

| Issue | Solution |
|-------|----------|
| Circular imports | Use type-only imports: `import type { X }` |
| Service not found | Check registration order in Bootstrap |
| Null reference | Ensure service is registered before access |
| Event not firing | Check EventBus subscription in manager |
| UI not updating | Verify callback is connected in UIController |

---

## Success Metrics

After completing all tasks:

- [ ] Game.ts < 300 lines
- [ ] Each manager < 400 lines
- [ ] No null checks in Game.ts
- [ ] All tests pass
- [ ] No performance regression
- [ ] All existing features work
