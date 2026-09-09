import { EventBus } from '../utils/eventBus.js';
import { formatTime, formatCredits } from '../utils/formatNumber.js';
import { startManualLap } from '../systems/gameLoop.js';

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
                    <span class="value monospace" id="credits-readout">${formatCredits(state.economy.credits)}</span>
                </div>
                <div class="data-block">
                    <span class="label">LAP TIME</span>
                    <span class="value monospace" id="lap-time-readout">--:--.---</span>
                </div>
            </div>
            <button id="start-lap-btn" class="primary-btn">START LAP</button>
        </div>
    `;
    
    creditsDisplay = document.getElementById('credits-readout');
    lapTimeDisplay = document.getElementById('lap-time-readout');
    startButton = document.getElementById('start-lap-btn');
    
    startButton.addEventListener('click', () => {
        startManualLap();
    });
    
    EventBus.on('lap:started', handleLapStarted);
    EventBus.on('lap:progress', handleLapProgress);
    EventBus.on('lap:completed', handleLapCompleted);
    EventBus.on('credits:changed', handleCreditsChanged);
}

function handleLapStarted({ expectedDurationMs }) {
    isLapping = true;
    currentLapStartMs = performance.now();
    startButton.disabled = true;
    startButton.classList.add('active');
}

function handleLapProgress({ progress }) {
    if (!isLapping) return;
    const elapsed = performance.now() - currentLapStartMs;
    lapTimeDisplay.textContent = formatTime(elapsed);
}

function handleLapCompleted({ lapTimeMs, profit }) {
    isLapping = false;
    lapTimeDisplay.textContent = formatTime(lapTimeMs);
    startButton.disabled = false;
    startButton.classList.remove('active');
    
    // Manually fire credits changed since we don't have a robust event for it yet, 
    // or rely on gameLoop emitting it (will fix in a moment).
    // Let's assume we update it here for now directly, but ideally via 'credits:changed'.
}

function handleCreditsChanged({ total }) {
    creditsDisplay.textContent = formatCredits(total);
}
