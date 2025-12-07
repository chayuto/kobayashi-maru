# Enhancement Task 07: Combo & Score Multiplier System

**Date:** 2025-12-07  
**Priority:** HIGH  
**Category:** Gameplay Feature  
**Estimated Effort:** 1-2 days  
**Dependencies:** None

---

## Objective

Implement a kill streak combo system with score multipliers, visual feedback, and time-based decay to reward skilled play and create exciting gameplay moments.

---

## Current State

**Scoring**: `src/game/scoreManager.ts`
- Simple additive scoring
- No kill streak tracking
- No multipliers
- Basic score calculation

**Missing**:
- Combo counter
- Multiplier system
- Visual feedback
- Time-based decay
- Audio cues

---

## Proposed Implementation

### 1. Combo Manager

**Location**: `src/game/ComboManager.ts` (new file)

```typescript
export interface ComboState {
    kills: number;           // Current kill streak
    multiplier: number;      // Current score multiplier (1x, 2x, 3x, etc.)
    timeRemaining: number;   // Time until combo expires (seconds)
    maxCombo: number;        // Highest combo this session
    totalMultipliedScore: number; // Extra score from multipliers
}

export class ComboManager {
    private state: ComboState;
    private listeners: Set<(state: ComboState) => void> = new Set();
    
    // Configuration
    private readonly COMBO_THRESHOLDS = [5, 10, 20, 35, 50, 75, 100]; // Kills for each multiplier
    private readonly BASE_MULTIPLIERS = [1, 1.5, 2, 2.5, 3, 4, 5];     // Multiplier at each threshold
    private readonly COMBO_DECAY_TIME = 3.0;  // Seconds until combo expires
    private readonly TIME_EXTENSION = 0.5;    // Seconds added per kill
    
    constructor() {
        this.state = {
            kills: 0,
            multiplier: 1,
            timeRemaining: 0,
            maxCombo: 0,
            totalMultipliedScore: 0
        };
    }
    
    /**
     * Register kill and update combo
     */
    registerKill(): void {
        this.state.kills++;
        
        // Update max combo
        if (this.state.kills > this.state.maxCombo) {
            this.state.maxCombo = this.state.kills;
        }
        
        // Extend timer
        this.state.timeRemaining = Math.min(
            this.COMBO_DECAY_TIME,
            this.state.timeRemaining + this.TIME_EXTENSION
        );
        
        // Update multiplier
        this.updateMultiplier();
        
        // Notify listeners
        this.notifyListeners();
    }
    
    /**
     * Update multiplier based on kill count
     */
    private updateMultiplier(): void {
        let newMultiplier = 1;
        
        for (let i = this.COMBO_THRESHOLDS.length - 1; i >= 0; i--) {
            if (this.state.kills >= this.COMBO_THRESHOLDS[i]) {
                newMultiplier = this.BASE_MULTIPLIERS[i];
                break;
            }
        }
        
        // Trigger multiplier increase event
        if (newMultiplier > this.state.multiplier) {
            this.onMultiplierIncrease(newMultiplier);
        }
        
        this.state.multiplier = newMultiplier;
    }
    
    /**
     * Update combo timer
     */
    update(deltaTime: number): void {
        if (this.state.timeRemaining > 0) {
            this.state.timeRemaining -= deltaTime;
            
            if (this.state.timeRemaining <= 0) {
                this.breakCombo();
            }
            
            this.notifyListeners();
        }
    }
    
    /**
     * Break combo (timeout)
     */
    private breakCombo(): void {
        if (this.state.kills > 0) {
            this.onComboBreak();
        }
        
        this.state.kills = 0;
        this.state.multiplier = 1;
        this.state.timeRemaining = 0;
        
        this.notifyListeners();
    }
    
    /**
     * Calculate score with multiplier
     */
    calculateScore(baseScore: number): number {
        const multipliedScore = Math.floor(baseScore * this.state.multiplier);
        const bonus = multipliedScore - baseScore;
        
        this.state.totalMultipliedScore += bonus;
        
        return multipliedScore;
    }
    
    /**
     * Get current combo state
     */
    getState(): Readonly<ComboState> {
        return { ...this.state };
    }
    
    /**
     * Get combo rank name
     */
    getComboRank(): string {
        const kills = this.state.kills;
        
        if (kills >= 100) return 'LEGENDARY';
        if (kills >= 75) return 'UNSTOPPABLE';
        if (kills >= 50) return 'GODLIKE';
        if (kills >= 35) return 'DOMINATING';
        if (kills >= 20) return 'RAMPAGE';
        if (kills >= 10) return 'KILLING SPREE';
        if (kills >= 5) return 'DOUBLE KILL';
        
        return '';
    }
    
    /**
     * Register listener for combo state changes
     */
    addListener(callback: (state: ComboState) => void): void {
        this.listeners.add(callback);
    }
    
    /**
     * Remove listener
     */
    removeListener(callback: (state: ComboState) => void): void {
        this.listeners.delete(callback);
    }
    
    /**
     * Notify all listeners
     */
    private notifyListeners(): void {
        for (const listener of this.listeners) {
            listener(this.state);
        }
    }
    
    /**
     * Event: Multiplier increased
     */
    private onMultiplierIncrease(newMultiplier: number): void {
        // Trigger visual and audio feedback
        console.log(`MULTIPLIER INCREASED: ${newMultiplier}x`);
    }
    
    /**
     * Event: Combo broken
     */
    private onComboBreak(): void {
        console.log(`COMBO BROKEN: ${this.state.kills} kills`);
    }
    
    /**
     * Reset all stats (new game)
     */
    reset(): void {
        this.state = {
            kills: 0,
            multiplier: 1,
            timeRemaining: 0,
            maxCombo: 0,
            totalMultipliedScore: 0
        };
        this.notifyListeners();
    }
}
```

### 2. Combo HUD Display

**Location**: `src/ui/ComboDisplay.ts` (new file)

```typescript
import { Container, Text, Graphics, TextStyle } from 'pixi.js';

export class ComboDisplay {
    private container: Container;
    private comboText: Text;
    private multiplierText: Text;
    private timerBar: Graphics;
    private rankText: Text;
    
    private pulseAnimation: number = 0;
    private shakeAnimation: number = 0;
    
    constructor() {
        this.container = new Container();
        this.container.position.set(960, 150); // Center-top
        
        this.createDisplay();
    }
    
    /**
     * Create UI elements
     */
    private createDisplay(): void {
        // Combo counter
        const comboStyle = new TextStyle({
            fontFamily: 'Arial Black',
            fontSize: 48,
            fill: 0xFFFF00,
            stroke: { color: 0x000000, width: 4 },
            dropShadow: {
                color: 0x000000,
                blur: 4,
                angle: Math.PI / 6,
                distance: 2
            }
        });
        this.comboText = new Text({ text: '', style: comboStyle });
        this.comboText.anchor.set(0.5);
        this.container.addChild(this.comboText);
        
        // Multiplier text
        const multStyle = new TextStyle({
            fontFamily: 'Arial Black',
            fontSize: 32,
            fill: 0xFF9900,
            stroke: { color: 0x000000, width: 3 }
        });
        this.multiplierText = new Text({ text: '', style: multStyle });
        this.multiplierText.anchor.set(0.5);
        this.multiplierText.position.set(0, 50);
        this.container.addChild(this.multiplierText);
        
        // Rank text (KILLING SPREE, etc.)
        const rankStyle = new TextStyle({
            fontFamily: 'Impact',
            fontSize: 24,
            fill: 0xFF3333,
            stroke: { color: 0x000000, width: 2 },
            fontStyle: 'italic'
        });
        this.rankText = new Text({ text: '', style: rankStyle });
        this.rankText.anchor.set(0.5);
        this.rankText.position.set(0, -40);
        this.container.addChild(this.rankText);
        
        // Timer bar
        this.timerBar = new Graphics();
        this.timerBar.position.set(-100, 80);
        this.container.addChild(this.timerBar);
        
        // Initially hidden
        this.container.visible = false;
    }
    
    /**
     * Update display with combo state
     */
    update(state: ComboState, deltaTime: number): void {
        // Show/hide based on combo
        this.container.visible = state.kills > 0;
        
        if (!this.container.visible) return;
        
        // Update texts
        this.comboText.text = `${state.kills} KILLS`;
        this.multiplierText.text = `${state.multiplier.toFixed(1)}x MULTIPLIER`;
        this.rankText.text = this.getComboRank(state.kills);
        
        // Update timer bar
        this.updateTimerBar(state.timeRemaining, 3.0);
        
        // Update animations
        this.updateAnimations(deltaTime);
        
        // Color based on multiplier
        this.updateColors(state.multiplier);
    }
    
    /**
     * Update timer bar visual
     */
    private updateTimerBar(remaining: number, max: number): void {
        this.timerBar.clear();
        
        const width = 200;
        const height = 8;
        const progress = remaining / max;
        
        // Background
        this.timerBar.roundRect(0, 0, width, height, 4);
        this.timerBar.fill({ color: 0x333333 });
        
        // Progress fill
        const fillColor = progress > 0.5 ? 0x00FF00 : (progress > 0.25 ? 0xFFFF00 : 0xFF3333);
        this.timerBar.roundRect(0, 0, width * progress, height, 4);
        this.timerBar.fill({ color: fillColor });
        
        // Border
        this.timerBar.roundRect(0, 0, width, height, 4);
        this.timerBar.stroke({ color: 0xFFFFFF, width: 2 });
    }
    
    /**
     * Update text colors based on multiplier
     */
    private updateColors(multiplier: number): void {
        if (multiplier >= 4) {
            this.comboText.style.fill = 0xFF00FF; // Magenta
            this.multiplierText.style.fill = 0xFF00FF;
        } else if (multiplier >= 3) {
            this.comboText.style.fill = 0xFF0000; // Red
            this.multiplierText.style.fill = 0xFF3333;
        } else if (multiplier >= 2) {
            this.comboText.style.fill = 0xFF9900; // Orange
            this.multiplierText.style.fill = 0xFF9900;
        } else {
            this.comboText.style.fill = 0xFFFF00; // Yellow
            this.multiplierText.style.fill = 0xFFCC00;
        }
    }
    
    /**
     * Trigger pulse animation on new kill
     */
    triggerPulse(): void {
        this.pulseAnimation = 0.3; // 300ms pulse
    }
    
    /**
     * Trigger shake on multiplier increase
     */
    triggerShake(): void {
        this.shakeAnimation = 0.2; // 200ms shake
    }
    
    /**
     * Update animations
     */
    private updateAnimations(deltaTime: number): void {
        // Pulse animation
        if (this.pulseAnimation > 0) {
            this.pulseAnimation -= deltaTime;
            const scale = 1 + (this.pulseAnimation / 0.3) * 0.3;
            this.comboText.scale.set(scale);
        } else {
            this.comboText.scale.set(1);
        }
        
        // Shake animation
        if (this.shakeAnimation > 0) {
            this.shakeAnimation -= deltaTime;
            const shake = (Math.random() - 0.5) * 10 * (this.shakeAnimation / 0.2);
            this.container.x = 960 + shake;
        } else {
            this.container.x = 960;
        }
    }
    
    /**
     * Get combo rank text
     */
    private getComboRank(kills: number): string {
        if (kills >= 100) return '★ LEGENDARY ★';
        if (kills >= 75) return 'UNSTOPPABLE!';
        if (kills >= 50) return 'GODLIKE!';
        if (kills >= 35) return 'DOMINATING!';
        if (kills >= 20) return 'RAMPAGE!';
        if (kills >= 10) return 'KILLING SPREE!';
        if (kills >= 5) return 'DOUBLE KILL!';
        return '';
    }
    
    /**
     * Get container for adding to stage
     */
    getContainer(): Container {
        return this.container;
    }
}
```

### 3. Integration with Damage System

**Update**: `src/systems/damageSystem.ts`

```typescript
export function damageSystem(world: GameWorld, deltaTime: number): void {
    // ... existing damage logic ...
    
    // When entity dies
    if (Health.current[eid] <= 0) {
        // Check if killed by player (not collision)
        if (isPlayerKill) {
            // Register kill with combo manager
            world.comboManager.registerKill();
            
            // Calculate score with multiplier
            const baseScore = 100; // Base score per kill
            const multipliedScore = world.comboManager.calculateScore(baseScore);
            world.scoreManager.addScore(multipliedScore);
            
            // Show floating score text
            world.ui.showFloatingText(
                Position.x[eid],
                Position.y[eid],
                `+${multipliedScore}`,
                0xFFFF00
            );
        }
    }
}
```

### 4. Audio Integration

**Update**: `src/audio/AudioManager.ts`

Add combo sounds:

```typescript
export class AudioManager {
    // ... existing code ...
    
    /**
     * Play combo sound based on multiplier
     */
    playComboSound(multiplier: number): void {
        // Different pitch for each multiplier level
        const basePitch = 440;
        const pitch = basePitch * (1 + multiplier * 0.2);
        
        this.playTone(pitch, 0.1, 'sine');
    }
    
    /**
     * Play combo break sound
     */
    playComboBreak(): void {
        this.playTone(200, 0.3, 'sawtooth');
    }
}
```

---

## Configuration

Add to `src/types/constants.ts`:

```typescript
export const COMBO_CONFIG = {
    // Combo thresholds for multipliers
    THRESHOLDS: [5, 10, 20, 35, 50, 75, 100],
    
    // Multiplier values
    MULTIPLIERS: [1, 1.5, 2, 2.5, 3, 4, 5],
    
    // Timing
    DECAY_TIME: 3.0,        // Seconds until combo expires
    TIME_EXTENSION: 0.5,    // Seconds added per kill
    MAX_TIME: 5.0,          // Maximum combo timer
    
    // Visual
    PULSE_DURATION: 0.3,
    SHAKE_DURATION: 0.2,
    
    // Audio
    SOUND_ON_KILL: true,
    SOUND_ON_MULTIPLIER: true,
    SOUND_ON_BREAK: true
};
```

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/ComboManager.test.ts

describe('ComboManager', () => {
    test('should register kills and increase combo');
    test('should update multiplier at thresholds');
    test('should extend timer on each kill');
    test('should break combo on timeout');
    test('should track max combo');
    test('should calculate multiplied score');
    test('should notify listeners on state change');
    test('should reset on new game');
});

// src/__tests__/ComboDisplay.test.ts

describe('ComboDisplay', () => {
    test('should show/hide based on combo');
    test('should update texts correctly');
    test('should render timer bar');
    test('should change colors by multiplier');
    test('should animate on events');
});
```

---

## Success Criteria

- ✅ Combo counter increases on kills
- ✅ Multiplier updates at thresholds
- ✅ Timer bar shows time remaining
- ✅ Combo breaks on timeout
- ✅ Visual feedback (pulse, shake, colors)
- ✅ Audio feedback on multiplier change
- ✅ Score calculation uses multiplier
- ✅ Floating text shows multiplied score
- ✅ All tests passing
- ✅ Performance maintained at 60 FPS

---

## Visual Examples

### Display States

```
5 kills:
┌──────────────────┐
│   DOUBLE KILL!   │
│     5 KILLS      │
│  1.5x MULTIPLIER │
│ ████████████░░░░ │ ← Timer
└──────────────────┘

20 kills:
┌──────────────────┐
│    RAMPAGE!      │
│    20 KILLS      │ ← Larger, orange
│  2.5x MULTIPLIER │
│ █████████░░░░░░░ │
└──────────────────┘

100 kills:
┌──────────────────┐
│  ★ LEGENDARY ★   │
│   100 KILLS      │ ← Huge, magenta
│  5.0x MULTIPLIER │
│ ████░░░░░░░░░░░░ │
└──────────────────┘
```

---

## Future Enhancements

- Combo achievements
- Combo milestones (50 kills = bonus reward)
- Multiplier on damage dealt (not just score)
- Resource multiplier on kills
- Combo leaderboard
- Special effects at high combos
- Announcer voice (text-to-speech)

---

## References

- Score manager: `src/game/scoreManager.ts`
- Damage system: `src/systems/damageSystem.ts`
- HUD manager: `src/ui/HUDManager.ts`
- Audio manager: `src/audio/AudioManager.ts`
