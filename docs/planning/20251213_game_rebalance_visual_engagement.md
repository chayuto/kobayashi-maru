# Game Rebalancing for Visual Engagement

**Date:** 2025-12-13  
**Goal:** Rebalance game configs (enemies, waves, economy, scoring) to create visually engaging gameplay

> [!IMPORTANT]
> **The AI always plays optimally.** Visual engagement comes from game balance, not AI limitations.

---

## Core Principle

**The game should be balanced so that even a perfect AI faces genuine challenges.** Drama comes from:
- Waves that push defense limits
- Economy that forces meaningful choices
- Enemy variety that demands diverse strategies
- Combos that reward sustained performance

---

## Phase 1: Turret Balance

#### [MODIFY] [turrets.ts](file:///Users/chayut/repos/kobayashi-maru/src/types/config/turrets.ts)

**Problem:** Phaser Array dominates (DPS/cost = 0.40). AI always builds the same thing.

**Solution:** Flatten DPS/cost across turrets so AI chooses based on situation:

| Turret | Current | Proposed | New DPS/Cost |
|--------|---------|----------|--------------|
| Phaser | 100 cost, 4 rate, 10 dmg | 110 cost, 3.5 rate, 10 dmg | 0.32 |
| Torpedo | 200 cost, 0.5 rate, 50 dmg | 160 cost, 0.6 rate, 60 dmg | 0.23 |
| Disruptor | 150 cost, 2 rate, 15 dmg | 140 cost, 2 rate, 15 dmg | 0.21 |
| Plasma | 180 cost, 1 rate, 8+DOT | 160 cost, 1.2 rate, 10+DOT | 0.22 |

---

## Phase 2: Wave Composition

#### [MODIFY] [waveConfig.ts](file:///Users/chayut/repos/kobayashi-maru/src/game/waveConfig.ts)

**Problem:** Waves escalate too smoothly. No visual variety.

**Solution:** More enemy variety earlier, dramatic formations:

| Wave | Change |
|------|--------|
| 4 | Introduce Romulans with cluster formation (visual "swarm") |
| 5 | First mini-boss wave - concentrated threat |
| 7-9 | Mix formations: V-formations look dramatic on screen |
| 10 | Reduce from 41→34 enemies but add Species 8472 earlier |

**Procedural scaling (wave 11+):**
```diff
- const exponentialFactor = Math.pow(1.1, waveNumber - 10);
+ const exponentialFactor = Math.pow(1.08, waveNumber - 10);  // Slower ramp
```

---

## Phase 3: Combo System

#### [MODIFY] [score.config.ts](file:///Users/chayut/repos/kobayashi-maru/src/config/score.config.ts)

**Problem:** 3s timeout too short for visual feedback to register.

**Solution:**
```diff
  COMBO: {
-   TIMEOUT: 3.0,
+   TIMEOUT: 4.0,
    TIERS: [
      { threshold: 0, multiplier: 1 },
      { threshold: 3, multiplier: 2 },
      { threshold: 6, multiplier: 3 },
      { threshold: 10, multiplier: 5 },
-     { threshold: 20, multiplier: 10 }
+     { threshold: 20, multiplier: 8 },
+     { threshold: 35, multiplier: 12 },
+     { threshold: 50, multiplier: 15 }
    ],
  },
```

---

## Phase 4: Economy

#### [MODIFY] [game.ts](file:///Users/chayut/repos/kobayashi-maru/src/types/config/game.ts)

**Problem:** Resource flow too predictable.

**Solution:**
```diff
- RESOURCE_REWARD: 10,
+ RESOURCE_REWARD: 12,  // Slightly more generous
  INITIAL_RESOURCES: 500,
```

---

## Phase 5: Enemy Stats (for challenge)

#### [MODIFY] [entityTemplates.ts](file:///Users/chayut/repos/kobayashi-maru/src/ecs/entityTemplates.ts)

**Tweak enemy health/shields to create meaningful resistance:**

| Faction | Current HP/Shield | Proposed |
|---------|-------------------|----------|
| Borg | 150/100 | 160/110 (tougher) |
| Species 8472 | 200/0 | 220/0 (tankier) |

---

## Verification

```bash
npm test && npm run lint
```

### Manual Check
1. Watch AI autoplay for 10+ waves
2. Verify: Does AI use different turret types?
3. Verify: Do enemies occasionally get close to KM?

---

## Files to Modify

| File | Change | Risk |
|------|--------|------|
| `turrets.ts` | Cost/rate adjustments | Low |
| `waveConfig.ts` | Wave compositions | Low |
| `score.config.ts` | Combo timeouts | Low |
| `game.ts` | Resource reward | Low |
| `entityTemplates.ts` | Enemy HP tweaks | Low |


