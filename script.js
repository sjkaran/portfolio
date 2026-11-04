// ================================================================
// GALLERY SCRIPT — reads data.json, hangs the paintings, runs the viewer.
// Painters live in paintings.js (loaded first).
// ================================================================
'use strict';

const $ = (s, r = document) => r.querySelector(s);
function h(tag, cls, text) {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text != null) el.textContent = text;
  return el;
}
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

// Which masterpiece hangs where
const ART = {
  about:   { painter: 'vitruvian', title: 'Man of Proportions',          after: 'after Leonardo da Vinci, c. 1490', ratio: '4 / 5',   frame: 'gilt' },
  skills:  { painter: 'starry',    title: 'The Starry Stack',            after: 'after Vincent van Gogh, 1889',     ratio: '1 / 1.05', frame: 'walnut' },
  contact: { painter: 'mona',      title: 'The Smile That Replies',      after: 'after Leonardo da Vinci, c. 1503', ratio: '3 / 4.2', frame: 'gilt' },
  projects: [
    { painter: 'pearl',    after: 'after Johannes Vermeer, c. 1665', ratio: '3 / 4',   frame: 'gilt' },
    { painter: 'scream',   after: 'after Edvard Munch, 1893',        ratio: '4 / 3.4', frame: 'ebony' },
    { painter: 'wanderer', after: 'after Caspar David Friedrich, 1818', ratio: '3 / 4.3', frame: 'walnut' },
    { painter: 'wave',     after: 'after Hokusai, c. 1831',          ratio: '1 / 1',   frame: 'gilt' },
  ],
};

const works = {};          // id -> { art, title, build(infoEl) }
const masonry = $('#masonry');

// ---------------------------------------------------------------
// Build one framed painting "pin"
// ---------------------------------------------------------------
function addPin({ id, cat, art, title, blurb, tags, fill }) {
  const pin = h('article', 'pin'); pin.id = id; pin.dataset.cat = cat; pin.tabIndex = 0; pin.setAttribute('role', 'button');
  pin.setAttribute('aria-label', `Open ${title}`);
  const frame = h('div', `frame frame-${art.frame}`);
  const canvas = h('canvas'); canvas.style.setProperty('--ratio', art.ratio);
  frame.appendChild(canvas);
  const save = h('button', 'pin-save', 'Pin'); save.type = 'button'; save.setAttribute('aria-label', `Copy link to ${title}`);
  frame.appendChild(save); pin.appendChild(frame);

  const plaque = h('div', 'plaque');
  plaque.append(h('h3', null, title), h('p', 'after', art.after));
  if (blurb) plaque.appendChild(h('p', 'desc', blurb));
  if (tags && tags.length) { const t = h('div', 'tags'); tags.slice(0, 4).forEach((x) => t.appendChild(h('span', 'tag', x))); plaque.appendChild(t); }
  pin.appendChild(plaque);
  masonry.appendChild(pin);

  Stage.mount(canvas, Painters[art.painter]);
  works[id] = { art, title, fill };

  pin.addEventListener('click', () => openWork(id));
  pin.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openWork(id); } });
  save.addEventListener('click', (e) => {
    e.stopPropagation();
    const url = location.href.split('#')[0] + '#' + id;
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).catch(() => {});
    save.textContent = 'Pinned ✓'; setTimeout(() => (save.textContent = 'Pin'), 1600);
  });
  return pin;
}

function addTextPin({ id, cat, label, html }) {
  const pin = h('article', 'pin pin-text'); pin.dataset.cat = cat; pin.id = id;
  pin.append(h('span', 'label', label)); pin.appendChild(html); masonry.appendChild(pin);
  pin.style.cursor = 'default';
}

// ---------------------------------------------------------------
// Viewer dialog
// ---------------------------------------------------------------
const viewer = $('#viewer'), vCanvas = $('#viewer-canvas'), vInfo = $('#viewer-info'), vArt = $('.viewer-art');
let vItem = null;

function openWork(id) {
  const w = works[id]; if (!w) return;
  vArt.className = `viewer-art frame frame-${w.art.frame}`; vCanvas.style.setProperty('--ratio', w.art.ratio);
  vInfo.replaceChildren(h('h2', null, w.title), h('p', 'after', w.art.after));
  w.fill(vInfo);
  if (!viewer.open) viewer.showModal();
  if (vItem) Stage.unmount(vItem);
  vItem = Stage.mount(vCanvas, Painters[w.art.painter]);
  history.replaceState(null, '', '#' + id);
}
function closeViewer() { if (viewer.open) viewer.close(); }
viewer.addEventListener('close', () => { if (vItem) { Stage.unmount(vItem); vItem = null; } history.replaceState(null, '', location.pathname); });
$('#viewer-close').addEventListener('click', closeViewer);
viewer.addEventListener('click', (e) => { if (e.target === viewer) closeViewer(); });

const link = (text, href, cls) => { const a = h('a', cls || 'btn btn-ghost', text); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
const tagRow = (arr) => { const d = h('div', 'tags'); (arr || []).forEach((x) => d.appendChild(h('span', 'tag', x))); return d; };

// ---------------------------------------------------------------
// Hero typewriter
// ---------------------------------------------------------------
function typewriter(roles) {
  const el = $('#typewriter'); if (!roles || !roles.length) return;
  let ri = 0, ci = 0, del = false;
  (function tick() {
    const cur = roles[ri]; ci += del ? -1 : 1; el.textContent = cur.slice(0, ci);
    let d = del ? 35 : 70;
    if (!del && ci === cur.length) { d = 1500; del = true; } else if (del && ci === 0) { del = false; ri = (ri + 1) % roles.length; d = 350; }
    setTimeout(tick, d);
  })();
}

// ---------------------------------------------------------------
// Boot
// ---------------------------------------------------------------
async function boot() {
  Stage.mount($('#hero-canvas'), Painters.hero);
  let data;
  try { data = await (await fetch('data.json')).json(); }
  catch (err) {
    masonry.appendChild(h('p', 'note', 'Could not load data.json. Open this page through a local server (python -m http.server) or GitHub Pages — browsers block fetch() on file:// pages.'));
    return;
  }

  $('#hero-name').textContent = data.name;
  $('#hero-bio').textContent = data.bio;
  $('#footer-text').textContent = data.footer;
  typewriter(data.role);

  // ABOUT
  const a = ART.about;
  addPin({
    id: 'work-about', cat: 'about', art: a, title: a.title, blurb: data.about.description.split('. ')[0] + '.',
    fill(el) {
      el.appendChild(h('p', null, data.about.description));
      const row = h('div', 'stat-row');
      data.about.stats.forEach((s) => { const d = h('div', 'stat'); d.append(h('b', null, s.value), h('span', null, s.label)); row.appendChild(d); });
      el.appendChild(row);
    },
  });

  // PROJECTS (first one up front, quote pin after it)
  const projectPins = data.projects.map((p, i) => {
    const art = ART.projects[i % ART.projects.length];
    const titles = ['Girl with a Pearl Earring', 'The Scream', 'Wanderer Above the Sea of Fog', 'The Great Wave'];
    return { p, art, label: titles[i % titles.length] };
  });
  const addProject = ({ p, art, label }) => addPin({
    id: 'work-' + slug(p.title), cat: 'projects', art, title: p.title, blurb: p.description, tags: p.tags,
    fill(el) {
      el.appendChild(h('p', 'after', 'Hung as: ' + label));
      el.appendChild(h('p', null, p.description)); el.appendChild(tagRow(p.tags));
      const row = h('div', 'links');
      if (p.github) row.appendChild(link('View source', p.github));
      const live = [p['Deployed Link'], p.live].find((v) => typeof v === 'string' && /^https?:\/\//.test(v));
      if (live) row.appendChild(link('Open live', live, 'btn btn-gold'));
      else if (p.live && p.live !== '#') row.appendChild(h('p', 'note', p.live));
      el.appendChild(row);
    },
  });
  addProject(projectPins[0]);

  // QUOTE PIN
  const q = h('p', 'big'); q.append(document.createTextNode('“' + data.bio.replace(/\.$/, '') + '.”'));
  addTextPin({ id: 'quote', cat: 'about', label: 'Artist’s statement', html: q });

  projectPins.slice(1, 2).forEach(addProject);

  // SKILLS
  const s = ART.skills;
  addPin({
    id: 'work-skills', cat: 'skills', art: s, title: s.title, blurb: 'Every star is a tool I reach for.',
    fill(el) {
      data.skills.forEach((g) => { const d = h('div', 'legend'); d.appendChild(h('h4', null, g.category)); d.appendChild(tagRow(g.items)); el.appendChild(d); });
    },
  });
  // plaque legend (visible without opening)
  const sp = $('#work-skills .plaque');
  data.skills.forEach((g) => { const d = h('div', 'legend'); d.appendChild(h('h4', null, g.category)); d.appendChild(tagRow(g.items)); sp.appendChild(d); });

  projectPins.slice(2).forEach(addProject);

  // CONTACT
  const c = ART.contact;
  addPin({
    id: 'work-contact', cat: 'contact', art: c, title: c.title, blurb: data.contact.intro,
    fill(el) {
      el.appendChild(h('p', null, data.contact.intro));
      const m = h('a', 'email-big', data.contact.email); m.href = 'mailto:' + data.contact.email; el.appendChild(m);
      const row = h('div', 'links');
      (data.contact.socials || []).forEach((so) => row.appendChild(link(so.label, so.url)));
      el.appendChild(row);
    },
  });

  wireFilters(); wireReveal(); wireJumps();
  if (location.hash && works[location.hash.slice(1)]) setTimeout(() => openWork(location.hash.slice(1)), 300);
}

// ---------------------------------------------------------------
// Filters, reveal, jumps
// ---------------------------------------------------------------
function wireFilters() {
  const chips = [...document.querySelectorAll('.chip')];
  chips.forEach((chip) => chip.addEventListener('click', () => {
    chips.forEach((c) => c.classList.toggle('active', c === chip));
    document.querySelectorAll('.pin').forEach((p) => p.classList.toggle('hide', chip.dataset.filter !== 'all' && p.dataset.cat !== chip.dataset.filter));
  }));
}
function wireReveal() {
  const pins = [...document.querySelectorAll('.pin')];
  if (REDUCED || !('IntersectionObserver' in window)) { pins.forEach((p) => p.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.08 });
  pins.forEach((p, i) => { p.style.transitionDelay = (i % 3) * 90 + 'ms'; io.observe(p); });
}
function wireJumps() {
  document.querySelectorAll('[data-jump="contact"]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); document.querySelector('.chip[data-filter="all"]').click();
    $('#work-contact').scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth', block: 'center' });
    setTimeout(() => openWork('work-contact'), 500);
  }));
}

boot();