import { EventBus } from "../utils/eventBus.js";
import { PRINCIPALS } from "../config/principals.config.js";
import { saveGame } from "../state/saveLoad.js";
import { startManualLap } from "./gameLoop.js";
import { resolvePitStop } from "./pitStopSystem.js";

let stateRef = null;

export function initPrincipalSystem(state) {
  stateRef = state;

  EventBus.on("lap:completed", handleAutoLap);
  EventBus.on("pitstop:active", handleAutoPitStop);
  EventBus.on("track:switched", () => toggleAutomation(false));
  EventBus.on("car:switched", () => toggleAutomation(false));
}

export function hirePrincipal(principalId) {
  const principal = PRINCIPALS[principalId];
  if (!principal) return false;
  if (stateRef.principals.hiredIds.includes(principalId)) return false;

  if (stateRef.economy.credits >= principal.cost) {
    stateRef.economy.credits -= principal.cost;
    stateRef.principals.hiredIds.push(principalId);

    // Auto-activate the highest tier principal
    stateRef.principals.activeId = principalId;
    stateRef.principals.automationEnabled = true;

    saveGame(stateRef);
    EventBus.emit("credits:changed", { total: stateRef.economy.credits });
    EventBus.emit("principal:hired", { id: principalId });

    // Kickstart lap if idle
    if (!stateRef.runtime.lapActive) {
      handleAutoLap();
    }

    return true;
  }
  return false;
}

export function toggleAutomation(enabled) {
  stateRef.principals.automationEnabled = enabled;
  saveGame(stateRef);
  EventBus.emit("automation:toggled", { enabled });

  if (enabled && !stateRef.runtime.lapActive) {
    handleAutoLap();
  }
}

function handleAutoLap() {
  if (!stateRef.principals.automationEnabled) return;
  if (!stateRef.principals.activeId) return;

  const principal = PRINCIPALS[stateRef.principals.activeId];
  if (principal && principal.autoLaps) {
    // Start lap after a small delay to simulate human/UI pause
    setTimeout(() => {
      if (!stateRef.runtime.lapActive && !stateRef.runtime.pitStopActive) {
        startManualLap();
      }
    }, 500);
  }
}

function handleAutoPitStop() {
  if (!stateRef.principals.automationEnabled) return;
  if (!stateRef.principals.activeId) return;

  const principal = PRINCIPALS[stateRef.principals.activeId];
  if (principal && principal.autoPit) {
    setTimeout(() => {
      if (stateRef.runtime.pitStopActive) {
        // Auto-perfect pit stop
        resolvePitStop("PERFECT");
      }
    }, 1000); // 1 second delay before perfect pitstop
  }
}
