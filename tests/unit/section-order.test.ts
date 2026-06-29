import { describe, it, expect } from "vitest";
import {
  ORDERABLE_KEYS,
  DEFAULT_ORDER,
  defaultOrder,
  normalizeOrder,
  moveSection,
  type SectionKey,
} from "../../src/builder/section-order";

describe("defaultOrder", () => {
  it("follows the BOSS module sequence with Summary first", () => {
    expect(defaultOrder()).toEqual([
      "summary",
      "highlights",
      "jobTarget",
      "experience",
      "projects",
      "education",
    ]);
  });
  it("returns a fresh copy (not the frozen constant)", () => {
    expect(defaultOrder()).not.toBe(DEFAULT_ORDER);
  });
});

describe("normalizeOrder", () => {
  it("returns the default for empty/garbage input", () => {
    expect(normalizeOrder(null)).toEqual(defaultOrder());
    expect(normalizeOrder("nope")).toEqual(defaultOrder());
    expect(normalizeOrder([])).toEqual(defaultOrder());
  });
  it("drops unknown keys and de-duplicates", () => {
    const out = normalizeOrder(["projects", "evil", "projects", "summary"]);
    expect(out.slice(0, 2)).toEqual(["projects", "summary"]);
    expect(new Set(out).size).toBe(out.length);
  });
  it("appends missing keys in default position, always a full permutation", () => {
    const out = normalizeOrder(["education"]);
    expect(out[0]).toBe("education");
    expect([...out].sort()).toEqual([...ORDERABLE_KEYS].sort());
  });
});

describe("moveSection", () => {
  const base = defaultOrder();
  it("moves a key up", () => {
    expect(moveSection(base, "jobTarget", -1)).toEqual([
      "summary",
      "jobTarget",
      "highlights",
      "experience",
      "projects",
      "education",
    ]);
  });
  it("moves a key down", () => {
    expect(moveSection(base, "summary", 1)[0]).toBe("highlights");
  });
  it("is a no-op past the ends", () => {
    expect(moveSection(base, "summary", -1)).toEqual(base);
    expect(moveSection(base, "education", 1)).toEqual(base);
  });
  it("does not mutate the input", () => {
    const copy: SectionKey[] = [...base];
    moveSection(copy, "experience", -1);
    expect(copy).toEqual(base);
  });
});
