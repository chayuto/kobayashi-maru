/**
 * Particle Types for Kobayashi Maru
 *
 * Shared types for the particle system components.
 *
 * @module rendering/particles/types
 */

import { Graphics } from 'pixi.js';

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
    spriteType: ParticleSpriteType;
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
    // Debris physics
    bounces?: number;
    bounceDamping?: number;
    groundY?: number;
}

export interface ParticleConfig {
    x: number;
    y: number;
    count: number;
    speed: { min: number; max: number };
    life: { min: number; max: number };
    size: { min: number; max: number };
    color?: number;
    spread: number; // Angle spread in radians

    // Optional fields
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
    bounceCount?: number;
    bounceDamping?: number;
    groundY?: number;
}
