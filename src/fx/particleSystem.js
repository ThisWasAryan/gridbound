let canvas = null;
let ctx = null;
let allParticles = [];
let isAnimating = false;

function ensureCanvas() {
  if (canvas) return;

  canvas = document.createElement("canvas");
  canvas.id = "fx-canvas";
  canvas.style.cssText =
    "position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;";
  document.body.appendChild(canvas);

  syncCanvasSize();
  window.addEventListener("resize", syncCanvasSize);
}

function syncCanvasSize() {
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
}

export function createParticleBurst(
  x,
  y,
  count = 20,
  colors = ["#E63946", "#B26BFF", "#FFB020"],
) {
  ensureCanvas();

  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 6;
    allParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
    });
  }

  if (!isAnimating) {
    isAnimating = true;
    lastTime = performance.now();
    requestAnimationFrame(update);
  }
}

let lastTime = 0;

function update(time) {
  const dt = (time - lastTime) / 16.66;
  lastTime = time;

  // Clear the full canvas (use CSS pixel dimensions, not scaled)
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();

  // Update and draw all particles
  for (let i = allParticles.length - 1; i >= 0; i--) {
    const p = allParticles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.15 * dt; // gravity
    p.life -= 0.018 * dt;

    if (p.life <= 0) {
      allParticles.splice(i, 1);
      continue;
    }

    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  if (allParticles.length > 0) {
    requestAnimationFrame(update);
  } else {
    isAnimating = false;
  }
}
