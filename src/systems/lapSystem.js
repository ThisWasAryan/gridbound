import { CARS_CONFIG } from "../config/cars.config.js";
import { TRACKS_CONFIG } from "../config/tracks.config.js";

/**
 * Calculates the expected lap time in milliseconds based on current state.
 * @param {Object} state - The game state.
 * @returns {number} The lap duration in milliseconds.
 */
export function calculateLapDurationMs(state) {
  const carId = state.session.currentCarId;
  const trackId = state.session.currentTrackId;

  const carDef = CARS_CONFIG[carId];
  const trackDef = TRACKS_CONFIG[trackId];

  const carState = state.cars[carId];
  const team = state.team;

  const engineFactor = carDef.baseEngine + carState.engineLevel * 0.08;
  const aeroFactor = carDef.baseAero + carState.aeroLevel * 0.08;
  const tyreFactor = carDef.baseTyre + carState.tyreLevel * 0.06;

  const straightTime = trackDef.straightWeight / engineFactor;
  const cornerTime = trackDef.cornerWeight / (aeroFactor * tyreFactor);

  // Add small random variation based on driver level
  // Higher driver level = less variation
  const baseVariationRange = 500;
  const driverReduction = Math.min(0.9, team.driverLevel * 0.05); // up to 90% reduction
  const variationRange = baseVariationRange * (1 - driverReduction);

  // variation between -variationRange/2 and +variationRange/2
  const variation = (Math.random() - 0.5) * variationRange;

  return Math.max(1000, straightTime + cornerTime + variation); // Absolute minimum 1s
}
