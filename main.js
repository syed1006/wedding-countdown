// Salman & Hani — countdown to Qubool Hai.
// Flip clock + petal/firefly sky + milestone bursts. No dependencies.

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TARGET = new Date(document.body.dataset.target).getTime();

/* ── flip clock ─────────────────────────────────────────── */

const flips = {};
document.querySelectorAll('.flip').forEach((el) => {
  flips[el.dataset.unit] = {
    top: el.querySelector('.half.top span'),
    bottom: el.querySelector('.half.bottom span'),
    leaf: el.querySelector('.leaf'),
    front: el.querySelector('.leaf-front span'),
    back: el.querySelector('.leaf-back span'),
    value: null,
  };
});

function setFlip(unit, next) {
  const f = flips[unit];
  if (f.value === next) return;
  const prev = f.value;
  f.value = next;

  if (prev === null || reduced) {
    // first paint / reduced motion: no animation
    f.top.textContent = next;
    f.bottom.textContent = next;
    f.front.textContent = next;
    f.back.textContent = next;
    return;
  }

  // if the previous flip is still mid-air (e.g. background tab), land it first
  if (f.finish) f.finish();

  // stage the leaf: front shows old, back shows new
  f.front.textContent = prev;
  f.back.textContent = next;
  f.top.textContent = next; // revealed as the leaf folds down
  f.leaf.classList.add('flipping');

  const done = () => {
    if (f.finish !== done) return;
    f.finish = null;
    f.bottom.textContent = next;
    // sync the leaf's front to the new value BEFORE un-rotating it,
    // so the instant reset is pixel-identical and invisible
    f.front.textContent = next;
    f.leaf.classList.remove('flipping');
    f.leaf.removeEventListener('transitionend', done);
  };
  f.finish = done;
  f.leaf.addEventListener('transitionend', done);
  // safety in case transitionend is missed (background tab)
  setTimeout(done, 650);
}

const pad = (n) => String(n).padStart(2, '0');
let lastMinute = null;
let lastHour = null;
let finished = false;

function tick() {
  const diff = TARGET - Date.now();

  if (diff <= 0) {
    if (!finished) {
      finished = true;
      document.getElementById('clock').style.display = 'none';
      document.getElementById('married').hidden = false;
      celebrationLoop();
    }
    return;
  }

  const s = Math.floor(diff / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  setFlip('days', String(days));
  setFlip('hours', pad(hours));
  setFlip('minutes', pad(minutes));
  setFlip('seconds', pad(seconds));

  // milestone bursts
  if (lastMinute !== null && minutes !== lastMinute) burst(50);
  if (lastHour !== null && hours !== lastHour) burst(150);
  lastMinute = minutes;
  lastHour = hours;
}

tick();
setInterval(tick, 1000);

/* ── petal + firefly sky ────────────────────────────────── */

const sky = document.getElementById('sky');
const ctx = sky.getContext('2d');
let W = 0;
let H = 0;
const DPR = Math.min(devicePixelRatio || 1, 2);

function resize() {
  W = sky.width = Math.floor(innerWidth * DPR);
  H = sky.height = Math.floor(innerHeight * DPR);
}
resize();
addEventListener('resize', resize);

const PETAL_COLORS = ['#eeb7c2', '#e59aa9', '#f4d8dd', '#e8c3ca'];

function makePetal(anywhere) {
  return {
    kind: 'petal',
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : -30 * DPR,
    size: (Math.random() * 9 + 8) * DPR,
    speed: (Math.random() * 0.4 + 0.25) * DPR,
    swayAmp: (Math.random() * 40 + 22) * DPR,
    swayFreq: Math.random() * 0.9 + 0.5,
    phase: Math.random() * Math.PI * 2,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.012,
    color: PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)],
    alpha: Math.random() * 0.35 + 0.35,
  };
}

function makeFirefly(anywhere) {
  return {
    kind: 'fly',
    x: Math.random() * W,
    y: anywhere ? Math.random() * H : H + 20 * DPR,
    size: (Math.random() * 1.8 + 1.1) * DPR,
    speed: (Math.random() * 0.3 + 0.12) * DPR, // upward
    swayAmp: (Math.random() * 26 + 10) * DPR,
    swayFreq: Math.random() * 1.4 + 0.6,
    phase: Math.random() * Math.PI * 2,
    twinkle: Math.random() * 2 + 1.2,
    alpha: Math.random() * 0.5 + 0.4,
  };
}

const drifters = [];
if (!reduced) {
  const petalCount = innerWidth < 640 ? 14 : 24;
  const flyCount = innerWidth < 640 ? 16 : 28;
  for (let i = 0; i < petalCount; i++) drifters.push(makePetal(true));
  for (let i = 0; i < flyCount; i++) drifters.push(makeFirefly(true));
}

/* burst particles (confetti petals) share the same canvas */
let bursts = [];

function burst(count) {
  if (reduced) return;
  const colors = ['#e59aa9', '#d4b378', '#b8d8c2', '#f4d8dd', '#c9a35c'];
  for (let i = 0; i < count; i++) {
    bursts.push({
      x: W / 2 + (Math.random() - 0.5) * W * 0.4,
      y: H * 0.42 + (Math.random() - 0.5) * H * 0.08,
      vx: (Math.random() - 0.5) * 13 * DPR,
      vy: (Math.random() * -9 - 3) * DPR,
      w: (Math.random() * 8 + 5) * DPR,
      h: (Math.random() * 6 + 4) * DPR,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      color: colors[i % colors.length],
      life: 1,
    });
  }
}

let celebrating = false;
function celebrationLoop() {
  if (celebrating || reduced) return;
  celebrating = true;
  burst(220);
  setInterval(() => burst(90), 2600);
}

/* ── render loop ────────────────────────────────────────── */

let start = null;
function frame(ms) {
  if (start === null) start = ms;
  const t = (ms - start) / 1000;
  ctx.clearRect(0, 0, W, H);

  for (let i = 0; i < drifters.length; i++) {
    const p = drifters[i];
    const x = p.x + Math.sin(t * p.swayFreq + p.phase) * p.swayAmp;

    if (p.kind === 'petal') {
      p.y += p.speed;
      p.rot += p.vr;
      if (p.y > H + 40 * DPR) drifters[i] = makePetal(false);
      ctx.save();
      ctx.translate(x, p.y);
      ctx.rotate(p.rot + Math.sin(t * 0.7 + p.phase) * 0.4);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      const s = p.size;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.55, -s * 0.45, s, 0);
      ctx.quadraticCurveTo(s * 0.5, s * 0.65, 0, 0);
      ctx.fill();
      ctx.restore();
    } else {
      p.y -= p.speed;
      if (p.y < -20 * DPR) drifters[i] = makeFirefly(false);
      const glow = 0.5 + 0.5 * Math.sin(t * p.twinkle + p.phase);
      ctx.save();
      ctx.globalAlpha = p.alpha * glow;
      ctx.fillStyle = '#d4b378';
      ctx.shadowColor = 'rgba(212, 179, 120, 0.9)';
      ctx.shadowBlur = 8 * DPR;
      ctx.beginPath();
      ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  if (bursts.length) {
    const gravity = 0.26 * DPR;
    bursts = bursts.filter((b) => b.life > 0 && b.y < H + 40);
    for (const b of bursts) {
      b.vy += gravity;
      b.vx *= 0.985;
      b.x += b.vx;
      b.y += b.vy;
      b.rot += b.vr;
      b.life -= 0.005;
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.globalAlpha = Math.max(0, Math.min(1, b.life * 1.6));
      ctx.fillStyle = b.color;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
  }

  requestAnimationFrame(frame);
}

if (!reduced) {
  requestAnimationFrame(frame);
  // welcome burst once the clock is painted
  setTimeout(() => burst(120), 900);
}
