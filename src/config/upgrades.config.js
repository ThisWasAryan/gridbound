export const UPGRADES_CONFIG = {
    engine: {
        id: 'engine',
        name: 'Engine',
        baseCost: 200,
        growthRate: 1.15,
        type: 'per-car', // Engine/Aero/Tyres are per car
        description: 'Improves straight-line speed.'
    },
    aero: {
        id: 'aero',
        name: 'Aerodynamics',
        baseCost: 250,
        growthRate: 1.15,
        type: 'per-car',
        description: 'Improves cornering speed.'
    },
    tyres: {
        id: 'tyres',
        name: 'Tyres',
        baseCost: 150,
        growthRate: 1.12,
        type: 'per-car',
        description: 'Improves overall grip and acceleration.'
    },
    pitCrew: {
        id: 'pitCrew',
        name: 'Pit Crew',
        baseCost: 500,
        growthRate: 1.25,
        type: 'global', // Pit Crew and Driver are global
        description: 'Reduces pit stop duration.'
    },
    driver: {
        id: 'driver',
        name: 'Driver Training',
        baseCost: 400,
        growthRate: 1.20,
        type: 'global',
        description: 'Improves lap time consistency.'
    }
};

/**
 * Calculates the cost of an upgrade based on current level.
 * @param {number} baseCost 
 * @param {number} growthRate 
 * @param {number} currentLevel 
 * @returns {number} The rounded cost.
 */
export function calculateUpgradeCost(baseCost, growthRate, currentLevel) {
    return Math.round(baseCost * Math.pow(growthRate, currentLevel));
}
