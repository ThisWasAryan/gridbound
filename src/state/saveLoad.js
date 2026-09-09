import { getInitialState } from './gameState.js';
import { migrate } from './migrations.js';

const SAVE_KEY = 'formula_incremental_save';

/**
 * Loads the game state from localStorage, migrates it, and returns it.
 * @returns {Object} The game state.
 */
export function loadGame() {
    const saved = localStorage.getItem(SAVE_KEY);
    let state;
    if (saved) {
        try {
            state = JSON.parse(saved);
        } catch (e) {
            console.error("Failed to parse save, starting fresh.", e);
            state = getInitialState();
        }
    } else {
        state = getInitialState();
    }
    
    return migrate(state);
}

/**
 * Saves the current game state to localStorage.
 * @param {Object} state - The game state to save.
 */
export function saveGame(state) {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
