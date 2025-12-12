# Path C: Roguelite Expansion Plan

**Date:** 2025-12-13  
**Priority:** Medium  
**Estimated Effort:** 30-40 hours  
**Reference:** Game Improvement Research Proposals - Section 5.1-5.2 (Roguelite Loop, Deckbuilding)

---

## Executive Summary

This path focuses on adding roguelite meta-progression and deckbuilding mechanics to increase replayability. This represents a significant gameplay expansion that changes the core loop from "place optimal turrets" to "adapt with randomized options."

> [!WARNING]
> This is a major feature addition requiring significant architecture changes. Consider implementing in phases over multiple development cycles.

---

## Problem Statement

Current replayability limitations:
1. **Static tower selection** - All turrets always available
2. **No meta-progression** - Runs are independent
3. **Solved optimal strategies** - Once learned, game becomes repetitive
4. **No run variance** - Every game starts identically

---

## Proposed Changes

### Component 1: Meta-Progression System

#### [NEW] src/meta/MetaProgressionManager.ts

Track persistent progress across runs:
```typescript
interface MetaProgression {
    // Currency
    totalCredits: number;
    
    // Unlocks
    unlockedTurrets: number[];          // TurretType ids
    unlockedAbilities: number[];         // AbilityType ids
    unlockedRelics: string[];           // Relic ids
    
    // Stats
    totalRuns: number;
    highestWave: number;
    totalEnemiesKilled: number;
    
    // Achievements
    achievements: string[];
}

class MetaProgressionManager {
    addCredits(amount: number): void;
    spendCredits(amount: number): boolean;
    unlockTurret(typeId: number): void;
    isUnlocked(typeId: number): boolean;
    getProgression(): MetaProgression;
    
    // Persistence
    save(): void;
    load(): void;
    reset(): void;
}
```

---

### Component 2: Deck System

#### [NEW] src/deck/DeckManager.ts

Manage available turrets as a deck:
```typescript
interface TurretCard {
    id: string;
    turretType: number;
    level: number;           // Card level (upgrades)
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

interface Deck {
    cards: TurretCard[];
    maxSize: number;
}

class DeckManager {
    // Run setup
    createStarterDeck(): Deck;
    
    // During run
    drawHand(count: number): TurretCard[];
    addToDeck(card: TurretCard): void;
    removeFromDeck(cardId: string): void;
    
    // Draft system
    getDraftOptions(count: number): TurretCard[];
    selectDraftCard(card: TurretCard): void;
}
```

#### [NEW] src/ui/panels/DeckViewPanel.ts

UI to view and manage the current deck.

#### [NEW] src/ui/panels/DraftPanel.ts

UI for selecting cards between waves.

---

### Component 3: Relic System

#### [NEW] src/relics/RelicManager.ts

Artifacts that modify game rules:
```typescript
interface Relic {
    id: string;
    name: string;
    description: string;
    rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
    
    // Rule modifications
    effects: RelicEffect[];
}

interface RelicEffect {
    type: 'turret_damage' | 'cost_reduction' | 'income' | 'special';
    value: number;
    condition?: string;  // e.g., "first_turret_each_wave"
}

const RELICS: Relic[] = [
    {
        id: 'first_strike',
        name: 'First Strike Protocol',
        description: 'First turret placed each wave deals +50% damage',
        rarity: 'uncommon',
        effects: [{ type: 'turret_damage', value: 1.5, condition: 'first_turret_each_wave' }]
    },
    {
        id: 'economy_surplus',
        name: 'Federation Surplus',
        description: 'Start each wave with +20 resources',
        rarity: 'common',
        effects: [{ type: 'income', value: 20 }]
    },
    // ... more relics
];
```

---

### Component 4: Run Structure

#### [NEW] src/run/RunManager.ts

Manage the roguelite run flow:
```typescript
interface RunState {
    // Run identification
    runId: string;
    seed: number;
    
    // Progress
    currentWave: number;
    currentNode: MapNode;
    
    // Resources
    deck: Deck;
    relics: Relic[];
    credits: number;
    
    // Meta
    startTime: number;
    totalDamageDealt: number;
    totalKills: number;
}

class RunManager {
    startRun(seed?: number): RunState;
    completeWave(): WaveReward;
    selectPath(nodeId: string): void;
    endRun(victory: boolean): RunResult;
}
```

---

### Component 5: Map/Path Selection

#### [NEW] src/run/MapGenerator.ts

Generate branching path choices:
```typescript
interface MapNode {
    id: string;
    type: 'battle' | 'shop' | 'event' | 'boss' | 'rest';
    difficulty: number;
    rewards: Reward[];
    next: string[];  // Connected node ids
}

class MapGenerator {
    generateMap(waves: number, seed: number): MapNode[];
    getAvailablePaths(currentNodeId: string): MapNode[];
}
```

#### [NEW] src/ui/panels/MapPanel.ts

UI to display map and select paths.

---

## File Structure

```
src/
├── meta/                           # NEW: Meta-progression
│   ├── MetaProgressionManager.ts
│   └── AchievementManager.ts       # MOVE from game/
├── deck/                           # NEW: Deck system
│   ├── DeckManager.ts
│   └── CardPool.ts
├── relics/                         # NEW: Relic system
│   ├── RelicManager.ts
│   ├── RelicEffects.ts
│   └── RelicPool.ts
├── run/                            # NEW: Run management
│   ├── RunManager.ts
│   ├── MapGenerator.ts
│   └── RewardCalculator.ts
├── ui/panels/                      # MODIFY: New UI panels
│   ├── DeckViewPanel.ts
│   ├── DraftPanel.ts
│   ├── MapPanel.ts
│   └── RelicPanel.ts
└── config/
    └── roguelite.config.ts         # NEW: Roguelite settings
```

---

## Implementation Stages

### Stage 1: Meta-Progression Foundation (6-8 hours)
1. Create MetaProgressionManager
2. Implement localStorage persistence
3. Create credits earning logic
4. Add unlock system

### Stage 2: Deck System (8-10 hours)
1. Create DeckManager and card types
2. Create starter deck mechanics
3. Implement draft UI
4. Integrate with turret placement

### Stage 3: Relic System (6-8 hours)
1. Create RelicManager
2. Define 10-15 initial relics
3. Implement effect application
4. Add relic selection UI

### Stage 4: Run Structure (8-10 hours)
1. Create RunManager
2. Create MapGenerator
3. Implement path selection
4. Connect all systems

### Stage 5: Polish & Balance (4-6 hours)
1. Balance card costs and effects
2. Test run variety
3. Add visual polish
4. Create tutorial flow

---

## Verification Plan

### Automated Tests

```bash
npm run test
npm run lint
npm run build
```

#### New Test Files

[NEW] `src/__tests__/meta/MetaProgressionManager.test.ts`
- Test credit earning
- Test persistence
- Test unlock mechanics

[NEW] `src/__tests__/deck/DeckManager.test.ts`
- Test deck operations
- Test draft mechanics
- Test hand drawing

### Manual Verification

1. **Meta-progression test:**
   - Complete a run
   - Verify credits are awarded
   - Start new run, verify credits persisted

2. **Deck test:**
   - Start run with limited deck
   - Verify only deck cards available for placement
   - Verify draft options appear between waves

3. **Relic test:**
   - Acquire a relic
   - Verify effect is applied
   - Verify effect description is accurate

4. **Run variance test:**
   - Play 3 runs with different seeds
   - Verify different draft options
   - Verify different map paths

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Scope creep | High | High | Strict phase definitions |
| Balance issues | High | Medium | Iterative testing |
| Player confusion | Medium | Medium | Tutorial system |
| Breaks existing game | Medium | High | Feature flag toggle |

---

## Dependencies

- Existing TurretMenu needs modification
- Wave system may need hooks
- UI framework changes

---

## Success Metrics

- [ ] Meta-currency earned and persisted
- [ ] Deck-based turret selection working
- [ ] At least 10 relics implemented
- [ ] Path selection between waves
- [ ] No two runs feel identical
- [ ] Average playtime per session increases

---

## Feature Flag

> [!IMPORTANT]
> Implement behind feature flag for gradual rollout:
> ```typescript
> const ROGUELITE_ENABLED = localStorage.getItem('roguelite') === 'true';
> ```

---

*Document Version: 1.0*
