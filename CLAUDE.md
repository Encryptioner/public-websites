# CLAUDE.md — public-websites

This repo is an **umbrella GitHub Pages site**. It hosts the built `dist/` of multiple independent sub-sites under one Pages deployment, so the source code of each sub-site can stay private while the built app is public.

Live: https://encryptioner.github.io/public-websites/

**Where things live:**
- `README.md` — **public marketing only** (project pitch + author/social links). No development or deployment info. Do not put internal/operational details here.
- `docs/deployment-guideline.md` — full deployment, branching, sub-site contribution, and URL-structure docs. **Read this before doing any operational work.**
- `CLAUDE.md` (this file) — agent rules for working in this repo.

## What's here (and what's NOT)

- **Here:** a static home page (`index.html` + `style.css` + `app.js`), a shared `panel.css` (tokens + `.panel` component, imported by `style.css` and linked directly by `any-page/`) and `url-field.js` (URL-field JS behavior, imported by both), `viewer-link.js` (the Any Page link format — build + parse), `analytics.js` (GA4 bootstrap + `track()`), a `sites.json` manifest, a `404.html`, and **committed `dist/` directories of each sub-site** at `./<slug>/`.
- **NOT here:** any sub-site source code, any build pipeline for sub-sites, any framework or node_modules. There is **no `package.json`**. There is **no build step**.

## Hard rules

1. **Never run a build in this repo.** It serves files as-is. If a sub-site needs rebuilding, that happens in the sub-site's own repo via its `scripts/release.sh`.
2. **Don't put a sub-site's source files here.** Only its `dist/` contents (the output of its build) belong under `./<slug>/`.
3. **Never modify files inside a `./<slug>/` directory by hand.** Those are generated artifacts. Edits will be overwritten on the next release. Fix the issue in the source repo and re-release.
4. **`sites.json` is the only manual entry point for adding/removing sites.** Keep it in sync with the actual `./<slug>/` directories.
5. **Push to `master` deploys.** GitHub Actions uploads the whole repo as the Pages artifact. Don't `git push --force` to `master`. This repo intentionally uses `master` as its default branch (not `main`).

## Adding a sub-site

The source repo's `scripts/release.sh` does the heavy lifting (build + rsync into `./<slug>/` + commit + push). All this repo needs:

- A new entry in `sites.json`
- The `./<slug>/` directory will arrive via the release script

## URL structure

| URL | Maps to |
|---|---|
| `/public-websites/` | `index.html` (home, lists all sites from sites.json) |
| `/public-websites/<slug>/` | `<slug>/index.html` (the sub-site) |
| `/public-websites/any-page/#<host>/<path...>` | `any-page/index.html` — **the default form** every View / Copy link produces (e.g. `any-page/#raw.githubusercontent.com/user/repo/.../index.html`). `https://` is assumed. Uses a **fragment**, not extra path segments, on purpose: a fragment is never sent to the server, so this is a request for the real `index.html` file on any host (GitHub Pages, Netlify, Live Server, `python -m http.server`, ...) — no server-specific 404/rewrite behavior required. Also stays readable in the address bar. |
| `/public-websites/any-page/?url=<encoded-url>` | `any-page/index.html` — fallback form, still read forever (old links keep working). Produced only when the target isn't `https://` (e.g. `http://localhost:5500/…`), which the fragment form can't round-trip since it drops the scheme. |
| `/public-websites/<unknown>` | `404.html` |

**`any-page/` is first-party, hand-authored** (like `index.html` / `404.html`) — NOT a generated sub-site dist and NOT a `sites.json` entry. Edit it directly here. The homepage links to it via its own "Bonus" panel (`.bonus` section in `index.html`) — not a `sites.json`-driven card.

`any-page/viewer.js` (+ `any-page/viewer.css`) holds the sandboxed-iframe rendering logic (fetch-with-CORS-proxy-race, `<base>` injection, corner controls) split out of `index.html`'s inline `<script>`/`<style>` for readability — `index.html` imports `renderViewer()`/`ICONS` from it. Single consumer today; not a shared-across-pages module like `panel.css`/`url-field.js` below.

These are shared between the homepage bonus panel and `any-page/index.html` so they can't visually or behaviorally drift apart — change them in one place, both pages pick it up:
- **`panel.css`** — tokens (`:root`), base resets, and the `.panel`/`.row`/`.actions`/`.hint`/`.field-note` component. `style.css` does `@import url("./panel.css")` for the homepage; `any-page/index.html` links `../panel.css` directly (skipping the grid/card/footer CSS it doesn't need). Only `any-page`'s own viewer-only chrome (corner controls, loading spinner) lives in its own `<style>`.
- **`url-field.js`** — `isHttpUrl()`, the `wireUrlField()` behavior (validation, clear/copy-in-field buttons, disabled-reason note, copy-link), and the shared `DISABLED_REASON`/`TIP` copy text. Both `app.js` and `any-page/index.html`'s inline `<script type="module">` import it (native ES modules, no bundler). Callers pass `viewerBase` (`"./any-page/"` from the homepage, `"./"` inside any-page) and a `context` label for analytics — they no longer pass a link builder.
- **`viewer-link.js`** — the single source of truth for the Any Page link format: `buildViewerLink(target, viewerBase)` (producer), `readViewerTarget(location)` (consumer), `linkFormat(target)` (which form it'll be). **Change the URL format here and nowhere else** — View buttons, Copy link, and the any-page target lookup all route through it. `viewer-link.test.mjs` (`node viewer-link.test.mjs`, no deps) covers the build→read round trip including the `http://` fallback and escaping.
- **`analytics.js`** — the only file that knows `MEASUREMENT_ID`, bootstraps `gtag.js` (injected at runtime, since there's no build step to paste a `<head>` snippet into), and exports `track(name, params)` + `hostOf(url)`. Tracking self-disables while the ID is still the `G-XXXXXXXXXX` placeholder. `track()` no-ops when gtag is blocked, so analytics can never break a page.

## File paths in home page

- Home page (`index.html`, `style.css`, `app.js`) uses **relative paths** (`./sites.json`, `./style.css`, `./<slug>/`). This makes it work at any base path — local, GH Pages, custom domain — with no config.
- `404.html` uses **absolute paths** (`/public-websites/…`) because GitHub Pages serves 404 from any path depth, where relative paths would resolve incorrectly.

## When working with Claude in this repo

- **Don't propose a build system, bundler, or framework migration.** Vanilla HTML/CSS/JS is intentional. The job is "simple static directory listing."
- **Don't touch files inside `./<slug>/`.** If a sub-site looks broken, the fix is in its source repo, not here.
- **Don't add `package.json` or `node_modules`.** This repo has zero npm dependencies by design.
- **Adding a site = edit `sites.json` only.** The actual dist arrives separately via the source repo's release script.
- **Image/icon references in `sites.json`** point into the slug directory (e.g. `cgpa-calculator/icons/icon-192.png`) — that path resolves because the dist is committed at that path.

## Analytics

- GA4 via `analytics.js` — **set `MEASUREMENT_ID` there** (currently the `G-XXXXXXXXXX` placeholder, which keeps tracking off). Sub-sites under `./<slug>/` have their own properties; this hub only reports its own hand-authored pages.
- **Never call `window.gtag`/`dataLayer` directly** — import `track()` from `analytics.js` so the disabled/blocked guards apply.
- **Privacy:** only the *hostname* of a pasted target URL is ever sent (`hostOf()`). A full Any Page URL can be private (unlisted gist, internal preview), so paths never leave the browser. Error strings are truncated to 100 chars.
- Events: home — `sites_loaded`, `sites_load_failed`, `site_searched`, `site_card_clicked`, `source_link_clicked`, `outbound_link_clicked`. Showcase & Blog — `showcase_loaded`, `showcase_filtered`, `showcase_card_clicked`, `blog_loaded`, `blog_card_clicked`, `section_toggled` (`section: "showcase" | "blog"`, `expanded`). Shared URL field — `url_field_engaged`, `url_field_cleared`, `url_field_copied`, `viewer_link_copied`, `viewer_opened`, `viewer_open_rejected` (all carry `context: "home" | "any_page"`). Any Page — `any_page_entered` (`mode`, `entry_format`), `page_rendered` (`via: direct|proxy`, `load_ms`, `redirected`), `page_render_failed`, `corner_toggled`, `corner_action`, `back_to_hub_clicked`. 404 — `not_found`, `not_found_recovered`.
- `page_view` is automatic from the `gtag("config", …)` call — don't send it by hand.

## CI / Deploy

- `.github/workflows/deploy.yml` runs on push to `master` and on manual dispatch.
- It does no build — it just uploads the whole repo as a Pages artifact and deploys.
- One-time GitHub setup: Settings → Pages → Source = "GitHub Actions".

## Local preview

```bash
python3 -m http.server 8080
# http://localhost:8080/
```

That's it. No installs, no watchers.
