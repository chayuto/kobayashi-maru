# Documentation Standards
**Date:** 2024-05-22
**Status:** Active

## Overview

Good documentation ensures the project remains maintainable and understandable.

## Types of Documentation

### 1. Code Comments (Inline)
- Use for complex logic that isn't immediately obvious.
- **Avoid**: Explaining *what* the code does (the code shows that).
- **Prefer**: Explaining *why* the code does it.

### 2. TSDoc (API Documentation)
- All exported classes, interfaces, and functions must have TSDoc comments.
- Describe parameters, return values, and potential exceptions.

```typescript
/**
 * Spawns a new wave of enemies.
 *
 * @param waveConfig - Configuration for the wave.
 * @returns The number of enemies spawned.
 * @throws Error if the wave config is invalid.
 */
```

### 3. Internal Docs (`docs/internal/`)
- Architectural decisions, guidelines, and standards.
- Format: Markdown (`.md`).
- Naming: `XXX_topic_name.md` (numbered for ordering).

### 4. Change Notes (`docs/change_notes/`)
- Record significant changes, features, or refactors.
- Naming: `YYYYMMDD_short_description.md`.

### 5. README.md
- High-level overview, setup instructions, and feature list.
- Update this when adding major features or changing build steps.

## Maintenance
- When modifying code, check if the documentation needs updating.
- Outdated documentation is worse than no documentation.
