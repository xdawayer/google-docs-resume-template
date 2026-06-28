/**
 * scripts/e2e-gate.ts — M7-7a release-readiness gate (the `pnpm gate:e2e` command).
 *
 * Evaluates the 7a target templates and prints two tallies: how many are
 * CONTENT-ready (the prose/metadata Claude can author) and how many are
 * RELEASE-ready (content + the external artifacts that need the governed
 * Workspace). It is the "belt" half of E12 (the SCALE_OK block in
 * validate-content is the "suspenders") and sits OFF the build path (CI runs
 * verify, not gate:e2e), so it can stay red until a template is genuinely live.
 *
 * Check kinds:
 *   pass    — verified good.
 *   fail    — a CONTENT defect Claude must fix (too few bullets, dup title, ...).
 *   pending — an EXTERNAL artifact that is not real yet and cannot be faked here
 *             (real Google Doc id/copyUrl, screenshot via GOOGLE_SA_KEY, link
 *             health, /go, parse evidence). Blocks release, not a content bug.
 *   manual  — run a separate command (export QA, beacon e2e).
 *
 * contentReady = no failing CONTENT check. ready = no fail AND no pending.
 * Core logic is the pure `evaluateGate()` so it is unit-testable without fs.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadRawTemplates, TEMPLATES_DIR, type RawTemplate } from "./_shared";
import type { GoMap } from "../src/lib/go-map";

/** The three templates proven end-to-end before any scaling (PRD/plan 7a). */
export const TARGET_SLUGS_7A = ["ats-classic-one-page", "student-internship", "software-engineer"];

const GO_MAP_PATH = "functions/_data/go-map.json";
const LOCK_PATH = "src/data/screenshots.lock.json";

const DOC_ID_RE = /^[A-Za-z0-9_-]{20,}$/;
const COPY_URL_RE = /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]{20,}\/copy$/;
const WORD_RE = /\S+/g;

export type CheckStatus = "pass" | "fail" | "pending" | "manual";
export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}
export interface GateResult {
  slug: string;
  state: "missing" | "draft" | "published";
  contentReady: boolean;
  ready: boolean;
  checks: Check[];
}

export interface GateInputs {
  /** raws INCLUDING drafts (loadRawTemplates(dir, { includeDrafts: true })) */
  raws: RawTemplate[];
  goMap: GoMap;
  lock: Record<string, { hash?: string }>;
  assetExists: (src: string) => boolean;
}

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const asStr = (v: unknown): string => (typeof v === "string" ? v : "");
const asObj = (v: unknown): Record<string, unknown> =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
const wordCount = (s: string): number => (s.match(WORD_RE) ?? []).length;
const isReal = (s: string): boolean => s.length > 0 && !s.includes("REPLACE_WITH");

export function evaluateGate(targets: string[], input: GateInputs): GateResult[] {
  // Index raws by real slug, preferring a promoted .md over a .draft.md sibling.
  const bySlug = new Map<string, { raw: RawTemplate; isDraft: boolean }>();
  for (const raw of input.raws) {
    const isDraft = raw.filepath.endsWith(".draft.md");
    const slug = isDraft ? raw.fileSlug.replace(/\.draft$/, "") : raw.fileSlug;
    const existing = bySlug.get(slug);
    if (!existing || (existing.isDraft && !isDraft)) bySlug.set(slug, { raw, isDraft });
  }

  const seenBody = new Map<string, string>();
  const seenTitle = new Map<string, string>();

  return targets.map((slug): GateResult => {
    const hit = bySlug.get(slug);
    if (!hit) {
      return {
        slug,
        state: "missing",
        contentReady: false,
        ready: false,
        checks: [
          {
            id: "exists",
            label: "template file exists",
            status: "fail",
            detail: `run \`pnpm new:template ${slug}\``,
          },
        ],
      };
    }

    const d = hit.raw.data;
    const statusField = asStr(d.status) || "draft";
    const state: GateResult["state"] = hit.isDraft
      ? "draft"
      : statusField === "published"
        ? "published"
        : "draft";

    const content: Check[] = [];
    const cAdd = (id: string, label: string, ok: boolean, detail?: string): void => {
      content.push({ id, label, status: ok ? "pass" : "fail", detail });
    };
    const external: Check[] = [];
    const eAdd = (id: string, label: string, ok: boolean, detail?: string): void => {
      external.push({ id, label, status: ok ? "pass" : "pending", detail });
    };

    const promoted: Check = {
      id: "promoted",
      label: "promoted (.md, not .draft.md)",
      status: hit.isDraft ? "pending" : "pass",
      detail: hit.isDraft ? "fill the externals, then rename .draft.md -> .md" : undefined,
    };

    // ---- CONTENT (Claude-authorable; read from raw frontmatter) ----
    const seo = asObj(d.seo);
    const title = asStr(seo.title);
    const dupTitle = seenTitle.get(title);
    cAdd(
      "seo-title",
      "SEO title set, <=70 chars, unique",
      isReal(title) && title.length <= 70 && !dupTitle,
      dupTitle ? `duplicate of ${dupTitle}` : `len=${title.length}`,
    );
    if (title) seenTitle.set(title, slug);

    const desc = asStr(seo.metaDescription);
    cAdd(
      "seo-desc",
      "meta description 70-160 chars",
      isReal(desc) && desc.length >= 70 && desc.length <= 160,
      `len=${desc.length}`,
    );

    cAdd(
      "ats-checklist",
      "ATS checklist >=1 item",
      asArray(d.atsChecklist).length >= 1,
      `n=${asArray(d.atsChecklist).length}`,
    );
    cAdd(
      "bullets",
      "bulletExamples >=3",
      asArray(d.bulletExamples).length >= 3,
      `n=${asArray(d.bulletExamples).length}`,
    );
    cAdd("faq", "faq >=3", asArray(d.faq).length >= 3, `n=${asArray(d.faq).length}`);
    cAdd(
      "guidance",
      "sectionGuidance >=1",
      asArray(d.sectionGuidance).length >= 1,
      `n=${asArray(d.sectionGuidance).length}`,
    );
    cAdd(
      "related",
      "related >=2 (E5)",
      asArray(d.related).length >= 2,
      `n=${asArray(d.related).length}`,
    );

    const alt = asStr(asObj(d.thumbnail).alt);
    cAdd("alt", "thumbnail alt text (a11y)", isReal(alt));

    const bodyWords = wordCount(hit.raw.body);
    const bodyKey = hit.raw.body.trim();
    const dupBody = seenBody.get(bodyKey);
    cAdd(
      "body",
      "unique body prose >=50 words (HCU)",
      bodyWords >= 50 && !dupBody,
      dupBody ? `duplicate of ${dupBody}` : `words=${bodyWords}`,
    );
    if (bodyKey) seenBody.set(bodyKey, slug);

    // ---- EXTERNAL (needs the governed Workspace; cannot be faked here) ----
    const docId = asStr(d.docId);
    eAdd(
      "doc",
      "real Google Doc id",
      DOC_ID_RE.test(docId) && isReal(docId),
      isReal(docId) ? undefined : "placeholder",
    );
    eAdd(
      "copy-url",
      "real copy URL",
      COPY_URL_RE.test(asStr(d.copyUrl)) && isReal(asStr(d.copyUrl)),
    );
    eAdd(
      "link-available",
      "linkStatus: available (E1)",
      asStr(d.linkStatus) === "available",
      `linkStatus=${asStr(d.linkStatus) || "unset"}`,
    );

    const needsParse = asStr(d.atsProfile) !== "visual-pdf";
    const parseEvidence = asArray(d.parseEvidence);
    eAdd(
      "parse-evidence",
      "ATS parse evidence (T2)",
      !needsParse ||
        parseEvidence.some(
          (p) => asStr(asObj(p).image).length > 0 || asStr(asObj(p).note).length > 0,
        ),
      needsParse ? `n=${parseEvidence.length}` : "visual-pdf: optional",
    );

    const inLock = Boolean(input.lock[slug]?.hash);
    const assetOk = input.assetExists(asStr(asObj(d.thumbnail).src));
    const revisionId = asStr(d.revisionId);
    eAdd(
      "screenshot",
      "screenshot + revision hash (E6)",
      inLock && assetOk && revisionId.length > 0,
      `lock=${inLock} asset=${assetOk} rev=${revisionId || "—"}`,
    );

    const go = input.goMap[slug];
    eAdd(
      "go-resolves",
      "/go resolves + available (E2)",
      go !== undefined && go.status === "available",
      go ? `go=${go.status}` : "not in go-map",
    );

    const manual: Check[] = [
      { id: "export-qa", label: "PDF/DOCX export QA", status: "manual", detail: "pnpm qa:export" },
      {
        id: "beacon",
        label: "intent beacon fires (E9)",
        status: "manual",
        detail: "pnpm e2e (copy-beacon)",
      },
    ];

    const checks = [promoted, ...content, ...external, ...manual];
    const contentReady = content.every((c) => c.status === "pass");
    const ready = checks.every((c) => c.status === "pass" || c.status === "manual");
    return { slug, state, contentReady, ready, checks };
  });
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

const ICON: Record<CheckStatus, string> = { pass: "✓", fail: "✗", pending: "·", manual: "○" };

function main(): void {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = args.length ? args : TARGET_SLUGS_7A;

  const raws = loadRawTemplates(TEMPLATES_DIR, { includeDrafts: true });
  const goMap = readJson<GoMap>(GO_MAP_PATH, {});
  const lock = readJson<Record<string, { hash?: string }>>(LOCK_PATH, {});
  const assetExists = (src: string): boolean => existsSync(resolve(src));

  const results = evaluateGate(targets, { raws, goMap, lock, assetExists });

  for (const r of results) {
    const tag = r.ready
      ? "RELEASE-READY"
      : r.contentReady
        ? "CONTENT-READY"
        : r.state.toUpperCase();
    console.log(`\n${r.ready ? "✓" : r.contentReady ? "◐" : "✗"} ${r.slug} — ${tag}`);
    for (const c of r.checks) {
      console.log(`    ${ICON[c.status]} ${c.label}${c.detail ? `  (${c.detail})` : ""}`);
    }
  }

  const contentCount = results.filter((r) => r.contentReady).length;
  const readyCount = results.filter((r) => r.ready).length;
  console.log(
    `\ngate:e2e — content-ready ${contentCount}/${targets.length} · release-ready ${readyCount}/${targets.length}`,
  );
  console.log("legend: ✓ pass  ✗ content defect  · external artifact pending  ○ manual check");
  if (contentCount > readyCount) {
    console.log(
      "pending externals need the governed Workspace (real Doc + copyUrl, screenshot via",
    );
    console.log("GOOGLE_SA_KEY, link-health). Fill them, promote to .md, then re-run gate:e2e.");
  }
  process.exit(readyCount === targets.length ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
