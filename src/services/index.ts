/**
 * Services module barrel export for Kobayashi Maru
 * Contains service utilities like storage, persistence, and damage calculation
 */
export * from './StorageService';
export { applyDamage, applyDamageDetailed } from './DamageService';
export type { DamageResult } from './DamageService';
export { EntityPoolService } from './EntityPoolService';
export { ErrorService, GameError, GameErrorCode } from './ErrorService';
