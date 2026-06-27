# Deploying the roastbook

The site is a static Astro build. It hosts for free on **GitHub Pages**, and
**Sveltia CMS** (served at `/admin`) is the editor. There are two editing tiers —
pick based on how you want to write roasts:

| Tier | Edit how | Extra infra | Good for |
| --- | --- | --- | --- |
| **0 — Local** | Sveltia "Work with Local Repository" on your machine, then `git push` | None | A single author editing from their own (Chromium) browser |
| **1 — Hosted** | Sveltia at `https://<you>.github.io/<repo>/admin/`, from any browser | A GitHub OAuth App + a tiny Cloudflare Worker (both free) | Editing from anywhere; a few trusted collaborators |

Readers never need an account either way — the published site is public.

---

## What's already wired up

- **`.github/workflows/deploy.yml`** builds and deploys on every push to
  `main`/`master`. The base path and origin are detected from the repo at build
  time, so a fork at `you/your-roastbook` serves correctly at
  `https://you.github.io/your-roastbook/` with **no config edits**.
- **Base-path-safe links** — all internal links go through `withBase()`
  ([src/lib/url.ts](src/lib/url.ts)) or the rehype plugin in
  [astro.config.mjs](astro.config.mjs), so the site works at any sub-path.

---

## First deploy (this repo)

1. Create a **public** GitHub repo and push this code to it.
   (Public is required for free GitHub Pages; it also fits the "share it all" goal.)
2. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. Push to `main`/`master` (or run the workflow from the **Actions** tab). The
   site goes live at `https://<you>.github.io/<repo>/`.

That's the whole read-only deploy. Editing is below.

## Forking to run your own

1. **Fork** this repo (keep it public) on your own account.
2. Enable Pages as in step 2 above. Done — your copy is live at
   `https://<you>.github.io/<your-fork>/`, no file edits needed.
3. To edit roasts, set up Tier 0 or Tier 1 below.

---

## Tier 0 — local editing (no extra setup)

1. Clone your repo and run `pnpm install && pnpm dev`.
2. Open `http://localhost:4321/admin/` (or your base path) in a **Chromium**
   browser (Chrome / Edge / Brave — the File System Access API is Chromium-only).
3. Click **"Work with Local Repository"** and pick the repo root. Edits write
   straight to your working tree.
4. `git commit && git push` — the deploy workflow rebuilds the live site.

No OAuth, no repo backend, nothing to host. This is the simplest path for a solo
author and what the project recommends to start.

## Tier 1 — hosted `/admin` (edit from any browser)

Sveltia's GitHub backend commits via the GitHub API, which needs a GitHub OAuth
handshake. Because a static site can't hold an OAuth client secret, you deploy a
small relay once. (One-time, ~15 min, free.)

1. **Deploy the OAuth relay.** Use the Sveltia author's
   [`sveltia-cms-auth`](https://github.com/sveltia/sveltia-cms-auth) Cloudflare
   Worker (free tier). Follow its README to deploy to `*.workers.dev`.
2. **Create a GitHub OAuth App** (GitHub → Settings → Developer settings →
   OAuth Apps → New):
   - **Homepage URL:** your site URL.
   - **Authorization callback URL:** `https://<your-worker>.workers.dev/callback`.
   - Put the resulting **Client ID/Secret** into the Worker's secrets
     (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`), plus `ALLOWED_DOMAINS` =
     `<you>.github.io`.
3. **Point the CMS at your repo + relay.** In
   [scripts/emit-sveltia-config.ts](scripts/emit-sveltia-config.ts), set the
   `backend` block:
   ```ts
   backend: {
     name: "github",
     repo: "you/your-roastbook",
     branch: "main",            // your default branch
     base_url: "https://<your-worker>.workers.dev",
   },
   ```
   Then `pnpm sveltia:emit` and commit the regenerated `public/admin/config.yml`.
4. Visit `https://<you>.github.io/<repo>/admin/`, sign in with GitHub, and edit.

**Who can edit:** anyone with **write (push) access** to the repo — i.e. you, plus
any collaborators you add (each needs a GitHub account). Sveltia commits their
edits straight to the branch, which triggers a rebuild.

---

## Limits & gotchas (free tier)

- **Repo must be public** for free Pages. (Private Pages needs GitHub Pro, or
  move hosting to Cloudflare Pages — also free, supports private repos.)
- **Soft limits:** ~1 GB site, ~100 GB/month bandwidth, unlimited Actions
  minutes on public repos. A photo-and-text roastbook won't approach these.
- **One `username.github.io` user site per account**, but unlimited project
  sites (`username.github.io/<repo>`) — which is what a fork becomes. A custom
  domain (free HTTPS, ~$10/yr for the domain) drops the username and the sub-path
  entirely; set it in **Settings → Pages → Custom domain** and the build base
  auto-resolves to `/`.
- **Images** live in the repo (co-located with each roast). Keep them reasonably
  sized; avoid Git LFS (Pages doesn't serve it).
- **"Anyone can run their own"** = fork + the steps above. That's a
  developer-level task; it is *not* a one-click flow for non-technical users. A
  multi-tenant hosted version would be a different architecture (out of scope).
