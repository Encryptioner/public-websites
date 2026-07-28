# Showcase Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Showcase" section to the homepage that renders curated highlights/projects/articles as filterable media-cards, matching the existing design system.

**Architecture:** New `highlights.json` data manifest (parallel to `sites.json`) + a split `showcase.css`/`showcase.js` module wired into `index.html`/`app.js`. No build, no framework — vanilla HTML/CSS/JS + native ES modules, reusing `panel.css` tokens and the `.card`/`.grid` language.

**Tech Stack:** Vanilla JS (ES modules), CSS (no preprocessor), JSON, Node for the data-integrity test only.

## Global Constraints

- **Never run a build, never add `package.json`/`node_modules`** — repo is served as-is.
- **`panel.css` tokens are the design system** (`--bg`, `--bg-card`, `--bg-elev`, `--border`, `--text`, `--text-dim`, `--accent`, `--accent-soft`, `--radius`, `--shadow`, `--max-w`). Reuse, don't redefine.
- **Analytics via `track()` from `./analytics.js` only** — never call `gtag`/`dataLayer` directly. Send `host` via `hostOf()`, never full URLs/paths.
- **HTML-escape all interpolated values** (`escapeHtml`/`escapeAttr`) — card data is hand-authored but escaping is defense-in-depth.
- **Relative paths** on the homepage (`./highlights.json`, `./showcase.css`, `./showcase.js`).
- **Git:** work on a feature branch `showcase/master/v1/highlights-section`. Commit per task. **Do NOT push** — push to `master` deploys to GitHub Pages.
- **Excluded company items (13):** `project-highlights-in-ND`, `yearwise-highlights-in-ND`, `biddaan-platform`, `ai-mate-platform`, `ft-education-platform`, `bd-gas`, `ai-mate-chatbot`, `order-genie-shopify`, `pixels-craft`, `second-line`, `daency`, `daily-stocks`, `bikribatta`.

---

## File Structure

| File | Responsibility |
|---|---|
| `highlights.json` (new) | Data manifest: `groups[]` + 34 `items[]` |
| `highlights.test.mjs` (new) | Node data-integrity self-check (no deps) |
| `showcase.css` (new) | `.showcase` section, `.chips`/`.chip`, `.card--media` variant |
| `showcase.js` (new) | ES module: `initShowcase()` — fetch, render, filter, analytics |
| `index.html` (modify) | 2nd `<link>` + `<section class="showcase">` markup |
| `app.js` (modify) | Import + call `initShowcase()` (one line each) |

**Item → group mapping:** source `tabs[]` → `brief`=`highlights`, `personal`=`projects`, `blog`=`articles`.

**Items by group (34 total):**
- `highlights` (4): `graphical-highlights`, `projectwise-personal-highlights`, `yearwise-personal-highlights`, `testimonials`
- `projects` (19): `branchdiff`, `browser-ide`, `cloudnest`, `coding-challenges`, `photo-watermark-remover`, `local-whisper`, `html-to-pdf-generator`, `markdown-to-slide`, `ccsh-shell`, `linkedinify`, `de-encrypt-hub`, `laravel-learning`, `django-learning`, `building-management`, `fish-boat-game`, `vue3-boilerplate`, `nestjs-typescript`, `personal-portfolio`, `text-bomb-chat`
- `articles` (11): `claude-code-blog`, `bd-software-industry-blog`, `software-business-models-blog`, `bd-dev-guide-blog`, `npm-package-blog`, `custom-shell-blog`, `bitbucket-mcp-blog`, `google-sheets-blog`, `engineering-newsletters-blog`, `gmail-newsletters-blog`, `pnpm-blog`

**Field values:** copy from source `/Users/ankur/Projects/side-projects/portfolio-template/src/content/sliders/sliders-config.json` — `title`←title, `category`←category, `details`←details, `description`←hoverDescription, `image`←image, `link`←link.

---

### Task 1: Data manifest + integrity test

**Files:**
- Create: `highlights.json`
- Test: `highlights.test.mjs`

**Interfaces:**
- Produces: `highlights.json` with shape `{ groups: [{id,label}], items: [{id,title,group,category,details,description,image,link}] }`

- [ ] **Step 1: Write the failing test**

Create `highlights.test.mjs`:

```js
// Data-integrity self-check for highlights.json. Run: node highlights.test.mjs
import { readFileSync } from "node:fs";

const data = JSON.parse(
  readFileSync(new URL("./highlights.json", import.meta.url), "utf8")
);
const items = Array.isArray(data.items) ? data.items : [];
const groups = new Set((Array.isArray(data.groups) ? data.groups : []).map((g) => g.id));

const REQUIRED = ["id", "title", "group", "category", "details", "description", "image", "link"];
const EXCLUDED = new Set([
  "project-highlights-in-ND", "yearwise-highlights-in-ND", "biddaan-platform",
  "ai-mate-platform", "ft-education-platform", "bd-gas", "ai-mate-chatbot",
  "order-genie-shopify", "pixels-craft", "second-line", "daency",
  "daily-stocks", "bikribatta",
]);
const EXPECTED = { highlights: 4, projects: 19, articles: 11 };
const isHttp = (s) => typeof s === "string" && /^https?:\/\//.test(s);

let failed = 0;
const fail = (m) => { console.error("FAIL:", m); failed++; };
const seen = new Set();

for (const it of items) {
  for (const k of REQUIRED) if (!it[k]) fail(`item "${it.id || "?"}" missing "${k}"`);
  if (!groups.has(it.group)) fail(`item "${it.id}" unknown group "${it.group}"`);
  if (EXCLUDED.has(it.id)) fail(`excluded id present: ${it.id}`);
  if (!isHttp(it.link)) fail(`item "${it.id}" link not http(s): ${it.link}`);
  if (!isHttp(it.image) && !String(it.image).startsWith("/"))
    fail(`item "${it.id}" image not http/relative: ${it.image}`);
  if (seen.has(it.id)) fail(`duplicate id: ${it.id}`);
  seen.add(it.id);
}
for (const g of data.groups || []) {
  if (!items.some((i) => i.group === g.id)) fail(`group "${g.id}" has no items`);
}
for (const [g, n] of Object.entries(EXPECTED)) {
  const got = items.filter((i) => i.group === g).length;
  if (got !== n) fail(`group "${g}" expected ${n} items, got ${got}`);
}

if (failed) { console.error(`\n${failed} check(s) failed`); process.exit(1); }
console.log(`OK — ${items.length} items across ${data.groups.length} groups`);
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/ankur/Projects/side-projects/public-websites && node highlights.test.mjs`
Expected: FAIL (cannot read `highlights.json` — file does not exist).

- [ ] **Step 3: Create `highlights.json`**

Build the manifest with `groups` (highlights/projects/articles) and all 34 `items` per the File Structure section above, copying field values from the source `sliders-config.json`. Example item:

```json
{
  "id": "graphical-highlights",
  "title": "Graphical Highlights",
  "group": "highlights",
  "category": "Visual",
  "details": "Charts & Infographics",
  "description": "Visual portfolio metrics through charts and infographics",
  "image": "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center",
  "link": "https://encryptioner.github.io/career-highlights/"
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node highlights.test.mjs`
Expected: `OK — 34 items across 3 groups`

- [ ] **Step 5: Commit**

```bash
git add highlights.json highlights.test.mjs
git commit -m "feat: add highlights data manifest + integrity test"
```

---

### Task 2: Showcase styles

**Files:**
- Create: `showcase.css`

**Interfaces:**
- Produces: `.showcase`, `.showcase-head`, `.chips`/`.chip`, `.card--media`/`.card-media`/`.card-body`/`.card-top`/`.card-cat`/`.card-cta` classes (token-driven; depends on `panel.css` + `.card`/`.grid` from `style.css`).

- [ ] **Step 1: Create `showcase.css`**

```css
/* Showcase section — homepage-only. Tokens/base come from panel.css; grid +
   .card base come from style.css (both linked before this in index.html). */

.showcase { margin-top: 56px; }

.showcase-head { margin-bottom: 18px; }
.showcase-head h2 {
  margin: 0 0 6px;
  font-size: clamp(1.4rem, 2.5vw, 1.8rem);
  letter-spacing: -0.02em;
}
.showcase-sub {
  margin: 0;
  color: var(--text-dim);
  font-size: 0.95rem;
  line-height: 1.5;
}

/* Filter chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0 0 20px;
  padding: 0;
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: var(--bg-elev);
  color: var(--text-dim);
  font-size: 0.85rem;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 120ms, color 120ms, background 120ms;
}
.chip:hover { border-color: var(--accent); color: var(--text); }
.chip[aria-selected="true"] {
  background: var(--accent);
  border-color: var(--accent);
  color: #0b0d12;
  font-weight: 600;
}
.chip-count { font-size: 0.72rem; opacity: 0.8; }

/* Media card variant — banner image + body. Shares .card base from style.css
   (border, radius, shadow, hover lift). Override padding/gap so image is flush. */
.card--media { padding: 0; gap: 0; overflow: hidden; }
.card-media {
  aspect-ratio: 4 / 3;
  width: 100%;
  overflow: hidden;
  background: var(--bg-elev);
}
.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 200ms ease;
}
.card--media:hover .card-media img { transform: scale(1.04); }

.card-body {
  padding: 14px 16px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}
.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}
.card--media .card-title {
  font-size: 0.98rem;
  margin: 0;
  line-height: 1.25;
  font-weight: 600;
}
.card-cat {
  flex: 0 0 auto;
  font-size: 0.68rem;
  padding: 3px 8px;
  border-radius: 999px;
  background: var(--accent-soft);
  color: var(--accent);
  letter-spacing: 0.02em;
  white-space: nowrap;
}
.card--media .card-tagline {
  font-size: 0.86rem;
  margin: 0;
  line-height: 1.45;
  color: var(--text-dim);
  flex: 1;
}
.card--media .card-foot {
  margin-top: auto;
  padding-top: 4px;
  font-size: 0.8rem;
  color: var(--text-dim);
}
.card-cta { color: var(--accent); }

@media (prefers-reduced-motion: reduce) {
  .card--media:hover .card-media img { transform: none; }
  .card--media:hover { transform: none; }
}

@media (max-width: 480px) {
  .showcase { margin-top: 40px; }
}
```

- [ ] **Step 2: Commit**

```bash
git add showcase.css
git commit -m "feat: add showcase section styles (chips + media card)"
```

---

### Task 3: Showcase module

**Files:**
- Create: `showcase.js`

**Interfaces:**
- Consumes: `track`, `hostOf` from `./analytics.js`; `highlights.json`.
- Produces: `export async function initShowcase()` — fetches `./highlights.json`, renders chips + cards, wires filter + click analytics. No-op if `#showcase-grid` is absent.

- [ ] **Step 1: Create `showcase.js`**

```js
import { track, hostOf } from "./analytics.js";

const grid = document.getElementById("showcase-grid");
const chipsEl = document.getElementById("showcase-chips");
const empty = document.getElementById("showcase-empty");

let allItems = [];
let activeGroup = "all";
let groupMeta = [];

function escapeHtml(str) {
  return String(str ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[c]);
}
const escapeAttr = escapeHtml;

function cardHtml(it) {
  return `
    <li>
      <a class="card card--media" href="${escapeAttr(it.link)}" target="_blank"
         rel="noopener" data-id="${escapeAttr(it.id)}" data-group="${escapeAttr(it.group)}">
        <div class="card-media">
          <img src="${escapeAttr(it.image)}" alt="" loading="lazy" decoding="async"
               width="400" height="300" />
        </div>
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${escapeHtml(it.title)}</h3>
            <span class="card-cat">${escapeHtml(it.category)}</span>
          </div>
          <p class="card-tagline">${escapeHtml(it.description)}</p>
          <div class="card-foot">
            <span>${escapeHtml(it.details)}</span>
            <span class="card-cta">Visit ↗</span>
          </div>
        </div>
      </a>
    </li>`;
}

function render(items) {
  if (items.length === 0) {
    grid.innerHTML = "";
    empty.hidden = false;
    return;
  }
  empty.hidden = true;
  grid.innerHTML = items.map(cardHtml).join("");
}

function chipsHtml() {
  const all = [{ id: "all", label: "All" }, ...groupMeta];
  return all
    .map((g) => {
      const n = g.id === "all" ? allItems.length : allItems.filter((i) => i.group === g.id).length;
      return `<button class="chip" role="tab" aria-selected="${g.id === activeGroup}"
              data-group="${escapeAttr(g.id)}">${escapeHtml(g.label)}
              <span class="chip-count">${n}</span></button>`;
    })
    .join("");
}

function syncChips() {
  for (const c of chipsEl.querySelectorAll(".chip")) {
    c.setAttribute("aria-selected", String(c.dataset.group === activeGroup));
  }
}

function applyFilter() {
  const items = activeGroup === "all" ? allItems : allItems.filter((i) => i.group === activeGroup);
  render(items);
  syncChips();
}

export async function initShowcase() {
  if (!grid) return;
  try {
    const res = await fetch("./highlights.json", { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    allItems = Array.isArray(data.items) ? data.items : [];
    groupMeta = Array.isArray(data.groups) ? data.groups : [];
    activeGroup = "all";
    chipsEl.innerHTML = chipsHtml();
    applyFilter();
    track("showcase_loaded", {
      count: allItems.length,
      groups: groupMeta.map((g) => g.id),
    });
  } catch (err) {
    grid.innerHTML = "";
    empty.hidden = false;
    empty.textContent = `Failed to load highlights.json: ${err.message}`;
  }
}

// Chip filter — delegation.
chipsEl?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip[data-group]");
  if (!chip) return;
  activeGroup = chip.dataset.group;
  applyFilter();
  track("showcase_filtered", { group: activeGroup });
});

// Card clicks — delegation; position is index within currently-rendered grid.
grid?.addEventListener("click", (e) => {
  const card = e.target.closest("a.card--media[data-id]");
  if (!card) return;
  track("showcase_card_clicked", {
    id: card.dataset.id,
    group: card.dataset.group,
    position: [...grid.querySelectorAll("a.card--media")].indexOf(card) + 1,
    host: hostOf(card.href),
  });
});
```

- [ ] **Step 2: Commit**

```bash
git add showcase.js
git commit -m "feat: add showcase module (fetch, render, filter, analytics)"
```

---

### Task 4: Wire into homepage

**Files:**
- Modify: `index.html` (add stylesheet link + section markup)
- Modify: `app.js` (import + call)

**Interfaces:**
- Consumes: `initShowcase` from `./showcase.js`; `showcase.css`; `highlights.json`.

- [ ] **Step 1: Add stylesheet link in `index.html`**

In `<head>`, after line 12 (`<link rel="stylesheet" href="./style.css" />`), add:

```html
    <link rel="stylesheet" href="./showcase.css" />
```

- [ ] **Step 2: Add the showcase section in `index.html`**

Between the sites empty-state (`<p id="empty" class="empty" hidden>…</p>`, line 35) and the bonus section (`<section class="bonus" …>`, line 37), insert:

```html
      <section class="showcase" aria-labelledby="showcase-title">
        <div class="showcase-head">
          <h2 id="showcase-title">Showcase</h2>
          <p class="showcase-sub">
            Broader work — open-source projects, writing, and career milestones.
          </p>
        </div>
        <div class="chips" id="showcase-chips" role="tablist" aria-label="Filter showcase"></div>
        <ul id="showcase-grid" class="grid" aria-live="polite"></ul>
        <p id="showcase-empty" class="empty" hidden>Nothing in this group.</p>
      </section>
```

- [ ] **Step 3: Import + call in `app.js`**

Add to the import block at the top (after line 3):

```js
import { initShowcase } from "./showcase.js";
```

Near the bottom, after `loadSites();` (line 145), add:

```js

// Showcase section — renders highlights/projects/articles as filterable cards.
initShowcase();
```

- [ ] **Step 4: Commit**

```bash
git add index.html app.js
git commit -m "feat: wire showcase section into homepage"
```

---

### Task 5: Manual verification

No automated DOM test exists (no-deps repo, no DOM harness). Verify by eye.

- [ ] **Step 1: Start local server**

Run: `cd /Users/ankur/Projects/side-projects/public-websites && python3 -m http.server 8080`

- [ ] **Step 2: Visual + interaction check** — open `http://localhost:8080/` and confirm:
  - "Showcase" section renders below the sites grid, above the Any Page panel.
  - 34 cards in a responsive grid; chip counts: All 34 · Highlights 4 · Projects 19 · Articles 11.
  - Clicking each chip filters the grid; active chip is accent-filled.
  - Cards have banner images; hover lifts card + zooms image.
  - Card click opens `link` in a new tab.
  - Resize to mobile width (≈375px): grid → 1 col, chips wrap.

- [ ] **Step 3: A11y + console check**
  - Tab through chips — each is a focusable button with `aria-selected`.
  - DevTools → emulate `prefers-reduced-motion: reduce` → hover no longer lifts/zooms.
  - Console: no errors. (Analytics no-ops while `MEASUREMENT_ID` is the placeholder — that's expected.)

- [ ] **Step 4: Kill the server** — `Ctrl-C` (never leave a background process running).

- [ ] **Step 5: Final commit if any fixes were made**

```bash
git add -A
git commit -m "fix: showcase polish from manual review"
```

(Only if Step 2–3 surfaced fixes; otherwise skip.)

---

## Self-Review

**1. Spec coverage:**
- §3 data model → Task 1 ✓
- §4 media card → Task 2 (CSS) + Task 3 (HTML in `cardHtml`) ✓
- §5 filter chips → Task 2 (CSS) + Task 3 (`chipsHtml`/`applyFilter`) ✓
- §6 split files → Tasks 1–4 (separate files) ✓
- §7 placement → Task 4 Step 2 ✓
- §8 analytics → Task 3 (`showcase_loaded`/`showcase_filtered`/`showcase_card_clicked`) ✓
- §9 responsive/a11y → Task 2 (media queries, reduced-motion) + Task 5 (verify) ✓
- §10 test → Task 1 ✓
- §11 data-quality flags → carried in source data (overlap intentional, placeholder links as-is) ✓

**2. Placeholder scan:** none — all code blocks are complete implementations.

**3. Type consistency:** `initShowcase()` named identically in Task 3 (export) and Task 4 (import/call). DOM ids (`showcase-grid`, `showcase-chips`, `showcase-empty`) match across Task 4 markup and Task 3 `getElementById`. Group ids (`highlights`/`projects`/`articles`) match across Task 1 data, Task 1 test `EXPECTED`, and Task 3 filter. ✓
