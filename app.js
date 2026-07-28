import { isHttpUrl, wireUrlField, DISABLED_REASON, TIP } from "./url-field.js";
import { buildViewerLink, linkFormat } from "./viewer-link.js";
import { track, hostOf } from "./analytics.js";
import { initShowcase } from "./showcase.js";

const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");

let allSites = [];
let shown = [];

async function loadSites() {
  try {
    const res = await fetch("./sites.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allSites = Array.isArray(data.sites) ? data.sites : [];
    render(allSites);
    track("sites_loaded", { site_count: allSites.length });
  } catch (err) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = `Failed to load sites.json: ${err.message}`;
    track("sites_load_failed", { error: String(err.message).slice(0, 100) });
  }
}

function siteUrl(site) {
  // Each subsite lives at ./<slug>/ relative to this hub
  return `./${encodeURIComponent(site.slug)}/`;
}

function initials(name) {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function cardHtml(site) {
  const tags = (site.tags || [])
    .map((t) => `<li class="tag">${escapeHtml(t)}</li>`)
    .join("");
  const iconNode = site.icon
    ? `<img src="${escapeAttr(site.icon)}" alt="" loading="lazy" />`
    : `<span>${escapeHtml(initials(site.name))}</span>`;
  const sourceLink = site.source
    ? `<a href="${escapeAttr(site.source)}" rel="noopener" data-source-of="${escapeAttr(site.slug)}" onclick="event.stopPropagation()">source</a>`
    : "";
  return `
    <li>
      <a class="card" href="${escapeAttr(siteUrl(site))}" data-slug="${escapeAttr(site.slug)}">
        <div class="card-head">
          <div class="card-icon">${iconNode}</div>
          <h2 class="card-title">${escapeHtml(site.name)}</h2>
        </div>
        <p class="card-tagline">${escapeHtml(site.tagline || site.description || "")}</p>
        ${tags ? `<ul class="tags">${tags}</ul>` : ""}
        <div class="card-foot">
          <span>Open →</span>
          ${sourceLink}
        </div>
      </a>
    </li>
  `;
}

function render(sites) {
  shown = sites;
  if (sites.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = sites.map(cardHtml).join("");
}

function filter(query) {
  const q = query.trim().toLowerCase();
  if (!q) return render(allSites);
  const matched = allSites.filter((s) => {
    const hay = [s.name, s.tagline, s.description, ...(s.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
  render(matched);
}

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[c]);
}

function escapeAttr(str) {
  return escapeHtml(str);
}

// ── Analytics ────────────────────────────────────────────────────────────────
// All wired by delegation on containers that exist from the start, so re-rendering
// the grid on every search keystroke can't leak listeners.

let searchTimer;
search.addEventListener("input", (e) => {
  filter(e.target.value);
  // Debounced: one event per finished query instead of one per keystroke.
  // The query text itself is sent — it's what visitors are looking for here,
  // and the field only ever holds site/tag names.
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    const q = e.target.value.trim();
    if (q) track("site_searched", { search_term: q.slice(0, 60), result_count: shown.length });
  }, 700);
});

grid.addEventListener("click", (e) => {
  const source = e.target.closest("a[data-source-of]");
  if (source) return track("source_link_clicked", { slug: source.dataset.sourceOf });
  const card = e.target.closest("a.card[data-slug]");
  if (card) {
    track("site_card_clicked", {
      slug: card.dataset.slug,
      position: [...grid.querySelectorAll("a.card")].indexOf(card) + 1,
      // Whether it was reached from a filtered list tells search-vs-browse apart.
      from_search: search.value.trim().length > 0,
    });
  }
});

document.querySelector("footer").addEventListener("click", (e) => {
  const a = e.target.closest("a[href^='http']");
  if (a) track("outbound_link_clicked", { host: hostOf(a.href), label: a.textContent.trim().slice(0, 40) });
});

loadSites();

// Showcase section — renders highlights/projects/articles as filterable cards.
initShowcase();

// Bonus · Any Page — same view/copy-link behavior as the any-page landing panel,
// wired via the shared ./url-field.js module.
const bonusForm = document.getElementById("bonus-form");
if (bonusForm) {
  const urlInput = document.getElementById("bonus-url");
  const viewBtn = document.getElementById("bonus-view");
  const copyBtn = document.getElementById("bonus-copy");

  document.getElementById("bonus-note-text").textContent = DISABLED_REASON;
  document.getElementById("bonus-hint").textContent = TIP;

  wireUrlField({
    input: urlInput,
    viewBtn,
    copyBtn,
    fieldNote: document.getElementById("bonus-note"),
    copyInputBtn: document.getElementById("bonus-copy-input"),
    clearBtn: document.getElementById("bonus-clear"),
    viewerBase: "./any-page/",
    context: "home",
  });

  bonusForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = urlInput.value.trim();
    if (!isHttpUrl(v)) return track("viewer_open_rejected", { context: "home" });
    track("viewer_opened", { context: "home", host: hostOf(v), link_format: linkFormat(v) });
    // Open in a new tab so the homepage stays put, matching any-page's own View button.
    window.open(buildViewerLink(v, "./any-page/"), "_blank", "noopener");
  });
}
