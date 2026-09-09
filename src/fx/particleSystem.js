export function createParticleBurst(
  x,
  y,
  count = 20,
  colors = ["#E63946", "#B26BFF", "#FFB020"],
) {
  let canvas = document.getElementById("fx-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "fx-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    // Sync canvas resolution
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  const ctx = canvas.getContext("2d");
  const particles = [];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10 - 2,
      life: 1.0,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 4 + 2,
    });
  }

  let rafId;
  let lastTime = performance.now();

  function update(time) {
    const dt = (time - lastTime) / 16.66;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    for (const p of particles) {
      if (p.life > 0) {
        active = true;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 0.2 * dt; // gravity
        p.life -= 0.02 * dt;

        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (active) {
      rafId = requestAnimationFrame(update);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  rafId = requestAnimationFrame(update);
}
