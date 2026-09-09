import { UPGRADES_CONFIG, calculateUpgradeCost } from '../config/upgrades.config.js';
import { buyUpgrade } from '../systems/economySystem.js';
import { EventBus } from '../utils/eventBus.js';
import { formatCredits } from '../utils/formatNumber.js';
import { AudioCues } from '../audio/audioManager.js';
import { createParticleBurst } from '../fx/particleSystem.js';

let shopContainer;
let stateRef;

export function initShopView(container, state) {
    shopContainer = container;
    stateRef = state;
    
    renderShop();
    
    // Re-render shop when credits change (to update button states) 
    // or when an upgrade is purchased (to update level and cost)
    EventBus.on('credits:changed', updateButtonStates);
    EventBus.on('upgrade:purchased', handleUpgradePurchased);
}

function renderShop() {
    let html = `<div class="shop-panel"><h2>UPGRADES</h2><div class="upgrade-list">`;
    
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
    
    html += `</div></div>`;
    shopContainer.innerHTML = html;
    
    // Attach listeners
    Object.keys(UPGRADES_CONFIG).forEach(id => {
        const btn = document.getElementById(`buy-btn-${id}`);
        btn.addEventListener('click', (e) => {
            if (buyUpgrade(id)) {
                AudioCues.purchase();
                const rect = btn.getBoundingClientRect();
                createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 20, ['#FFB020', '#F5F7FA']);
            } else {
                AudioCues.pitBad(); // "denied" sound
            }
        });
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
}

function handleUpgradePurchased({ id, newLevel }) {
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
