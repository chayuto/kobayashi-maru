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

        const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;

        return { offsetX, offsetY };
    }

    isActive(): boolean {
        return this.elapsed < this.duration;
    }
}
