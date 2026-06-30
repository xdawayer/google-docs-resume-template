/**
 * JSON-LD builders (D11/E11). Pure. `serializeJsonLd` escapes `<` so a value can
 * never break out of the <script> tag. ItemList numberOfItems is derived from the
 * SAME array the cards render from (D11: keep schema in sync with the page).
 */
export function serializeJsonLd(obj: unknown): string {
  return JSON.stringify(obj).replace(/</g, "\\u003c");
}

export interface ListItem {
  name: string;
  url: string;
}

export function itemListSchema(items: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      url: it.url,
    })),
  };
}

export function breadcrumbSchema(crumbs: ListItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
}

export interface CreativeWorkInput {
  name: string;
  url: string;
  description: string;
  image?: string;
  dateModified?: string;
}

// No aggregateRating / no numeric score (T2): trust is a checklist, not a number.
export function creativeWorkSchema(t: CreativeWorkInput) {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: t.name,
    url: t.url,
    description: t.description,
    ...(t.image ? { image: t.image } : {}),
    ...(t.dateModified ? { dateModified: t.dateModified } : {}),
    isAccessibleForFree: true,
  };
}

export interface FaqEntry {
  q: string;
  a: string;
}

export function faqSchema(faq: FaqEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * Brand entity (GEO). An Organization with a stable @id is the anchor AI engines
 * use to attribute and cite the brand. `sameAs` is omitted unless we have REAL
 * profiles — never fabricate social links.
 */
export interface OrganizationInput {
  id: string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs?: string[];
}

export function organizationSchema(o: OrganizationInput) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": o.id,
    name: o.name,
    url: o.url,
    logo: o.logo,
    description: o.description,
    ...(o.sameAs && o.sameAs.length ? { sameAs: o.sameAs } : {}),
  };
}

/**
 * Site-level entity anchor (GEO). No SearchAction: the site has no on-site
 * search endpoint, and inventing one would be a false signal.
 */
export interface WebSiteInput {
  id: string;
  name: string;
  url: string;
  description: string;
  publisherId: string;
}

export function websiteSchema(w: WebSiteInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": w.id,
    name: w.name,
    url: w.url,
    description: w.description,
    inLanguage: "en",
    publisher: { "@id": w.publisherId },
  };
}

/**
 * Step-by-step schema for the "how it works" flow. Targets the high-intent
 * "how to make a resume on google docs" query as an extractable, citable answer.
 */
export interface HowToStep {
  name: string;
  text: string;
  url?: string;
}

export interface HowToInput {
  name: string;
  description: string;
  steps: HowToStep[];
  totalTime?: string;
}

export function howToSchema(h: HowToInput) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: h.name,
    description: h.description,
    ...(h.totalTime ? { totalTime: h.totalTime } : {}),
    step: h.steps.map((s, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: s.name,
      text: s.text,
      ...(s.url ? { url: s.url } : {}),
    })),
  };
}

/**
 * The resume builder is a free web app. No aggregateRating (T2: trust is never a
 * fabricated number); price is the real, verifiable fact — it is free.
 */
export interface SoftwareAppInput {
  name: string;
  url: string;
  description: string;
  applicationCategory: string;
  image?: string;
}

export function softwareAppSchema(s: SoftwareAppInput) {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: s.name,
    url: s.url,
    description: s.description,
    applicationCategory: s.applicationCategory,
    operatingSystem: "Web browser",
    browserRequirements: "Requires JavaScript",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    isAccessibleForFree: true,
    ...(s.image ? { image: s.image } : {}),
  };
}
