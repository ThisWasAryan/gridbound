const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

let isMuted = false;
let globalVolume = 0.8;

const masterGain = audioCtx.createGain();
masterGain.connect(audioCtx.destination);
masterGain.gain.value = globalVolume;

export function updateAudioSettings(muted, volume) {
    isMuted = muted;
    globalVolume = volume;
    masterGain.gain.value = isMuted ? 0 : globalVolume;
}

/**
 * Ensures the audio context is running (fixes autoplay policies).
 */
export function resumeAudio() {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

/**
 * Basic tone primitive.
 */
function playTone(freq, durationMs, type = 'sine', envelope = { attack: 0.01, release: 0.1 }) {
    if (isMuted) return;
    resumeAudio();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    osc.connect(gain);
    gain.connect(masterGain);

    const startTime = audioCtx.currentTime;
    const duration = durationMs / 1000;

    // Envelope
    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(1, startTime + envelope.attack);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
}

/**
 * Named Cues
 */
export const AudioCues = {
    buttonClick() {
        playTone(600, 50, 'square', { attack: 0.01, release: 0.04 });
    },
    startLap() {
        playTone(150, 400, 'sawtooth', { attack: 0.1, release: 0.3 });
    },
    lapComplete() {
        playTone(880, 200, 'sine', { attack: 0.05, release: 0.15 });
        setTimeout(() => playTone(1100, 300, 'sine', { attack: 0.05, release: 0.25 }), 100);
    },
    creditsIncrease() {
        playTone(1200, 30, 'triangle', { attack: 0.01, release: 0.02 });
    },
    purchase() {
        playTone(440, 100, 'square', { attack: 0.05, release: 0.05 });
        setTimeout(() => playTone(660, 200, 'square', { attack: 0.05, release: 0.15 }), 100);
    },
    personalBest() {
        playTone(523.25, 150, 'sine', { attack: 0.05, release: 0.1 });
        setTimeout(() => playTone(659.25, 150, 'sine', { attack: 0.05, release: 0.1 }), 100);
        setTimeout(() => playTone(783.99, 150, 'sine', { attack: 0.05, release: 0.1 }), 200);
        setTimeout(() => playTone(1046.50, 400, 'sine', { attack: 0.05, release: 0.35 }), 300);
    }
};
