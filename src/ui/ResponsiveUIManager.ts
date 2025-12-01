import { Application } from 'pixi.js';

export enum DeviceType {
    MOBILE = 'MOBILE',
    TABLET = 'TABLET',
    DESKTOP = 'DESKTOP'
}

export class ResponsiveUIManager {
    private app: Application;
    private currentDeviceType: DeviceType = DeviceType.DESKTOP;
    private scaleFactor: number = 1;

    constructor(app: Application) {
        this.app = app;
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions.bind(this));
    }

    private updateDimensions(): void {
        const width = window.innerWidth;
        // const height = window.innerHeight; // Unused for now

        if (width < 768) {
            this.currentDeviceType = DeviceType.MOBILE;
            this.scaleFactor = 0.8; // Scale down for mobile (was 0.6)
        } else if (width < 1024) {
            this.currentDeviceType = DeviceType.TABLET;
            this.scaleFactor = 0.8;
        } else {
            this.currentDeviceType = DeviceType.DESKTOP;
            this.scaleFactor = 1.0;
        }
    }

    getScaleFactor(): number {
        return this.scaleFactor;
    }

    getDeviceType(): DeviceType {
        return this.currentDeviceType;
    }

    // Helper to get responsive font size
    getFontSize(baseSize: number): number {
        return Math.floor(baseSize * this.scaleFactor);
    }

    destroy(): void {
        window.removeEventListener('resize', this.updateDimensions.bind(this));
    }
}
