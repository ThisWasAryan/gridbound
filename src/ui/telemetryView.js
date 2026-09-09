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

  EventBus.on("lap:started", handleLapStarted);
  EventBus.on("lap:progress", handleLapProgress);
  EventBus.on("lap:completed", handleLapCompleted);
  EventBus.on("credits:changed", handleCreditsChanged);
  EventBus.on("track:switched", resetReadout);
  EventBus.on("car:switched", resetReadout);
}

function resetReadout() {
  if (!isLapping) {
    lapTimeDisplay.textContent = "--:--.---";
    lapTimeDisplay.style.color = "";
  }
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

function handleLapCompleted({ lapTimeMs, profit, isPersonalBest, pitMultiplier, pitColor }) {
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
  
  let popupText = `+${formatCredits(profit)}`;
  if (pitMultiplier > 1) {
    popupText += ` (${pitMultiplier}x)`;
  } else if (pitMultiplier === 0) {
    popupText = `+0 (BAD PIT)`;
  }

  createNumberPopup(
    popupText,
    creditsRect.left + creditsRect.width / 2,
    creditsRect.top,
    pitColor
  );
  AudioCues.creditsIncrease();
}

function handleCreditsChanged({ total }) {
  creditsDisplay.textContent = formatCredits(total);
}
