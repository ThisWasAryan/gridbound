import { EventBus } from "../utils/eventBus.js";
import { AudioEngine } from "../audio/audioManager.js";

let state;

export function initPitStopSystem(gameState) {
  state = gameState;

  EventBus.on("lap:started", () => {
    const trackId = state.session.currentTrackId;
    let numStops = 1;
    if (trackId === "karting") numStops = 1;
    else if (["buddh", "monza"].includes(trackId)) numStops = 2;
    else if (["silverstone", "spa"].includes(trackId)) numStops = 3;
    else if (trackId === "monaco") numStops = 4;

    state.runtime.pitStopsScheduled = [];
    state.runtime.pitRadioAlertSent = false;
    if (numStops > 0) {
      let attempts = 0;
      while (state.runtime.pitStopsScheduled.length < numStops && attempts < 100) {
        attempts++;
        // Keep candidate between 18% and 72% so at least 28% of lap remains after the last stop
        const candidate = 0.18 + Math.random() * 0.54;
        
        // Ensure it is at least 22% away from any other scheduled stop
        let isValid = true;
        for (const existing of state.runtime.pitStopsScheduled) {
          if (Math.abs(existing - candidate) < 0.22) {
            isValid = false;
            break;
          }
        }
        
        if (isValid) {
          state.runtime.pitStopsScheduled.push(candidate);
        }
      }
      // Sort them chronologically
      state.runtime.pitStopsScheduled.sort((a, b) => a - b);
    }
  });
}

export function triggerPitStop() {
  state.runtime.pitStopActive = true;
  EventBus.emit("pitstop:active");
}

export function resolvePitStop(quality) {
  // Keep pitStopActive = true while pit exit animation & tire change plays
  state.runtime.lastPitStopQuality = quality;

  const pitCrewLevel = state.team.pitCrewLevel || 0;
  // Pit crew gives flat 150ms reduction per level per stop
  const reduction = pitCrewLevel * 150;

  let modifier = 0;
  if (quality === "PERFECT") {
    modifier = -0.12;
  } else if (quality === "BAD") {
    modifier = 0.15;
  }

  const baseDuration = state.runtime.baseLapDurationMs || state.runtime.expectedLapDurationMs;
  const timeChange = (state.runtime.expectedLapDurationMs * modifier) - reduction;
  
  // Safe floor: Never reduce expected lap duration below 65% of the base lap duration or 1800ms
  const safeFloorMs = Math.max(1800, baseDuration * 0.65);
  state.runtime.expectedLapDurationMs = Math.max(safeFloorMs, state.runtime.expectedLapDurationMs + timeChange);

  EventBus.emit("pitstop:resolved", { quality, timeChange });
}

export function completePitStopExit() {
  if (!state.runtime.pitStopActive) return;
  state.runtime.pitStopActive = false;
  AudioEngine.start();
  EventBus.emit("pitstop:exit_completed");
}
