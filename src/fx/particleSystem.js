let canvas = null;
let ctx = null;
let isAnimating = false;

const MAX_PARTICLES = 500;
const pool = Array.from({ length: MAX_PARTICLES }, () => ({
  x: 0, y: 0, vx: 0, vy: 0, life: 0, color: "", size: 0, active: false
}));

function getFreeParticle() {
  for (let i = 0; i < pool.length; i++) {
    if (!pool[i].active) return pool[i];
  }
  return pool[0];
}

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
    const p = getFreeParticle();
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 6;
    p.x = x;
    p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 2;
    p.life = 1.0;
    p.color = colors[Math.floor(Math.random() * colors.length)];
    p.size = Math.random() * 4 + 2;
    p.active = true;
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
  let activeCount = 0;

  for (let i = 0; i < pool.length; i++) {
    const p = pool[i];
    if (!p.active) continue;

    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 0.15 * dt; // gravity
    p.life -= 0.018 * dt;

    if (p.life <= 0) {
      p.active = false;
      continue;
    }

    activeCount++;

    ctx.globalAlpha = Math.max(0, p.life);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;

  if (activeCount > 0) {
    requestAnimationFrame(update);
  } else {
    isAnimating = false;
  }
}
