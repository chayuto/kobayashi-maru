# Refactoring: BaseRenderer Abstraction

## Overview
Create abstract `BaseRenderer` class for consistent renderer lifecycle.

**Effort:** ~1.5 hours | **Impact:** Medium

---

## Current Duplication

Multiple renderers share similar patterns:

| Renderer | init() | render() | destroy() |
|----------|--------|----------|-----------|
| [BeamRenderer](file:///Users/chayut/repos/kobayashi-maru/src/rendering/BeamRenderer.ts) | ✓ | ✓ | ✓ |
| [ShockwaveRenderer](file:///Users/chayut/repos/kobayashi-maru/src/rendering/ShockwaveRenderer.ts) | ✓ | ✓ | ✓ |
| [ShieldRenderer](file:///Users/chayut/repos/kobayashi-maru/src/rendering/ShieldRenderer.ts) | ✓ | ✓ | ✓ |
| [HealthBarRenderer](file:///Users/chayut/repos/kobayashi-maru/src/rendering/HealthBarRenderer.ts) | ✓ | ✓ | ✓ |

---

## Proposed Base Class

```typescript
export abstract class BaseRenderer {
  protected app: Application;
  protected graphics: Graphics;
  protected container: Container;
  protected initialized: boolean = false;
  protected glowContainer: Container | null = null;

  constructor(app: Application) {
    this.app = app;
    this.graphics = new Graphics();
    this.container = new Container();
  }

  init(glowContainer?: Container): void {
    if (this.initialized) return;
    this.glowContainer = glowContainer ?? null;
    this.container.addChild(this.graphics);
    (glowContainer ?? this.app.stage).addChild(this.container);
    this.initialized = true;
  }

  abstract render(items: unknown[]): void;

  destroy(): void {
    this.graphics.destroy();
    this.container.destroy({ children: true });
    this.initialized = false;
  }
}
```

---

## Steps

1. [ ] Create `src/rendering/BaseRenderer.ts`
2. [ ] Refactor `BeamRenderer` to extend `BaseRenderer`
3. [ ] Refactor `ShockwaveRenderer` to extend `BaseRenderer`
4. [ ] Refactor `ShieldRenderer` to extend `BaseRenderer`
5. [ ] Refactor `HealthBarRenderer` to extend `BaseRenderer`
6. [ ] Update exports in `index.ts`
7. [ ] Verify: lint and tests pass
