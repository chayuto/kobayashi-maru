/**
 * TextureCache - Singleton cache for faction textures
 * Prevents duplicate texture generation for better performance
 */
import { Texture } from 'pixi.js';

/**
 * Singleton texture cache to avoid duplicate texture generation
 */
export class TextureCache {
  private static instance: TextureCache;
  private textures: Map<string, Texture>;

  private constructor() {
    this.textures = new Map();
  }

  /**
   * Gets the singleton instance
   * @returns The TextureCache instance
   */
  static getInstance(): TextureCache {
    if (!TextureCache.instance) {
      TextureCache.instance = new TextureCache();
    }
    return TextureCache.instance;
  }

  /**
   * Gets a cached texture
   * @param key - The texture key
   * @returns The texture or undefined if not cached
   */
  get(key: string): Texture | undefined {
    return this.textures.get(key);
  }

  /**
   * Stores a texture in the cache
   * @param key - The texture key
   * @param texture - The texture to cache
   */
  set(key: string, texture: Texture): void {
    this.textures.set(key, texture);
  }

  /**
   * Checks if a texture is cached
   * @param key - The texture key
   * @returns True if the texture is cached
   */
  has(key: string): boolean {
    return this.textures.has(key);
  }

  /**
   * Clears all cached textures
   */
  clear(): void {
    this.textures.clear();
  }

  /**
   * Gets the number of cached textures
   * @returns The cache size
   */
  size(): number {
    return this.textures.size;
  }

  /**
   * Resets the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    TextureCache.instance = new TextureCache();
  }
}
