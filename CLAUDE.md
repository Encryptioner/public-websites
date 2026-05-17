# CLAUDE.md — public-websites

This repo is an **umbrella GitHub Pages site**. It hosts the built `dist/` of multiple independent sub-sites under one Pages deployment, so the source code of each sub-site can stay private while the built app is public.

Live: https://encryptioner.github.io/public-websites/

**Where things live:**
- `README.md` — **public marketing only** (project pitch + author/social links). No development or deployment info. Do not put internal/operational details here.
- `docs/deployment-guideline.md` — full deployment, branching, sub-site contribution, and URL-structure docs. **Read this before doing any operational work.**
- `CLAUDE.md` (this file) — agent rules for working in this repo.

## What's here (and what's NOT)

- **Here:** a static home page (`index.html` + `style.css` + `app.js`), a `sites.json` manifest, a `404.html`, and **committed `dist/` directories of each sub-site** at `./<slug>/`.
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
| `/public-websites/<unknown>` | `404.html` |

## File paths in home page

- Home page (`index.html`, `style.css`, `app.js`) uses **relative paths** (`./sites.json`, `./style.css`, `./<slug>/`). This makes it work at any base path — local, GH Pages, custom domain — with no config.
- `404.html` uses **absolute paths** (`/public-websites/…`) because GitHub Pages serves 404 from any path depth, where relative paths would resolve incorrectly.

## When working with Claude in this repo

- **Don't propose a build system, bundler, or framework migration.** Vanilla HTML/CSS/JS is intentional. The job is "simple static directory listing."
- **Don't touch files inside `./<slug>/`.** If a sub-site looks broken, the fix is in its source repo, not here.
- **Don't add `package.json` or `node_modules`.** This repo has zero npm dependencies by design.
- **Adding a site = edit `sites.json` only.** The actual dist arrives separately via the source repo's release script.
- **Image/icon references in `sites.json`** point into the slug directory (e.g. `cgpa-calculator/icons/icon-192.png`) — that path resolves because the dist is committed at that path.

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
