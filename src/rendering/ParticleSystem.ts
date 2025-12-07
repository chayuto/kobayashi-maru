import { Application, Container, Graphics } from 'pixi.js';

// Enums for particle configuration
export enum EmitterPattern {
    CIRCULAR = 'circular',
    CONE = 'cone',
    RING = 'ring',
    SPIRAL = 'spiral',
    BURST = 'burst',
    FOUNTAIN = 'fountain'
}

export type ParticleSpriteType = 'circle' | 'square' | 'star' | 'spark' | 'smoke' | 'fire' | 'energy';

// Color gradient configuration
export interface ColorGradient {
    stops: Array<{ time: number; color: number; alpha: number }>;
}

// Trail effect configuration
export interface TrailConfig {
    enabled: boolean;
    length: number;      // Number of trail segments
    fadeRate: number;    // How quickly trail fades
    width: number;       // Trail width
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    ax: number;  // Acceleration X
    ay: number;  // Acceleration Y
    life: number;
    maxLife: number;
    size: number;
    color: number;
    alpha: number;
    sprite: Graphics;
    spriteType: ParticleSpriteType;  // Track the sprite type
    rotation: number;
    rotationSpeed: number;
    scale: number;
    scaleStart: number;
    scaleEnd: number;
    drag: number;
    colorGradient?: ColorGradient;
    trail?: {
        positions: Array<{ x: number; y: number }>;
        config: TrailConfig;
        graphics: Graphics;
    };
}

export interface ParticleConfig {
    x: number;
    y: number;
    count: number;
    speed: { min: number; max: number };
    life: { min: number; max: number };
    size: { min: number; max: number };
    color?: number;  // Optional if gradient provided
    spread: number; // Angle spread in radians (2*PI for full circle)
    
    // New optional fields
    sprite?: ParticleSpriteType;
    colorGradient?: ColorGradient;
    rotation?: { min: number; max: number };
    rotationSpeed?: { min: number; max: number };
    scaleStart?: number;
    scaleEnd?: number;
    emitterPattern?: EmitterPattern;
    emitterAngle?: number;
    emitterWidth?: number;
    trail?: TrailConfig;
    gravity?: number;
    drag?: number;
}

export class ParticleSystem {
    particles: Particle[] = [];
    container: Container;
    private pool: Particle[] = [];
    private app: Application | null = null;

    private maxParticles: number = 2000;
    private spawnRateMultiplier: number = 1.0;
    private spiralCounter: number = 0;

    constructor() {
        this.container = new Container();
    }

    init(app: Application, maxParticles: number = 2000, spawnRateMultiplier: number = 1.0): void {
        this.app = app;
        this.maxParticles = maxParticles;
        this.spawnRateMultiplier = spawnRateMultiplier;
        this.app.stage.addChild(this.container);
    }

    spawn(config: ParticleConfig): void {
        // Check hard limit
        if (this.particles.length >= this.maxParticles) {
            return;
        }

        // Apply spawn rate multiplier (minimum 1 particle if count > 0)
        let count = Math.ceil(config.count * this.spawnRateMultiplier);

        // Adjust count based on remaining budget
        count = Math.min(count, this.maxParticles - this.particles.length);

        for (let i = 0; i < count; i++) {
            const particle = this.getParticle();

            // Initialize particle properties
            particle.x = config.x;
            particle.y = config.y;

            // Use emitter pattern to calculate velocity
            const velocity = this.calculateEmitterVelocity(config);
            particle.vx = velocity.vx;
            particle.vy = velocity.vy;

            // Initialize acceleration and drag
            particle.ax = 0;
            particle.ay = config.gravity || 0;
            particle.drag = config.drag !== undefined ? config.drag : 1.0;

            particle.maxLife = config.life.min + Math.random() * (config.life.max - config.life.min);
            particle.life = particle.maxLife;

            particle.size = config.size.min + Math.random() * (config.size.max - config.size.min);
            
            // Set initial color
            if (config.colorGradient) {
                particle.colorGradient = config.colorGradient;
                const initialColor = this.interpolateColorGradient(config.colorGradient, 1.0);
                particle.color = initialColor.color;
                particle.alpha = initialColor.alpha;
            } else {
                particle.color = config.color || 0xFFFFFF;
                particle.alpha = 1;
                particle.colorGradient = undefined;
            }

            // Initialize rotation
            if (config.rotation) {
                particle.rotation = config.rotation.min + Math.random() * (config.rotation.max - config.rotation.min);
            } else {
                particle.rotation = 0;
            }

            if (config.rotationSpeed) {
                particle.rotationSpeed = config.rotationSpeed.min + Math.random() * (config.rotationSpeed.max - config.rotationSpeed.min);
            } else {
                particle.rotationSpeed = 0;
            }

            // Initialize scale
            particle.scaleStart = config.scaleStart || 1.0;
            particle.scaleEnd = config.scaleEnd || 1.0;
            particle.scale = particle.scaleStart;

            // Initialize trail
            if (config.trail?.enabled) {
                particle.trail = {
                    positions: [{ x: particle.x, y: particle.y }],
                    config: config.trail,
                    graphics: new Graphics()
                };
                this.container.addChild(particle.trail.graphics);
            } else {
                particle.trail = undefined;
            }

            // Store sprite type and initialize visual
            particle.spriteType = config.sprite || 'circle';
            this.drawParticle(particle);
            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
            particle.sprite.alpha = particle.alpha;
            particle.sprite.rotation = particle.rotation;
            particle.sprite.scale.set(particle.scale);

            this.particles.push(particle);
            this.container.addChild(particle.sprite);
        }
    }

    private drawParticle(particle: Particle): void {
        particle.sprite.clear();
        particle.sprite.beginFill(particle.color);

        const size = particle.size;

        switch (particle.spriteType) {
            case 'circle':
                particle.sprite.drawCircle(0, 0, size);
                break;

            case 'square':
                particle.sprite.drawRect(-size, -size, size * 2, size * 2);
                break;

            case 'star':
                {
                    const outerRadius = size;
                    const innerRadius = size * 0.5;
                    const points = 5;
                    
                    particle.sprite.moveTo(0, -outerRadius);
                    for (let i = 0; i < points * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = (Math.PI * i) / points - Math.PI / 2;
                        particle.sprite.lineTo(
                            Math.cos(angle) * radius,
                            Math.sin(angle) * radius
                        );
                    }
                    particle.sprite.closePath();
                }
                break;

            case 'spark':
                particle.sprite.moveTo(0, -size * 1.5);
                particle.sprite.lineTo(size * 0.3, 0);
                particle.sprite.lineTo(0, size * 1.5);
                particle.sprite.lineTo(-size * 0.3, 0);
                particle.sprite.closePath();
                break;

            case 'smoke':
                particle.sprite.drawCircle(0, 0, size);
                break;

            case 'fire':
                {
                    // Use deterministic fire shape based on particle position
                    const firePoints = 8;
                    const seed = (particle.x * 12.9898 + particle.y * 78.233) % 1;
                    particle.sprite.moveTo(0, -size);
                    for (let i = 0; i <= firePoints; i++) {
                        const angle = (Math.PI * 2 * i) / firePoints - Math.PI / 2;
                        // Use seeded pseudo-random for consistent shape
                        const localSeed = (seed + i * 0.123) % 1;
                        const radius = size * (0.7 + localSeed * 0.3);
                        particle.sprite.lineTo(
                            Math.cos(angle) * radius,
                            Math.sin(angle) * radius
                        );
                    }
                    particle.sprite.closePath();
                }
                break;

            case 'energy':
                {
                    const hexPoints = 6;
                    particle.sprite.moveTo(size * Math.cos(-Math.PI / 2), size * Math.sin(-Math.PI / 2));
                    for (let i = 1; i <= hexPoints; i++) {
                        const angle = (Math.PI * 2 * i) / hexPoints - Math.PI / 2;
                        particle.sprite.lineTo(
                            size * Math.cos(angle),
                            size * Math.sin(angle)
                        );
                    }
                    particle.sprite.closePath();
                }
                break;
        }

        particle.sprite.endFill();
    }

    update(deltaTime: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Apply physics
            p.vx += p.ax * deltaTime;
            p.vy += p.ay * deltaTime;

            // Apply drag
            if (p.drag < 1.0) {
                p.vx *= Math.pow(p.drag, deltaTime);
                p.vy *= Math.pow(p.drag, deltaTime);
            }

            // Update position
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Update life
            p.life -= deltaTime;

            // Calculate normalized life (0 = dead, 1 = just born)
            const normalizedLife = Math.max(0, p.life / p.maxLife);

            // Update color gradient if present
            if (p.colorGradient) {
                const gradientColor = this.interpolateColorGradient(p.colorGradient, normalizedLife);
                p.color = gradientColor.color;
                p.alpha = gradientColor.alpha;
            } else {
                // Calculate alpha based on remaining life
                p.alpha = normalizedLife;
            }

            // Update rotation
            p.rotation += p.rotationSpeed * deltaTime;

            // Update scale interpolation
            p.scale = p.scaleStart + (p.scaleEnd - p.scaleStart) * (1 - normalizedLife);

            // Update trail
            if (p.trail) {
                // Add current position to trail
                p.trail.positions.push({ x: p.x, y: p.y });

                // Limit trail length
                if (p.trail.positions.length > p.trail.config.length) {
                    p.trail.positions.shift();
                }

                // Render trail
                this.renderTrail(p);
            }

            // Update visual
            p.sprite.x = p.x;
            p.sprite.y = p.y;
            p.sprite.alpha = p.alpha;
            p.sprite.rotation = p.rotation;
            p.sprite.scale.set(p.scale);
            
            // Redraw sprite if color changed (for gradient support)
            if (p.colorGradient) {
                this.drawParticle(p);
            }

            // Remove dead particles
            if (p.life <= 0) {
                this.returnToPool(p);
                this.particles.splice(i, 1);
            }
        }
    }

    private renderTrail(particle: Particle): void {
        if (!particle.trail || particle.trail.positions.length < 2) {
            return;
        }

        const trail = particle.trail;
        trail.graphics.clear();

        // Draw trail segments
        for (let i = 1; i < trail.positions.length; i++) {
            const prev = trail.positions[i - 1];
            const curr = trail.positions[i];
            
            // Calculate alpha fade (head is brightest, tail fades)
            const segmentAlpha = (i / trail.positions.length) * particle.alpha * (1 - trail.config.fadeRate);
            
            trail.graphics.lineStyle(trail.config.width, particle.color, segmentAlpha);
            trail.graphics.moveTo(prev.x, prev.y);
            trail.graphics.lineTo(curr.x, curr.y);
        }
    }

    destroy(): void {
        if (this.app && this.container) {
            this.app.stage.removeChild(this.container);
        }
        this.container.destroy({ children: true });
        this.particles = [];
        this.pool = [];
    }

    private interpolateColorGradient(gradient: ColorGradient, normalizedLife: number): { color: number; alpha: number } {
        const time = 1 - normalizedLife; // Convert remaining life to elapsed time
        
        if (gradient.stops.length === 0) {
            return { color: 0xFFFFFF, alpha: 1 };
        }
        
        if (gradient.stops.length === 1) {
            return { color: gradient.stops[0].color, alpha: gradient.stops[0].alpha };
        }

        // Find the two stops to interpolate between
        let startStop = gradient.stops[0];
        let endStop = gradient.stops[gradient.stops.length - 1];
        
        for (let i = 0; i < gradient.stops.length - 1; i++) {
            if (time >= gradient.stops[i].time && time <= gradient.stops[i + 1].time) {
                startStop = gradient.stops[i];
                endStop = gradient.stops[i + 1];
                break;
            }
        }

        // Interpolate between the two stops
        const range = endStop.time - startStop.time;
        const t = range > 0 ? (time - startStop.time) / range : 0;

        // Interpolate color components
        const startR = (startStop.color >> 16) & 0xFF;
        const startG = (startStop.color >> 8) & 0xFF;
        const startB = startStop.color & 0xFF;

        const endR = (endStop.color >> 16) & 0xFF;
        const endG = (endStop.color >> 8) & 0xFF;
        const endB = endStop.color & 0xFF;

        const r = Math.round(startR + (endR - startR) * t);
        const g = Math.round(startG + (endG - startG) * t);
        const b = Math.round(startB + (endB - startB) * t);

        const color = (r << 16) | (g << 8) | b;
        const alpha = startStop.alpha + (endStop.alpha - startStop.alpha) * t;

        return { color, alpha };
    }

    private calculateEmitterVelocity(config: ParticleConfig): { vx: number; vy: number } {
        const pattern = config.emitterPattern || EmitterPattern.CIRCULAR;
        const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);
        
        let angle = 0;
        
        switch (pattern) {
            case EmitterPattern.CIRCULAR:
                // Random angle within spread
                angle = (Math.random() - 0.5) * config.spread;
                break;
                
            case EmitterPattern.CONE:
                // Random angle within cone
                angle = (config.emitterAngle || 0) + (Math.random() - 0.5) * (config.emitterWidth || config.spread);
                break;
                
            case EmitterPattern.RING:
                // Evenly distributed around a ring
                angle = (Math.PI * 2 * Math.random());
                break;
                
            case EmitterPattern.SPIRAL:
                // Spiral pattern
                angle = this.spiralCounter * 0.5;
                this.spiralCounter++;
                break;
                
            case EmitterPattern.BURST:
                // All particles in same direction
                angle = config.emitterAngle || 0;
                break;
                
            case EmitterPattern.FOUNTAIN:
                // Arc upward
                angle = (config.emitterAngle || -Math.PI / 2) + (Math.random() - 0.5) * (config.emitterWidth || Math.PI / 4);
                break;
        }
        
        return {
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed
        };
    }

    private getParticle(): Particle {
        if (this.pool.length > 0) {
            const particle = this.pool.pop()!;
            // Reset trail if it exists
            if (particle.trail) {
                particle.trail.positions = [];
            }
            return particle;
        }

        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            ax: 0,
            ay: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: 0,
            alpha: 0,
            sprite: new Graphics(),
            spriteType: 'circle',
            rotation: 0,
            rotationSpeed: 0,
            scale: 1,
            scaleStart: 1,
            scaleEnd: 1,
            drag: 1,
            colorGradient: undefined,
            trail: undefined
        };
    }

    private returnToPool(particle: Particle): void {
        this.container.removeChild(particle.sprite);
        
        // Clean up trail graphics
        if (particle.trail) {
            this.container.removeChild(particle.trail.graphics);
            particle.trail.positions = [];
        }
        
        this.pool.push(particle);
    }
}
