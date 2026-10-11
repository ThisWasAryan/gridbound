/**
 * Cinematic Splash Screen for Gridbound
 * Features:
 * - Pure black initial screen with "WELCOME TO GRIDBOUND" in glowing racing red
 * - Animated drifting race wheel with smoke particles
 * - 3D waving checkered flag that smoothly fades into the background while text is visible,
 *   then text fades out first, followed by the checkered flag smoothly revealing the game.
 */

export function showSplashScreen() {
  return new Promise((resolve) => {
    // Create root container
    const splash = document.createElement("div");
    splash.id = "cinematic-splash";
    splash.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000000;
      z-index: 1000000;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      font-family: 'Inter', -apple-system, sans-serif;
      user-select: none;
    `;

    // HTML Content for the title and drifting wheel
    splash.innerHTML = `
      <!-- Canvas for 3D Waving Checkered Flag (Background Layer) -->
      <canvas id="checkered-flag-canvas" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; opacity: 0; z-index: 1; transition: opacity 0.9s ease;"></canvas>

      <!-- Foreground Content Layer -->
      <div id="splash-content" style="position: relative; display:flex; flex-direction:column; align-items:center; z-index: 10; font-family: 'Outfit', 'Inter', -apple-system, sans-serif; transition: opacity 0.6s ease, transform 0.6s ease;">
        <!-- Ambient Title Glow -->
        <div style="position: absolute; top: -20px; width: 540px; height: 220px; background: radial-gradient(ellipse at center, rgba(255, 35, 75, 0.25) 0%, transparent 70%); filter: blur(32px); pointer-events: none; z-index: -1;"></div>

        <div style="font-size: clamp(16px, 2.8vw, 28px); font-weight: 700; letter-spacing: 14px; color: #94a3b8; text-transform: uppercase; margin-bottom: 8px; opacity: 0; transform: translateY(-20px); animation: splashTextIn 0.8s 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
          WELCOME TO
        </div>
        <div style="font-size: clamp(48px, 9vw, 104px); font-weight: 900; letter-spacing: 12px; text-transform: uppercase; background: linear-gradient(135deg, #ff234b 0%, #ff5238 50%, #ff8c42 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: drop-shadow(0 0 35px rgba(255, 35, 75, 0.6)); opacity: 0; transform: scale(0.92); animation: splashTitleIn 0.9s 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;">
          GRIDBOUND
        </div>

        <!-- Drifting Wheel Animation Container -->
        <div style="margin-top: 40px; position: relative; width: 280px; height: 110px; display: flex; justify-content: center; align-items: center; opacity: 0; animation: splashFadeIn 0.8s 0.6s forwards;">
          <canvas id="tire-canvas" width="280" height="110" style="position: absolute; top: 0; left: 0;"></canvas>
        </div>

        <div style="margin-top: 25px; font-size: 12px; font-weight: 700; letter-spacing: 5px; color: #64748b; text-transform: uppercase;">
          INITIALIZING TELEMETRY...
        </div>
      </div>

      <style>
        @keyframes splashTextIn {
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashTitleIn {
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes splashFadeIn {
          to { opacity: 1; }
        }
      </style>
    `;

    document.body.appendChild(splash);

    // 1. Drifting Tire Canvas Logic
    const tireCanvas = document.getElementById("tire-canvas");
    const tCtx = tireCanvas ? tireCanvas.getContext("2d") : null;

    let tireAnimFrame;
    let tireX = 140;
    let tireAngle = 0;
    let driftTime = 0;
    const particles = [];

    function renderTire() {
      if (!tCtx) return;
      driftTime += 0.04;
      tCtx.clearRect(0, 0, 280, 110);

      // Tire drifts left and right smoothly
      tireX = 140 + Math.sin(driftTime * 2) * 55;
      tireAngle += 0.35; // Rapid spin

      // Emit smoke/skid particles
      if (Math.random() < 0.65) {
        particles.push({
          x: tireX + (Math.random() - 0.5) * 15,
          y: 85 + Math.random() * 5,
          vx: -Math.cos(driftTime * 2) * (1.5 + Math.random() * 2),
          vy: -Math.random() * 1.5,
          radius: 4 + Math.random() * 6,
          alpha: 0.6,
        });
      }

      // Draw skid line on ground
      tCtx.fillStyle = "rgba(255, 255, 255, 0.08)";
      tCtx.fillRect(60, 90, 160, 3);

      // Render smoke particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.4;
        p.alpha -= 0.015;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        tCtx.fillStyle = `rgba(200, 215, 230, ${p.alpha * 0.4})`;
        tCtx.beginPath();
        tCtx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        tCtx.fill();
      }

      // Draw Tire with Shadow
      const tireY = 55;
      const tilt = Math.cos(driftTime * 2) * 0.25;

      tCtx.save();
      tCtx.translate(tireX, tireY);
      tCtx.rotate(tilt);

      // Ground shadow
      tCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
      tCtx.beginPath();
      tCtx.ellipse(0, 35, 24, 7, 0, 0, Math.PI * 2);
      tCtx.fill();

      // Outer Rubber Tire
      tCtx.fillStyle = "#121417";
      tCtx.beginPath();
      tCtx.arc(0, 0, 30, 0, Math.PI * 2);
      tCtx.fill();
      tCtx.lineWidth = 3.5;
      tCtx.strokeStyle = "#ff234b"; // Red compound stripe
      tCtx.stroke();

      // Rim
      tCtx.fillStyle = "#2d3748";
      tCtx.beginPath();
      tCtx.arc(0, 0, 18, 0, Math.PI * 2);
      tCtx.fill();

      // Rotating spokes
      tCtx.save();
      tCtx.rotate(tireAngle);
      tCtx.strokeStyle = "#e2e8f0";
      tCtx.lineWidth = 2.5;
      for (let s = 0; s < 5; s++) {
        tCtx.beginPath();
        tCtx.moveTo(0, 0);
        tCtx.lineTo(Math.cos((s * Math.PI * 2) / 5) * 16, Math.sin((s * Math.PI * 2) / 5) * 16);
        tCtx.stroke();
      }
      tCtx.fillStyle = "#ff234b";
      tCtx.beginPath();
      tCtx.arc(0, 0, 4, 0, Math.PI * 2);
      tCtx.fill();
      tCtx.restore();

      tCtx.restore();

      tireAnimFrame = requestAnimationFrame(renderTire);
    }

    renderTire();

    // 2. Start Flag Wave Transition
    startCheckeredFlagTransition(splash, () => {
      cancelAnimationFrame(tireAnimFrame);
      resolve();
    });
  });
}

/**
 * Renders the full-screen checkered flag waving behind text,
 * then smoothly fades text first, followed by the entire flag scene.
 */
function startCheckeredFlagTransition(splashContainer, onComplete) {
  const content = document.getElementById("splash-content");
  const canvas = document.getElementById("checkered-flag-canvas");
  if (!canvas) {
    splashContainer.remove();
    onComplete();
    return;
  }

  const ctx = canvas.getContext("2d", { alpha: true });

  // Optimal resolution cap for silky-smooth 60 FPS on high-DPR mobile screens
  const width = Math.min(window.innerWidth, 480);
  const height = Math.min(window.innerHeight, 640);
  canvas.width = width;
  canvas.height = height;

  const cols = 16;
  const rows = 11;
  const cellW = width / cols;
  const cellH = height / rows;

  let startTime = performance.now();
  let flagAnimId;
  let isCleanedUp = false;

  // Fade flag IN as a subtle background behind text at 350ms
  setTimeout(() => {
    if (!isCleanedUp && canvas) canvas.style.opacity = "0.75";
  }, 350);

  // Fade text OUT at 1150ms while flag is waving
  setTimeout(() => {
    if (!isCleanedUp && content) {
      content.style.opacity = "0";
      content.style.transform = "scale(0.95) translateY(-12px)";
    }
  }, 1150);

  // Fade entire splash screen OUT into the game at 1550ms
  setTimeout(() => {
    if (!isCleanedUp && splashContainer) {
      splashContainer.style.transition = "opacity 0.45s ease";
      splashContainer.style.opacity = "0";
    }
  }, 1550);

  // Complete and remove at 1950ms
  setTimeout(() => {
    isCleanedUp = true;
    cancelAnimationFrame(flagAnimId);
    splashContainer.remove();
    onComplete();
  }, 1950);

  function drawFlag(time) {
    if (isCleanedUp) return;
    const elapsed = time - startTime;

    ctx.clearRect(0, 0, width, height);

    // Wave parameters: realistic, smooth cloth ripple
    const waveFreq = 0.007;
    const waveSpeed = 0.0055;
    const waveAmp = 18;

    for (let r = 0; r < rows; r++) {
      const y = r * cellH;
      for (let c = 0; c < cols; c++) {
        const x = c * cellW;

        // Wave displacement
        const wave = Math.sin(x * waveFreq - elapsed * waveSpeed) * Math.cos(y * waveFreq * 1.3 - elapsed * (waveSpeed * 0.7));
        const zOffset = wave * waveAmp;

        const offsetX = zOffset * 0.3;
        const offsetY = zOffset * 0.5;

        // Checkered alternating colors: deep dark & soft crisp white
        const isCheckered = (r + c) % 2 === 0;
        const light = 0.85 + wave * 0.35;

        if (isCheckered) {
          const v = Math.min(255, Math.max(0, (230 * light) | 0));
          ctx.fillStyle = `rgb(${v},${v},${v})`;
        } else {
          const v = Math.min(255, Math.max(0, (20 * light) | 0));
          ctx.fillStyle = `rgb(${v},${v},${v + 4})`;
        }

        ctx.beginPath();
        ctx.moveTo(x + offsetX, y + offsetY);
        ctx.lineTo(x + cellW + offsetX, y + offsetY);
        ctx.lineTo(x + cellW + offsetX, y + cellH + offsetY);
        ctx.lineTo(x + offsetX, y + cellH + offsetY);
        ctx.closePath();
        ctx.fill();
      }
    }

    flagAnimId = requestAnimationFrame(drawFlag);
  }

  flagAnimId = requestAnimationFrame(drawFlag);
}
