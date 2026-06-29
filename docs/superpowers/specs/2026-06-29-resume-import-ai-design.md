# Resume Import → Template → PDF (free) + AI layer — Design

Date: 2026-06-29
Status: draft (awaiting review)
Extends: [2026-06-29-resume-builder-design.md](./2026-06-29-resume-builder-design.md)

## 1. Summary

Let a user bring an **existing resume** (upload `.docx`/`.pdf` or paste text) and get
it **restyled into one of our templates and exported as PDF** — without retyping.
This extends the live client-side builder (`/resume-builder/`), not a new product.

Two cleanly separated paths (user-decided hybrid):

- **Free path** — 100% client-side: extract text → heuristic parse → drop into the
  existing `Builder` pre-filled → user edits → pick template → print to PDF. No
  backend, no network, no cost, privacy-first (matches the builder's existing ethos).
- **AI path** — opt-in, isolated behind Pages Functions, **no payment this session**;
  cost bounded by rate-limiting. Two functions: better parsing (`/api/ai-parse`) and
  content optimization (`/api/ai-optimize`). The free and AI logic are separated so
  the owner's API spend happens only on an explicit AI action, and a paywall can be
  added later without touching the free path.

## 2. Scope

**In (this session)**
- Client text extraction for `.docx` (mammoth), `.pdf` (pdf.js), and pasted text.
- `HeuristicParser`: text → `Resume` (the existing schema) with per-field confidence.
- Import UI that pre-fills the existing `Builder`; low-confidence fields flagged.
- `/api/ai-parse` and `/api/ai-optimize` Pages Functions behind a provider-agnostic,
  env-configurable LLM client. AI-optimize v1 = strengthen bullets + optional
  "tailor to a pasted job description".
- Rate-limiting + optional Turnstile to bound spend. Privacy disclosure on AI actions.

**Out (deferred, by decision)**
- Google account / Drive OAuth login (a later enhancement; bigger backend+auth+PII step).
- Payment / billing / quotas-per-account (the AI path is built payment-ready but unpaid now).
- ATS scoring, multi-language parsing, cover letters.

## 3. Target data model (reused verbatim)

`src/builder/resume-schema.ts` is the single output type for BOTH parsers:

```
Resume = {
  basics: { fullName, headline, email, phone, location, photo, links[{label,url}] }
  summary: string
  experience: [{ title, company, location, start, end, bullets[] }]
  education:  [{ school, degree, field, location, graduation, details }]
  skills:     [{ category, items }]   // items = comma-separated string
}
```

Parsers MUST produce values that pass `resumeSchema`. The builder, all 6 templates,
and the print-to-PDF pipeline are unchanged.

## 4. Architecture — the seam

```
Upload/Paste ─► TextExtractor (client)
                 ├─ docx → mammoth.js → text (+ light structure)
                 ├─ pdf  → pdf.js     → text (line/position hints)
                 └─ paste→ raw text
                      │ ExtractedText { text, source, blocks? }
                      ▼
              ResumeParser interface { parse(t): Promise<ParseResult> }
                 ├─ HeuristicParser  (client · free · default)      ← this session
                 └─ AiParser         (calls /api/ai-parse · opt-in) ← this session, unpaid
                      │ ParseResult { resume: Resume, confidence: Field→0..1, warnings[] }
                      ▼
              resumeSchema.parse(result.resume)  ← never trust raw parser/model output
                      ▼
              existing Builder (edit) ─► Template ─► window.print() → PDF

  AiOptimizer (separate, opt-in) ─► /api/ai-optimize { resume, jobDescription? }
                      │ returns improved Resume (Zod-validated) — a diff the user can accept/reject
                      ▼ applied back into Builder state
```

Both parsers return the same `ParseResult`. The free path never makes a network call.
The AI path is the only networked code and is fully isolated in `functions/`.

## 5. Components

Client (`src/builder/import/`):
- `extract.ts` — `extractText(file|string): Promise<ExtractedText>`; lazy-imports
  mammoth/pdf.js so the base builder bundle is unaffected (dynamic `import()`).
- `types.ts` — `ResumeParser`, `ParseResult`, `ExtractedText`, `FieldConfidence`.
- `heuristic-parser.ts` — section segmentation → `Resume` (§6). Pure, unit-tested.
- `ai-parser.ts` — `AiParser` calling `/api/ai-parse`; same interface as heuristic.
- `optimize.ts` — client wrapper for `/api/ai-optimize`; returns a proposed `Resume`.
- `ImportPanel.svelte` — dropzone/file-picker/paste tabs; runs extract→parse; shows a
  "review these N low-confidence fields" summary; "Improve accuracy with AI" button
  (→ AiParser). On confirm, sets `Builder` state.
- Builder hook: an "AI optimize" button (calls `optimize.ts`), shows before/after per
  bullet so the user accepts or rejects — never silently overwrites.

Server (`functions/api/`):
- `_llm.ts` — provider-agnostic LLM client. Env-driven:
  `AI_PROVIDER` ∈ {openai, vertex, anthropic, workers-ai}, `AI_MODEL`, plus the
  provider's key/creds. One `complete({system,user,json}): Promise<object>`; JSON mode
  where supported, else fenced-JSON extraction. **Reuse check:** look at the local
  `gengrowth-agents` project (has Vertex + GPT clients) for a portable pattern before
  writing new. Note: OpenAI/Anthropic = simple bearer fetch; Vertex needs SA→OAuth
  token minting in the Worker runtime (slightly more setup) — the abstraction hides this.
- `ai-parse.ts` — POST `{text}` → LLM (strict schema prompt) → `Resume` JSON →
  `resumeSchema.parse` → return. Rejects oversized input.
- `ai-optimize.ts` — POST `{resume, jobDescription?}` → LLM → improved `Resume` →
  `resumeSchema.parse` → return. Prompt: strengthen action verbs/quantification;
  if JD present, align wording/keywords honestly (no fabricated experience).
- `_ratelimit.ts` — per-IP/day cap + global daily ceiling via KV (or CF Rate Limiting),
  returns 429 with a friendly message when exceeded.

## 6. Heuristic parser strategy (the hard part, free path)

1. **Normalize** extracted text to lines; keep blank-line groupings as block hints.
2. **Contact block** (usually top): regex email, phone, URLs (LinkedIn/GitHub/site →
   `links`); first non-contact line → `fullName`; a short following line → `headline`.
3. **Section detection** by heading keywords (case/format-insensitive): Summary/Profile/
   Objective; Experience/Work/Employment; Education; Skills; Projects (folded into
   experience or summary for v1). Headings recognized by keyword + line being short/
   bold-ish/standalone.
4. **Experience entries**: within the section, detect entry starts via a date range
   (`Mon YYYY – Mon YYYY|Present`) and a title/company line; lines beginning with
   bullet glyphs or hanging indents → `bullets`. Split `title`/`company`/`location` by
   common separators (`—`, `|`, `,`, `at`).
5. **Education**: school/degree/field/graduation via degree keywords (B.S., BA, MSc…) +
   year. **Skills**: collect into one or few `{category, items}` groups.
6. **Confidence**: each field gets 0..1 from how it was derived (regex-matched contact =
   high; guessed company split = low). UI surfaces low-confidence fields. Honest framing:
   "import gets you most of the way, then check the highlighted fields."

The AI parser is the escape hatch when heuristics are weak — same output contract.

## 7. Privacy & security

- Free path: nothing leaves the browser; files parsed in-memory, never uploaded.
- AI path: only the necessary text/resume is POSTed to our function → the model;
  **not stored** server-side; logs scrub content. UI states this before the call.
- LLM keys live only in Pages env/secrets (owner-set; never in client, repo, or logs).
- All model output is Zod-validated before reaching the UI (untrusted-input rule).
- Abuse/cost: rate-limit + optional Turnstile. We build the Turnstile integration; we
  never auto-solve challenges.
- No new third-party scripts on the free path; AI calls are same-origin to our functions.

## 8. Error handling

- Unsupported/corrupt file → inline message, offer paste fallback.
- Extraction yields too little text → "couldn't read this file, try paste/another format".
- AI function: 429 (rate limit) → friendly retry-later; 5xx/provider error → fall back to
  heuristic result with a notice; invalid model JSON → one repair retry, else heuristic.
- Parsing is best-effort by design: the editor is always the safety net.

## 9. Testing

- Unit (vitest): `heuristic-parser` against a fixture corpus of varied resume texts
  (chronological, functional, student, with/without summary, messy spacing); assert
  section counts and key fields; assert all outputs pass `resumeSchema`.
- Unit: `extract.ts` text normalization on sample docx/pdf text fixtures.
- Function tests: `ai-parse`/`ai-optimize` with a mocked `_llm` (no network in CI) —
  validate request shaping, Zod validation, rate-limit 429, malformed-JSON repair.
- Keep the live builder's existing tests green; no template/PDF changes expected.

## 10. Phasing

- **P1 — Free import (shippable alone):** `extract.ts`, `heuristic-parser.ts`, `types.ts`,
  `ImportPanel.svelte`, builder pre-fill, unit tests. Deploy. Delivers the core value
  with zero backend/cost.
- **P2 — AI layer (unpaid):** `_llm.ts` (+ reuse from gengrowth-agents), `ai-parse.ts`,
  `ai-optimize.ts`, `_ratelimit.ts`, UI hooks (AI accuracy + AI optimize), function
  tests, Pages env/secrets. Deploy.

## 11. Risks & future

- **Heuristic quality** is the main risk; mitigated by confidence-flagging + editor +
  AI escape hatch. We will tune against the fixture corpus, not promise perfection.
- **Vertex auth on Workers** (SA token minting) is the fiddliest provider; OpenAI/
  Anthropic/Workers-AI are simpler. Abstraction + env keep it swappable.
- **PDF parsing** loses structure more than docx; heuristics lean on docx, AI helps pdf.
- **Future:** Google Drive/account login (pull a Doc directly); payment/quotas to turn
  the AI path into a paid tier; richer "AI optimize" (ATS keywords, multiple variants).
```
