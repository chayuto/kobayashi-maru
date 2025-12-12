# AI HUD Engagement Enhancement

**Date:** December 13, 2025  
**Status:** Planning  
**Related:** AI Autoplay Overhaul, Stage 6 Polish

---

## Executive Summary

Transform the AI auto-play experience from a "black box" into an **engaging, transparent, and entertaining companion**. Players should feel like they're watching a skilled commander in action, with clear visual feedback on what the AI is thinking, planning, and executing.

> [!IMPORTANT]
> The goal is not just information display—it's **entertainment and connection**. Players should feel the AI is a character with personality, not just an algorithm.

---

## Current State

### Existing AI Status Interface
```typescript
interface AIStatus {
    enabled: boolean;
    personality: AIPersonality;  // BALANCED, AGGRESSIVE, DEFENSIVE, ECONOMIC, ADAPTIVE
    currentAction: AIAction | null;
    threatLevel: number;
    coveragePercent: number;
    lastDecisionTime: number;
}
```

### Current HUD Panels
| Panel | Purpose |
|-------|---------|
| WavePanel | Wave number, state, enemy count |
| ResourcePanel | Current resources |
| ScorePanel | Time survived, kills |
| StatusPanel | Ship health/shield |
| TurretCountPanel | Active turret count |
| CombatStatsPanel | DPS, accuracy, damage |
| ComboPanel | Combo multiplier |

### Gap Analysis
- ❌ No AI-specific panel exists
- ❌ AI decisions are invisible to player
- ❌ No personality visualization
- ❌ No strategic intent communication
- ❌ Missing "commander presence" feel

---

## Proposed AI HUD Features

### 1. 🤖 AI Commander Panel

A dedicated panel showing the AI's "face" and current state.

```
┌─────────────────────────────────────┐
│  ⚡ COMMANDER ACTIVE                │
│  ┌──────┐  Personality: AGGRESSIVE  │
│  │ 🎖️  │  Mood: CONFIDENT           │
│  │      │  "Targeting weak sector..."│
│  └──────┘                           │
│  ▓▓▓▓▓▓▓▓▓░ Threat: 78%            │
│  ▓▓▓▓▓▓░░░░ Coverage: 62%          │
└─────────────────────────────────────┘
```

**Key Elements:**
- **Commander Avatar**: Changes expression based on threat level
- **Personality Badge**: Visual indicator of current AI mode
- **Mood State**: Dynamic text showing AI's "emotional" state
- **Thought Bubble**: Shows what AI is currently planning
- **Threat/Coverage Bars**: Visual health of the defense

#### Mood States (Based on Game Situation)
| Game State | Mood | Expression |
|------------|------|------------|
| Low threat, high resources | 😊 CONFIDENT | "We've got this!" |
| High threat, handling it | 😤 FOCUSED | "Engaging threats..." |
| Threat under control | 😌 CALM | "Monitoring situation." |
| Overwhelmed but fighting | 😰 STRESSED | "Need more firepower!" |
| Boss wave incoming | 🔥 DETERMINED | "Here they come!" |
| Near failure | 😱 DESPERATE | "Hull critical!" |

---

### 2. 💬 AI Thought Feed

A scrolling log of AI decisions with personality-flavored commentary.

```
┌─────────────────────────────────────┐
│ 📢 COMMANDER LOG                    │
├─────────────────────────────────────┤
│ [12:34] "Placing Phaser at B3"      │
│ [12:32] "Detected flanking attempt" │
│ [12:30] "Upgrading forward turret"  │
│ [12:28] "Building economy first"    │
└─────────────────────────────────────┘
```

**Message Types:**
| Type | Icon | Example |
|------|------|---------|
| Placement | 🔧 | "Deploying torpedo launcher" |
| Upgrade | ⬆️ | "Enhancing damage output" |
| Tactical | 🎯 | "Intercepting approach vector" |
| Strategic | 🧠 | "Saving resources for boss wave" |
| Warning | ⚠️ | "Coverage gap detected!" |
| Victory | 🏆 | "Wave cleared efficiently!" |

**Personality-Flavored Messages:**

| Personality | Same Action Different Message |
|-------------|-------------------------------|
| AGGRESSIVE | "Time to bring the pain! Deploying Disruptor." |
| DEFENSIVE | "Reinforcing perimeter with Disruptor array." |
| ECONOMIC | "Cost-effective Disruptor placement at B3." |
| BALANCED | "Placing Disruptor at B3 for coverage." |

---

### 3. 🗺️ AI Intent Overlay

Visual indicators showing what the AI is planning.

**Overlay Elements:**
| Element | Visual | Purpose |
|---------|--------|---------|
| Planned Placement | 🔲 Pulsing ghost turret | Shows where AI will place next |
| Priority Zones | 🟢🟡🔴 Heat overlay | Color-coded area priorities |
| Threat Vectors | ➡️ Arrow lines | Predicted enemy paths |
| Upgrade Target | ✨ Sparkle effect | Which turret is next to upgrade |

**Visual Style:**
- Ghost turrets pulse slowly (0.5s) when AI is considering
- Flash quickly (0.1s) when about to execute
- Color matches turret type for easy identification
- Fade in/out smoothly for polish

---

### 4. 📊 AI Strategy Indicator

Shows current strategic phase without overwhelming detail.

```
┌─────────────────────────────────────┐
│ 📈 STRATEGY                         │
├─────────────────────────────────────┤
│ Phase: EARLY EXPANSION              │
│ Focus: ◉ Economy  ○ Defense  ○ DPS  │
│ Next Wave: BOSS (preparing...)      │
└─────────────────────────────────────┘
```

**Strategy Phases:**
| Phase | Focus | Behavior |
|-------|-------|----------|
| EARLY EXPANSION | Economy | Place cheap turrets, save resources |
| DEFENSIVE SETUP | Coverage | Fill gaps, ensure all paths covered |
| POWER SCALING | DPS | Upgrade damage, add heavy hitters |
| BOSS PREPARATION | Burst | Save for boss, position for DPS |
| SURVIVAL MODE | Defense | Heal ship, emergency placements |

---

### 5. 🏆 AI Performance Stats

Track how well the AI is doing (optional toggle).

```
┌─────────────────────────────────────┐
│ 📊 COMMANDER STATS                  │
├─────────────────────────────────────┤
│ Decisions: 47    Success: 94%       │
│ Best Wave: 12    Avg DPS: 234       │
│ Efficiency: ★★★★☆                  │
└─────────────────────────────────────┘
```

---

## Implementation Plan

### File Structure

```
src/ui/panels/
├── AIPanel.ts              [NEW] Main AI status panel
├── AIThoughtFeed.ts        [NEW] Scrolling decision log
├── AIStrategyIndicator.ts  [NEW] Strategic phase display

src/ui/overlays/
├── AIIntentOverlay.ts      [NEW] Ghost turrets, heat map

src/ai/humanization/
├── AIMoodEngine.ts         [NEW] Mood state calculation
├── AIMessageGenerator.ts   [NEW] Personality-flavored messages
```

---

### New Types

**File:** `src/ai/types.ts`

```typescript
/**
 * Extended AI status for engaging HUD display
 */
export interface AIStatusExtended extends AIStatus {
    // Mood system
    mood: AIMood;
    moodMessage: string;
    
    // Strategic intent
    currentPhase: AIPhase;
    phaseFocus: 'economy' | 'defense' | 'dps';
    
    // Planning visibility
    plannedAction: AIAction | null;
    plannedPosition: { x: number; y: number } | null;
    upgradeTarget: number | null;  // turret entity ID
    
    // Flow field integration
    flowFieldActive: boolean;
    interceptionPointsFound: number;
    
    // Performance
    decisionsThisWave: number;
    successRate: number;
}

export enum AIMood {
    CONFIDENT = 'CONFIDENT',
    CALM = 'CALM',
    FOCUSED = 'FOCUSED',
    STRESSED = 'STRESSED',
    DETERMINED = 'DETERMINED',
    DESPERATE = 'DESPERATE',
}

export enum AIPhase {
    EARLY_EXPANSION = 'EARLY_EXPANSION',
    DEFENSIVE_SETUP = 'DEFENSIVE_SETUP',
    POWER_SCALING = 'POWER_SCALING',
    BOSS_PREPARATION = 'BOSS_PREPARATION',
    SURVIVAL_MODE = 'SURVIVAL_MODE',
}
```

---

### AIPanel Component

**File:** `src/ui/panels/AIPanel.ts`

```typescript
export class AIPanel {
    private container: Container;
    private avatarSprite: Graphics;  // Commander avatar
    private moodText: Text;
    private thoughtText: Text;
    private threatBar: Graphics;
    private coverageBar: Graphics;
    private personalityBadge: Text;
    
    constructor() {
        this.container = new Container();
    }
    
    init(): void {
        this.createBackground();
        this.createAvatar();
        this.createMoodDisplay();
        this.createThoughtBubble();
        this.createStatusBars();
    }
    
    update(status: AIStatusExtended): void {
        this.updateAvatar(status.mood);
        this.moodText.text = this.getMoodEmoji(status.mood) + ' ' + status.mood;
        this.thoughtText.text = `"${status.moodMessage}"`;
        this.updateThreatBar(status.threatLevel);
        this.updateCoverageBar(status.coveragePercent);
        this.personalityBadge.text = status.personality;
    }
    
    private getMoodEmoji(mood: AIMood): string {
        const emojis: Record<AIMood, string> = {
            CONFIDENT: '😊',
            CALM: '😌',
            FOCUSED: '😤',
            STRESSED: '😰',
            DETERMINED: '🔥',
            DESPERATE: '😱',
        };
        return emojis[mood] ?? '🤖';
    }
}
```

---

### AIMoodEngine

**File:** `src/ai/humanization/AIMoodEngine.ts`

```typescript
export class AIMoodEngine {
    calculateMood(
        threatLevel: number,
        coveragePercent: number,
        kmHealthPercent: number,
        resources: number,
        waveThreat: 'normal' | 'elite' | 'boss'
    ): { mood: AIMood; message: string } {
        
        // Desperate: Ship is dying
        if (kmHealthPercent < 20) {
            return { mood: AIMood.DESPERATE, message: 'Hull critical! Need repairs!' };
        }
        
        // Determined: Boss wave incoming
        if (waveThreat === 'boss') {
            return { mood: AIMood.DETERMINED, message: 'Boss detected. All hands to stations!' };
        }
        
        // Stressed: High threat, low coverage
        if (threatLevel > 70 && coveragePercent < 50) {
            return { mood: AIMood.STRESSED, message: 'Defenses stretched thin...' };
        }
        
        // Focused: Active combat, handling it
        if (threatLevel > 40) {
            return { mood: AIMood.FOCUSED, message: 'Engaging hostile forces.' };
        }
        
        // Confident: Low threat, good resources
        if (resources > 500 && coveragePercent > 70) {
            return { mood: AIMood.CONFIDENT, message: 'Situation under control.' };
        }
        
        // Calm: Default peaceful state
        return { mood: AIMood.CALM, message: 'Monitoring sectors.' };
    }
}
```

---

### AIMessageGenerator

**File:** `src/ai/humanization/AIMessageGenerator.ts`

```typescript
export class AIMessageGenerator {
    private personality: AIPersonality;
    
    setPersonality(personality: AIPersonality): void {
        this.personality = personality;
    }
    
    generatePlacementMessage(turretName: string, position: string): string {
        const templates: Record<AIPersonality, string[]> = {
            AGGRESSIVE: [
                `Time for some firepower! Deploying ${turretName}.`,
                `Adding ${turretName} to rain destruction!`,
                `${turretName} online. Let them come.`,
            ],
            DEFENSIVE: [
                `Reinforcing position with ${turretName}.`,
                `Securing sector with ${turretName} emplacement.`,
                `${turretName} will hold the line.`,
            ],
            ECONOMIC: [
                `Cost-efficient ${turretName} at ${position}.`,
                `Maximizing value with ${turretName}.`,
                `Strategic ${turretName} investment.`,
            ],
            BALANCED: [
                `Placing ${turretName} at ${position}.`,
                `${turretName} deployed for coverage.`,
                `Adding ${turretName} to defense grid.`,
            ],
            ADAPTIVE: [
                `Adapting with ${turretName} placement.`,
                `${turretName} responds to threat pattern.`,
                `Tactical ${turretName} positioning.`,
            ],
        };
        
        const options = templates[this.personality] ?? templates.BALANCED;
        return options[Math.floor(Math.random() * options.length)];
    }
    
    generateUpgradeMessage(turretName: string): string {
        // Similar personality-based templates
    }
    
    generateTacticalMessage(action: string): string {
        // Context-aware tactical commentary
    }
}
```

---

### AIIntentOverlay

**File:** `src/ui/overlays/AIIntentOverlay.ts`

```typescript
export class AIIntentOverlay {
    private container: Container;
    private ghostTurret: Graphics | null = null;
    private pulseAnimation: number = 0;
    
    init(): void {
        this.container = new Container();
    }
    
    showPlannedPlacement(x: number, y: number, turretType: number): void {
        // Create ghost turret sprite at planned position
        if (!this.ghostTurret) {
            this.ghostTurret = new Graphics();
            this.container.addChild(this.ghostTurret);
        }
        
        // Draw turret silhouette with turret type color
        const color = this.getTurretColor(turretType);
        this.ghostTurret.clear();
        this.ghostTurret.circle(0, 0, 20);
        this.ghostTurret.fill({ color, alpha: 0.5 });
        this.ghostTurret.position.set(x, y);
    }
    
    showUpgradeTarget(turretId: number, position: { x: number; y: number }): void {
        // Show sparkle effect on upgrade target
    }
    
    update(deltaTime: number): void {
        // Animate ghost turret pulse
        if (this.ghostTurret) {
            this.pulseAnimation += deltaTime * 3;
            this.ghostTurret.alpha = 0.3 + Math.sin(this.pulseAnimation) * 0.2;
        }
    }
    
    hidePlannedPlacement(): void {
        if (this.ghostTurret) {
            this.ghostTurret.visible = false;
        }
    }
}
```

---

## Integration with HUDManager

**Modify:** `src/ui/HUDManager.ts`

```typescript
// Add new panel
private aiPanel: AIPanel | null = null;
private aiThoughtFeed: AIThoughtFeed | null = null;
private aiIntentOverlay: AIIntentOverlay | null = null;

// In init()
this.createAIPanel();

// New method
private createAIPanel(): void {
    if (!this.callbacks?.onToggleAI) return;  // Only show if AI is available
    
    this.aiPanel = new AIPanel();
    this.aiPanel.init();
    this.container.addChild(this.aiPanel.getContainer());
    
    this.aiThoughtFeed = new AIThoughtFeed();
    this.aiThoughtFeed.init();
    this.container.addChild(this.aiThoughtFeed.getContainer());
}

// In update()
updateAI(status: AIStatusExtended): void {
    if (!this.aiPanel) return;
    
    this.aiPanel.update(status);
    
    // Show planned action ghost
    if (status.plannedPosition) {
        this.aiIntentOverlay?.showPlannedPlacement(
            status.plannedPosition.x,
            status.plannedPosition.y,
            (status.plannedAction?.params as PlacementParams)?.turretType ?? 0
        );
    } else {
        this.aiIntentOverlay?.hidePlannedPlacement();
    }
}
```

---

## UI Layout

### Position: AI Panel

```
┌───────────────────────────────────────────────────────────────┐
│ [WavePanel]                                     [ResourcePanel]│
│ [MuteBtn]                                                      │
│ [AIPanel] ◄─── NEW! LEFT SIDE, BELOW WAVE                     │
│                                                                │
│                          [GAME AREA]                           │
│                                                                │
│                    [AIThoughtFeed] ◄─── NEW! BOTTOM CENTER    │
│ [ScorePanel]      [StatusPanel]               [TurretCountPanel]│
└───────────────────────────────────────────────────────────────┘
```

---

## Verification Plan

### Automated Tests

1. **AIMoodEngine tests:**
   - Correct mood for each game state
   - Mood transitions are logical

2. **AIMessageGenerator tests:**
   - All personalities have unique messages
   - No empty strings returned

3. **AIPanel tests:**
   - Renders without errors
   - Updates correctly with status changes

### Manual Verification

1. Enable AI auto-play
2. Watch AI Panel mood changes during gameplay
3. Read thought feed for personality flavor
4. Observe ghost turret placements before execution
5. Verify strategy indicator reflects game phase

---

## Estimated Hours

| Component | Hours |
|-----------|-------|
| AIPanel | 2-3 |
| AIMoodEngine | 1-2 |
| AIMessageGenerator | 1-2 |
| AIThoughtFeed | 1-2 |
| AIIntentOverlay | 2-3 |
| HUDManager integration | 1-2 |
| **Total** | **8-14** |

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Player understands AI intent | 80%+ of actions predicted |
| Entertainment value | Players watch AI play for fun |
| Visual polish | No jarring transitions |
| Performance impact | < 2ms per frame |

---

## Future Enhancements

- 🎙️ **Voice lines** (text-to-speech or pre-recorded)
- 🎨 **Commander customization** (avatars, voices)
- 📈 **AI replay analysis** (post-game breakdown)
- 🏅 **AI achievements** ("Survived 5 boss waves")

---

*Document Version: 1.0*
