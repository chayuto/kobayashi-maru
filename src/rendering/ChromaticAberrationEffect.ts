/**
 * Chromatic Aberration Effect for Kobayashi Maru
 *
 * Offsets R and B channels when hull is below 50% to create
 * a visual distortion effect. Pulsing intensifies at critical hull.
 * Follows the HullDamageOverlay pattern: init(app), update(deltaTime), destroy().
 *
 * @module rendering/ChromaticAberrationEffect
 */
import { Application, Filter, GlProgram } from 'pixi.js';
import { RENDERING_CONFIG } from '../config/rendering.config';

const CONFIG = RENDERING_CONFIG.CHROMATIC_ABERRATION;

const VERTEX = `
in vec2 aPosition;
out vec2 vTextureCoord;

uniform vec4 uInputSize;
uniform vec4 uOutputFrame;
uniform vec4 uOutputTexture;

vec4 filterVertexPosition(void)
{
    vec2 position = aPosition * uOutputFrame.zw + uOutputFrame.xy;
    position.x = position.x * (2.0 / uOutputTexture.x) - 1.0;
    position.y = position.y * (2.0*uOutputTexture.z / uOutputTexture.y) - uOutputTexture.z;
    return vec4(position, 0.0, 1.0);
}

vec2 filterTextureCoord(void)
{
    return aPosition * (uOutputFrame.zw * uInputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
}
`;

const FRAGMENT = `
in vec2 vTextureCoord;
out vec4 finalColor;

uniform sampler2D uTexture;
uniform float uOffset;
uniform vec4 uInputSize;

void main(void)
{
    vec2 texCoord = vTextureCoord;
    vec2 offsetPx = vec2(uOffset * uInputSize.z, 0.0);

    float r = texture(uTexture, texCoord + offsetPx).r;
    float g = texture(uTexture, texCoord).g;
    float b = texture(uTexture, texCoord - offsetPx).b;
    float a = texture(uTexture, texCoord).a;

    finalColor = vec4(r, g, b, a);
}
`;

/**
 * Applies chromatic aberration (R/B channel offset) to the stage
 * when hull health drops below 50%.
 */
export class ChromaticAberrationEffect {
    private filter: Filter | null = null;
    private app: Application | null = null;
    private initialized: boolean = false;
    private hullPercent: number = 1;
    private animationTime: number = 0;

    /**
     * Initialize and add the filter to the app stage.
     */
    init(app: Application): void {
        this.app = app;

        this.filter = new Filter({
            glProgram: new GlProgram({
                vertex: VERTEX,
                fragment: FRAGMENT,
            }),
            resources: {
                chromaticUniforms: {
                    uOffset: { value: 0, type: 'f32' },
                },
            },
        });

        this.filter.enabled = false;

        // Apply to stage filters
        if (!app.stage.filters) {
            app.stage.filters = [this.filter];
        } else {
            (app.stage.filters as Filter[]).push(this.filter);
        }

        this.initialized = true;
    }

    /**
     * Update the effect each frame.
     * @param deltaTime - Time since last frame in seconds
     */
    update(deltaTime: number): void {
        if (!this.initialized || !this.filter) return;

        // Disable when hull is above threshold
        if (this.hullPercent > CONFIG.ENABLE_THRESHOLD) {
            this.filter.enabled = false;
            return;
        }

        this.filter.enabled = true;

        // Calculate intensity: 0 at threshold, 1 at 0% hull
        let intensity = 1 - this.hullPercent / CONFIG.ENABLE_THRESHOLD;

        // Add pulsing at critical hull
        if (this.hullPercent <= CONFIG.CRITICAL_THRESHOLD) {
            this.animationTime += deltaTime;
            intensity *= 0.7 + 0.3 * Math.sin(this.animationTime * CONFIG.PULSE_SPEED * Math.PI * 2);
        }

        const offset = intensity * CONFIG.MAX_OFFSET;
        this.filter.resources.chromaticUniforms.uniforms.uOffset = offset;
    }

    /**
     * Set the current hull percent.
     * @param percent - Hull fraction from 0.0 (destroyed) to 1.0 (full)
     */
    setHullPercent(percent: number): void {
        this.hullPercent = percent;
    }

    /**
     * Get the current hull percent (for testing).
     */
    getHullPercent(): number {
        return this.hullPercent;
    }

    /**
     * Check if the effect is currently enabled (for testing).
     */
    isEnabled(): boolean {
        return this.filter?.enabled ?? false;
    }

    /**
     * Clean up resources.
     */
    destroy(): void {
        if (this.filter && this.app) {
            const filters = this.app.stage.filters as Filter[] | null;
            if (filters) {
                const idx = filters.indexOf(this.filter);
                if (idx !== -1) {
                    filters.splice(idx, 1);
                }
            }
            this.filter.destroy();
        }
        this.filter = null;
        this.app = null;
        this.initialized = false;
    }
}
