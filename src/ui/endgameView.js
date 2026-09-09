import { EventBus } from "../utils/eventBus.js";
import { createParticleBurst } from "../fx/particleSystem.js";

let endgameOverlay;
let hasTriggered = false;

export function initEndgameView() {
  endgameOverlay = document.createElement("div");
  endgameOverlay.className = "endgame-overlay hidden";
  endgameOverlay.innerHTML = `
    <div class="endgame-modal">
        <h1>YOU ARE A WORLD CHAMPION</h1>
        <p>You have conquered the pinnacle of motorsport in Formula 1.</p>
        <p>The Gridbound journey is complete, but you can continue racing to set new lap records!</p>
        <button id="endgame-continue-btn" class="primary-btn">KEEP RACING</button>
    </div>
  `;
  document.body.appendChild(endgameOverlay);

  document.getElementById("endgame-continue-btn").addEventListener("click", () => {
    endgameOverlay.classList.add("hidden");
  });

  EventBus.on("lap:completed", checkEndgame);
}

function checkEndgame(payload) {
  if (hasTriggered) return;
  // payload has state
  if (payload.state && payload.state.session.currentCarId === "f1") {
    hasTriggered = true;
    showEndgame();
  }
}

function showEndgame() {
  endgameOverlay.classList.remove("hidden");

  // Celebration particle bursts
  const cx = window.innerWidth / 2;
  const cy = window.innerHeight / 2;
  createParticleBurst(cx - 120, cy - 40, 40, ["#ffd700", "#ffffff", "#B26BFF"]);
  createParticleBurst(cx + 120, cy - 40, 40, ["#ffd700", "#ffffff", "#B26BFF"]);
  // Staggered secondary bursts
  setTimeout(() => createParticleBurst(cx, cy - 80, 30, ["#ffd700", "#E63946"]), 300);
  setTimeout(() => createParticleBurst(cx - 60, cy + 40, 25, ["#38bdf8", "#ffd700"]), 600);
  setTimeout(() => createParticleBurst(cx + 60, cy + 40, 25, ["#38bdf8", "#ffd700"]), 600);
}

