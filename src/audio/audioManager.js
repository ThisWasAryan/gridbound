let audioCtx = null;
let masterGain = null;

let isMuted = false;
let globalVolume = 0.8;
let engineSoundEnabled = false;

function initAudio() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.connect(audioCtx.destination);
    masterGain.gain.value = isMuted ? 0 : globalVolume;
  }
}

export function updateAudioSettings(muted, volume, engineEnabled) {
  isMuted = muted;
  globalVolume = volume;
  if (engineEnabled !== undefined) {
    engineSoundEnabled = engineEnabled;
    if (!engineSoundEnabled) AudioEngine.stop();
  }
  if (masterGain && audioCtx) {
    masterGain.gain.value = isMuted ? 0 : globalVolume;
  }
}

export function getAudioSettings() {
  return { isMuted, globalVolume, engineSoundEnabled };
}

/**
 * Ensures the audio context is running (fixes autoplay policies).
 */
export function resumeAudio() {
  initAudio();
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
}

/**
 * Basic tone primitive.
 */
function playTone(
  freq,
  durationMs,
  type = "sine",
  envelope = { attack: 0.01, release: 0.1 },
) {
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
function playNoise(durationMs, gainVal = 0.12, filterFreq = 1800) {
  if (isMuted) return;
  resumeAudio();
  if (!audioCtx) return;
  try {
    const bufferSize = Math.max(256, Math.floor(audioCtx.sampleRate * (durationMs / 1000)));
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = filterFreq;
    filter.Q.value = 2.5;
    const gain = audioCtx.createGain();
    const startTime = audioCtx.currentTime;
    gain.gain.setValueAtTime(gainVal, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationMs / 1000);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    noise.start(startTime);
    noise.stop(startTime + durationMs / 1000);
  } catch (e) {
    // Ignore audio context errors
  }
}

function playPneumaticGun(delayMs, pitch = 160) {
  setTimeout(() => {
    // Rapid pneumatic wheel-nut impacts (5 per wheel)
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        playTone(pitch + (i % 2) * 35, 25, "sawtooth", { attack: 0.005, release: 0.02 });
        playNoise(22, 0.22, 2200);
      }, i * 20);
    }
  }, delayMs);
}

/**
 * Named Cues
 */
export const AudioCues = {
  buttonClick() {
    playTone(600, 50, "square", { attack: 0.01, release: 0.04 });
  },
  startLap() {
    playTone(150, 400, "sawtooth", { attack: 0.1, release: 0.3 });
  },
  lapComplete() {
    playTone(880, 200, "sine", { attack: 0.05, release: 0.15 });
    setTimeout(
      () => playTone(1100, 300, "sine", { attack: 0.05, release: 0.25 }),
      100,
    );
  },
  creditsIncrease() {
    playTone(1200, 30, "triangle", { attack: 0.01, release: 0.02 });
  },
  purchase() {
    playTone(440, 100, "square", { attack: 0.05, release: 0.05 });
    setTimeout(
      () => playTone(660, 200, "square", { attack: 0.05, release: 0.15 }),
      100,
    );
  },
  personalBest() {
    playTone(523.25, 150, "sine", { attack: 0.05, release: 0.1 });
    setTimeout(
      () => playTone(659.25, 150, "sine", { attack: 0.05, release: 0.1 }),
      100,
    );
    setTimeout(
      () => playTone(783.99, 150, "sine", { attack: 0.05, release: 0.1 }),
      200,
    );
    setTimeout(
      () => playTone(1046.5, 400, "sine", { attack: 0.05, release: 0.35 }),
      300,
    );
  },
  radioBox() {
    // Authentic F1 radio beep chirp (1760Hz -> 1320Hz + transceiver burst)
    playTone(1760, 65, "sine", { attack: 0.005, release: 0.05 });
    setTimeout(() => {
      playTone(1320, 85, "sine", { attack: 0.005, release: 0.07 });
      playNoise(120, 0.08, 1600);
    }, 65);

    // Optional synthesized radio speech
    try {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        const msg = new SpeechSynthesisUtterance("Box, box. Box, box.");
        msg.rate = 1.35;
        msg.pitch = 1.1;
        msg.volume = isMuted ? 0 : Math.min(1, globalVolume);
        window.speechSynthesis.speak(msg);
      }
    } catch (e) {
      // Audio fallback is already playing
    }
  },
  pitStopStart() {
    // Pit lane entry speed limiter beeps
    playTone(480, 80, "square", { attack: 0.02, release: 0.05 });
    setTimeout(() => playTone(480, 80, "square", { attack: 0.02, release: 0.05 }), 120);
  },
  pitStopPerfect() {
    // 4 tires changed in ultra-fast sequence (FL, FR, RL, RR)
    playPneumaticGun(0, 180);   // FL
    playPneumaticGun(140, 190); // FR
    playPneumaticGun(280, 175); // RL
    playPneumaticGun(420, 185); // RR

    // Hydraulic jack drop
    setTimeout(() => {
      playTone(65, 140, "sine", { attack: 0.01, release: 0.15 });
      playNoise(60, 0.2, 800);
    }, 580);

    // Green pit release light chime
    setTimeout(() => {
      playTone(1046.5, 180, "sine", { attack: 0.02, release: 0.15 });
      playTone(1318.5, 220, "sine", { attack: 0.02, release: 0.2 });
    }, 660);
  },
  pitStopGood() {
    // 4 tires changed in crisp sequence (FL, FR, RL, RR)
    playPneumaticGun(0, 150);   // FL
    playPneumaticGun(170, 160); // FR
    playPneumaticGun(340, 145); // RL
    playPneumaticGun(510, 155); // RR

    // Hydraulic jack drop
    setTimeout(() => {
      playTone(65, 140, "sine", { attack: 0.01, release: 0.15 });
      playNoise(60, 0.2, 800);
    }, 690);

    // Green pit release light
    setTimeout(() => {
      playTone(880, 200, "triangle", { attack: 0.02, release: 0.2 });
    }, 760);
  },
  pitStopBad() {
    // Staggered slow wheel gun with nut jam
    playPneumaticGun(0, 130);
    playPneumaticGun(250, 120);
    // Stuck wheel nut clank
    setTimeout(() => {
      playTone(720, 180, "sawtooth", { attack: 0.01, release: 0.15 });
      playNoise(150, 0.35, 1200);
    }, 450);
    // Crew delay warning buzz
    setTimeout(() => {
      playTone(180, 450, "square", { attack: 0.05, release: 0.35 });
    }, 650);
  }
};

let engineOsc = null;
let engineGain = null;
let engineFilter = null;

export const AudioEngine = {
  start() {
    if (isMuted || !engineSoundEnabled) return;
    resumeAudio();
    if (engineOsc) this.stop();
    
    engineOsc = audioCtx.createOscillator();
    engineGain = audioCtx.createGain();
    engineFilter = audioCtx.createBiquadFilter();
    
    engineOsc.type = "triangle";
    engineOsc.frequency.value = 100; // Base idle
    
    engineFilter.type = "lowpass";
    engineFilter.frequency.value = 240;
    
    engineGain.gain.value = 0;
    engineGain.gain.linearRampToValueAtTime(0.02, audioCtx.currentTime + 0.5); // fade in volume
    
    engineOsc.connect(engineFilter);
    engineFilter.connect(engineGain);
    engineGain.connect(masterGain);
    
    engineOsc.start();
  },
  
  setRPM(progress) {
    if (!engineOsc || !audioCtx) return;
    // Simulate gear shifts (e.g., 8 gears per lap)
    const gearSegments = 8;
    const gearProgress = (progress * gearSegments) % 1;
    // Map to frequency (100Hz to 300Hz per gear)
    const freq = 100 + (gearProgress * 200);
    engineOsc.frequency.setTargetAtTime(freq, audioCtx.currentTime, 0.1);
  },
  
  stop() {
    if (engineGain && audioCtx) {
      engineGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
      const oscToStop = engineOsc;
      setTimeout(() => {
        if (oscToStop) {
          try { oscToStop.stop(); oscToStop.disconnect(); } catch (e) {}
        }
      }, 500);
      engineOsc = null;
    }
  }
};
