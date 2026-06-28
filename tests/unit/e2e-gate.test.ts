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

function draftRaw(slug: string): RawTemplate {
  return {
    fileSlug: `${slug}.draft`,
    filepath: `/x/${slug}.draft.md`,
    relpath: `x/${slug}.draft.md`,
    data: { slug, status: "draft" },
    body: "TODO",
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
    expect(r.ready).toBe(false);
  });

  it("reports a draft target as draft / not-ready (must be promoted first)", () => {
    const r = evaluateGate(
      ["ats-classic-one-page"],
      baseInputs([draftRaw("ats-classic-one-page")]),
    )[0]!;
    expect(r.state).toBe("draft");
    expect(r.ready).toBe(false);
    expect(checkStatus(r, "promoted")).toBe("fail");
  });

  it("a schema-valid published template still fails without screenshot / go / parse image", () => {
    const r = evaluateGate(
      ["valid-ats-classic-one-page"],
      baseInputs([rawFromFixture("valid-ats-classic-one-page")]),
    )[0]!;
    expect(r.state).toBe("published");
    expect(checkStatus(r, "promoted")).toBe("pass");
    expect(checkStatus(r, "schema")).toBe("pass");
    expect(checkStatus(r, "screenshot")).toBe("fail");
    expect(checkStatus(r, "go-resolves")).toBe("fail");
    expect(r.ready).toBe(false);
  });

  it("passes every data-layer check once all artifacts are present (manual checks stay pending)", () => {
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

    expect(r.checks.filter((c) => c.status === "fail")).toEqual([]);
    expect(r.ready).toBe(true);
    expect(r.checks.some((c) => c.status === "manual")).toBe(true);
  });
});
