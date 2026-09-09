import { initTrackView } from "./trackView.js";
import { initTelemetryView } from "./telemetryView.js";
import { initShopView } from "./shopView.js";
import { initPitStopView } from "./pitStopView.js";
import { initOnboardingView } from "./onboardingView.js";
import { initAchievementView } from "./achievementView.js";
import { initEndgameView } from "./endgameView.js";
import { EventBus } from "../utils/eventBus.js";
import { formatCredits } from "../utils/formatNumber.js";

export function initRender(state) {
  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = `
        <h1 id="game-title">GRIDBOUND</h1>
        <div id="main-view">
            <div id="track-section"></div>
            <div id="telemetry-section"></div>
        </div>
        <div id="side-panel">
            <div id="shop-section"></div>
        </div>
    `;

  initTrackView(document.getElementById("track-section"), state);
  initTelemetryView(document.getElementById("telemetry-section"), state);
  initShopView(document.getElementById("shop-section"), state);
  initPitStopView(document.getElementById("game-container"));

  initOnboardingView(state);
  initAchievementView();
  initEndgameView();

  // Listen to generic state changes
  EventBus.on("lap:completed", (payload) => {
    // Emit credits changed event to update UI
    EventBus.emit("credits:changed", { total: state.economy.credits });
  });

  // Settings & Theme Logic
  const themeToggle = document.getElementById("theme-toggle");
  const settingsToggle = document.getElementById("settings-toggle");
  
  if (state.settings.theme === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById("theme-icon-light").style.display = "none";
    document.getElementById("theme-icon-dark").style.display = "block";
  }

  themeToggle.addEventListener("click", () => {
    const isLight = document.body.classList.toggle('light-mode');
    state.settings.theme = isLight ? 'light' : 'dark';
    
    document.getElementById("theme-icon-light").style.display = isLight ? "none" : "block";
    document.getElementById("theme-icon-dark").style.display = isLight ? "block" : "none";
  });

  settingsToggle.addEventListener("click", () => {
    if (confirm("WARNING: Are you sure you want to completely RESET YOUR PROGRESS? This cannot be undone.")) {
      localStorage.removeItem("formula_incremental_save"); // old save key
      location.reload();
    }
  });
}
