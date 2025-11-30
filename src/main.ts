/**
 * Kobayashi Maru - Main Entry Point
 * 
 * An endless simulation / "God Game" tower defense
 * where you protect the civilian freighter Kobayashi Maru
 * against infinite waves of enemies.
 */
import './style.css';
import { Game } from './core';

// Global game instance
let game: Game | null = null;

/**
 * Initialize and start the game
 */
async function main(): Promise<void> {
  try {
    console.log('Starting Kobayashi Maru...');

    game = new Game('app');
    await game.init();
    game.start();

    console.log('Kobayashi Maru ready. Engage!');
  } catch (error) {
    console.error('Failed to initialize Kobayashi Maru:', error);

    // Display error message to user
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="color: #FF9900; font-family: monospace; padding: 20px; text-align: center;">
          <h1>SYSTEM FAILURE</h1>
          <p>Unable to initialize tactical systems.</p>
          <p style="color: #99CCFF; font-size: 12px;">${error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      `;
    }
  }
}

// Start the application when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}

// Export for module access
export { game };
