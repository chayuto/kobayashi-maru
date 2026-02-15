---
paths:
  - "src/__tests__/**"
---

# Testing Rules

- Framework: Vitest with jsdom environment
- Pattern: Arrange-Act-Assert with descriptive `it('should [outcome] when [condition]')`
- Create bitECS world in `beforeEach`, clean up after each test
- Mock PixiJS objects (Container, Graphics, Text) — never import real pixi in tests
- For ECS tests: use `addEntity(world)` + set component values directly
- Run single file for fast feedback: `npm test -- <filename>`
- All new/changed code must have corresponding tests
