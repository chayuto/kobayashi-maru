# Enhancement Task 10: Combat Feedback Sounds

**Date:** 2025-12-07  
**Priority:** HIGH  
**Category:** Audio Enhancement  
**Estimated Effort:** 1 day  
**Dependencies:** Task 09 (Advanced Audio System)

---

## Objective

Implement comprehensive audio feedback for combat events including hit confirmations, shield breaks, critical hits, warnings for low health, and other tactical audio cues to improve player awareness and game feel.

---

## Current State

**Audio System**: `src/audio/AudioManager.ts`
- Basic weapon fire sounds
- Simple explosion sounds
- Wave start/complete sounds

**Missing**:
- No hit confirmation feedback
- No damage type distinction
- No warning sounds
- No tactical audio cues
- No audio feedback for shield states

---

## Proposed Sounds

### 1. Hit Confirmation Sounds

**Goal**: Audio feedback when attacks connect

```typescript
// Add to src/audio/AudioManager.ts

/**
 * Play hit confirmation sound
 */
playHitConfirm(damageType: 'hull' | 'shield'): void {
    if (damageType === 'shield') {
        this.playShieldHit();
    } else {
        this.playHullHit();
    }
}

/**
 * Shield hit sound (higher pitch, crystalline)
 */
private playShieldHit(): void {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    // Two oscillators for richer sound
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.08);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(900, this.audioContext.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.audioContext.currentTime + 0.1);
    osc2.stop(this.audioContext.currentTime + 0.1);
}

/**
 * Hull hit sound (lower pitch, metallic)
 */
private playHullHit(): void {
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
}
```

### 2. Critical Hit Sound

**Goal**: Distinct audio for critical hits

```typescript
/**
 * Play critical hit sound (powerful, satisfying)
 */
playCriticalHit(): void {
    // Bass punch
    const bassosc = this.audioContext.createOscillator();
    const bassGain = this.audioContext.createGain();
    
    bassosc.type = 'sine';
    bassosc.frequency.setValueAtTime(80, this.audioContext.currentTime);
    bassosc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.15);
    
    bassGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    bassGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    bassosc.connect(bassGain);
    bassGain.connect(this.masterGain);
    
    bassosc.start();
    bassosc.stop(this.audioContext.currentTime + 0.2);
    
    // High-frequency sparkle
    setTimeout(() => {
        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const sparkleGain = this.audioContext.createGain();
        
        osc1.type = 'sine';
        osc1.frequency.value = 1200;
        
        osc2.type = 'sine';
        osc2.frequency.value = 1800;
        
        sparkleGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        sparkleGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        
        osc1.connect(sparkleGain);
        osc2.connect(sparkleGain);
        sparkleGain.connect(this.masterGain);
        
        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 0.15);
        osc2.stop(this.audioContext.currentTime + 0.15);
    }, 50);
}
```

### 3. Shield Break Sound

**Goal**: Dramatic sound when shields are depleted

```typescript
/**
 * Play shield break sound (glass shatter)
 */
playShieldBreak(): void {
    // Generate noise burst (white noise for shatter)
    const bufferSize = this.audioContext.sampleRate * 0.2;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / bufferSize * 8);
    }
    
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    source.buffer = buffer;
    
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(500, this.audioContext.currentTime + 0.2);
    filter.Q.value = 2;
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
    
    // Add tonal component
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1500, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.25);
    
    oscGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
    
    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.25);
}
```

### 4. Warning Sounds

**Goal**: Alert player to dangerous situations

```typescript
/**
 * Play low health warning (pulsing alarm)
 */
playLowHealthWarning(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.value = 440;
    
    // Pulse effect
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.05);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.15);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
}

/**
 * Play incoming wave warning
 */
playIncomingWaveWarning(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.35);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.35);
}

/**
 * Play enemy targeting warning (radar ping)
 */
playTargetingWarning(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 800;
    
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.08);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.08);
}
```

### 5. UI Feedback Sounds

**Goal**: Audio for menu interactions

```typescript
/**
 * Play button click sound
 */
playButtonClick(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.value = 600;
    
    gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.05);
}

/**
 * Play turret placed sound
 */
playTurretPlaced(): void {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(400, this.audioContext.currentTime);
    osc1.frequency.linearRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
    
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(600, this.audioContext.currentTime);
    osc2.frequency.linearRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.audioContext.currentTime + 0.15);
    osc2.stop(this.audioContext.currentTime + 0.15);
}

/**
 * Play insufficient resources sound
 */
playInsufficientResources(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
}

/**
 * Play upgrade sound
 */
playUpgradeSound(): void {
    // Ascending arpeggio
    const notes = [440, 550, 660, 880]; // A4, C#5, E5, A5
    const noteLength = 0.08;
    
    notes.forEach((freq, i) => {
        setTimeout(() => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            gain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + noteLength);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + noteLength);
        }, i * noteLength * 1000);
    });
}
```

### 6. Achievement Unlock Sound

**Goal**: Celebratory sound for achievements

```typescript
/**
 * Play achievement unlock sound
 */
playAchievementUnlock(): void {
    // Fanfare sound
    const notes = [
        { freq: 523, time: 0 },      // C5
        { freq: 659, time: 0.15 },   // E5
        { freq: 784, time: 0.3 },    // G5
        { freq: 1047, time: 0.45 }   // C6
    ];
    
    notes.forEach(note => {
        setTimeout(() => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = note.freq;
            
            gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        }, note.time * 1000);
    });
}
```

---

## Integration Points

### Damage System
```typescript
// src/systems/damageSystem.ts

function applyDamage(world: GameWorld, entity: number, damage: number, isCritical: boolean): void {
    // Determine damage type
    let damageType: 'hull' | 'shield' = 'hull';
    
    if (hasComponent(world, Shield, entity) && Shield.current[entity] > 0) {
        damageType = 'shield';
        Shield.current[entity] -= damage;
        
        // Shield break
        if (Shield.current[entity] <= 0) {
            world.audioManager.playShieldBreak();
            Shield.current[entity] = 0;
        } else {
            world.audioManager.playHitConfirm('shield');
        }
    } else {
        Health.current[entity] -= damage;
        world.audioManager.playHitConfirm('hull');
    }
    
    // Critical hit
    if (isCritical) {
        world.audioManager.playCriticalHit();
    }
}
```

### Health Monitoring
```typescript
// src/core/Game.ts or health monitoring system

function checkKobayashiMaruHealth(world: GameWorld): void {
    const healthPercent = Health.current[world.kobayashiMaru] / Health.max[world.kobayashiMaru];
    
    // Play warning when health drops below 30%
    if (healthPercent < 0.3 && !world.lowHealthWarningPlaying) {
        world.lowHealthWarningPlaying = true;
        world.audioManager.playLowHealthWarning();
        
        // Repeat every 3 seconds
        setInterval(() => {
            if (healthPercent < 0.3) {
                world.audioManager.playLowHealthWarning();
            }
        }, 3000);
    }
}
```

### UI Integration
```typescript
// Button clicks
button.on('pointerdown', () => {
    this.audioManager.playButtonClick();
    // ... button logic
});

// Turret placement
placementManager.on('turretPlaced', () => {
    this.audioManager.playTurretPlaced();
});

// Insufficient resources
placementManager.on('insufficientResources', () => {
    this.audioManager.playInsufficientResources();
});

// Upgrade
upgradeManager.on('upgraded', () => {
    this.audioManager.playUpgradeSound();
});

// Achievement
achievementManager.on('unlocked', () => {
    this.audioManager.playAchievementUnlock();
});
```

---

## Sound Design Guidelines

### Frequency Ranges
- **Low Health Warning**: 400-500 Hz (attention-grabbing)
- **Shield Hits**: 600-900 Hz (crystalline, high)
- **Hull Hits**: 100-200 Hz (metallic, low)
- **Critical Hits**: 80 Hz (bass) + 1200-1800 Hz (sparkle)
- **UI Sounds**: 600-800 Hz (neutral, pleasant)

### Volume Levels
- Combat sounds: 0.15-0.20
- Warnings: 0.20-0.25 (louder)
- UI sounds: 0.10-0.12 (quieter)
- Achievement: 0.15 (celebratory)

---

## Configuration

```typescript
export const COMBAT_AUDIO_CONFIG = {
    // Hit confirmation
    HIT_CONFIRM_ENABLED: true,
    SHIELD_HIT_VOLUME: 0.15,
    HULL_HIT_VOLUME: 0.20,
    
    // Critical hits
    CRIT_HIT_ENABLED: true,
    CRIT_HIT_VOLUME: 0.25,
    
    // Warnings
    LOW_HEALTH_WARNING: true,
    LOW_HEALTH_THRESHOLD: 0.3,
    WARNING_INTERVAL: 3000, // ms
    
    // UI sounds
    UI_SOUNDS_ENABLED: true,
    UI_VOLUME: 0.10
};
```

---

## Testing Requirements

```typescript
// src/__tests__/AudioManager.enhanced.test.ts

describe('Combat Feedback Sounds', () => {
    test('should play shield hit sound');
    test('should play hull hit sound');
    test('should play critical hit sound');
    test('should play shield break sound');
    test('should play low health warning');
    test('should play turret placed sound');
    test('should play upgrade sound');
    test('should play achievement unlock sound');
});
```

---

## Success Criteria

- ✅ Hit confirmation sounds play on damage
- ✅ Shield break sound distinct and noticeable
- ✅ Critical hit audio satisfying
- ✅ Low health warning alerts player
- ✅ UI feedback sounds for all interactions
- ✅ Achievement unlock celebratory
- ✅ All sounds configurable
- ✅ Volume balanced across sound types
- ✅ All tests passing

---

## Audio Feedback Table

| Event | Sound | Frequency | Duration | Volume |
|-------|-------|-----------|----------|--------|
| Shield Hit | Crystalline beep | 600-400 Hz | 0.08s | 0.15 |
| Hull Hit | Metallic thud | 200-100 Hz | 0.1s | 0.20 |
| Critical Hit | Bass + sparkle | 80 Hz + 1200 Hz | 0.2s | 0.25 |
| Shield Break | Glass shatter | 2000-500 Hz | 0.25s | 0.30 |
| Low Health | Pulsing alarm | 440 Hz | 0.2s | 0.20 |
| Wave Warning | Rising tone | 300-600 Hz | 0.35s | 0.15 |
| Button Click | Quick beep | 600 Hz | 0.05s | 0.10 |
| Turret Placed | Ascending | 400-800 Hz | 0.15s | 0.15 |
| Upgrade | Arpeggio | 440-880 Hz | 0.32s | 0.12 |
| Achievement | Fanfare | 523-1047 Hz | 0.75s | 0.15 |

---

## Future Enhancements

- Voice announcements (text-to-speech)
- Combo milestone sounds
- Boss intro/death sounds
- Ambient combat sounds (distant battles)
- Dynamic music intensity
- Danger state music shift

---

## References

- Audio manager: `src/audio/AudioManager.ts`
- Damage system: `src/systems/damageSystem.ts`
- Combat system: `src/systems/combatSystem.ts`
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
