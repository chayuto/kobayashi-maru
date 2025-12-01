# Recommendation: Achievements and Progression System

**Date:** 2025-12-01  
**Priority:** MEDIUM  
**Complexity:** Medium  
**Impact:** Long-term retention, goals, replay motivation

---

## Overview

Implement a comprehensive achievement and progression system that rewards players for various accomplishments, providing goals beyond simple survival and encouraging repeated play sessions.

---

## Current State

The game currently has **minimal progression**:
- High scores saved locally
- Top 10 leaderboard
- No persistent unlocks
- No goals beyond "survive longer"

**Problems:**
- No sense of long-term progression
- Missing short-term goals for motivation
- No reward for varied playstyles
- Players have no reason to return after mastering basics

---

## Proposed Achievement System

### Achievement Categories

| Category | Focus | Count | Examples |
|----------|-------|-------|----------|
| **Survival** | Endurance | 10 | Survive waves, time |
| **Combat** | Kills and damage | 15 | Kill milestones, faction kills |
| **Defense** | Protection | 8 | KM health thresholds |
| **Tactical** | Strategic play | 12 | Turret combinations, synergies |
| **Challenge** | Special conditions | 10 | Restrictions, speedruns |
| **Hidden** | Discovery | 5 | Secret triggers |

---

## Achievement Definitions

### Survival Achievements

```typescript
const SURVIVAL_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_blood',
    name: 'First Blood',
    description: 'Survive Wave 1',
    icon: '🎖️',
    tier: 'BRONZE',
    condition: { type: 'wave_reached', value: 1 },
    reward: { type: 'matter', amount: 100 }
  },
  {
    id: 'holding_the_line',
    name: 'Holding the Line',
    description: 'Survive Wave 5',
    icon: '🥉',
    tier: 'BRONZE',
    condition: { type: 'wave_reached', value: 5 },
    reward: { type: 'matter', amount: 250 }
  },
  {
    id: 'no_surrender',
    name: 'No Surrender',
    description: 'Survive Wave 10',
    icon: '🥈',
    tier: 'SILVER',
    condition: { type: 'wave_reached', value: 10 },
    reward: { type: 'unlock', item: 'turret_skin_gold' }
  },
  {
    id: 'defying_odds',
    name: 'Defying the Odds',
    description: 'Survive Wave 20',
    icon: '🥇',
    tier: 'GOLD',
    condition: { type: 'wave_reached', value: 20 },
    reward: { type: 'unlock', item: 'title_commander' }
  },
  {
    id: 'kobayashi_maru_legend',
    name: 'Kobayashi Maru Legend',
    description: 'Survive Wave 50',
    icon: '💎',
    tier: 'PLATINUM',
    condition: { type: 'wave_reached', value: 50 },
    reward: { type: 'unlock', item: 'badge_legendary' }
  },
  {
    id: 'minute_to_win_it',
    name: 'Minute to Win It',
    description: 'Survive for 60 seconds',
    tier: 'BRONZE',
    condition: { type: 'time_survived', value: 60 }
  },
  {
    id: 'five_minute_miracle',
    name: 'Five Minute Miracle',
    description: 'Survive for 5 minutes',
    tier: 'SILVER',
    condition: { type: 'time_survived', value: 300 }
  },
  {
    id: 'marathon_defender',
    name: 'Marathon Defender',
    description: 'Survive for 30 minutes',
    tier: 'GOLD',
    condition: { type: 'time_survived', value: 1800 }
  }
];
```

### Combat Achievements

```typescript
const COMBAT_ACHIEVEMENTS: Achievement[] = [
  // Kill milestones
  {
    id: 'first_kill',
    name: 'First Kill',
    description: 'Destroy your first enemy',
    condition: { type: 'kills_total', value: 1 }
  },
  {
    id: 'centurion',
    name: 'Centurion',
    description: 'Destroy 100 enemies in a single game',
    condition: { type: 'kills_total', value: 100 }
  },
  {
    id: 'mass_destruction',
    name: 'Mass Destruction',
    description: 'Destroy 1000 enemies total',
    condition: { type: 'kills_career', value: 1000 }
  },
  
  // Faction-specific
  {
    id: 'klingon_hunter',
    name: 'Klingon Hunter',
    description: 'Destroy 200 Klingon ships',
    condition: { type: 'kills_faction', faction: 'KLINGON', value: 200 }
  },
  {
    id: 'romulan_slayer',
    name: 'Romulan Slayer',
    description: 'Destroy 150 Romulan ships',
    condition: { type: 'kills_faction', faction: 'ROMULAN', value: 150 }
  },
  {
    id: 'borg_resistance',
    name: 'Resistance Was NOT Futile',
    description: 'Destroy 100 Borg ships',
    condition: { type: 'kills_faction', faction: 'BORG', value: 100 }
  },
  {
    id: 'tholian_terror',
    name: 'Tholian Terror',
    description: 'Destroy 50 Tholian ships',
    condition: { type: 'kills_faction', faction: 'THOLIAN', value: 50 }
  },
  {
    id: 'fluidic_defender',
    name: 'Fluidic Space Defender',
    description: 'Destroy 25 Species 8472 bioships',
    condition: { type: 'kills_faction', faction: 'SPECIES_8472', value: 25 }
  },
  
  // Kill streaks
  {
    id: 'double_kill',
    name: 'Double Kill',
    description: 'Destroy 2 enemies within 1 second',
    condition: { type: 'multikill', count: 2, window: 1000 }
  },
  {
    id: 'triple_kill',
    name: 'Triple Kill',
    description: 'Destroy 3 enemies within 1 second',
    condition: { type: 'multikill', count: 3, window: 1000 }
  },
  {
    id: 'overkill',
    name: 'OVERKILL!',
    description: 'Destroy 5 enemies within 2 seconds',
    condition: { type: 'multikill', count: 5, window: 2000 }
  }
];
```

### Defense Achievements

```typescript
const DEFENSE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'untouchable',
    name: 'Untouchable',
    description: 'Complete Wave 1 without KM taking damage',
    condition: { type: 'wave_no_damage', wave: 1 }
  },
  {
    id: 'perfect_defense',
    name: 'Perfect Defense',
    description: 'Complete Wave 5 with KM at full health',
    condition: { type: 'wave_full_health', wave: 5 }
  },
  {
    id: 'last_stand',
    name: 'Last Stand',
    description: 'Win a wave with KM below 10% health',
    condition: { type: 'clutch_wave', health_threshold: 0.1 }
  },
  {
    id: 'shield_master',
    name: 'Shield Master',
    description: 'Absorb 5000 damage with shields',
    condition: { type: 'shield_damage_absorbed', value: 5000 }
  },
  {
    id: 'hull_integrity',
    name: 'Hull Integrity',
    description: 'Never let KM shields drop completely in Wave 5',
    condition: { type: 'shields_never_down', wave: 5 }
  }
];
```

### Tactical Achievements

```typescript
const TACTICAL_ACHIEVEMENTS: Achievement[] = [
  // Turret variety
  {
    id: 'arsenal',
    name: 'Complete Arsenal',
    description: 'Place at least one of each turret type',
    condition: { type: 'turret_variety', count: 6 }
  },
  {
    id: 'phaser_fanatic',
    name: 'Phaser Fanatic',
    description: 'Win Wave 10 using only Phaser Arrays',
    condition: { type: 'turret_only', turretType: 'PHASER_ARRAY', wave: 10 }
  },
  {
    id: 'torpedo_master',
    name: 'Torpedo Master',
    description: 'Kill 50 enemies with Torpedo Launchers',
    condition: { type: 'turret_kills', turretType: 'TORPEDO_LAUNCHER', value: 50 }
  },
  
  // Efficiency
  {
    id: 'efficient_commander',
    name: 'Efficient Commander',
    description: 'Reach Wave 10 with fewer than 5 turrets',
    condition: { type: 'turret_count_max', wave: 10, count: 5 }
  },
  {
    id: 'economy_run',
    name: 'Economy Run',
    description: 'Reach Wave 5 without spending more than 200 resources',
    condition: { type: 'resource_spent_max', wave: 5, value: 200 }
  },
  
  // Synergies (if implemented)
  {
    id: 'synergy_master',
    name: 'Synergy Master',
    description: 'Activate 3 different synergies in one game',
    condition: { type: 'synergies_active', count: 3 }
  }
];
```

### Challenge Achievements

```typescript
const CHALLENGE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'no_turrets',
    name: 'Pacifist Run',
    description: 'Reach Wave 2 without placing any turrets',
    condition: { type: 'wave_with_constraint', wave: 2, constraint: 'no_turrets' }
  },
  {
    id: 'speedrunner',
    name: 'Speedrunner',
    description: 'Clear Wave 5 in under 2 minutes',
    condition: { type: 'wave_time', wave: 5, maxTime: 120 }
  },
  {
    id: 'one_hp_wonder',
    name: 'One HP Wonder',
    description: 'Kill an enemy while KM has less than 50 health',
    condition: { type: 'kill_while_low', threshold: 50 }
  },
  {
    id: 'comeback_king',
    name: 'Comeback King',
    description: 'Survive 3 more waves after KM drops below 25% health',
    condition: { type: 'waves_after_critical', waves: 3, threshold: 0.25 }
  }
];
```

### Hidden Achievements

```typescript
const HIDDEN_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'secret_konami',
    name: '???',
    description: 'Enter the Konami Code',
    hidden: true,
    condition: { type: 'konami_code' },
    revealedDescription: 'Up Up Down Down Left Right Left Right B A'
  },
  {
    id: 'secret_borg',
    name: '???',
    description: 'Discover the Borg secret',
    hidden: true,
    condition: { type: 'borg_collective_kill', count: 7 },
    revealedDescription: 'Destroy 7 Borg ships at once (7 of 9)'
  },
  {
    id: 'secret_midnight',
    name: '???',
    description: 'Play at an unusual time',
    hidden: true,
    condition: { type: 'play_at_time', hour: 3 },
    revealedDescription: 'Play the game at 3 AM'
  }
];
```

---

## Progression System

### Player Level

```typescript
interface PlayerProgression {
  level: number;                    // 1-100
  xp: number;                       // Current XP
  xpToNextLevel: number;           // XP needed
  totalXP: number;                 // Lifetime XP
  
  // Unlock thresholds
  unlockedTurrets: TurretType[];   // Some turrets locked initially
  unlockedAbilities: string[];     // Commander abilities
  unlockedSkins: string[];         // Cosmetics
  titles: string[];                // Display titles
}
```

### XP Sources

| Source | XP Amount |
|--------|-----------|
| Enemy killed | 1-5 XP (by faction difficulty) |
| Wave completed | 50 XP × wave number |
| Achievement unlocked | 100-1000 XP (by tier) |
| High score beaten | 500 XP |
| Challenge completed | 200 XP |

### Level Rewards

| Level | Reward |
|-------|--------|
| 5 | Unlock Tetryon Beam |
| 10 | Unlock Plasma Cannon |
| 15 | Unlock Polaron Beam |
| 20 | Commander Ability: Photon Spread |
| 25 | Turret Skin: Federation Blue |
| 30 | Commander Ability: Gravity Well |
| 40 | Title: "Commander" |
| 50 | Turret Skin: Mirror Universe |
| 75 | Commander Ability: Emergency Warp |
| 100 | Title: "Fleet Admiral" + Badge |

---

## UI Design

### Achievement Notification

```
┌─────────────────────────────────────────────┐
│ ★ ACHIEVEMENT UNLOCKED                      │
│                                             │
│ 🥇 NO SURRENDER                             │
│    "Survive Wave 10"                        │
│                                             │
│ Reward: Gold Turret Skin                    │
└─────────────────────────────────────────────┘
```

### Achievement Browser

```
┌─ ACHIEVEMENTS ──────────────────────────────────────────┐
│                                                          │
│ Progress: 23/60 (38%)                    XP: 15,420     │
│                                                          │
├─ SURVIVAL [████████░░░░░░░] 8/10 ──────────────────────│
│ ✓ First Blood        ✓ Holding the Line                │
│ ✓ No Surrender       ○ Defying the Odds                │
│ ✓ Minute to Win It   ○ Five Minute Miracle             │
│                                                          │
├─ COMBAT [██████████░░░░░] 10/15 ───────────────────────│
│ ✓ First Kill         ✓ Centurion                       │
│ ✓ Klingon Hunter     ○ Mass Destruction                │
│ ○ Romulan Slayer     ○ Borg Resistance                 │
│                                                          │
├─ HIDDEN [████░░░░░░░░░░░] 2/5 ─────────────────────────│
│ ✓ ???                ✓ ???                              │
│ ○ ???                ○ ???                ○ ???        │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Progress Bar Integration

```
┌─ PLAYER PROGRESS ───────────────────────┐
│                                          │
│ Level 24 ████████████████░░░░ Level 25  │
│          XP: 3,420 / 5,000              │
│                                          │
│ Next Unlock: Turret Skin (Lv. 25)       │
└─────────────────────────────────────────┘
```

---

## Implementation Architecture

### AchievementManager

```typescript
class AchievementManager {
  private achievements: Map<string, Achievement> = new Map();
  private progress: Map<string, number> = new Map();
  private unlocked: Set<string> = new Set();
  
  constructor() {
    this.loadAllAchievements();
    this.loadProgress();  // From localStorage
  }
  
  // Called by game systems to update progress
  trackEvent(event: GameEvent): void {
    switch (event.type) {
      case 'enemy_killed':
        this.incrementProgress('kills_total', 1);
        this.incrementProgress(`kills_${event.faction}`, 1);
        this.checkMultikill(event.timestamp);
        break;
      case 'wave_completed':
        this.checkWaveAchievements(event.waveNumber, event.stats);
        break;
      // ... etc
    }
    
    this.checkAllAchievements();
  }
  
  private checkAllAchievements(): void {
    for (const [id, achievement] of this.achievements) {
      if (this.unlocked.has(id)) continue;
      
      if (this.checkCondition(achievement.condition)) {
        this.unlockAchievement(id);
      }
    }
  }
  
  private unlockAchievement(id: string): void {
    const achievement = this.achievements.get(id)!;
    this.unlocked.add(id);
    
    // Notify UI
    EventBus.emit('achievement_unlocked', achievement);
    
    // Grant reward
    this.grantReward(achievement.reward);
    
    // Grant XP
    this.addXP(this.getXPForTier(achievement.tier));
    
    // Save progress
    this.saveProgress();
  }
}
```

### Integration Points

```typescript
// In damageSystem.ts
damageSystem.onEnemyDeath((entityId, factionId) => {
  achievementManager.trackEvent({
    type: 'enemy_killed',
    faction: factionId,
    timestamp: performance.now()
  });
});

// In waveManager.ts
waveManager.on('waveComplete', (waveNumber) => {
  achievementManager.trackEvent({
    type: 'wave_completed',
    waveNumber,
    stats: {
      kmHealth: getCurrentKMHealth(),
      turretCount: getTurretCount(),
      timeElapsed: getWaveTime()
    }
  });
});
```

---

## Persistence

### localStorage Schema

```typescript
interface SavedProgress {
  version: number;
  achievements: {
    unlocked: string[];
    progress: Record<string, number>;
  };
  progression: {
    level: number;
    xp: number;
    totalXP: number;
    unlocks: string[];
  };
  stats: {
    totalKills: number;
    killsByFaction: Record<string, number>;
    totalWavesCompleted: number;
    highestWave: number;
    totalPlayTime: number;
    gamesPlayed: number;
  };
}

// Save key
const SAVE_KEY = 'kobayashi_maru_progress';
```

### Cloud Sync (Future)

- Export save as JSON
- Import save from JSON
- Optional cloud backup

---

## Player Engagement Benefits

### Short-term Goals
- "Just one more achievement"
- Clear, attainable targets
- Immediate rewards

### Long-term Goals
- Level progression (1-100)
- Unlock new content
- Complete collection

### Varied Playstyles
- Combat achievements for action players
- Tactical achievements for strategists
- Challenge achievements for hardcore
- Hidden achievements for explorers

### Social Features
- Share achievements
- Compare progress
- Bragging rights

---

## Balance Considerations

### Achievement Difficulty Curve

| Tier | % of Players Should Unlock | Time Investment |
|------|---------------------------|-----------------|
| Bronze | 90%+ | First session |
| Silver | 50-70% | A few hours |
| Gold | 20-40% | Multiple sessions |
| Platinum | 5-15% | Dedicated play |
| Hidden | 10-30% | Discovery |

### Avoiding Grind

- No achievements requiring excessive repetition
- Multiple paths to same reward
- Natural progression through play

### Preventing Exploitation

```typescript
// Anti-cheat measures
function validateAchievement(achievement: Achievement, stats: GameStats): boolean {
  // Check for impossible combinations
  if (stats.waveReached > 50 && stats.playTime < 600) {
    return false;  // Suspicious: 50 waves in 10 minutes
  }
  
  // Check for reasonable progression
  if (stats.totalKills > stats.waveReached * 100) {
    return false;  // Suspicious: too many kills per wave
  }
  
  return true;
}
```

---

## Conclusion

A comprehensive achievement and progression system provides the long-term engagement hooks that keep players returning. By offering varied goals, rewarding different playstyles, and providing visible progression, this system transforms single sessions into an ongoing journey. Combined with unlockable content, achievements provide both immediate satisfaction and aspirational targets.

**Estimated Implementation Time:** 4-5 days  
**Risk Level:** Low (non-destructive addition)  
**ROI:** Significant long-term retention improvement
