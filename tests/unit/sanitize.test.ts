import { describe, it, expect } from "vitest";
import { isSafeUrl, normalizeUrl, sanitizeResume } from "../../src/builder/resume-core";
import { resumeSchema } from "../../src/builder/resume-schema";

describe("isSafeUrl", () => {
  it("accepts https/mailto/tel and bare domains", () => {
    expect(isSafeUrl("https://github.com/x")).toBe(true);
    expect(isSafeUrl("mailto:a@b.com")).toBe(true);
    expect(isSafeUrl("linkedin.com/in/x")).toBe(true);
  });
  it("rejects dangerous schemes incl. leading whitespace", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("  javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>")).toBe(false);
    expect(isSafeUrl("blob:https://x")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });
});

describe("normalizeUrl", () => {
  it("normalizes bare domain to https, drops unsafe", () => {
    expect(normalizeUrl("github.com/x")).toBe("https://github.com/x");
    expect(normalizeUrl("javascript:alert(1)")).toBe("");
  });
});

describe("sanitizeResume", () => {
  const base = resumeSchema.parse({});

  it("drops a javascript: link url, keeps the label", () => {
    const out = sanitizeResume({
      ...base,
      basics: { ...base.basics, links: [{ label: "Portfolio", url: "javascript:alert(1)" }] },
    });
    expect(out.basics.links[0]!).toEqual({ label: "Portfolio", url: "" });
  });

  it("normalizes a bare-domain link to https", () => {
    const out = sanitizeResume({
      ...base,
      basics: { ...base.basics, links: [{ label: "GH", url: "github.com/x" }] },
    });
    expect(out.basics.links[0]!.url).toBe("https://github.com/x");
  });

  it("rejects svg + oversized data photo, keeps small raster + https", () => {
    const svg = "data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=";
    const huge = "data:image/png;base64," + "A".repeat(3_000_000);
    const ok = "data:image/png;base64,iVBORw0KGgo=";
    expect(sanitizeResume({ ...base, basics: { ...base.basics, photo: svg } }).basics.photo).toBe(
      "",
    );
    expect(sanitizeResume({ ...base, basics: { ...base.basics, photo: huge } }).basics.photo).toBe(
      "",
    );
    expect(sanitizeResume({ ...base, basics: { ...base.basics, photo: ok } }).basics.photo).toBe(
      ok,
    );
    expect(
      sanitizeResume({ ...base, basics: { ...base.basics, photo: "https://x/p.png" } }).basics
        .photo,
    ).toBe("https://x/p.png");
  });

  it("strips control chars but keeps newlines, and stays schema-valid", () => {
    const nul = String.fromCharCode(0);
    const out = sanitizeResume({ ...base, summary: `hi${nul}bye\nline2` });
    expect(() => resumeSchema.parse(out)).not.toThrow();
    expect(out.summary).toBe("hibye\nline2");
  });

  it("rejects a URL with embedded CR/LF (credential-confusion)", () => {
    expect(isSafeUrl("https://example.com\n@evil.com")).toBe(false);
    expect(normalizeUrl("https://example.com\t@evil.com")).toBe("");
  });

  it("strips bidi-override marks (visual spoofing)", () => {
    const rlo = String.fromCharCode(0x202e);
    expect(sanitizeResume({ ...base, summary: `safe${rlo}txet` }).summary).toBe("safetxet");
  });

  it("cleans nested fields and preserves tab/CR", () => {
    const bel = String.fromCharCode(7);
    const out = sanitizeResume({
      ...base,
      experience: [
        { title: `a${bel}b`, company: "", location: "", start: "", end: "", bullets: [`x${bel}y`] },
      ],
      skills: [{ category: `c${bel}`, items: "Go\tRust\r" }],
    });
    expect(out.experience[0]!.title).toBe("ab");
    expect(out.experience[0]!.bullets[0]).toBe("xy");
    expect(out.skills[0]!.category).toBe("c");
    expect(out.skills[0]!.items).toBe("Go\tRust\r"); // tab + CR kept
  });
});
