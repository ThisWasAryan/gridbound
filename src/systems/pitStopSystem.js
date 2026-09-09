import { EventBus } from '../utils/eventBus.js';

let state;

export function initPitStopSystem(gameState) {
    state = gameState;
    
    // Check for pit stop when a lap starts
    EventBus.on('lap:started', () => {
        // 15% chance to need a pit stop on this lap
        if (Math.random() < 0.15) {
            // Schedule the pit stop for near the end of the lap
            state.runtime.pitStopScheduled = true;
            state.runtime.pitStopTriggered = false;
        } else {
            state.runtime.pitStopScheduled = false;
            state.runtime.pitStopTriggered = false;
        }
    });
}

export function triggerPitStop() {
    state.runtime.pitStopActive = true;
    state.runtime.pitStopScheduled = false;
    state.runtime.pitStopTriggered = true;
    
    // Pause the lap timer visually and logically
    EventBus.emit('pitstop:active');
}

export function resolvePitStop(quality) {
    state.runtime.pitStopActive = false;
    
    const pitCrewLevel = state.team.pitCrewLevel;
    
    // Base penalty in milliseconds
    let penalty = 3000; 
    
    if (quality === 'PERFECT') {
        penalty = 500;
    } else if (quality === 'GOOD') {
        penalty = 1500;
    }
    
    // Pit crew reduces penalty by 5% per level, up to 75% max
    const reduction = Math.min(0.75, pitCrewLevel * 0.05);
    const finalPenalty = penalty * (1 - reduction);
    
    // Add the penalty to the expected lap duration
    state.runtime.expectedLapDurationMs += finalPenalty;
    
    EventBus.emit('pitstop:resolved', { quality, penalty: finalPenalty });
}
