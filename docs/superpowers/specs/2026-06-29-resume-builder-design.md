# Resume Builder — design (2026-06-29)

## Context

The project shipped as an SEO directory of "Google Docs resume templates you copy."
The user asked to diversify (ref: wondercv.com/jianlimoban) and described a builder
flow: **user fills content (no styling) → picks a template → generates a resume →
exports PDF.** That is a resume _builder_, not the copy-a-Doc model.

## Decisions (user-approved)

1. **Relationship = Complement.** Keep the SEO content site as the traffic engine;
   add the builder as the conversion product. SEO pages rank and link to the builder.
   The Google-Docs "Copy" flow stays as one export option.
2. **Rendering = client-side + browser print-to-PDF.** Templates are print-optimized
   HTML/CSS; "Download PDF" uses the browser's native print (real selectable text →
   ATS-friendly). Zero backend, zero login, data in localStorage. Upgrade path to a
   server-side headless-Chrome `page.pdf()` later if pixel-perfect output is needed.

## MVP scope (YAGNI)

- Content schema (`src/builder/resume-schema.ts`, Zod): basics, summary, experience,
  education, skills. (projects/certs deferred.)
- 3 templates, all **single-column ATS-safe** (Classic / Modern accent / Compact) —
  diversity via type/spacing/colour, not multi-column, to keep the ATS promise honest.
  Two-column / heavily-designed templates are deferred and must carry an ATS warning.
- Client app at `/resume-builder/` (Astro + Svelte 5 island). SEO pages stay zero-JS;
  only this route ships the island.

## Architecture

- `resume-schema.ts` — content model + sample + localStorage load/save.
- `Sheet.svelte` — pure data→markup; variant prop selects the style; `[data-sheet]`
  is the print target.
- `Form.svelte` — bound inputs; add/remove repeatable items.
- `Builder.svelte` — state, autosave (`$effect`), template picker, Download PDF.
- `src/pages/resume-builder/index.astro` — app shell + global `@media print` that
  prints only `[data-sheet]` at A4/margin 0; indexable (canonical + og).

## Stack note

`@astrojs/svelte` must be pinned to **7.x** for Astro 5 — `astro add svelte` pulls
9.x (targets Astro 7) which breaks the island build (`astro-entry:*.svelte`
js_parse_error).

## Status

MVP built and verified in-browser (edit → live preview; switch template → restyle).
verify (42/42) + lint green.

## Next (not yet done)

- Per-template SEO page CTA "Build this online" → `/resume-builder?template=…`.
- Manual check of the actual print-to-PDF output across browsers.
- More templates + the wondercv-style taxonomy (by role/industry) once the core proves out.
- Optional: server-side render for premium fidelity.
