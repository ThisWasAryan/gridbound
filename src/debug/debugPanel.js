import { saveGame } from '../state/saveLoad.js';
import { getInitialState } from '../state/gameState.js';

/**
 * Sets up the global debug panel attached to the window object.
 * @param {Object} gameState - The canonical game state reference.
 */
export function initDebugPanel(gameState) {
    window.Game = {
        state: gameState,
        debug: {
            addCredits(n) {
                if (typeof n !== 'number' || isNaN(n)) return "Please provide a valid number.";
                gameState.economy.credits += n;
                gameState.economy.lifetimeCreditsEarned += n;
                saveGame(gameState);
                return `Added ${n} credits. Total: ${gameState.economy.credits}`;
            },
            unlockCar(carId) {
                if (gameState.cars[carId]) {
                    gameState.cars[carId].owned = true;
                    saveGame(gameState);
                    return `Unlocked car: ${carId}`;
                }
                return `Car not found: ${carId}`;
            },
            unlockTrack(trackId) {
                if (gameState.tracks[trackId]) {
                    gameState.tracks[trackId].owned = true;
                    saveGame(gameState);
                    return `Unlocked track: ${trackId}`;
                }
                return `Track not found: ${trackId}`;
            },
            setBestTime(carId, trackId, ms) {
                const key = `${carId}:${trackId}`;
                gameState.bestTimes[key] = ms;
                saveGame(gameState);
                return `Set best time for ${key} to ${ms}ms`;
            },
            hirePrincipal(id) {
                if (!gameState.principals.hiredIds.includes(id)) {
                    gameState.principals.hiredIds.push(id);
                }
                gameState.principals.activeId = id;
                saveGame(gameState);
                return `Hired principal: ${id}`;
            },
            triggerAchievement(id) {
                if (!gameState.achievements.unlockedIds.includes(id)) {
                    gameState.achievements.unlockedIds.push(id);
                    saveGame(gameState);
                    return `Triggered achievement: ${id}`;
                }
                return `Achievement already unlocked: ${id}`;
            },
            exportSave() {
                return JSON.stringify(gameState);
            },
            importSave(jsonString) {
                try {
                    const parsed = JSON.parse(jsonString);
                    // Minimal validation
                    if (!parsed.meta) throw new Error("Missing meta data");
                    Object.assign(gameState, parsed);
                    saveGame(gameState);
                    return "Save imported successfully. Please refresh the page.";
                } catch (e) {
                    return `Failed to import save: ${e.message}`;
                }
            },
            resetSave() {
                const fresh = getInitialState();
                Object.assign(gameState, fresh);
                saveGame(gameState);
                return "Save reset to initial state.";
            },
            validateState() {
                const errors = [];
                if (typeof gameState.economy.credits !== 'number' || isNaN(gameState.economy.credits)) errors.push("Invalid credits.");
                if (gameState.economy.credits < 0) errors.push("Negative credits.");
                if (!gameState.cars[gameState.session.currentCarId]?.owned) errors.push(`Current car ${gameState.session.currentCarId} is not owned.`);
                if (!gameState.tracks[gameState.session.currentTrackId]?.owned) errors.push(`Current track ${gameState.session.currentTrackId} is not owned.`);
                
                Object.entries(gameState.bestTimes).forEach(([key, time]) => {
                    if (time < 0) errors.push(`Negative best time for ${key}: ${time}`);
                });

                if (errors.length > 0) {
                    console.error("State Validation Failed:", errors);
                    return false;
                }
                console.log("State is valid.");
                return true;
            }
        }
    };
    console.log("Debug tools initialized. Access via window.Game.debug");
}
