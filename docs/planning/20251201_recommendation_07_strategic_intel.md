# Recommendation: Strategic Intel and Wave Preview

**Date:** 2025-12-01  
**Priority:** MEDIUM  
**Complexity:** Low  
**Impact:** Informed decisions, reduced frustration, strategic depth

---

## Overview

Implement a wave preview and strategic intel system that gives players information about upcoming threats, allowing them to make informed tactical decisions rather than reactive scrambles.

---

## Current State

Players currently have **zero visibility** into upcoming waves:
- No indication of what enemy types are coming
- No warning about enemy counts or compositions
- Forced to react rather than plan
- Strategic turret placement is guesswork

**Problems:**
- Players can't prepare for specific threats
- Turret investment feels random
- No reward for strategic thinking
- High-shield enemies feel "unfair" if no Tetryon turrets placed

---

## Proposed Intel System

### Three Information Tiers

```
┌──────────────────────────────────────────────────────────────┐
│                    INTEL TIERS                               │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  IMMEDIATE (Free)          TACTICAL (Earned)    STRATEGIC   │
│  Current wave info         Next wave preview    +2 waves    │
│                                                              │
│  ┌────────────────┐       ┌────────────────┐  ┌───────────┐ │
│  │ WAVE 3         │       │ WAVE 4 INCOMING│  │ WAVE 5    │ │
│  │ ▲▲▲▲▲▲▲▲▲▲    │       │ ▲▲▲▲▲▲▲▲ 8    │  │ ▲ 10     │ │
│  │ (10 Klingon)  │       │ ◐◐◐◐ 4 Romulan │  │ ◐ 6      │ │
│  │               │       │                 │  │           │ │
│  └────────────────┘       └────────────────┘  └───────────┘ │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Wave Preview Panel

### Default Display (Free Intel)

```
┌─ TACTICAL SENSORS ───────────────────────────────────────────┐
│                                                               │
│  CURRENT WAVE: 7                                              │
│  ────────────────────────────                                 │
│                                                               │
│  ▲ Klingon ................ 8 remaining                      │
│  ◐ Romulan ................ 6 remaining                      │
│  ■ Borg ................... 2 remaining                      │
│                                                               │
│  THREAT LEVEL: ████████░░ MODERATE                           │
│                                                               │
│  ┌─ INCOMING WAVE 8 ─────────────────────────────────────┐  │
│  │                                                        │  │
│  │  ▲ 10    ◐ 8    ■ 4                                  │  │
│  │                                                        │  │
│  │  ESTIMATED THREAT: HIGH                               │  │
│  │  RECOMMENDED: Tetryon Beams for Romulan shields       │  │
│  └────────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Extended Preview (Unlockable)

```
┌─ LONG-RANGE SENSORS (UNLOCKED AT LEVEL 15) ──────────────────┐
│                                                               │
│  WAVE 9    ▲ 12    ◐ 10    ■ 6                              │
│            HEAVY ASSAULT INCOMING                             │
│                                                               │
│  WAVE 10   ▲ 15    ◐ 12    ■ 8    ◇ 4    ✳ 2               │
│            ⚠ ALL FACTIONS - PREPARE FOR BOSS                 │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Faction Icons and Identification

### Visual Language

| Faction | Icon | Color | Shape |
|---------|------|-------|-------|
| Klingon | ▲ | Red | Triangle |
| Romulan | ◐ | Lime | Crescent |
| Borg | ■ | Green | Square |
| Tholian | ◇ | Orange | Diamond |
| Species 8472 | ✳ | Lavender | Star |

### Quick Reference Card

```
┌─ ENEMY REFERENCE ────────────────────────────────────────────┐
│                                                               │
│  ▲ KLINGON     Fast, direct attack, low shields             │
│                COUNTER: High fire-rate turrets               │
│                                                               │
│  ◐ ROMULAN     Evasive, high shields, medium hull           │
│                COUNTER: Tetryon Beams (3x shield damage)     │
│                                                               │
│  ■ BORG        Slow, very high HP and shields               │
│                COUNTER: Sustained damage, all turrets        │
│                                                               │
│  ◇ THOLIAN     Orbits and shoots, ranged threat             │
│                COUNTER: Long-range Torpedo Launchers         │
│                                                               │
│  ✳ SPECIES 8472  Hunts turrets, massive HP, no shields      │
│                COUNTER: Concentrated firepower               │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Tactical Recommendations

### Automatic Suggestions

```typescript
interface TacticalRecommendation {
  condition: (waveConfig: WaveConfig) => boolean;
  message: string;
  priority: 'INFO' | 'WARNING' | 'CRITICAL';
}

const RECOMMENDATIONS: TacticalRecommendation[] = [
  {
    condition: (wave) => wave.enemies.some(e => e.faction === FactionId.ROMULAN && e.count >= 5),
    message: 'Romulan presence detected. Tetryon Beams recommended for shield stripping.',
    priority: 'INFO'
  },
  {
    condition: (wave) => wave.enemies.some(e => e.faction === FactionId.BORG && e.count >= 3),
    message: 'Multiple Borg vessels incoming. Sustained damage required.',
    priority: 'WARNING'
  },
  {
    condition: (wave) => wave.enemies.some(e => e.faction === FactionId.SPECIES_8472),
    message: '⚠ SPECIES 8472 DETECTED - Protect your turrets!',
    priority: 'CRITICAL'
  },
  {
    condition: (wave) => getTotalEnemies(wave) > 30,
    message: 'Large wave incoming. Consider Gravity Well ability.',
    priority: 'WARNING'
  },
  {
    condition: (wave) => wave.enemies.some(e => e.faction === FactionId.THOLIAN && e.count >= 4),
    message: 'Tholian web threat detected. Spread turret coverage.',
    priority: 'INFO'
  }
];
```

### Contextual Tips

```
┌─ TACTICAL ADVISORY ──────────────────────────────────────────┐
│                                                               │
│  Based on WAVE 10 composition:                               │
│                                                               │
│  ✓ Your 2 Tetryon Beams will handle Romulan shields        │
│  ⚠ No counter for Species 8472 - consider Torpedo focus     │
│  ⚠ Tholians will orbit - ensure 360° coverage               │
│                                                               │
│  OVERALL READINESS: 67%                                      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

---

## Wave Countdown Timer

### Between Waves

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│                    WAVE 8 INCOMING                         │
│                                                             │
│                         2.4s                               │
│                                                             │
│         ▲ 10     ◐ 8     ■ 4                              │
│                                                             │
│    [PLACE TURRETS NOW]                                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Progress Indicator

```
WAVE PROGRESS: ████████░░░░░░░░░░░░ 8/22 enemies remaining
               ────────────────────────────────────────────
               Wave 7 • Time Elapsed: 01:23
```

---

## Scanner Upgrades (Progression)

### Unlockable Intel Features

| Level | Unlock | Benefit |
|-------|--------|---------|
| 1 | Basic Sensors | Current wave info |
| 5 | Tactical Preview | Next wave preview |
| 15 | Long-Range Sensors | +2 wave preview |
| 25 | Threat Analysis | Enemy recommendations |
| 40 | Strategic Planning | Wave modifiers visible |
| 50 | Full Spectrum | All information available |

### Scanner Levels

```typescript
enum ScannerLevel {
  BASIC = 1,       // Current wave only
  TACTICAL = 2,    // Next wave
  LONG_RANGE = 3,  // +2 waves
  STRATEGIC = 4    // All info + recommendations
}

function getVisibleWaves(scannerLevel: ScannerLevel): number {
  switch (scannerLevel) {
    case ScannerLevel.BASIC: return 0;      // No preview
    case ScannerLevel.TACTICAL: return 1;   // Next wave
    case ScannerLevel.LONG_RANGE: return 3; // +2 waves
    case ScannerLevel.STRATEGIC: return 5;  // +4 waves
  }
}
```

---

## Implementation Architecture

### IntelManager Class

```typescript
class IntelManager {
  private scannerLevel: ScannerLevel = ScannerLevel.TACTICAL;
  
  // Get visible wave information
  getWaveIntel(currentWave: number): WaveIntel[] {
    const intel: WaveIntel[] = [];
    const visibleWaves = getVisibleWaves(this.scannerLevel);
    
    for (let i = 1; i <= visibleWaves; i++) {
      const waveNumber = currentWave + i;
      const config = getWaveConfig(waveNumber);
      
      intel.push({
        waveNumber,
        enemies: this.summarizeEnemies(config),
        threatLevel: this.calculateThreatLevel(config),
        recommendations: this.generateRecommendations(config)
      });
    }
    
    return intel;
  }
  
  private summarizeEnemies(config: WaveConfig): EnemySummary[] {
    return config.enemies.map(e => ({
      faction: e.faction,
      count: e.count,
      icon: getFactionIcon(e.faction),
      color: getFactionColor(e.faction)
    }));
  }
  
  private calculateThreatLevel(config: WaveConfig): ThreatLevel {
    const total = config.enemies.reduce((sum, e) => {
      const factionWeight = getFactionThreatWeight(e.faction);
      return sum + e.count * factionWeight;
    }, 0);
    
    if (total < 15) return 'LOW';
    if (total < 30) return 'MODERATE';
    if (total < 50) return 'HIGH';
    return 'EXTREME';
  }
  
  private generateRecommendations(config: WaveConfig): string[] {
    return RECOMMENDATIONS
      .filter(rec => rec.condition(config))
      .map(rec => rec.message);
  }
}
```

### UI Component

```typescript
class WavePreviewUI {
  private container: Container;
  private intelManager: IntelManager;
  
  update(currentWave: number): void {
    const intel = this.intelManager.getWaveIntel(currentWave);
    this.renderCurrentWave(currentWave);
    this.renderUpcomingWaves(intel);
    this.renderRecommendations(intel);
  }
  
  private renderUpcomingWaves(intel: WaveIntel[]): void {
    // Clear existing
    this.upcomingContainer.removeChildren();
    
    for (const wave of intel) {
      const panel = this.createWavePanel(wave);
      this.upcomingContainer.addChild(panel);
    }
  }
  
  private createWavePanel(wave: WaveIntel): Container {
    const panel = new Container();
    
    // Wave number
    const title = new Text(`WAVE ${wave.waveNumber}`, LCARS_STYLE);
    panel.addChild(title);
    
    // Enemy icons
    for (const enemy of wave.enemies) {
      const icon = this.createEnemyIcon(enemy);
      panel.addChild(icon);
    }
    
    // Threat indicator
    const threat = this.createThreatBar(wave.threatLevel);
    panel.addChild(threat);
    
    return panel;
  }
}
```

---

## Information Timing

### When to Show What

| Game State | Visible Information |
|------------|---------------------|
| Wave Active | Current wave progress, enemy counts |
| Wave Transition | Next wave preview (3 seconds) |
| Paused | Full intel panel accessible |
| Pre-Wave 1 | Tutorial tip about wave preview |

### Information Reveal Animation

```typescript
// Staggered reveal of wave info
async function revealWaveIntel(wave: WaveIntel): Promise<void> {
  // Flash "INCOMING TRANSMISSION"
  await showTransmissionEffect(500);
  
  // Reveal wave number
  await fadeIn(waveNumberText, 300);
  
  // Reveal enemies one by one
  for (const enemy of wave.enemies) {
    await fadeIn(createEnemyIcon(enemy), 200);
    await delay(100);
  }
  
  // Reveal threat level
  await fadeIn(threatIndicator, 300);
  
  // Reveal recommendations (if unlocked)
  if (hasRecommendationAccess) {
    await fadeIn(recommendationsPanel, 400);
  }
}
```

---

## Player Experience Benefits

### Informed Decision Making
- Know when to save resources
- Prepare specific counters
- Plan turret placement strategically

### Reduced Frustration
- No "unfair" surprise compositions
- Can prepare for difficulty spikes
- Failures feel preventable

### Strategic Depth
- Rewards knowledge of enemy types
- Encourages varied turret builds
- Creates anticipation and tension

### Learning Curve
- Teaches players about faction counters
- Recommendations guide new players
- Gradual information unlock matches skill growth

---

## Audio/Visual Polish

### Sound Design

| Event | Sound |
|-------|-------|
| Wave Preview Appear | Comm chime |
| Threat Level HIGH | Warning klaxon |
| Recommendations Update | Data chirp |
| Species 8472 Detected | Emergency alert |

### Visual Effects

- LCARS-style animated borders
- Faction icons with subtle glow
- Threat bars that pulse when high
- Smooth transitions between waves

---

## Balance Considerations

### Not Too Much Information

```typescript
// Limit detail level based on scanner
function getEnemyDetail(faction: FactionIdType, scannerLevel: ScannerLevel): EnemyDetail {
  if (scannerLevel < ScannerLevel.STRATEGIC) {
    // Basic info only
    return {
      faction,
      icon: getFactionIcon(faction),
      count: '?'  // Exact count hidden until higher scanner
    };
  }
  
  // Full detail at high scanner level
  return {
    faction,
    icon: getFactionIcon(faction),
    count: exactCount,
    stats: getEnemyStats(faction)
  };
}
```

### Preserving Some Mystery

- Hidden achievements for discovering counters naturally
- Procedural waves after Wave 10 have slightly randomized compositions
- Boss waves have "?" element for surprise mechanics

---

## Mobile Adaptation

### Compact Preview

```
┌─ WAVE 8 ─────────────────┐
│ ▲10 ◐8 ■4               │
│ THREAT: ████░░ HIGH     │
└─────────────────────────┘
```

### Touch-Friendly

- Tap wave preview for detailed breakdown
- Swipe to see more waves
- Long-press for enemy info card

---

## Conclusion

The Strategic Intel and Wave Preview system transforms Kobayashi Maru from a reactive survival game into a strategic planning experience. By giving players visibility into upcoming threats, every turret placement becomes a meaningful decision. The tiered information unlock creates a satisfying progression, while tactical recommendations help new players learn the game's counter-play systems.

**Estimated Implementation Time:** 2-3 days  
**Risk Level:** Very Low (UI addition)  
**ROI:** Significant quality-of-life improvement
