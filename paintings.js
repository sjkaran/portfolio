// ================================================================
// PAINTINGS — every masterpiece is re-drawn procedurally on canvas.
// Engine (Stage) + one painter function per artwork.
// A painter is: (ctx, w, h, t, item) => void   (optional .init)
// ================================================================
'use strict';

const TAU = Math.PI * 2;
const lerp = (a, b, t) => a + (b - a) * t;
const mulberry = (seed) => () => {
  seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const MONO = 'JetBrains Mono, Courier New, monospace';
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const Mouse = { x: -9999, y: -9999 };
window.addEventListener('pointermove', (e) => {
  Mouse.x = e.clientX; Mouse.y = e.clientY;
  const s = document.documentElement.style;
  s.setProperty('--mx', e.clientX + 'px');
  s.setProperty('--my', e.clientY + 'px');
}, { passive: true });

const grad = (ctx, x0, y0, x1, y1, stops) => {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
};
const rgrad = (ctx, x, y, r0, r1, stops) => {
  const g = ctx.createRadialGradient(x, y, r0, x, y, r1);
  stops.forEach(([o, c]) => g.addColorStop(o, c));
  return g;
};
const ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, TAU); };

// ---------------------------------------------------------------
// STAGE — mounts canvases, keeps them sharp, paints only what's on screen
// ---------------------------------------------------------------
const Stage = (() => {
  const items = new Set();

  function fit(it) {
    const r = it.canvas.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    it.w = r.width; it.h = r.height;
    it.canvas.width = Math.round(r.width * dpr);
    it.canvas.height = Math.round(r.height * dpr);
    it.ctx = it.canvas.getContext('2d');
    it.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (it.paint.init) it.state = it.paint.init(it);
    it.ready = true; it.dirty = true;
  }

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const it = e.target._it; if (!it) return;
    it.visible = e.isIntersecting; if (it.visible) it.dirty = true;
  }), { rootMargin: '140px' });

  const ro = new ResizeObserver((es) => es.forEach((e) => { if (e.target._it) fit(e.target._it); }));

  function mount(canvas, paint) {
    const it = { canvas, paint, visible: false, dirty: true, ready: false, w: 0, h: 0 };
    canvas._it = it; items.add(it);
    io.observe(canvas); ro.observe(canvas); fit(it);
    return it;
  }
  function unmount(it) { items.delete(it); io.unobserve(it.canvas); ro.unobserve(it.canvas); }

  function loop(ms) {
    const t = ms / 1000;
    for (const it of items) {
      if (!it.ready || !(it.visible || it.dirty)) continue;
      if (REDUCED && !it.dirty) continue;
      it.paint(it.ctx, it.w, it.h, REDUCED ? 2 : t, it);
      it.dirty = false;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
  return { mount, unmount };
})();

// ---------------------------------------------------------------
// 1. THE CREATION OF ADAM — rendered in code glyphs
//    Offscreen masks: red = flesh, green = laptop, blue = God's mantle
// ---------------------------------------------------------------
function heroMasks(g) {
  const F = (v) => `rgb(${(v * 255) | 0},0,0)`;
  const L = (v) => `rgb(0,${(v * 255) | 0},0)`;
  const C = (v) => `rgb(0,0,${(v * 255) | 0})`;
  const blob = (c, x, y, rx, ry, rot = 0) => { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fill(); };
  const limb = (c, x1, y1, x2, y2, w1, w2) => {
    const n = Math.max(8, (Math.hypot(x2 - x1, y2 - y1) / 3) | 0); g.fillStyle = c;
    for (let i = 0; i <= n; i++) { const u = i / n; g.beginPath(); g.arc(lerp(x1, x2, u), lerp(y1, y2, u), lerp(w1, w2, u) / 2, 0, TAU); g.fill(); }
  };
  const quad = (c, p) => { g.fillStyle = c; g.beginPath(); g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); g.fill(); };

  // God's mantle of billowing cloud
  [[800, 235, 230, 185], [640, 150, 70, 70], [700, 90, 80, 80], [820, 62, 85, 85], [930, 100, 80, 80], [985, 200, 62, 62],
   [965, 320, 80, 80], [880, 405, 72, 72], [760, 415, 80, 80], [650, 350, 62, 62]].forEach(([x, y, a, b]) => blob(C(0.55), x, y, a, b || a));
  blob(C(0.8), 860, 250, 120, 110);
  // attendant figures within the mantle
  [[885, 165], [935, 245], [905, 335]].forEach(([x, y]) => { blob(F(0.7), x, y, 21, 24); limb(F(0.55), x, y + 20, x + 10, y + 70, 36, 26); });
  // ground
  blob(F(0.28), 250, 480, 340, 70); blob(F(0.3), 140, 425, 170, 70);

  // ADAM
  limb(F(0.9), 190, 275, 320, 340, 92, 70); blob(F(0.9), 335, 345, 48, 40);
  limb(F(0.88), 335, 345, 430, 375, 52, 40); limb(F(0.82), 430, 375, 385, 440, 38, 26);
  limb(F(0.8), 335, 352, 410, 402, 46, 38); limb(F(0.75), 410, 402, 468, 440, 34, 22);
  blob(F(0.95), 125, 235, 32, 38); blob(F(0.45), 118, 214, 38, 26); limb(F(0.9), 140, 260, 172, 276, 30, 30);
  limb(F(0.85), 165, 282, 140, 345, 30, 24); limb(F(0.8), 140, 345, 185, 392, 24, 18);
  limb(F(0.92), 205, 270, 330, 246, 38, 28); limb(F(0.92), 330, 246, 445, 248, 28, 18);
  blob(F(0.98), 462, 250, 22, 13, 0.1);
  limb(F(1), 470, 249, 506, 256, 9, 5);
  [[468, 257, 490, 270], [462, 260, 482, 276], [456, 262, 472, 280]].forEach((f) => limb(F(0.9), f[0], f[1], f[2], f[3], 8, 6));
  limb(F(0.9), 455, 242, 480, 238, 7, 5);

  // GOD
  limb(F(0.6), 860, 300, 780, 385, 60, 40);
  blob(F(0.95), 840, 240, 95, 80, 0.2); blob(F(1), 740, 150, 34, 40); blob(F(1), 735, 133, 46, 34); blob(F(1), 740, 196, 28, 36);
  limb(F(0.95), 775, 225, 675, 232, 48, 34); limb(F(0.95), 675, 232, 595, 241, 34, 20);
  blob(F(1), 578, 242, 23, 13, -0.05); limb(F(1), 566, 241, 534, 246, 9, 5);
  [[572, 250, 552, 262], [576, 252, 556, 270]].forEach((f) => limb(F(0.9), f[0], f[1], f[2], f[3], 8, 6));
  limb(F(0.9), 570, 234, 550, 230, 7, 5);

  // LAPTOP resting on Adam's thighs
  quad(L(0.9), [[340, 372], [450, 372], [468, 390], [326, 390]]);
  quad(L(0.65), [[350, 298], [440, 298], [447, 370], [343, 370]]);
  g.fillStyle = L(1); g.fillRect(358, 307, 74, 55);
  g.fillStyle = L(0.4); for (let i = 0; i < 5; i++) g.fillRect(364, 313 + i * 10, 20 + ((i * 23) % 40), 4);
}

function heroInit(it) {
  const { w, h } = it;
  const cell = w < 640 ? 7 : w < 1100 ? 9 : 11;
  const scale = Math.min(w / 1000, h / 540);
  const ox = (w - 1000 * scale) / 2, oy = (h - 500 * scale) / 2 + h * 0.02;
  const cols = Math.ceil(w / cell), rows = Math.ceil(h / cell);
  const off = document.createElement('canvas'); off.width = cols; off.height = rows;
  const g = off.getContext('2d', { willReadFrequently: true });
  const k = scale / cell; g.setTransform(k, 0, 0, k, ox / cell, oy / cell);
  heroMasks(g);
  const px = g.getImageData(0, 0, cols, rows).data;
  const R = mulberry(7);
  const sets = [['.', ':', ';', ','], ['=', '+', '/', '-', '*', '(', ')'], ['{', '}', '<', '>', '#', '&'], ['0', '1', '{', '}', '@', '%', '$']];
  const colors = [
    ['#5a3a26', '#9a6a45', '#e0b27f', '#fff0d2'],
    ['#1f6f66', '#2fb59f', '#63e8d0', '#d6fff6'],
    ['#243a9a', '#3f5bd6', '#7f95ff', '#d0d8ff'],
  ].flat();
  const buckets = colors.map(() => []);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = (r * cols + c) * 4, R0 = px[i], G0 = px[i + 1], B0 = px[i + 2];
    const v = Math.max(R0, G0, B0); if (v < 24) continue;
    const mat = R0 >= G0 && R0 >= B0 ? 0 : G0 >= B0 ? 1 : 2;
    const lvl = Math.min(3, (v / 64) | 0), set = sets[lvl];
    buckets[mat * 4 + lvl].push({ x: (c + 0.5) * cell, y: (r + 0.5) * cell, ch: set[(R() * set.length) | 0], ox: 0, oy: 0 });
  }
  return { cell, buckets, colors, sx: ox + 520 * scale, sy: oy + 251 * scale };
}

function hero(ctx, w, h, t, it) {
  const S = it.state; ctx.clearRect(0, 0, w, h);
  const r = it.canvas.getBoundingClientRect(), mx = Mouse.x - r.left, my = Mouse.y - r.top;
  ctx.font = `700 ${S.cell}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const RAD = S.cell * 9;
  S.buckets.forEach((arr, b) => {
    ctx.fillStyle = S.colors[b]; ctx.globalAlpha = 0.8 + 0.2 * Math.sin(t * 1.3 + b * 1.7);
    for (const c of arr) {
      let tx = 0, ty = 0; const dx = c.x - mx, dy = c.y - my, d2 = dx * dx + dy * dy;
      if (d2 < RAD * RAD) { const d = Math.sqrt(d2) || 1, f = (RAD - d) / RAD; tx = (dx / d) * f * RAD * 0.55; ty = (dy / d) * f * RAD * 0.55; }
      c.ox += (tx - c.ox) * 0.14; c.oy += (ty - c.oy) * 0.14;
      ctx.fillText(c.ch, c.x + c.ox, c.y + c.oy);
    }
  });
  ctx.globalAlpha = 1;
  // the spark of life
  const near = Math.max(0, 1 - Math.hypot(mx - S.sx, my - S.sy) / 180);
  const pulse = 1 + 0.18 * Math.sin(t * 3) + near * 0.7, rad = S.cell * 5 * pulse;
  ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgrad(ctx, S.sx, S.sy, 0, rad * 2.2, [[0, 'rgba(255,248,220,.95)'], [0.25, 'rgba(255,205,110,.55)'], [1, 'rgba(255,170,60,0)']]);
  ctx.beginPath(); ctx.arc(S.sx, S.sy, rad * 2.2, 0, TAU); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  const chars = '</>{};01=()';
  ctx.font = `700 ${S.cell * 1.15}px ${MONO}`; ctx.fillStyle = '#ffe3a1';
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU + t * 0.7, ph = (t * 0.45 + i * 0.137) % 1, rr = S.cell * (1.5 + ph * 7);
    ctx.globalAlpha = (1 - ph) * 0.9;
    ctx.fillText(chars[i % chars.length], S.sx + Math.cos(a) * rr, S.sy + Math.sin(a) * rr * 0.7);
  }
  ctx.globalAlpha = 1;
}
hero.init = heroInit;

// ---------------------------------------------------------------
// 2. VITRUVIAN MAN — "Man of Proportions" (About)
// ---------------------------------------------------------------
function vitruvian(ctx, w, h, t) {
  ctx.fillStyle = grad(ctx, 0, 0, w, h, [[0, '#2b2115'], [1, '#120e09']]); ctx.fillRect(0, 0, w, h);
  const H = Math.min(w * 0.62, h * 0.68), cx = w / 2, cy = h / 2, top = cy - H / 2, nav = cy + H * 0.03, R = H * 0.6;
  ctx.strokeStyle = 'rgba(222,190,110,.85)'; ctx.lineWidth = 1.3;
  ctx.beginPath(); ctx.arc(cx, nav, R, 0, TAU); ctx.stroke(); ctx.strokeRect(cx - H / 2, top, H, H);
  ctx.strokeStyle = 'rgba(222,190,110,.25)'; ctx.beginPath();
  ctx.moveTo(cx, top - 12); ctx.lineTo(cx, top + H + 12); ctx.moveTo(cx - H / 2 - 12, nav); ctx.lineTo(cx + H / 2 + 12, nav); ctx.stroke();
  const txt = 'def create(self): return meaning(code)  # man is the measure of all things   ';
  ctx.font = `${Math.max(9, w * 0.026)}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(222,190,110,.6)';
  const rr = R + Math.max(12, w * 0.035), n = txt.length;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + t * 0.06;
    ctx.save(); ctx.translate(cx + Math.cos(a) * rr, nav + Math.sin(a) * rr); ctx.rotate(a + Math.PI / 2); ctx.fillText(txt[i], 0, 0); ctx.restore();
  }
  const figure = (p, al, lw) => {
    ctx.strokeStyle = `rgba(244,230,196,${al})`; ctx.lineWidth = lw; ctx.lineCap = 'round';
    const hr = H * 0.065, hy = top + hr * 1.1, sy = top + H * 0.2, hip = top + H * 0.52, a = lerp(0, -0.62, p), L = H * 0.5, b = lerp(0.07, 0.36, p);
    ctx.beginPath(); ctx.arc(cx, hy, hr, 0, TAU); ctx.moveTo(cx, hy + hr); ctx.lineTo(cx, hip); ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx, sy); ctx.lineTo(cx + s * Math.cos(a) * L, sy + Math.sin(a) * L);
      ctx.moveTo(cx, hip); ctx.lineTo(cx + s * Math.tan(b) * (top + H - hip), top + H); ctx.stroke();
    }
  };
  figure(0, 0.18, 1.4); figure(1, 0.18, 1.4); figure((Math.sin(t * 0.9) + 1) / 2, 0.95, 2.6);
  // a laptop where the navel would be
  ctx.strokeStyle = '#63e8d0'; ctx.fillStyle = 'rgba(99,232,208,.18)'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.rect(cx - H * 0.07, nav - H * 0.085, H * 0.14, H * 0.09); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx - H * 0.09, nav + H * 0.015); ctx.lineTo(cx + H * 0.09, nav + H * 0.015); ctx.stroke();
}

// ---------------------------------------------------------------
// 3. STARRY NIGHT — "The Starry Stack" (Skills)
// ---------------------------------------------------------------
function starry(ctx, w, h, t) {
  ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#0a1640'], [0.6, '#1c3a8c'], [1, '#122665']]); ctx.fillRect(0, 0, w, h);
  const R = mulberry(11), pal = ['#2d56c9', '#4b86e8', '#8fb8f4', '#f0d46a', '#17307f', '#5fa0e6'];
  const V = [[w * 0.58, h * 0.3, w * 0.2], [w * 0.22, h * 0.42, w * 0.15]], step = Math.max(5, w * 0.02);
  ctx.lineCap = 'round';
  for (let i = 0; i < 150; i++) {
    let x = R() * w, y = R() * h * 0.82;
    ctx.strokeStyle = pal[(R() * pal.length) | 0]; ctx.lineWidth = 1.5 + R() * 3.2; ctx.globalAlpha = 0.5 + R() * 0.35;
    ctx.beginPath(); ctx.moveTo(x, y);
    for (let k = 0; k < 24; k++) {
      let vx = 0.3, vy = Math.sin(x * 0.02 + t * 0.4) * 0.12;
      for (const [cx, cy, cr] of V) { const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) + 1, wt = (1 / (1 + (d / cr) ** 2)) * 2.2; vx += (-dy / d) * wt; vy += (dx / d) * wt; }
      const l = Math.hypot(vx, vy) || 1; x += (vx / l) * step; y += (vy / l) * step; ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  // moon
  const mx = w * 0.84, my = h * 0.15, mr = w * 0.062;
  ctx.fillStyle = rgrad(ctx, mx, my, mr * 0.5, mr * 3, [[0, 'rgba(255,225,110,.55)'], [1, 'rgba(255,225,110,0)']]); ctx.beginPath(); ctx.arc(mx, my, mr * 3, 0, TAU); ctx.fill();
  ctx.fillStyle = '#f6d65a'; ctx.beginPath(); ctx.arc(mx, my, mr, 0, TAU); ctx.fill();
  ctx.fillStyle = '#1a3585'; ctx.beginPath(); ctx.arc(mx + mr * 0.45, my - mr * 0.1, mr * 0.9, 0, TAU); ctx.fill();
  // stars
  [[0.12, 0.1], [0.32, 0.07], [0.46, 0.2], [0.64, 0.08], [0.72, 0.3], [0.92, 0.38], [0.22, 0.28], [0.52, 0.4]].forEach(([sx, sy], i) => {
    const x = w * sx, y = h * sy, r = w * 0.022 * (1 + 0.2 * Math.sin(t * 2 + i * 1.9));
    ctx.fillStyle = rgrad(ctx, x, y, 0, r * 3.4, [[0, 'rgba(255,236,150,.95)'], [0.3, 'rgba(255,220,100,.4)'], [1, 'rgba(255,220,100,0)']]);
    ctx.beginPath(); ctx.arc(x, y, r * 3.4, 0, TAU); ctx.fill();
    ctx.fillStyle = '#fff3b0'; ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0, TAU); ctx.fill();
  });
  // cypress
  const sw = Math.sin(t * 0.8) * w * 0.01;
  ctx.fillStyle = '#08140f'; ctx.beginPath(); ctx.moveTo(w * 0.1, h);
  ctx.bezierCurveTo(w * 0.05, h * 0.7, w * 0.14 + sw, h * 0.45, w * 0.1 + sw * 1.6, h * 0.18);
  ctx.bezierCurveTo(w * 0.18, h * 0.4, w * 0.2 + sw, h * 0.55, w * 0.17, h * 0.7);
  ctx.bezierCurveTo(w * 0.22, h * 0.8, w * 0.2, h * 0.9, w * 0.23, h); ctx.closePath(); ctx.fill();
  // village
  ctx.fillStyle = '#0c1536'; ctx.beginPath(); ctx.moveTo(w * 0.2, h);
  ctx.bezierCurveTo(w * 0.35, h * 0.84, w * 0.6, h * 0.9, w, h * 0.82); ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  const Rv = mulberry(5); ctx.fillStyle = '#0a1230';
  for (let i = 0; i < 9; i++) {
    const x = w * (0.3 + i * 0.07), bw = w * 0.05, bh = h * (0.05 + Rv() * 0.04), y = h * 0.93 - bh;
    ctx.fillRect(x, y, bw, bh); ctx.beginPath(); ctx.moveTo(x - 2, y); ctx.lineTo(x + bw / 2, y - bh * 0.5); ctx.lineTo(x + bw + 2, y); ctx.fill();
    ctx.fillStyle = i === 3 ? '#63e8d0' : '#f2c94c'; ctx.fillRect(x + bw * 0.3, y + bh * 0.3, bw * 0.28, bh * 0.28); ctx.fillStyle = '#0a1230';
  }
  ctx.beginPath(); ctx.moveTo(w * 0.7, h * 0.86); ctx.lineTo(w * 0.725, h * 0.62); ctx.lineTo(w * 0.75, h * 0.86); ctx.fill();
}

// ---------------------------------------------------------------
// 4. THE GREAT WAVE — voice waveform (Voice Engine)
// ---------------------------------------------------------------
function wave(ctx, w, h, t) {
  ctx.fillStyle = grad(ctx, 0, 0, 0, h, [[0, '#f0e4c0'], [1, '#d8c48c']]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#2f4d7e'; ctx.beginPath(); ctx.moveTo(w * 0.55, h * 0.62); ctx.lineTo(w * 0.72, h * 0.4); ctx.lineTo(w * 0.9, h * 0.62); ctx.fill();
  ctx.fillStyle = '#f4f0e2'; ctx.beginPath(); ctx.moveTo(w * 0.67, h * 0.46); ctx.lineTo(w * 0.72, h * 0.4); ctx.lineTo(w * 0.77, h * 0.46); ctx.lineTo(w * 0.72, h * 0.44); ctx.fill();
  const cols = ['#4f78b0', '#2f5a96', '#1f4580', '#173768'];
  cols.forEach((c, L) => {
    const y0 = h * (0.6 + L * 0.075); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w + 6; x += 6) ctx.lineTo(x, y0 + Math.sin(x * 0.03 + t * (1 + L * 0.3) + L) * h * 0.02 + Math.sin(x * 0.07 - t * 1.6) * h * 0.012);
    ctx.lineTo(w, h); ctx.closePath(); ctx.fill();
  });
  // the great curl
  const dy = Math.sin(t * 0.9) * h * 0.008;
  ctx.save(); ctx.translate(0, dy);
  ctx.fillStyle = grad(ctx, 0, 0, w * 0.6, h, [[0, '#1d437c'], [1, '#0d2147']]);
  ctx.beginPath(); ctx.moveTo(-10, h); ctx.lineTo(-10, h * 0.5);
  ctx.bezierCurveTo(w * 0.05, h * 0.3, w * 0.2, h * 0.12, w * 0.36, h * 0.14);
  ctx.bezierCurveTo(w * 0.55, h * 0.16, w * 0.66, h * 0.34, w * 0.6, h * 0.48);
  ctx.bezierCurveTo(w * 0.55, h * 0.4, w * 0.46, h * 0.34, w * 0.38, h * 0.38);
  ctx.bezierCurveTo(w * 0.3, h * 0.42, w * 0.28, h * 0.55, w * 0.34, h * 0.68);
  ctx.bezierCurveTo(w * 0.4, h * 0.8, w * 0.5, h * 0.9, w * 0.6, h); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(150,190,235,.35)'; ctx.lineWidth = Math.max(1, w * 0.004);
  for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.moveTo(-10, h * (0.5 + i * 0.1)); ctx.bezierCurveTo(w * 0.1, h * (0.38 + i * 0.09), w * 0.2, h * (0.25 + i * 0.1), w * 0.33, h * (0.2 + i * 0.1)); ctx.stroke(); }
  // foam claws that are really code brackets
  const bez = (p0, p1, p2, p3, u) => { const m = 1 - u; return [m * m * m * p0[0] + 3 * m * m * u * p1[0] + 3 * m * u * u * p2[0] + u * u * u * p3[0], m * m * m * p0[1] + 3 * m * m * u * p1[1] + 3 * m * u * u * p2[1] + u * u * u * p3[1]]; };
  const seg = [bez.bind(null, [w * 0.36, h * 0.14], [w * 0.55, h * 0.16], [w * 0.66, h * 0.34], [w * 0.6, h * 0.48]), bez.bind(null, [-10, h * 0.5], [w * 0.05, h * 0.3], [w * 0.2, h * 0.12], [w * 0.36, h * 0.14])];
  const Rf = mulberry(3), glyphs = '{}<>/;'; ctx.font = `700 ${Math.max(10, w * 0.04)}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < 46; i++) {
    const [px, py] = seg[i % 2](Rf()); const j = Math.sin(t * 2 + i) * 2;
    ctx.fillStyle = '#f7f3e6'; ctx.beginPath(); ctx.arc(px + j, py, 2 + Rf() * w * 0.012, 0, TAU); ctx.fill();
    if (i % 3 === 0) { ctx.globalAlpha = 0.85; ctx.fillText(glyphs[i % glyphs.length], px + j * 2, py + 10 + Math.abs(Math.sin(t * 1.4 + i)) * 12); ctx.globalAlpha = 1; }
  }
  ctx.restore();
  // audio bars along the foreground water
  ctx.fillStyle = 'rgba(240,235,215,.55)';
  const bars = 36, bw = w / bars;
  for (let i = 0; i < bars; i++) { const bh = (Math.sin(i * 0.55 + t * 3) * 0.5 + 0.5) * h * 0.07 + h * 0.01; ctx.fillRect(i * bw + bw * 0.25, h - bh, bw * 0.5, bh); }
}

// ---------------------------------------------------------------
// 5. GIRL WITH A PEARL EARRING — with a headset (Swagat AI)
// ---------------------------------------------------------------
function pearl(ctx, w, h, t) {
  ctx.fillStyle = rgrad(ctx, w * 0.5, h * 0.4, 0, h * 0.9, [[0, '#26232a'], [1, '#050506']]); ctx.fillRect(0, 0, w, h);
  const cx = w * 0.5, cy = h * 0.5;
  ctx.fillStyle = grad(ctx, 0, h * 0.7, w, h, [[0, '#b27d35'], [1, '#5c3a14']]); ell(ctx, cx, h * 1.02, w * 0.46, h * 0.26); ctx.fill();
  ctx.fillStyle = '#e9e4d4'; ell(ctx, cx + w * 0.02, h * 0.87, w * 0.16, h * 0.045); ctx.fill();
  // yellow tail of the turban
  ctx.fillStyle = grad(ctx, 0, 0, w, h, [[0, '#e1b13f'], [1, '#a77a22']]);
  ctx.beginPath(); ctx.moveTo(cx + w * 0.1, cy - h * 0.24); ctx.bezierCurveTo(cx + w * 0.3, cy - h * 0.12, cx + w * 0.3, cy + h * 0.12, cx + w * 0.22, cy + h * 0.2);
  ctx.bezierCurveTo(cx + w * 0.17, cy + h * 0.05, cx + w * 0.14, cy - h * 0.08, cx + w * 0.07, cy - h * 0.15); ctx.fill();
  // face
  ctx.fillStyle = rgrad(ctx, cx - w * 0.05, cy - h * 0.05, w * 0.02, w * 0.24, [[0, '#f4d9b4'], [0.55, '#c99a6e'], [1, '#5a3a26']]);
  ell(ctx, cx, cy, w * 0.16, h * 0.2, 0.05); ctx.fill();
  // turban
  ctx.fillStyle = grad(ctx, 0, cy - h * 0.4, w, cy, [[0, '#4f6bff'], [1, '#1a2f80']]); ell(ctx, cx, cy - h * 0.2, w * 0.19, h * 0.15, -0.05); ctx.fill();
  ctx.strokeStyle = 'rgba(160,185,255,.35)'; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) { ell(ctx, cx, cy - h * 0.2 - i * h * 0.015, w * (0.17 - i * 0.02), h * (0.12 - i * 0.015), -0.05); ctx.stroke(); }
  ctx.fillStyle = '#4f6bff'; ell(ctx, cx, cy - h * 0.33, w * 0.1, h * 0.06); ctx.fill();
  // features
  for (const s of [-1, 1]) {
    ctx.fillStyle = '#1a1210'; ell(ctx, cx + s * w * 0.065, cy - h * 0.03, w * 0.027, h * 0.013); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + s * w * 0.065 - w * 0.008, cy - h * 0.034, w * 0.005, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(70,40,20,.6)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.arc(cx + s * w * 0.065, cy - h * 0.012, w * 0.02, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
  }
  ctx.fillStyle = '#b0392f'; ell(ctx, cx, cy + h * 0.095, w * 0.04, h * 0.012); ctx.fill();
  ctx.strokeStyle = 'rgba(80,45,25,.5)'; ctx.beginPath(); ctx.moveTo(cx - w * 0.01, cy + h * 0.01); ctx.quadraticCurveTo(cx - w * 0.02, cy + h * 0.055, cx + w * 0.01, cy + h * 0.06); ctx.stroke();
  // headset: band, cup, boom mic with live LED
  ctx.strokeStyle = '#d4a94f'; ctx.lineWidth = Math.max(2, w * 0.012); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.ellipse(cx, cy - h * 0.04, w * 0.205, h * 0.3, 0, Math.PI, TAU); ctx.stroke();
  ctx.fillStyle = '#d4a94f'; ell(ctx, cx - w * 0.205, cy - h * 0.04, w * 0.03, h * 0.04); ctx.fill();
  ell(ctx, cx + w * 0.205, cy - h * 0.04, w * 0.03, h * 0.04); ctx.fill();
  ctx.lineWidth = Math.max(1.5, w * 0.007); ctx.beginPath(); ctx.moveTo(cx - w * 0.2, cy); ctx.quadraticCurveTo(cx - w * 0.18, cy + h * 0.14, cx - w * 0.04, cy + h * 0.1); ctx.stroke();
  const led = 0.5 + 0.5 * Math.sin(t * 4);
  ctx.fillStyle = `rgba(99,232,208,${0.4 + led * 0.6})`; ctx.beginPath(); ctx.arc(cx - w * 0.04, cy + h * 0.1, w * 0.012, 0, TAU); ctx.fill();
  // the pearl — pulsing like a status light
  const px = cx + w * 0.205, py = cy + h * 0.1, pr = w * 0.03 * (1 + 0.06 * Math.sin(t * 2));
  ctx.fillStyle = rgrad(ctx, px, py, 0, pr * 3.2, [[0, 'rgba(255,255,255,.55)'], [1, 'rgba(255,255,255,0)']]); ctx.beginPath(); ctx.arc(px, py, pr * 3.2, 0, TAU); ctx.fill();
  ctx.fillStyle = rgrad(ctx, px - pr * 0.3, py - pr * 0.3, 0, pr * 1.1, [[0, '#fff'], [0.6, '#e5e2dc'], [1, '#9a98a2']]); ctx.beginPath(); ctx.arc(px, py, pr, 0, TAU); ctx.fill();
  // voice rings from the mic
  ctx.strokeStyle = `rgba(99,232,208,${0.5 - ((t * 0.6) % 1) * 0.5})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx - w * 0.04, cy + h * 0.1, w * (0.02 + ((t * 0.6) % 1) * 0.1), 0, TAU); ctx.stroke();
}

// ---------------------------------------------------------------
// 6. THE SCREAM — when the expense totals don't balance (BizTrack web)
// ---------------------------------------------------------------
function scream(ctx, w, h, t) {
  const bands = ['#e4562a', '#f2a03a', '#f6d27a', '#c0432b', '#e98a3a', '#3b8fa0'];
  ctx.fillStyle = '#e98a3a'; ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < 14; i++) {
    const y0 = h * (0.0 + i * 0.04); ctx.fillStyle = bands[i % bands.length]; ctx.beginPath(); ctx.moveTo(0, y0 + h * 0.12);
    for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, y0 + Math.sin(x * 0.025 + i * 1.3 + t * 0.8) * h * 0.025 + Math.sin(x * 0.011 - t * 0.5 + i) * h * 0.02);
    ctx.lineTo(w, y0 + h * 0.12); ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = grad(ctx, 0, h * 0.55, 0, h, [[0, '#24435f'], [1, '#0c1826']]);
  ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.58);
  for (let x = 0; x <= w + 8; x += 8) ctx.lineTo(x, h * 0.58 + Math.sin(x * 0.03 + t) * h * 0.012);
  ctx.lineTo(w, h); ctx.fill();
  ctx.fillStyle = '#3a4a2a'; ctx.beginPath(); ctx.moveTo(w * 0.55, h * 0.62); ctx.quadraticCurveTo(w * 0.8, h * 0.5, w, h * 0.56); ctx.lineTo(w, h * 0.66); ctx.fill();
  // the bridge
  ctx.fillStyle = '#3b2a1c'; ctx.beginPath(); ctx.moveTo(0, h * 0.75); ctx.lineTo(w * 0.85, h * 0.6); ctx.lineTo(w * 0.85, h * 0.66); ctx.lineTo(0, h); ctx.fill();
  ctx.strokeStyle = '#17100a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, h * 0.7); ctx.lineTo(w * 0.85, h * 0.57); ctx.stroke();
  for (let i = 0; i < 9; i++) { const u = i / 8, x = u * w * 0.85, y = lerp(h * 0.7, h * 0.57, u); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h * 0.12 * (1 - u * 0.5)); ctx.stroke(); }
  ctx.fillStyle = '#0f0b10'; [[0.68, 0.52], [0.74, 0.51]].forEach(([x, y]) => { ctx.fillRect(w * x, h * y, w * 0.012, h * 0.08); ctx.fillRect(w * x - 2, h * y - h * 0.012, w * 0.02, h * 0.014); });
  // the figure
  const cx = w * 0.32, cy = h * 0.5, sw = Math.sin(t * 2) * w * 0.006;
  ctx.fillStyle = '#0f0b10'; ctx.beginPath(); ctx.moveTo(cx - w * 0.06, cy + h * 0.08);
  ctx.bezierCurveTo(cx - w * 0.14 + sw, cy + h * 0.3, cx - w * 0.06 - sw, cy + h * 0.38, cx - w * 0.1, h);
  ctx.lineTo(cx + w * 0.1, h); ctx.bezierCurveTo(cx + w * 0.06 + sw, cy + h * 0.38, cx + w * 0.12 - sw, cy + h * 0.28, cx + w * 0.05, cy + h * 0.08); ctx.fill();
  ctx.fillStyle = '#d9c79a'; ell(ctx, cx, cy, w * 0.068, h * 0.095); ctx.fill();
  ctx.fillStyle = '#0f0b10'; ell(ctx, cx - w * 0.026, cy - h * 0.02, w * 0.014, h * 0.02); ctx.fill(); ell(ctx, cx + w * 0.026, cy - h * 0.02, w * 0.014, h * 0.02); ctx.fill();
  ell(ctx, cx, cy + h * 0.045, w * 0.017, h * 0.035 * (1 + 0.15 * Math.sin(t * 5))); ctx.fill();
  ctx.fillStyle = '#d9c79a'; ell(ctx, cx - w * 0.072, cy + h * 0.01, w * 0.02, h * 0.04, 0.3); ctx.fill(); ell(ctx, cx + w * 0.072, cy + h * 0.01, w * 0.02, h * 0.04, -0.3); ctx.fill();
  // rupee symbols raining through the sky
  ctx.font = `700 ${w * 0.06}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = 'rgba(255,240,190,.75)';
  [[0.12, 0.12], [0.5, 0.2], [0.82, 0.1], [0.66, 0.34], [0.2, 0.3]].forEach(([x, y], i) => ctx.fillText('₹', w * x, h * (y + 0.03 * Math.sin(t * 1.5 + i * 2))));
}

// ---------------------------------------------------------------
// 7. WANDERER ABOVE THE SEA OF FOG — (BizTrack Desktop)
// ---------------------------------------------------------------
function wanderer(ctx, w, h, t) {
  ctx.fillStyle = grad(ctx, 0, 0, 0, h * 0.7, [[0, '#7f95a2'], [1, '#e6e8e2']]); ctx.fillRect(0, 0, w, h);
  const R = mulberry(21);
  [['#9aa8b0', 0.52], ['#7a8b96', 0.58], ['#5f717d', 0.64]].forEach(([c, base], L) => {
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += w / 14) ctx.lineTo(x, h * base - R() * h * (0.08 + L * 0.02));
    ctx.lineTo(w, h); ctx.fill();
    const off = Math.sin(t * 0.25 + L) * w * 0.1;
    ctx.fillStyle = grad(ctx, off, 0, off + w, 0, [[0, 'rgba(235,238,235,0)'], [0.5, 'rgba(235,238,235,.55)'], [1, 'rgba(235,238,235,0)']]); ctx.fillRect(0, h * (base - 0.02), w, h * 0.16);
  });
  for (let i = 0; i < 7; i++) {
    const x = ((i * 0.19 + t * 0.012) % 1.2 - 0.1) * w, y = h * (0.62 + (i % 3) * 0.05);
    ctx.fillStyle = rgrad(ctx, x, y, 0, w * 0.22, [[0, 'rgba(240,242,240,.7)'], [1, 'rgba(240,242,240,0)']]); ctx.fillRect(x - w * 0.22, y - w * 0.22, w * 0.44, w * 0.44);
  }
  ctx.font = `${Math.max(9, w * 0.032)}px ${MONO}`; ctx.fillStyle = 'rgba(40,60,70,.16)'; ctx.textAlign = 'left';
  ['import fog', 'while True: wander()', 'return horizon'].forEach((s, i) => ctx.fillText(s, w * (0.5 + i * 0.07), h * (0.7 - ((t * 0.02 + i * 0.3) % 0.4))));
  ctx.fillStyle = '#16130f'; ctx.beginPath(); ctx.moveTo(0, h); ctx.lineTo(0, h * 0.78); ctx.lineTo(w * 0.12, h * 0.74); ctx.lineTo(w * 0.3, h * 0.72); ctx.lineTo(w * 0.46, h * 0.8); ctx.lineTo(w * 0.52, h); ctx.fill();
  const fx = w * 0.27, fy = h * 0.735, H = h * 0.3;
  ctx.fillStyle = '#12100c'; ctx.fillRect(fx - H * 0.05, fy - H * 0.38, H * 0.1, H * 0.38);
  ctx.beginPath(); ctx.moveTo(fx - H * 0.12, fy - H * 0.35); ctx.lineTo(fx - H * 0.08, fy - H * 0.82); ctx.lineTo(fx + H * 0.08, fy - H * 0.82); ctx.lineTo(fx + H * 0.12, fy - H * 0.35); ctx.fill();
  ctx.fillStyle = '#7a4a22'; ctx.beginPath(); ctx.arc(fx, fy - H * 0.9, H * 0.075, 0, TAU); ctx.fill();
  ctx.strokeStyle = '#2a1b0c'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(fx + H * 0.16, fy - H * 0.52); ctx.lineTo(fx + H * 0.2, fy); ctx.stroke();
  const gx = w * 0.37, gy = h * 0.73, pu = 0.25 + 0.1 * Math.sin(t * 2);
  ctx.fillStyle = rgrad(ctx, gx, gy - 8, 0, w * 0.14, [[0, `rgba(99,232,208,${pu + 0.2})`], [1, 'rgba(99,232,208,0)']]); ctx.fillRect(gx - w * 0.14, gy - w * 0.14, w * 0.28, w * 0.28);
  ctx.fillStyle = '#63e8d0'; ctx.fillRect(gx - 12, gy - 16, 24, 15); ctx.fillStyle = '#2b2b30'; ctx.fillRect(gx - 15, gy - 1, 30, 3);
}

// ---------------------------------------------------------------
// 8. MONA LISA — eyes follow the visitor (Contact)
// ---------------------------------------------------------------
function mona(ctx, w, h, t, it) {
  ctx.fillStyle = grad(ctx, 0, 0, 0, h * 0.5, [[0, '#9bb09a'], [1, '#d3c892']]); ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#6f8b97'; ctx.beginPath(); ctx.moveTo(0, h * 0.5); for (let i = 0; i <= 8; i++) ctx.lineTo((i / 8) * w, h * (0.34 + 0.1 * Math.abs(Math.sin(i * 1.7)))); ctx.lineTo(w, h * 0.55); ctx.lineTo(0, h * 0.55); ctx.fill();
  ctx.fillStyle = grad(ctx, 0, h * 0.5, 0, h, [[0, '#7a7a44'], [1, '#2e2a16']]); ctx.fillRect(0, h * 0.5, w, h * 0.5);
  ctx.strokeStyle = '#a9bfae'; ctx.lineWidth = w * 0.025; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.84, h * 0.5); ctx.bezierCurveTo(w * 0.9, h * 0.62, w * 0.76, h * 0.68, w * 0.86, h * 0.8); ctx.stroke();
  const cx = w * 0.5, cy = h * 0.4;
  ctx.fillStyle = '#17110a'; ell(ctx, cx, cy - h * 0.01, w * 0.21, h * 0.25); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx - w * 0.2, cy); ctx.lineTo(cx - w * 0.26, h * 0.75); ctx.lineTo(cx + w * 0.26, h * 0.75); ctx.lineTo(cx + w * 0.2, cy); ctx.fill();
  ctx.fillStyle = grad(ctx, 0, h * 0.55, 0, h, [[0, '#2a2418'], [1, '#0f0c07']]);
  ctx.beginPath(); ctx.moveTo(cx - w * 0.5, h); ctx.quadraticCurveTo(cx - w * 0.36, h * 0.6, cx, h * 0.62); ctx.quadraticCurveTo(cx + w * 0.36, h * 0.6, cx + w * 0.5, h); ctx.fill();
  ctx.fillStyle = '#b38a35'; ctx.beginPath(); ctx.moveTo(cx - w * 0.14, h * 0.63); ctx.quadraticCurveTo(cx, h * 0.72, cx + w * 0.14, h * 0.63); ctx.lineTo(cx + w * 0.11, h * 0.62); ctx.quadraticCurveTo(cx, h * 0.69, cx - w * 0.11, h * 0.62); ctx.fill();
  ctx.fillStyle = rgrad(ctx, cx - w * 0.04, cy - h * 0.03, w * 0.02, w * 0.2, [[0, '#e6c79c'], [0.6, '#b98d5e'], [1, '#6d4b2e']]);
  ctx.fillRect(cx - w * 0.04, cy + h * 0.1, w * 0.08, h * 0.12); ell(ctx, cx, cy, w * 0.14, h * 0.17); ctx.fill();
  // eyes track the pointer
  const r = it.canvas.getBoundingClientRect();
  let ex = Mouse.x - (r.left + cx), ey = Mouse.y - (r.top + cy); const el = Math.hypot(ex, ey) || 1, k = Math.min(1, el / 300);
  ex = (ex / el) * k * w * 0.01; ey = (ey / el) * k * h * 0.006;
  for (const s of [-1, 1]) {
    const x = cx + s * w * 0.058, y = cy - h * 0.02;
    ctx.fillStyle = '#efe6d2'; ell(ctx, x, y, w * 0.026, h * 0.011); ctx.fill();
    ctx.fillStyle = '#2a1a0e'; ctx.beginPath(); ctx.arc(x + ex, y + ey, w * 0.009, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(70,45,25,.55)'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y + h * 0.004, w * 0.03, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  }
  // the smile that never quite settles
  const sm = h * 0.011 * (1 + 0.35 * Math.sin(t * 0.8));
  ctx.strokeStyle = '#8a4a3a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(cx - w * 0.04, cy + h * 0.082); ctx.quadraticCurveTo(cx, cy + h * 0.082 + sm * 1.6, cx + w * 0.04, cy + h * 0.082 - sm * 0.4); ctx.stroke();
  // folded hands resting on a laptop lid
  ctx.fillStyle = '#2c2c32'; ctx.fillRect(cx - w * 0.3, h * 0.86, w * 0.6, h * 0.14);
  ctx.fillStyle = `rgba(212,169,79,${0.55 + 0.35 * Math.sin(t * 2)})`; ctx.font = `700 ${w * 0.07}px ${MONO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('@', cx + w * 0.17, h * 0.93);
  ctx.fillStyle = '#d2a878'; ell(ctx, cx - w * 0.06, h * 0.84, w * 0.12, h * 0.04, 0.12); ctx.fill(); ell(ctx, cx + w * 0.05, h * 0.855, w * 0.1, h * 0.035, -0.1); ctx.fill();
}

window.Stage = Stage;
window.Painters = { hero, vitruvian, starry, wave, pearl, scream, wanderer, mona };