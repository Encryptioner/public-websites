# Design — "Showcase" section on the homepage

**Date:** 2026-07-28
**Status:** Approved (verbally) — proceeding to plan + implement
**Source content:** `portfolio-template/src/content/sliders/sliders-config.json` (separate private repo — copied, not referenced at runtime)

## 1. Goal

Add a new **homepage section** that presents curated career highlights, open-source projects, and articles as **cards in a filterable grid**. Reuses the public-websites design system (dark theme, tokens, `.card` language). NOT a slider/carousel (the source repo's UI is intentionally not copied).

## 2. Decisions (locked)

| Question | Decision |
|---|---|
| Where does it live? | **Homepage section** on `index.html` (between sites grid and the Any Page bonus panel) |
| Exclude "company"? | **Broad** — drop 11 `company`-tab items **+ 2 NovoDigital highlights** (professional work). 13 excluded total. |
| Layout | **Filter chips + responsive grid** |
| Section name | **"Showcase"** (umbrella; chips are Highlights / Projects / Articles) |
| File structure | **Split**: own `showcase.css` + `showcase.js` so `style.css`/`app.js` stay thin |

## 3. Data — `highlights.json` (new, hand-authored)

Parallel to `sites.json`. Hand-authored here (first-party content, like `sites.json` — NOT a sub-site dist). 34 items after exclusion.

```json
{
  "groups": [
    {"id":"highlights","label":"Highlights"},
    {"id":"projects","label":"Projects"},
    {"id":"articles","label":"Articles"}
  ],
  "items": [
    {"id":"graphical-highlights","title":"Graphical Highlights","group":"highlights",
     "category":"Visual","details":"Charts & Infographics",
     "description":"Visual portfolio metrics through charts and infographics",
     "image":"https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop&crop=center",
     "link":"https://encryptioner.github.io/career-highlights/"}
  ]
}
```

**Field mapping** from source item:
- `title` ← `title`
- `group` ← derived from `tabs[]`: `brief`→`highlights`, `personal`→`projects`, `blog`→`articles`
- `category` ← `category`
- `details` ← `details`
- `description` ← `hoverDescription`
- `image` ← `image`
- `link` ← `link`

**Counts:** Highlights 4 · Projects 19 · Articles 11 · All 34.

**Excluded (13):** `project-highlights-in-ND`, `yearwise-highlights-in-ND`, `biddaan-platform`, `ai-mate-platform`, `ft-education-platform`, `bd-gas`, `ai-mate-chatbot`, `order-genie-shopify`, `pixels-craft`, `second-line`, `daency`, `daily-stocks`, `bikribatta`.

## 4. Card design (`.card--media`)

Same tokens, border, radius, shadow, hover-lift as the site `.card`. Adds a banner image region:

```
┌──────────────────────────────┐
│        [ image 4:3 ]          │  lazy, decoding=async; hover zoom 1.03
├──────────────────────────────┤
│  Title            [ Category ]│  h3 + accent-soft pill (.tag style)
│  description (1–2 lines)      │
│  ──────────────────────────── │
│  details            Visit ↗   │  foot
└──────────────────────────────┘
```

- Whole card = `<a target="_blank" rel="noopener">` (links are external).
- Category pill reuses `.tag` styling (accent-soft bg).
- Image: `loading="lazy" decoding="async" width="400" height="300"` to prevent layout shift.

## 5. Filter chips

```
[ All 34 ] [ Highlights 4 ] [ Projects 19 ] [ Articles 11 ]
```

- Pill `<button>`s; active = `--accent` fill.
- Counts baked into label.
- Default active = **All**.
- `role="tablist"`/`role="tab"` + `aria-selected`. Native button focus (no roving tabindex — YAGNI).
- Filters only the showcase grid. The existing `#search` stays scoped to sites.

## 6. File structure (split — keep main files thin)

| File | Change | Notes |
|---|---|---|
| `highlights.json` | **new** | 34 items + groups manifest |
| `showcase.css` | **new** | `.showcase`, `.chips`/`.chip`, `.card--media`/`.card-media`/`.card-cat`, reduced-motion |
| `showcase.js` | **new** | ES module: `initShowcase()` — fetch, render, chip filter (delegation), analytics. Own local `escapeHtml`. |
| `index.html` | edit | 2nd `<link>` to `showcase.css`; `<section class="showcase">` markup (h2, sub, chips, grid, empty) |
| `app.js` | edit | `import { initShowcase } from "./showcase.js"` + one call. Nothing else. |
| `highlights.test.mjs` | **new** | node, no deps — data-integrity guard |

**CSS wiring:** `index.html` links `showcase.css` as a second `<link>` (parallel fetch). NOT `@import`-ed into `style.css` — avoids fetch-chain blocking; showcase is homepage-only, not shared.

**JS wiring:** `app.js` is a thin bootstrap. `showcase.js` owns all showcase logic + its own `escapeHtml` (7-line dup; extract to shared `escape.js` only if a 3rd consumer appears).

## 7. Placement in `index.html`

```
hero → <ul id="grid"> sites → <p id="empty"> → [ NEW <section class="showcase"> ] → <section class="bonus"> → footer
```

```html
<section class="showcase" aria-labelledby="showcase-title">
  <div class="showcase-head">
    <h2 id="showcase-title">Showcase</h2>
    <p class="showcase-sub">Broader work — open-source projects, writing, and career milestones.</p>
  </div>
  <div class="chips" id="showcase-chips" role="tablist" aria-label="Filter showcase"></div>
  <ul id="showcase-grid" class="grid" aria-live="polite"></ul>
  <p id="showcase-empty" class="empty" hidden>Nothing in this group.</p>
</section>
```

## 8. Analytics (per CLAUDE.md event discipline — `track()` only)

- `showcase_loaded` `{count, groups: ["highlights","projects","articles"]}`
- `showcase_filtered` `{group}`
- `showcase_card_clicked` `{id, group, position, host}` — `host` via `hostOf()` only; paths stay private.

Import `track`/`hostOf` from `./analytics.js`.

## 9. Responsive & accessibility

- Grid reuses `repeat(auto-fill, minmax(260px, 1fr))` → 4/3/2/1 cols.
- Chips wrap on narrow viewports.
- `prefers-reduced-motion`: kill hover lift + image zoom.
- Chips are real `<button>`s; `aria-selected`; showcase section labelled by `aria-labelledby`.

## 10. Testing — `highlights.test.mjs`

Node, no deps (matches `viewer-link.test.mjs` convention). Self-check asserts:
1. Every item has `id, title, group, category, details, description, image, link`.
2. No excluded id is present.
3. Every `groups[].id` has ≥1 item.
4. Every `link` is `http(s)://`.
5. Every `image` is `http(s)://` or `/`-relative.
6. `group` value is one of the declared `groups[].id`.

Run: `node highlights.test.mjs`.

## 11. Data-quality flags (from source, carried as-is)

1. **Overlap with sites grid:** ~10 "Projects" items (branchdiff, browser-ide, cloudnest, coding-challenges, building-management, fish-boat-game, linkedinify, …) also appear in the sites grid. **Intentional** — sites grid = "launch the app" (icon, internal link); Showcase = "about the work" (banner, category, external link). Different intent, different card.
2. **Placeholder links:** 6 blog items point to the same `dev.to/mir_mursalin_ankur` profile URL (custom-shell, bitbucket-mcp, google-sheets, engineering-newsletters, gmail-newsletters, pnpm). Carried as-is; fix upstream when real article URLs are available.

## 12. Out of scope (YAGNI)

- Roving-tabindex keyboard nav on chips (native button focus is enough).
- Shared `escape.js` util (2 consumers; dup is cheaper).
- Making `#search` also filter the showcase (separate concerns).
- Extracting showcase into its own route (user chose homepage section).
- Show-more / pagination (filter chips already scope the list).
