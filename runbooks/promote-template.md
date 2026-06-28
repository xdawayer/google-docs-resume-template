# Runbook — Promote a template draft to published (M7-7a)

Turns a content-complete `src/content/templates/{slug}.draft.md` into a live,
honest `{slug}.md`. The content (SEO copy, ATS checklist, guidance, bullets, FAQ,
body) is already authored; this runbook fills the EXTERNAL artifacts that cannot
be faked and must be real (T2 honesty, E2 "never a dead link").

Track progress per template with `pnpm gate:e2e` — each step below flips one
`·` (pending) to `✓`. Target: `release-ready 3/3`.

## Prerequisites (one-time)

- `.env` in the repo root with `GOOGLE_SA_KEY` set to a Drive-reader service
  account JSON (gitignored; loaded by `scripts/lib/auth.ts`). Verify with
  `pnpm shots:gen` — it must print "lock written", not "GOOGLE_SA_KEY not set".
- `pdftoppm` (poppler) installed for the screenshot rasterizer.

## Per-template steps

1. **Author the Google Doc.** Create the real resume template in the governed
   Workspace. Keep it single-column, standard headings, contact details in the
   body (never the page header), native Google fonts, original placeholder copy.
   This is the product — design it well.

2. **Share it.** Set link sharing to **Anyone with the link — Viewer** so the
   public `/copy` URL works, and so the Drive-reader SA can export it for the
   screenshot. (Anyone-reader already covers the SA.)

3. **Fill the source-of-truth fields** in `{slug}.draft.md`:
   - `docId` — the Doc id from its URL (`/document/d/<docId>/edit`).
   - `copyUrl` — `https://docs.google.com/document/d/<docId>/copy`.

4. **Screenshot (E6).** `pnpm shots:gen --slug {slug}` exports the Doc to PDF,
   rasterizes page 1, writes the WebP/PNG master + `src/data/screenshots.lock.json`
   (width/height/hash/modifiedTime). Set `revisionId` in the frontmatter to the
   lock entry's identity (or the Doc revision) so freshness checks have an anchor.

5. **Export QA.** `pnpm qa:export {slug}` exports PDF + DOCX and checks page
   count, extractable text, and expected section headings. Fix the Doc if it
   warns.

6. **Link health (E1/D2).** `pnpm check:links` probes the Doc via the Drive API
   and writes `data/copy_link_health.json`. Set `linkStatus: available` only
   after it reports healthy. `pnpm gen:gomap` then adds the `/go/{slug}` entry.

7. **ATS parse evidence (T2).** Run a real parse test — the minimum honest bar is
   a plain-text export that preserves section order; better is an upload to a real
   ATS (Workday/Greenhouse) with a screenshot. Add at least one `parseEvidence`
   entry `{ tool, testedAt, image?, note }`. Never invent a numeric score.

8. **Publish.** Set `status: published`, confirm `related` lists ≥2 sibling slugs,
   then rename `{slug}.draft.md` → `{slug}.md`.

9. **Validate.** `pnpm validate` must be green (the draft is now in the gate).
   `pnpm gate:e2e` should show the slug as `RELEASE-READY` (manual `○` export-QA
   and beacon checks still want `pnpm qa:export` + `pnpm e2e`).

## After all three are RELEASE-READY (gate:e2e 3/3)

- `pnpm verify` green → deploy.
- 7b indexation gate: submit the sitemap to GSC, request indexing on the hub +
  3 details, poll `gsc-monitor.ts`. Keep `SCALE_OK=0` until hub + ≥2 details
  report `Indexed`. Only then scale 3 → 24.

## Honesty guardrails (do not cross)

- No placeholder `docId`/`copyUrl` ever ships (`REPLACE_WITH_*` is rejected).
- `linkStatus: available` only after a real passing health check.
- No `parseEvidence` without a real parse test. No numeric ATS score, ever.
