import { CONSTANTS } from '../config/constants.js';
import { TRACKS_CONFIG } from '../config/tracks.config.js';
import { EventBus } from '../utils/eventBus.js';
import { saveGame } from '../state/saveLoad.js';
import { calculateLapDurationMs } from './lapSystem.js';
import { triggerPitStop } from './pitStopSystem.js';

let lastTimestamp = 0;
let accumulatedMs = 0;
let rafId = null;

// The game state reference injected on boot
let state;

/**
 * Starts a manual lap.
 */
export function startManualLap() {
    if (state.runtime.lapActive) return;
    
    const expectedDurationMs = calculateLapDurationMs(state);
    
    state.runtime.lapActive = true;
    state.runtime.lapStartTime = performance.now();
    state.runtime.expectedLapDurationMs = expectedDurationMs;
    state.runtime.lapProgress = 0;
    
    EventBus.emit('lap:started', { expectedDurationMs });
}

/**
 * Handles lap completion logic.
 */
function completeLap() {
    state.runtime.lapActive = false;
    state.runtime.lapProgress = 1;
    
    const trackDef = TRACKS_CONFIG[state.session.currentTrackId];
    const profit = Math.round(CONSTANTS.BASE_LAP_PROFIT * trackDef.profitMultiplier);
    const lapTimeMs = state.runtime.expectedLapDurationMs;
    
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
    
    EventBus.emit('lap:completed', { lapTimeMs, profit, isPersonalBest, previousBest });
}

/**
 * The main rAF loop for continuous animation and driving simulation ticks.
 */
function rafLoop(timestampMs) {
    if (!lastTimestamp) lastTimestamp = timestampMs;
    const dt = timestampMs - lastTimestamp;
    lastTimestamp = timestampMs;
    
    // 1. Continuous Animation Update (Lap Progress)
    if (state.runtime.lapActive && !state.runtime.pitStopActive) {
        const elapsed = timestampMs - state.runtime.lapStartTime;
        state.runtime.lapProgress = Math.min(1, elapsed / state.runtime.expectedLapDurationMs);
        
        EventBus.emit('lap:progress', { progress: state.runtime.lapProgress });
        
        if (state.runtime.pitStopScheduled && !state.runtime.pitStopTriggered && state.runtime.lapProgress >= 0.9) {
            triggerPitStop();
            // Reset lapStartTime so it pauses visually
            state.runtime.lapStartTime = timestampMs - (state.runtime.expectedLapDurationMs * 0.9);
        } else if (state.runtime.lapProgress >= 1) {
            completeLap();
        }
    } else if (state.runtime.pitStopActive) {
        // Shift start time forward to pause progress
        state.runtime.lapStartTime += dt;
    }
    
    // 2. Coarse Simulation Tick
    accumulatedMs += dt;
    if (accumulatedMs >= CONSTANTS.TICK_INTERVAL_MS) {
        simulationTick(accumulatedMs);
        accumulatedMs = 0;
    }
    
    rafId = requestAnimationFrame(rafLoop);
}

/**
 * Periodic logic for automation and autosave.
 */
function simulationTick(dt) {
    // Phase 9+ will put automation logic here.
    // For now, it's just a placeholder tick.
    EventBus.emit('simulation:tick', { dt });
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
        expectedLapDurationMs: 0,
        lapProgress: 0,
        pitStopActive: false,
        pitStopScheduled: false,
        pitStopTriggered: false
    };
    
    lastTimestamp = performance.now();
    rafId = requestAnimationFrame(rafLoop);
}
