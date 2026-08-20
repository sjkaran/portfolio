// ================================================================
// PORTFOLIO SCRIPT — Shubhrajit Karan
// Reads data.json, builds the page, then wires up the small
// interactive bits (typewriter, scroll reveal, active tab, mobile nav).
// ================================================================

async function loadPortfolio() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();

    buildHero(data);
    buildAbout(data.about);
    buildSkills(data.skills);
    buildProjects(data.projects);
    buildContact(data.contact);
    buildFooter(data.footer);

    startTypewriter(data.role);
    startScrollReveal();
    startActiveTab();
    startMobileNav();

  } catch (error) {
    console.error("Failed to load portfolio data:", error);
  }
}

// ----------------------------------------------------------------
// HERO
// ----------------------------------------------------------------
function buildHero(data) {
  document.getElementById("hero-name").textContent = data.name;
  document.getElementById("hero-bio").textContent = data.bio;
}

// ----------------------------------------------------------------
// TYPEWRITER — cycles through the role list in the hero terminal
// ----------------------------------------------------------------
function startTypewriter(roles) {
  const el = document.getElementById("typewriter");
  if (!roles || !roles.length) return;

  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  function tick() {
    const current = roles[roleIndex];

    if (isDeleting) {
      charIndex--;
    } else {
      charIndex++;
    }

    el.textContent = current.slice(0, charIndex);

    let delay = isDeleting ? 35 : 65;

    if (!isDeleting && charIndex === current.length) {
      delay = 1400;
      isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
      delay = 300;
    }

    setTimeout(tick, delay);
  }

  tick();
}

// ----------------------------------------------------------------
// ABOUT — docstring cell with dict-style stat chips
// ----------------------------------------------------------------
function buildAbout(about) {
  document.getElementById("about-description").textContent = about.description;

  const statsEl = document.getElementById("about-stats");
  about.stats.forEach(stat => {
    const chip = document.createElement("span");
    chip.className = "stat-chip";
    chip.innerHTML =
      `<span class="stat-key">${escapeHTML(stat.label)}:</span> ` +
      `<span class="stat-value">${escapeHTML(stat.value)}</span>`;
    statsEl.appendChild(chip);
  });
}

// ----------------------------------------------------------------
// SKILLS — grouped pill lists, one "skill-group" per category
// ----------------------------------------------------------------
function buildSkills(skills) {
  const container = document.getElementById("skills-container");

  skills.forEach(group => {
    const groupEl = document.createElement("div");
    groupEl.className = "skill-group";

    const heading = document.createElement("p");
    heading.className = "skill-category";
    heading.textContent = `# ${group.category}`;
    groupEl.appendChild(heading);

    const pillsEl = document.createElement("div");
    pillsEl.className = "skill-pills";
    group.items.forEach(item => {
      const pill = document.createElement("span");
      pill.className = "pill";
      pill.textContent = item;
      pillsEl.appendChild(pill);
    });
    groupEl.appendChild(pillsEl);

    container.appendChild(groupEl);
  });
}

// ----------------------------------------------------------------
// PROJECTS — file-listing cards
// ----------------------------------------------------------------
function buildProjects(projects) {
  const grid = document.getElementById("projects-grid");

  projects.forEach(project => {
    const card = document.createElement("article");
    card.className = "project-card";

    const slug = project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    const path = document.createElement("p");
    path.className = "project-path";
    path.textContent = `$ cat ${slug}.md`;
    card.appendChild(path);

    const title = document.createElement("h3");
    title.className = "project-title";
    title.textContent = project.title;
    card.appendChild(title);

    const desc = document.createElement("p");
    desc.className = "project-desc";
    desc.textContent = project.description;
    card.appendChild(desc);

    const tagsEl = document.createElement("div");
    tagsEl.className = "project-tags";
    (project.tags || []).forEach(tagText => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = tagText;
      tagsEl.appendChild(tag);
    });
    card.appendChild(tagsEl);

    const linksEl = document.createElement("div");
    linksEl.className = "project-links";

    if (project.github) {
      const a = document.createElement("a");
      a.href = project.github;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "→ source";
      linksEl.appendChild(a);
    }

    const liveUrl = resolveLiveLink(project);
    if (liveUrl) {
      const a = document.createElement("a");
      a.href = liveUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "→ live";
      linksEl.appendChild(a);
    } else if (project.live) {
      const note = document.createElement("span");
      note.className = "link-muted";
      note.textContent = project.live;
      linksEl.appendChild(note);
    }

    card.appendChild(linksEl);
    grid.appendChild(card);
  });
}

// Some entries store a real deployed URL under "Deployed Link"
// instead of "live" (which may hold "#" or a plain-text note).
function resolveLiveLink(project) {
  const candidates = [project["Deployed Link"], project.live];
  for (const value of candidates) {
    if (typeof value === "string" && /^https?:\/\//.test(value)) {
      return value;
    }
  }
  return null;
}

// ----------------------------------------------------------------
// CONTACT
// ----------------------------------------------------------------
function buildContact(contact) {
  document.getElementById("contact-intro").textContent = contact.intro;

  const emailEl = document.getElementById("contact-email");
  emailEl.textContent = contact.email;
  emailEl.href = `mailto:${contact.email}`;

  const linksEl = document.getElementById("contact-links");
  (contact.socials || []).forEach(social => {
    const a = document.createElement("a");
    a.className = "social-entry";
    a.href = social.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.innerHTML =
      `<span class="social-icon">${escapeHTML(social.icon || "•")}</span>` +
      `<span>${escapeHTML(social.label)}</span>`;
    linksEl.appendChild(a);
  });
}

// ----------------------------------------------------------------
// FOOTER
// ----------------------------------------------------------------
function buildFooter(footerText) {
  document.getElementById("footer-text").textContent = footerText;
}

// ----------------------------------------------------------------
// SCROLL REVEAL — fade/slide cell sections in once, on entry
// ----------------------------------------------------------------
function startScrollReveal() {
  const sections = document.querySelectorAll(".cell-section");
  if (!("IntersectionObserver" in window) || !sections.length) {
    sections.forEach(s => s.classList.add("in-view"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  sections.forEach(section => observer.observe(section));
}

// ----------------------------------------------------------------
// ACTIVE TAB — highlight the nav tab matching the section in view
// ----------------------------------------------------------------
function startActiveTab() {
  const tabs = Array.from(document.querySelectorAll(".nav-tabs .tab"));
  const sections = tabs
    .map(tab => document.querySelector(tab.getAttribute("href")))
    .filter(Boolean);

  if (!("IntersectionObserver" in window) || !sections.length) return;

  const setActive = (id) => {
    tabs.forEach(tab => {
      tab.classList.toggle("active", tab.getAttribute("href") === `#${id}`);
    });
  };

  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting);
    if (visible.length) {
      const topMost = visible.reduce((a, b) =>
        a.boundingClientRect.top < b.boundingClientRect.top ? a : b
      );
      setActive(topMost.target.id);
    }
  }, { rootMargin: "-40% 0px -50% 0px", threshold: 0 });

  sections.forEach(section => observer.observe(section));
}

// ----------------------------------------------------------------
// MOBILE NAV — toggle the tab list on small screens
// ----------------------------------------------------------------
function startMobileNav() {
  const toggle = document.getElementById("nav-toggle");
  const tabs = document.getElementById("nav-tabs");
  if (!toggle || !tabs) return;

  toggle.addEventListener("click", () => {
    const isOpen = tabs.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  tabs.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      tabs.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

// ----------------------------------------------------------------
// UTIL
// ----------------------------------------------------------------
function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

loadPortfolio();