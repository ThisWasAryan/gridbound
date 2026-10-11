import { EventBus } from "../utils/eventBus.js";
import { resolvePitStop, completePitStopExit } from "../systems/pitStopSystem.js";
import { AudioCues } from "../audio/audioManager.js";

let pitStopOverlay;
let radioBanner;
let sliderBar;
let sliderCursor;
let actionBtn;
let timerText;
let timerFill;
let tireFL;
let tireFR;
let tireRL;
let tireRR;

let isActive = false;
let animationId;
let cursorPosition = 0;
let cursorDirection = 1;
let speed = 2.4;
let stateRef;

// 5-second countdown timer
const MAX_TIME_MS = 5000;
let miniGameStartTime = 0;
let radioTimeoutId = null;
let resolveTimeoutId = null;

export function initPitStopView(container, state) {
  stateRef = state;

  // 1. Radio Alert Banner
  radioBanner = document.createElement("div");
  radioBanner.id = "f1-radio-banner";
  radioBanner.className = "f1-radio-banner hidden";
  radioBanner.innerHTML = `
    <div class="radio-tag">
      <span class="radio-icon">📻</span>
      <span class="radio-team">PIT WALL</span>
    </div>
    <div class="radio-msg">"BOX, BOX, BOX, BOX"</div>
    <div class="radio-waveform">
      <span></span><span></span><span></span><span></span>
    </div>
  `;
  container.appendChild(radioBanner);

  // 2. Pit Stop Overlay & Modal
  pitStopOverlay = document.createElement("div");
  pitStopOverlay.id = "pitstop-overlay";
  pitStopOverlay.className = "pitstop-overlay hidden";

  pitStopOverlay.innerHTML = `
    <div class="pitstop-modal">
      <div class="pit-badge">F1 PIT LANE // SPEED LIMITER 80 KM/H</div>
      <h2 id="pit-modal-header">BOX BOX BOX</h2>
      
      <!-- 5-Second Time Crunch Countdown -->
      <div class="pit-countdown-wrapper">
        <div class="pit-countdown-meta">
          <span class="countdown-label">TIME REMAINING</span>
          <span class="countdown-clock monospace" id="pit-timer-text">5.00s</span>
        </div>
        <div class="pit-countdown-track">
          <div class="pit-countdown-fill" id="pit-timer-fill"></div>
        </div>
      </div>

      <!-- 4-Tire Crew HUD -->
      <div class="pit-tires-grid">
        <div class="tire-node" id="tire-fl">
          <span class="tire-pos">FL</span>
          <span class="tire-status">READY</span>
        </div>
        <div class="tire-node" id="tire-fr">
          <span class="tire-pos">FR</span>
          <span class="tire-status">READY</span>
        </div>
        <div class="tire-node" id="tire-rl">
          <span class="tire-pos">RL</span>
          <span class="tire-status">READY</span>
        </div>
        <div class="tire-node" id="tire-rr">
          <span class="tire-pos">RR</span>
          <span class="tire-status">READY</span>
        </div>
      </div>

      <p class="pit-instructions">Press <strong>[SPACE]</strong> or click <strong>PIT</strong> when the indicator enters the target zone!</p>

      <!-- Alignment Slider -->
      <div class="slider-container" id="pitstop-slider">
        <div class="zone bad-zone-left"></div>
        <div class="zone good-zone-left"></div>
        <div class="zone perfect-zone"></div>
        <div class="zone good-zone-right"></div>
        <div class="zone bad-zone-right"></div>
        <div class="slider-center-notch"></div>
        <div class="slider-cursor" id="pitstop-cursor"></div>
      </div>

      <!-- Actions -->
      <div class="pitstop-actions">
        <button id="pitstop-action-btn" class="primary-btn pit-submit-btn">
          <span>PIT</span>
          <span class="key-badge">SPACE</span>
        </button>
      </div>
    </div>
  `;

  container.appendChild(pitStopOverlay);

  sliderBar = document.getElementById("pitstop-slider");
  sliderCursor = document.getElementById("pitstop-cursor");
  actionBtn = document.getElementById("pitstop-action-btn");
  timerText = document.getElementById("pit-timer-text");
  timerFill = document.getElementById("pit-timer-fill");
  tireFL = document.getElementById("tire-fl");
  tireFR = document.getElementById("tire-fr");
  tireRL = document.getElementById("tire-rl");
  tireRR = document.getElementById("tire-rr");

  actionBtn.addEventListener("click", () => {
    AudioCues.buttonClick();
    handleActionClick();
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isActive) {
      e.preventDefault();
      handleActionClick();
    }
  });

  EventBus.on("pitstop:radio_alert", showRadioAlert);
  EventBus.on("pitstop:active", startMiniGame);
  EventBus.on("pitstop:resolved", handleResolvedVisuals);
  EventBus.on("lap:aborted", resetPitStop);
}

function showRadioAlert() {
  AudioCues.radioBox();
  radioBanner.classList.remove("hidden");
  radioBanner.classList.add("visible");

  if (radioTimeoutId) clearTimeout(radioTimeoutId);
  radioTimeoutId = setTimeout(() => {
    radioBanner.classList.remove("visible");
    setTimeout(() => radioBanner.classList.add("hidden"), 300);
  }, 2400);
}

function startMiniGame() {
  // Dismiss radio banner if still showing
  if (radioBanner) {
    radioBanner.classList.remove("visible");
    radioBanner.classList.add("hidden");
  }

  // Hide any onboarding tutorial modals
  const obOverlay = document.getElementById("onboarding-overlay");
  if (obOverlay) obOverlay.classList.add("hidden");

  if (resolveTimeoutId) clearTimeout(resolveTimeoutId);

  isActive = true;
  AudioCues.pitStopStart();
  pitStopOverlay.classList.remove("hidden");

  // Reset text and tire statuses
  const header = document.getElementById("pit-modal-header");
  if (header) {
    header.textContent = "BOX BOX BOX";
    header.className = "";
  }

  resetTireNodes();

  cursorPosition = 0;
  cursorDirection = 1;
  speed = 2.2 + Math.random() * 0.8;
  miniGameStartTime = performance.now();

  // Adjust zones based on pit crew level (0 to max)
  const level = stateRef.team.pitCrewLevel || 0;
  let perfectWidth = Math.min(22, 5 + level * 0.6);
  let goodWidth = Math.min(65, 22 + level * 1.2);

  stateRef.pitStopBounds = {
    perfectStart: 50 - perfectWidth / 2,
    perfectEnd: 50 + perfectWidth / 2,
    goodStart: 50 - goodWidth / 2,
    goodEnd: 50 + goodWidth / 2,
  };

  const perfectZone = pitStopOverlay.querySelector(".perfect-zone");
  const goodZoneLeft = pitStopOverlay.querySelector(".good-zone-left");
  const goodZoneRight = pitStopOverlay.querySelector(".good-zone-right");
  const badZoneLeft = pitStopOverlay.querySelector(".bad-zone-left");
  const badZoneRight = pitStopOverlay.querySelector(".bad-zone-right");

  badZoneLeft.style.width = `${stateRef.pitStopBounds.goodStart}%`;
  goodZoneLeft.style.left = `${stateRef.pitStopBounds.goodStart}%`;
  goodZoneLeft.style.width = `${stateRef.pitStopBounds.perfectStart - stateRef.pitStopBounds.goodStart}%`;

  perfectZone.style.left = `${stateRef.pitStopBounds.perfectStart}%`;
  perfectZone.style.width = `${perfectWidth}%`;

  goodZoneRight.style.left = `${stateRef.pitStopBounds.perfectEnd}%`;
  goodZoneRight.style.width = `${stateRef.pitStopBounds.goodEnd - stateRef.pitStopBounds.perfectEnd}%`;

  badZoneRight.style.left = `${stateRef.pitStopBounds.goodEnd}%`;
  badZoneRight.style.width = `${100 - stateRef.pitStopBounds.goodEnd}%`;

  lastFrameTime = performance.now();
  animationId = requestAnimationFrame(animateSliderAndCountdown);
}

let lastFrameTime = 0;
function animateSliderAndCountdown(time) {
  if (!isActive) return;

  const dt = (time - lastFrameTime) / 16.66;
  lastFrameTime = time;

  // 1. Move Cursor
  cursorPosition += cursorDirection * speed * dt;
  if (cursorPosition > 100) {
    cursorPosition = 100;
    cursorDirection = -1;
  } else if (cursorPosition < 0) {
    cursorPosition = 0;
    cursorDirection = 1;
  }
  sliderCursor.style.left = `${cursorPosition}%`;

  // 2. Countdown Timer (5.00s)
  const elapsed = time - miniGameStartTime;
  const remainingMs = Math.max(0, MAX_TIME_MS - elapsed);
  const remainingSec = (remainingMs / 1000).toFixed(2);
  timerText.textContent = `${remainingSec}s`;

  const progressRatio = Math.max(0, remainingMs / MAX_TIME_MS);
  timerFill.style.width = `${(progressRatio * 100).toFixed(1)}%`;

  if (progressRatio < 0.3) {
    timerFill.style.backgroundColor = "var(--accent-primary)";
    timerText.style.color = "var(--accent-primary)";
  } else if (progressRatio < 0.6) {
    timerFill.style.backgroundColor = "var(--accent-caution)";
    timerText.style.color = "var(--accent-caution)";
  } else {
    timerFill.style.backgroundColor = "#00ffaa";
    timerText.style.color = "var(--text-data)";
  }

  // 3. Auto-Bad if time runs out
  if (remainingMs <= 0) {
    handleTimeExpired();
    return;
  }

  animationId = requestAnimationFrame(animateSliderAndCountdown);
}

function handleTimeExpired() {
  if (!isActive) return;
  isActive = false;
  cancelAnimationFrame(animationId);
  resolvePitStop("BAD");
}

function handleActionClick() {
  if (!isActive) return;
  isActive = false;
  cancelAnimationFrame(animationId);

  let quality = "BAD";
  if (stateRef.pitStopBounds) {
    if (
      cursorPosition >= stateRef.pitStopBounds.perfectStart &&
      cursorPosition <= stateRef.pitStopBounds.perfectEnd
    ) {
      quality = "PERFECT";
    } else if (
      cursorPosition >= stateRef.pitStopBounds.goodStart &&
      cursorPosition <= stateRef.pitStopBounds.goodEnd
    ) {
      quality = "GOOD";
    }
  }

  resolvePitStop(quality);
}

function resetTireNodes() {
  const nodes = [tireFL, tireFR, tireRL, tireRR];
  nodes.forEach((n) => {
    if (n) {
      n.className = "tire-node";
      const statusSpan = n.querySelector(".tire-status");
      if (statusSpan) statusSpan.textContent = "CHANGING...";
    }
  });
}

function animateTires(quality) {
  const nodes = [
    { el: tireFL, delay: 0 },
    { el: tireFR, delay: quality === "PERFECT" ? 140 : 180 },
    { el: tireRL, delay: quality === "PERFECT" ? 280 : 360 },
    { el: tireRR, delay: quality === "PERFECT" ? 420 : 540 },
  ];

  nodes.forEach(({ el, delay }) => {
    if (!el) return;
    el.classList.add("active");
    setTimeout(() => {
      el.classList.remove("active");
      if (quality === "BAD" && (el === tireRL || el === tireRR)) {
        el.classList.add("jammed");
        const statusSpan = el.querySelector(".tire-status");
        if (statusSpan) statusSpan.textContent = "NUT JAM!";
      } else {
        el.classList.add("fitted");
        const statusSpan = el.querySelector(".tire-status");
        if (statusSpan) statusSpan.textContent = "FITTED 🟢";
      }
    }, delay + 180);
  });
}

function handleResolvedVisuals({ quality }) {
  isActive = false;

  // Sound cues with 4-tire air-gun sequence
  if (quality === "PERFECT") AudioCues.pitStopPerfect();
  else if (quality === "GOOD") AudioCues.pitStopGood();
  else AudioCues.pitStopBad();

  // Animate 4 tires
  animateTires(quality);

  const header = document.getElementById("pit-modal-header");
  if (header) {
    if (quality === "PERFECT") {
      header.textContent = "1.9s PERFECT STOP!";
      header.className = "quality-perfect";
    } else if (quality === "GOOD") {
      header.textContent = "2.4s GOOD STOP!";
      header.className = "quality-good";
    } else {
      header.textContent = "4.6s SLOW STOP!";
      header.className = "quality-bad";
    }
  }

  // Allow the full pneumatic audio and jack drop animation to complete (1.2s)
  resolveTimeoutId = setTimeout(() => {
    pitStopOverlay.classList.add("hidden");
    if (header) header.textContent = "BOX BOX BOX";
    // Car now smoothly departs pit box onto raceline
    completePitStopExit();
  }, 1200);
}

function resetPitStop() {
  isActive = false;
  cancelAnimationFrame(animationId);
  if (resolveTimeoutId) clearTimeout(resolveTimeoutId);
  pitStopOverlay.classList.add("hidden");
  if (radioBanner) {
    radioBanner.classList.remove("visible");
    radioBanner.classList.add("hidden");
  }
}
