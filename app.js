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

// Bonus · Any Page — same view/copy-link behavior as the any-page landing panel.
const bonusForm = document.getElementById("bonus-form");
if (bonusForm) {
  const urlInput = document.getElementById("bonus-url");
  const viewBtn = document.getElementById("bonus-view");
  const copyBtn = document.getElementById("bonus-copy");
  const fieldNote = document.getElementById("bonus-note");
  const copyInputBtn = document.getElementById("bonus-copy-input");
  const clearBtn = document.getElementById("bonus-clear");
  const copyInputIcon = copyInputBtn.innerHTML;
  const checkIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

  const isHttpUrl = (s) => {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  };

  let touched = false;
  const syncButtons = () => {
    const v = urlInput.value.trim();
    const valid = isHttpUrl(v);
    viewBtn.disabled = !valid;
    copyBtn.disabled = !valid;
    fieldNote.hidden = !(touched && !valid);
    copyInputBtn.classList.toggle("show", v.length > 0);
    clearBtn.classList.toggle("show", v.length > 0);
  };
  urlInput.addEventListener("focus", () => {
    touched = true;
    syncButtons();
  });
  urlInput.addEventListener("input", syncButtons);
  syncButtons();

  clearBtn.addEventListener("click", () => {
    urlInput.value = "";
    urlInput.focus();
    syncButtons();
  });

  copyInputBtn.addEventListener("click", async () => {
    const v = urlInput.value.trim();
    if (!v) return;
    await navigator.clipboard.writeText(v);
    copyInputBtn.innerHTML = checkIcon;
    copyInputBtn.setAttribute("data-tip", "Copied!");
    setTimeout(() => {
      copyInputBtn.innerHTML = copyInputIcon;
      copyInputBtn.setAttribute("data-tip", "Copy");
    }, 1200);
  });

  bonusForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = urlInput.value.trim();
    if (isHttpUrl(v)) location.href = "./any-page/?url=" + encodeURIComponent(v);
  });

  copyBtn.addEventListener("click", async () => {
    const v = urlInput.value.trim();
    if (!isHttpUrl(v)) return;
    const link = new URL("./any-page/?url=" + encodeURIComponent(v), location.href).href;
    await navigator.clipboard.writeText(link);
    const original = copyBtn.textContent;
    copyBtn.textContent = "Copied!";
    copyBtn.disabled = true;
    setTimeout(() => {
      copyBtn.textContent = original;
      syncButtons();
    }, 1500);
  });
}
