import { EventBus } from "../utils/eventBus.js";
import { resolvePitStop } from "../systems/pitStopSystem.js";

let pitStopOverlay;
let sliderBar;
let sliderCursor;
let actionBtn;
let ignoreBtn;
let isActive = false;

let animationId;
let cursorPosition = 0;
let cursorDirection = 1;
let speed = 2; // speed of the cursor

export function initPitStopView(container) {
  // Create UI elements
  pitStopOverlay = document.createElement("div");
  pitStopOverlay.className = "pitstop-overlay hidden";

  pitStopOverlay.innerHTML = `
        <div class="pitstop-modal">
            <h2>BOX BOX BOX</h2>
            <p>Press SPACE or click PIT when the cursor is in the center!</p>
            <div class="slider-container" id="pitstop-slider">
                <div class="zone bad-zone-left"></div>
                <div class="zone good-zone-left"></div>
                <div class="zone perfect-zone"></div>
                <div class="zone good-zone-right"></div>
                <div class="zone bad-zone-right"></div>
                <div class="slider-cursor" id="pitstop-cursor"></div>
            </div>
            <div class="pitstop-actions" style="display: flex; gap: 10px; justify-content: center; margin-top: 15px;">
                <button id="pitstop-ignore-btn" class="secondary-btn" style="background: transparent; border: 1px solid var(--text-muted); color: var(--text-muted); padding: 10px 20px; cursor: pointer;">IGNORE</button>
                <button id="pitstop-action-btn" class="primary-btn">PIT</button>
            </div>
        </div>
    `;

  container.appendChild(pitStopOverlay);

  sliderBar = document.getElementById("pitstop-slider");
  sliderCursor = document.getElementById("pitstop-cursor");
  actionBtn = document.getElementById("pitstop-action-btn");
  ignoreBtn = document.getElementById("pitstop-ignore-btn");

  actionBtn.addEventListener("click", handleActionClick);
  ignoreBtn.addEventListener("click", () => {
    if (isActive) {
      resolvePitStop("BAD"); // ignoring results in BAD pitstop by default
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && isActive) {
      e.preventDefault();
      handleActionClick();
    }
  });

  EventBus.on("pitstop:active", startMiniGame);
  EventBus.on("pitstop:resolved", hideMiniGame);
}

function startMiniGame() {
  isActive = true;
  pitStopOverlay.classList.remove("hidden");
  cursorPosition = 0;
  cursorDirection = 1;
  speed = 2 + Math.random(); // Add some variance

  lastTime = performance.now();
  animationId = requestAnimationFrame(animateSlider);
}

let lastTime = 0;
function animateSlider(time) {
  const dt = (time - lastTime) / 16.66;
  lastTime = time;

  cursorPosition += cursorDirection * speed * dt;

  if (cursorPosition > 100) {
    cursorPosition = 100;
    cursorDirection = -1;
  } else if (cursorPosition < 0) {
    cursorPosition = 0;
    cursorDirection = 1;
  }

  sliderCursor.style.left = `${cursorPosition}%`;

  animationId = requestAnimationFrame(animateSlider);
}

function handleActionClick() {
  if (!isActive) return;
  isActive = false;
  cancelAnimationFrame(animationId);

  // Evaluate cursor position (0 to 100)
  // Perfect: 45 to 55
  // Good: 30 to 45, 55 to 70
  // Bad: < 30, > 70

  let quality = "BAD";
  if (cursorPosition >= 45 && cursorPosition <= 55) {
    quality = "PERFECT";
  } else if (cursorPosition >= 30 && cursorPosition <= 70) {
    quality = "GOOD";
  }

  resolvePitStop(quality);
}

function hideMiniGame({ quality }) {
  isActive = false;
  // Briefly show quality before hiding
  const header = pitStopOverlay.querySelector("h2");
  header.textContent = `${quality} STOP!`;

  setTimeout(() => {
    pitStopOverlay.classList.add("hidden");
    header.textContent = "BOX BOX BOX"; // reset
  }, 1000);
}
