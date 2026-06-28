/**
 * scripts/e2e-gate.ts — M7-7a release-readiness gate (the `pnpm gate:e2e` command).
 *
 * Evaluates the 7a target templates against the data-layer half of the 10-point
 * checklist and prints `N/<targets> ready`. It is the "belt" half of E12 (the
 * "suspenders" being the SCALE_OK block in validate-content). This gate is
 * intentionally OFF the build path (CI runs verify, not gate:e2e) so it can sit
 * RED until a template is genuinely authored, screenshotted, linked, and live.
 *
 * Machine-checkable here (read from the offline artifacts):
 *   promoted, schema-valid, published, linkStatus:available, ATS parse evidence,
 *   screenshot+revision (screenshots.lock + asset + revisionId), /go resolves,
 *   unique content (HCU), related>=2, alt text, cross-target uniqueness.
 * Surfaced but NOT machine-verified (run separately):
 *   PDF/DOCX export QA (qa:export) and the intent beacon (pnpm e2e copy-beacon).
 *
 * Core logic is the pure `evaluateGate()` so it is unit-testable without fs.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { templateSchema } from "../src/content/schema";
import { loadRawTemplates, TEMPLATES_DIR, type RawTemplate } from "./_shared";
import type { GoMap } from "../src/lib/go-map";

/** The three templates proven end-to-end before any scaling (PRD/plan 7a). */
export const TARGET_SLUGS_7A = ["ats-classic-one-page", "student-internship", "software-engineer"];

const GO_MAP_PATH = "functions/_data/go-map.json";
const LOCK_PATH = "src/data/screenshots.lock.json";

export type CheckStatus = "pass" | "fail" | "manual";
export interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  detail?: string;
}
export interface GateResult {
  slug: string;
  state: "published" | "draft" | "missing";
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

const WORD_RE = /\S+/g;
const wordCount = (s: string): number => (s.match(WORD_RE) ?? []).length;

/**
 * Evaluate each target slug. Pure: all I/O is supplied via `input`.
 * `ready` means "no failing machine checks"; pending `manual` checks do not
 * block readiness but are always printed as a reminder.
 */
export function evaluateGate(targets: string[], input: GateInputs): GateResult[] {
  // Index raws by real slug, preferring a promoted .md over a .draft.md sibling.
  const bySlug = new Map<string, { raw: RawTemplate; isDraft: boolean }>();
  for (const raw of input.raws) {
    const isDraft = raw.filepath.endsWith(".draft.md");
    const slug = isDraft ? raw.fileSlug.replace(/\.draft$/, "") : raw.fileSlug;
    const existing = bySlug.get(slug);
    if (!existing || (existing.isDraft && !isDraft)) bySlug.set(slug, { raw, isDraft });
  }

  // Cross-target uniqueness (HCU / near-dup defense) accumulates as we go.
  const seenBody = new Map<string, string>();
  const seenTitle = new Map<string, string>();

  return targets.map((slug): GateResult => {
    const hit = bySlug.get(slug);

    if (!hit) {
      return {
        slug,
        state: "missing",
        ready: false,
        checks: [
          {
            id: "exists",
            label: "template file exists",
            status: "fail",
            detail: `no ${slug}.md or ${slug}.draft.md — run \`pnpm new:template ${slug}\``,
          },
        ],
      };
    }

    if (hit.isDraft) {
      return {
        slug,
        state: "draft",
        ready: false,
        checks: [
          {
            id: "promoted",
            label: "promoted (.md, not .draft.md)",
            status: "fail",
            detail: "still a scaffold — author the Doc, fill REPLACE_WITH_*/TODO, rename to .md",
          },
        ],
      };
    }

    const checks: Check[] = [{ id: "promoted", label: "promoted (.md)", status: "pass" }];
    const add = (id: string, label: string, ok: boolean, detail?: string): void => {
      checks.push({ id, label, status: ok ? "pass" : "fail", detail });
    };

    const res = templateSchema.safeParse(hit.raw.data);
    if (!res.success) {
      checks.push({
        id: "schema",
        label: "schema valid",
        status: "fail",
        detail: res.error.issues
          .slice(0, 3)
          .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
          .join("; "),
      });
      return { slug, state: "published", ready: false, checks };
    }
    const t = res.data;
    checks.push({ id: "schema", label: "schema valid", status: "pass" });

    add("published", "status: published", t.status === "published", `status=${t.status}`);
    add(
      "link-available",
      "linkStatus: available (E1/E2/D2)",
      t.linkStatus === "available",
      `linkStatus=${t.linkStatus}`,
    );

    const needsParse = t.atsProfile !== "visual-pdf";
    add(
      "parse-evidence",
      "ATS parse evidence with image (T2)",
      !needsParse || t.parseEvidence.some((p) => p.image),
      needsParse ? "needs >=1 parseEvidence with image" : "visual-pdf: parse evidence optional",
    );

    const inLock = Boolean(input.lock[slug]?.hash);
    const assetOk = input.assetExists(t.thumbnail.src);
    add(
      "screenshot",
      "screenshot + revision hash (E6)",
      inLock && assetOk && Boolean(t.revisionId),
      `lock=${inLock} asset=${assetOk} revisionId=${t.revisionId ?? "—"}`,
    );

    const go = input.goMap[slug];
    add(
      "go-resolves",
      "/go resolves + available (E2)",
      go !== undefined && go.status === "available",
      go ? `go.status=${go.status}` : "not in go-map (published + real copyUrl required)",
    );

    const bodyWords = wordCount(hit.raw.body);
    add(
      "hcu",
      "unique content (bullets>=3, faq>=3, guidance>=1, body>=50w)",
      t.bulletExamples.length >= 3 &&
        t.faq.length >= 3 &&
        t.sectionGuidance.length >= 1 &&
        bodyWords >= 50,
      `bullets=${t.bulletExamples.length} faq=${t.faq.length} guidance=${t.sectionGuidance.length} words=${bodyWords}`,
    );

    add("related", "related >= 2 (E5)", t.related.length >= 2, `related=${t.related.length}`);
    add(
      "alt",
      "thumbnail alt text present (a11y)",
      Boolean(t.thumbnail.alt) && !t.thumbnail.alt.includes("REPLACE_WITH"),
      t.thumbnail.alt,
    );

    const bodyKey = hit.raw.body.trim();
    const dupBody = seenBody.get(bodyKey);
    add(
      "unique-body",
      "body prose unique across targets (HCU)",
      !dupBody,
      dupBody ? `duplicate of ${dupBody}` : "unique",
    );
    seenBody.set(bodyKey, slug);

    const dupTitle = seenTitle.get(t.seo.title);
    add(
      "unique-title",
      "SEO title unique across targets",
      !dupTitle,
      dupTitle ? `duplicate of ${dupTitle}` : "unique",
    );
    seenTitle.set(t.seo.title, slug);

    // Runtime / human-attested checks — surfaced, not machine-verified here.
    checks.push({
      id: "export-qa",
      label: "PDF/DOCX export QA",
      status: "manual",
      detail: "run `pnpm qa:export` (scripts/export-qa.mjs)",
    });
    checks.push({
      id: "beacon",
      label: "intent beacon fires (E9)",
      status: "manual",
      detail: "covered by `pnpm e2e` (copy-beacon.spec)",
    });

    const ready = checks.every((c) => c.status !== "fail");
    return { slug, state: "published", ready, checks };
  });
}

function readJson<T>(path: string, fallback: T): T {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

const ICON: Record<CheckStatus, string> = { pass: "✓", fail: "✗", manual: "○" };

function main(): void {
  const args = process.argv.slice(2).filter((a) => !a.startsWith("-"));
  const targets = args.length ? args : TARGET_SLUGS_7A;

  const raws = loadRawTemplates(TEMPLATES_DIR, { includeDrafts: true });
  const goMap = readJson<GoMap>(GO_MAP_PATH, {});
  const lock = readJson<Record<string, { hash?: string }>>(LOCK_PATH, {});
  const assetExists = (src: string): boolean => existsSync(resolve(src));

  const results = evaluateGate(targets, { raws, goMap, lock, assetExists });

  for (const r of results) {
    const tag = r.ready ? "READY" : r.state.toUpperCase();
    console.log(`\n${r.ready ? "✓" : "✗"} ${r.slug} — ${tag}`);
    for (const c of r.checks) {
      const detail = c.detail ? `  (${c.detail})` : "";
      console.log(`    ${ICON[c.status]} ${c.label}${detail}`);
    }
  }

  const readyCount = results.filter((r) => r.ready).length;
  const manualPending = results.some((r) => r.ready && r.checks.some((c) => c.status === "manual"));
  console.log(`\ngate:e2e — ${readyCount}/${targets.length} ready`);
  if (manualPending) {
    console.log("note: READY templates still owe the ○ manual checks (export QA + beacon e2e).");
  }
  process.exit(readyCount === targets.length ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
