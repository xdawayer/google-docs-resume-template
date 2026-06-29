import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { templateSchema } from "../../src/content/schema";
import { validateTemplates, expectedCanonical } from "../../scripts/validate-content";
import type { RawTemplate } from "../../scripts/_shared";

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/templates");

function loadFixture(name: string): Record<string, unknown> {
  return matter(readFileSync(resolve(FIXTURES, `${name}.md`), "utf8")).data as Record<
    string,
    unknown
  >;
}

// ---- schema-level (gray-matter → Zod) ----
describe("templateSchema (real frontmatter path)", () => {
  it("accepts a complete valid template", () => {
    expect(templateSchema.safeParse(loadFixture("valid-ats-classic-one-page")).success).toBe(true);
  });

  it("rejects a placeholder REPLACE_WITH copy URL (E3/T-link)", () => {
    const r = templateSchema.safeParse(loadFixture("bad-placeholder-copy"));
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toMatch(/copyUrl|placeholder|copy/i);
  });

  it("rejects a forbidden numeric atsScore via .strict() (T2)", () => {
    const r = templateSchema.safeParse(loadFixture("bad-numeric-score"));
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toMatch(/unrecognized|atsScore|strict/i);
  });

  it("rejects published + scanner-first + zero parseEvidence (superRefine)", () => {
    const r = templateSchema.safeParse(loadFixture("bad-published-no-evidence"));
    expect(r.success).toBe(false);
    if (!r.success) expect(JSON.stringify(r.error.issues)).toMatch(/parseEvidence/i);
  });

  it("rejects snake_case keys (naming drift guard)", () => {
    const base = loadFixture("bad-numeric-score");
    delete (base as Record<string, unknown>).atsScore;
    (base as Record<string, unknown>).doc_id = base.docId;
    expect(templateSchema.safeParse(base).success).toBe(false);
  });
});

// ---- cross-template gate (validateTemplates, no fs) ----
function raw(slug: string, data: Record<string, unknown>, fileSlug = slug): RawTemplate {
  return {
    fileSlug,
    filepath: `/x/${fileSlug}.md`,
    relpath: `templates/${fileSlug}.md`,
    data,
    body: "x",
  };
}

function draft(slug: string, over: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    slug,
    name: slug,
    status: "draft",
    category: ["ats"],
    roles: ["general"],
    experienceLevel: ["any"],
    pageCount: 1,
    docId: "1AbCdEfGhIjKlMnOpQrStUvWxYz012345",
    copyUrl: "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/copy",
    linkStatus: "unverified",
    thumbnail: { src: `src/assets/templates/${slug}.png`, width: 1600, height: 2071, alt: "x" },
    atsProfile: "balanced",
    atsChecklist: [{ id: "a", label: "Single column", pass: true }],
    seo: {
      title: `${slug} resume template for google docs`,
      metaDescription: `A unique, sufficiently long meta description for ${slug} that comfortably clears the seventy character minimum required by the schema.`,
      canonical: expectedCanonical(slug),
    },
    related: [],
    created: "2026-06-20",
    updated: "2026-06-27",
    ...over,
  };
}

function published(slug: string, related: string[]): Record<string, unknown> {
  return draft(slug, {
    status: "published",
    linkStatus: "available",
    atsProfile: "visual-pdf",
    related,
  });
}

describe("validateTemplates (cross-template rules)", () => {
  it("passes for 3 valid drafts", () => {
    expect(
      validateTemplates([raw("a", draft("a")), raw("b", draft("b")), raw("c", draft("c"))]),
    ).toEqual([]);
  });

  it("flags slug != filename", () => {
    const errs = validateTemplates([raw("a", draft("a"), "different-file")]);
    expect(errs.join("\n")).toMatch(/frontmatter slug/);
  });

  it("flags duplicate slug", () => {
    const errs = validateTemplates([raw("dup", draft("dup")), raw("dup", draft("dup"), "dup2")]);
    expect(errs.join("\n")).toMatch(/duplicate slug/);
  });

  it("flags duplicate SEO title", () => {
    const errs = validateTemplates([
      raw("a", draft("a", { seo: { ...(draft("z").seo as object) } })),
      raw(
        "b",
        draft("b", { seo: { ...(draft("z").seo as object), canonical: expectedCanonical("b") } }),
      ),
    ]);
    expect(errs.join("\n")).toMatch(/duplicate SEO title/);
  });

  it("flags wrong canonical", () => {
    const errs = validateTemplates([
      raw(
        "a",
        draft("a", {
          seo: {
            title: "a t",
            metaDescription:
              "a sufficiently long unique meta description that clears the seventy character minimum easily here",
            canonical: "https://googledocsresumetemplate.com/wrong/",
          },
        }),
      ),
    ]);
    expect(errs.join("\n")).toMatch(/canonical/);
  });

  it("flags missing / self related", () => {
    expect(validateTemplates([raw("a", draft("a", { related: ["nope"] }))]).join("\n")).toMatch(
      /does not exist/,
    );
    expect(validateTemplates([raw("a", draft("a", { related: ["a"] }))]).join("\n")).toMatch(
      /itself/,
    );
  });

  it("flags published relating to non-published", () => {
    const errs = validateTemplates([
      raw("p", published("p", ["d", "e"])),
      raw("d", draft("d")),
      raw("e", draft("e")),
    ]);
    expect(errs.join("\n")).toMatch(/non-published/);
  });

  it("enforces the E12 gate (>3 published unless SCALE_OK)", () => {
    const four = ["p1", "p2", "p3", "p4"].map((s) =>
      raw(
        s,
        published(
          s,
          ["p1", "p2"]
            .filter((x) => x !== s)
            .concat("p3")
            .slice(0, 2),
        ),
      ),
    );
    expect(validateTemplates(four).join("\n")).toMatch(/E12 gate/);
    expect(validateTemplates(four, { scaleOk: true }).join("\n")).not.toMatch(/E12 gate/);
  });
});
