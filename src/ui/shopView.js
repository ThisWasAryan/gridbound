import { UPGRADES_CONFIG, calculateUpgradeCost } from '../config/upgrades.config.js';
import { TRACKS_CONFIG } from '../config/tracks.config.js';
import { CARS_CONFIG } from '../config/cars.config.js';
import { buyUpgrade, buyTrack, switchTrack, buyCar, switchCar } from '../systems/economySystem.js';
import { formatTime } from '../utils/formatNumber.js';
import { EventBus } from '../utils/eventBus.js';
import { formatCredits } from '../utils/formatNumber.js';
import { AudioCues } from '../audio/audioManager.js';
import { createParticleBurst } from '../fx/particleSystem.js';

let shopContainer;
let stateRef;
let currentTab = 'upgrades'; // 'upgrades' | 'tracks'

export function initShopView(container, state) {
    shopContainer = container;
    stateRef = state;
    
    renderBase();
    renderContent();
    
    EventBus.on('credits:changed', updateButtonStates);
    EventBus.on('upgrade:purchased', handleUpgradePurchased);
    EventBus.on('track:purchased', handleTrackPurchased);
    EventBus.on('track:switched', renderContent);
    EventBus.on('car:purchased', renderContent);
    EventBus.on('car:switched', handleCarSwitched);
    EventBus.on('lap:completed', updateBestTimesIfGarage);
}

function updateBestTimesIfGarage() {
    if (currentTab === 'garage') {
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
            <div class="shop-tabs">
                <button id="tab-upgrades" class="tab-btn active">UPGRADES</button>
                <button id="tab-tracks" class="tab-btn">TRACKS</button>
                <button id="tab-garage" class="tab-btn">GARAGE</button>
            </div>
            <div id="shop-content-area"></div>
        </div>
    `;
    
    document.getElementById('tab-upgrades').addEventListener('click', () => switchTab('upgrades'));
    document.getElementById('tab-tracks').addEventListener('click', () => switchTab('tracks'));
    document.getElementById('tab-garage').addEventListener('click', () => switchTab('garage'));
}

function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`).classList.add('active');
    renderContent();
}

function renderContent() {
    const area = document.getElementById('shop-content-area');
    if (currentTab === 'upgrades') {
        renderUpgrades(area);
    } else if (currentTab === 'tracks') {
        renderTracks(area);
    } else if (currentTab === 'garage') {
        renderGarage(area);
    }
}

function renderUpgrades(container) {
    let html = `<div class="upgrade-list">`;
    
    Object.values(UPGRADES_CONFIG).forEach(config => {
        const currentLevel = getCurrentLevel(config);
        const cost = calculateUpgradeCost(config.baseCost, config.growthRate, currentLevel);
        const affordable = stateRef.economy.credits >= cost;
        
        html += `
            <div class="upgrade-item" id="upgrade-item-${config.id}">
                <div class="upgrade-info">
                    <span class="upgrade-name">${config.name} Lvl <span id="lvl-${config.id}">${currentLevel}</span></span>
                    <span class="upgrade-desc">${config.description}</span>
                </div>
                <button class="buy-btn ${affordable ? '' : 'disabled'}" id="buy-btn-${config.id}" data-id="${config.id}">
                    ${formatCredits(cost)}
                </button>
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    // Attach listeners
    Object.keys(UPGRADES_CONFIG).forEach(id => {
        const btn = document.getElementById(`buy-btn-${id}`);
        btn.addEventListener('click', (e) => {
            if (buyUpgrade(id)) {
                AudioCues.purchase();
                const rect = btn.getBoundingClientRect();
                createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20, ['#FFB020', '#F5F7FA']);
            }
        });
    });
}

function renderTracks(container) {
    let html = `<div class="upgrade-list">`;
    
    Object.values(TRACKS_CONFIG).forEach(config => {
        const isOwned = stateRef.tracks[config.id] && stateRef.tracks[config.id].owned;
        const isActive = stateRef.session.currentTrackId === config.id;
        const affordable = stateRef.economy.credits >= config.cost;
        
        let btnHtml = '';
        if (isActive) {
            btnHtml = `<button class="buy-btn disabled">ACTIVE</button>`;
        } else if (isOwned) {
            btnHtml = `<button class="buy-btn switch-btn" id="switch-track-btn-${config.id}">DRIVE</button>`;
        } else {
            btnHtml = `<button class="buy-btn ${affordable ? '' : 'disabled'}" id="buy-track-btn-${config.id}">
                ${formatCredits(config.cost)}
            </button>`;
        }

        html += `
            <div class="upgrade-item">
                <div class="upgrade-info">
                    <span class="upgrade-name">${config.name}</span>
                    <span class="upgrade-desc">Profit Multiplier: ${config.profitMultiplier}x</span>
                </div>
                ${btnHtml}
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    Object.values(TRACKS_CONFIG).forEach(config => {
        const isOwned = stateRef.tracks[config.id] && stateRef.tracks[config.id].owned;
        const isActive = stateRef.session.currentTrackId === config.id;
        
        if (!isActive && isOwned) {
            document.getElementById(`switch-track-btn-${config.id}`).addEventListener('click', () => {
                if (!stateRef.runtime.lapActive) {
                    AudioCues.buttonClick();
                    switchTrack(config.id);
                }
            });
        } else if (!isActive && !isOwned) {
            const btn = document.getElementById(`buy-track-btn-${config.id}`);
            btn.addEventListener('click', () => {
                if (buyTrack(config.id)) {
                    AudioCues.purchase();
                    const rect = btn.getBoundingClientRect();
                    createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, ['#38bdf8', '#F5F7FA']);
                }
            });
        }
    });
}

function renderGarage(container) {
    let html = `<div class="upgrade-list">`;
    
    Object.values(CARS_CONFIG).forEach(config => {
        const isOwned = stateRef.cars[config.id] && stateRef.cars[config.id].owned;
        const isActive = stateRef.session.currentCarId === config.id;
        const affordable = stateRef.economy.credits >= config.cost;
        
        let btnHtml = '';
        if (isActive) {
            btnHtml = `<button class="buy-btn disabled">ACTIVE</button>`;
        } else if (isOwned) {
            btnHtml = `<button class="buy-btn switch-btn" id="switch-car-btn-${config.id}">DRIVE</button>`;
        } else {
            btnHtml = `<button class="buy-btn ${affordable ? '' : 'disabled'}" id="buy-car-btn-${config.id}">
                ${formatCredits(config.cost)}
            </button>`;
        }

        let timesHtml = '';
        if (isOwned) {
            timesHtml = `<div style="font-size: 11px; margin-top: 10px; color: #8A8F9A;">`;
            Object.values(TRACKS_CONFIG).forEach(track => {
                if (stateRef.tracks[track.id] && stateRef.tracks[track.id].owned) {
                    const time = stateRef.bestTimes[`${config.id}:${track.id}`];
                    timesHtml += `<div>${track.name}: ${time ? formatTime(time) : '--:--.---'}</div>`;
                }
            });
            timesHtml += `</div>`;
        }

        html += `
            <div class="upgrade-item">
                <div class="upgrade-info">
                    <span class="upgrade-name">${config.name}</span>
                    <span class="upgrade-desc">Base Perf: ${config.baseEngine.toFixed(1)} E / ${config.baseAero.toFixed(1)} A / ${config.baseTyre.toFixed(1)} T</span>
                    ${timesHtml}
                </div>
                ${btnHtml}
            </div>
        `;
    });
    
    html += `</div>`;
    container.innerHTML = html;
    
    Object.values(CARS_CONFIG).forEach(config => {
        const isOwned = stateRef.cars[config.id] && stateRef.cars[config.id].owned;
        const isActive = stateRef.session.currentCarId === config.id;
        
        if (!isActive && isOwned) {
            document.getElementById(`switch-car-btn-${config.id}`).addEventListener('click', () => {
                if (!stateRef.runtime.lapActive) {
                    AudioCues.buttonClick();
                    switchCar(config.id);
                }
            });
        } else if (!isActive && !isOwned) {
            const btn = document.getElementById(`buy-car-btn-${config.id}`);
            btn.addEventListener('click', () => {
                if (buyCar(config.id)) {
                    AudioCues.purchase();
                    const rect = btn.getBoundingClientRect();
                    createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 30, ['#E63946', '#F5F7FA']);
                }
            });
        }
    });
}

function getCurrentLevel(config) {
    if (config.type === 'per-car') {
        const carId = stateRef.session.currentCarId;
        return stateRef.cars[carId][`${config.id}Level`];
    }
    return stateRef.team[`${config.id}Level`];
}

function updateButtonStates() {
    if (currentTab === 'upgrades') {
        Object.values(UPGRADES_CONFIG).forEach(config => {
            const currentLevel = getCurrentLevel(config);
            const cost = calculateUpgradeCost(config.baseCost, config.growthRate, currentLevel);
            const btn = document.getElementById(`buy-btn-${config.id}`);
            if (btn) {
                const affordable = stateRef.economy.credits >= cost;
                if (affordable) {
                    btn.classList.remove('disabled');
                } else {
                    btn.classList.add('disabled');
                }
            }
        });
    } else if (currentTab === 'tracks') {
        Object.values(TRACKS_CONFIG).forEach(config => {
            const isOwned = stateRef.tracks[config.id] && stateRef.tracks[config.id].owned;
            if (!isOwned) {
                const btn = document.getElementById(`buy-track-btn-${config.id}`);
                if (btn) {
                    const affordable = stateRef.economy.credits >= config.cost;
                    if (affordable) {
                        btn.classList.remove('disabled');
                    } else {
                        btn.classList.add('disabled');
                    }
                }
            }
        });
    } else if (currentTab === 'garage') {
        Object.values(CARS_CONFIG).forEach(config => {
            const isOwned = stateRef.cars[config.id] && stateRef.cars[config.id].owned;
            if (!isOwned) {
                const btn = document.getElementById(`buy-car-btn-${config.id}`);
                if (btn) {
                    const affordable = stateRef.economy.credits >= config.cost;
                    if (affordable) {
                        btn.classList.remove('disabled');
                    } else {
                        btn.classList.add('disabled');
                    }
                }
            }
        });
    }
}

function handleUpgradePurchased({ id, newLevel }) {
    if (currentTab === 'upgrades') {
        const config = UPGRADES_CONFIG[id];
        const lvlSpan = document.getElementById(`lvl-${id}`);
        const btn = document.getElementById(`buy-btn-${id}`);
        
        if (lvlSpan) lvlSpan.textContent = newLevel;
        
        if (btn) {
            const cost = calculateUpgradeCost(config.baseCost, config.growthRate, newLevel);
            btn.textContent = formatCredits(cost);
        }
        
        updateButtonStates();
    }
}

function handleTrackPurchased() {
    if (currentTab === 'tracks') {
        renderContent();
    }
}
