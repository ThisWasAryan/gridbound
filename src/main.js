import { loadGame, saveGame } from './state/saveLoad.js';
import { initDebugPanel } from './debug/debugPanel.js';

let gameState;

/**
 * Initializes the application.
 */
function init() {
    console.log("Initializing FORMULA INCREMENTAL...");
    
    // Load and migrate state
    gameState = loadGame();
    
    // Save state immediately to ensure meta format is stored
    saveGame(gameState);

    // Initialize debug panel
    initDebugPanel(gameState);
    
    console.log("Game initialized successfully.");
}

// Boot the game
init();
