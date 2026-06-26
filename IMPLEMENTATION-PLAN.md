# IMPLEMENTATION ROADMAP — Google Docs Resume Template (Astro static + edge functions, B-hybrid)

Repo: `/Users/wzb/Code/google-docs-resume-template` (keep `PRD.md`, `AUTOPLAN-REVIEW.md`; `demo.html` = UI reference only, never imported).

Reflects AUTOPLAN-REVIEW.md (29-task backlog, B-hybrid, all decisions) + 9 domain specs, with every valid adversarial-critique fix folded in. Single ordered, code-level, milestone-structured roadmap (M0..M7).

---

## Decisions & conflicts resolved (read first — these bind every milestone)

The 9 specs overlap and disagree in ~20 places. Resolved authoritatively:

1. **Content format = Markdown + YAML frontmatter (`.md`), NOT JSON.** data-schema's HCU/near-dup argument (T3/E5) is load-bearing: each detail page needs a unique long-form prose **body** that JSON can't carry. Scripts parse frontmatter with `gray-matter`; Astro uses the `glob()` loader + `render()`. Overrides the `.json` assumption in the scaffold, screenshot, testing, and sequencing specs.
2. **One identifier = `slug`.** Drop link-health's separate `template_id`. `/go/{slug}`, routes, and the data key all use `slug`. **All fields camelCase** (`copyUrl`, `docId`, `linkStatus`, `wordUrl`, `lastVerifiedAt`) — overrides link-health's snake_case.
3. **Schema lives once at `src/content/schema.ts`** (framework-agnostic, plain `zod`), imported by both `src/content.config.ts` and `scripts/`. **D10 and E7 are a single unified schema task — one field list, one naming convention (camelCase), no second "extend schema" task** (kills the `docId` vs `doc_id` / `linkStatus` vs `status` drift the two specs would otherwise cause). Image fields are **plain string paths** validated by the Node gate; components resolve them through an `import.meta.glob` asset map for `astro:assets`. Overrides the `image()`-in-collection approach (Node gate can't call `image()`).
4. **`/go/{slug}` = Cloudflare Pages Function** (`functions/go/[slug].ts`), not a static 302. The Eng review *requires* server-side click measurement + health-aware redirect (E2+E9) — a static file can't do either. **This means the deploy is "static pages + a thin edge function," NOT purely static**; the §5/§9 "low-risk static deploy" verdict holds for the page build but explicitly carves out the one `/go` edge function (and `/api/collect`) as the only server surface. `src/pages/go/[slug].astro` (meta-refresh + `<noscript>`) stays as the universal/no-JS fallback (CF Function takes precedence at the same path).
5. **Deploy = Cloudflare Pages** (primary; has Functions). Vercel kept as documented alternative only — ship one, delete the other before launch.
6. **Analytics = Plausible via first-party `/api/collect` proxy** (cookieless, ~1KB, no consent banner → no CLS). Drop CF Analytics Engine. The `/go` Function posts the independent server-side `copy_dispatch_server` signal to Plausible too. Frontend beacon endpoint is `/api/collect` (overrides frontend's `/api/e`).
7. **Honest measurement model (critical — do not overclaim E9).** Three signals, but they measure three *different* things and none of them measures a *successful copy*:
   - **Signal 1 — intent** (`copy_google_docs_click`, frontend `sendBeacon`): fires on click *before* the Google destination resolves. It proves intent, NOT success. It does **not** close the CTR-blindness gap on its own.
   - **Signal 2 — dispatch** (`copy_dispatch_server`, the `/go` edge function): proves the redirect was served and to what target.
   - **Signal 3 — liveness** (E1 health monitor): the **only** signal that detects a dead/unshared Doc. A successful "Make a copy" happens entirely on `docs.google.com` and is **unmeasurable** by design.
   Therefore **T6's "measure copy success" has no direct implementing task; its real proxy is the E1 health status (`served-good rate`)**. Every milestone and the DoD state this so nobody believes E9 closes the gap.
8. **The one island = vanilla TS** (`src/scripts/directory-island.ts`), NOT Preact. It only toggles `hidden` on pre-rendered DOM; it **never** re-renders the grid from a JS array (that would silently regress to the client-render failure D4/E4 exist to prevent). **Remove `@astrojs/preact`** from the scaffold.
9. **`/` 301-redirects to `/google-docs-resume-template/`** (head-URL decided now). The homepage **is** the collection page (CEO §0E head bet + Design's directory-first home); a separate `/` would self-cannibalize. The hub owns the exact-match head term; 301 funnels root equity. `trailingSlash:'always'` pinned in config alongside this. Overrides scaffold's "canonical home" and testing's "two distinct pages." No standalone home content.
10. **Freshness check (Drive API) is OFF the build path.** Conflict: screenshot spec put `shots:check` in `prebuild`; testing spec demands deterministic, network-free builds. A live Drive call at build makes the build non-deterministic (breaks the §9 determinism check) and couples every deploy to mutable Google state (a CSS-only change can't ship while a Doc is mid-edit). Resolution: `prebuild` runs only **offline** checks (schema, placeholder, dup-slug, asset existence, real-vs-declared dims via local `sharp`, canonical, related-refs). Drift detection runs in the nightly cron + a non-blocking CI step.
11. **E1 health probe = authenticated Drive API as the primary signal.** An unauthenticated HTTP/Playwright probe of `/copy` cannot distinguish "dead Doc" from "expected login/consent wall" → false positives. Primary signal is the **authenticated Drive API** (`files.get` existence + not-trashed + correct mime; `permissions.list` anyone-reader ACL). The logged-out `export?format=pdf` 200 and logged-out Playwright `/copy` checks are **corroborating only**, and **a login/consent wall counts as healthy** (never a false "dead").
12. **Standardized names:** Drive auth secret `GOOGLE_SA_KEY` (raw JSON) everywhere; health report `data/copy_link_health.json`; redirect map `functions/_data/go-map.json`; site origin `https://resumedocs.example` (no `www`); Node **22**.
13. **Copy CTA uses `target="_blank" rel="noopener"`** (analytics spec) so the source tab never unloads and the beacon is guaranteed.
14. **E12 enforced twice** (belt + suspenders): `scripts/e2e-gate.mjs` (readiness) + the `>3 && SCALE_OK!=1` block inside `validate-content.ts`.
15. **Re-prioritization (from critique):**
    - **E8 (governed single account) → P1.** A single Google account is a catalog-wide single point of failure — same severity class as the dead-link failure (E1). Promoted from P2.
    - **E11 split:** sitemap + robots + canonical **generation** → **P1** (launch-critical for a product whose only KPI is indexation, and E5's canonical *rules* depend on it — fixing a priority inversion). OG-image / JSON-LD niceties stay **P2**.
    - **T4 (distribution-first) and T5 (ATS-tool wedge) are DEFERRED candidates, NOT committed scope** (Premise Gate Outcome). They live in a deferred list with explicit decision gates, not in the committed backlog.
16. **Priority classes (critique #10) — "can't ship" ≠ "won't rank":**
    - **P1-SHIP** = code/build, has a CI gate that goes red. (E1–E7, E9, E11-core, E8, D1–D5, D10, D11-count, T2-schema/UI, T3-cap.)
    - **P1-LAUNCH** = strategy/content/process; gates *ranking or release readiness*, NOT the build; no CI gate. (T1 link acquisition, T6 metrics reset/dashboard, E12 depth-before-breadth process gate, original Doc authoring.)
    - **P2** = fast-follow, same branch.
    - **DEFERRED** = T4, T5 (decision-gated, may never be built).

---

## Dependency DAG (build this order — half the P1-SHIP items have hard build-order deps)

```
M0 scaffold/config (E4 SSG contract, trailingSlash, no-preact)
        │
        ▼
M1 D10+E7 unified schema  ──►  E3 build-validation gate  ◄── single source of truth
        │
        ├──────────────► M2 pipelines
        │                 ├─ E6 screenshot pipeline ─► D1 (UI consumes masters)
        │                 ├─ E8 governed account/lockdown (prereq for E1/E6 auth)
        │                 ├─ E1 health monitor (authenticated Drive API)
        │                 └─ E2 /go edge function ───────────────┐
        │                                                         │ (E9 needs E2)
        ▼                                                         ▼
M3 routing+SEO (E5 canonical ◄ depends on E11-core sitemap/robots/canonical gen;
        T3 role cap guard; D4 server render; D11 ItemList==cards)
        │
        ▼
M4 frontend (D1/D2/D3/D5 UI consume schema+health; the one vanilla-TS island)
        │
        ▼
M5 analytics (E9 sendBeacon ── ordered AFTER E2; T6 dashboard reads E1+Plausible)
        │
        ▼
M6 testing harness + CI + deploy (executable gate for every P1-SHIP item)
        │
        ▼
M7 E12 PROCESS GATE: 3 templates E2E ─► indexation proof ─► SCALE_OK=1 ─► 24 ─► ≤5 roles
        └─ T1/T4 growth start at 7a, run forever
```
Hard rule: no UI task (D1/D2/D3/D11) may read `thumbnailUrl`/`copyUrl`/`linkStatus` before M1 defines them; nothing scales to 24 before the M7 indexation gate flips `SCALE_OK=1`; E9 cannot be built before E2 exists.

---

## M0 — Tooling + Scaffold
**Goal:** Repo builds green with zero templates; all subsystem stubs, configs, conventions, and CI skeleton in place.

**Files create/modify:**
- Bootstrap: scaffold Astro `minimal` + TS strict into temp dir, `rsync --ignore-existing` to preserve docs, remove temp.
- `package.json` (full scripts block, `packageManager: pnpm@9.15.0`, `engines.node >=22`), `pnpm-lock.yaml`, `pnpm-workspace.yaml` (`onlyBuiltDependencies: [sharp]`).
- `astro.config.mjs`: `output:'static'`, `trailingSlash:'always'`, `build.format:'directory'`, `site` from `SITE_URL`, `@astrojs/sitemap` (filter `/go/`+`/404`), `vite.build.assetsInlineLimit:0`. **No preact.**
- `tsconfig.json` (extends `astro/tsconfigs/strict`, `noUncheckedIndexedAccess`, path aliases `@lib @components @data @/`, include `src scripts tests`).
- `src/lib/site.ts` (`SITE_URL='https://resumedocs.example'`, `BRAND`, `BASE='/google-docs-resume-template'`).
- Config: `.nvmrc`(22), `.prettierrc.json`, `.editorconfig`, `.gitignore`, `.env.example`, `vitest.config.ts` (uses `getViteConfig`, 80% thresholds), `playwright.config.ts` (`chromium` + `chromium-no-js` projects, `webServer: pnpm build && pnpm preview`).
- Deploy stubs: `public/_headers`, `public/_redirects`, `public/robots.txt` placeholder (prefer dynamic `robots.txt.ts` later).
- `.github/workflows/ci.yml` (skeleton: install → check → build → test → e2e), `link-health.yml`, `freshness.yml`, `gsc-monitor.yml` (cron skeletons, no logic yet).
- Empty stub dirs + `_shared`/lib stubs so other specs plug in: `src/lib/{slug,seo,jsonld,analytics,links,constants}.ts`, `scripts/_shared.ts`.
- `CONVENTIONS.md` + `CONTENT.md` (authoring SOP), `docs/account-governance.md` (E8 runbook), `data/.gitkeep`.

**Commands:**
```bash
pnpm create astro@latest gdrt-scaffold -- --template minimal --typescript strict --no-install --no-git --skip-houston
rsync -a --ignore-existing gdrt-scaffold/ google-docs-resume-template/ && rm -rf gdrt-scaffold
pnpm astro add sitemap --yes
pnpm add -D sharp@^0.34 vitest@^3 @vitest/coverage-v8@^3 playwright@^1.49 @playwright/test@^1.49 \
  fast-glob@^3.3 zod@^3.24 tsx@^4.19 gray-matter@^4 image-size linkinator@^6.1 cheerio \
  @axe-core/playwright @lhci/cli googleapis google-auth-library execa dotenv \
  prettier@^3.4 prettier-plugin-astro @types/node@^22
pnpm exec playwright install --with-deps chromium
pnpm build   # must succeed with 0 templates
```

**Acceptance / gating tests:** `pnpm build` green with 0 templates; `pnpm check` (types+astro+lint) passes; CI runs on PR. No test gate yet (no content).
**Task IDs:** E4 (SSG config contract, P1-SHIP), E8 (governance doc — promoted P1), E11-core (sitemap config + robots scaffold, promoted P1).
**Effort:** human ~2d / CC ~0.5d.

---

## M1 — Unified Data Schema + Build-Validation Gate
**Goal:** One Zod schema (D10+E7 merged) is the single source of truth; `pnpm build` FAILS on any bad content. No numeric ATS score can exist.

**Files:**
- `src/content/schema.ts` — full unified Zod schema (camelCase, **the only schema task — D10 and E7 collapse here**). Key rules: `slug` kebab regex; `copyUrl` must match `^https://docs.google.com/document/d/[A-Za-z0-9_-]{20,}/copy$` AND reject `REPLACE_WITH_`; `docId` regex; `.strict()` (bans `score`/`atsScore`/`status`/`doc_id` reappearing → T2 + naming-drift guard); `atsChecklist[]{id,label,status,detail}` + `parseEvidence[]` (NO numeric score); `linkStatus` enum default `unverified`; image fields as **string paths** + explicit `width/height` (CLS); `seo{title,metaDescription,canonical,ogImage,noindex}`; unique-content fields `faq[] bulletExamples[] sectionGuidance[]`; `related[]`; `.superRefine` (published ⇒ verified linkStatus, ≥1 parseEvidence unless visual-only, ≥2 related). Export `CANONICAL_ORIGIN='https://resumedocs.example'`, `TEMPLATE_PATH_PREFIX='/google-docs-resume-template'`.
- `src/content.config.ts` — `defineCollection({ loader: glob({pattern:'**/*.md', base:'./src/content/templates'}), schema: templateSchema })`.
- `scripts/_shared.ts` — loads `.md` via fast-glob + gray-matter, returns parsed frontmatter (used by gate + tests + other scripts).
- `scripts/validate-content.ts` — the gate (E3). **Offline only** (no network — keeps build deterministic): re-run Zod; slug↔filename agreement; duplicate slug/canonical/title/metaDescription; on-disk asset existence (thumbnail/og/parseEvidence images); real-vs-declared dims via `sharp`; canonical = `{origin}{prefix}/{slug}`; `related[]` referential integrity (exists + published); `>3 && SCALE_OK!=1` E12 block. Exits non-zero on any issue.
- `package.json`: `"prebuild": "tsx scripts/validate-content.ts"`, plus `astro:build:start` integration hook calling it (defense if `prebuild` bypassed).
- `tests/unit/schema.test.ts` + `tests/fixtures/bad-*.md` — negative fixtures (placeholder copyUrl, non-`/copy` URL, dup slug, missing image, `atsScore:95`, `doc_id` snake_case, wrong canonical, self-related).

**Commands:** `pnpm validate` (fails clean with line-itemed report), `pnpm test tests/unit/schema.test.ts`.
**Acceptance / gating tests:** A1–A10 from data-schema spec all pass (placeholder→fail, dup→fail, missing asset→fail, dim mismatch→fail, bad canonical→fail, orphan related→fail, unknown/snake_case key→fail, published-without-evidence→fail, filename≠slug→fail, 3 valid→pass). `schema.test.ts` is the CI gate.
**Task IDs:** D10+E7 (unified, P1-SHIP), E3 (P1-SHIP), T2 (schema-level no-score, P1-SHIP).
**Effort:** human ~1d / CC ~0.5d.

---

## M2 — Pipelines: Screenshot + Link-Health + `/go` Redirect
**Goal:** Doc→WebP screenshot pipeline (reproducible, freshness-pinned); scheduled link-health monitor off the deploy path; health-aware `/go/{slug}` edge function with server-side measurement; degraded CTA data wiring; governed account locked down.

**Files:**
- `scripts/lib/auth.ts` (service-account JWT, `GOOGLE_SA_KEY`, scope `drive.readonly`), `scripts/lib/drive.ts` (`files.export`→PDF, `sha256(pdf)`, revisionId, modifiedTime), `scripts/lib/render.ts` (`pdftoppm` first-page PNG @150dpi), `scripts/lib/image.ts` (`sharp` trim/normalize to 1600px US-Letter master + hash + dims), `scripts/lib/manifest.ts` (atomic write of `src/data/screenshots.lock.json`).
- `scripts/generate-screenshots.ts` (orchestrator, `--slug` for one), `scripts/check-freshness.ts` (drift gate — **cron/CI-only, NOT prebuild; keeps builds deterministic and decoupled from mutable Google state**), `scripts/check-assets.ts` (offline image-completeness — feeds E3, runs in prebuild).
- `src/assets/templates/{slug}.png` (masters, committed), `src/data/screenshots.lock.json` (committed).
- `src/components/TemplateThumbnail.astro` — `getImage()` AVIF+WebP srcset at 320/480/720/960, explicit `width/height`, `eager`/`fetchpriority=high` for first row (E10).
- Link-health: `scripts/check-links.ts` — **primary = authenticated Drive API** (`files.get` not-trashed + correct mime; `permissions.list` anyone-reader). Corroborating only: unauthenticated `export?format=pdf` 200, logged-out Playwright `/copy` (a login/consent wall = **healthy**, never "dead"). Writes `data/copy_link_health.json` with `consecutiveFailures`. `scripts/alert-health.mjs` (Slack/Resend). Exit 0 so report commits + degraded state ships.
- Redirect layer: `scripts/gen-go-map.mjs` (reads templates + health → `functions/_data/go-map.json`, drops placeholders), `functions/go/[slug].ts` (CF edge function: unknown→hub 302; healthy→`copyUrl` 302; unavailable→`/google-docs-resume-template/{slug}/?status=updating`; posts `copy_dispatch_server` to Plausible via `waitUntil`), `src/pages/go/[slug].astro` (static meta-refresh + `<noscript>` + sendBeacon fallback, **`noindex,nofollow`** — crawl hygiene), `functions/api/collect.ts` (Plausible proxy stub).
- `src/lib/health.ts` (`getHealth`, `assertNoPlaceholder` build-gate) + `src/components/CopyButton.astro`/`CtaButton.astro` (healthy → `/go/{slug}` `target=_blank rel=noopener` + data-attrs; unavailable+wordUrl → Word download; unavailable+no-word → disabled "being updated"). D2.
- `.github/workflows/link-health.yml` (cron `0 */6 * * *`, commits report), `freshness.yml` (cron `0 6 * * *`, opens issue on drift). Both install `poppler-utils`.
- `docs/account-governance.md` finalized (E8, promoted P1): Shared Drive org-owned, 2FA enforced, "Anyone with link: Viewer", SA = Viewer. **SPOF mitigation:** ownership on org-owned Shared Drive (not a personal account), documented recovery contact, ACL audit in the link-health cron.

**Commands:**
```bash
brew install poppler   # CI: apt-get install -y poppler-utils
pnpm shots:gen:one ats-classic-one-page
pnpm check:links        # writes data/copy_link_health.json
pnpm gen:gomap
```
**Acceptance / gating tests:** E6.1 (one-slug gen produces master+lock+fields), E6.2 (edit Doc → `check:freshness` fails STALE in cron/CI, not in prebuild), E1/L5 the-2am-test (unshare a Doc → authenticated Drive probe flips `unavailable`, alert fires, report commits; a login wall does NOT trip it), D2 snapshot (degraded CTA renders Word/disabled, never a Google link). `tests/e2e/go-redirect.spec.ts` **asserts redirect correctness**: healthy slug → 302 to exact `copyUrl`; unavailable → detail `?status=updating`; unknown → hub. Gates E2.
**Task IDs:** E6, E1, E2, D2 (P1-SHIP); E8 (promoted P1-SHIP/operational); E10 image-variant pipeline (P2).
**Effort:** human ~2-3d / CC ~1d.

---

## M3 — Routing + SEO Architecture
**Goal:** One route manifest drives every page; canonical graph resolved; static crawlable grid; JSON-LD from same source as cards; role pages capped at ≤5; sitemap/robots/canonical generated (P1).

**Files:**
- `src/lib/routes.ts` (route manifest: `getRoutableTemplates` = published + has master; `buildRouteManifest` for hub/detail/category/role with `indexable/changefreq/priority/lastmod/ogImage`; **T3 guards** — throw if >6 roles or any `trafficPotential<500`).
- `src/lib/seo-rules.ts` (`assertSlugIntegrity` — dup + reserved-word `category|role|go|og|api|robots.txt|sitemap` + malformed; `isCategoryIndexable` — explicit opt-in + ≥6 items + intro≥600chars + ≥3 FAQ → else `noindex,follow`).
- `src/lib/jsonld.ts` (`itemListSchema` with `numberOfItems===cards.length` → D11; `breadcrumbSchema`, `creativeWorkSchema` — no rating/score; `faqSchema`; `serializeJsonLd` with `</script>` escape).
- `src/components/Seo.astro` (title/desc/self-canonical from `Astro.url.pathname` only, robots, OG, twitter), `JsonLd.astro`, `Breadcrumbs.astro`.
- `src/components/TemplateGrid.astro` + `TemplateCard.astro` (**static render of ALL cards**, internal `<a href="/google-docs-resume-template/{slug}/">`, `data-categories/data-search`, CTA→`/go/{slug}`). D4 server half.
- Pages: `src/pages/google-docs-resume-template/index.astro` (hub — `cards` array feeds BOTH grid and ItemList), `[slug].astro` (detail `getStaticPaths`, renders `.md` body via `render()`, CreativeWork+Breadcrumb+conditional FAQPage), `category/[category].astro`, `role/[role].astro` (5 verified: software-engineer, data-analyst, project-manager, marketing, executive), `robots.txt.ts` (`Disallow: /go/` + sitemap), `404.astro` (noindex).
- Redirect config: `astro.config.mjs` `redirects` (dev), `public/_redirects` (CF 301: `/`→hub, plural/reversed variants→hub), `vercel.json` (alt).
- `scripts/gen-seo.ts` (prebuild: emits `src/generated/route-manifest.json` + `noindex-paths.json` + `seo-report.json` for T6), `scripts/check-canonical.ts`, `scripts/check-sitemap.ts` (post-build drift), `scripts/check-nojs-crawl.ts`.
- `package.json` `prebuild` final chain: `tsx scripts/gen-seo.ts && tsx scripts/gen-go-map.mjs && tsx scripts/validate-content.ts && tsx scripts/check-assets.ts && tsx scripts/check-canonical.ts`. `postbuild`: `tsx scripts/check-sitemap.ts`.

**Commands:** `pnpm build && node scripts/check-nojs-crawl.ts && node scripts/check-sitemap.ts`; `curl -sI` checks for 301s.
**Acceptance / gating tests:** E5 — every indexable page self-canonicals (trailing slash, correct host), variants 301 to hub, thin categories `noindex,follow` + absent from sitemap, no `?cat=` URLs. D11 — `ItemList.numberOfItems === .template-card count`. T3 — 6th role or `<500` fails build. E11-core — robots has `Disallow:/go/`+Sitemap, `check-sitemap` zero drift. Gated by `tests/unit/seo.test.ts`, `routes.test.ts`, `nojs-static.test.ts`.
**Task IDs:** E5, D4 (SSG render), T3 (cap), **E11-core (sitemap/robots/canonical gen — promoted P1-SHIP)** (P1-SHIP); D11, E11-extra (OG/JSON-LD niceties), T6 seo-report (P2).
**Effort:** human ~2d / CC ~1d.

---

## M4 — Frontend (Components, Island, A11y, Visual Identity)
**Goal:** Directory-first, document-forward UI; real screenshots; all interaction states; the one vanilla-TS island; full a11y; strategy-copy deleted.

**Files:**
- `src/styles/tokens.css` (DT2 paper/ink palette, serif display + system sans, sheet-shadow; **kill** gradient/glass/fake-score), `src/styles/global.css` (`:focus-visible` ring, `prefers-reduced-motion`, `.sr-only`, skip-link). D6/D12.
- `src/layouts/BaseLayout.astro` (head slot, skip-link), `src/components/Hero.astro` (DT1 one-band, no fake-doc art), `SiteHeader.astro` + `MobileNav.astro` (D8 hamburger `aria-expanded`), `FilterBar.astro` (D7 `aria-pressed` chips), `SearchBox.astro` (no `outline:none`), `TemplateCard.astro` (D1 real `<Image>` + doc-tab + FreshnessBadge + LinkStatusBadge), `TemplateGrid.astro` (`#resultCount` aria-live + `#emptyState`), `LinkStatusBadge.astro`, `CtaButton.astro` (E2/E9 data-attrs + `target=_blank`), `AtsChecklist.astro` (T2 checklist + parse-evidence image, no score), `PreviewModal.astro` (D5 single dialog).
- `src/scripts/directory-island.ts` — the ONE island: filter+search (**toggle `hidden` only, NEVER `innerHTML`/re-render on grid** — guards D4/E4), `aria-pressed` chips, live count, empty-state+reset, mobile nav (D8), modal focus trap/inert/restore (D5), copy `sendBeacon` capture-phase before nav (E9). Loaded once via single `<script>` import. `<noscript>` hides toolbar only.
- Delete D9 strategy copy; footer = non-affiliation notice only.

**Commands:** `pnpm dev`; greps: `grep -rn "innerHTML" src/` (only modalFacts, never grid), `grep -rn "floating-score\|ats_score\|atsScore\|/100" src/` (none), `grep -rn "outline: *none" src/styles` (only focus-visible guard), `grep -rn 'docs.google.com' src/components` (none).
**Acceptance / gating tests:** JS-off → all cards + internal links present, toolbar hidden. JS-on → filter/count/empty-state/reset, modal focus trap + Escape restore, copy beacon then nav. Gated by `tests/e2e/a11y.spec.ts` (axe zero violations, aria-pressed, modal trap, focus ring), `tests/e2e/directory-island.spec.ts` (**explicit D3 assertion: filter-to-zero shows `#emptyState`, reset restores full count; live `#resultCount` updates**), and `nojs-crawl.spec.ts`.
**Task IDs:** D1, D3, D5, D4 (frontend half) (P1-SHIP); D6, D7, D8, D9, E10 (CLS in components) (P2); DT1, DT2 (accepted taste).
**Effort:** human ~3-4d / CC ~1-1.5d.

---

## M5 — Analytics + Measurement
**Goal:** Three-signal measurement (intent / dispatch / liveness) — explicitly **not** a copy-success measure; GSC indexation monitor; T6 metric dashboard. E9 ordered strictly after E2.

**Files:**
- `src/lib/analytics/events.ts` (8-event contract + `TemplateEventProps`), `track.ts` (`sendBeacon` to `/api/collect`, text/plain Blob → no CORS preflight, keepalive-fetch fallback), `copy-click.ts` (dispatch-then-navigate; `_blank` path lets default open after beacon).
- `functions/api/collect.ts` (CF Plausible proxy, forwards UA + `CF-Connecting-IP`). The `/go` edge function already emits `copy_dispatch_server` (M2) — E9's server-side signal is **impossible without E2**, hence M5 follows M2.
- `scripts/gsc-monitor.ts` (URL Inspection API over `route-manifest.json`; report indexed / crawled-not-indexed / discovered-not-indexed; exit non-zero if crawled-not-indexed >20%; `searchanalytics.query` → `reports/gsc-performance.json`). `.github/workflows/gsc-monitor.yml` (weekly cron, off deploy path).
- T6 dashboard doc: reset targets each naming its measurement system. **Explicit caveat in the doc:** Signal 1 (`copy_google_docs_click`) = intent only and fires before the Google destination resolves; the *only* proxy for "served-good copy" is **Signal 3 = E1 health status**; a true successful copy on `docs.google.com` is unmeasurable. Composite KPIs: **served-good rate** (from E1) + **dead-click rate** (intent beacons against `unavailable` slugs) + **beacon-delivery ratio**.
- Wire `bindCopyClicks()` call into island after filter (already capture-phase).

**Commands:** `GSC_SA_KEY=… pnpm tsx scripts/gsc-monitor.ts`.
**Acceptance / gating tests:** `tests/e2e/copy-beacon.spec.ts` (intent beacon `copy_google_docs_click` observed with full payload before/independent of nav; routed through `/go`); `/api/collect`→202; GSC monitor writes report + exits non-zero at >20% crawled-not-indexed.
**Task IDs:** E9 (P1-SHIP); T6 metrics/dashboard (**P1-LAUNCH — doc + dashboard, no build gate**).
**Effort:** human ~1.5d / CC ~0.5d.

---

## M6 — Testing Harness + CI + Deploy
**Goal:** All gates wired into one build-blocking CI; perf/a11y budgets enforced; CF Pages deploy configured; scheduled monitors off the deploy path.

**Files:**
- Unit/static (Vitest + cheerio over `dist/`): `tests/unit/schema.test.ts`, `seo.test.ts` (single H1, globally-unique title+desc 70–160, self-canonical trailing-slash, OG file exists, every `<img>` width/height/alt, JSON-LD type + ItemList==cards), `nojs-static.test.ts` (Tier A: **ALL N cards present in raw HTML — not just the first row** — crawlable `<a>`, `<noscript>`, zero `docs.google.com`, `/go/{slug}` present, and grid markup is fully server-rendered), `routes.test.ts` (N detail pages + N `/go` artifacts + root files).
- E2E (Playwright): `nojs-crawl.spec.ts` (Tier B, `javaScriptEnabled:false`, asserts ALL cards visible + island absent), `copy-beacon.spec.ts`, `a11y.spec.ts`, `go-redirect.spec.ts` (redirect-correctness), `directory-island.spec.ts` (D3 empty-state).
- Perf: `budget.json` (script 40KB, image 320KB, total 500KB), `lighthouserc.cjs` (LCP<2000ms, CLS<0.05, perf≥0.95, seo=1, a11y=1).
- `.github/workflows/ci.yml` (final): install → `pnpm check` → content gate → build → **determinism check** (build twice, hash HTML, diff) → vitest → playwright → lhci → `postbuild`. Branch protection requires `build-and-gate`. `SCALE_OK` repo var gates E12. **Scheduled crons (link-health, freshness, gsc-monitor) are NOT required checks — off the deploy path** so external Google state never blocks an unrelated deploy.
- Deploy: finalize `public/_headers` (immutable cache for `/images /_astro`, security headers), `public/_redirects` (`/go/*` lines generated via `astro:build:done` hook, host canonicalization, `/`→hub), `robots.txt.ts`, `404.astro`. CF Pages: build `pnpm build`, output `dist`, `NODE_VERSION=22`, prod branch `main`, **edge functions deployed (`/go`, `/api/collect`)**. Post-deploy GSC sitemap submit. Delete the unused Vercel config.

**Commands:** `pnpm verify` (check+build+test+e2e); `pnpm lhci`; build-determinism diff.
**Acceptance / gating tests:** CI red on any: placeholder/dup/missing-asset (E3), non-deterministic build, JS-off crawl failure / missing card (E4), SEO/JSON-LD violation (E5/D11), missing intent beacon (E9), wrong `/go` redirect target (E2), zero-results empty-state failure (D3), LCP≥2s or CLS≥0.05 or JS>40KB (E10), axe violation/modal-trap failure (D5/D6/D7). Link-health + freshness + GSC crons run but are NOT required checks.
**Task IDs:** no new tasks — executable gate for E2, E3, E4, E5, E9, E10, E11-core, D3, D4, D5, D6, D7, D11.
**Effort:** human ~2d / CC ~0.5-1d.

---

## M7 — 3 Templates END-TO-END → Indexation Gate → Scale to 24 + Growth (the E12 process gate)
**Goal:** Prove the entire chain on 3 templates, prove indexation, THEN scale to 24, then ≤5 role pages; start the link engine on day 1 of this milestone. **E12 is a hard process gate that blocks every at-scale task (D1-at-scale, E6-at-scale, D11) — not a peer bullet.**

**Sub-phases (hard-gated):**
- **7a — 3 templates E2E.** Author originals in the governed Workspace (single-column, standard headings, contact in body, native fonts, original placeholder content) for `ats-classic-one-page`, `student-internship`, `software-engineer`. Per-template run the 10-point checklist via `scripts/e2e-gate.mjs`: clean Doc title, anyone-Viewer share, ATS parse test → `parseEvidence` image (T2), PDF/DOCX QA (`scripts/export-qa.mjs`), screenshot + revision hash (E6), unique `bulletExamples≥3`/`sectionGuidance`/`faq≥3` + unique `.md` body prose (HCU), `/go` resolves + `linkStatus:available` (E1/E2), intent beacon fires (E9), `pnpm validate` green. Scaffolder: `scripts/new-template.mjs` writes `{slug}.draft.md` (excluded by glob until promoted).
- **7b — Indexation proof gate.** Deploy 3; submit sitemap to GSC; URL-Inspect → Request Indexing on hub + 3 details. **Do not scale (SCALE_OK stays 0) until** hub + ≥2 details report `Indexed` (poll via `gsc-monitor.ts`). If "crawled-not-indexed," deepen content uniqueness before adding pages.
- **7c — Scale 3→24.** Set `SCALE_OK=1` **only after 7b passes** (the E12 validate-content block + e2e-gate enforce this twice). Batch-produce 21 more through the proven pipeline (PRD §6.3 mix). A template with no finished screenshot stays `*.draft.md`. Resubmit sitemap per batch of ~6; spot-check indexation. `e2e-gate.mjs` → `24/24 ready`.
- **7d — ≤5 role pages (T3).** Only after 7b + first links. Validate each `≥500 traffic potential` (Ahrefs `keywords-explorer-overview`) AND distinct from nearest detail page (E5 near-dup) → else `noindex` or skip. Log to `data/role-page-candidates.json`.
- **7e — Growth (P1-LAUNCH; starts at 7a, runs forever).** T1 link-acquisition runbook (`data/link-acquisition.json`, `pnpm links:report`, `runbooks/outreach-email.md`): Reddit feedback post + public Google Doc index (wk1), Product Hunt/SideProject launch (wk2), university/bootcamp career-center outreach 20/wk (.edu dofollow), HARO 5/wk, embed-with-attribution.
  - **DEFERRED candidates (not committed scope — decision-gated):** T4 distribution-first seeding — adopt only if organic indexation/traffic underperforms at day-45 review; if triggered, `data/distribution-log.json`, reuse E6 WebP for Reddit/Pinterest/YouTube/public Doc. T5 ATS-checker tool wedge — document-only decision gate at ~day 60 (`runbooks/T5-tool-decision.md`); build only if links underperform (<10 ref domains). Both remain DEFERRED per the Premise Gate Outcome and are excluded from launch scope.

**Commands:** `pnpm new:template …`, `pnpm qa:export {slug}`, `pnpm shots:gen`, `pnpm gate:e2e`, `pnpm links:report`.
**Acceptance / gating tests:** 7a — `gate:e2e` `3/3 ready` + `pnpm verify` green. 7b — hub+≥2 details `Indexed` in GSC. 7c — `24/24 ready`, sitemap 24 details, all `available`. 7d — ≤5 roles each ≥500 + distinct. 7e — ≥1 live link by 7a exit; day-30 ≥5 ref domains.
**Task IDs:** E12 (process gate, P1-LAUNCH), T2 real evidence (P1-SHIP at-scale), T3 author (P1-SHIP), T1 (P1-LAUNCH), T6 indexation proof (P1-LAUNCH); T4, T5 (DEFERRED).
**Effort:** human ~3-4d (3 E2E) + ~1.5-2wk (scale, authoring-bound) + ongoing links; CC ~1.5-2d build, authoring stays human. **Indexation wait = 7-21 days wall-clock (not work).**

---

## (a) TASK-ID COVERAGE MATRIX — all 29 placed (Class = ship-blocking vs launch-readiness vs deferred)

| Task | Class | Milestone(s) | Where |
|---|---|---|---|
| T1 link acquisition | P1-LAUNCH | M7 | 7e runbook + tracker (gates ranking, not shipping) |
| T2 ATS honesty | P1-SHIP | M1 (schema no-score) + M4 (AtsChecklist UI) + M7 (real evidence) |
| T3 cut role pages →≤5 | P1-SHIP | M3 (cap guard) + M7 (author 5) |
| T4 distribution-first | DEFERRED | M7 (7e decision gate, day-45) |
| T5 tool wedge eval | DEFERRED | M7 (7e decision gate, day-60) |
| T6 reset metrics | P1-LAUNCH | M3 (seo-report) + M5 (dashboard, doc) + M7 (indexation proof) |
| D1 real screenshots | P1-SHIP | M2 (pipeline) + M4 (TemplateCard) |
| D2 link health/degrade | P1-SHIP | M2 (health.ts + CopyButton) |
| D3 empty/loading/count | P1-SHIP | M4 (TemplateGrid + island) + M6 (directory-island.spec) |
| D4 SSG grid + noscript | P1-SHIP | M3 (server render) + M4 (island show/hide only) + M6 (ALL-cards test) |
| D5 modal a11y | P1-SHIP | M4 (PreviewModal + island) + M6 (a11y.spec trap) |
| D6 focus-visible/reduced-motion | P2 | M4 (global.css) |
| D7 aria-pressed + live count | P2 | M4 (FilterBar + island) |
| D8 mobile nav | P2 | M4 (MobileNav + island) |
| D9 delete strategy copy | P2 | M4 |
| D10 data schema | P1-SHIP | M1 (unified with E7) |
| D11 JSON-LD ItemList same source | P2 | M3 (jsonld.ts) + M6 (count test) |
| E1 link-health monitor | P1-SHIP | M2 (authenticated Drive API + cron) |
| E2 /go redirect | P1-SHIP | M2 (edge function + fallback) + M6 (go-redirect.spec) |
| E3 build gate | P1-SHIP | M1 (validate-content + prebuild) |
| E4 SSG contract | P1-SHIP | M0 (config) + M6 (no-JS ALL-cards tests) |
| E5 canonical graph | P1-SHIP | M3 (routes/seo-rules/redirects) |
| E6 screenshot pipeline | P1-SHIP | M2 |
| E7 schema extend | P1-SHIP | M1 (merged into D10 unified schema) |
| E8 governed account | P1-SHIP | M0 (doc) + M2 (lockdown, SPOF mitigation) — promoted from P2 |
| E9 analytics beacon | P1-SHIP | M5 (+ M4 island handler); ordered after E2 |
| E10 responsive images/CLS/budget | P2 | M2 (variant pipeline) + M4 (CLS dims) + M6 (lhci budget) |
| E11 sitemap/robots/canonical gen | P1-SHIP (core) | M0 (config) + M3 (gen-seo + robots.txt.ts + check-sitemap) — core promoted |
| E11 OG-image / JSON-LD niceties | P2 | M3 (Seo.astro OG + jsonld extras) |
| E12 depth-before-breadth | P1-LAUNCH | M7 (e2e-gate + SCALE_OK process gate; blocks at-scale tasks) |

All 29 placed. DT1/DT2 (accepted taste) land in M4. Re-prioritized vs original buckets: E8 P2→P1; E11 split (core→P1, niceties→P2); T1/T6/E12 reclassed P1-LAUNCH (gate ranking/release, not the build); T4/T5 → DEFERRED.

## (b) DEFINITION OF DONE FOR LAUNCH

**Ship-blocking (must be green to deploy):**
- [ ] `pnpm verify` green locally and in CI (types, astro check, content gate, canonical, lint, build, unit, e2e).
- [ ] Build-determinism check passes (two builds byte-identical); no network call on the build path.
- [ ] Content gate (E3) blocks placeholder / dup-slug / missing-asset / dim-mismatch / bad-canonical / orphan-related / numeric-score / snake_case key.
- [ ] No-JS crawl (E4): **ALL N cards** (not just first row) + internal `<a>` + `/go/{slug}` in raw HTML; zero `docs.google.com` hrefs; `<noscript>` present; island only show/hides pre-rendered DOM.
- [ ] Canonical graph (E5): `/`→hub 301, every indexable page self-canonicals (trailing slash), thin categories `noindex`, no `?cat=` URLs; sitemap zero drift; robots `Disallow:/go/`; `/go/*` `noindex,nofollow`.
- [ ] `/go/{slug}` (E2) edge function live and **redirect-correctness tested**: healthy→exact copyUrl, unavailable→detail `?status=updating`, unknown→hub; never a dead Google page.
- [ ] Link-health (E1, **authenticated Drive API primary**, login wall = healthy) + freshness + GSC monitors scheduled, off deploy path, alerting verified (the 2am test passes).
- [ ] Empty/zero-results state (D3) tested: filter-to-zero shows empty state, reset restores count; modal trap + focus-visible (D5/D6/D7); axe zero violations.
- [ ] Every listed template: real screenshot (D1), `linkStatus:available` (D2), transparent ATS checklist + real parse evidence, no fake score (T2), unique body prose.
- [ ] Intent beacon `copy_google_docs_click` fires before nav (E9) **and is documented as intent-only** (server `copy_dispatch_server` + E1 health are the served-good proxies; true copy success is unmeasurable).
- [ ] Lighthouse: LCP<2.0s, CLS<0.05, JS<40KB, perf≥0.95, SEO=1, a11y=1 (E10).
- [ ] Governed Workspace (E8): org-owned Shared Drive, 2FA, SA Viewer-only, SPOF recovery path documented.
- [ ] One deploy target shipped (CF Pages + edge functions), the other config deleted.

**Launch-readiness (gates ranking/release, not the build):**
- [ ] 3 templates pass `gate:e2e 3/3`; hub + ≥2 details `Indexed` in GSC before `SCALE_OK=1` (E12).
- [ ] T6 dashboard live (served-good / dead-click / beacon-delivery), each KPI naming its measurement system.
- [ ] ≥1 live backlink (T1).

## (c) REALISTIC TIMELINE (human-days vs CC-time)

| Milestone | Human (solo) | CC-assisted | Gate (depends on) |
|---|---|---|---|
| M0 tooling+scaffold | ~2d | ~0.5d | — |
| M1 unified schema+gate | ~1d | ~0.5d | M0 |
| M2 pipelines | ~2-3d | ~1d | M1 |
| M3 routing+SEO | ~2d | ~1d | M1 (E5 needs E11-core) |
| M4 frontend | ~3-4d | ~1-1.5d | M3 |
| M5 analytics | ~1.5d | ~0.5d | M4 (E9 needs E2 from M2) |
| M6 testing+CI+deploy | ~2d | ~0.5-1d | M2-M5 |
| M7a 3 templates E2E | ~3-4d (Doc authoring+ATS QA is the real cost) | ~1.5-2d build, authoring human | M6 |
| M7b indexation proof | **7-21d wall-clock (wait on Google)** | same — not work | M7a + sitemap |
| M7c scale 3→24 | ~1.5-2wk (authoring-bound, ~21 Docs × 20-30min) | ~1-1.5d build + human authoring | **M7b passed → SCALE_OK=1** |
| M7d ≤5 role pages | ~3-4d | ~0.5d + authoring | M7b + first links |
| M7e links (T1) / deferred T4,T5 | **ongoing, weekly forever** | CC drafts, humans send | starts M7a |

**Build shell (M0-M6): human ~2 weeks / CC ~5-6 days.** Critical-path truth: the bottleneck is NOT code — it is (1) human authoring + ATS-testing of original Docs, (2) the 1-3 week indexation wait, (3) link acquisition (slow, never "done"). Plan calendar time around those three, not around build time. Realistic 12-month on-domain organic ≈ 800-2,500/mo given the DR wall (per the dual-voice Ahrefs read), not the PRD's fantasy targets.
