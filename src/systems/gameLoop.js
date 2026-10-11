import { CONSTANTS } from "../config/constants.js";
import { TRACKS_CONFIG } from "../config/tracks.config.js";
import { EventBus } from "../utils/eventBus.js";
import { saveGame } from "../state/saveLoad.js";
import { calculateLapDurationMs } from "./lapSystem.js";
import { triggerPitStop } from "./pitStopSystem.js";
import { AudioEngine } from "../audio/audioManager.js";

let lastTimestamp = 0;
let rafId = null;
let logicIntervalId = null;

// The game state reference injected on boot
let state;

/**
 * Starts a manual lap.
 */

/**
 * Aborts the current lap manually.
 */
export function abortLap() {
  if (!state.runtime.lapActive) return;
  state.runtime.lapActive = false;
  state.runtime.lapProgress = 0;
  state.runtime.pitStopActive = false;
  AudioEngine.stop();
  EventBus.emit("lap:aborted");
}

export function startManualLap() {
  if (state.runtime.lapActive) return;

  const expectedDurationMs = calculateLapDurationMs(state);

  state.runtime.lapActive = true;
  state.runtime.lapStartTime = performance.now();
  state.runtime.baseLapDurationMs = expectedDurationMs;
  state.runtime.expectedLapDurationMs = expectedDurationMs;
  state.runtime.lapProgress = 0;
  state.runtime.pitRadioAlertSent = false;

  AudioEngine.start();
  EventBus.emit("lap:started", { expectedDurationMs });
}

/**
 * Handles lap completion logic.
 */
function completeLap() {
  state.runtime.lapActive = false;
  state.runtime.lapProgress = 1;
  AudioEngine.stop();

  const trackDef = TRACKS_CONFIG[state.session.currentTrackId];
  const sponsorshipMultiplier = 1 + (state.team.sponsorshipsLevel || 0) * 0.25;
  let profit = Math.round(
    CONSTANTS.BASE_LAP_PROFIT * trackDef.profitMultiplier * sponsorshipMultiplier,
  );
  const lapTimeMs = state.runtime.expectedLapDurationMs;

  let pitMultiplier = 1;
  let pitColor = "#33ff33"; // Green for normal
  
  if (state.runtime.lastPitStopQuality) {
    if (state.runtime.lastPitStopQuality === "PERFECT") {
      pitMultiplier = 4;
      pitColor = "#ffb020"; // Gold
    } else if (state.runtime.lastPitStopQuality === "GOOD") {
      pitMultiplier = 2;
      pitColor = "#a855f7"; // F1 Purple (No Blue)
    } else if (state.runtime.lastPitStopQuality === "BAD") {
      pitMultiplier = 0;
      pitColor = "#e63946"; // Red
    }
    state.runtime.lastPitStopQuality = null;
  }
  
  profit *= pitMultiplier;

  // Update state
  state.economy.credits += profit;
  state.economy.lifetimeCreditsEarned += profit;

  // Check personal best
  const bestTimeKey = `${state.session.currentCarId}:${state.session.currentTrackId}`;
  const previousBest = state.bestTimes[bestTimeKey];
  let isPersonalBest = false;

  if (!previousBest || lapTimeMs < previousBest) {
    state.bestTimes[bestTimeKey] = lapTimeMs;
    isPersonalBest = true;
  }

  saveGame(state);

  EventBus.emit("lap:completed", {
    lapTimeMs,
    profit,
    isPersonalBest,
    previousBest,
    pitMultiplier,
    pitColor,
  });
}

/**
 * The main rAF loop for continuous animation and driving simulation ticks.
 */
function rafLoop(timestampMs) {
  if (!lastTimestamp) lastTimestamp = timestampMs;
  let dt = timestampMs - lastTimestamp;
  dt = Math.min(dt, 100); // Cap at 100ms to prevent tab-switch exploits
  lastTimestamp = timestampMs;

  // 1. Continuous Animation Update (Lap Progress)
  if (state.runtime.lapActive && !state.runtime.pitStopActive) {
    const elapsed = timestampMs - state.runtime.lapStartTime;
    state.runtime.lapProgress = Math.min(
      1,
      elapsed / state.runtime.expectedLapDurationMs,
    );

    AudioEngine.setRPM(state.runtime.lapProgress);
    EventBus.emit("lap:progress", { progress: state.runtime.lapProgress });

    if (
      state.runtime.pitStopsScheduled &&
      state.runtime.pitStopsScheduled.length > 0
    ) {
      const nextPitStopAt = state.runtime.pitStopsScheduled[0];
      const timeRemainingMs = (nextPitStopAt - state.runtime.lapProgress) * state.runtime.expectedLapDurationMs;

      // 2.5s before pit stop: fire radio alert once per stop
      if (timeRemainingMs <= 2500 && timeRemainingMs > 0 && !state.runtime.pitRadioAlertSent) {
        state.runtime.pitRadioAlertSent = true;
        EventBus.emit("pitstop:radio_alert", { timeRemainingMs });
      }

      if (state.runtime.lapProgress >= nextPitStopAt) {
        state.runtime.pitStopsScheduled.shift();
        state.runtime.pitRadioAlertSent = false;
        AudioEngine.stop();
        triggerPitStop();
        // Pause visually right at the pit stop point
        state.runtime.lapStartTime =
          timestampMs - state.runtime.expectedLapDurationMs * nextPitStopAt;
      }
    }
    
    if (state.runtime.lapProgress >= 1 && !state.runtime.pitStopActive) {
      completeLap();
    }
  } else if (state.runtime.pitStopActive) {
    // Shift start time forward to pause progress
    state.runtime.lapStartTime += dt;
  }

  rafId = requestAnimationFrame(rafLoop);
}

/**
 * Periodic logic for automation and autosave.
 */
function simulationTick(dt) {
  EventBus.emit("simulation:tick", { dt });
}

/**
 * Boots the game loop.
 * @param {Object} gameState - the canonical state.
 */
export function startGameLoop(gameState) {
  state = gameState;
  // Add runtime state object
  state.runtime = {
    lapActive: false,
    lapStartTime: 0,
    baseLapDurationMs: 0,
    expectedLapDurationMs: 0,
    lapProgress: 0,
    pitStopActive: false,
    pitRadioAlertSent: false,
    pitStopsScheduled: [],
  };

  EventBus.on("pitstop:exit_completed", () => {
    // Only re-anchor and resume progress after the pit exit animation finishes
    const now = performance.now();
    // Clamp progress so pit stop can never immediately terminate the lap
    state.runtime.lapProgress = Math.min(0.88, state.runtime.lapProgress);
    state.runtime.lapStartTime = now - (state.runtime.lapProgress * state.runtime.expectedLapDurationMs);
  });

  lastTimestamp = performance.now();
  rafId = requestAnimationFrame(rafLoop);

  if (logicIntervalId) clearInterval(logicIntervalId);
  logicIntervalId = setInterval(() => {
    simulationTick(CONSTANTS.TICK_INTERVAL_MS);
  }, CONSTANTS.TICK_INTERVAL_MS);
}
