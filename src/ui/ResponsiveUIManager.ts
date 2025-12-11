
export enum DeviceType {
    MOBILE = 'MOBILE',
    TABLET = 'TABLET',
    DESKTOP = 'DESKTOP'
}

export class ResponsiveUIManager {
    private currentDeviceType: DeviceType = DeviceType.DESKTOP;
    private scaleFactor: number = 1;

    constructor() {
        this.updateDimensions();
        window.addEventListener('resize', this.updateDimensions.bind(this));
    }

    private updateDimensions(): void {
        const width = window.innerWidth;
        const height = window.innerHeight;

        // Check orientation (if mobile/tablet)
        const isPortrait = height > width;

        if (width < 768 || (width < 1024 && isPortrait)) { // Mobile or Tablet Portrait
            this.currentDeviceType = DeviceType.MOBILE;
            this.scaleFactor = 0.8;
        } else if (width < 1024) { // Tablet Landscape
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
