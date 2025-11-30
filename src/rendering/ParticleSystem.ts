import { Application, Container, Graphics } from 'pixi.js';

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    maxLife: number;
    size: number;
    color: number;
    alpha: number;
    sprite: Graphics;
}

export interface ParticleConfig {
    x: number;
    y: number;
    count: number;
    speed: { min: number; max: number };
    life: { min: number; max: number };
    size: { min: number; max: number };
    color: number;
    spread: number; // Angle spread in radians (2*PI for full circle)
}

export class ParticleSystem {
    particles: Particle[] = [];
    container: Container;
    private pool: Particle[] = [];
    private app: Application | null = null;

    constructor() {
        this.container = new Container();
    }

    init(app: Application): void {
        this.app = app;
        this.app.stage.addChild(this.container);
    }

    spawn(config: ParticleConfig): void {
        for (let i = 0; i < config.count; i++) {
            const particle = this.getParticle();

            // Initialize particle properties
            particle.x = config.x;
            particle.y = config.y;

            const angle = (Math.random() - 0.5) * config.spread;
            const speed = config.speed.min + Math.random() * (config.speed.max - config.speed.min);

            particle.vx = Math.cos(angle) * speed;
            particle.vy = Math.sin(angle) * speed;

            particle.maxLife = config.life.min + Math.random() * (config.life.max - config.life.min);
            particle.life = particle.maxLife;

            particle.size = config.size.min + Math.random() * (config.size.max - config.size.min);
            particle.color = config.color;
            particle.alpha = 1;

            // Initialize visual
            particle.sprite.clear();
            particle.sprite.beginFill(particle.color);
            particle.sprite.drawCircle(0, 0, particle.size);
            particle.sprite.endFill();
            particle.sprite.x = particle.x;
            particle.sprite.y = particle.y;
            particle.sprite.alpha = 1;

            this.particles.push(particle);
            this.container.addChild(particle.sprite);
        }
    }

    update(deltaTime: number): void {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Update position
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;

            // Update life
            p.life -= deltaTime;

            // Calculate alpha based on remaining life
            p.alpha = p.life / p.maxLife;

            // Update visual
            p.sprite.x = p.x;
            p.sprite.y = p.y;
            p.sprite.alpha = p.alpha;

            // Remove dead particles
            if (p.life <= 0) {
                this.returnToPool(p);
                this.particles.splice(i, 1);
            }
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

    private getParticle(): Particle {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }

        return {
            x: 0,
            y: 0,
            vx: 0,
            vy: 0,
            life: 0,
            maxLife: 0,
            size: 0,
            color: 0,
            alpha: 0,
            sprite: new Graphics()
        };
    }

    private returnToPool(particle: Particle): void {
        this.container.removeChild(particle.sprite);
        this.pool.push(particle);
    }
}
