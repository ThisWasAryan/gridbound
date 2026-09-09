import {
  UPGRADES_CONFIG,
  calculateUpgradeCost,
} from "../config/upgrades.config.js";
import { TRACKS_CONFIG } from "../config/tracks.config.js";
import { CARS_CONFIG } from "../config/cars.config.js";
import { PRINCIPALS } from "../config/principals.config.js";
import {
  buyUpgrade,
  buyTrack,
  switchTrack,
  buyCar,
  switchCar,
} from "../systems/economySystem.js";
import { hirePrincipal, toggleAutomation } from "../systems/principalSystem.js";
import { formatTime } from "../utils/formatNumber.js";
import { EventBus } from "../utils/eventBus.js";
import { formatCredits } from "../utils/formatNumber.js";
import { AudioCues } from "../audio/audioManager.js";
import { createParticleBurst } from "../fx/particleSystem.js";

let shopContainer;
let stateRef;
let currentTab = "upgrades"; // 'upgrades' | 'tracks'

export function initShopView(container, state) {
  shopContainer = container;
  stateRef = state;

  renderBase();
  renderContent();

  EventBus.on("credits:changed", updateButtonStates);
  EventBus.on("upgrade:purchased", handleUpgradePurchased);
  EventBus.on("track:purchased", handleTrackPurchased);
  EventBus.on("track:switched", renderContent);
  EventBus.on("car:purchased", renderContent);
  EventBus.on("car:switched", handleCarSwitched);
  EventBus.on("lap:completed", updateBestTimesIfGarage);
  EventBus.on("principal:hired", renderContent);
  EventBus.on("automation:toggled", renderContent);
}

function updateBestTimesIfGarage() {
  if (currentTab === "garage") {
    renderContent();
  }
}

function handleCarSwitched() {
  // When car switches, we might be on 'upgrades' tab which shows car-specific upgrades.
  // We should re-render current tab.
  renderContent();
}

function renderBase() {
  shopContainer.innerHTML = `
        <div class="shop-panel">
            <div class="shop-tabs" id="shop-tabs-container">
                <button id="tab-upgrades" class="tab-btn active">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>
                    UPGRADES
                </button>
                <button id="tab-tracks" class="tab-btn">
                    <img id="tab-tracks-icon" src="" width="16" height="16" style="object-fit: contain; filter: drop-shadow(0 0 1px rgba(255,255,255,0.2));" />
                    TRACKS
                </button>
                <button id="tab-garage" class="tab-btn">
                    <img id="tab-garage-icon" src="" width="16" height="16" style="object-fit: contain; filter: drop-shadow(0 0 1px rgba(255,255,255,0.2));" />
                    GARAGE
                </button>
                <button id="tab-team" class="tab-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    TEAM
                </button>
            </div>
            <div id="shop-content-area"></div>
        </div>
    `;

  document
    .getElementById("tab-upgrades")
    .addEventListener("click", () => switchTab("upgrades"));
  document
    .getElementById("tab-tracks")
    .addEventListener("click", () => switchTab("tracks"));
  document
    .getElementById("tab-garage")
    .addEventListener("click", () => switchTab("garage"));
  document
    .getElementById("tab-team")
    .addEventListener("click", () => switchTab("team"));
}

function switchTab(tab) {
  if (document.getElementById(`tab-${tab}`).classList.contains("disabled")) return;
  
  currentTab = tab;
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("active"));
  document.getElementById(`tab-${tab}`).classList.add("active");
  renderContent();
}

function updateTabsState() {
  const teamLocked = !stateRef.cars['f2'] || !stateRef.cars['f2'].owned;

  const tabGarage = document.getElementById("tab-garage");
  const tabTeam = document.getElementById("tab-team");
  const trackIcon = document.getElementById("tab-tracks-icon");
  const garageIcon = document.getElementById("tab-garage-icon");

  if (trackIcon && stateRef.session.currentTrackId) {
    trackIcon.src = TRACKS_CONFIG[stateRef.session.currentTrackId].svgPath;
  }
  if (garageIcon && stateRef.session.currentCarId) {
    garageIcon.src = CARS_CONFIG[stateRef.session.currentCarId].svgPath;
  }

  // Garage is always accessible so they can see locked cars
  tabGarage.classList.remove("disabled");
  tabGarage.title = "";

  if (teamLocked) {
    tabTeam.classList.add("disabled");
    tabTeam.title = "Unlock by purchasing the F2 car";
  } else {
    tabTeam.classList.remove("disabled");
    tabTeam.title = "";
  }
}

function renderContent() {
  updateTabsState();
  const area = document.getElementById("shop-content-area");
  if (currentTab === "upgrades") {
    renderUpgrades(area);
  } else if (currentTab === "tracks") {
    renderTracks(area);
  } else if (currentTab === "garage") {
    renderGarage(area);
  } else if (currentTab === "team") {
    renderTeam(area);
  }
}

function renderUpgrades(container) {
  let html = `<div class="upgrade-list">`;

  Object.values(UPGRADES_CONFIG).forEach((config) => {
    const currentLevel = getCurrentLevel(config);
    const cost = calculateUpgradeCost(
      config.baseCost,
      config.growthRate,
      currentLevel,
    );
    const affordable = stateRef.economy.credits >= cost;

    let iconSvg = '';
    if (config.id === 'engine') iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
    else if (config.id === 'aero') iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>`;
    else if (config.id === 'tyre') iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle><circle cx="12" cy="12" r="4"></circle></svg>`;
    else if (config.id === 'pitCrew') iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;
    else if (config.id === 'driver') iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a5 5 0 0 1 5 5v1a5 5 0 0 1-10 0V7a5 5 0 0 1 5-5z"></path><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path></svg>`;
    else if (config.id === 'sponsorships') iconSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>`;

    html += `
            <div class="upgrade-item" id="upgrade-item-${config.id}">
                <div class="upgrade-info">
                    <span class="upgrade-name" style="display:flex; align-items:center; gap:6px;">${iconSvg} ${config.name} Lvl <span id="lvl-${config.id}">${currentLevel}</span></span>
                    <span class="upgrade-desc">${config.description}</span>
                </div>
                <button class="buy-btn ${affordable ? "" : "disabled"}" id="buy-btn-${config.id}" data-id="${config.id}">
                    ${formatCredits(cost)}
                </button>
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;

  // Attach listeners
  Object.keys(UPGRADES_CONFIG).forEach((id) => {
    const btn = document.getElementById(`buy-btn-${id}`);
    btn.addEventListener("click", (e) => {
      if (buyUpgrade(id)) {
        AudioCues.purchase();
        const rect = btn.getBoundingClientRect();
        createParticleBurst(
          rect.left + rect.width / 2,
          rect.top + rect.height / 2,
          20,
          ["#FFB020", "#F5F7FA"],
        );
      }
    });
  });
}

function renderTracks(container) {
  let html = `<div class="upgrade-list">`;

  Object.values(TRACKS_CONFIG).forEach((config) => {
    const isOwned =
      stateRef.tracks[config.id] && stateRef.tracks[config.id].owned;
    const isActive = stateRef.session.currentTrackId === config.id;
    const affordable = stateRef.economy.credits >= config.cost;

    let btnHtml = "";
    if (isActive) {
      btnHtml = `<button class="buy-btn disabled">ACTIVE</button>`;
    } else if (isOwned) {
      btnHtml = `<button class="buy-btn switch-btn" id="switch-track-btn-${config.id}">DRIVE</button>`;
    } else {
      btnHtml = `<button class="buy-btn ${affordable ? "" : "disabled"}" id="buy-track-btn-${config.id}">
                ${formatCredits(config.cost)}
            </button>`;
    }

    html += `
            <div class="upgrade-item">
                <div class="upgrade-info">
                    <span class="upgrade-name" style="display:flex; align-items:center; gap:10px;">
                        <img src="${config.svgPath}" width="24" height="24" style="object-fit: contain; filter: drop-shadow(0 0 2px rgba(255,255,255,0.1));">
                        ${config.name}
                    </span>
                    <span class="upgrade-desc">Profit Multiplier: ${config.profitMultiplier}x</span>
                </div>
                ${btnHtml}
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;

  Object.values(TRACKS_CONFIG).forEach((config) => {
    const isOwned =
      stateRef.tracks[config.id] && stateRef.tracks[config.id].owned;
    const isActive = stateRef.session.currentTrackId === config.id;

    if (!isActive && isOwned) {
      document
        .getElementById(`switch-track-btn-${config.id}`)
        .addEventListener("click", () => {
          if (!stateRef.runtime.lapActive) {
            AudioCues.buttonClick();
            switchTrack(config.id);
          }
        });
    } else if (!isActive && !isOwned) {
      const btn = document.getElementById(`buy-track-btn-${config.id}`);
      btn.addEventListener("click", () => {
        const rect = btn.getBoundingClientRect();
        if (buyTrack(config.id)) {
          AudioCues.purchase();
          createParticleBurst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            30,
            ["#38bdf8", "#F5F7FA"],
          );
        }
      });
    }
  });
}

function getCarTotalUpgrades(carId) {
  if (!stateRef.cars[carId]) return 0;
  const c = stateRef.cars[carId];
  return (c.engineLevel || 0) + (c.aeroLevel || 0) + (c.tyreLevel || 0);
}

function renderGarage(container) {
  let html = `<div class="upgrade-list">`;

  const prevCarMap = { f4: "kart", f3: "f4", f2: "f3", f1: "f2" };

  Object.values(CARS_CONFIG).forEach((config) => {
    const isOwned = stateRef.cars[config.id] && stateRef.cars[config.id].owned;
    const isActive = stateRef.session.currentCarId === config.id;
    const affordable = stateRef.economy.credits >= config.cost;

    let isUnlocked = true;
    let unlockReason = "";
    if (prevCarMap[config.id]) {
      const prevCar = prevCarMap[config.id];
      const upgrades = getCarTotalUpgrades(prevCar);
      if (upgrades < 10) {
        isUnlocked = false;
        const prevName = CARS_CONFIG[prevCar].name;
        unlockReason = `Requires 10 upgrades in ${prevName} (Current: ${upgrades}/10)`;
      }
    }

    let btnHtml = "";
    if (isActive) {
      btnHtml = `<button class="buy-btn disabled">ACTIVE</button>`;
    } else if (isOwned) {
      btnHtml = `<button class="buy-btn switch-btn" id="switch-car-btn-${config.id}">DRIVE</button>`;
    } else if (!isUnlocked) {
      btnHtml = `<div style="font-size: 12px; color: #E63946; text-align: right; max-width: 120px;">
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" style="vertical-align: middle;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    <br/>${unlockReason}
                 </div>`;
    } else {
      btnHtml = `<button class="buy-btn ${affordable ? "" : "disabled"}" id="buy-car-btn-${config.id}">
                ${formatCredits(config.cost)}
            </button>`;
    }

    let timesHtml = "";
    if (isOwned) {
      timesHtml = `<div style="font-size: 11px; margin-top: 10px; color: var(--text-secondary);">`;
      Object.values(TRACKS_CONFIG).forEach((track) => {
        if (stateRef.tracks[track.id] && stateRef.tracks[track.id].owned) {
          const time = stateRef.bestTimes[`${config.id}:${track.id}`];
          timesHtml += `<div>${track.name}: ${time ? formatTime(time) : "--:--.---"}</div>`;
        }
      });
      timesHtml += `</div>`;
    }

    html += `
            <div class="upgrade-item ${!isUnlocked ? 'locked' : ''}">
                <div class="upgrade-info">
                    <span class="upgrade-name" style="display:flex; align-items:center; gap:10px;">
                        <img src="${config.svgPath}" width="28" height="28" style="object-fit: contain; filter: drop-shadow(0 0 2px rgba(255,255,255,0.1));">
                        ${config.name}
                    </span>
                    <span class="upgrade-desc">Base Perf: ${config.baseEngine.toFixed(1)} E / ${config.baseAero.toFixed(1)} A / ${config.baseTyre.toFixed(1)} T</span>
                    ${timesHtml}
                </div>
                ${btnHtml}
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;

  Object.values(CARS_CONFIG).forEach((config) => {
    const isOwned = stateRef.cars[config.id] && stateRef.cars[config.id].owned;
    const isActive = stateRef.session.currentCarId === config.id;

    if (!isActive && isOwned) {
      const switchBtn = document.getElementById(`switch-car-btn-${config.id}`);
      if (switchBtn) {
        switchBtn.addEventListener("click", () => {
          if (!stateRef.runtime.lapActive) {
            AudioCues.buttonClick();
            switchCar(config.id);
          }
        });
      }
    } else if (!isActive && !isOwned) {
      const btn = document.getElementById(`buy-car-btn-${config.id}`);
      if (btn) {
        btn.addEventListener("click", () => {
          const rect = btn.getBoundingClientRect();
          if (buyCar(config.id)) {
            AudioCues.purchase();
            createParticleBurst(
              rect.left + rect.width / 2,
              rect.top + rect.height / 2,
              30,
              ["#E63946", "#F5F7FA"],
            );
          }
        });
      }
    }
  });
}

function getCurrentLevel(config) {
  if (config.type === "per-car") {
    const carId = stateRef.session.currentCarId;
    return stateRef.cars[carId][`${config.id}Level`];
  }
  return stateRef.team[`${config.id}Level`];
}

function updateButtonStates() {
  if (currentTab === "upgrades") {
    Object.values(UPGRADES_CONFIG).forEach((config) => {
      const currentLevel = getCurrentLevel(config);
      const cost = calculateUpgradeCost(
        config.baseCost,
        config.growthRate,
        currentLevel,
      );
      const btn = document.getElementById(`buy-btn-${config.id}`);
      if (btn) {
        const affordable = stateRef.economy.credits >= cost;
        if (affordable) {
          btn.classList.remove("disabled");
        } else {
          btn.classList.add("disabled");
        }
      }
    });
  } else if (currentTab === "tracks") {
    Object.values(TRACKS_CONFIG).forEach((config) => {
      const isOwned =
        stateRef.tracks[config.id] && stateRef.tracks[config.id].owned;
      if (!isOwned) {
        const btn = document.getElementById(`buy-track-btn-${config.id}`);
        if (btn) {
          const affordable = stateRef.economy.credits >= config.cost;
          if (affordable) {
            btn.classList.remove("disabled");
          } else {
            btn.classList.add("disabled");
          }
        }
      }
    });
  } else if (currentTab === "garage") {
    Object.values(CARS_CONFIG).forEach((config) => {
      const isOwned =
        stateRef.cars[config.id] && stateRef.cars[config.id].owned;
      if (!isOwned) {
        const btn = document.getElementById(`buy-car-btn-${config.id}`);
        if (btn) {
          const affordable = stateRef.economy.credits >= config.cost;
          if (affordable) {
            btn.classList.remove("disabled");
          } else {
            btn.classList.add("disabled");
          }
        }
      }
    });
  } else if (currentTab === "team") {
    Object.values(PRINCIPALS).forEach((config) => {
      const isOwned = stateRef.principals.hiredIds.includes(config.id);
      if (!isOwned) {
        const btn = document.getElementById(`buy-principal-btn-${config.id}`);
        if (btn) {
          const affordable = stateRef.economy.credits >= config.cost;
          if (affordable) {
            btn.classList.remove("disabled");
          } else {
            btn.classList.add("disabled");
          }
        }
      }
    });
  }
}

function handleUpgradePurchased({ id, newLevel }) {
  if (currentTab === "upgrades") {
    const config = UPGRADES_CONFIG[id];
    const lvlSpan = document.getElementById(`lvl-${id}`);
    const btn = document.getElementById(`buy-btn-${id}`);

    if (lvlSpan) lvlSpan.textContent = newLevel;

    if (btn) {
      const cost = calculateUpgradeCost(
        config.baseCost,
        config.growthRate,
        newLevel,
      );
      btn.textContent = formatCredits(cost);
    }

    updateButtonStates();
  }
}

function handleTrackPurchased() {
  if (currentTab === "tracks") {
    renderContent();
  }
}

function renderTeam(container) {
  let html = `<div class="upgrade-list">`;

  // Automation toggle is now inline on the active principal button
  Object.values(PRINCIPALS).forEach((config) => {
    const isOwned = stateRef.principals.hiredIds.includes(config.id);
    const isActive = stateRef.principals.activeId === config.id;
    const affordable = stateRef.economy.credits >= config.cost;

    let btnHtml = "";
    if (isActive) {
      const isAuto = stateRef.principals.automationEnabled;
      const playSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
      const stopSvg = `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect></svg>`;
      btnHtml = `<button class="buy-btn toggle-inline-btn" id="toggle-inline-btn" style="background-color: ${isAuto ? "var(--accent-sector)" : "var(--bg-surface)"}; color: ${isAuto ? "#000" : "var(--text-primary)"}; display:flex; align-items:center; justify-content:center; gap:8px;">
        ${isAuto ? stopSvg : playSvg}
        ${isAuto ? "ACTIVE" : "PAUSED"}
      </button>`;
    } else if (isOwned) {
      btnHtml = `<button class="buy-btn switch-btn" id="switch-principal-btn-${config.id}">ACTIVATE</button>`;
    } else {
      btnHtml = `<button class="buy-btn ${affordable ? "" : "disabled"}" id="buy-principal-btn-${config.id}">
                ${formatCredits(config.cost)}
            </button>`;
    }

    html += `
            <div class="upgrade-item">
                <div class="upgrade-info">
                    <span class="upgrade-name">${config.name}</span>
                    <span class="upgrade-desc">${config.description}</span>
                </div>
                ${btnHtml}
            </div>
        `;
  });

  html += `</div>`;
  container.innerHTML = html;

  const inlineBtn = document.getElementById("toggle-inline-btn");
  if (inlineBtn) {
    inlineBtn.addEventListener("click", () => {
      toggleAutomation(!stateRef.principals.automationEnabled);
    });
  }

  Object.values(PRINCIPALS).forEach((config) => {
    const isOwned = stateRef.principals.hiredIds.includes(config.id);
    const isActive = stateRef.principals.activeId === config.id;

    if (!isActive && isOwned) {
      document
        .getElementById(`switch-principal-btn-${config.id}`)
        .addEventListener("click", () => {
          AudioCues.buttonClick();
          stateRef.principals.activeId = config.id;
          renderContent();
        });
    } else if (!isActive && !isOwned) {
      const btn = document.getElementById(`buy-principal-btn-${config.id}`);
      btn.addEventListener("click", () => {
        const rect = btn.getBoundingClientRect();
        if (hirePrincipal(config.id)) {
          AudioCues.purchase();
          createParticleBurst(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2,
            30,
            ["#00ffaa", "#F5F7FA"],
          );
        }
      });
    }
  });
}
