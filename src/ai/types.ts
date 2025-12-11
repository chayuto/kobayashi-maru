/**
 * AI Auto-Play System Types
 *
 * Type definitions for the AI auto-play system.
 *
 * @module ai/types
 */

// =============================================================================
// ENUMS
// =============================================================================

/**
 * Action types the AI can perform
 */
export enum AIActionType {
    PLACE_TURRET = 'PLACE_TURRET',
    UPGRADE_TURRET = 'UPGRADE_TURRET',
    SELL_TURRET = 'SELL_TURRET',
}

/**
 * AI personality profiles affecting decision-making
 */
export enum AIPersonality {
    BALANCED = 'BALANCED',
    AGGRESSIVE = 'AGGRESSIVE',
    DEFENSIVE = 'DEFENSIVE',
    ECONOMIC = 'ECONOMIC',
    ADAPTIVE = 'ADAPTIVE',
}

// =============================================================================
// THREAT ANALYSIS TYPES
// =============================================================================

/**
 * Represents a single enemy threat with analysis data
 */
export interface ThreatVector {
    entityId: number;
    position: { x: number; y: number };
    velocity: { x: number; y: number };
    predictedImpactTime: number;
    threatLevel: number;
    factionId: number;
    behaviorType: number;
    healthPercent: number;
    isElite: boolean;
    isBoss: boolean;
}

// =============================================================================
// ACTION TYPES
// =============================================================================

/**
 * Parameters for placing a turret
 */
export interface PlacementParams {
    x: number;
    y: number;
    turretType: number;
}

/**
 * Parameters for upgrading a turret
 */
export interface UpgradeParams {
    turretId: number;
    upgradePath: number;
}

/**
 * Parameters for selling a turret
 */
export interface SellParams {
    turretId: number;
}

/**
 * Union type for action parameters
 */
export type ActionParams = PlacementParams | UpgradeParams | SellParams;

/**
 * Represents a planned AI action
 */
export interface AIAction {
    type: AIActionType;
    priority: number;
    cost: number;
    expectedValue: number;
    params: ActionParams;
}

// =============================================================================
// COVERAGE ANALYSIS TYPES
// =============================================================================

/**
 * Data for a single sector in coverage analysis
 */
export interface SectorData {
    index: number;
    x: number;
    y: number;
    width: number;
    height: number;
    turretCount: number;
    totalDPS: number;
    enemyCount: number;
    threatLevel: number;
}

/**
 * Coverage analysis results
 */
export interface CoverageMap {
    sectors: SectorData[];
    totalCoverage: number;
    weakestSector: number;
}

// =============================================================================
// AI STATUS
// =============================================================================

/**
 * AI status for UI display
 */
export interface AIStatus {
    enabled: boolean;
    personality: AIPersonality;
    currentAction: AIAction | null;
    threatLevel: number;
    coveragePercent: number;
    lastDecisionTime: number;
}

// =============================================================================
// EXECUTION RESULT
// =============================================================================

/**
 * Result of executing an AI action
 */
export interface ExecutionResult {
    success: boolean;
    reason?: string;
    entityId?: number;
}
