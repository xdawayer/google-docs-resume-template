/**
 * Build-validation gate (E3). OFFLINE ONLY — no network calls — so the build
 * stays deterministic (Decision #10). Drift/health (Drive API) live in crons.
 *
 * Core logic is the pure `validateTemplates()` so it's unit-testable without fs.
 * `main()` loads from disk and exits non-zero on any error (fails the build).
 */
import {
  templateSchema,
  CANONICAL_ORIGIN,
  TEMPLATE_PATH_PREFIX,
  type Template,
} from "../src/content/schema";
import { loadRawTemplates, type RawTemplate } from "./_shared";

export function expectedCanonical(slug: string): string {
  return `${CANONICAL_ORIGIN}${TEMPLATE_PATH_PREFIX}/${slug}/`;
}

export interface ValidateOptions {
  scaleOk?: boolean;
}

/** Returns a list of human-readable errors. Empty array = valid. */
export function validateTemplates(raws: RawTemplate[], opts: ValidateOptions = {}): string[] {
  const errors: string[] = [];
  const parsed: Template[] = [];

  const seenSlug = new Set<string>();
  const seenTitle = new Map<string, string>();
  const seenDesc = new Map<string, string>();
  const seenCanonical = new Map<string, string>();

  for (const r of raws) {
    const res = templateSchema.safeParse(r.data);
    if (!res.success) {
      for (const issue of res.error.issues) {
        errors.push(`${r.relpath}: ${issue.path.join(".") || "(root)"}: ${issue.message}`);
      }
      continue;
    }
    const t = res.data;

    // slug <-> filename agreement
    if (t.slug !== r.fileSlug) {
      errors.push(`${r.relpath}: frontmatter slug "${t.slug}" != filename "${r.fileSlug}"`);
    }
    // uniqueness
    if (seenSlug.has(t.slug)) errors.push(`${r.relpath}: duplicate slug "${t.slug}"`);
    seenSlug.add(t.slug);

    const dupTitle = seenTitle.get(t.seo.title);
    if (dupTitle) errors.push(`${r.relpath}: duplicate SEO title (also in ${dupTitle})`);
    seenTitle.set(t.seo.title, r.relpath);

    const dupDesc = seenDesc.get(t.seo.metaDescription);
    if (dupDesc) errors.push(`${r.relpath}: duplicate meta description (also in ${dupDesc})`);
    seenDesc.set(t.seo.metaDescription, r.relpath);

    const dupCanon = seenCanonical.get(t.seo.canonical);
    if (dupCanon) errors.push(`${r.relpath}: duplicate canonical (also in ${dupCanon})`);
    seenCanonical.set(t.seo.canonical, r.relpath);

    // canonical correctness (trailing slash + host + prefix pinned)
    const want = expectedCanonical(t.slug);
    if (t.seo.canonical !== want) {
      errors.push(`${r.relpath}: canonical "${t.seo.canonical}" != expected "${want}"`);
    }

    parsed.push(t);
  }

  // related[] referential integrity
  const allSlugs = new Set(parsed.map((t) => t.slug));
  const publishedSlugs = new Set(parsed.filter((t) => t.status === "published").map((t) => t.slug));
  for (const t of parsed) {
    for (const rel of t.related) {
      if (rel === t.slug) errors.push(`${t.slug}: related[] references itself`);
      else if (!allSlugs.has(rel)) errors.push(`${t.slug}: related "${rel}" does not exist`);
      else if (t.status === "published" && !publishedSlugs.has(rel)) {
        errors.push(`${t.slug}: published template relates to non-published "${rel}"`);
      }
    }
  }

  // E12 depth-before-breadth gate (belt; e2e-gate is suspenders)
  const publishedCount = publishedSlugs.size;
  if (publishedCount > 3 && !opts.scaleOk) {
    errors.push(
      `E12 gate: ${publishedCount} published templates but SCALE_OK!=1 — prove indexation on 3 before scaling to 24`,
    );
  }

  return errors;
}

function main(): void {
  const raws = loadRawTemplates();
  const errors = validateTemplates(raws, { scaleOk: process.env.SCALE_OK === "1" });
  if (errors.length) {
    console.error(`\n✗ validate-content: ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  - ${e}`);
    console.error("");
    process.exit(1);
  }
  const published = raws.filter(
    (r) => (r.data as { status?: string }).status === "published",
  ).length;
  console.log(`✓ validate-content: ${raws.length} template(s) OK (${published} published)`);
}

// Run only when invoked directly (not when imported by tests).
if (import.meta.url === `file://${process.argv[1]}`) main();
