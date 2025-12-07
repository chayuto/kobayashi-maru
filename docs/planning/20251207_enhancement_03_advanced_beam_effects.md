# Enhancement Task 03: Advanced Beam Effects

**Date:** 2025-12-07  
**Priority:** CRITICAL  
**Category:** Visual Effects  
**Estimated Effort:** 1-2 days  
**Dependencies:** Task 01 (Particle System)

---

## Objective

Transform basic beam weapons from simple lines into visually impressive effects with multi-segment beams, electricity arcs, charging animations, and impact effects.

---

## Current State

**Location**: `src/rendering/BeamRenderer.ts`

**Current Implementation**:
- Simple line from turret to target
- Glow effect (wider transparent line)
- Solid color by weapon type
- No animation or variation

**Limitations**:
- Static, boring appearance
- No sense of energy or power
- No charging or impact effects
- All beams look similar

---

## Proposed Enhancements

### 1. Multi-Segment Beams with Jitter

**Goal**: Beams have multiple segments with slight random offset (electricity effect)

```typescript
export interface BeamSegment {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    offset: number;  // Random perpendicular offset
}

export interface BeamVisual {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    turretType: number;
    intensity: number;    // 0-1, for pulsing
    segments: BeamSegment[];
    age: number;          // Time since created
}
```

**Implementation**:
```typescript
class BeamRenderer {
    /**
     * Generate beam segments with electricity jitter
     */
    private generateBeamSegments(startX: number, startY: number, endX: number, endY: number, jitter: number): BeamSegment[] {
        const segments: BeamSegment[] = [];
        const segmentCount = 5;
        
        // Calculate perpendicular vector for offset
        const dx = endX - startX;
        const dy = endY - startY;
        const length = Math.sqrt(dx * dx + dy * dy);
        const perpX = -dy / length;
        const perpY = dx / length;
        
        for (let i = 0; i < segmentCount; i++) {
            const t1 = i / segmentCount;
            const t2 = (i + 1) / segmentCount;
            
            // Interpolate along beam path
            const x1 = startX + dx * t1;
            const y1 = startY + dy * t1;
            const x2 = startX + dx * t2;
            const y2 = startY + dy * t2;
            
            // Add random offset (less at endpoints)
            const midFactor = 1 - Math.abs(t1 - 0.5) * 2;
            const offset = (Math.random() - 0.5) * jitter * midFactor;
            
            segments.push({
                startX: x1 + perpX * offset,
                startY: y1 + perpY * offset,
                endX: x2 + perpX * offset,
                endY: y2 + perpY * offset,
                offset
            });
        }
        
        return segments;
    }
}
```

### 2. Charging Animation

**Goal**: Beams build up before firing (energy accumulation)

```typescript
export interface ChargeEffect {
    turretId: number;
    x: number;
    y: number;
    progress: number;  // 0-1
    duration: number;
    color: number;
}

class BeamRenderer {
    private charges: Map<number, ChargeEffect> = new Map();
    
    /**
     * Start charging animation for turret
     */
    startCharge(turretId: number, x: number, y: number, duration: number, color: number): void {
        this.charges.set(turretId, {
            turretId,
            x,
            y,
            progress: 0,
            duration,
            color
        });
    }
    
    /**
     * Update and render charging effects
     */
    private renderCharges(deltaTime: number): void {
        for (const [id, charge] of this.charges) {
            charge.progress += deltaTime / charge.duration;
            
            if (charge.progress >= 1) {
                this.charges.delete(id);
                continue;
            }
            
            // Draw expanding energy rings
            const radius = 5 + charge.progress * 30;
            const alpha = (1 - charge.progress) * 0.8;
            
            this.graphics.circle(charge.x, charge.y, radius);
            this.graphics.stroke({ color: charge.color, width: 2, alpha });
            
            // Draw inner glow
            this.graphics.circle(charge.x, charge.y, radius * 0.5);
            this.graphics.fill({ color: charge.color, alpha: alpha * 0.5 });
        }
    }
}
```

### 3. Impact Flash & Shockwave

**Goal**: Bright flash and expanding ring on beam impact

```typescript
export interface ImpactEffect {
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: number;
    duration: number;
    elapsed: number;
}

class BeamRenderer {
    private impacts: ImpactEffect[] = [];
    
    /**
     * Create impact effect at target location
     */
    createImpact(x: number, y: number, color: number): void {
        this.impacts.push({
            x,
            y,
            radius: 0,
            maxRadius: 40,
            color,
            duration: 0.2,
            elapsed: 0
        });
    }
    
    /**
     * Update and render impact effects
     */
    private renderImpacts(deltaTime: number): void {
        for (let i = this.impacts.length - 1; i >= 0; i--) {
            const impact = this.impacts[i];
            impact.elapsed += deltaTime;
            
            if (impact.elapsed >= impact.duration) {
                this.impacts.splice(i, 1);
                continue;
            }
            
            const progress = impact.elapsed / impact.duration;
            impact.radius = impact.maxRadius * progress;
            const alpha = (1 - progress) * 0.9;
            
            // Expanding ring
            this.graphics.circle(impact.x, impact.y, impact.radius);
            this.graphics.stroke({ color: impact.color, width: 3, alpha });
            
            // Bright center flash (first 30% of duration)
            if (progress < 0.3) {
                const flashAlpha = (1 - progress / 0.3) * 1.0;
                this.graphics.circle(impact.x, impact.y, 10);
                this.graphics.fill({ color: 0xFFFFFF, alpha: flashAlpha });
            }
        }
    }
}
```

### 4. Weapon-Specific Beam Styles

**Goal**: Each weapon type has unique visual style

```typescript
enum BeamStyle {
    SOLID = 'solid',           // Phaser Array
    PULSING = 'pulsing',       // Disruptor Bank
    CRACKLING = 'crackling',   // Tetryon Beam
    WAVY = 'wavy',             // Polaron Beam
    DUAL = 'dual'              // Advanced variant
}

interface BeamConfig {
    style: BeamStyle;
    color: number;
    secondaryColor?: number;
    width: number;
    glowWidth: number;
    jitter: number;
    segmentCount: number;
    chargeTime: number;
}

const BEAM_CONFIGS: Record<number, BeamConfig> = {
    [TurretType.PHASER_ARRAY]: {
        style: BeamStyle.SOLID,
        color: 0xFF9900,      // Orange
        width: 2,
        glowWidth: 8,
        jitter: 5,
        segmentCount: 3,
        chargeTime: 0.1
    },
    [TurretType.DISRUPTOR_BANK]: {
        style: BeamStyle.PULSING,
        color: 0x00FF00,      // Green
        width: 3,
        glowWidth: 10,
        jitter: 8,
        segmentCount: 5,
        chargeTime: 0.15
    },
    [TurretType.TETRYON_BEAM]: {
        style: BeamStyle.CRACKLING,
        color: 0x00CCFF,      // Cyan
        secondaryColor: 0xFFFFFF,
        width: 2,
        glowWidth: 12,
        jitter: 15,
        segmentCount: 8,
        chargeTime: 0.12
    },
    [TurretType.POLARON_BEAM]: {
        style: BeamStyle.WAVY,
        color: 0xCC00FF,      // Purple
        width: 3,
        glowWidth: 9,
        jitter: 3,
        segmentCount: 10,
        chargeTime: 0.13
    }
};
```

### 5. Lightning Arc Secondary Beams

**Goal**: Small electricity arcs branch off main beam

```typescript
interface LightningArc {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    lifetime: number;
    color: number;
}

class BeamRenderer {
    private arcs: LightningArc[] = [];
    
    /**
     * Generate random lightning arcs along beam
     */
    private generateLightningArcs(beam: BeamVisual): void {
        const arcCount = Math.floor(Math.random() * 3) + 1;
        
        for (let i = 0; i < arcCount; i++) {
            const t = Math.random();
            const arcX = beam.startX + (beam.endX - beam.startX) * t;
            const arcY = beam.startY + (beam.endY - beam.startY) * t;
            
            const angle = Math.random() * Math.PI * 2;
            const length = 10 + Math.random() * 20;
            const endX = arcX + Math.cos(angle) * length;
            const endY = arcY + Math.sin(angle) * length;
            
            this.arcs.push({
                startX: arcX,
                startY: arcY,
                endX,
                endY,
                lifetime: 0.05 + Math.random() * 0.05,
                color: beam.turretType === TurretType.TETRYON_BEAM ? 0xFFFFFF : 0x99CCFF
            });
        }
    }
    
    /**
     * Render lightning arcs
     */
    private renderLightningArcs(deltaTime: number): void {
        for (let i = this.arcs.length - 1; i >= 0; i--) {
            const arc = this.arcs[i];
            arc.lifetime -= deltaTime;
            
            if (arc.lifetime <= 0) {
                this.arcs.splice(i, 1);
                continue;
            }
            
            const alpha = arc.lifetime / 0.1;
            this.graphics.moveTo(arc.startX, arc.startY);
            this.graphics.lineTo(arc.endX, arc.endY);
            this.graphics.stroke({ color: arc.color, width: 1, alpha });
        }
    }
}
```

---

## Integration with Combat System

Update `src/systems/combatSystem.ts`:

```typescript
function fireBeamWeapon(world: GameWorld, turret: number, target: number): void {
    const config = BEAM_CONFIGS[Turret.turretType[turret]];
    
    // Start charge animation
    world.beamRenderer.startCharge(
        turret,
        Position.x[turret],
        Position.y[turret],
        config.chargeTime,
        config.color
    );
    
    // Schedule beam after charge
    setTimeout(() => {
        const beam: BeamVisual = {
            startX: Position.x[turret],
            startY: Position.y[turret],
            endX: Position.x[target],
            endY: Position.y[target],
            turretType: Turret.turretType[turret],
            intensity: 1.0,
            segments: world.beamRenderer.generateBeamSegments(
                Position.x[turret],
                Position.y[turret],
                Position.x[target],
                Position.y[target],
                config.jitter
            ),
            age: 0
        };
        
        world.beams.push(beam);
        
        // Create impact effect
        world.beamRenderer.createImpact(
            Position.x[target],
            Position.y[target],
            config.color
        );
        
        // Spawn impact particles
        world.particleSystem.spawn({
            ...EFFECTS.IMPACT_SPARKS,
            x: Position.x[target],
            y: Position.y[target],
            color: config.color
        });
    }, config.chargeTime * 1000);
}
```

---

## Performance Optimizations

- **Segment Caching**: Regenerate segments only every 2-3 frames
- **Arc Pooling**: Reuse arc objects
- **Culling**: Skip off-screen beams
- **LOD**: Reduce segment count at distance

---

## Configuration

Add to `src/types/constants.ts`:

```typescript
export const BEAM_EFFECTS_CONFIG = {
    // Beam appearance
    DEFAULT_SEGMENT_COUNT: 5,
    DEFAULT_JITTER: 8,
    DEFAULT_BEAM_DURATION: 0.1,  // seconds
    
    // Charging
    CHARGE_ENABLED: true,
    CHARGE_PARTICLE_COUNT: 20,
    
    // Impact
    IMPACT_FLASH_DURATION: 0.2,
    IMPACT_RING_SIZE: 40,
    
    // Lightning arcs
    LIGHTNING_ARC_ENABLED: true,
    LIGHTNING_ARC_CHANCE: 0.6,
    LIGHTNING_ARC_COUNT: { min: 1, max: 3 },
    LIGHTNING_ARC_LENGTH: { min: 10, max: 30 }
};
```

---

## Testing Requirements

### Unit Tests
```typescript
// src/__tests__/BeamRenderer.enhanced.test.ts

describe('Advanced Beam Renderer', () => {
    test('should generate segmented beams with jitter');
    test('should create charging animation');
    test('should trigger impact effects');
    test('should render weapon-specific styles');
    test('should generate lightning arcs');
    test('should clean up expired effects');
});
```

### Visual Tests
- Phaser beam: Solid orange with minimal jitter
- Disruptor beam: Pulsing green with medium jitter
- Tetryon beam: Crackling cyan with high jitter + arcs
- Polaron beam: Wavy purple with smooth curves
- Charging animation visible before beam
- Impact flash and ring on hit

---

## Success Criteria

- ✅ Beams have segmented, electricity-like appearance
- ✅ Charging animation plays before beam fire
- ✅ Impact flash and shockwave render correctly
- ✅ Each weapon type has unique visual style
- ✅ Lightning arcs branch off main beam
- ✅ Performance maintained at 60 FPS
- ✅ All tests passing
- ✅ Visual improvement is dramatic and noticeable

---

## Visual Comparison

### Before
- `━━━━━━━━━` Simple orange line
- `━━━━━━━━━` Simple green line

### After
- `⚡≋≈≈≋⚡` Crackling segmented beam with electricity
- `●→⚡≋⚡←◉` Charging → beam → impact sequence
- `╱╲╱╲╱╲` Wavy/pulsing patterns
- `⚡─┬─⚡` Lightning arcs branching off

---

## Future Enhancements

- Beam collision with multiple targets
- Beam reflection effects
- Continuous beam weapons (hold to fire)
- Beam width variation over distance
- Color shift along beam length
- Sound integration (beam hum, crackle)

---

## References

- Current implementation: `src/rendering/BeamRenderer.ts`
- Combat system: `src/systems/combatSystem.ts`
- Electricity VFX tutorials
- Star Trek phaser visual reference
