# Manual Deployment to Cloudflare Pages

This guide covers deploying the app to **Cloudflare Pages** using the Direct Upload method (no Git integration required).

---

## Prerequisites

- A [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier is sufficient)
- Node.js installed locally
- Your `.env` file configured with all required keys

---

## Step 1 — Understand environment variable security

### How `VITE_*` variables work

Vite **bakes all `VITE_*` variables directly into the JavaScript bundle** at build time. This means:

- They are **plain-text readable** by anyone who opens browser DevTools → Sources.
- Setting them in Cloudflare's dashboard does **not** help for manual (direct upload) deployments — Cloudflare never runs a build, so it never reads those dashboard variables.
- For dashboard variables to take effect, you would need Git integration (Cloudflare runs `npm run build` on their servers).

### Key-by-key risk assessment

| Variable | Risk | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | None | Just a public URL |
| `VITE_SUPABASE_ANON_KEY` | None | Designed to be public; security is enforced by Supabase **Row Level Security (RLS)**, not by hiding this key |
| `VITE_OWM_API_KEY` | Low–Medium | Visible in bundle; mitigate by adding **domain/referrer restrictions** in your OpenWeatherMap account dashboard |
| `VITE_SITE_PASSWORD` | High | Password comparison runs in client-side JS — anyone can find the plain-text value in the bundle. This gate is a deterrent only, not real security. |

### Recommended mitigations

- **OpenWeatherMap key**: Log in to [openweathermap.org](https://openweathermap.org) → API keys → add an allowed domain (e.g. `*.pages.dev`). This makes the key useless on other domains even if someone copies it.
- **Site password**: Accept that it is not cryptographically secure. It deters casual visitors but not determined ones. Do not use it to protect truly sensitive data.
- **Supabase**: Ensure RLS policies are correctly configured so the anon key can only read — not write or delete — the `uv_melbourne_2024` table.

### Set your `.env` before building

```
VITE_OWM_API_KEY=your_openweathermap_key
VITE_SITE_PASSWORD=your_chosen_password
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> Do **not** commit `.env` to Git. It is already listed in `.gitignore`.

---

## Step 2 — Build the project

Run the production build from the project root:

```bash
npm run build
```

This produces a `dist/` folder containing the static site files.

---

## Step 3 — Create a Cloudflare Pages project (first time only)

1. Go to [https://dash.cloudflare.com](https://dash.cloudflare.com) and log in.
2. In the left sidebar, click **Workers & Pages**.
3. Click **Create** → **Pages** tab → **Upload assets**.
4. Enter a project name (e.g. `healthy-sunshine-melbourne`).
5. Click **Create project**.

---

## Step 4 — Upload the `dist/` folder

1. On the upload screen, drag and drop the entire **`dist`** folder onto the upload area, or click to browse and select all files inside `dist/`.
2. Click **Deploy site**.
3. Cloudflare will process the upload and give you a URL like `https://healthy-sunshine-melbourne.pages.dev`.

---

## Step 5 — Fix client-side routing (SPA support)

Because the app uses Vue Router (client-side routing), Cloudflare must redirect all 404s back to `index.html`.

Create a file at the project root called `public/_redirects` with this content:

```
/*    /index.html    200
```

Then rebuild and re-upload:

```bash
npm run build
```

Upload the new `dist/` folder again following Step 4.

> **Note:** The `public/` folder contents are automatically copied into `dist/` by Vite on every build.

---

## Step 6 — Subsequent deployments

For every future update:

1. Make your code changes.
2. Run `npm run build`.
3. Go to your Pages project in the Cloudflare dashboard.
4. Click **Create new deployment** → upload the new `dist/` folder.

---

## Cloudflare Pages Build Settings (Git integration)

If you connected a Git repository instead of uploading manually, use these settings in the Cloudflare Pages dashboard under **Settings → Build & deployments**:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `dist` |
| Deploy command | *(leave blank — Pages deploys automatically)* |
| Root directory | *(leave blank)* |
| Node.js version | `20` (set via `.node-version` file in repo root, **or** add environment variable `NODE_VERSION = 20` in dashboard) |

> **Do NOT set a deploy command.** `npx wrangler deploy` is for Cloudflare Workers, not Pages. Setting it here causes the build to fail.

**Environment variables for Git integration builds:**
Set your `VITE_*` variables under **Settings → Environment variables** in the Cloudflare dashboard. Cloudflare will inject them during the build step so they get baked into the bundle correctly — you do not need them in your local `.env` for this workflow.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `Error parsing file: vite.config.js` | `node:url` not supported on old Node | Fixed: changed to `url`; `.node-version` pinned to `20` |
| `Wrangler requires at least Node.js v20` / `Failed: error occurred while running deploy command` | Deploy command was set to `npx wrangler deploy` | Clear the **Deploy command** field in Pages settings — Pages does not need one |
| Blank page / 404 on refresh | Missing `_redirects` file | Complete Step 5 |
| "Could not load UV data" | `VITE_OWM_API_KEY` not set at build time | Set env var in Cloudflare dashboard (Git flow) or local `.env` (manual flow), rebuild |
| Supabase query fails | Wrong `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` | Check env vars, rebuild |
| Password gate fails | `VITE_SITE_PASSWORD` not set | Falls back to `sunshine2026`; set env var and rebuild |
| Old version still showing | Browser cache | Hard refresh with Ctrl+Shift+R |
