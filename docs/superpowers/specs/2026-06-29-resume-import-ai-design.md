# Resume Import → Template → PDF (free) + AI layer — Design

Date: 2026-06-29
Status: draft (revised after architect + Codex review; awaiting user review)
Extends: [2026-06-29-resume-builder-design.md](./2026-06-29-resume-builder-design.md)

## 0. Review log

Reviewed independently by the `architect` agent and Codex; they converged on the same
top issues. Decisions taken (this revision incorporates all):
- **Sequencing:** ship **P1 (free import) first and standalone**; then **P2 (AI) as a
  robust, separate step**. (Both reviewers: don't ship unpaid public AI without a real
  spend cap.)
- **AI cost cap:** not KV/IP counters — a **Durable Object budget gate** (strongly
  consistent, reserve-before-call, global concurrency cap, kill-switch env) + **mandatory
  Turnstile**. (CRITICAL.)
- **Security boundary:** `resumeSchema.parse` checks shape, NOT URL safety. Add a
  **sanitization layer** for `links[].url` and `basics.photo`, shared by the free and AI
  paths, applied before save/render. (CRITICAL.)
- **v1 provider:** **OpenAI/GPT** (bearer, simplest on Workers). Interface stays
  env-configurable; **Vertex deferred** (SA→OAuth JWT on the Workers runtime is too
  fiddly for v1); Workers AI / Anthropic remain swappable later.
- Also folded in: prompt-injection isolation, precise + tested "network-free" claim with
  a locally bundled pdf.js worker, `functions/` type-checking & test coverage + wrangler
  bindings, a concrete `FieldConfidence` type, AI timeouts/size/token caps, provider
  endpoint allowlisting (anti-SSRF).

## 1. Summary

Let a user bring an **existing resume** (upload `.docx`/`.pdf` or paste text) and get it
**restyled into one of our templates and exported as PDF** — without retyping. Extends
the live client-side builder (`/resume-builder/`).

- **Free path (P1)** — 100% client-side: extract text → heuristic parse → sanitize →
  pre-fill the existing `Builder` → user edits → pick template → print to PDF. No
  backend, no cost; after the app's JS chunks load, uploaded file contents never leave
  the device.
- **AI path (P2)** — opt-in, isolated behind Pages Functions, **no payment**; spend
  hard-capped by a Durable Object budget gate + mandatory Turnstile. Two functions:
  better parsing (`/api/ai-parse`) and content optimization (`/api/ai-optimize`).

## 2. Scope

**In — P1 (ships first):** client extraction for `.docx`/`.pdf`/paste; `HeuristicParser`
→ `Resume` with section/field confidence; **URL+photo sanitization layer**; import UI
pre-filling the builder with low-confidence fields flagged; English-first; unit + a
network-free CI gate.

**In — P2 (after P1):** `/api/ai-parse`, `/api/ai-optimize` behind an env-configurable
LLM client (**OpenAI/GPT in v1**); **Durable Object budget gate**, **mandatory
Turnstile**, kill-switch; output re-sanitized + Zod-validated; prompt-injection
isolation; AI-optimize v1 = strengthen bullets + optional "tailor to a pasted job
description". Function type-checking + tests.

**Out (deferred):** Google account/Drive OAuth login; payment/billing/accounts; Vertex
provider; multi-provider beyond the single bearer client; ATS scoring; non-English
parsing; cover letters.

## 3. Target data model + sanitization

`src/builder/resume-schema.ts` is the output type for BOTH parsers:

```
Resume = {
  basics: { fullName, headline, email, phone, location, photo, links[{label,url}] }
  summary: string
  experience: [{ title, company, location, start, end, bullets[] }]
  education:  [{ school, degree, field, location, graduation, details }]
  skills:     [{ category, items }]
}
```

**Security boundary (CRITICAL fix).** Templates render text via Svelte interpolation
(safe, no `@html`), but `links[].url` → `<a href>` (e.g. `FreshGraduate.svelte:111`) and
`basics.photo` → `<img src>` (Executive/ModernSidebar/Creative/FreshGraduate) are live
sinks. Imported-file and LLM content is untrusted, so add `sanitizeResume(r): Resume`:
- `links[].url`: allow only `https:`, `mailto:`, `tel:`; auto-`https://` a bare domain;
  **reject** `javascript:`/`data:`/`blob:`/`file:` and whitespace/control-obfuscated
  schemes (drop the url, keep the label).
- `basics.photo`: v1 **never import or accept an AI-supplied photo**. Only a
  user-typed `https:` URL or a bounded `data:image/(png|jpeg|webp)` under a strict byte
  cap; never `image/svg+xml`.
- Strip control chars; cap field lengths.

`sanitizeResume` runs (a) after any parser/AI output, before it touches builder state,
and (b) before every localStorage save. Tests assert a `javascript:` link and an
`svg`/oversized `data:` photo are stripped before render and before save. To avoid
bundling the large `PERSONAS` sample blob into Worker code, split the pure schema +
`sanitizeResume` into a dependency-free module (`resume-schema.ts` keeps samples; new
`resume-core.ts` holds schema + sanitizer) imported by client AND functions.

## 4. Architecture — the seam

```
Upload/Paste ─► TextExtractor (client)
                 ├─ docx → mammoth.js → text
                 ├─ pdf  → pdf.js (LOCAL bundled worker, never CDN) → text
                 └─ paste→ raw text
                      │ ExtractedText { text, source }
                      ▼
              ResumeParser { parse(t): Promise<ParseResult> }
                 ├─ HeuristicParser (client · free · default)        ← P1
                 └─ AiParser        (calls /api/ai-parse · opt-in)   ← P2
                      │ ParseResult { resume: Resume, confidence: FieldConfidence, warnings[] }
                      ▼
              sanitizeResume(...) ─► resumeSchema.parse(...)   ← never trust raw output
                      ▼
              existing Builder (edit) ─► Template ─► window.print() → PDF

  AiOptimizer (opt-in) ─► /api/ai-optimize { resume, jobDescription? }
                 → improved Resume (sanitized + Zod-validated) → per-bullet accept/reject
```

`FieldConfidence` (concrete): `Record<string, number>` keyed by **JSON Pointer** over the
Resume (`/basics/email`, `/experience/0/company`, `/experience/0/bullets/2`), value
0..1. v1 may score at **section/entry granularity** (`/experience/0`) rather than every
leaf. `ImportPanel` flags any key < 0.6. The heuristic parser emits real per-derivation
scores; the AI parser returns a flat default (e.g. 0.85) — confidence is a *review hint*,
not calibrated truth.

**ImportPanel ↔ Builder integration:** `Builder.svelte` owns `resume = $state(...)`
(`Builder.svelte:19`). Add an `onImport(resume)` callback prop (or expose a `loadResume`
method); `ImportPanel` mounts above the builder and, on confirm, calls it. Builder's
existing `$effect` autosaves the sanitized result.

## 5. Components

Client (`src/builder/import/`):
- `extract.ts` — `extractText(file|string)`; **dynamic `import()`** of mammoth/pdf.js so
  the base bundle is unaffected; pdf.js `workerSrc` points at a **locally bundled** asset
  (Vite `?url` / copied into static output) — **CDN workerSrc forbidden**. Enforces
  accepted MIME/extensions + a max file size (with a friendly paste fallback).
- `types.ts` — `ResumeParser`, `ParseResult`, `ExtractedText`, `FieldConfidence`.
- `heuristic-parser.ts` — §6. Pure, unit-tested.
- `ai-parser.ts` (P2) — `AiParser`; same interface; calls `/api/ai-parse`.
- `optimize.ts` (P2) — wraps `/api/ai-optimize`; returns a proposed `Resume`.
- `ImportPanel.svelte` — dropzone/file/paste tabs; extract→parse→sanitize; "review these
  N low-confidence fields"; (P2) "Improve accuracy with AI" + Turnstile.

Server (`functions/api/`, P2):
- `_llm.ts` — provider-agnostic client. **Provider is an enum** (`AI_PROVIDER`, v1 only
  `openai` implemented; `workers-ai`/`anthropic` stubs); **endpoints hardcoded per
  provider — never a client/env-supplied base URL** (anti-SSRF). `complete({system,user})`
  with JSON mode, `temperature:0`, `max_tokens` cap, `AbortSignal.timeout`, ≤1 repair
  retry counted against the budget. Logs provider+status only, never body/secrets.
- `_budget.ts` — **Durable Object** global budget gate: reserve estimated max tokens
  before the provider call, settle actual after, enforce a **global daily ceiling** and a
  **global concurrency limit**, fail closed; `AI_KILL_SWITCH` env disables instantly.
- `_turnstile.ts` — verify a Cloudflare Turnstile token; **mandatory** on both AI
  endpoints. (We build the integration; we never auto-solve challenges.)
- `_ratelimit.ts` — soft per-IP/day counter in KV (short TTL; IP never co-logged with
  content) as a courtesy layer atop the authoritative DO gate.
- `ai-parse.ts` — POST `{text}` (byte-capped) → Turnstile → budget reserve → `_llm` →
  `sanitizeResume` → `resumeSchema.parse` → return. On timeout/5xx/invalid-JSON →
  typed error so the client falls back to the heuristic result.
- `ai-optimize.ts` — POST `{resume, jobDescription?}` → same gates → returns improved
  `Resume`. Prompt: **rewrite each bullet in place, same count and order** (so the client
  can pair by index for accept/reject); strengthen verbs/quantification; if JD present,
  align wording honestly — **no fabricated experience**.

**Prompt-injection isolation:** resume text and JD are untrusted *data*. Delimit them,
instruct the model they are data not instructions, disable tools/web/function-calling,
never put secrets/env in prompts, require output-only JSON. All model output passes
`sanitizeResume` (URLs/photo) before use. Tests include injection fixtures (inject a
malicious URL, a photo, hidden "ignore instructions", a fabricated metric) and assert
they're neutralized.

**Provisioning (wrangler.toml + env):**
- Bindings: `BUDGET` (Durable Object), `AI_RL` (KV). Declare in `wrangler.toml`.
- Secrets: `OPENAI_API_KEY`, `TURNSTILE_SECRET`. Vars: `AI_PROVIDER`, `AI_MODEL`,
  `TURNSTILE_SITEKEY`, `AI_DAILY_TOKEN_CEILING`, `AI_MAX_CONCURRENCY`, `AI_KILL_SWITCH`.
- `.dev.vars.example` committed; real `.dev.vars` gitignored for `wrangler pages dev`.

## 6. Heuristic parser strategy (free path, the hard part)

1. Normalize extracted text to lines; keep blank-line block hints.
2. Contact block (top): regex email/phone/URLs (LinkedIn/GitHub/site → `links`); first
   non-contact line → `fullName`; short following line → `headline`.
3. Section detection by heading keywords (case/format-insensitive): Summary/Profile/
   Objective; Experience/Work/Employment; Education; Skills (Projects folded into
   experience/summary for v1).
4. Experience entries: detect via a date range (`Mon YYYY – Mon YYYY|Present`) + a
   title/company line; bullet glyphs / hanging indents → `bullets`; split
   title/company/location on `—`, `|`, `,`, `at`.
5. Education: school/degree/field/graduation via degree keywords (B.S., BA, MSc…) + year.
   Skills: into one or few `{category, items}` groups.
6. Confidence per §4. UI honest framing: "import gets you most of the way — check the
   highlighted fields." English/US-format first (state in UI).

## 7. Privacy & security (summary)

- Free path: files parsed in-memory; **after app chunks load, contents never leave the
  device**. pdf.js worker is local (no CDN). Enforced by a CI test (§9).
- AI path: only necessary text/resume POSTed to our same-origin function → OpenAI;
  **not stored**; logs scrub content; UI discloses before the call.
- Keys only in Pages secrets (owner-set; never client/repo/logs). Provider endpoints
  allowlisted; no client-supplied URLs (anti-SSRF).
- All parser/model output sanitized (URL/photo) + Zod-validated before UI/save.
- Spend capped by DO budget gate + mandatory Turnstile + kill-switch.

## 8. Error handling

- Unsupported/corrupt/too-large file → inline message + paste fallback.
- Too little extracted text → "couldn't read this; try paste/another format".
- AI: 429 (Turnstile/budget/rate) → friendly retry; 5xx/provider/timeout → fall back to
  heuristic result + notice; invalid JSON → one repair retry (counts against budget) else
  fall back. Per-request `AbortSignal.timeout`. Parsing is best-effort; the editor is the
  safety net.

## 9. Testing

- Unit (vitest): `heuristic-parser` over a fixture corpus (chronological, functional,
  student, summary/no-summary, messy spacing) — assert section/field extraction; assert
  **all outputs pass `resumeSchema`**.
- Unit: `sanitizeResume` — `javascript:`/`data:`/`blob:` links dropped, `svg`/oversized
  `data:` photo rejected, valid `https:`/`mailto:` kept; before render AND before save.
- Unit: `extract.ts` text normalization; plus a small corpus of **real `.docx`/`.pdf`
  binaries** with expected extracted-text snapshots (pdf.js fake-worker in node).
- Component (jsdom + @testing-library/svelte, add to deps + vitest env): `ImportPanel`
  extract→parse→confirm flow.
- **Network-free CI gate (Playwright):** intercept all requests during upload→import;
  fail on any third-party request; assert only same-origin chunk/worker (or none).
- Functions (P2, mocked `_llm`, no network in CI): request shaping, Zod validation,
  sanitization of malicious model output, **prompt-injection fixtures**, Turnstile
  required, budget-gate reserve/settle + over-ceiling 429, malformed-JSON repair.
- CI wiring: add `functions/` to type-checking (a `tsconfig.functions.json` with Worker
  types) in `pnpm verify`; add `functions/**` to vitest coverage `include`.
- Keep the live builder/template/PDF tests green (no changes expected there).

## 10. Phasing

- **P1 — Free import (ships first, alone):** `resume-core.ts` (schema + `sanitizeResume`),
  `extract.ts` (local pdf worker), `heuristic-parser.ts`, `types.ts`, `ImportPanel.svelte`,
  builder `onImport` hook, unit + network-free CI gate. Deploy. Core value, zero backend.
- **P2 — Robust AI (after P1):** `_llm.ts` (OpenAI; reuse a portable pattern from local
  `gengrowth-agents` only if it runs on Workers), `_budget.ts` (DO), `_turnstile.ts`,
  `_ratelimit.ts`, `ai-parse.ts`, `ai-optimize.ts`, UI hooks, function tests, wrangler
  bindings + secrets. Deploy.

## 11. Risks & future

- **Heuristic quality** is the main P1 risk — mitigated by confidence flags + editor +
  (P2) AI escape hatch; tuned against the corpus, not promised perfect.
- **pdf.js** loses structure vs docx; local worker is mandatory for the privacy claim.
- **AI spend** is the main P2 risk — the DO budget gate + Turnstile + kill-switch are the
  controls; KV/IP alone is explicitly insufficient (CF KV is eventually consistent; the
  Rate Limiting API is permissive, not accounting).
- **Vertex on Workers** (WebCrypto SA→OAuth JWT) deferred; revisit only with a
  Workers-native impl + tests.
- **Future:** Google Drive/account login; payment/quotas to make the AI path a paid tier;
  richer optimize (ATS keywords, multiple variants).
```
