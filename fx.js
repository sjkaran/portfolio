/* ================================================================
   FX LAYER — The Gallery of Code
   Pure decoration on top of script.js / paintings.js. Vanilla JS, no libraries.

   Rules this file follows:
   • It never edits the content script.js builds. It only adds classes, CSS
     variables and its own elements (ids/classes prefixed fx-).
   • Everything lives in one IIFE, so it cannot collide with the globals the other
     scripts declare ($, h, REDUCED, Mouse, Stage, Painters …).
   • Every feature is wrapped in attempt(): if one fails, the rest still run.
   • Effects are decorative layers (pointer-events: none) and never sit over inputs.
================================================================ */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const $ = (s, r = doc) => r.querySelector(s);

  const mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = mqReduce.matches;
  if (mqReduce.addEventListener) mqReduce.addEventListener('change', (e) => { reduce = e.matches; });
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode etc. */ } },
  };
  const attempt = (name, fn) => { try { fn(); } catch (err) { console.warn('[fx] ' + name + ' skipped:', err); } };
  const el = (tag, cls) => { const n = doc.createElement(tag); if (cls) n.className = cls; return n; };

  const viewer = $('#viewer');
  const masonry = $('#masonry');

  /* ------------------------------------------------------------
     THEME — dark (default) / light, remembered
  ------------------------------------------------------------ */
  let particles = null;
  function applyTheme(t, persist) {
    root.setAttribute('data-theme', t);
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'light' ? '#F6F0DF' : '#05100C');
    const btn = $('#theme-toggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(t === 'light'));
      btn.setAttribute('aria-label', t === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    }
    if (persist) store.set('gallery-theme', t);
    if (particles) particles.recolor();
  }
  attempt('theme', () => {
    applyTheme(root.getAttribute('data-theme') === 'light' ? 'light' : 'dark', false);
    const btn = $('#theme-toggle');
    if (!btn) return;
    btn.addEventListener('click', () => {
      root.classList.add('fx-theme-anim');
      applyTheme(root.getAttribute('data-theme') === 'light' ? 'dark' : 'light', true);
      setTimeout(() => root.classList.remove('fx-theme-anim'), 600);
    });
  });

  /* ------------------------------------------------------------
     PARTICLE NETWORK — drifts on its own, links to the cursor
  ------------------------------------------------------------ */
  attempt('particles', () => {
    const cv = el('canvas'); cv.id = 'fx-particles'; cv.setAttribute('aria-hidden', 'true');
    doc.body.insertBefore(cv, $('.wall-light') ? $('.wall-light').nextSibling : doc.body.firstChild);
    const ctx = cv.getContext('2d');
    const LINK = 135, MOUSE_R = 170;
    let w = 0, h = 0, dpr = 1, pts = [], rgb = '212,175,55', raf = 0;
    const mouse = { x: -9999, y: -9999, on: false };

    function recolor() {
      const v = getComputedStyle(root).getPropertyValue('--fx-rgb').trim();
      if (v) rgb = v.replace(/\s+/g, '');
      if (reduce) draw(0);               // static frame must pick up the new colour
    }
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth; h = window.innerHeight;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const target = Math.round(Math.min(95, Math.max(26, (w * h) / 17000)));
      while (pts.length < target) pts.push({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - .5) * .35, vy: (Math.random() - .5) * .35, r: 1 + Math.random() * 1.4 });
      if (pts.length > target) pts.length = target;
      pts.forEach((p) => { p.x = Math.min(p.x, w); p.y = Math.min(p.y, h); });
      if (reduce) draw(0);
    }
    function draw(step) {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        if (step) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          if (p.y < -10) p.y = h + 10; else if (p.y > h + 10) p.y = -10;
          if (mouse.on) {
            const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
            if (d < MOUSE_R && d > 0.1) { const f = (1 - d / MOUSE_R) * .9; p.x += (dx / d) * f; p.y += (dy / d) * f; }
          }
        }
        ctx.fillStyle = `rgba(${rgb},.55)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j], dx = a.x - b.x, dy = a.y - b.y, d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) { ctx.strokeStyle = `rgba(${rgb},${(1 - Math.sqrt(d2) / LINK) * .26})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        if (mouse.on) {
          const dx = a.x - mouse.x, dy = a.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < LINK * 1.25) { ctx.strokeStyle = `rgba(${rgb},${(1 - d / (LINK * 1.25)) * .5})`; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke(); }
        }
      }
    }
    function loop() {
      raf = requestAnimationFrame(loop);
      if (reduce || doc.hidden || (viewer && viewer.open)) return;    // idle while the modal viewer covers the page
      draw(1);
    }
    window.addEventListener('pointermove', (e) => { if (e.pointerType === 'touch') return; mouse.x = e.clientX; mouse.y = e.clientY; mouse.on = true; }, { passive: true });
    doc.addEventListener('mouseleave', () => { mouse.on = false; });
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    particles = { recolor };
    recolor(); resize(); loop();
  });

  /* ------------------------------------------------------------
     CARD SPOTLIGHT + GENTLE 3D TILT (mouse only)
     Tilt goes on the .frame (the .pin wrapper owns the reveal transform).
     Coordinates use layout offsets, which tilting does not change, so there is no jitter.
  ------------------------------------------------------------ */
  attempt('cards', () => {
    if (!masonry || !finePointer) return;
    let active = null, ev = null, raf = 0;
    const MAX = 6;   // degrees

    function reset(pin) {
      if (!pin) return;
      const f = pin.querySelector('.frame');
      if (f) { f.style.removeProperty('--rx'); f.style.removeProperty('--ry'); }
    }
    function apply() {
      raf = 0;
      if (!active || !ev) return;
      const pr = active.getBoundingClientRect();
      const frame = active.querySelector('.frame');
      if (frame) {
        const fx = pr.left + frame.offsetLeft, fy = pr.top + frame.offsetTop, fw = frame.offsetWidth, fh = frame.offsetHeight;
        const nx = (ev.clientX - fx) / fw, ny = (ev.clientY - fy) / fh;           // 0 … 1 across the frame
        active.style.setProperty('--sx', (nx * fw - 14).toFixed(0) + 'px');
        active.style.setProperty('--sy', (ny * fh - 14).toFixed(0) + 'px');
        frame.style.setProperty('--sx', (nx * fw - 14).toFixed(0) + 'px');
        frame.style.setProperty('--sy', (ny * fh - 14).toFixed(0) + 'px');
        if (!reduce) {
          const cx = Math.max(0, Math.min(1, nx)), cy = Math.max(0, Math.min(1, ny));
          frame.style.setProperty('--ry', ((cx - .5) * 2 * MAX).toFixed(2) + 'deg');
          frame.style.setProperty('--rx', ((.5 - cy) * 2 * MAX).toFixed(2) + 'deg');
        }
      } else {
        active.style.setProperty('--sx', (ev.clientX - pr.left).toFixed(0) + 'px');   // text pins: spotlight only
        active.style.setProperty('--sy', (ev.clientY - pr.top).toFixed(0) + 'px');
      }
    }
    masonry.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const pin = e.target.closest('.pin');
      if (pin !== active) { reset(active); active = pin; }
      if (!pin) return;
      ev = e; if (!raf) raf = requestAnimationFrame(apply);
    }, { passive: true });
    masonry.addEventListener('pointerleave', () => { reset(active); active = null; });
  });

  /* ------------------------------------------------------------
     CLICK RIPPLE (buttons, chips, theme toggle) — delegated, so it also covers
     the buttons script.js creates inside the viewer.
  ------------------------------------------------------------ */
  attempt('ripple', () => {
    doc.addEventListener('pointerdown', (e) => {
      if (reduce || !e.target.closest) return;
      const b = e.target.closest('.btn, .chip, .theme-toggle');
      if (!b) return;
      const r = b.getBoundingClientRect(), size = Math.max(r.width, r.height) * 2;
      const s = el('span', 'fx-ripple');
      s.style.width = s.style.height = size + 'px';
      s.style.left = (e.clientX - r.left - size / 2) + 'px';
      s.style.top = (e.clientY - r.top - size / 2) + 'px';
      b.appendChild(s);
      s.addEventListener('animationend', () => s.remove());
      setTimeout(() => s.remove(), 900);
    }, { passive: true });
  });

  /* ------------------------------------------------------------
     TOASTS (animated checkmark on success, shake on failure)
  ------------------------------------------------------------ */
  let toastBox = null;
  function toast(message, kind) {
    if (!toastBox) {
      toastBox = el('div'); toastBox.id = 'fx-toasts'; toastBox.setAttribute('role', 'status'); toastBox.setAttribute('aria-live', 'polite');
      doc.body.appendChild(toastBox);
    }
    const t = el('div', 'fx-toast ' + (kind === 'err' ? 'err' : 'ok'));
    // static icon markup only; the message itself is inserted as text
    t.innerHTML = kind === 'err'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ring" cx="12" cy="12" r="9.5"/><path class="tick" d="M8.5 8.5l7 7M15.5 8.5l-7 7"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle class="ring" cx="12" cy="12" r="9.5"/><path class="tick" d="M7.5 12.5l3 3 6-6.5"/></svg>';
    const m = el('span'); m.textContent = message; t.appendChild(m);
    toastBox.appendChild(t);
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, 2600);
  }

  /* ------------------------------------------------------------
     CONFETTI — drawn into whatever is on top (the open <dialog> or the page),
     because a modal <dialog> sits in the top layer above ordinary page content.
  ------------------------------------------------------------ */
  function confetti(x, y, count) {
    if (reduce) return;
    const host = $('dialog[open]') || doc.body;
    const cv = el('canvas', 'fx-confetti'); cv.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = window.innerWidth, H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    host.appendChild(cv);
    const ctx = cv.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const palette = ['#D4AF37', '#F2DE9B', '#F7E7CE', '#1A8A5E', '#0F5A3C', '#4F6BFF', '#E0482B'];
    const n = count || 90;
    const bits = Array.from({ length: n }, () => {
      const a = -Math.PI / 2 + (Math.random() - .5) * 2.3, s = 5 + Math.random() * 8;
      return { x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, w: 5 + Math.random() * 6, h: 3 + Math.random() * 4, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .4, c: palette[(Math.random() * palette.length) | 0], life: 0 };
    });
    const t0 = performance.now();
    (function frame(now) {
      const t = now - t0;
      ctx.clearRect(0, 0, W, H);
      for (const b of bits) {
        b.vy += .26; b.vx *= .992; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save(); ctx.globalAlpha = Math.max(0, 1 - t / 2600);
        ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      }
      if (t < 2600) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }

  attempt('celebrations', () => {
    // "Pin" button → copy-link toast + a small burst from the button
    doc.addEventListener('click', (e) => {
      const save = e.target.closest && e.target.closest('.pin-save');
      if (!save) return;
      const r = save.getBoundingClientRect();
      if (navigator.clipboard) { toast('Link to this work copied', 'ok'); confetti(r.left + r.width / 2, r.top + r.height / 2, 46); }
      else toast('Could not copy — use the address bar', 'err');
    }, true);   // capture phase: script.js stops propagation on this button
    // Contact work opened → one celebratory burst (script.js fills #viewer-info, then opens the dialog)
    const info = $('#viewer-info');
    if (info) new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType === 1 && (n.matches('.email-big') || n.querySelector('.email-big'))) {
          setTimeout(() => confetti(window.innerWidth / 2, window.innerHeight * .34, 110), 250);
          return;
        }
      }
    }).observe(info, { childList: true });
  });

  /* ------------------------------------------------------------
     COUNT-UP + POP on the About stats (they are rebuilt only when the viewer opens)
  ------------------------------------------------------------ */
  attempt('countup', () => {
    const info = $('#viewer-info');
    if (!info) return;
    function run(b) {
      if (b.dataset.fx) return; b.dataset.fx = '1';
      const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(b.textContent.trim());
      if (!m || reduce) return;
      const pre = m[1], end = parseFloat(m[2]), dec = (m[2].split('.')[1] || '').length, suf = m[3];
      const t0 = performance.now(), dur = 1100;
      b.textContent = pre + (0).toFixed(dec) + suf;
      (function tick(now) {
        const p = Math.min(1, (now - t0) / dur), k = 1 - Math.pow(1 - p, 3);
        b.textContent = pre + (end * k).toFixed(dec) + suf;
        if (p < 1) requestAnimationFrame(tick); else b.classList.add('fx-pop');
      })(t0);
    }
    new MutationObserver((muts) => {
      for (const m of muts) for (const n of m.addedNodes) {
        if (n.nodeType !== 1) continue;                       // our own text updates add text nodes only
        if (n.matches('.stat b')) run(n); else n.querySelectorAll('.stat b').forEach(run);
      }
    }).observe(info, { childList: true, subtree: true });
  });

  /* ------------------------------------------------------------
     SCROLL PROGRESS BAR + BACK-TO-TOP WITH PROGRESS RING
  ------------------------------------------------------------ */
  attempt('scroll', () => {
    const bar = el('div'); bar.id = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
    const top = el('button'); top.id = 'fx-top'; top.type = 'button'; top.setAttribute('aria-label', 'Back to top');
    const C = 2 * Math.PI * 24;                               // ring radius 24 in a 52 box
    top.innerHTML = '<svg viewBox="0 0 52 52" aria-hidden="true"><circle class="ring-bg" cx="26" cy="26" r="24"/><circle class="ring-fg" cx="26" cy="26" r="24"/><path class="arrow" d="M26 33V20M20 25.5l6-6 6 6"/></svg>';
    doc.body.append(bar, top);
    const fg = top.querySelector('.ring-fg');
    fg.style.strokeDasharray = C.toFixed(2);
    let queued = false;
    function update() {
      queued = false;
      const max = root.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.transform = 'scaleX(' + p.toFixed(4) + ')';
      fg.style.strokeDashoffset = (C * (1 - p)).toFixed(2);
      top.classList.toggle('show', window.scrollY > 520);
    }
    window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    top.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }));
    update();
  });

  /* ------------------------------------------------------------
     HERO CUBE — eases toward the pointer on top of its own idle spin
  ------------------------------------------------------------ */
  attempt('cube', () => {
    const cube = $('#hero-cube');
    if (!cube || !finePointer) return;
    const tilt = cube.querySelector('.cube-tilt');
    let tx = -16, ty = 24, cx = -16, cy = 24, on = false, raf = 0;
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || reduce) return;
      ty = 24 + (e.clientX / window.innerWidth - .5) * 70;
      tx = -16 - (e.clientY / window.innerHeight - .5) * 50;
      if (!raf) raf = requestAnimationFrame(step);
    }, { passive: true });
    function step() {
      raf = 0;
      cx += (tx - cx) * .08; cy += (ty - cy) * .08;
      tilt.style.setProperty('--crx', cx.toFixed(2) + 'deg');
      tilt.style.setProperty('--cry', cy.toFixed(2) + 'deg');
      if (Math.abs(tx - cx) > .05 || Math.abs(ty - cy) > .05) raf = requestAnimationFrame(step);
    }
  });
})();
