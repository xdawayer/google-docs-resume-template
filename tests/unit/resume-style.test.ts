import { describe, it, expect } from "vitest";
import {
  defaultStyle,
  sanitizeStyle,
  styleVarString,
  fontStack,
  SCALE_MIN,
  SCALE_MAX,
  LINE_MAX,
} from "../../src/builder/resume-style";

describe("defaultStyle", () => {
  it("is template-font, no scale, no accent", () => {
    expect(defaultStyle()).toEqual({ font: "auto", scale: 1, lineScale: 1, accent: "" });
  });
});

describe("sanitizeStyle (trust boundary)", () => {
  it("empty input → default", () => {
    expect(sanitizeStyle({})).toEqual(defaultStyle());
  });

  it("non-object input → default (never throws)", () => {
    expect(sanitizeStyle("garbage")).toEqual(defaultStyle());
    expect(sanitizeStyle(null)).toEqual(defaultStyle());
    expect(sanitizeStyle(42)).toEqual(defaultStyle());
  });

  it("keeps a known font, rejects an unknown one", () => {
    expect(sanitizeStyle({ font: "serif" }).font).toBe("serif");
    expect(sanitizeStyle({ font: "comic-sans" }).font).toBe("auto");
  });

  it("clamps scale into range", () => {
    expect(sanitizeStyle({ scale: 99 }).scale).toBe(SCALE_MAX);
    expect(sanitizeStyle({ scale: 0.1 }).scale).toBe(SCALE_MIN);
    expect(sanitizeStyle({ scale: 1.1 }).scale).toBe(1.1);
  });

  it("clamps lineScale and falls back on garbage", () => {
    expect(sanitizeStyle({ lineScale: 9 }).lineScale).toBe(LINE_MAX);
    expect(sanitizeStyle({ lineScale: "abc" }).lineScale).toBe(1);
  });

  it("accepts a hex accent (lowercased), rejects anything else", () => {
    expect(sanitizeStyle({ accent: "#ABCDEF" }).accent).toBe("#abcdef");
    expect(sanitizeStyle({ accent: "javascript:alert(1)" }).accent).toBe("");
    expect(sanitizeStyle({ accent: "red" }).accent).toBe("");
    expect(sanitizeStyle({ accent: "#xyzxyz" }).accent).toBe("");
    expect(sanitizeStyle({ accent: "#fff" }).accent).toBe(""); // 3-digit not allowed
  });
});

describe("styleVarString", () => {
  it("emits NOTHING at full default (zero visual regression)", () => {
    expect(styleVarString(defaultStyle())).toBe("");
  });

  it("emits only the non-default knobs", () => {
    const s = sanitizeStyle({ font: "serif", scale: 1.1, lineScale: 1, accent: "#1a4fa0" });
    const css = styleVarString(s);
    expect(css).toContain("--rb-font:");
    expect(css).toContain("--rb-scale:1.1");
    expect(css).toContain("--rb-accent:#1a4fa0");
    expect(css).not.toContain("--rb-line-scale"); // lineScale was default 1
  });

  it("never emits a font var for the template-default font", () => {
    expect(styleVarString(sanitizeStyle({ font: "auto", accent: "#0f766e" }))).not.toContain(
      "--rb-font",
    );
  });

  it("only ever contains a hex accent value (no raw user string)", () => {
    expect(styleVarString(sanitizeStyle({ accent: "url(x)" }))).toBe("");
  });
});

describe("fontStack", () => {
  it("returns a stack for a real font and empty for auto/unknown", () => {
    expect(fontStack("serif")).toMatch(/serif/);
    expect(fontStack("auto")).toBe("");
    expect(fontStack("nope")).toBe("");
  });
});
