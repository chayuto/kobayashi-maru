/**
 * Wave Configuration for Kobayashi Maru
 * Defines wave structures, enemy compositions, and difficulty scaling
 */
import { FactionId, FactionIdType, AbilityType, AbilityTypeId } from '../types/constants';

export type FormationType = 'random' | 'cluster' | 'v-formation';

/**
 * Configuration for enemy spawning within a wave
 */
export interface EnemySpawnConfig {
  faction: FactionIdType;
  count: number;
  spawnDelay: number; // ms between spawns
  formation?: FormationType;
}

/**
 * Configuration for a single wave
 */
export interface WaveConfig {
  waveNumber: number;
  enemies: EnemySpawnConfig[];
}

/**
 * Pre-defined wave configurations for waves 1-10
 * Story text is loaded separately from waveStories.json
 */
export const WAVE_CONFIGS: WaveConfig[] = [
  // Wave 1: Simple introduction - Klingons only
  {
    waveNumber: 1,
    enemies: [
      { faction: FactionId.KLINGON, count: 5, spawnDelay: 500, formation: 'random' }
    ]
  },
  // Wave 2: More Klingons
  {
    waveNumber: 2,
    enemies: [
      { faction: FactionId.KLINGON, count: 8, spawnDelay: 400, formation: 'random' }
    ]
  },
  // Wave 3: Klingons in formation
  {
    waveNumber: 3,
    enemies: [
      { faction: FactionId.KLINGON, count: 10, spawnDelay: 350, formation: 'v-formation' }
    ]
  },
  // Wave 4: Introduce Romulans
  {
    waveNumber: 4,
    enemies: [
      { faction: FactionId.KLINGON, count: 8, spawnDelay: 400, formation: 'random' },
      { faction: FactionId.ROMULAN, count: 4, spawnDelay: 600, formation: 'cluster' }
    ]
  },
  // Wave 5: Mixed Klingon and Romulan
  {
    waveNumber: 5,
    enemies: [
      { faction: FactionId.KLINGON, count: 10, spawnDelay: 350, formation: 'v-formation' },
      { faction: FactionId.ROMULAN, count: 6, spawnDelay: 500, formation: 'random' }
    ]
  },
  // Wave 6: Romulan focus
  {
    waveNumber: 6,
    enemies: [
      { faction: FactionId.KLINGON, count: 6, spawnDelay: 400, formation: 'random' },
      { faction: FactionId.ROMULAN, count: 10, spawnDelay: 400, formation: 'cluster' }
    ]
  },
  // Wave 7: Introduce Borg
  {
    waveNumber: 7,
    enemies: [
      { faction: FactionId.KLINGON, count: 8, spawnDelay: 400, formation: 'random' },
      { faction: FactionId.ROMULAN, count: 6, spawnDelay: 500, formation: 'random' },
      { faction: FactionId.BORG, count: 2, spawnDelay: 1000, formation: 'cluster' }
    ]
  },
  // Wave 8: More Borg presence
  {
    waveNumber: 8,
    enemies: [
      { faction: FactionId.KLINGON, count: 10, spawnDelay: 350, formation: 'v-formation' },
      { faction: FactionId.ROMULAN, count: 8, spawnDelay: 450, formation: 'cluster' },
      { faction: FactionId.BORG, count: 4, spawnDelay: 800, formation: 'random' }
    ]
  },
  // Wave 9: Full assault preparation
  {
    waveNumber: 9,
    enemies: [
      { faction: FactionId.KLINGON, count: 12, spawnDelay: 300, formation: 'v-formation' },
      { faction: FactionId.ROMULAN, count: 10, spawnDelay: 400, formation: 'cluster' },
      { faction: FactionId.BORG, count: 6, spawnDelay: 700, formation: 'cluster' }
    ]
  },
  // Wave 10: All enemy types
  {
    waveNumber: 10,
    enemies: [
      { faction: FactionId.KLINGON, count: 15, spawnDelay: 250, formation: 'v-formation' },
      { faction: FactionId.ROMULAN, count: 12, spawnDelay: 350, formation: 'cluster' },
      { faction: FactionId.BORG, count: 8, spawnDelay: 600, formation: 'cluster' },
      { faction: FactionId.THOLIAN, count: 4, spawnDelay: 800, formation: 'random' },
      { faction: FactionId.SPECIES_8472, count: 2, spawnDelay: 1200, formation: 'random' }
    ]
  }
];

/**
 * Generates a procedural wave configuration for waves beyond 10
 * @param waveNumber - The wave number to generate
 * @returns A procedurally generated wave configuration
 */
export function generateProceduralWave(waveNumber: number): WaveConfig {
  // Base counts that scale with wave number
  const baseMultiplier = 1 + (waveNumber - 10) * 0.2; // 20% more enemies per wave after 10
  const exponentialFactor = Math.pow(1.1, waveNumber - 10); // Slight exponential scaling

  // Calculate counts for each faction (all factions available after wave 10)
  const klingonCount = Math.floor(15 * baseMultiplier * exponentialFactor);
  const romulanCount = Math.floor(12 * baseMultiplier * exponentialFactor);
  const borgCount = Math.floor(8 * baseMultiplier * exponentialFactor);
  const tholianCount = Math.floor(4 * baseMultiplier * exponentialFactor);
  const species8472Count = Math.floor(2 * baseMultiplier * exponentialFactor);

  // Spawn delays decrease with wave number (faster spawning)
  const delayMultiplier = Math.max(0.5, 1 - (waveNumber - 10) * 0.05);

  const enemies: EnemySpawnConfig[] = [
    {
      faction: FactionId.KLINGON,
      count: klingonCount,
      spawnDelay: Math.floor(250 * delayMultiplier),
      formation: 'v-formation'
    },
    {
      faction: FactionId.ROMULAN,
      count: romulanCount,
      spawnDelay: Math.floor(350 * delayMultiplier),
      formation: 'cluster'
    },
    {
      faction: FactionId.BORG,
      count: borgCount,
      spawnDelay: Math.floor(600 * delayMultiplier),
      formation: 'cluster'
    },
    {
      faction: FactionId.THOLIAN,
      count: tholianCount,
      spawnDelay: Math.floor(800 * delayMultiplier),
      formation: 'random'
    },
    {
      faction: FactionId.SPECIES_8472,
      count: species8472Count,
      spawnDelay: Math.floor(1200 * delayMultiplier),
      formation: 'random'
    }
  ];

  return {
    waveNumber,
    enemies
  };
}

/**
 * Gets the wave configuration for a given wave number
 * @param waveNumber - The wave number (1-indexed)
 * @returns The wave configuration
 */
export function getWaveConfig(waveNumber: number): WaveConfig {
  if (waveNumber <= 0) {
    return WAVE_CONFIGS[0]; // Default to wave 1
  }

  if (waveNumber <= WAVE_CONFIGS.length) {
    return WAVE_CONFIGS[waveNumber - 1];
  }

  // Generate procedural wave for waves beyond predefined ones
  return generateProceduralWave(waveNumber);
}

/**
 * Calculates the difficulty scaling factor for a given wave
 * Used to scale enemy health/speed
 * @param waveNumber - The wave number
 * @returns A scaling factor (1.0 = base stats)
 */
export function getDifficultyScale(waveNumber: number): number {
  // Linear scaling until wave 10, then slight exponential
  if (waveNumber <= 10) {
    return 1 + (waveNumber - 1) * 0.05; // 5% increase per wave
  }

  // Base scale at wave 10 + exponential growth
  const baseScale = 1.45; // Scale at wave 10
  const exponentialGrowth = Math.pow(1.03, waveNumber - 10);
  return baseScale * exponentialGrowth;
}

// Import story texts from JSON config
import waveStoriesConfig from '../config/waveStories.json';

// Total number of unique story texts
const TOTAL_STORY_COUNT = waveStoriesConfig.stories.length;

/**
 * Gets the story text for a given wave number
 * @param waveNumber - The wave number (1-indexed)
 * @returns The story text for the wave
 */
export function getWaveStoryText(waveNumber: number): string {
  // Normalize wave number to loop after 50 stages
  const normalizedWave = ((waveNumber - 1) % TOTAL_STORY_COUNT) + 1;

  // Find the story for this wave
  const story = waveStoriesConfig.stories.find(s => s.wave === normalizedWave);
  return story?.text ?? `Wave ${waveNumber}: The battle continues...`;
}

// ============================================================================
// BOSS WAVE SYSTEM
// ============================================================================

/**
 * Configuration for boss wave special events
 */
export interface BossWaveConfig {
  waveNumber: number;
  bossType: FactionIdType;
  bossCount: number;
  bossAbilities: AbilityTypeId[];
  supportEnemies: {
    faction: FactionIdType;
    count: number;
  }[];
  rewardMultiplier: number;
}

/**
 * Pre-defined boss waves
 */
export const BOSS_WAVES: BossWaveConfig[] = [
  {
    waveNumber: 5,
    bossType: FactionId.BORG,
    bossCount: 1,
    bossAbilities: [AbilityType.SHIELD_REGEN, AbilityType.SUMMON],
    supportEnemies: [
      { faction: FactionId.BORG, count: 10 }
    ],
    rewardMultiplier: 2.0
  },
  {
    waveNumber: 10,
    bossType: FactionId.SPECIES_8472,
    bossCount: 1,
    bossAbilities: [AbilityType.TELEPORT, AbilityType.CLOAK],
    supportEnemies: [
      { faction: FactionId.SPECIES_8472, count: 5 }
    ],
    rewardMultiplier: 3.0
  },
  {
    waveNumber: 15,
    bossType: FactionId.ROMULAN,
    bossCount: 2,
    bossAbilities: [AbilityType.CLOAK, AbilityType.RAMMING_SPEED],
    supportEnemies: [
      { faction: FactionId.ROMULAN, count: 15 },
      { faction: FactionId.KLINGON, count: 10 }
    ],
    rewardMultiplier: 4.0
  },
  {
    waveNumber: 20,
    bossType: FactionId.BORG,
    bossCount: 2,
    bossAbilities: [AbilityType.SHIELD_REGEN, AbilityType.SPLIT],
    supportEnemies: [
      { faction: FactionId.BORG, count: 20 },
      { faction: FactionId.THOLIAN, count: 10 }
    ],
    rewardMultiplier: 5.0
  }
];

/**
 * Checks if a wave is a boss wave
 * @param waveNumber - The wave number to check
 * @returns The boss wave config if it's a boss wave, null otherwise
 */
export function getBossWaveConfig(waveNumber: number): BossWaveConfig | null {
  return BOSS_WAVES.find(bw => bw.waveNumber === waveNumber) ?? null;
}
