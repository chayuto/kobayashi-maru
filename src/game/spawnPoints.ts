/**
 * Spawn Points System for Kobayashi Maru
 * Handles spawn positions along screen edges and formation patterns
 */
import { GAME_CONFIG } from '../types/constants';
import { FormationType } from './waveConfig';

/**
 * A spawn position with x, y coordinates
 */
export interface SpawnPosition {
  x: number;
  y: number;
}

/**
 * Edge type for spawn positioning
 */
export type EdgeType = 'top' | 'right' | 'bottom' | 'left';

// Margin from screen edge for spawn positions
const EDGE_MARGIN = 50;

/**
 * Gets a random edge of the screen
 * @returns A random edge type
 */
export function getRandomEdge(): EdgeType {
  const edges: EdgeType[] = ['top', 'right', 'bottom', 'left'];
  return edges[Math.floor(Math.random() * edges.length)];
}

/**
 * Gets a spawn position along a specific edge
 * @param edge - The edge to spawn from
 * @param positionAlongEdge - Optional position along the edge (0-1), random if not provided
 * @returns A spawn position
 */
export function getEdgePosition(edge: EdgeType, positionAlongEdge?: number): SpawnPosition {
  const pos = positionAlongEdge ?? Math.random();
  const width = GAME_CONFIG.WORLD_WIDTH;
  const height = GAME_CONFIG.WORLD_HEIGHT;
  
  switch (edge) {
    case 'top':
      return { x: pos * width, y: -EDGE_MARGIN };
    case 'right':
      return { x: width + EDGE_MARGIN, y: pos * height };
    case 'bottom':
      return { x: pos * width, y: height + EDGE_MARGIN };
    case 'left':
      return { x: -EDGE_MARGIN, y: pos * height };
  }
}

/**
 * Gets a random spawn position along any edge
 * @returns A random spawn position along screen edges
 */
export function getRandomEdgePosition(): SpawnPosition {
  return getEdgePosition(getRandomEdge());
}

/**
 * Generates spawn positions for a cluster formation
 * @param count - Number of positions to generate
 * @param clusterRadius - Radius of the cluster
 * @returns Array of spawn positions
 */
export function getClusterPositions(count: number, clusterRadius: number = 100): SpawnPosition[] {
  const positions: SpawnPosition[] = [];
  
  // Get a center point along a random edge
  const centerPos = getRandomEdgePosition();
  
  for (let i = 0; i < count; i++) {
    // Random offset within cluster radius
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * clusterRadius;
    
    positions.push({
      x: centerPos.x + Math.cos(angle) * distance,
      y: centerPos.y + Math.sin(angle) * distance
    });
  }
  
  return positions;
}

/**
 * Generates spawn positions for a V-formation
 * @param count - Number of positions to generate
 * @param spacing - Spacing between entities in the formation
 * @returns Array of spawn positions
 */
export function getVFormationPositions(count: number, spacing: number = 40): SpawnPosition[] {
  const positions: SpawnPosition[] = [];
  
  // Get a base position along a random edge
  const edge = getRandomEdge();
  const basePos = getEdgePosition(edge, 0.5); // Center of the edge
  
  // Calculate formation direction (pointing inward toward screen center)
  const centerX = GAME_CONFIG.WORLD_WIDTH / 2;
  const centerY = GAME_CONFIG.WORLD_HEIGHT / 2;
  const toCenter = Math.atan2(centerY - basePos.y, centerX - basePos.x);
  
  // V-formation angle (spread of the V)
  const vAngle = Math.PI / 6; // 30 degrees on each side
  
  // Leader is at the front
  positions.push({ ...basePos });
  
  // Wings of the V
  let leftCount = 0;
  let rightCount = 0;
  
  for (let i = 1; i < count; i++) {
    const wingIndex = i % 2 === 0 ? leftCount++ : rightCount++;
    const isLeft = i % 2 === 0;
    
    const wingAngle = isLeft ? toCenter + Math.PI + vAngle : toCenter + Math.PI - vAngle;
    const distance = (wingIndex + 1) * spacing;
    
    positions.push({
      x: basePos.x + Math.cos(wingAngle) * distance,
      y: basePos.y + Math.sin(wingAngle) * distance
    });
  }
  
  return positions;
}

/**
 * Generates spawn positions based on formation type
 * @param count - Number of positions to generate
 * @param formation - The formation type
 * @returns Array of spawn positions
 */
export function getFormationPositions(count: number, formation: FormationType): SpawnPosition[] {
  switch (formation) {
    case 'cluster':
      return getClusterPositions(count);
    case 'v-formation':
      return getVFormationPositions(count);
    case 'random':
    default:
      // Generate individual random positions
      return Array.from({ length: count }, () => getRandomEdgePosition());
  }
}

/**
 * SpawnPoints class for managing spawn positions with state
 */
export class SpawnPoints {
  private currentPositions: SpawnPosition[] = [];
  private currentIndex: number = 0;
  
  /**
   * Sets up spawn positions for a formation
   * @param count - Number of spawn positions needed
   * @param formation - The formation type
   */
  setupFormation(count: number, formation: FormationType): void {
    this.currentPositions = getFormationPositions(count, formation);
    this.currentIndex = 0;
  }
  
  /**
   * Gets the next spawn position
   * @returns The next spawn position, or a random position if none available
   */
  getSpawnPosition(): SpawnPosition {
    if (this.currentIndex < this.currentPositions.length) {
      return this.currentPositions[this.currentIndex++];
    }
    // Fallback to random position if we've used all preset positions
    return getRandomEdgePosition();
  }
  
  /**
   * Resets the spawn points for a new wave
   */
  reset(): void {
    this.currentPositions = [];
    this.currentIndex = 0;
  }
  
  /**
   * Gets remaining positions count
   * @returns Number of remaining preset positions
   */
  getRemainingCount(): number {
    return Math.max(0, this.currentPositions.length - this.currentIndex);
  }
}
