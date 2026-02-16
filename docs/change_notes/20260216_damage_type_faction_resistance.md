# Damage Type / Faction Resistance System

**Date**: 2026-02-16
**Task**: G2 - Damage Type / Faction Resistance System

## Summary

Implemented a rock-paper-scissors-style damage type system where different turret weapons deal different damage types (Energy, Kinetic, Exotic) and each enemy faction has resistance/vulnerability multipliers per damage type. This creates strategic depth requiring players to choose the right turrets for each faction.

## Changes

### New File: `src/config/combat.damageTypes.ts`
- Defines `DamageType` enum: ENERGY (0), KINETIC (1), EXOTIC (2)
- `TURRET_DAMAGE_TYPE` mapping: maps all 6 turret types to their damage category
  - Energy: Phaser Array, Disruptor Bank
  - Kinetic: Torpedo Launcher
  - Exotic: Tetryon Beam, Plasma Cannon, Polaron Beam
- `FACTION_RESISTANCES` table: multipliers per faction per damage type
  - Klingon: resistant to kinetic (0.7x), vulnerable to exotic (1.3x)
  - Romulan: resistant to energy (0.8x), vulnerable to kinetic (1.2x)
  - Borg: very resistant to energy (0.5x), very vulnerable to exotic (1.5x)
  - Tholian: vulnerable to energy (1.2x), resistant to exotic (0.8x)
  - Species 8472: vulnerable to energy (1.3x), resistant to kinetic (0.8x)

### Modified: `src/config/index.ts`
- Added barrel export for `combat.damageTypes`

### Modified: `src/systems/combatSystem.ts`
- Added import of `TURRET_DAMAGE_TYPE` and `FACTION_RESISTANCES`
- Added faction resistance calculation in `applyDamage()` method, applied BEFORE weapon property multipliers
- Looks up turret's damage type, then enemy's faction resistances, and scales damage accordingly
- Gracefully handles missing entries (unknown factions default to 1.0x)

### New File: `src/__tests__/damageTypes.test.ts`
- 34 tests covering:
  - DamageType constants existence and values
  - TURRET_DAMAGE_TYPE mapping completeness and correctness for all 6 turrets
  - FACTION_RESISTANCES table coverage for all 5 enemy factions
  - Individual faction resistance values (Klingon, Romulan, Borg, Tholian, Species 8472)
  - Unknown faction graceful fallback
  - Integration tests with full combat system:
    - Borg 0.5x energy resistance
    - Borg 1.5x exotic vulnerability
    - Tholian 1.2x energy vulnerability vs Klingon baseline
    - Federation (no entry) defaults to 1.0x
    - Resistance applied before weapon property multipliers
    - Romulan 0.8x energy resistance

## Validation

- `npm run lint` - passes
- `npm run test` - 2,411 tests pass (108 files), including 34 new tests
- `npm run build` - succeeds (TypeScript strict + Vite production build)
