import { describe, it, expect } from "vitest";
import { buildGoMap, type TemplateLite } from "../../src/lib/go-map";
import { getHealth, ctaState, type HealthMap } from "../../src/lib/health";

const realCopy = "https://docs.google.com/document/d/1AbCdEfGhIjKlMnOpQrStUvWxYz012345/copy";

describe("buildGoMap", () => {
  it("includes only published, non-placeholder templates and stamps health", () => {
    const templates: TemplateLite[] = [
      { slug: "a", copyUrl: realCopy, status: "published" },
      { slug: "b", copyUrl: realCopy, status: "draft" }, // dropped: draft
      {
        slug: "c",
        copyUrl: "https://docs.google.com/document/d/REPLACE_WITH_X/copy",
        status: "published",
      }, // dropped: placeholder
    ];
    const health: HealthMap = { a: { status: "available" } };
    const map = buildGoMap(templates, health);
    expect(Object.keys(map)).toEqual(["a"]);
    expect(map.a).toEqual({ copyUrl: realCopy, status: "available" });
  });

  it("defaults unknown health to unverified", () => {
    const map = buildGoMap([{ slug: "a", copyUrl: realCopy, status: "published" }], {});
    expect(map.a?.status).toBe("unverified");
  });
});

describe("health helpers", () => {
  it("getHealth falls back to unverified", () => {
    expect(getHealth({}, "missing")).toBe("unverified");
    expect(getHealth({ x: { status: "unavailable" } }, "x")).toBe("unavailable");
  });

  it("ctaState only renders copy when available; degrades otherwise", () => {
    expect(ctaState("available", false)).toBe("copy");
    expect(ctaState("unverified", true)).toBe("word");
    expect(ctaState("unverified", false)).toBe("disabled");
    expect(ctaState("unavailable", true)).toBe("word");
    expect(ctaState("unavailable", false)).toBe("disabled");
  });
});
