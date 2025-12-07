# Enhancement Task 09: Advanced Audio System

**Date:** 2025-12-07  
**Priority:** HIGH  
**Category:** Audio Enhancement  
**Estimated Effort:** 1-2 days  
**Dependencies:** None

---

## Objective

Enhance the procedural audio system with layered explosion sounds, weapon sound variations, spatial audio positioning, and a background music system to create an immersive soundscape.

---

## Current State

**Location**: `src/audio/AudioManager.ts`

**Current Features**:
- Procedural Web Audio API sounds
- Basic weapon fire sounds (phaser, disruptor, torpedo)
- Simple explosions
- Wave start/complete sounds

**Limitations**:
- All sounds same volume regardless of distance
- No sound variations (repetitive)
- No background music
- Basic explosion sounds
- No layering or mixing

---

## Proposed Enhancements

### 1. Spatial Audio Positioning

**Goal**: Sound volume/pan based on distance from listener

```typescript
// Add to src/audio/AudioManager.ts

export interface SpatialSoundConfig {
    x: number;
    y: number;
    listenerX: number;
    listenerY: number;
    maxDistance: number;
    rolloffFactor: number;
}

export class AudioManager {
    private listener = { x: 960, y: 540 }; // Camera center
    
    /**
     * Calculate spatial audio parameters
     */
    private calculateSpatialParams(config: SpatialSoundConfig): { volume: number; pan: number } {
        const dx = config.x - config.listenerX;
        const dy = config.y - config.listenerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Volume falloff
        const volume = Math.max(0, 1 - (distance / config.maxDistance) ** config.rolloffFactor);
        
        // Stereo panning (-1 left, 0 center, 1 right)
        const pan = Math.max(-1, Math.min(1, dx / config.maxDistance));
        
        return { volume, pan };
    }
    
    /**
     * Play sound at position with spatial audio
     */
    playSpatial(soundType: string, x: number, y: number): void {
        const spatial = this.calculateSpatialParams({
            x,
            y,
            listenerX: this.listener.x,
            listenerY: this.listener.y,
            maxDistance: 1000,
            rolloffFactor: 1.5
        });
        
        if (spatial.volume < 0.05) return; // Skip if too quiet
        
        // Create audio with spatial parameters
        this.playWithParams(soundType, spatial.volume, spatial.pan);
    }
    
    /**
     * Update listener position (camera)
     */
    setListenerPosition(x: number, y: number): void {
        this.listener.x = x;
        this.listener.y = y;
    }
}
```

### 2. Layered Explosion Sounds

**Goal**: Rich explosion audio with multiple layers

```typescript
/**
 * Play layered explosion sound
 */
playExplosion(size: 'small' | 'medium' | 'large', x: number, y: number): void {
    const layers = this.getExplosionLayers(size);
    
    for (const layer of layers) {
        setTimeout(() => {
            this.playSpatial(layer.sound, x, y);
        }, layer.delay);
    }
}

/**
 * Get explosion sound layers
 */
private getExplosionLayers(size: string): Array<{ sound: string; delay: number }> {
    const layers = {
        small: [
            { sound: 'explosion_impact', delay: 0 },
            { sound: 'explosion_rumble', delay: 30 }
        ],
        medium: [
            { sound: 'explosion_impact', delay: 0 },
            { sound: 'explosion_debris', delay: 50 },
            { sound: 'explosion_rumble', delay: 100 }
        ],
        large: [
            { sound: 'explosion_shockwave', delay: 0 },
            { sound: 'explosion_impact', delay: 50 },
            { sound: 'explosion_debris', delay: 100 },
            { sound: 'explosion_rumble', delay: 150 },
            { sound: 'explosion_echo', delay: 300 }
        ]
    };
    
    return layers[size] || layers.small;
}

/**
 * Generate explosion impact sound (sharp, high-frequency burst)
 */
private generateExplosionImpact(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
}

/**
 * Generate explosion rumble (low-frequency sustained)
 */
private generateExplosionRumble(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(60, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.6);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.6);
}

/**
 * Generate explosion debris (crackle noise)
 */
private generateExplosionDebris(): void {
    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    
    // White noise
    for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
    }
    
    const source = this.audioContext.createBufferSource();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    source.buffer = buffer;
    filter.type = 'bandpass';
    filter.frequency.value = 2000;
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
    
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    source.start();
}
```

### 3. Weapon Sound Variations

**Goal**: Randomize pitch/timbre to avoid repetition

```typescript
/**
 * Play weapon sound with variations
 */
playWeaponFire(weaponType: string, x: number, y: number): void {
    // Random pitch variation (±10%)
    const pitchVariation = 0.9 + Math.random() * 0.2;
    
    // Random filter cutoff
    const filterVariation = 0.8 + Math.random() * 0.4;
    
    this.playWeaponSound(weaponType, x, y, pitchVariation, filterVariation);
}

/**
 * Generate phaser sound with variations
 */
private generatePhaserSound(pitch: number, filterMod: number): void {
    const osc = this.audioContext.createOscillator();
    const filter = this.audioContext.createBiquadFilter();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800 * pitch, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200 * pitch, this.audioContext.currentTime + 0.05);
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2000 * filterMod, this.audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800 * filterMod, this.audioContext.currentTime + 0.05);
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.1);
}
```

### 4. Background Music System

**Goal**: Simple procedural ambient music

```typescript
/**
 * Background music manager
 */
export class MusicManager {
    private audioContext: AudioContext;
    private masterGain: GainNode;
    private playing: boolean = false;
    private oscillators: OscillatorNode[] = [];
    
    constructor(audioContext: AudioContext, masterGain: GainNode) {
        this.audioContext = audioContext;
        this.masterGain = masterGain;
    }
    
    /**
     * Start ambient background music
     */
    start(): void {
        if (this.playing) return;
        this.playing = true;
        
        // Create ambient pad (low drone)
        this.createAmbientPad();
        
        // Create melody layer
        this.createMelodyLayer();
    }
    
    /**
     * Stop background music
     */
    stop(): void {
        this.playing = false;
        
        for (const osc of this.oscillators) {
            osc.stop();
        }
        
        this.oscillators = [];
    }
    
    /**
     * Create ambient pad (sustained tones)
     */
    private createAmbientPad(): void {
        const notes = [110, 165, 220]; // A2, E3, A3 (A minor chord)
        
        for (const freq of notes) {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.value = freq;
            
            filter.type = 'lowpass';
            filter.frequency.value = 500;
            
            gain.gain.value = 0.05; // Very quiet
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            this.oscillators.push(osc);
        }
    }
    
    /**
     * Create melody layer (arpeggiated notes)
     */
    private createMelodyLayer(): void {
        const notes = [440, 495, 550, 660]; // A4, B4, C#5, E5
        const interval = 2000; // 2 seconds per note
        
        let index = 0;
        
        const playNote = () => {
            if (!this.playing) return;
            
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = 'sine';
            osc.frequency.value = notes[index % notes.length];
            
            gain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.8);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + 1.8);
            
            index++;
            setTimeout(playNote, interval);
        };
        
        playNote();
    }
}
```

### 5. Combat Feedback Sounds

**Goal**: Audio cues for game events

```typescript
/**
 * Play shield hit sound
 */
playShieldHit(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, this.audioContext.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.15);
}

/**
 * Play critical hit sound
 */
playCriticalHit(): void {
    const osc1 = this.audioContext.createOscillator();
    const osc2 = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(880, this.audioContext.currentTime);
    
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1320, this.audioContext.currentTime);
    
    gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.masterGain);
    
    osc1.start();
    osc2.start();
    osc1.stop(this.audioContext.currentTime + 0.2);
    osc2.stop(this.audioContext.currentTime + 0.2);
}

/**
 * Play low health warning
 */
playLowHealthWarning(): void {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.value = 220;
    
    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioContext.currentTime + 0.2);
}
```

---

## Integration

```typescript
// Combat system
world.audioManager.playSpatial('phaser_fire', turretX, turretY);

// Damage system
if (Shield.current[entity] > 0) {
    world.audioManager.playShieldHit();
}

if (isCriticalHit) {
    world.audioManager.playCriticalHit();
}

// Health monitoring
if (Health.current[kobayashiMaru] / Health.max[kobayashiMaru] < 0.2) {
    world.audioManager.playLowHealthWarning();
}

// Explosions
world.audioManager.playExplosion('large', x, y);

// Background music
world.musicManager.start();
```

---

## Configuration

```typescript
export const AUDIO_CONFIG = {
    SPATIAL_AUDIO: true,
    MAX_DISTANCE: 1000,
    ROLLOFF_FACTOR: 1.5,
    
    MUSIC_ENABLED: true,
    MUSIC_VOLUME: 0.3,
    
    SOUND_VARIATIONS: true,
    PITCH_VARIATION: 0.2,  // ±20%
    
    LAYERED_EXPLOSIONS: true
};
```

---

## Success Criteria

- ✅ Spatial audio based on distance
- ✅ Layered explosion sounds
- ✅ Weapon sound variations
- ✅ Background music playing
- ✅ Combat feedback sounds
- ✅ Volume controls working
- ✅ All tests passing

---

## References

- Current audio: `src/audio/AudioManager.ts`
- Web Audio API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API
