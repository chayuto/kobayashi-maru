# Task 04: Sound/Audio System Foundation

**Date:** 2025-11-30  
**Sprint:** 2  
**Priority:** MEDIUM  
**Estimated Effort:** 1-2 days

## Objective
Implement a foundational audio system using the Web Audio API for sound effects and ambient audio.

## Context
The game currently has no audio. Sound effects greatly enhance player feedback and immersion. Key audio needs:
- Weapon fire sounds (phasers, torpedoes, disruptors)
- Explosion sounds (enemy destruction)
- UI feedback sounds (turret placement, resource changes)
- Ambient background audio (space ambiance)
- Wave start/complete notifications

## Requirements

### 1. Create Audio Manager (`src/audio/AudioManager.ts`)
- **Class:** `AudioManager` (singleton pattern)
- **Properties:**
  - `audioContext`: Web AudioContext
  - `masterGain`: GainNode for volume control
  - `sfxGain`: GainNode for effects
  - `musicGain`: GainNode for music/ambient
  - `sounds`: Map<string, AudioBuffer>
  - `enabled`: boolean
  - `masterVolume`: number (0-1)

- **Methods:**
  - `init()`: Initialize AudioContext (must be after user interaction)
  - `loadSound(key: string, url: string)`: Load and cache audio buffer
  - `play(key: string, options?: PlayOptions)`: Play a sound
  - `playLoop(key: string)`: Play looping audio (ambient)
  - `stopLoop(key: string)`: Stop looping audio
  - `setMasterVolume(volume: number)`: Set overall volume
  - `setSFXVolume(volume: number)`: Set effects volume
  - `setMusicVolume(volume: number)`: Set music/ambient volume
  - `mute()` / `unmute()`: Toggle all audio
  - `suspend()` / `resume()`: Pause/resume AudioContext
  - `destroy()`: Clean up resources

### 2. Sound Types Enum (`src/audio/types.ts`)
```typescript
export enum SoundType {
  // Weapons
  PHASER_FIRE = 'phaser_fire',
  TORPEDO_FIRE = 'torpedo_fire',
  DISRUPTOR_FIRE = 'disruptor_fire',
  
  // Combat
  EXPLOSION_SMALL = 'explosion_small',
  EXPLOSION_LARGE = 'explosion_large',
  SHIELD_HIT = 'shield_hit',
  HULL_HIT = 'hull_hit',
  
  // UI
  TURRET_PLACE = 'turret_place',
  TURRET_SELECT = 'turret_select',
  RESOURCE_GAIN = 'resource_gain',
  ERROR_BEEP = 'error_beep',
  
  // Game Events
  WAVE_START = 'wave_start',
  WAVE_COMPLETE = 'wave_complete',
  GAME_OVER = 'game_over',
  
  // Ambient
  SPACE_AMBIENT = 'space_ambient',
  ALERT_KLAXON = 'alert_klaxon'
}

export interface PlayOptions {
  volume?: number;   // 0-1, default 1
  pitch?: number;    // Playback rate, default 1
  pan?: number;      // -1 to 1, default 0 (center)
  loop?: boolean;    // Default false
}
```

### 3. Procedural Sound Generation (`src/audio/SoundGenerator.ts`)
Generate placeholder sounds programmatically (no external files needed):
```typescript
export class SoundGenerator {
  static createPhaserSound(ctx: AudioContext): AudioBuffer;
  static createExplosionSound(ctx: AudioContext): AudioBuffer;
  static createBeepSound(ctx: AudioContext, frequency: number): AudioBuffer;
  static createAmbientSound(ctx: AudioContext): AudioBuffer;
}
```

Use Web Audio oscillators and noise for:
- Phaser: High-frequency sweep
- Torpedo: Low thump with decay
- Explosion: White noise burst with decay
- Beeps: Simple sine tones

### 4. Integrate with Game Systems
Update to play sounds:
- `combatSystem.ts`: Play weapon sounds on fire
- `damageSystem.ts`: Play explosion on enemy death
- `placementSystem.ts`: Play placement/error sounds
- `waveManager.ts`: Play wave start/complete sounds
- `Game.ts`: Play game over sound

### 5. User Interaction Requirement
Web Audio requires user interaction before playing:
- Add click/touch handler to start AudioContext
- Show "Click to Start" overlay if needed
- Store audio enabled preference in `StorageService`

### 6. Volume Controls Interface
```typescript
interface AudioSettings {
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  enabled: boolean;
}
```

## Acceptance Criteria
- [ ] AudioManager initializes without errors
- [ ] Placeholder sounds are generated procedurally
- [ ] Weapon sounds play when turrets fire
- [ ] Explosion sounds play when enemies die
- [ ] UI feedback sounds work for placement
- [ ] Wave start/end sounds play
- [ ] Volume can be adjusted
- [ ] Audio can be muted/unmuted
- [ ] Audio respects user interaction requirement
- [ ] Settings persist via StorageService
- [ ] Unit tests cover AudioManager methods
- [ ] No TypeScript compilation errors
- [ ] All existing tests continue to pass

## Files to Create
- `src/audio/AudioManager.ts`
- `src/audio/SoundGenerator.ts`
- `src/audio/types.ts`
- `src/audio/index.ts` (barrel export)
- `src/__tests__/AudioManager.test.ts`

## Files to Modify
- `src/systems/combatSystem.ts` - Add sound triggers
- `src/systems/damageSystem.ts` - Add explosion sounds
- `src/game/placementSystem.ts` - Add UI sounds
- `src/game/waveManager.ts` - Add wave sounds
- `src/core/Game.ts` - Initialize AudioManager

## Testing Requirements
- Unit tests for AudioManager initialization
- Unit tests for volume control
- Unit tests for mute/unmute
- Mock Web Audio API for testing
- Test sound generation functions output valid buffers

## Technical Notes
- Use singleton pattern for global audio access
- Web Audio API provides better performance than HTML5 Audio
- Consider audio sprite approach for many similar sounds
- Use `AudioContext.suspend()` when game is paused
- Procedural sounds avoid loading external files
- Keep generated sounds short (< 1 second for effects)

## Procedural Sound Examples

### Phaser Sound
```typescript
static createPhaserSound(ctx: AudioContext): AudioBuffer {
  const duration = 0.15;
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, duration * sampleRate, sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < data.length; i++) {
    const t = i / sampleRate;
    const freq = 1000 + Math.sin(t * 50) * 500; // Frequency sweep
    data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 10);
  }
  
  return buffer;
}
```

### Explosion Sound
```typescript
static createExplosionSound(ctx: AudioContext): AudioBuffer {
  const duration = 0.5;
  const buffer = ctx.createBuffer(1, duration * ctx.sampleRate, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < data.length; i++) {
    const t = i / ctx.sampleRate;
    const noise = Math.random() * 2 - 1;
    const envelope = Math.exp(-t * 6);
    data[i] = noise * envelope;
  }
  
  return buffer;
}
```
