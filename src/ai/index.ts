/**
 * AI Auto-Play System
 *
 * Barrel export for all AI auto-play components.
 *
 * @module ai
 */

// Types
export * from './types';

// Core classes
export { ThreatAnalyzer } from './ThreatAnalyzer';
export { CoverageAnalyzer } from './CoverageAnalyzer';
export { ActionPlanner } from './ActionPlanner';
export { ActionExecutor } from './ActionExecutor';
export { AIAutoPlayManager } from './AIAutoPlayManager';

// Spatial intelligence
export { FlowFieldAnalyzer } from './spatial/FlowFieldAnalyzer';
export { InfluenceMap } from './spatial/InfluenceMap';
export { ThreatInfluenceMap } from './spatial/ThreatInfluenceMap';
export { CoverageInfluenceMap } from './spatial/CoverageInfluenceMap';
export { PathInterceptor } from './spatial/PathInterceptor';
export { ApproachCorridorAnalyzer } from './spatial/ApproachCorridorAnalyzer';

// Behavior analysis
export { BehaviorPredictor } from './behaviors/BehaviorPredictor';
export { BehaviorCounterSelector } from './behaviors/BehaviorCounterSelector';

// Utility AI
export { ScoringCurves } from './utility/ScoringCurves';
export { ActionBucketing } from './utility/ActionBucketing';
export { DecisionInertia } from './utility/DecisionInertia';

// Humanization
export { AIHumanizer } from './humanization/AIHumanizer';
export { DynamicDifficultyAdjuster } from './humanization/DynamicDifficultyAdjuster';
export { AIMoodEngine } from './humanization/AIMoodEngine';
export { AIMessageGenerator } from './humanization/AIMessageGenerator';

// Synergy
export { SynergyDetector } from './behaviors/SynergyDetector';

// Prediction
export { WavePredictor } from './prediction/WavePredictor';
