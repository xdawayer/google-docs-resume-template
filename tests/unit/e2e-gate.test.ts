import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { evaluateGate, type GateInputs } from "../../scripts/e2e-gate";
import type { RawTemplate } from "../../scripts/_shared";

const FIXTURES = resolve(dirname(fileURLToPath(import.meta.url)), "../fixtures/templates");

function rawFromFixture(name: string): RawTemplate {
  const parsed = matter(readFileSync(resolve(FIXTURES, `${name}.md`), "utf8"));
  return {
    fileSlug: name,
    filepath: resolve(FIXTURES, `${name}.md`),
    relpath: `fixtures/${name}.md`,
    data: parsed.data as Record<string, unknown>,
    body: parsed.content,
  };
}

function bareDraft(slug: string): RawTemplate {
  return {
    fileSlug: `${slug}.draft`,
    filepath: `/x/${slug}.draft.md`,
    relpath: `x/${slug}.draft.md`,
    data: { slug, status: "draft" },
    body: "TODO",
  };
}

function contentCompleteDraft(slug: string): RawTemplate {
  return {
    fileSlug: `${slug}.draft`,
    filepath: `/x/${slug}.draft.md`,
    relpath: `x/${slug}.draft.md`,
    data: {
      slug,
      status: "draft",
      atsProfile: "balanced",
      docId: "REPLACE_WITH_DOC_ID",
      copyUrl: "https://docs.google.com/document/d/REPLACE_WITH_DOC_ID/copy",
      linkStatus: "unverified",
      thumbnail: { src: "src/assets/x.png", alt: "A real alt description of the template" },
      seo: { title: "A Unique Title Under Seventy Chars", metaDescription: "x".repeat(100) },
      atsChecklist: [{ id: "a", label: "Single column", pass: true }],
      bulletExamples: ["one outcome", "two outcome", "three outcome"],
      faq: [
        { q: "a", a: "1" },
        { q: "b", a: "2" },
        { q: "c", a: "3" },
      ],
      sectionGuidance: [{ section: "Experience", guidance: "Lead with outcomes." }],
      related: ["other-one", "other-two"],
    },
    body: "word ".repeat(60),
  };
}

const baseInputs = (raws: RawTemplate[]): GateInputs => ({
  raws,
  goMap: {},
  lock: {},
  assetExists: () => false,
});

const checkStatus = (
  r: { checks: { id: string; status: string }[] },
  id: string,
): string | undefined => r.checks.find((c) => c.id === id)?.status;

describe("evaluateGate", () => {
  it("reports a missing target as missing / not-ready", () => {
    const r = evaluateGate(["nope"], baseInputs([]))[0]!;
    expect(r.state).toBe("missing");
    expect(r.contentReady).toBe(false);
    expect(r.ready).toBe(false);
  });

  it("a bare draft is draft, not content-ready, with promoted pending", () => {
    const r = evaluateGate(
      ["ats-classic-one-page"],
      baseInputs([bareDraft("ats-classic-one-page")]),
    )[0]!;
    expect(r.state).toBe("draft");
    expect(r.contentReady).toBe(false);
    expect(r.ready).toBe(false);
    expect(checkStatus(r, "promoted")).toBe("pending");
  });

  it("a content-complete draft is content-ready but not release-ready (externals pending)", () => {
    const r = evaluateGate(
      ["ats-classic-one-page"],
      baseInputs([contentCompleteDraft("ats-classic-one-page")]),
    )[0]!;
    expect(r.state).toBe("draft");
    expect(r.contentReady).toBe(true);
    expect(r.ready).toBe(false);
    expect(checkStatus(r, "seo-title")).toBe("pass");
    expect(checkStatus(r, "bullets")).toBe("pass");
    expect(checkStatus(r, "promoted")).toBe("pending");
    expect(checkStatus(r, "doc")).toBe("pending");
    expect(checkStatus(r, "link-available")).toBe("pending");
  });

  it("a promoted template with thin content fails the content checks", () => {
    const r = evaluateGate(
      ["valid-ats-classic-one-page"],
      baseInputs([rawFromFixture("valid-ats-classic-one-page")]),
    )[0]!;
    expect(r.state).toBe("published");
    expect(checkStatus(r, "promoted")).toBe("pass");
    expect(checkStatus(r, "bullets")).toBe("fail"); // fixture has 2
    expect(checkStatus(r, "faq")).toBe("fail"); // fixture has 1
    expect(r.contentReady).toBe(false);
    expect(r.ready).toBe(false);
  });

  it("passes every check once content + external artifacts are all present", () => {
    const raw = rawFromFixture("valid-ats-classic-one-page");
    raw.data = {
      ...raw.data,
      revisionId: "rev-1",
      parseEvidence: [{ tool: "plain-text", testedAt: "2026-06-26", image: "evidence.png" }],
      faq: [
        { q: "a", a: "1" },
        { q: "b", a: "2" },
        { q: "c", a: "3" },
      ],
      bulletExamples: ["one outcome", "two outcome", "three outcome"],
      sectionGuidance: [{ section: "Experience", guidance: "Lead with outcomes." }],
    };
    raw.body = "word ".repeat(60);

    const r = evaluateGate(["valid-ats-classic-one-page"], {
      raws: [raw],
      goMap: { "valid-ats-classic-one-page": { copyUrl: "https://x/copy", status: "available" } },
      lock: { "valid-ats-classic-one-page": { hash: "abc123" } },
      assetExists: () => true,
    })[0]!;

    expect(r.checks.filter((c) => c.status === "fail" || c.status === "pending")).toEqual([]);
    expect(r.contentReady).toBe(true);
    expect(r.ready).toBe(true);
    expect(r.checks.some((c) => c.status === "manual")).toBe(true);
  });
});
