# Deploy (Cloudflare Pages)

Primary target: **Cloudflare Pages** (chosen for first-class Pages Functions, which
`/go/[slug]` and `/api/collect` need — a pure static host can't do the health-aware
redirect + server-side dispatch signal).

## Project settings

- Framework preset: **Astro** (or None)
- Build command: `pnpm build`
- Build output directory: `dist`
- Node version: `22` (set `NODE_VERSION=22` env var)
- Production branch: `main`

## Functions

`functions/` deploys automatically as Pages Functions. `wrangler.toml` sets
`compatibility_flags = ["nodejs_compat"]`. Routes:

- `/go/:slug` → health-aware redirect (`functions/go/[slug].ts`)
- `/api/collect` → Plausible proxy (`functions/api/collect.ts`)

## Environment variables / secrets (dashboard)

- `SITE_URL` — production origin, e.g. `https://resumedocs.com` (no trailing slash)
- `PLAUSIBLE_DOMAIN`, `PLAUSIBLE_API_HOST` — analytics proxy target
- (CI / cron only, GitHub secrets — NOT Pages): `GOOGLE_SA_KEY`, `GSC_SA_KEY`, `SLACK_WEBHOOK_URL`

## Redirects & headers

`public/_redirects` (`/` → hub 301, host canonicalization) and `public/_headers`
(immutable cache for `/_astro/*` + `/images/*`, security headers) are picked up by
Pages automatically.

## Post-deploy

1. Submit `https://<origin>/sitemap-index.xml` in Google Search Console.
2. Verify `/go/<slug>` 302s to the real `/copy` link (not the static fallback) — confirms the function deployed.
3. Confirm `/robots.txt` disallows `/go/`.

## Scheduled monitors (NOT on the deploy path — Decision #10)

GitHub Actions, not Pages: `link-health.yml` (6h), `freshness.yml` (daily),
`gsc-monitor.yml` (weekly). They never gate a deploy.

> Vercel is a documented alternative (would need `/go` + `/api/collect` as Edge
> Functions and `vercel.json` rewrites). Ship one; delete the other's config.
