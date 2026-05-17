const grid = document.getElementById("grid");
const empty = document.getElementById("empty");
const search = document.getElementById("search");

let allSites = [];

async function loadSites() {
  try {
    const res = await fetch("./sites.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allSites = Array.isArray(data.sites) ? data.sites : [];
    render(allSites);
  } catch (err) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = `Failed to load sites.json: ${err.message}`;
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
    ? `<a href="${escapeAttr(site.source)}" rel="noopener" onclick="event.stopPropagation()">source</a>`
    : "";
  return `
    <li>
      <a class="card" href="${escapeAttr(siteUrl(site))}">
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

search.addEventListener("input", (e) => filter(e.target.value));

loadSites();
