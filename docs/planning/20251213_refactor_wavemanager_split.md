# Refactoring: Split WaveManager

## Overview
Split 534-line `WaveManager` god class into focused sub-managers.

**Effort:** ~2 hours | **Impact:** High

---

## Current Problems

[waveManager.ts](file:///Users/chayut/repos/kobayashi-maru/src/game/waveManager.ts) handles:
- Wave spawning logic
- Difficulty scaling
- Elite/Boss variants
- Visual effects (glow)
- Completion tracking
- Spawn point selection

---

## Proposed Structure

```
src/game/wave/
├── index.ts                # Barrel export
├── WaveManager.ts          # Orchestration only (~150 lines)
├── EnemySpawner.ts         # Spawn logic + positions
├── DifficultyScaler.ts     # Stat scaling by wave
├── VariantApplier.ts       # Elite/Boss application
└── SpawnEffects.ts         # Glow effects
```

---

## Key Extractions

| New File | Methods to Extract |
|----------|-------------------|
| `EnemySpawner` | `spawnEnemy`, `createEnemyByFaction`, `setVelocityTowardCenter` |
| `DifficultyScaler` | `applyDifficultyScaling` |
| `VariantApplier` | `applyEnemyVariant`, `applyEliteVariant`, `applyBossVariant` |
| `SpawnEffects` | `addEliteGlow`, `addBossGlow` |

---

## Steps

1. [ ] Create `src/game/wave/` directory
2. [ ] Create `EnemySpawner.ts` with spawn logic
3. [ ] Create `DifficultyScaler.ts` with scaling
4. [ ] Create `VariantApplier.ts` with variant logic
5. [ ] Create `SpawnEffects.ts` with glow effects
6. [ ] Update `WaveManager.ts` to use sub-managers
7. [ ] Create `index.ts` exports
8. [ ] Update imports in consuming files
9. [ ] Verify: lint and tests pass
