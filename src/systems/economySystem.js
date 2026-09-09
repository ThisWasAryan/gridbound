import { UPGRADES_CONFIG, calculateUpgradeCost } from '../config/upgrades.config.js';
import { saveGame } from '../state/saveLoad.js';
import { EventBus } from '../utils/eventBus.js';

let state;

export function initEconomySystem(gameState) {
    state = gameState;
}

/**
 * Attempts to purchase an upgrade.
 * @param {string} upgradeId - e.g., 'engine', 'pitCrew'
 * @returns {boolean} True if successful.
 */
export function buyUpgrade(upgradeId) {
    const config = UPGRADES_CONFIG[upgradeId];
    if (!config) return false;

    let currentLevel = 0;
    
    if (config.type === 'per-car') {
        const carId = state.session.currentCarId;
        currentLevel = state.cars[carId][`${upgradeId}Level`];
    } else {
        currentLevel = state.team[`${upgradeId}Level`];
    }

    const cost = calculateUpgradeCost(config.baseCost, config.growthRate, currentLevel);
    
    if (state.economy.credits < cost) return false;

    // Deduct cost
    state.economy.credits -= cost;

    // Apply upgrade
    if (config.type === 'per-car') {
        const carId = state.session.currentCarId;
        state.cars[carId][`${upgradeId}Level`] += 1;
    } else {
        state.team[`${upgradeId}Level`] += 1;
    }

    saveGame(state);
    
    // Emit events
    EventBus.emit('credits:changed', { total: state.economy.credits });
    EventBus.emit('upgrade:purchased', { id: upgradeId, newLevel: currentLevel + 1 });
    
    return true;
}
