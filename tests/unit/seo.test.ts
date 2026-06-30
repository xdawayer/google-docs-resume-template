import { describe, it, expect } from "vitest";
import { assertSlugIntegrity, isListingIndexable, robotsContent } from "../../src/lib/seo-rules";
import {
  itemListSchema,
  breadcrumbSchema,
  faqSchema,
  serializeJsonLd,
  organizationSchema,
  websiteSchema,
  howToSchema,
  softwareAppSchema,
} from "../../src/lib/jsonld";
import { assertRoleCap, ROLE_CAP } from "../../src/lib/routes";

describe("seo-rules", () => {
  it("rejects reserved + duplicate slugs", () => {
    expect(() => assertSlugIntegrity(["category"])).toThrow(/reserved/);
    expect(() => assertSlugIntegrity(["go"])).toThrow(/reserved/);
    expect(() => assertSlugIntegrity(["a", "a"])).toThrow(/duplicate/);
    expect(() => assertSlugIntegrity(["a", "b"])).not.toThrow();
  });

  it("listing is indexable only with enough unique substance", () => {
    expect(isListingIndexable({ optedIn: true, itemCount: 6, introChars: 600, faqCount: 3 })).toBe(
      true,
    );
    expect(isListingIndexable({ optedIn: false, itemCount: 9, introChars: 999, faqCount: 9 })).toBe(
      false,
    );
    expect(isListingIndexable({ optedIn: true, itemCount: 5, introChars: 600, faqCount: 3 })).toBe(
      false,
    );
    expect(isListingIndexable({ optedIn: true, itemCount: 6, introChars: 599, faqCount: 3 })).toBe(
      false,
    );
    expect(isListingIndexable({ optedIn: true, itemCount: 6, introChars: 600, faqCount: 2 })).toBe(
      false,
    );
  });

  it("robotsContent maps indexability", () => {
    expect(robotsContent(true)).toBe("index,follow");
    expect(robotsContent(false)).toBe("noindex,follow");
  });
});

describe("jsonld", () => {
  it("ItemList numberOfItems matches the array (D11)", () => {
    const s = itemListSchema([
      { name: "A", url: "https://x/a/" },
      { name: "B", url: "https://x/b/" },
    ]);
    expect(s.numberOfItems).toBe(2);
    expect(s.itemListElement).toHaveLength(2);
    expect(s.itemListElement[0]?.position).toBe(1);
  });

  it("serializeJsonLd escapes < so it can't break out of <script>", () => {
    const out = serializeJsonLd({ a: "</script><b>" });
    expect(out).not.toContain("</script>");
    expect(out).toContain("\\u003c");
  });

  it("breadcrumb + faq build expected types", () => {
    expect(breadcrumbSchema([{ name: "Home", url: "https://x/" }])["@type"]).toBe("BreadcrumbList");
    expect(faqSchema([{ q: "Q", a: "A" }]).mainEntity[0]?.["@type"]).toBe("Question");
  });

  it("organization carries a stable @id and omits sameAs when empty (no fabrication)", () => {
    const o = organizationSchema({
      id: "https://x/#organization",
      name: "Brand",
      url: "https://x/",
      logo: "https://x/icon-512.png",
      description: "d",
    });
    expect(o["@type"]).toBe("Organization");
    expect(o["@id"]).toBe("https://x/#organization");
    expect("sameAs" in o).toBe(false);
    const withSocials = organizationSchema({
      id: "https://x/#organization",
      name: "Brand",
      url: "https://x/",
      logo: "https://x/icon-512.png",
      description: "d",
      sameAs: ["https://example.com/x"],
    });
    expect(withSocials.sameAs).toEqual(["https://example.com/x"]);
  });

  it("website references the publisher org by @id", () => {
    const w = websiteSchema({
      id: "https://x/#website",
      name: "Brand",
      url: "https://x/",
      description: "d",
      publisherId: "https://x/#organization",
    });
    expect(w["@type"]).toBe("WebSite");
    expect(w.publisher["@id"]).toBe("https://x/#organization");
    expect("potentialAction" in w).toBe(false); // no fabricated SearchAction
  });

  it("howTo numbers its steps from 1", () => {
    const h = howToSchema({
      name: "How to",
      description: "d",
      steps: [
        { name: "One", text: "first" },
        { name: "Two", text: "second" },
      ],
    });
    expect(h["@type"]).toBe("HowTo");
    expect(h.step).toHaveLength(2);
    expect(h.step[0]?.position).toBe(1);
    expect(h.step[1]?.["@type"]).toBe("HowToStep");
  });

  it("softwareApp states it is free, with no fabricated rating", () => {
    const s = softwareAppSchema({
      name: "Builder",
      url: "https://x/resume-builder/",
      description: "d",
      applicationCategory: "BusinessApplication",
    });
    expect(s["@type"]).toBe("WebApplication");
    expect(s.offers.price).toBe("0");
    expect(s.isAccessibleForFree).toBe(true);
    expect("aggregateRating" in s).toBe(false);
  });
});

describe("routes (T3 cap)", () => {
  it("throws over the role cap or under 500 traffic potential", () => {
    const many = Array.from({ length: ROLE_CAP + 1 }, (_, i) => ({
      role: `r${i}`,
      trafficPotential: 999,
    }));
    expect(() => assertRoleCap(many)).toThrow(/cap/);
    expect(() => assertRoleCap([{ role: "x", trafficPotential: 499 }])).toThrow(/500/);
    expect(() => assertRoleCap([{ role: "x", trafficPotential: 500 }])).not.toThrow();
  });
});
