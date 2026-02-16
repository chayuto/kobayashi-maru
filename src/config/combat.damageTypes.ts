/**
 * Damage Type System
 *
 * Defines damage categories and faction resistances for a rock-paper-scissors
 * style strategic layer. Different turret weapons deal different damage types,
 * and each enemy faction has resistance/vulnerability multipliers per type.
 *
 * @module config/combat.damageTypes
 */

import { TurretType } from '../types/constants';
import { FactionId } from '../types/config/factions';

// =============================================================================
// DAMAGE TYPE DEFINITIONS
// =============================================================================

/** Damage type categories */
export const DamageType = {
  ENERGY: 0,    // Phaser, Disruptor
  KINETIC: 1,   // Torpedo
  EXOTIC: 2,    // Tetryon, Plasma, Polaron
} as const;

export type DamageTypeId = typeof DamageType[keyof typeof DamageType];

// =============================================================================
// TURRET → DAMAGE TYPE MAPPING
// =============================================================================

/** Map turret types to their damage type category */
export const TURRET_DAMAGE_TYPE: Record<number, DamageTypeId> = {
  [TurretType.PHASER_ARRAY]: DamageType.ENERGY,
  [TurretType.TORPEDO_LAUNCHER]: DamageType.KINETIC,
  [TurretType.DISRUPTOR_BANK]: DamageType.ENERGY,
  [TurretType.TETRYON_BEAM]: DamageType.EXOTIC,
  [TurretType.PLASMA_CANNON]: DamageType.EXOTIC,
  [TurretType.POLARON_BEAM]: DamageType.EXOTIC,
};

// =============================================================================
// FACTION RESISTANCE TABLE
// =============================================================================

/**
 * Faction resistance table: multiplier per damage type.
 *
 * - `< 1.0` = resistant (takes less damage)
 * - `1.0` = normal
 * - `> 1.0` = vulnerable (takes more damage)
 *
 * @example
 * ```typescript
 * import { FACTION_RESISTANCES, DamageType } from '../config';
 * import { FactionId } from '../types/config/factions';
 *
 * const borgEnergyMult = FACTION_RESISTANCES[FactionId.BORG][DamageType.ENERGY]; // 0.5
 * ```
 */
export const FACTION_RESISTANCES: Record<number, Record<number, number>> = {
  [FactionId.KLINGON]: {
    [DamageType.ENERGY]: 1.0,
    [DamageType.KINETIC]: 0.7,   // Resistant to kinetic (heavy armor)
    [DamageType.EXOTIC]: 1.3,    // Vulnerable to exotic
  },
  [FactionId.ROMULAN]: {
    [DamageType.ENERGY]: 0.8,    // Resistant to energy (cloaking shields)
    [DamageType.KINETIC]: 1.2,   // Vulnerable to kinetic
    [DamageType.EXOTIC]: 1.0,
  },
  [FactionId.BORG]: {
    [DamageType.ENERGY]: 0.5,    // Very resistant to energy (adaptation)
    [DamageType.KINETIC]: 1.0,
    [DamageType.EXOTIC]: 1.5,    // Very vulnerable to exotic
  },
  [FactionId.THOLIAN]: {
    [DamageType.ENERGY]: 1.2,    // Vulnerable to energy
    [DamageType.KINETIC]: 1.0,
    [DamageType.EXOTIC]: 0.8,    // Resistant to exotic (crystalline)
  },
  [FactionId.SPECIES_8472]: {
    [DamageType.ENERGY]: 1.3,    // Vulnerable to energy
    [DamageType.KINETIC]: 0.8,   // Resistant to kinetic (bioarmor)
    [DamageType.EXOTIC]: 1.0,
  },
};
