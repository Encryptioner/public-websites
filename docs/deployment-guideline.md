# Deployment Guideline

Everything operational about this hub: how it deploys, how to add a sub-site, how the URL structure works, how to preview locally. Public marketing content lives in `README.md` — this file is for contributors.

---

## 1. What this repo is

A **GitHub Pages umbrella** that hosts the built `dist/` of many small web apps under a single Pages deployment, so each sub-site's source code can stay private while the built app is public.

```
https://encryptioner.github.io/public-websites/                    ← home page (this repo)
https://encryptioner.github.io/public-websites/cgpa-calculator/    ← a sub-site
https://encryptioner.github.io/public-websites/<slug>/             ← any other sub-site
```

This repo contains **only built artifacts and a tiny static home page**. No build step, no `package.json`, no `node_modules`.

---

## 2. Repo layout

```
public-websites/
├── index.html               home page
├── style.css
├── app.js                   fetches sites.json, renders cards
├── 404.html                 fallback for unknown paths
├── sites.json               site manifest (edit when adding a site)
├── favicon.svg
├── README.md                public marketing
├── CLAUDE.md                rules for AI agents working in this repo
├── docs/
│   └── deployment-guideline.md   (this file)
├── .github/
│   ├── workflows/deploy.yml      push to master → Pages
│   └── FUNDING.yml
├── cgpa-calculator/         ← committed dist of cgpa-calculator
│   ├── index.html
│   ├── assets/
│   └── ...
└── <slug>/                  ← committed dist of any other sub-site
```

---

## 3. Branching

This repo intentionally uses **`master`** as its default branch (not `main`). The Pages workflow only triggers on push to `master`.

---

## 4. How a sub-site gets published

Each sub-site's repo owns its own release process. The flow:

1. **Source repo** builds with the correct base path (e.g. `VITE_BASE_PATH=/public-websites/<slug>/`).
2. Its `scripts/release.sh` `rsync`s `dist/` into `../public-websites/<slug>/`.
3. The script commits and pushes this repo with a message like `deploy: <slug> from <branch>@<sha>`.
4. The `master` push triggers `.github/workflows/deploy.yml`, which uploads the whole repo as the Pages artifact. **No build runs here.**

The hub repo never builds. It only stores and serves.

---

## 5. Adding a new sub-site

Three steps, mostly in the **source** repo:

### Step 1 — Make the source repo's bundler honor a base-path env var

Vite example:

```ts
// vite.config.ts
const base = process.env.VITE_BASE_PATH ?? '/';
export default defineConfig({ base, /* … */ });
```

Add these scripts to the source repo's `package.json`:

```json
"build:gh-pages":         "VITE_BASE_PATH=/<repo>/ pnpm build",
"build:public-websites":  "VITE_BASE_PATH=/public-websites/<slug>/ pnpm build",
"build:standalone":       "VITE_BASE_PATH=/ pnpm build",
"release":                "bash scripts/release.sh"
```

### Step 2 — Drop `scripts/release.sh` into the source repo

Use `cgpa-calculator/scripts/release.sh` as the template. Key env vars it understands:

| Var | Default | Purpose |
|-----|---------|---------|
| `SLUG` | repo dir name | Sub-folder under `public-websites/` |
| `DEPLOY_REPO` | `../public-websites` | Path to this hub repo |
| `DEPLOY_DIR` | `$DEPLOY_REPO/$SLUG` | Where the built dist lands |
| `VITE_BASE_PATH` | `/public-websites/$SLUG/` | Base path baked into the build |

It will:

- Verify both repos exist and are git-clean
- Build the source with the right base path
- `rsync --delete dist/ → public-websites/<slug>/` (safe — only touches one slug dir)
- Commit + push this repo with `deploy: <slug> from <branch>@<sha>`

### Step 3 — Add an entry to `sites.json` here

```json
{
  "slug": "<slug>",
  "name": "<Display Name>",
  "tagline": "<one-line description>",
  "description": "<longer description, optional>",
  "icon": "<slug>/icons/icon-192.png",
  "tags": ["pwa", "tool"],
  "source": "https://github.com/Encryptioner/<source-repo>"
}
```

Then run `pnpm release` (or `bash scripts/release.sh`) from the source repo. Done.

---

## 6. Sub-site deployment modes

The same sub-site source can build for any of these targets — only the base path differs:

| Mode | Build command | URL example |
|---|---|---|
| **Own GH Pages repo** | `VITE_BASE_PATH=/<repo>/ pnpm build` | `encryptioner.github.io/<repo>/` |
| **This hub** | `VITE_BASE_PATH=/public-websites/<slug>/ pnpm build` | `encryptioner.github.io/public-websites/<slug>/` |
| **Standalone / custom domain** | `VITE_BASE_PATH=/ pnpm build` | `my-domain.com/` |

The `VITE_BASE_PATH` env override is the linchpin that makes every sub-site portable across all three.

---

## 7. URL structure

| URL | Served file |
|---|---|
| `/public-websites/` | `index.html` (home — lists all sites from sites.json) |
| `/public-websites/<slug>/` | `<slug>/index.html` (the sub-site) |
| `/public-websites/<slug>/<anything>` | `<slug>/<anything>` |
| `/public-websites/<unknown>` | `404.html` |

### Path conventions inside files

- The home page (`index.html`, `style.css`, `app.js`) uses **relative paths** (`./sites.json`, `./style.css`, `./<slug>/`). Works at any base path — local, GH Pages, custom domain — without config.
- `404.html` uses **absolute paths** (`/public-websites/…`) because GitHub Pages serves it from any depth, where relative paths would resolve incorrectly.

---

## 8. Local preview

No build step. Serve the repo statically:

```bash
python3 -m http.server 8080
# then visit http://localhost:8080/
```

To preview a specific sub-site, navigate to `http://localhost:8080/<slug>/`. (Sub-sites built with `VITE_BASE_PATH=/public-websites/<slug>/` will load their assets from `/public-websites/<slug>/…`, which won't resolve at root. For local preview of one sub-site, mirror the path:)

```bash
mkdir -p _preview/public-websites && ln -sf "$(pwd)" _preview/public-websites/
cd _preview && python3 -m http.server 8080
# visit http://localhost:8080/public-websites/<slug>/
```

---

## 9. Deployment

| Trigger | Effect |
|---------|--------|
| Push to `master` | GitHub Action publishes the whole repo via Pages |
| Actions → "Deploy to GitHub Pages" → Run workflow | Manual redeploy with no commit |

**One-time GitHub setup:** Settings → Pages → Source = "GitHub Actions".

---

## 10. Don'ts

- **Don't run a build in this repo.** It serves files as-is.
- **Don't put a sub-site's source files here.** Only its `dist/` contents belong under `./<slug>/`.
- **Don't hand-edit files inside `./<slug>/`.** They're generated. Re-release from the source repo instead.
- **Don't `git push --force` to `master`.** Pages will redeploy whatever the head commit contains.
- **Don't add `package.json` or `node_modules`.** Zero npm deps by design.
