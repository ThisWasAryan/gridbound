import { initTrackView } from './trackView.js';
import { initTelemetryView } from './telemetryView.js';
import { initShopView } from './shopView.js';
import { EventBus } from '../utils/eventBus.js';
import { formatCredits } from '../utils/formatNumber.js';

export function initRender(state) {
    const gameContainer = document.getElementById('game-container');
    gameContainer.innerHTML = `
        <div id="main-view">
            <div id="track-section"></div>
            <div id="telemetry-section"></div>
        </div>
        <div id="side-panel">
            <div id="shop-section"></div>
        </div>
    `;
    
    initTrackView(document.getElementById('track-section'), state);
    initTelemetryView(document.getElementById('telemetry-section'), state);
    initShopView(document.getElementById('shop-section'), state);
    
    // Listen to generic state changes
    EventBus.on('lap:completed', (payload) => {
        // Emit credits changed event to update UI
        EventBus.emit('credits:changed', { total: state.economy.credits });
    });
}
