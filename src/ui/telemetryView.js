import { EventBus } from "../utils/eventBus.js";
import { formatTime, formatCredits } from "../utils/formatNumber.js";
import { startManualLap } from "../systems/gameLoop.js";
import { AudioCues } from "../audio/audioManager.js";
import { createNumberPopup } from "../fx/numberPopups.js";
import { createParticleBurst } from "../fx/particleSystem.js";

let telemetryContainer;
let lapTimeDisplay;
let creditsDisplay;
let startButton;

let currentLapStartMs = 0;
let isLapping = false;

export function initTelemetryView(container, state) {
  telemetryContainer = container;

  telemetryContainer.innerHTML = `
        <div class="telemetry-panel">
            <div class="telemetry-data">
                <div class="data-block">
                    <span class="label">CREDITS</span>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="value monospace" id="credits-readout">${formatCredits(state.economy.credits)}</span>
                        <button id="cheat-btn" style="background: var(--bg-surface); border: 1px solid var(--accent-sector); color: var(--accent-sector); padding: 2px 6px; border-radius: 4px; font-size: 10px; cursor: pointer;">+$1M</button>
                    </div>
                </div>
                <div class="data-block">
                    <span class="label">LAP TIME</span>
                    <span class="value monospace" id="lap-time-readout">--:--.---</span>
                </div>
            </div>
            <button id="start-lap-btn" class="primary-btn">START LAP</button>
        </div>
    `;

  creditsDisplay = document.getElementById("credits-readout");
  lapTimeDisplay = document.getElementById("lap-time-readout");
  startButton = document.getElementById("start-lap-btn");

  startButton.addEventListener("click", () => {
    AudioCues.buttonClick();
    startManualLap();
  });

  document.getElementById("cheat-btn").addEventListener("click", () => {
    if (window.Game && window.Game.debug) {
      window.Game.debug.addCredits(1000000);
    } else {
      // Fallback if debug panel isn't ready
      state.economy.credits += 1000000;
      EventBus.emit("credits:changed", { total: state.economy.credits });
    }
  });

  EventBus.on("lap:started", handleLapStarted);
  EventBus.on("lap:progress", handleLapProgress);
  EventBus.on("lap:completed", handleLapCompleted);
  EventBus.on("credits:changed", handleCreditsChanged);
}

function handleLapStarted({ expectedDurationMs }) {
  isLapping = true;
  currentLapStartMs = performance.now();
  startButton.disabled = true;
  startButton.classList.add("active");
  AudioCues.startLap();
}

function handleLapProgress({ progress }) {
  if (!isLapping) return;
  const elapsed = performance.now() - currentLapStartMs;
  lapTimeDisplay.textContent = formatTime(elapsed);
}

function handleLapCompleted({ lapTimeMs, profit, isPersonalBest }) {
  isLapping = false;
  lapTimeDisplay.textContent = formatTime(lapTimeMs);
  startButton.disabled = false;
  startButton.classList.remove("active");

  if (isPersonalBest) {
    AudioCues.personalBest();

    // Burst particles at lap time display
    const rect = lapTimeDisplay.getBoundingClientRect();
    createParticleBurst(
      rect.left + rect.width / 2,
      rect.top + rect.height / 2,
      40,
      ["#B26BFF", "#F5F7FA"],
    );

    lapTimeDisplay.style.color = "var(--accent-sector)";
    setTimeout(() => (lapTimeDisplay.style.color = ""), 2000);
  } else {
    AudioCues.lapComplete();
  }

  // Floating text for profit
  const creditsRect = creditsDisplay.getBoundingClientRect();
  createNumberPopup(
    `+${formatCredits(profit)}`,
    creditsRect.left + creditsRect.width / 2,
    creditsRect.top,
  );
  AudioCues.creditsIncrease();
}

function handleCreditsChanged({ total }) {
  creditsDisplay.textContent = formatCredits(total);
}
