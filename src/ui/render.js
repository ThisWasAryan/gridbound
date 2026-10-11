import { updateAudioSettings, getAudioSettings } from "../audio/audioManager.js";
// UI Views will be dynamically imported in initRender
import { EventBus } from "../utils/eventBus.js";
import { formatCredits } from "../utils/formatNumber.js";

let state;
export async function initRender(gameState) {
  state = gameState;

  const gameContainer = document.getElementById("game-container");
  gameContainer.innerHTML = `
        <div id="main-view">
            <h1 id="game-title">GRIDBOUND</h1>
            <div id="track-section"></div>
            <div id="telemetry-section"></div>
        </div>
        <div id="side-panel">
            <div id="shop-section" style="flex: 1; min-height: 0; display: flex; flex-direction: column;"></div>
            <div id="bottom-left-controls">
                <div id="theme-toggle" class="control-icon-btn" title="Toggle Theme">
                    <svg id="theme-icon-light" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    <svg id="theme-icon-dark" viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none" style="display: none;"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                </div>
                <div id="settings-toggle" class="control-icon-btn" title="Settings & Audio">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
                </div>
                <div id="help-toggle" class="control-icon-btn" title="How to Play" style="margin-left: auto;">
                    <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
            </div>
        </div>
    `;

  const [
    { initTrackView },
    { initTelemetryView },
    { initShopView },
    { initPitStopView },
    { initOnboardingView },
    { initAchievementView },
    { initEndgameView }
  ] = await Promise.all([
    import("./trackView.js"),
    import("./telemetryView.js"),
    import("./shopView.js"),
    import("./pitStopView.js"),
    import("./onboardingView.js"),
    import("./achievementView.js"),
    import("./endgameView.js")
  ]);

  initTrackView(document.getElementById("track-section"), state);
  initTelemetryView(document.getElementById("telemetry-section"), state);
  initShopView(document.getElementById("shop-section"), state);
  initPitStopView(document.body, state);

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
    <div id="settings-modal" class="modal-overlay">
        <div class="modal-card">
            <div class="modal-header">
                <h2>Settings / Cheats</h2>
                <button id="close-settings" class="modal-close-btn">&times;</button>
            </div>
            
            
            <div class="modal-section">
                <h3 style="margin-top:0; margin-bottom: 14px; font-size: 13px; text-transform:uppercase; letter-spacing:1.5px; color: var(--text-primary); font-family: 'Outfit', sans-serif;">Audio Options</h3>
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 12px;">
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Mute All Sound</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="setting-mute">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
                <div style="display:flex; justify-content: space-between; align-items:center; margin-bottom: 12px;">
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Master Volume</span>
                    <input type="range" id="setting-volume" class="custom-range" min="0" max="1" step="0.05" value="0.8">
                </div>
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500;">Engine Sound</span>
                    <label class="toggle-switch">
                        <input type="checkbox" id="setting-engine-sound">
                        <span class="toggle-slider"></span>
                    </label>
                </div>
            </div>

            <div class="modal-section">
                <button id="btn-add-million" class="settings-action-btn primary">+ $1,000,000</button>
                <p class="modal-hint">This option is to test all features of the game. If you are in a hurry, we do not recommend this option and it ends all the fun.</p>
            </div>
            
            <div class="modal-section">
                <button id="btn-trigger-pitstop" class="settings-action-btn accent">Trigger Pit Stop</button>
                <p class="modal-hint">This is for testing pit stop while development and it's been left in if you want to try the pit stop minigame at any time.</p>
            </div>

            <div class="modal-section">
                <button id="btn-delete-progress" class="settings-action-btn danger-outline">Delete Your Progress</button>
            </div>

            <div class="modal-footer">
                Made with 🩶 by Aryan Raj<br>
                <a href="https://thiswasaryan.in" target="_blank">thiswasaryan.in</a>
            </div>
        </div>
    </div>
    
    <div id="delete-confirm-modal" class="modal-overlay" style="z-index:10000;">
        <div class="modal-card" style="border-color: var(--accent-primary);">
            <div class="modal-header">
                <h2 style="color: var(--accent-primary);">Delete Progress</h2>
            </div>
            <p style="color:var(--text-secondary);font-size:14px;margin:0;">To confirm deletion, type <strong>DELETE</strong> below.</p>
            <input type="text" id="delete-confirm-input" class="confirm-input" placeholder="Type DELETE">
            <div style="display:flex;gap:10px;">
                <button id="btn-cancel-delete" class="settings-action-btn danger-outline" style="border-color:var(--border-color);color:var(--text-primary);">Cancel</button>
                <button id="btn-confirm-delete" class="settings-action-btn primary" style="background:var(--accent-primary);opacity:0.5;pointer-events:none;">Confirm</button>
            </div>
        </div>
    </div>
  `);

  // Settings & Theme Logic
  const themeToggle = document.getElementById("theme-toggle");
  const settingsToggle = document.getElementById("settings-toggle");
  const settingsModal = document.getElementById("settings-modal");
  const closeSettingsBtn = document.getElementById("close-settings");
  
  // Default theme is ALWAYS dark mode on every refresh as requested
  state.settings.theme = "dark";
  document.body.classList.remove("light-mode");
  const iconLight = document.getElementById("theme-icon-light");
  const iconDark = document.getElementById("theme-icon-dark");
  if (iconLight) iconLight.style.display = "block";
  if (iconDark) iconDark.style.display = "none";

  themeToggle.addEventListener("click", (e) => {
    const rect = themeToggle.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const willBeLight = !document.body.classList.contains("light-mode");

    function doToggle() {
      const isLight = document.body.classList.toggle("light-mode");
      state.settings.theme = isLight ? "light" : "dark";
      document.getElementById("theme-icon-light").style.display = isLight ? "none" : "block";
      document.getElementById("theme-icon-dark").style.display = isLight ? "block" : "none";
    }

    if (!document.startViewTransition) {
      doToggle();
      return;
    }

    const transition = document.startViewTransition(doToggle);
    transition.ready.then(() => {
      const maxRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 500,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  });

  
  const settingMute = document.getElementById("setting-mute");
  const settingVolume = document.getElementById("setting-volume");
  const settingEngine = document.getElementById("setting-engine-sound");

  const currentAudio = getAudioSettings();
  if (settingMute) settingMute.checked = currentAudio.isMuted;
  if (settingVolume) settingVolume.value = currentAudio.globalVolume;
  if (settingEngine) settingEngine.checked = currentAudio.engineSoundEnabled;

  const handleAudioChange = () => {
    updateAudioSettings(settingMute.checked, parseFloat(settingVolume.value), settingEngine.checked);
  };

  if (settingMute) settingMute.addEventListener("change", handleAudioChange);
  if (settingVolume) settingVolume.addEventListener("input", handleAudioChange);
  if (settingEngine) settingEngine.addEventListener("change", handleAudioChange);

  settingsToggle.addEventListener("click", () => {
    settingsModal.classList.add("visible");
  });

  closeSettingsBtn.addEventListener("click", () => {
    settingsModal.classList.remove("visible");
  });

  // Close modal on backdrop click
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.remove("visible");
    }
  });

  document.getElementById("btn-add-million").addEventListener("click", () => {
    state.economy.credits += 1000000;
    EventBus.emit("credits:changed", { total: state.economy.credits });
  });

  document.getElementById("btn-trigger-pitstop").addEventListener("click", () => {
    settingsModal.classList.remove("visible");
    EventBus.emit("pitstop:active", {});
  });

  const deleteModal = document.getElementById("delete-confirm-modal");
  const delInput = document.getElementById("delete-confirm-input");
  const confirmDelBtn = document.getElementById("btn-confirm-delete");

  document.getElementById("btn-delete-progress").addEventListener("click", () => {
    settingsModal.classList.remove("visible");
    // Small delay so settings fades out before delete fades in
    setTimeout(() => {
      deleteModal.classList.add("visible");
      delInput.value = "";
      confirmDelBtn.style.opacity = "0.5";
      confirmDelBtn.style.pointerEvents = "none";
      delInput.focus();
    }, 150);
  });

  document.getElementById("btn-cancel-delete").addEventListener("click", () => {
    deleteModal.classList.remove("visible");
    setTimeout(() => settingsModal.classList.add("visible"), 150);
  });

  // Close delete modal on backdrop click
  deleteModal.addEventListener("click", (e) => {
    if (e.target === deleteModal) {
      deleteModal.classList.remove("visible");
    }
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

