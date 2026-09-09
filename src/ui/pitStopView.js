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
let stateRef;

export function initPitStopView(container, state) {
  stateRef = state;
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

  // Adjust zones based on pit crew level (0 to max)
  const level = stateRef.team.pitCrewLevel || 0;
  
  // Base perfect size is 4% (48 to 52). Each level adds 0.5%, up to a max of 20%
  let perfectWidth = Math.min(20, 4 + level * 0.5); 
  // Base good size is 20% (40 to 60). Each level adds 1.0%, up to a max of 60%
  let goodWidth = Math.min(60, 20 + level * 1.0); 

  stateRef.pitStopBounds = {
    perfectStart: 50 - perfectWidth / 2,
    perfectEnd: 50 + perfectWidth / 2,
    goodStart: 50 - goodWidth / 2,
    goodEnd: 50 + goodWidth / 2,
  };

  // Adjust DOM elements in pitstop-slider
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

  let quality = "BAD";
  if (stateRef.pitStopBounds) {
    if (cursorPosition >= stateRef.pitStopBounds.perfectStart && cursorPosition <= stateRef.pitStopBounds.perfectEnd) {
      quality = "PERFECT";
    } else if (cursorPosition >= stateRef.pitStopBounds.goodStart && cursorPosition <= stateRef.pitStopBounds.goodEnd) {
      quality = "GOOD";
    }
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
