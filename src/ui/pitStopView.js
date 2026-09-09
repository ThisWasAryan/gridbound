import { EventBus } from '../utils/eventBus.js';
import { resolvePitStop } from '../systems/pitStopSystem.js';

let pitStopOverlay;
let sliderBar;
let sliderCursor;
let actionBtn;

let animationId;
let cursorPosition = 0;
let cursorDirection = 1;
let speed = 2; // speed of the cursor

export function initPitStopView(container) {
    // Create UI elements
    pitStopOverlay = document.createElement('div');
    pitStopOverlay.className = 'pitstop-overlay hidden';
    
    pitStopOverlay.innerHTML = `
        <div class="pitstop-modal">
            <h2>BOX BOX BOX</h2>
            <p>Click when the cursor is in the center!</p>
            <div class="slider-container" id="pitstop-slider">
                <div class="zone bad-zone-left"></div>
                <div class="zone good-zone-left"></div>
                <div class="zone perfect-zone"></div>
                <div class="zone good-zone-right"></div>
                <div class="zone bad-zone-right"></div>
                <div class="slider-cursor" id="pitstop-cursor"></div>
            </div>
            <button id="pitstop-action-btn" class="primary-btn">PIT</button>
        </div>
    `;
    
    container.appendChild(pitStopOverlay);
    
    sliderBar = document.getElementById('pitstop-slider');
    sliderCursor = document.getElementById('pitstop-cursor');
    actionBtn = document.getElementById('pitstop-action-btn');
    
    actionBtn.addEventListener('click', handleActionClick);
    
    EventBus.on('pitstop:active', startMiniGame);
    EventBus.on('pitstop:resolved', hideMiniGame);
}

function startMiniGame() {
    pitStopOverlay.classList.remove('hidden');
    cursorPosition = 0;
    cursorDirection = 1;
    speed = 2 + Math.random(); // Add some variance
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(animateSlider);
}

let lastTime = 0;
function animateSlider(time) {
    const dt = (time - lastTime) / 16.66;
    lastTime = time;
    
    cursorPosition += cursorDirection * speed * dt;
    
    if (cursorPosition > 100) {
        cursorPosition = 100;
        cursorDirection = -1;
    } else if (cursorPosition < 0) {
        cursorPosition = 0;
        cursorDirection = 1;
    }
    
    sliderCursor.style.left = `${cursorPosition}%`;
    
    animationId = requestAnimationFrame(animateSlider);
}

function handleActionClick() {
    cancelAnimationFrame(animationId);
    
    // Evaluate cursor position (0 to 100)
    // Perfect: 45 to 55
    // Good: 30 to 45, 55 to 70
    // Bad: < 30, > 70
    
    let quality = 'BAD';
    if (cursorPosition >= 45 && cursorPosition <= 55) {
        quality = 'PERFECT';
    } else if (cursorPosition >= 30 && cursorPosition <= 70) {
        quality = 'GOOD';
    }
    
    resolvePitStop(quality);
}

function hideMiniGame({ quality }) {
    // Briefly show quality before hiding
    const header = pitStopOverlay.querySelector('h2');
    header.textContent = `${quality} STOP!`;
    
    setTimeout(() => {
        pitStopOverlay.classList.add('hidden');
        header.textContent = 'BOX BOX BOX'; // reset
    }, 1000);
}
