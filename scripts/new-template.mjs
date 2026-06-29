#!/usr/bin/env node
/**
 * scripts/new-template.mjs — M7-7a scaffolder (the `pnpm new:template` command).
 *
 * Writes `src/content/templates/{slug}.draft.md` with a complete frontmatter
 * skeleton matching `src/content/schema.ts`. Draft files end in `.draft.md` and
 * are EXCLUDED from the Astro content collection and from every offline gate
 * (see the `ignore` in `scripts/_shared.ts` and the negated pattern in
 * `src/content.config.ts`) until a human authors the original Google Doc and
 * PROMOTES the file by renaming `.draft.md` -> `.md`.
 *
 * Field policy:
 *   - Structural fields (taxonomy, canonical, dates) are filled from CLI flags.
 *   - Human-authored fields are left as `REPLACE_WITH_*` sentinels / `TODO(human)`
 *     comments. The sentinels are deliberately INVALID against the schema so a
 *     draft promoted without being filled fails `pnpm validate` loudly
 *     (docId < 20 chars; copyUrl carries the rejected `REPLACE_WITH_` marker).
 *
 * Enum lists below mirror `src/content/schema.ts` — keep them in sync.
 *
 * Usage:
 *   node scripts/new-template.mjs <slug> \
 *     --name "ATS Classic One Page" \
 *     --category ats,simple,professional \
 *     --roles general \
 *     --level entry,mid,senior \
 *     --ats scanner-first \
 *     --pages 1
 */
import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const TEMPLATES_DIR = "src/content/templates";
const PATH_PREFIX = "/google-docs-resume-template";
const ORIGIN = (process.env.SITE_URL ?? "https://googledocsresumetemplate.com").replace(/\/$/, "");

// Mirror of the enums in src/content/schema.ts.
const CATEGORIES = [
  "ats",
  "simple",
  "professional",
  "student",
  "tech",
  "creative",
  "executive",
  "cover-letter",
];
const ROLES = [
  "general",
  "software-engineer",
  "data-analyst",
  "project-manager",
  "marketing",
  "executive",
  "student",
  "career-change",
];
const LEVELS = ["entry", "mid", "senior", "any"];
const ATS_PROFILES = ["scanner-first", "balanced", "visual-pdf"];
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function fail(msg) {
  console.error(`✗ new-template: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const hasVal = argv[i + 1] !== undefined && !argv[i + 1].startsWith("--");
      out[key] = hasVal ? argv[++i] : "true";
    } else {
      out._.push(a);
    }
  }
  return out;
}

function asList(value, allowed, field) {
  const items = String(value)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length === 0) fail(`--${field} cannot be empty`);
  for (const item of items) {
    if (!allowed.includes(item)) {
      fail(`invalid --${field} "${item}" (allowed: ${allowed.join(", ")})`);
    }
  }
  return items;
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const args = parseArgs(process.argv.slice(2));
const slug = args._[0];
if (!slug) {
  fail("missing <slug>. usage: node scripts/new-template.mjs <slug> [--name ...] [--category ...]");
}
if (!SLUG_RE.test(slug)) fail(`slug "${slug}" must be kebab-case (lowercase, hyphen-separated)`);

const draftPath = join(TEMPLATES_DIR, `${slug}.draft.md`);
const finalPath = join(TEMPLATES_DIR, `${slug}.md`);
if (existsSync(draftPath)) fail(`${draftPath} already exists (refusing to overwrite)`);
if (existsSync(finalPath)) fail(`${finalPath} already exists (slug already taken)`);

const name = args.name ?? titleCase(slug);
const category = args.category ? asList(args.category, CATEGORIES, "category") : ["ats"];
const roles = args.roles ? asList(args.roles, ROLES, "roles") : ["general"];
const level = args.level ? asList(args.level, LEVELS, "level") : ["entry", "mid", "senior"];
const atsProfile = args.ats ?? "scanner-first";
if (!ATS_PROFILES.includes(atsProfile)) {
  fail(`invalid --ats "${atsProfile}" (allowed: ${ATS_PROFILES.join(", ")})`);
}
const pages = Number(args.pages ?? 1);
if (!Number.isInteger(pages) || pages < 1 || pages > 3) fail("--pages must be an integer 1..3");

const today = new Date().toISOString().slice(0, 10);
const canonical = `${ORIGIN}${PATH_PREFIX}/${slug}/`;

const draft = `---
# DRAFT — excluded from the content collection and every gate until promoted.
# To promote: author the original Google Doc (E8 Workspace), replace every
# REPLACE_WITH_* / TODO(human) below, rename ${slug}.draft.md -> ${slug}.md,
# then run \`pnpm validate\`.
slug: ${slug}
name: ${name}
status: draft

category: [${category.join(", ")}]
roles: [${roles.join(", ")}]
experienceLevel: [${level.join(", ")}]
pageCount: ${pages}

# Google Docs source of truth — fill in after creating the original Doc.
docId: REPLACE_WITH_DOC_ID
copyUrl: https://docs.google.com/document/d/REPLACE_WITH_DOC_ID/copy
# wordUrl: https://example.com/downloads/${slug}.docx # optional DOCX fallback
linkStatus: unverified # the link-health monitor (M2) sets this to "available"

thumbnail:
  src: src/assets/templates/${slug}.png # TODO(human): add the real screenshot (E6)
  width: 1600
  height: 2071
  alt: REPLACE_WITH_ALT # TODO(human): describe the first page for screen readers

atsProfile: ${atsProfile}
atsChecklist:
  # TODO(human): keep only checkable, TRUE facts about THIS template (T2 — never a score).
  - { id: single-col, label: Single column layout, pass: true }
  - { id: std-headings, label: Standard section headings, pass: true }
parseEvidence: [] # TODO(human): >=1 real parse test before publishing (non visual-pdf)
caveats: []

seo:
  # TODO(human): title + metaDescription MUST be unique per template (near-dup defense, E5).
  title: REPLACE_WITH_TITLE # <= 70 chars
  metaDescription: REPLACE_WITH_META_DESCRIPTION write a unique 70-160 char summary of this specific template and that it is free in Google Docs.
  canonical: ${canonical}

faq: [] # TODO(human): >= 3 unique Q/A before publishing
bulletExamples: [] # TODO(human): >= 3 unique example bullets
sectionGuidance: [] # TODO(human): per-section writing guidance
related: [] # TODO(human): >= 2 sibling slugs before publishing

created: ${today}
updated: ${today}
---

<!-- TODO(human): write 100-200 words of ORIGINAL prose unique to this template
     (Helpful-Content defense — must NOT be reused across templates). Cover who
     it is for, what makes its layout ATS-friendly, and how to adapt it. -->
`;

mkdirSync(TEMPLATES_DIR, { recursive: true });
writeFileSync(draftPath, draft, "utf8");
console.log(`✓ new-template: wrote ${draftPath} (status: draft, excluded until promoted)`);
