import { z } from "zod";

/**
 * Unified Template schema — the SINGLE source of truth (Decision #3).
 * D10 and E7 collapse into this one definition. One naming convention:
 * camelCase only. `.strict()` bans any extra key, which also kills:
 *   - a numeric ATS score creeping back (T2): `score`/`atsScore` are not in the
 *     shape, so `.strict()` rejects them.
 *   - snake_case drift (`doc_id`, `link_status`): not in the shape → rejected.
 *
 * Framework-agnostic on purpose: imported by both `src/content.config.ts`
 * (Astro) and `scripts/*` (plain Node via tsx). We import `z` from
 * `astro:content` so the collection types line up; scripts get the same schema.
 */

export const CANONICAL_ORIGIN = (
  (typeof process !== "undefined" ? process.env.SITE_URL : undefined) ??
  "https://resumedocs.example"
).replace(/\/$/, "");

export const TEMPLATE_PATH_PREFIX = "/google-docs-resume-template";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DOC_ID_RE = /^[A-Za-z0-9_-]{20,}$/;
// Real Google Docs "make a copy" link. The trailing `/copy` is mandatory and
// the placeholder `REPLACE_WITH_*` from the demo is explicitly rejected.
const COPY_URL_RE =
  /^https:\/\/docs\.google\.com\/document\/d\/[A-Za-z0-9_-]{20,}\/copy$/;

const category = z.enum([
  "ats",
  "simple",
  "professional",
  "student",
  "tech",
  "creative",
  "executive",
  "cover-letter",
]);

const role = z.enum([
  "general",
  "software-engineer",
  "data-analyst",
  "project-manager",
  "marketing",
  "executive",
  "student",
  "career-change",
]);

const experienceLevel = z.enum(["entry", "mid", "senior", "any"]);

// No numeric score anywhere. ATS trust is conveyed as an explainable profile
// plus a checklist of checkable facts (T2).
const atsProfile = z.enum(["scanner-first", "balanced", "visual-pdf"]);

const linkStatus = z.enum([
  "unverified",
  "available",
  "unavailable",
  "checking",
]);

const status = z.enum(["draft", "published"]);

const atsChecklistItem = z
  .object({
    id: z.string().min(1),
    label: z.string().min(1),
    pass: z.boolean(),
    detail: z.string().optional(),
  })
  .strict();

const parseEvidence = z
  .object({
    tool: z.string().min(1), // e.g. "Workday PDF upload", "plain-text extraction"
    testedAt: z.coerce.date(),
    image: z.string().min(1).optional(), // screenshot path of the parse result
    note: z.string().optional(),
  })
  .strict();

const imageAsset = z
  .object({
    src: z.string().min(1), // path string; resolved via import.meta.glob asset map
    width: z.number().int().positive(),
    height: z.number().int().positive(),
    alt: z.string().min(1),
  })
  .strict();

const faqItem = z
  .object({ q: z.string().min(1), a: z.string().min(1) })
  .strict();

const seo = z
  .object({
    title: z.string().min(1).max(70),
    metaDescription: z.string().min(70).max(160),
    canonical: z.string().url(),
    ogImage: z.string().optional(),
    noindex: z.boolean().default(false),
  })
  .strict();

export const templateSchema = z
  .object({
    slug: z.string().regex(SLUG_RE, "slug must be kebab-case"),
    name: z.string().min(1),
    status: status.default("draft"),

    // Taxonomy (drives category/role pages + filters)
    category: z.array(category).min(1),
    roles: z.array(role).min(1),
    experienceLevel: z.array(experienceLevel).min(1),
    pageCount: z.number().int().min(1).max(3),

    // Google Docs source of truth
    docId: z.string().regex(DOC_ID_RE),
    copyUrl: z
      .string()
      .regex(COPY_URL_RE, "must be a real .../d/{id}/copy URL")
      .refine((u) => !u.includes("REPLACE_WITH_"), "placeholder copyUrl"),
    wordUrl: z.string().url().optional(), // DOCX fallback
    sourceUrl: z.string().url().optional(),

    // Verification / health (written by the link-health monitor, M2)
    linkStatus: linkStatus.default("unverified"),
    lastVerifiedAt: z.coerce.date().optional(),
    revisionId: z.string().optional(),

    // Assets
    thumbnail: imageAsset,

    // ATS trust — NO numeric score (T2)
    atsProfile,
    atsChecklist: z.array(atsChecklistItem).min(1),
    parseEvidence: z.array(parseEvidence).default([]),
    caveats: z.array(z.string()).default([]),

    // Per-page uniqueness (escapes doorway/near-dup, T3/E5)
    seo,
    faq: z.array(faqItem).default([]),
    bulletExamples: z.array(z.string()).default([]),
    sectionGuidance: z
      .array(z.object({ section: z.string(), guidance: z.string() }).strict())
      .default([]),
    related: z.array(z.string().regex(SLUG_RE)).default([]),

    created: z.coerce.date(),
    updated: z.coerce.date(),
  })
  .strict()
  .superRefine((t, ctx) => {
    if (t.status === "published") {
      if (t.linkStatus !== "available") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "published template must have linkStatus 'available'",
          path: ["linkStatus"],
        });
      }
      if (t.atsProfile !== "visual-pdf" && t.parseEvidence.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "non visual-pdf published template needs >=1 parseEvidence",
          path: ["parseEvidence"],
        });
      }
      if (t.related.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "published template needs >=2 related slugs",
          path: ["related"],
        });
      }
    }
  });

export type Template = z.infer<typeof templateSchema>;
