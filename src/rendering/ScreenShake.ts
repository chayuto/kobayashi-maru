import { RENDERING_CONFIG } from '../config';

/**
 * Minimal 2D simplex noise for smooth screen shake.
 * Based on the simplex noise algorithm by Stefan Gustavson.
 */
const GRAD2 = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1],
];

// Permutation table (shuffled 0-255, doubled for wrapping)
const PERM = new Uint8Array(512);
const PERM_MOD8 = new Uint8Array(512);

function initPermutation(): void {
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    // Fisher-Yates shuffle with a fixed seed for determinism
    let seed = 42;
    for (let i = 255; i > 0; i--) {
        seed = (seed * 16807 + 0) % 2147483647;
        const j = seed % (i + 1);
        const tmp = p[i];
        p[i] = p[j];
        p[j] = tmp;
    }
    for (let i = 0; i < 512; i++) {
        PERM[i] = p[i & 255];
        PERM_MOD8[i] = PERM[i] % 8;
    }
}

initPermutation();

const F2 = 0.5 * (Math.sqrt(3) - 1);
const G2 = (3 - Math.sqrt(3)) / 6;

function simplexNoise2D(x: number, y: number): number {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);

    const t = (i + j) * G2;
    const X0 = i - t;
    const Y0 = j - t;
    const x0 = x - X0;
    const y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2;
    const y2 = y0 - 1 + 2 * G2;

    const ii = i & 255;
    const jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;

    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 >= 0) {
        t0 *= t0;
        const gi0 = PERM_MOD8[ii + PERM[jj]];
        n0 = t0 * t0 * (GRAD2[gi0][0] * x0 + GRAD2[gi0][1] * y0);
    }

    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 >= 0) {
        t1 *= t1;
        const gi1 = PERM_MOD8[ii + i1 + PERM[jj + j1]];
        n1 = t1 * t1 * (GRAD2[gi1][0] * x1 + GRAD2[gi1][1] * y1);
    }

    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 >= 0) {
        t2 *= t2;
        const gi2 = PERM_MOD8[ii + 1 + PERM[jj + 1]];
        n2 = t2 * t2 * (GRAD2[gi2][0] * x2 + GRAD2[gi2][1] * y2);
    }

    // Scale to [-1, 1]
    return 70 * (n0 + n1 + n2);
}

export class ScreenShake {
    private intensity: number = 0;
    private duration: number = 0;
    private elapsed: number = 0;

    shake(intensity: number, duration: number): void {
        this.intensity = intensity;
        this.duration = duration;
        this.elapsed = 0;
    }

    update(deltaTime: number): { offsetX: number; offsetY: number } {
        if (this.elapsed >= this.duration) {
            return { offsetX: 0, offsetY: 0 };
        }

        this.elapsed += deltaTime;
        const progress = this.elapsed / this.duration;
        const currentIntensity = this.intensity * (1 - progress);
        const freq = RENDERING_CONFIG.SCREEN_SHAKE.NOISE_FREQUENCY;

        const offsetX = simplexNoise2D(this.elapsed * freq, 0) * currentIntensity;
        const offsetY = simplexNoise2D(0, this.elapsed * freq) * currentIntensity;

        return { offsetX, offsetY };
    }

    isActive(): boolean {
        return this.elapsed < this.duration;
    }
}

// Exported for testing
export { simplexNoise2D as _simplexNoise2D };
