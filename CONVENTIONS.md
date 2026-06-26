# Engineering conventions

- **Stack:** Astro static (`output: 'static'`), TypeScript strict, pnpm, Node 22+.
- **Content:** Markdown + YAML frontmatter under `src/content/templates/*.md`. The
  Zod schema in `src/content/schema.ts` is the single source of truth (D10+E7).
  All fields **camelCase**. Schema is `.strict()` — unknown keys (incl. a numeric
  ATS score, or snake_case drift) fail the build.
- **One identifier:** `slug`. Routes, `/go/{slug}`, and the data key all use it.
- **Rendering contract (E4/D4):** every template card and its internal detail
  link is server-rendered into static HTML and crawlable with JS off. The single
  client island (`src/scripts/directory-island.ts`) only toggles `hidden` on
  pre-rendered DOM — it MUST NOT re-render the grid from a JS array.
- **Trust (T2):** no numeric ATS scores anywhere. Use `atsProfile` +
  `atsChecklist` + real `parseEvidence`.
- **Copy links:** never derive a Google URL from a name. Store explicit `copyUrl`
  (validated `.../d/{id}/copy`); clicks route through `/go/{slug}`.
- **Build path is offline + deterministic.** No network calls in `build`/`prebuild`.
  Drive API calls (screenshots, link-health, freshness) run in scripts/crons only.
- **Paths:** `@lib/* @components/* @data/* @/*` (see tsconfig).
- **Commands:** `pnpm validate` (content gate), `pnpm build`, `pnpm test`,
  `pnpm e2e`, `pnpm verify` (check+build+test), `pnpm check:links` (cron).
