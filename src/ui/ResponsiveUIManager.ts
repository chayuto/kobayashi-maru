import { UI_CONFIG } from '../config';

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
        const { MOBILE_BREAKPOINT, TABLET_BREAKPOINT, MOBILE_SCALE, TABLET_SCALE, DESKTOP_SCALE } = UI_CONFIG.RESPONSIVE;

        // Check orientation (if mobile/tablet)
        const isPortrait = height > width;

        if (width < MOBILE_BREAKPOINT || (width < TABLET_BREAKPOINT && isPortrait)) {
            this.currentDeviceType = DeviceType.MOBILE;
            this.scaleFactor = MOBILE_SCALE;
        } else if (width < TABLET_BREAKPOINT) {
            this.currentDeviceType = DeviceType.TABLET;
            this.scaleFactor = TABLET_SCALE;
        } else {
            this.currentDeviceType = DeviceType.DESKTOP;
            this.scaleFactor = DESKTOP_SCALE;
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
