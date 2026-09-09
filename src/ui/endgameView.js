import { EventBus } from "../utils/eventBus.js";

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
  // Some fun particle bursts
  const center = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  EventBus.emit("fx:burst", { x: center.x - 100, y: center.y, count: 50, colors: ["#ffd700", "#ffffff"] });
  EventBus.emit("fx:burst", { x: center.x + 100, y: center.y, count: 50, colors: ["#ffd700", "#ffffff"] });
}
