import { initTrackView } from "./trackView.js";
import { initTelemetryView } from "./telemetryView.js";
import { initShopView } from "./shopView.js";
import { initPitStopView } from "./pitStopView.js";
import { initOnboardingView } from "./onboardingView.js";
import { initAchievementView } from "./achievementView.js";
import { initEndgameView } from "./endgameView.js";
import { EventBus } from "../utils/eventBus.js";
import { formatCredits } from "../utils/formatNumber.js";

let state;
export function initRender(gameState) {
  state = gameState;

  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = `
        <h1 id="game-title">GRIDBOUND</h1>
        <div id="main-view">
            <div id="track-section"></div>
            <div id="telemetry-section"></div>
        </div>
        <div id="side-panel">
            <div id="shop-section" style="flex: 1; overflow-y: auto;"></div>
            <div id="bottom-left-controls" style="padding: 20px; display: flex; gap: 15px; border-top: 2px solid var(--border-color); background: var(--bg-panel); align-items: center; justify-content: flex-start;">
                <div id="theme-toggle" style="cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">
                    <svg id="theme-icon-light" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <svg id="theme-icon-dark" viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" style="display: none;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </div>
                <div id="settings-toggle" style="cursor: pointer; opacity: 0.7; transition: opacity 0.2s;">
                    <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
            </div>
        </div>
    `;

  initTrackView(document.getElementById("track-section"), state);
  initTelemetryView(document.getElementById("telemetry-section"), state);
  initShopView(document.getElementById("shop-section"), state);
  initPitStopView(document.getElementById("game-container"), state);

  initOnboardingView(state);
  initAchievementView();
  initEndgameView();

  // Listen to generic state changes
  EventBus.on("lap:completed", (payload) => {
    // Emit credits changed event to update UI
    EventBus.emit("credits:changed", { total: state.economy.credits });
  });

  // Settings Modal HTML
  gameContainer.insertAdjacentHTML('beforeend', `
    <div id="settings-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:9999;align-items:center;justify-content:center;">
        <div style="background:var(--bg-panel);padding:30px;border-radius:12px;width:400px;max-width:90%;border:1px solid var(--border-color);display:flex;flex-direction:column;gap:20px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <h2 style="margin:0;color:var(--text-primary);">Settings / Cheats</h2>
                <button id="close-settings" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;font-size:24px;line-height:1;">&times;</button>
            </div>
            
            <div style="padding-bottom:15px;border-bottom:1px solid var(--border-color);">
                <button id="btn-add-million" class="primary-btn" style="width:100%;margin-bottom:10px;">+ $1,000,000</button>
                <p style="font-size:12px;color:var(--text-muted);margin:0;">This option is to test all features of the game. If you are in a hurry, we do not recommend this option and it ends all the fun.</p>
            </div>
            
            <div style="padding-bottom:15px;border-bottom:1px solid var(--border-color);">
                <button id="btn-trigger-pitstop" class="primary-btn" style="width:100%;margin-bottom:10px;background:var(--accent-sector);color:#000;">Trigger Pit Stop</button>
                <p style="font-size:12px;color:var(--text-muted);margin:0;">This is for testing pit stop while development and it's been left in if you want to try the pit stop minigame at any time.</p>
            </div>

            <div>
                <button id="btn-delete-progress" class="secondary-btn" style="width:100%;border-color:#e63946;color:#e63946;">Delete Your Progress</button>
            </div>
        </div>
    </div>
    
    <div id="delete-confirm-modal" style="display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:10000;align-items:center;justify-content:center;">
        <div style="background:var(--bg-panel);padding:30px;border-radius:12px;width:400px;max-width:90%;border:1px solid #e63946;display:flex;flex-direction:column;gap:20px;">
            <h2 style="margin:0;color:#e63946;">Delete Progress</h2>
            <p style="color:var(--text-secondary);font-size:14px;margin:0;">To confirm deletion, type <strong>DELETE</strong> below.</p>
            <input type="text" id="delete-confirm-input" style="background:var(--bg-surface);border:1px solid var(--border-color);color:var(--text-primary);padding:10px;border-radius:6px;font-family:monospace;outline:none;" placeholder="Type DELETE">
            <div style="display:flex;gap:10px;">
                <button id="btn-cancel-delete" class="secondary-btn" style="flex:1;">Cancel</button>
                <button id="btn-confirm-delete" class="primary-btn" style="flex:1;background:#e63946;opacity:0.5;pointer-events:none;">Confirm</button>
            </div>
        </div>
    </div>
  `);

  // Settings & Theme Logic
  const themeToggle = document.getElementById("theme-toggle");
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsBtn = document.getElementById("close-settings");
  
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
    settingsModal.style.display = "flex";
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.style.display = "none";
  });

  document.getElementById("btn-add-million").addEventListener("click", () => {
    state.economy.credits += 1000000;
    EventBus.emit("credits:changed", { total: state.economy.credits });
  });

  document.getElementById("btn-trigger-pitstop").addEventListener("click", () => {
    settingsModal.style.display = "none";
    EventBus.emit("pitstop:active", {});
  });

  const deleteModal = document.getElementById("delete-confirm-modal");
  const delInput = document.getElementById("delete-confirm-input");
  const confirmDelBtn = document.getElementById("btn-confirm-delete");

  document.getElementById("btn-delete-progress").addEventListener("click", () => {
    settingsModal.style.display = "none";
    deleteModal.style.display = "flex";
    delInput.value = "";
    confirmDelBtn.style.opacity = "0.5";
    confirmDelBtn.style.pointerEvents = "none";
    delInput.focus();
  });

  document.getElementById("btn-cancel-delete").addEventListener("click", () => {
    deleteModal.style.display = "none";
    settingsModal.style.display = "flex";
  });

  delInput.addEventListener("input", (e) => {
    if (e.target.value === "DELETE") {
      confirmDelBtn.style.opacity = "1";
      confirmDelBtn.style.pointerEvents = "auto";
    } else {
      confirmDelBtn.style.opacity = "0.5";
      confirmDelBtn.style.pointerEvents = "none";
    }
  });

  delInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && delInput.value === "DELETE") {
      confirmDelBtn.click();
    }
  });

  confirmDelBtn.addEventListener("click", () => {
    localStorage.removeItem("formula_incremental_save");
    location.reload();
  });
}
